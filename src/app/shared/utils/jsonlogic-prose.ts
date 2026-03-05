/**
 * Translates a JSONLogic rule string into human-readable French prose.
 * Returns null if the input is invalid, un-translatable, or too deeply nested.
 */

const OPERATOR_NAMES: Record<string, string> = {
  '==': 'contient',
  '===': '=',
  '!=': 'ne contient pas',
  '!==': '≠',
  '<': '&lt;',
  '<=': '≤',
  '>': '&gt;',
  '>=': '≥',
};

const MAX_DEPTH = 8;

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeQuotes(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function bold(s: string): string {
  return `<strong>${s}</strong>`;
}

function formatValue(val: unknown): string {
  if (typeof val === 'string') return `'${escapeQuotes(escapeHtml(val))}'`;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (val === null) return 'null';
  return escapeHtml(String(val));
}

function resolveVar(node: Record<string, unknown>): string | null {
  const v = node['var'];
  if (typeof v === 'string') return v === '' ? bold('(données)') : bold(escapeHtml(v));
  if (typeof v === 'number') return bold(String(v));
  // Array syntax: {"var": ["name", default]}
  if (Array.isArray(v) && v.length >= 1) {
    const name = v[0];
    if (typeof name === 'string') return bold(escapeHtml(name));
    if (typeof name === 'number') return bold(String(name));
  }
  return null;
}

function resolveOperand(node: unknown, depth: number, topLevel = false): string | null {
  if (depth > MAX_DEPTH) return null;

  if (node === null || node === undefined) return bold('null');
  if (typeof node === 'string') return bold(`'${escapeQuotes(escapeHtml(node))}'`);
  if (typeof node === 'number' || typeof node === 'boolean') return bold(String(node));

  if (Array.isArray(node)) {
    const items = node.map((item) => formatValue(item));
    return bold(`[${items.join(', ')}]`);
  }

  if (typeof node === 'object') {
    const obj = node as Record<string, unknown>;
    if ('var' in obj) {
      return resolveVar(obj);
    }
    // Nested operation — translate recursively
    return translateNode(obj, depth + 1, topLevel);
  }

  return null;
}

const INVERT_OP: Record<string, string> = {
  '==': '!=', '!=': '==',
  '===': '!==', '!==': '===',
  '<': '>=', '>=': '<',
  '>': '<=', '<=': '>',
};

/** Try to produce a natural French negation instead of "non (...)". */
function tryNegate(innerNode: unknown, depth: number, topLevel: boolean): string | null {
  if (!innerNode || typeof innerNode !== 'object' || Array.isArray(innerNode)) return null;
  const obj = innerNode as Record<string, unknown>;
  const keys = Object.keys(obj);
  if (keys.length !== 1) return null;
  const op = keys[0];
  const innerArgs = obj[op];

  // Invert comparison: !(x == y) → x != y
  if (op in INVERT_OP && Array.isArray(innerArgs) && innerArgs.length === 2) {
    return translateNode({ [INVERT_OP[op]]: innerArgs }, depth, topLevel);
  }

  // !missing → "aucun champ manquant parmi [...]"
  if (op === 'missing' && Array.isArray(innerArgs)) {
    return `aucun champ manquant parmi ${bold(`[${innerArgs.map(formatValue).join(', ')}]`)}`;
  }

  // !some → none phrasing
  if (op === 'some' && Array.isArray(innerArgs) && innerArgs.length === 2) {
    const arr = resolveOperand(innerArgs[0], depth);
    if (arr === null) return null;
    const cond = resolveOperand(innerArgs[1], depth + 1);
    return cond
      ? `aucun élément de ${arr} ne satisfait : ${cond}`
      : `aucun élément de ${arr} ne satisfait la condition`;
  }

  // !var → "x est absent"
  if (op === 'var') {
    const v = resolveVar(obj);
    if (v) return `${v} est absent`;
  }

  return null;
}

function translateNode(node: unknown, depth: number, topLevel = false): string | null {
  if (depth > MAX_DEPTH) return null;
  if (!node || typeof node !== 'object' || Array.isArray(node)) return null;

  const obj = node as Record<string, unknown>;
  const keys = Object.keys(obj);
  if (keys.length !== 1) return null;

  const operator = keys[0];
  const args = obj[operator];

  // Variable reference
  if (operator === 'var') {
    return resolveVar(obj);
  }

  // Comparison operators
  if (operator in OPERATOR_NAMES && Array.isArray(args) && args.length === 2) {
    const left = resolveOperand(args[0], depth);
    const right = resolveOperand(args[1], depth);
    if (left === null || right === null) return null;
    return `${left} ${OPERATOR_NAMES[operator]} ${right}`;
  }

  // Between: {"<": [a, var, b]} or {"<=": [a, var, b]}
  if ((operator === '<' || operator === '<=') && Array.isArray(args) && args.length === 3) {
    const low = resolveOperand(args[0], depth);
    const mid = resolveOperand(args[1], depth);
    const high = resolveOperand(args[2], depth);
    if (low === null || mid === null || high === null) return null;
    const op = OPERATOR_NAMES[operator];
    return `${low} ${op} ${mid} ${op} ${high}`;
  }

  // Logic: and / or
  if ((operator === 'and' || operator === 'or') && Array.isArray(args)) {
    const parts: string[] = [];
    // When top-level OR renders bullets, tell direct children they don't need outer parens
    const childTopLevel = operator === 'or' && topLevel;
    for (const arg of args) {
      const translated = resolveOperand(arg, depth, childTopLevel);
      if (translated === null) return null;
      parts.push(translated);
    }
    if (parts.length === 0) return null;
    if (operator === 'and') {
      const result = parts.join(' et ');
      return (depth > 0 && parts.length > 1 && !topLevel) ? `(${result})` : result;
    }
    // OR: bullet format only at top level; inline with parentheses when nested
    if (topLevel && parts.length > 1) {
      return parts.map((p) => `• ${p}`).join('\n');
    }
    if (parts.length === 1) return parts[0];
    return `(${parts.join(' ou ')})`;
  }

  // Negation: !
  if (operator === '!' && Array.isArray(args) && args.length === 1) {
    const negated = tryNegate(args[0], depth, topLevel);
    if (negated) return negated;
    const inner = resolveOperand(args[0], depth);
    if (inner === null) return null;
    return `non (${inner})`;
  }
  if (operator === '!') {
    const negated = tryNegate(args, depth, topLevel);
    if (negated) return negated;
    const inner = resolveOperand(args, depth);
    if (inner === null) return null;
    return `non (${inner})`;
  }

  // Double negation: !!
  if (operator === '!!') {
    const target = Array.isArray(args) && args.length === 1 ? args[0] : args;
    const inner = resolveOperand(target, depth);
    if (inner === null) return null;
    return `booléen(${inner})`;
  }

  // if / ternary — supports chained if/else-if: [cond1, val1, cond2, val2, ..., default]
  if (operator === 'if' && Array.isArray(args) && args.length >= 3) {
    const chunks: string[] = [];
    let i = 0;
    while (i + 1 < args.length) {
      const cond = resolveOperand(args[i], depth);
      const val = resolveOperand(args[i + 1], depth);
      if (cond === null || val === null) return null;
      const prefix = chunks.length === 0 ? 'Si' : 'sinon si';
      chunks.push(`${prefix} ${cond} alors ${val}`);
      i += 2;
    }
    // Remaining single arg = default else
    if (i < args.length) {
      const fallback = resolveOperand(args[i], depth);
      if (fallback === null) return null;
      chunks.push(`sinon ${fallback}`);
    }
    return chunks.join(' ');
  }

  // in operator
  if (operator === 'in' && Array.isArray(args) && args.length === 2) {
    const left = resolveOperand(args[0], depth);
    const right = resolveOperand(args[1], depth);
    if (left === null || right === null) return null;
    return `${left} fait partie de ${right}`;
  }

  // missing
  if (operator === 'missing' && Array.isArray(args)) {
    return `champs manquants parmi ${bold(`[${args.map(formatValue).join(', ')}]`)}`;
  }

  // missing_some: {"missing_some": [min, [fields]]}
  if (operator === 'missing_some' && Array.isArray(args) && args.length === 2) {
    const min = args[0];
    const fields = args[1];
    if (typeof min === 'number' && Array.isArray(fields)) {
      return `au moins ${bold(String(min))} champ(s) manquant(s) parmi ${bold(`[${fields.map(formatValue).join(', ')}]`)}`;
    }
  }

  // Arithmetic
  if (operator === '+' && Array.isArray(args)) {
    if (args.length === 0) return null;
    const parts = args.map((a) => resolveOperand(a, depth));
    if (parts.some((p) => p === null)) return null;
    return parts.join(' + ');
  }
  if (operator === '-' && Array.isArray(args) && args.length === 1) {
    const operand = resolveOperand(args[0], depth);
    if (operand === null) return null;
    return `-${operand}`;
  }
  if (operator === '-' && Array.isArray(args) && args.length === 2) {
    const left = resolveOperand(args[0], depth);
    const right = resolveOperand(args[1], depth);
    if (left === null || right === null) return null;
    return `${left} - ${right}`;
  }
  if (operator === '*' && Array.isArray(args)) {
    const parts = args.map((a) => resolveOperand(a, depth));
    if (parts.some((p) => p === null)) return null;
    return parts.join(' × ');
  }
  if (operator === '/' && Array.isArray(args) && args.length === 2) {
    const left = resolveOperand(args[0], depth);
    const right = resolveOperand(args[1], depth);
    if (left === null || right === null) return null;
    return `${left} ÷ ${right}`;
  }
  if (operator === '%' && Array.isArray(args) && args.length === 2) {
    const left = resolveOperand(args[0], depth);
    const right = resolveOperand(args[1], depth);
    if (left === null || right === null) return null;
    return `${left} modulo ${right}`;
  }

  // min / max
  if (operator === 'min' && Array.isArray(args)) {
    const parts = args.map((a) => resolveOperand(a, depth));
    if (parts.some((p) => p === null)) return null;
    return `minimum de (${parts.join(', ')})`;
  }
  if (operator === 'max' && Array.isArray(args)) {
    const parts = args.map((a) => resolveOperand(a, depth));
    if (parts.some((p) => p === null)) return null;
    return `maximum de (${parts.join(', ')})`;
  }

  // cat (string concatenation)
  if (operator === 'cat' && Array.isArray(args)) {
    if (args.length === 0) return null;
    const parts = args.map((a) => resolveOperand(a, depth));
    if (parts.some((p) => p === null)) return null;
    return parts.join(' + ');
  }

  // Array operations: map, filter, reduce, all, some, none
  if (operator === 'map' && Array.isArray(args) && args.length === 2) {
    const arr = resolveOperand(args[0], depth);
    if (arr === null) return null;
    return `transformer chaque élément de ${arr}`;
  }
  if (operator === 'filter' && Array.isArray(args) && args.length === 2) {
    const arr = resolveOperand(args[0], depth);
    if (arr === null) return null;
    const cond = resolveOperand(args[1], depth + 1);
    return cond ? `filtrer ${arr} où ${cond}` : `filtrer ${arr}`;
  }
  if (operator === 'all' && Array.isArray(args) && args.length === 2) {
    const arr = resolveOperand(args[0], depth);
    if (arr === null) return null;
    const cond = resolveOperand(args[1], depth + 1);
    return cond
      ? `tous les éléments de ${arr} satisfont : ${cond}`
      : `tous les éléments de ${arr} satisfont la condition`;
  }
  if (operator === 'some' && Array.isArray(args) && args.length === 2) {
    const arr = resolveOperand(args[0], depth);
    if (arr === null) return null;
    const cond = resolveOperand(args[1], depth + 1);
    return cond
      ? `au moins un élément de ${arr} satisfait : ${cond}`
      : `au moins un élément de ${arr} satisfait la condition`;
  }
  if (operator === 'none' && Array.isArray(args) && args.length === 2) {
    const arr = resolveOperand(args[0], depth);
    if (arr === null) return null;
    const cond = resolveOperand(args[1], depth + 1);
    return cond
      ? `aucun élément de ${arr} ne satisfait : ${cond}`
      : `aucun élément de ${arr} ne satisfait la condition`;
  }

  return null;
}

export function translateJsonLogicToProse(jsonString: string): string | null {
  if (!jsonString || jsonString === 'true' || jsonString === 'false') return null;
  try {
    const parsed = JSON.parse(jsonString);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;
    return translateNode(parsed, 0, true);
  } catch {
    return null;
  }
}
