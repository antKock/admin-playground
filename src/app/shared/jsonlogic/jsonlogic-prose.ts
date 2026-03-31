/**
 * Translates a JSONLogic rule string into human-readable French prose.
 * Returns null if the input is invalid, un-translatable, or too deeply nested.
 *
 * Tokens are wrapped in semantic spans for syntax coloring:
 *   - tk-var: variables (purple)
 *   - tk-kw: keywords/operators (gray)
 *   - tk-val: values (green)
 *   - tk-pfx: prefix text (gray italic)
 *
 * @see docs/jsonlogic-prose-architecture.md
 */

export type ProseMode = 'condition' | 'value';

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

function wrapVar(s: string): string {
  return `<span class="tk-var">${s}</span>`;
}

function wrapVal(s: string): string {
  return `<span class="tk-val">${s}</span>`;
}

function wrapKw(s: string): string {
  return `<span class="tk-kw">${s}</span>`;
}

function formatValue(val: unknown): string {
  if (typeof val === 'string') return `'${escapeQuotes(escapeHtml(val))}'`;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (val === null) return 'null';
  return escapeHtml(String(val));
}

function resolveVar(node: Record<string, unknown>): string | null {
  const v = node['var'];
  if (typeof v === 'string') return v === '' ? wrapVar('(données)') : wrapVar(escapeHtml(v));
  if (typeof v === 'number') return wrapVar(String(v));
  // Array syntax: {"var": ["name", default]}
  if (Array.isArray(v) && v.length >= 1) {
    const name = v[0];
    if (typeof name === 'string') return wrapVar(escapeHtml(name));
    if (typeof name === 'number') return wrapVar(String(name));
  }
  return null;
}

function resolveOperand(node: unknown, depth: number, topLevel = false, mode: ProseMode = 'condition'): string | null {
  if (depth > MAX_DEPTH) return null;

  if (node === null || node === undefined) return wrapVal('null');
  if (typeof node === 'string') return wrapVal(`'${escapeQuotes(escapeHtml(node))}'`);
  if (typeof node === 'number' || typeof node === 'boolean') return wrapVal(String(node));

  if (Array.isArray(node)) {
    const items = node.map((item) => formatValue(item));
    return wrapVal(`[${items.join(', ')}]`);
  }

  if (typeof node === 'object') {
    const obj = node as Record<string, unknown>;
    if ('var' in obj) {
      return resolveVar(obj);
    }
    // Nested operation — translate recursively
    return translateNode(obj, depth + 1, topLevel, mode);
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
    return `${wrapKw('aucun champ manquant parmi')} ${wrapVal(`[${innerArgs.map(formatValue).join(', ')}]`)}`;
  }

  // !some → none phrasing
  if (op === 'some' && Array.isArray(innerArgs) && innerArgs.length === 2) {
    const arr = resolveOperand(innerArgs[0], depth);
    if (arr === null) return null;
    const cond = resolveOperand(innerArgs[1], depth + 1);
    return cond
      ? `${wrapKw('aucun élément de')} ${arr} ${wrapKw('ne satisfait :')} ${cond}`
      : `${wrapKw('aucun élément de')} ${arr} ${wrapKw('ne satisfait la condition')}`;
  }

  // !var → "x est absent"
  if (op === 'var') {
    const v = resolveVar(obj);
    if (v) return `${v} ${wrapKw('est absent')}`;
  }

  return null;
}

function translateNode(node: unknown, depth: number, topLevel = false, mode: ProseMode = 'condition'): string | null {
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
    return `${left} ${wrapKw(OPERATOR_NAMES[operator])} ${right}`;
  }

  // Between: {"<": [a, var, b]} or {"<=": [a, var, b]}
  if ((operator === '<' || operator === '<=') && Array.isArray(args) && args.length === 3) {
    const low = resolveOperand(args[0], depth);
    const mid = resolveOperand(args[1], depth);
    const high = resolveOperand(args[2], depth);
    if (low === null || mid === null || high === null) return null;
    const op = wrapKw(OPERATOR_NAMES[operator]);
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
      const result = parts.join(` ${wrapKw('et')} `);
      return (depth > 0 && parts.length > 1 && !topLevel) ? `(${result})` : result;
    }
    // OR: bullet format only at top level when children are complex conditions;
    // inline with parentheses for simple operands (variable truthiness checks)
    if (topLevel && parts.length > 1) {
      if (!isAllSimpleOr(args as unknown[])) {
        return parts.map((p) => `• ${p}`).join('\n');
      }
    }
    if (parts.length === 1) return parts[0];
    return `(${parts.join(` ${wrapKw('ou')} `)})`;
  }

  // Negation: !
  if (operator === '!' && Array.isArray(args) && args.length === 1) {
    const negated = tryNegate(args[0], depth, topLevel);
    if (negated) return negated;
    const inner = resolveOperand(args[0], depth);
    if (inner === null) return null;
    return `${wrapKw('non')} (${inner})`;
  }
  if (operator === '!') {
    const negated = tryNegate(args, depth, topLevel);
    if (negated) return negated;
    const inner = resolveOperand(args, depth);
    if (inner === null) return null;
    return `${wrapKw('non')} (${inner})`;
  }

  // Double negation: !!
  if (operator === '!!') {
    const target = Array.isArray(args) && args.length === 1 ? args[0] : args;
    const inner = resolveOperand(target, depth);
    if (inner === null) return null;
    return `${wrapKw('booléen')}(${inner})`;
  }

  // if / ternary — supports chained if/else-if: [cond1, val1, cond2, val2, ..., default]
  if (operator === 'if' && Array.isArray(args) && args.length >= 3) {
    const chunks: string[] = [];
    let i = 0;
    const useValueBullets = mode === 'value' && topLevel;
    while (i + 1 < args.length) {
      const cond = resolveOperand(args[i], depth);
      const val = resolveOperand(args[i + 1], depth);
      if (cond === null || val === null) return null;
      if (useValueBullets) {
        chunks.push(`• ${wrapKw('Si')} ${cond} ${wrapKw('⇒')} ${val}`);
      } else {
        const prefix = chunks.length === 0 ? wrapKw('Si') : wrapKw('sinon si');
        chunks.push(`${prefix} ${cond} ${wrapKw('alors')} ${val}`);
      }
      i += 2;
    }
    // Remaining single arg = default else
    if (i < args.length) {
      const fallback = resolveOperand(args[i], depth);
      if (fallback === null) return null;
      chunks.push(useValueBullets ? `• ${wrapKw('Sinon')} ${wrapKw('⇒')} ${fallback}` : `${wrapKw('sinon')} ${fallback}`);
    }
    return useValueBullets ? chunks.join('\n') : chunks.join(' ');
  }

  // in operator
  if (operator === 'in' && Array.isArray(args) && args.length === 2) {
    const left = resolveOperand(args[0], depth);
    const right = resolveOperand(args[1], depth);
    if (left === null || right === null) return null;
    return `${left} ${wrapKw('fait partie de')} ${right}`;
  }

  // missing
  if (operator === 'missing' && Array.isArray(args)) {
    return `${wrapKw('champs manquants parmi')} ${wrapVal(`[${args.map(formatValue).join(', ')}]`)}`;
  }

  // missing_some: {"missing_some": [min, [fields]]}
  if (operator === 'missing_some' && Array.isArray(args) && args.length === 2) {
    const min = args[0];
    const fields = args[1];
    if (typeof min === 'number' && Array.isArray(fields)) {
      return `${wrapKw('au moins')} ${wrapVal(String(min))} ${wrapKw('champ(s) manquant(s) parmi')} ${wrapVal(`[${fields.map(formatValue).join(', ')}]`)}`;
    }
  }

  // Arithmetic
  if (operator === '+' && Array.isArray(args)) {
    if (args.length === 0) return null;
    const parts = args.map((a) => resolveOperand(a, depth));
    if (parts.some((p) => p === null)) return null;
    return parts.join(` ${wrapKw('+')} `);
  }
  if (operator === '-' && Array.isArray(args) && args.length === 1) {
    const operand = resolveOperand(args[0], depth);
    if (operand === null) return null;
    return `${wrapKw('-')}${operand}`;
  }
  if (operator === '-' && Array.isArray(args) && args.length === 2) {
    const left = resolveOperand(args[0], depth);
    const right = resolveOperand(args[1], depth);
    if (left === null || right === null) return null;
    return `${left} ${wrapKw('-')} ${right}`;
  }
  if (operator === '*' && Array.isArray(args)) {
    const parts = args.map((a) => resolveOperand(a, depth));
    if (parts.some((p) => p === null)) return null;
    return parts.join(` ${wrapKw('×')} `);
  }
  if (operator === '/' && Array.isArray(args) && args.length === 2) {
    const left = resolveOperand(args[0], depth);
    const right = resolveOperand(args[1], depth);
    if (left === null || right === null) return null;
    return `${left} ${wrapKw('÷')} ${right}`;
  }
  if (operator === '%' && Array.isArray(args) && args.length === 2) {
    const left = resolveOperand(args[0], depth);
    const right = resolveOperand(args[1], depth);
    if (left === null || right === null) return null;
    return `${left} ${wrapKw('modulo')} ${right}`;
  }

  // min / max
  if (operator === 'min' && Array.isArray(args)) {
    const parts = args.map((a) => resolveOperand(a, depth));
    if (parts.some((p) => p === null)) return null;
    return `${wrapKw('minimum de')} (${parts.join(', ')})`;
  }
  if (operator === 'max' && Array.isArray(args)) {
    const parts = args.map((a) => resolveOperand(a, depth));
    if (parts.some((p) => p === null)) return null;
    return `${wrapKw('maximum de')} (${parts.join(', ')})`;
  }

  // cat (string concatenation)
  if (operator === 'cat' && Array.isArray(args)) {
    if (args.length === 0) return null;
    const parts = args.map((a) => resolveOperand(a, depth));
    if (parts.some((p) => p === null)) return null;
    return parts.join(` ${wrapKw('+')} `);
  }

  // Array operations: map, filter, reduce, all, some, none
  if (operator === 'map' && Array.isArray(args) && args.length === 2) {
    const arr = resolveOperand(args[0], depth);
    if (arr === null) return null;
    return `${wrapKw('transformer chaque élément de')} ${arr}`;
  }
  if (operator === 'filter' && Array.isArray(args) && args.length === 2) {
    const arr = resolveOperand(args[0], depth);
    if (arr === null) return null;
    const cond = resolveOperand(args[1], depth + 1);
    return cond ? `${wrapKw('filtrer')} ${arr} ${wrapKw('où')} ${cond}` : `${wrapKw('filtrer')} ${arr}`;
  }
  if (operator === 'all' && Array.isArray(args) && args.length === 2) {
    const arr = resolveOperand(args[0], depth);
    if (arr === null) return null;
    const cond = resolveOperand(args[1], depth + 1);
    return cond
      ? `${wrapKw('tous les éléments de')} ${arr} ${wrapKw('satisfont :')} ${cond}`
      : `${wrapKw('tous les éléments de')} ${arr} ${wrapKw('satisfont la condition')}`;
  }
  if (operator === 'some' && Array.isArray(args) && args.length === 2) {
    const arr = resolveOperand(args[0], depth);
    if (arr === null) return null;
    const cond = resolveOperand(args[1], depth + 1);
    return cond
      ? `${wrapKw('au moins un élément de')} ${arr} ${wrapKw('satisfait :')} ${cond}`
      : `${wrapKw('au moins un élément de')} ${arr} ${wrapKw('satisfait la condition')}`;
  }
  if (operator === 'none' && Array.isArray(args) && args.length === 2) {
    const arr = resolveOperand(args[0], depth);
    if (arr === null) return null;
    const cond = resolveOperand(args[1], depth + 1);
    return cond
      ? `${wrapKw('aucun élément de')} ${arr} ${wrapKw('ne satisfait :')} ${cond}`
      : `${wrapKw('aucun élément de')} ${arr} ${wrapKw('ne satisfait la condition')}`;
  }

  // Note: "reduce" is intentionally not translated. The JSONLogic reduce operator
  // is accepted by jsonlogic-validate.ts but expressing it in natural French prose
  // would be confusing. Users can author reduce rules in JSON mode.

  return null;
}

/**
 * Returns true when every branch of an OR node is a simple operand
 * (literal, array, or bare variable) — i.e. a truthiness check, not a
 * complex condition.  Used to decide between bullet layout and inline
 * parenthesised rendering.
 */
export function isAllSimpleOr(branches: unknown[]): boolean {
  return branches.every((a) =>
    !a || typeof a !== 'object' || Array.isArray(a) ||
    'var' in (a as Record<string, unknown>),
  );
}

export function translateJsonLogicToProse(jsonString: string, mode: ProseMode = 'condition'): string | null {
  if (!jsonString || jsonString === 'true' || jsonString === 'false') return null;
  try {
    const parsed = JSON.parse(jsonString);
    if (typeof parsed === 'number') return wrapVal(String(parsed));
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;
    return translateNode(parsed, 0, true, mode);
  } catch {
    if (jsonString.startsWith('{') || jsonString.startsWith('[')) return null;
    return wrapVal(`'${escapeQuotes(escapeHtml(jsonString))}'`);
  }
}
