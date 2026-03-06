/**
 * Tokenizer for French JSONLogic prose.
 * Converts prose text (produced by jsonlogic-prose.ts) into a stream of tokens
 * for the recursive descent parser.
 *
 * Also exports keyword/operator constants shared by prose-codemirror-language.ts.
 *
 * @see docs/jsonlogic-prose-architecture.md
 */

export type TokenType =
  | 'variable'
  | 'number'
  | 'string'
  | 'array'
  | 'operator'
  | 'keyword'
  | 'paren_open'
  | 'paren_close'
  | 'colon'
  | 'newline'
  | 'blank_line'
  | 'bullet'
  | 'error';

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  col: number;
  start: number;
  end: number;
}

/** Single-character and symbol operators */
export const OPERATORS = ['=', '≠', '≥', '≤', '×', '÷', '+', '-', '>', '<', '⇒'];

/** Multi-word keywords — ordered longest-first for greedy matching */
export const MULTI_WORD_KEYWORDS = [
  'au moins un élément de',
  'tous les éléments de',
  'aucun élément de',
  'aucun champ manquant parmi',
  'champs manquants parmi',
  'ne contient pas',
  'fait partie de',
  'ne satisfait',
  'est absent',
  'minimum de',
  'maximum de',
  'sinon si',
  'au moins',
];

/** Single-word keywords */
export const SINGLE_KEYWORDS = [
  'et',
  'ou',
  'non',
  'satisfait',
  'satisfont',
  'contient',
  'modulo',
  'Si',
  'sinon',
  'alors',
  'booléen',
  'de',
  'transformer',
  'chaque',
  'élément',
  'filtrer',
  'où',
  'Sinon',
  'null',
  'true',
  'false',
];

/**
 * Tokenize a prose string into a list of tokens.
 */
export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;
  let line = 1;
  let col = 1;

  function makeToken(type: TokenType, value: string, start: number, startLine: number, startCol: number): Token {
    return { type, value, line: startLine, col: startCol, start, end: start + value.length };
  }

  function peek(offset = 0): string {
    return input[pos + offset] ?? '';
  }

  function remaining(): string {
    return input.slice(pos);
  }

  function advance(count = 1): void {
    for (let i = 0; i < count; i++) {
      if (input[pos] === '\n') {
        line++;
        col = 1;
      } else {
        col++;
      }
      pos++;
    }
  }

  function skipSpaces(): void {
    while (pos < input.length && input[pos] === ' ') {
      advance();
    }
  }

  function tryMultiWordKeyword(): Token | null {
    const rest = remaining();
    for (const kw of MULTI_WORD_KEYWORDS) {
      if (rest.startsWith(kw)) {
        // Make sure the keyword ends at a word boundary
        const charAfter = input[pos + kw.length];
        if (charAfter && /[a-zA-ZÀ-ÿ0-9_]/.test(charAfter)) continue;
        const startPos = pos;
        const startLine = line;
        const startCol = col;
        advance(kw.length);
        return makeToken('keyword', kw, startPos, startLine, startCol);
      }
    }
    return null;
  }

  function trySingleKeyword(): Token | null {
    const rest = remaining();
    for (const kw of SINGLE_KEYWORDS) {
      if (rest.startsWith(kw)) {
        const charAfter = input[pos + kw.length];
        // "booléen" is followed by "(" — no word boundary needed
        if (kw === 'booléen') {
          if (rest.startsWith('booléen(')) {
            const startPos = pos;
            const startLine = line;
            const startCol = col;
            advance(kw.length);
            return makeToken('keyword', kw, startPos, startLine, startCol);
          }
          continue;
        }
        if (charAfter && /[a-zA-ZÀ-ÿ0-9_.]/.test(charAfter)) continue;
        const startPos = pos;
        const startLine = line;
        const startCol = col;
        advance(kw.length);
        return makeToken('keyword', kw, startPos, startLine, startCol);
      }
    }
    return null;
  }

  while (pos < input.length) {
    const ch = peek();

    // Handle newlines — detect blank lines (double newline)
    if (ch === '\n') {
      const startPos = pos;
      const startLine = line;
      const startCol = col;
      advance();
      // Check for blank line: newline followed by optional whitespace and another newline
      const savedPos = pos;
      const savedLine = line;
      const savedCol = col;
      while (pos < input.length && input[pos] === ' ') advance();
      if (pos < input.length && input[pos] === '\n') {
        advance();
        tokens.push(makeToken('blank_line', '\n\n', startPos, startLine, startCol));
      } else {
        // Reset — it was just a single newline
        pos = savedPos;
        line = savedLine;
        col = savedCol;
        tokens.push(makeToken('newline', '\n', startPos, startLine, startCol));
      }
      continue;
    }

    // Skip spaces
    if (ch === ' ') {
      skipSpaces();
      continue;
    }

    // Bullet
    if (ch === '•') {
      const startPos = pos;
      const startLine = line;
      const startCol = col;
      advance();
      tokens.push(makeToken('bullet', '•', startPos, startLine, startCol));
      continue;
    }

    // Parentheses
    if (ch === '(') {
      const startPos = pos;
      const startLine = line;
      const startCol = col;
      // Check for "champ(s)" pattern — this is part of a keyword, handled by multi-word
      advance();
      tokens.push(makeToken('paren_open', '(', startPos, startLine, startCol));
      continue;
    }
    if (ch === ')') {
      const startPos = pos;
      const startLine = line;
      const startCol = col;
      advance();
      tokens.push(makeToken('paren_close', ')', startPos, startLine, startCol));
      continue;
    }

    // Colon
    if (ch === ':') {
      const startPos = pos;
      const startLine = line;
      const startCol = col;
      advance();
      tokens.push(makeToken('colon', ':', startPos, startLine, startCol));
      continue;
    }

    // Comma (skip, used as separator in operand lists)
    if (ch === ',') {
      const startPos = pos;
      const startLine = line;
      const startCol = col;
      advance();
      tokens.push(makeToken('operator', ',', startPos, startLine, startCol));
      continue;
    }

    // Quoted string
    if (ch === "'") {
      const startPos = pos;
      const startLine = line;
      const startCol = col;
      advance(); // skip opening quote
      let value = '';
      while (pos < input.length && peek() !== "'") {
        if (peek() === '\\' && pos + 1 < input.length) {
          advance(); // skip backslash
          value += peek();
          advance();
        } else {
          value += peek();
          advance();
        }
      }
      if (pos < input.length) advance(); // skip closing quote
      tokens.push(makeToken('string', value, startPos, startLine, startCol));
      continue;
    }

    // Array literal [...]
    if (ch === '[') {
      const startPos = pos;
      const startLine = line;
      const startCol = col;
      let depth = 0;
      let arrayStr = '';
      while (pos < input.length) {
        const c = peek();
        arrayStr += c;
        if (c === '[') depth++;
        else if (c === ']') { depth--; if (depth === 0) { advance(); break; } }
        advance();
      }
      tokens.push(makeToken('array', arrayStr, startPos, startLine, startCol));
      continue;
    }

    // Multi-word keywords (try before single words)
    const multiKw = tryMultiWordKeyword();
    if (multiKw) {
      tokens.push(multiKw);
      continue;
    }

    // "champ(s) manquant(s) parmi" — part of "au moins N champ(s) manquant(s) parmi"
    const champ_match = remaining().match(/^champ\(s\) manquant\(s\) parmi/);
    if (champ_match) {
      const startPos = pos;
      const startLine = line;
      const startCol = col;
      advance(champ_match[0].length);
      tokens.push(makeToken('keyword', champ_match[0], startPos, startLine, startCol));
      continue;
    }

    // Operators (single char)
    // Handle - carefully: it could be a negative number prefix
    if (ch === '-') {
      // Check if this is a negative number: - followed by digit, and previous token is an operator/keyword/start
      const prevToken = tokens.length > 0 ? tokens[tokens.length - 1] : null;
      const nextCh = peek(1);
      const isUnaryMinus = (!prevToken ||
        prevToken.type === 'operator' ||
        prevToken.type === 'keyword' ||
        prevToken.type === 'paren_open' ||
        prevToken.type === 'colon') && /[0-9]/.test(nextCh);
      if (isUnaryMinus) {
        // Parse as negative number
        const startPos = pos;
        const startLine = line;
        const startCol = col;
        advance(); // skip -
        let num = '-';
        while (pos < input.length && /[0-9.]/.test(peek())) {
          num += peek();
          advance();
        }
        tokens.push(makeToken('number', num, startPos, startLine, startCol));
        continue;
      }
      // Otherwise it's an operator
      const startPos = pos;
      const startLine = line;
      const startCol = col;
      advance();
      tokens.push(makeToken('operator', '-', startPos, startLine, startCol));
      continue;
    }

    // Accept * and / as aliases for × and ÷
    if (ch === '*' || ch === '/') {
      const startPos = pos;
      const startLine = line;
      const startCol = col;
      advance();
      tokens.push(makeToken('operator', ch === '*' ? '×' : '÷', startPos, startLine, startCol));
      continue;
    }

    if (OPERATORS.includes(ch) && ch !== '-') {
      const startPos = pos;
      const startLine = line;
      const startCol = col;
      advance();
      tokens.push(makeToken('operator', ch, startPos, startLine, startCol));
      continue;
    }

    // Single-word keywords
    const singleKw = trySingleKeyword();
    if (singleKw) {
      tokens.push(singleKw);
      continue;
    }

    // Numbers
    if (/[0-9]/.test(ch)) {
      const startPos = pos;
      const startLine = line;
      const startCol = col;
      let num = '';
      while (pos < input.length && /[0-9.]/.test(peek())) {
        num += peek();
        advance();
      }
      tokens.push(makeToken('number', num, startPos, startLine, startCol));
      continue;
    }

    // Identifiers / variables (may contain dots, underscores, accented chars)
    if (/[a-zA-ZÀ-ÿ_]/.test(ch)) {
      const startPos = pos;
      const startLine = line;
      const startCol = col;
      let id = '';
      while (pos < input.length && /[a-zA-ZÀ-ÿ0-9_.]/.test(peek())) {
        id += peek();
        advance();
      }
      // Remove trailing dots
      while (id.endsWith('.')) {
        id = id.slice(0, -1);
        pos--;
        col--;
      }
      tokens.push(makeToken('variable', id, startPos, startLine, startCol));
      continue;
    }

    // Unknown character — emit error token
    const startPos = pos;
    const startLine = line;
    const startCol = col;
    advance();
    tokens.push(makeToken('error', ch, startPos, startLine, startCol));
  }

  return tokens;
}
