/**
 * Structural validator for JSONLogic rules.
 * Validates that JSON is well-formed JSONLogic (correct operators and structure),
 * not just valid JSON.
 */

/** All operators supported by the JSONLogic spec (jsonlogic.com/operations.html) */
const VALID_OPERATORS = new Set([
  // Data access
  'var', 'missing', 'missing_some',
  // Logic
  'if', '?:', '==', '===', '!=', '!==', '!', '!!', 'or', 'and',
  // Numeric
  '>', '>=', '<', '<=', 'max', 'min', '+', '-', '*', '/', '%',
  // Array
  'map', 'filter', 'reduce', 'all', 'some', 'none', 'merge', 'in',
  // String
  'cat', 'substr',
  // Misc
  'log',
]);

export interface ValidationError {
  message: string;
  path: string;
}

function validateNode(node: unknown, path: string): ValidationError[] {
  // Primitives are valid JSONLogic values (returned as-is)
  if (node === null || typeof node !== 'object') return [];

  // Arrays: validate each element
  if (Array.isArray(node)) {
    const errors: ValidationError[] = [];
    for (let i = 0; i < node.length; i++) {
      errors.push(...validateNode(node[i], `${path}[${i}]`));
    }
    return errors;
  }

  // Objects must have exactly one key (the operator)
  const keys = Object.keys(node as Record<string, unknown>);
  if (keys.length === 0) {
    return [{ message: 'Objet vide — un opérateur JSONLogic est attendu', path }];
  }
  if (keys.length > 1) {
    return [{ message: `Un seul opérateur par objet (trouvé : ${keys.join(', ')})`, path }];
  }

  const operator = keys[0];
  if (!VALID_OPERATORS.has(operator)) {
    return [{ message: `Opérateur inconnu : "${operator}"`, path }];
  }

  // Recursively validate arguments
  const args = (node as Record<string, unknown>)[operator];
  if (Array.isArray(args)) {
    const errors: ValidationError[] = [];
    for (let i = 0; i < args.length; i++) {
      errors.push(...validateNode(args[i], `${path}.${operator}[${i}]`));
    }
    return errors;
  }

  // Single argument (e.g., {"var": "x"}, {"!": {...}})
  return validateNode(args, `${path}.${operator}`);
}

/**
 * Validates a JSON string as a JSONLogic rule.
 * Returns an array of validation errors (empty = valid).
 */
export function validateJsonLogic(jsonString: string): ValidationError[] {
  const trimmed = jsonString.trim();
  if (!trimmed) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    // JSON syntax errors are handled by the JSON linter — skip here
    return [];
  }

  // Top-level must be an object (a rule)
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return [{ message: 'Une règle JSONLogic doit être un objet { "opérateur": [...] }', path: '' }];
  }

  return validateNode(parsed, '');
}
