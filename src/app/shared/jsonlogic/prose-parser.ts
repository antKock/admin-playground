/**
 * Recursive descent parser for French JSONLogic prose.
 * Converts prose text (produced by jsonlogic-prose.ts) back into JSONLogic.
 *
 * @see docs/jsonlogic-prose-architecture.md
 */

import { tokenize, Token, TokenType } from './prose-tokenizer';
import { validateJsonLogic } from './jsonlogic-validate';

export type ParseResult =
  | { success: true; jsonLogic: unknown; warnings?: string[] }
  | { success: false; errors: ParseError[]; partialResult?: unknown };

export interface ParseError {
  message: string;
  line: number;
  col: number;
  start: number;
  end: number;
  /** True when the error is caused by unexpected end of input (incomplete expression) */
  atEnd?: boolean;
}

/** Reverse map from prose operators to JSONLogic operators */
export const PROSE_TO_JSONLOGIC_OP: Record<string, string> = {
  '=': '===',
  '≠': '!==',
  '>': '>',
  '<': '<',
  '≥': '>=',
  '≤': '<=',
  'contient': '==',
  'ne contient pas': '!=',
  'fait partie de': 'in',
  '+': '+',
  '-': '-',
  '×': '*',
  '÷': '/',
  'modulo': '%',
};

const COMPARISON_OPS = new Set(['=', '≠', '>', '<', '≥', '≤', 'contient', 'ne contient pas', 'fait partie de']);
const ARITHMETIC_OPS = new Set(['+', '-', '×', '÷', 'modulo']);

class Parser {
  private tokens: Token[];
  private pos = 0;
  private errors: ParseError[] = [];

  constructor(tokens: Token[]) {
    // Filter out newline tokens (but keep blank_line for OR separation)
    this.tokens = tokens.filter((t) => t.type !== 'newline');
  }

  private peek(): Token | null {
    return this.pos < this.tokens.length ? this.tokens[this.pos] : null;
  }

  private peekType(): TokenType | null {
    return this.peek()?.type ?? null;
  }

  private peekValue(): string | null {
    return this.peek()?.value ?? null;
  }

  private advance(): Token {
    return this.tokens[this.pos++];
  }

  private expect(type: TokenType, value?: string): Token | null {
    const tok = this.peek();
    if (!tok) {
      this.addError(`Fin inattendue — ${type} attendu${value ? ` (${value})` : ''}`, null, true);
      return null;
    }
    if (tok.type !== type || (value !== undefined && tok.value !== value)) {
      this.addError(`${type}${value ? ` "${value}"` : ''} attendu, trouvé "${tok.value}"`, tok);
      return null;
    }
    return this.advance();
  }

  private check(type: TokenType, value?: string): boolean {
    const tok = this.peek();
    if (!tok) return false;
    if (tok.type !== type) return false;
    if (value !== undefined && tok.value !== value) return false;
    return true;
  }

  private checkValue(value: string): boolean {
    return this.peekValue() === value;
  }

  private addError(message: string, tok?: Token | null, atEnd = false): void {
    const t = tok ?? this.peek();
    this.errors.push({
      message,
      line: t?.line ?? 0,
      col: t?.col ?? 0,
      start: t?.start ?? 0,
      end: t?.end ?? 0,
      atEnd,
    });
  }

  parse(): { result: unknown; errors: ParseError[] } {
    const result = this.parseRule();
    return { result, errors: this.errors };
  }

  private parseRule(): unknown {
    // Check for bullet-style value if/then/else
    if (this.check('bullet')) {
      return this.parseBulletIfBlocks();
    }
    // Check for top-level OR (blank_line separated)
    return this.parseOrExpr();
  }

  private parseOrExpr(): unknown {
    const first = this.parseAndExpr();
    const parts = [first];

    while (this.check('blank_line')) {
      this.advance(); // consume blank_line
      parts.push(this.parseAndExpr());
    }

    if (parts.length === 1) return parts[0];
    return { or: parts };
  }

  private parseAndExpr(): unknown {
    const first = this.parseCondition();
    const parts = [first];

    while (this.check('keyword', 'et')) {
      this.advance();
      parts.push(this.parseCondition());
    }

    if (parts.length === 1) return parts[0];
    return { and: parts };
  }

  private parseCondition(): unknown {
    // bullet if blocks
    if (this.check('bullet')) {
      return this.parseBulletIfBlocks();
    }

    // negation: non (...)
    if (this.check('keyword', 'non')) {
      return this.parseNegation();
    }

    // boolean cast: booléen(...)
    if (this.check('keyword', 'booléen')) {
      return this.parseBooleanCast();
    }

    // missing: champs manquants parmi [...]
    if (this.check('keyword', 'champs manquants parmi')) {
      return this.parseMissing();
    }

    // not-missing: aucun champ manquant parmi [...]
    if (this.check('keyword', 'aucun champ manquant parmi')) {
      return this.parseNotMissing();
    }

    // missing_some: au moins N champ(s) manquant(s) parmi [...]
    if (this.check('keyword', 'au moins') && this.lookAheadForMissingSome()) {
      return this.parseMissingSome();
    }

    // quantifiers: au moins un élément de, tous les éléments de, aucun élément de
    if (this.check('keyword', 'au moins un élément de')) {
      return this.parseQuantifier('some');
    }
    if (this.check('keyword', 'tous les éléments de')) {
      return this.parseQuantifier('all');
    }
    if (this.check('keyword', 'aucun élément de')) {
      return this.parseQuantifier('none');
    }

    // min/max: minimum de (...), maximum de (...)
    if (this.check('keyword', 'minimum de') || this.check('keyword', 'maximum de')) {
      return this.parseMinMax();
    }

    // If expression: Si ... alors ...
    if (this.check('keyword', 'Si')) {
      return this.parseIfExpr();
    }

    // transformer: transformer chaque élément de ...
    if (this.check('keyword', 'transformer')) {
      return this.parseMap();
    }

    // filtrer: filtrer ... où ...
    if (this.check('keyword', 'filtrer')) {
      return this.parseFilter();
    }

    // Grouped or: ( expr ou expr )
    if (this.check('paren_open')) {
      return this.parseGroupedOr();
    }

    // Default: comparison / between / operand
    return this.parseComparisonOrOperand();
  }

  private parseComparisonOrOperand(): unknown {
    const left = this.parseOperand();

    // Check for "est absent"
    if (this.check('keyword', 'est absent')) {
      this.advance();
      return { '!': [left] };
    }

    // Check for comparison / between
    const opToken = this.peekComparisonOrArithmeticOp();
    if (opToken && COMPARISON_OPS.has(opToken)) {
      const op = this.consumeOperator();
      let right = this.parseOperand();

      // Right-hand side may continue with arithmetic (e.g. a = b + 5)
      let nextOp = this.peekComparisonOrArithmeticOp();
      if (nextOp && ARITHMETIC_OPS.has(nextOp)) {
        right = this.parseArithmeticChain(right);
        nextOp = this.peekComparisonOrArithmeticOp();
      }

      // Check for between: left op mid op right
      if (nextOp && nextOp === op && (op === '<' || op === '≤')) {
        this.consumeOperator();
        let high = this.parseOperand();
        const highOp = this.peekComparisonOrArithmeticOp();
        if (highOp && ARITHMETIC_OPS.has(highOp)) {
          high = this.parseArithmeticChain(high);
        }
        const jlOp = PROSE_TO_JSONLOGIC_OP[op];
        return { [jlOp]: [left, right, high] };
      }

      const jlOp = PROSE_TO_JSONLOGIC_OP[op];
      return { [jlOp]: [left, right] };
    }

    // Check for arithmetic
    if (opToken && ARITHMETIC_OPS.has(opToken)) {
      const arithResult = this.parseArithmeticChain(left);

      // After arithmetic, check for a trailing comparison operator (e.g. 12 * 24 = 43)
      const cmpOp = this.peekComparisonOrArithmeticOp();
      if (cmpOp && COMPARISON_OPS.has(cmpOp)) {
        const op = this.consumeOperator();
        let right = this.parseOperand();
        // Right-hand side may also have arithmetic (e.g. a + 5 = b + 3)
        const rightOp = this.peekComparisonOrArithmeticOp();
        if (rightOp && ARITHMETIC_OPS.has(rightOp)) {
          right = this.parseArithmeticChain(right);
        }
        const jlOp = PROSE_TO_JSONLOGIC_OP[op];
        return { [jlOp]: [arithResult, right] };
      }

      return arithResult;
    }

    return left;
  }

  private parseArithmeticChain(left: unknown): unknown {
    const opStr = this.consumeOperator();
    const jlOp = PROSE_TO_JSONLOGIC_OP[opStr];
    const right = this.parseOperand();

    // For + and ×, chain: a + b + c → {"+": [a, b, c]}
    if (opStr === '+' || opStr === '×') {
      const parts = [left, right];
      while (this.peekComparisonOrArithmeticOp() === opStr) {
        this.consumeOperator();
        parts.push(this.parseOperand());
      }
      return { [jlOp]: parts };
    }

    return { [jlOp]: [left, right] };
  }

  private peekComparisonOrArithmeticOp(): string | null {
    const tok = this.peek();
    if (!tok) return null;
    if (tok.type === 'operator' && (COMPARISON_OPS.has(tok.value) || ARITHMETIC_OPS.has(tok.value))) {
      return tok.value;
    }
    if (tok.type === 'keyword' && (tok.value === 'contient' || tok.value === 'ne contient pas' || tok.value === 'fait partie de' || tok.value === 'modulo')) {
      return tok.value;
    }
    return null;
  }

  private consumeOperator(): string {
    const tok = this.peek()!;
    this.advance();
    return tok.value;
  }

  private parseOperand(): unknown {
    const tok = this.peek();
    if (!tok) {
      this.addError('Expression incomplète', null, true);
      return null;
    }

    // min/max as operand
    if (this.check('keyword', 'minimum de') || this.check('keyword', 'maximum de')) {
      return this.parseMinMax();
    }

    // boolean cast as operand
    if (this.check('keyword', 'booléen')) {
      return this.parseBooleanCast();
    }

    // Unary negation: -operand (when - is followed by variable, paren, keyword)
    if (tok.type === 'operator' && tok.value === '-') {
      // Check if next token is a variable (not a number, since negative numbers are tokenized as number)
      const next = this.tokens[this.pos + 1];
      if (next && next.type === 'variable') {
        this.advance(); // consume -
        const operand = this.parseOperand();
        return { '-': [operand] };
      }
    }

    // Variable
    if (tok.type === 'variable') {
      this.advance();
      // Check for "(données)" which is a special variable
      if (tok.value === '(données)') {
        return { var: '' };
      }
      return { var: tok.value };
    }

    // Number
    if (tok.type === 'number') {
      this.advance();
      const n = parseFloat(tok.value);
      return n;
    }

    // String
    if (tok.type === 'string') {
      this.advance();
      return tok.value;
    }

    // Array
    if (tok.type === 'array') {
      this.advance();
      return this.parseArrayLiteral(tok.value);
    }

    // Keywords null, true, false
    if (tok.type === 'keyword') {
      if (tok.value === 'null') { this.advance(); return null; }
      if (tok.value === 'true') { this.advance(); return true; }
      if (tok.value === 'false') { this.advance(); return false; }
    }

    // Parenthesized sub-expression or (données)
    if (tok.type === 'paren_open') {
      // Check for (données) special variable
      const next = this.tokens[this.pos + 1];
      const afterNext = this.tokens[this.pos + 2];
      if (next && next.type === 'variable' && next.value === 'données' && afterNext && afterNext.type === 'paren_close') {
        this.advance(); // consume (
        this.advance(); // consume données
        this.advance(); // consume )
        return { var: '' };
      }
      return this.parseGroupedOr();
    }

    this.addError(`Token non reconnu : "${tok.value}"`, tok);
    this.advance();
    return null;
  }

  private parseArrayLiteral(raw: string): unknown[] {
    // Parse [item1, item2, ...] — items can be quoted strings or numbers
    const inner = raw.slice(1, -1).trim();
    if (!inner) return [];
    const items: unknown[] = [];
    let i = 0;
    while (i < inner.length) {
      // Skip whitespace and commas
      while (i < inner.length && (inner[i] === ' ' || inner[i] === ',')) i++;
      if (i >= inner.length) break;

      if (inner[i] === "'") {
        // Quoted string
        i++; // skip opening quote
        let s = '';
        while (i < inner.length && inner[i] !== "'") {
          if (inner[i] === '\\' && i + 1 < inner.length) {
            i++;
            s += inner[i];
          } else {
            s += inner[i];
          }
          i++;
        }
        if (i < inner.length) i++; // skip closing quote
        items.push(s);
      } else if (inner[i] === '-' || /[0-9]/.test(inner[i])) {
        // Number
        let numStr = '';
        while (i < inner.length && /[0-9.-]/.test(inner[i])) {
          numStr += inner[i];
          i++;
        }
        items.push(parseFloat(numStr));
      } else {
        // Unquoted identifier (shouldn't happen in our prose, but handle gracefully)
        let id = '';
        while (i < inner.length && inner[i] !== ',' && inner[i] !== ']') {
          id += inner[i];
          i++;
        }
        items.push(id.trim());
      }
    }
    return items;
  }

  private parseNegation(): unknown {
    this.advance(); // consume 'non'
    if (!this.expect('paren_open')) return null;
    const inner = this.parseRule();
    this.expect('paren_close');
    return { '!': [inner] };
  }

  private parseBooleanCast(): unknown {
    this.advance(); // consume 'booléen'
    if (!this.expect('paren_open')) return null;
    const inner = this.parseOperand();
    this.expect('paren_close');
    return { '!!': [inner] };
  }

  private parseMissing(): unknown {
    this.advance(); // consume 'champs manquants parmi'
    const tok = this.peek();
    if (!tok || tok.type !== 'array') {
      this.addError('Tableau attendu après "champs manquants parmi"');
      return null;
    }
    this.advance();
    const items = this.parseArrayLiteral(tok.value);
    return { missing: items };
  }

  private parseNotMissing(): unknown {
    this.advance(); // consume 'aucun champ manquant parmi'
    const tok = this.peek();
    if (!tok || tok.type !== 'array') {
      this.addError('Tableau attendu après "aucun champ manquant parmi"');
      return null;
    }
    this.advance();
    const items = this.parseArrayLiteral(tok.value);
    return { '!': { missing: items } };
  }

  private lookAheadForMissingSome(): boolean {
    // Check if "au moins" is followed by NUMBER then "champ(s) manquant(s) parmi"
    const saved = this.pos;
    // skip "au moins"
    let i = saved + 1;
    if (i < this.tokens.length && this.tokens[i].type === 'number') {
      i++;
      if (i < this.tokens.length && this.tokens[i].type === 'keyword' && this.tokens[i].value === 'champ(s) manquant(s) parmi') {
        return true;
      }
    }
    return false;
  }

  private parseMissingSome(): unknown {
    this.advance(); // consume 'au moins'
    const numTok = this.expect('number');
    if (!numTok) return null;
    const min = parseFloat(numTok.value);
    this.expect('keyword', 'champ(s) manquant(s) parmi');
    const arrTok = this.peek();
    if (!arrTok || arrTok.type !== 'array') {
      this.addError('Tableau attendu après "champ(s) manquant(s) parmi"');
      return null;
    }
    this.advance();
    const items = this.parseArrayLiteral(arrTok.value);
    return { missing_some: [min, items] };
  }

  private parseQuantifier(type: 'some' | 'all' | 'none'): unknown {
    this.advance(); // consume the quantifier keyword
    const arrOperand = this.parseOperand();

    // Expect "satisfait :", "satisfont :", or "ne satisfait :"
    if (this.check('keyword', 'satisfait') || this.check('keyword', 'satisfont') || this.check('keyword', 'ne satisfait')) {
      this.advance();
      if (this.check('colon')) this.advance();
      const cond = this.parseAndExpr();
      return { [type]: [arrOperand, cond] };
    }

    this.addError('Mot-clé "satisfait", "satisfont" ou "ne satisfait" attendu');
    return { [type]: [arrOperand, true] };
  }

  private parseMinMax(): unknown {
    const tok = this.advance(); // consume 'minimum de' or 'maximum de'
    const op = tok.value === 'minimum de' ? 'min' : 'max';
    if (!this.expect('paren_open')) return null;
    const parts = this.parseOperandList();
    this.expect('paren_close');
    return { [op]: parts };
  }

  private parseOperandList(): unknown[] {
    const parts: unknown[] = [];
    parts.push(this.parseOperand());
    while (this.check('operator', ',')) {
      this.advance();
      parts.push(this.parseOperand());
    }
    return parts;
  }

  private parseIfExpr(): unknown {
    this.advance(); // consume 'Si'
    const args: unknown[] = [];

    const cond = this.parseAndExpr();
    args.push(cond);
    this.expect('keyword', 'alors');
    const val = this.parseOperand();
    args.push(val);

    // sinon si ... alors ...
    while (this.check('keyword', 'sinon si')) {
      this.advance();
      const elseCond = this.parseAndExpr();
      args.push(elseCond);
      this.expect('keyword', 'alors');
      const elseVal = this.parseOperand();
      args.push(elseVal);
    }

    // sinon ...
    if (this.check('keyword', 'sinon')) {
      this.advance();
      const fallback = this.parseOperand();
      args.push(fallback);
    }

    return { if: args };
  }

  private parseBulletIfBlocks(): unknown {
    const args: unknown[] = [];

    while (this.check('bullet')) {
      this.advance(); // consume •

      if (this.check('keyword', 'Si')) {
        this.advance(); // consume Si
        const cond = this.parseAndExpr();
        args.push(cond);
        this.expect('operator', '⇒');
        const val = this.parseOperand();
        args.push(val);
      } else if (this.check('keyword', 'Sinon')) {
        this.advance(); // consume Sinon
        this.expect('operator', '⇒');
        const fallback = this.parseOperand();
        args.push(fallback);
      } else {
        // bullet OR branch — not an if block, parse as OR operand
        // This handles top-level OR with bullets: • expr1 \n • expr2
        return this.parseBulletOrExpr();
      }
    }

    return { if: args };
  }

  private parseBulletOrExpr(): unknown {
    // We already consumed a bullet and the content wasn't Si/Sinon
    // So this is a top-level OR with bullet syntax
    const parts: unknown[] = [];
    // Parse first bullet's content
    parts.push(this.parseAndExpr());

    // Parse remaining bullets (newlines are already filtered out)
    while (this.check('bullet')) {
      this.advance();
      parts.push(this.parseAndExpr());
    }

    if (parts.length === 1) return parts[0];
    return { or: parts };
  }

  private parseGroupedOr(): unknown {
    this.advance(); // consume (
    const first = this.parseAndExpr();
    const parts = [first];
    while (this.check('keyword', 'ou')) {
      this.advance();
      parts.push(this.parseAndExpr());
    }
    this.expect('paren_close');
    if (parts.length === 1) return parts[0];
    return { or: parts };
  }

  private parseMap(): unknown {
    this.advance(); // consume 'transformer'
    this.expect('keyword', 'chaque');
    this.expect('keyword', 'élément');
    this.expect('keyword', 'de');
    const arr = this.parseOperand();
    return { map: [arr, { var: '' }] };
  }

  private parseFilter(): unknown {
    this.advance(); // consume 'filtrer'
    const arr = this.parseOperand();
    if (this.check('keyword', 'où')) {
      this.advance();
      const cond = this.parseAndExpr();
      return { filter: [arr, cond] };
    }
    return { filter: [arr, true] };
  }
}

/**
 * Decode HTML entities commonly produced by jsonlogic-prose.ts
 */
export function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"');
}

/**
 * Strip HTML tags from prose output.
 */
export function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, '');
}

/**
 * Parse French prose back into JSONLogic.
 */
export function parseProse(input: string): ParseResult {
  if (!input || !input.trim()) {
    return { success: false, errors: [{ message: 'Entrée vide', line: 0, col: 0, start: 0, end: 0 }] };
  }

  const tokens = tokenize(input);

  // Check for tokenizer errors
  const errorTokens = tokens.filter((t) => t.type === 'error');
  if (errorTokens.length > 0) {
    return {
      success: false,
      errors: errorTokens.map((t) => ({
        message: `Token non reconnu : "${t.value}"`,
        line: t.line,
        col: t.col,
        start: t.start,
        end: t.end,
      })),
    };
  }

  const parser = new Parser(tokens);
  const { result, errors } = parser.parse();

  if (errors.length > 0) {
    return { success: false, errors, partialResult: result };
  }

  // Run through validation as warning
  const warnings: string[] = [];
  try {
    const jsonStr = JSON.stringify(result);
    const validationErrors = validateJsonLogic(jsonStr);
    if (validationErrors.length > 0) {
      for (const ve of validationErrors) {
        warnings.push(`Validation: ${ve.message} (${ve.path})`);
      }
    }
  } catch {
    // Ignore serialization errors
  }

  return { success: true, jsonLogic: result, warnings: warnings.length > 0 ? warnings : undefined };
}

/** Recursively extract all variable paths from a JSONLogic object */
export function extractVarPaths(jsonLogic: unknown): string[] {
  const paths: string[] = [];
  function walk(node: unknown): void {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    const obj = node as Record<string, unknown>;
    if ('var' in obj) {
      const v = obj['var'];
      if (typeof v === 'string' && v) paths.push(v);
      else if (Array.isArray(v) && typeof v[0] === 'string' && v[0]) paths.push(v[0]);
      return;
    }
    for (const key of Object.keys(obj)) {
      walk(obj[key]);
    }
  }
  walk(jsonLogic);
  return [...new Set(paths)];
}
