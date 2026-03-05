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
  if (typeof v === 'string') return bold(escapeHtml(v));
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
    for (const arg of args) {
      const translated = resolveOperand(arg, depth);
      if (translated === null) return null;
      parts.push(translated);
    }
    if (parts.length === 0) return null;
    if (operator === 'and') {
      return parts.join(' et ');
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
    const inner = resolveOperand(args[0], depth);
    if (inner === null) return null;
    return `non (${inner})`;
  }
  if (operator === '!') {
    const inner = resolveOperand(args, depth);
    if (inner === null) return null;
    return `non (${inner})`;
  }

  // Double negation: !!
  if (operator === '!!' && Array.isArray(args) && args.length === 1) {
    const inner = resolveOperand(args[0], depth);
    if (inner === null) return null;
    return `booléen(${inner})`;
  }

  // if / ternary
  if (operator === 'if' && Array.isArray(args) && args.length >= 3) {
    const condition = resolveOperand(args[0], depth);
    const thenBranch = resolveOperand(args[1], depth);
    const elseBranch = resolveOperand(args[2], depth);
    if (condition === null || thenBranch === null || elseBranch === null) return null;
    return `Si ${condition} alors ${thenBranch} sinon ${elseBranch}`;
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

  // Arithmetic
  if (operator === '+' && Array.isArray(args)) {
    const parts = args.map((a) => resolveOperand(a, depth));
    if (parts.some((p) => p === null)) return null;
    return parts.join(' + ');
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
    return `filtrer ${arr}`;
  }
  if (operator === 'all' && Array.isArray(args) && args.length === 2) {
    const arr = resolveOperand(args[0], depth);
    if (arr === null) return null;
    return `tous les éléments de ${arr} satisfont la condition`;
  }
  if (operator === 'some' && Array.isArray(args) && args.length === 2) {
    const arr = resolveOperand(args[0], depth);
    if (arr === null) return null;
    return `au moins un élément de ${arr} satisfait la condition`;
  }
  if (operator === 'none' && Array.isArray(args) && args.length === 2) {
    const arr = resolveOperand(args[0], depth);
    if (arr === null) return null;
    return `aucun élément de ${arr} ne satisfait la condition`;
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
