/**
 * CodeMirror StreamLanguage tokenizer for French prose rules.
 *
 * Provides syntax highlighting only — no AST, no autocomplete, no lint.
 * Works character-by-character via CodeMirror's StreamParser interface.
 *
 * @see docs/jsonlogic-prose-architecture.md
 */

import { StreamLanguage, type StreamParser } from '@codemirror/language';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import {
  SINGLE_KEYWORDS as SINGLE_KEYWORDS_ARR,
  MULTI_WORD_KEYWORDS,
  OPERATORS as OPERATORS_ARR,
} from './prose-tokenizer';

/** Convert arrays to Sets for O(1) lookup in the stream parser */
const SINGLE_KEYWORDS = new Set(SINGLE_KEYWORDS_ARR);
const OPERATORS = new Set(OPERATORS_ARR);

/** State carried between lines by the stream parser */
export interface ProseHighlightState {
  /** Currently unused — reserved for future multi-line constructs */
  context: null;
}

/**
 * Check if the remaining stream content (from current pos) starts with
 * the given suffix (after the already-consumed word). Returns false if
 * the match would fail.
 */
function tryMatchMultiWordSuffix(stream: { string: string; pos: number }, suffix: string): boolean {
  const remaining = stream.string.slice(stream.pos);
  if (remaining.startsWith(suffix)) {
    stream.pos += suffix.length;
    return true;
  }
  return false;
}

/**
 * Sort multi-word keywords by length descending so that longer phrases
 * are matched first (greedy matching).
 */
const SORTED_MULTI_WORD_KEYWORDS = [...MULTI_WORD_KEYWORDS].sort((a, b) => b.length - a.length);

/**
 * Build a map from first word of each multi-word keyword to the list of
 * suffixes (the rest of the phrase after the first word + space).
 */
const MULTI_WORD_BY_FIRST: Map<string, string[]> = (() => {
  const map = new Map<string, string[]>();
  for (const phrase of SORTED_MULTI_WORD_KEYWORDS) {
    const spaceIdx = phrase.indexOf(' ');
    if (spaceIdx === -1) continue;
    const first = phrase.slice(0, spaceIdx);
    const rest = phrase.slice(spaceIdx); // includes leading space
    const existing = map.get(first) ?? [];
    existing.push(rest);
    map.set(first, existing);
  }
  return map;
})();

/** Regex for word characters including accented French chars */
const WORD_RE = /[\wàâäéèêëïîôùûüÿçœæÀÂÄÉÈÊËÏÎÔÙÛÜŸÇŒÆ]/;

/** Read a contiguous word (letters, digits, underscores, accented chars) */
function readWord(stream: { string: string; pos: number }): string {
  const start = stream.pos;
  while (stream.pos < stream.string.length && WORD_RE.test(stream.string[stream.pos])) {
    stream.pos++;
  }
  return stream.string.slice(start, stream.pos);
}

/** Read a dotted identifier like `community.siret` or `data.0.field` */
function readDottedIdentifier(stream: { string: string; pos: number }): void {
  while (stream.pos < stream.string.length && stream.string[stream.pos] === '.') {
    stream.pos++; // consume dot
    // Read next segment (word or number)
    while (stream.pos < stream.string.length && WORD_RE.test(stream.string[stream.pos])) {
      stream.pos++;
    }
  }
}

/**
 * Try to match the special pattern: `au moins <number> champ(s) manquant(s) parmi`
 * Stream is positioned right after reading "au".
 * Returns true if the full pattern matched, false otherwise.
 */
function tryMatchAuMoinsNChamps(stream: { string: string; pos: number }): boolean {
  const remaining = stream.string.slice(stream.pos);
  // Pattern: " moins <digits> champ(s) manquant(s) parmi"
  const match = remaining.match(/^ moins \d+ champ\(s\) manquant\(s\) parmi/);
  if (match) {
    stream.pos += match[0].length;
    return true;
  }
  return false;
}

export const proseStreamParser: StreamParser<ProseHighlightState> = {
  name: 'prose-rules',

  startState(): ProseHighlightState {
    return { context: null };
  },

  token(stream): string | null {
    // Whitespace
    if (stream.eatSpace()) {
      return null;
    }

    const ch = stream.string[stream.pos];

    // Quoted strings: '...'
    if (ch === "'") {
      stream.pos++; // opening quote
      while (stream.pos < stream.string.length) {
        const c = stream.string[stream.pos];
        if (c === '\\' && stream.pos + 1 < stream.string.length) {
          stream.pos += 2; // skip escaped char
        } else if (c === "'") {
          stream.pos++; // closing quote
          return 'string';
        } else {
          stream.pos++;
        }
      }
      return 'string'; // unterminated string — still highlight as string
    }

    // Arrays: [...]
    if (ch === '[') {
      stream.pos++; // opening bracket
      let depth = 1;
      while (stream.pos < stream.string.length && depth > 0) {
        const c = stream.string[stream.pos];
        if (c === '[') depth++;
        else if (c === ']') depth--;
        stream.pos++;
      }
      return 'list';
    }

    // Parentheses
    if (ch === '(' || ch === ')') {
      stream.pos++;
      return 'paren';
    }

    // Numbers: check for negative numbers (- immediately followed by digit)
    if (ch === '-') {
      const next = stream.pos + 1 < stream.string.length ? stream.string[stream.pos + 1] : '';
      if (/\d/.test(next)) {
        stream.pos++; // consume -
        while (stream.pos < stream.string.length && /\d/.test(stream.string[stream.pos])) {
          stream.pos++;
        }
        // decimal part
        if (stream.pos < stream.string.length && stream.string[stream.pos] === '.') {
          const afterDot = stream.pos + 1 < stream.string.length ? stream.string[stream.pos + 1] : '';
          if (/\d/.test(afterDot)) {
            stream.pos++; // consume dot
            while (stream.pos < stream.string.length && /\d/.test(stream.string[stream.pos])) {
              stream.pos++;
            }
          }
        }
        return 'number';
      }
    }

    // Positive numbers
    if (/\d/.test(ch)) {
      while (stream.pos < stream.string.length && /\d/.test(stream.string[stream.pos])) {
        stream.pos++;
      }
      // decimal part
      if (stream.pos < stream.string.length && stream.string[stream.pos] === '.') {
        const afterDot = stream.pos + 1 < stream.string.length ? stream.string[stream.pos + 1] : '';
        if (/\d/.test(afterDot)) {
          stream.pos++; // consume dot
          while (stream.pos < stream.string.length && /\d/.test(stream.string[stream.pos])) {
            stream.pos++;
          }
        }
      }
      return 'number';
    }

    // Operators (single-char special symbols)
    if (OPERATORS.has(ch) && ch !== '-' && ch !== '+') {
      stream.pos++;
      return 'operator';
    }
    // + and - as operators (when not followed by digit — digit case handled above for -)
    if (ch === '+' || ch === '-') {
      stream.pos++;
      return 'operator';
    }

    // Bullet point: •
    if (ch === '•') {
      stream.pos++;
      return 'keyword';
    }

    // Words: keywords, multi-word keywords, or variables
    if (WORD_RE.test(ch)) {
      const savedPos = stream.pos;
      const word = readWord(stream);

      // Special case: "au" — could be start of "au moins N champ(s) manquant(s) parmi"
      // or "au moins un élément de"
      if (word === 'au') {
        const posAfterWord = stream.pos;

        // Try "au moins N champ(s) manquant(s) parmi" first
        if (tryMatchAuMoinsNChamps(stream)) {
          return 'keyword';
        }
        stream.pos = posAfterWord; // restore

        // Try multi-word suffixes starting with "au"
        const suffixes = MULTI_WORD_BY_FIRST.get('au');
        if (suffixes) {
          for (const suffix of suffixes) {
            if (tryMatchMultiWordSuffix(stream, suffix)) {
              return 'keyword';
            }
            stream.pos = posAfterWord;
          }
        }

        // "au" alone is not a keyword — treat as variable
        readDottedIdentifier(stream);
        return 'variableName';
      }

      // Try multi-word keyword (look-ahead for suffix)
      const suffixes = MULTI_WORD_BY_FIRST.get(word);
      if (suffixes) {
        const posAfterWord = stream.pos;
        for (const suffix of suffixes) {
          if (tryMatchMultiWordSuffix(stream, suffix)) {
            return 'keyword';
          }
          stream.pos = posAfterWord; // restore position
        }
      }

      // Check if it's a single-word keyword
      if (SINGLE_KEYWORDS.has(word)) {
        return 'keyword';
      }

      // Otherwise it's a variable — consume dotted parts
      readDottedIdentifier(stream);
      return 'variableName';
    }

    // Colon and comma — neutral punctuation
    if (ch === ':' || ch === ',') {
      stream.pos++;
      return null;
    }

    // Unrecognized character
    stream.pos++;
    return 'invalid';
  },
};

/** StreamLanguage instance for prose rules */
export const proseLanguage = StreamLanguage.define(proseStreamParser);

/** Highlight style mapping token types to colors */
export const proseHighlightStyle = HighlightStyle.define([
  { tag: tags.variableName, color: '#7c3aed' },   // purple — variables
  { tag: tags.keyword, color: '#555555' },          // gray — keywords
  { tag: tags.operator, color: '#555555' },         // gray — operators
  { tag: tags.string, color: '#059669' },           // green — quoted strings
  { tag: tags.number, color: '#059669' },           // green — numbers
  { tag: tags.list, color: '#059669' },             // green — arrays
  { tag: tags.invalid, color: '#b32020' },          // red — errors
]);

/** Ready-to-use extension array: language + highlighting */
export const proseLanguageExtension = [proseLanguage, syntaxHighlighting(proseHighlightStyle)];
