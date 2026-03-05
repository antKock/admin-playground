/**
 * Translates a JSONLogic rule string into human-readable prose.
 * Returns null if the input is invalid, un-translatable, or too deeply nested.
 */

const OPERATOR_NAMES: Record<string, string> = {
  '==': 'equals',
  '===': 'strictly equals',
  '!=': 'does not equal',
  '!==': 'does not strictly equal',
  '<': 'is less than',
  '<=': 'is at most',
  '>': 'is greater than',
  '>=': 'is at least',
};

const MAX_DEPTH = 3;

function escapeQuotes(s: string): string {
  return s.replace(/'/g, "\\'");
}

function formatValue(val: unknown): string {
  if (typeof val === 'string') return `'${escapeQuotes(val)}'`;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (val === null) return 'null';
  return String(val);
}

function resolveOperand(node: unknown, depth: number): string | null {
  if (depth > MAX_DEPTH) return null;

  if (node === null || node === undefined) return 'null';
  if (typeof node === 'string') return `'${escapeQuotes(node)}'`;
  if (typeof node === 'number' || typeof node === 'boolean') return String(node);

  if (Array.isArray(node)) {
    const items = node.map((item) => formatValue(item));
    return `[${items.join(', ')}]`;
  }

  if (typeof node === 'object') {
    const obj = node as Record<string, unknown>;
    if ('var' in obj && typeof obj['var'] === 'string') {
      return obj['var'];
    }
    // Nested operation — translate recursively
    return translateNode(obj, depth + 1);
  }

  return null;
}

function translateNode(node: unknown, depth: number): string | null {
  if (depth > MAX_DEPTH) return null;
  if (!node || typeof node !== 'object' || Array.isArray(node)) return null;

  const obj = node as Record<string, unknown>;
  const keys = Object.keys(obj);
  if (keys.length !== 1) return null;

  const operator = keys[0];
  const args = obj[operator];

  // Variable reference
  if (operator === 'var') {
    return typeof args === 'string' ? args : null;
  }

  // Comparison operators
  if (operator in OPERATOR_NAMES && Array.isArray(args) && args.length === 2) {
    const left = resolveOperand(args[0], depth);
    const right = resolveOperand(args[1], depth);
    if (left === null || right === null) return null;
    return `${left} ${OPERATOR_NAMES[operator]} ${right}`;
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
    return parts.join(` ${operator} `);
  }

  // Negation: !
  if (operator === '!' && Array.isArray(args) && args.length === 1) {
    const inner = resolveOperand(args[0], depth);
    if (inner === null) return null;
    return `not (${inner})`;
  }
  if (operator === '!') {
    const inner = resolveOperand(args, depth);
    if (inner === null) return null;
    return `not (${inner})`;
  }

  // if / ternary
  if (operator === 'if' && Array.isArray(args) && args.length >= 3) {
    const condition = resolveOperand(args[0], depth);
    const thenBranch = resolveOperand(args[1], depth);
    const elseBranch = resolveOperand(args[2], depth);
    if (condition === null || thenBranch === null || elseBranch === null) return null;
    return `If ${condition} then ${thenBranch} else ${elseBranch}`;
  }

  // in operator
  if (operator === 'in' && Array.isArray(args) && args.length === 2) {
    const left = resolveOperand(args[0], depth);
    const right = resolveOperand(args[1], depth);
    if (left === null || right === null) return null;
    return `${left} is one of ${right}`;
  }

  return null;
}

export function translateJsonLogicToProse(jsonString: string): string | null {
  if (!jsonString || jsonString === 'true' || jsonString === 'false') return null;
  try {
    const parsed = JSON.parse(jsonString);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;
    return translateNode(parsed, 0);
  } catch {
    return null;
  }
}
