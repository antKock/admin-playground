import { tokenize, Token, OPERATORS, MULTI_WORD_KEYWORDS, SINGLE_KEYWORDS } from './prose-tokenizer';

/** Helper: tokenize and return only type+value pairs (skip positional fields) */
function tok(input: string): { type: string; value: string }[] {
  return tokenize(input).map((t) => ({ type: t.type, value: t.value }));
}

/** Helper: tokenize and return the first token */
function first(input: string): Token {
  const tokens = tokenize(input);
  expect(tokens.length).toBeGreaterThan(0);
  return tokens[0];
}

describe('prose-tokenizer', () => {
  describe('exported constants', () => {
    it('exports OPERATORS as a non-empty array', () => {
      expect(OPERATORS.length).toBeGreaterThan(0);
      expect(OPERATORS).toContain('=');
      expect(OPERATORS).toContain('≠');
      expect(OPERATORS).toContain('⇒');
    });

    it('exports MULTI_WORD_KEYWORDS as a non-empty array', () => {
      expect(MULTI_WORD_KEYWORDS.length).toBeGreaterThan(0);
      expect(MULTI_WORD_KEYWORDS).toContain('fait partie de');
      expect(MULTI_WORD_KEYWORDS).toContain('ne contient pas');
    });

    it('exports SINGLE_KEYWORDS as a non-empty array', () => {
      expect(SINGLE_KEYWORDS.length).toBeGreaterThan(0);
      expect(SINGLE_KEYWORDS).toContain('et');
      expect(SINGLE_KEYWORDS).toContain('ou');
      expect(SINGLE_KEYWORDS).toContain('Si');
    });
  });

  describe('variables', () => {
    it('tokenizes a simple identifier as variable', () => {
      expect(tok('statut')).toEqual([{ type: 'variable', value: 'statut' }]);
    });

    it('tokenizes dotted identifiers as a single variable', () => {
      expect(tok('community.siret')).toEqual([{ type: 'variable', value: 'community.siret' }]);
    });

    it('tokenizes deeply dotted identifiers', () => {
      expect(tok('data.0.field.name')).toEqual([{ type: 'variable', value: 'data.0.field.name' }]);
    });

    it('strips trailing dots from identifiers (dot becomes separate token)', () => {
      const tokens = tok('foo.');
      expect(tokens[0]).toEqual({ type: 'variable', value: 'foo' });
    });

    it('tokenizes identifiers with underscores', () => {
      expect(tok('mode_chauffe')).toEqual([{ type: 'variable', value: 'mode_chauffe' }]);
    });

    it('tokenizes identifiers with accented characters', () => {
      expect(tok('données')).toEqual([{ type: 'variable', value: 'données' }]);
    });
  });

  describe('numbers', () => {
    it('tokenizes integers', () => {
      expect(tok('42')).toEqual([{ type: 'number', value: '42' }]);
    });

    it('tokenizes floats', () => {
      expect(tok('3.14')).toEqual([{ type: 'number', value: '3.14' }]);
    });

    it('tokenizes negative numbers at start of input', () => {
      expect(tok('-5')).toEqual([{ type: 'number', value: '-5' }]);
    });

    it('tokenizes negative numbers after an operator', () => {
      const tokens = tok('x + -3');
      expect(tokens).toEqual([
        { type: 'variable', value: 'x' },
        { type: 'operator', value: '+' },
        { type: 'number', value: '-3' },
      ]);
    });

    it('tokenizes negative numbers after a keyword', () => {
      const tokens = tok('alors -1');
      expect(tokens).toEqual([
        { type: 'keyword', value: 'alors' },
        { type: 'number', value: '-1' },
      ]);
    });

    it('tokenizes minus as operator between two variables', () => {
      const tokens = tok('a - b');
      expect(tokens).toEqual([
        { type: 'variable', value: 'a' },
        { type: 'operator', value: '-' },
        { type: 'variable', value: 'b' },
      ]);
    });

    it('tokenizes negative floats', () => {
      expect(tok('-3.14')).toEqual([{ type: 'number', value: '-3.14' }]);
    });
  });

  describe('strings', () => {
    it('tokenizes quoted strings', () => {
      expect(tok("'hello'")).toEqual([{ type: 'string', value: 'hello' }]);
    });

    it('handles escaped quotes in strings', () => {
      expect(tok("'it\\'s'")).toEqual([{ type: 'string', value: "it's" }]);
    });

    it('handles escaped backslashes', () => {
      expect(tok("'a\\\\b'")).toEqual([{ type: 'string', value: 'a\\b' }]);
    });

    it('handles empty strings', () => {
      expect(tok("''")).toEqual([{ type: 'string', value: '' }]);
    });

    it('handles unterminated strings gracefully', () => {
      const tokens = tok("'unterminated");
      expect(tokens.length).toBe(1);
      expect(tokens[0].type).toBe('string');
    });
  });

  describe('arrays', () => {
    it('tokenizes simple arrays', () => {
      expect(tok("['a', 'b']")).toEqual([{ type: 'array', value: "['a', 'b']" }]);
    });

    it('tokenizes numeric arrays', () => {
      expect(tok('[1, 2, 3]')).toEqual([{ type: 'array', value: '[1, 2, 3]' }]);
    });

    it('tokenizes nested arrays', () => {
      expect(tok('[[1], [2]]')).toEqual([{ type: 'array', value: '[[1], [2]]' }]);
    });

    it('tokenizes empty arrays', () => {
      expect(tok('[]')).toEqual([{ type: 'array', value: '[]' }]);
    });
  });

  describe('operators', () => {
    it('tokenizes all single-char operators', () => {
      for (const op of OPERATORS) {
        if (op === '-') continue; // minus is context-dependent
        const tokens = tok(op);
        expect(tokens).toEqual([{ type: 'operator', value: op }]);
      }
    });

    it('tokenizes comma as operator', () => {
      expect(tok(',')).toEqual([{ type: 'operator', value: ',' }]);
    });
  });

  describe('punctuation', () => {
    it('tokenizes parentheses', () => {
      expect(tok('()')).toEqual([
        { type: 'paren_open', value: '(' },
        { type: 'paren_close', value: ')' },
      ]);
    });

    it('tokenizes colons', () => {
      expect(tok(':')).toEqual([{ type: 'colon', value: ':' }]);
    });

    it('tokenizes bullets', () => {
      expect(tok('•')).toEqual([{ type: 'bullet', value: '•' }]);
    });
  });

  describe('multi-word keywords', () => {
    it('tokenizes "fait partie de"', () => {
      expect(tok('fait partie de')).toEqual([{ type: 'keyword', value: 'fait partie de' }]);
    });

    it('tokenizes "ne contient pas"', () => {
      expect(tok('ne contient pas')).toEqual([{ type: 'keyword', value: 'ne contient pas' }]);
    });

    it('tokenizes "au moins un élément de"', () => {
      expect(tok('au moins un élément de')).toEqual([{ type: 'keyword', value: 'au moins un élément de' }]);
    });

    it('tokenizes "tous les éléments de"', () => {
      expect(tok('tous les éléments de')).toEqual([{ type: 'keyword', value: 'tous les éléments de' }]);
    });

    it('tokenizes "aucun élément de"', () => {
      expect(tok('aucun élément de')).toEqual([{ type: 'keyword', value: 'aucun élément de' }]);
    });

    it('tokenizes "aucun champ manquant parmi"', () => {
      expect(tok('aucun champ manquant parmi')).toEqual([{ type: 'keyword', value: 'aucun champ manquant parmi' }]);
    });

    it('tokenizes "champs manquants parmi"', () => {
      expect(tok('champs manquants parmi')).toEqual([{ type: 'keyword', value: 'champs manquants parmi' }]);
    });

    it('tokenizes "est absent"', () => {
      expect(tok('est absent')).toEqual([{ type: 'keyword', value: 'est absent' }]);
    });

    it('tokenizes "minimum de"', () => {
      expect(tok('minimum de')).toEqual([{ type: 'keyword', value: 'minimum de' }]);
    });

    it('tokenizes "maximum de"', () => {
      expect(tok('maximum de')).toEqual([{ type: 'keyword', value: 'maximum de' }]);
    });

    it('tokenizes "sinon si"', () => {
      expect(tok('sinon si')).toEqual([{ type: 'keyword', value: 'sinon si' }]);
    });

    it('tokenizes "ne satisfait"', () => {
      expect(tok('ne satisfait')).toEqual([{ type: 'keyword', value: 'ne satisfait' }]);
    });

    it('does not match multi-word keyword when not at word boundary', () => {
      // "est absent" should not match inside "test absent"
      const tokens = tok('test absent');
      // "test" is a variable, "absent" would be a variable too (not a keyword on its own)
      expect(tokens[0]).toEqual({ type: 'variable', value: 'test' });
    });

    it('tokenizes "champ(s) manquant(s) parmi" pattern', () => {
      const tokens = tok('champ(s) manquant(s) parmi');
      expect(tokens).toEqual([{ type: 'keyword', value: 'champ(s) manquant(s) parmi' }]);
    });
  });

  describe('single-word keywords', () => {
    it('tokenizes "et" as keyword', () => {
      expect(tok('et')).toEqual([{ type: 'keyword', value: 'et' }]);
    });

    it('tokenizes "ou" as keyword', () => {
      expect(tok('ou')).toEqual([{ type: 'keyword', value: 'ou' }]);
    });

    it('tokenizes "non" as keyword', () => {
      expect(tok('non')).toEqual([{ type: 'keyword', value: 'non' }]);
    });

    it('tokenizes "Si" as keyword (case-sensitive)', () => {
      expect(tok('Si')).toEqual([{ type: 'keyword', value: 'Si' }]);
    });

    it('tokenizes "alors" as keyword', () => {
      expect(tok('alors')).toEqual([{ type: 'keyword', value: 'alors' }]);
    });

    it('tokenizes "sinon" as keyword', () => {
      expect(tok('sinon')).toEqual([{ type: 'keyword', value: 'sinon' }]);
    });

    it('tokenizes "contient" as keyword', () => {
      expect(tok('contient')).toEqual([{ type: 'keyword', value: 'contient' }]);
    });

    it('tokenizes "modulo" as keyword', () => {
      expect(tok('modulo')).toEqual([{ type: 'keyword', value: 'modulo' }]);
    });

    it('tokenizes "booléen" as keyword only before "("', () => {
      expect(tok('booléen(')).toEqual([
        { type: 'keyword', value: 'booléen' },
        { type: 'paren_open', value: '(' },
      ]);
    });

    it('treats "booléen" as variable when not followed by "("', () => {
      expect(tok('booléen x')).toEqual([
        { type: 'variable', value: 'booléen' },
        { type: 'variable', value: 'x' },
      ]);
    });

    it('tokenizes "null" as keyword', () => {
      expect(tok('null')).toEqual([{ type: 'keyword', value: 'null' }]);
    });

    it('tokenizes "true" as keyword', () => {
      expect(tok('true')).toEqual([{ type: 'keyword', value: 'true' }]);
    });

    it('tokenizes "false" as keyword', () => {
      expect(tok('false')).toEqual([{ type: 'keyword', value: 'false' }]);
    });

    it('does not match keyword when followed by word chars', () => {
      // "etude" should be a variable, not "et" + "ude"
      expect(tok('etude')).toEqual([{ type: 'variable', value: 'etude' }]);
    });

    it('does not match keyword when followed by dot', () => {
      // "et.x" — "et" followed by "." should be a variable
      expect(tok('et.x')).toEqual([{ type: 'variable', value: 'et.x' }]);
    });
  });

  describe('newlines and blank lines', () => {
    it('tokenizes single newline', () => {
      expect(tok('\n')).toEqual([{ type: 'newline', value: '\n' }]);
    });

    it('tokenizes double newline as blank_line', () => {
      expect(tok('\n\n')).toEqual([{ type: 'blank_line', value: '\n\n' }]);
    });

    it('tokenizes blank line with whitespace between newlines', () => {
      expect(tok('\n  \n')).toEqual([{ type: 'blank_line', value: '\n\n' }]);
    });
  });

  describe('whitespace handling', () => {
    it('skips spaces between tokens', () => {
      expect(tok('x   y')).toEqual([
        { type: 'variable', value: 'x' },
        { type: 'variable', value: 'y' },
      ]);
    });

    it('returns empty array for empty input', () => {
      expect(tokenize('')).toEqual([]);
    });

    it('returns empty array for whitespace-only input', () => {
      expect(tokenize('   ')).toEqual([]);
    });
  });

  describe('error tokens', () => {
    it('emits error for unrecognized characters', () => {
      expect(tok('§')).toEqual([{ type: 'error', value: '§' }]);
    });

    it('emits error for @', () => {
      expect(tok('@')).toEqual([{ type: 'error', value: '@' }]);
    });

    it('emits error for #', () => {
      expect(tok('#')).toEqual([{ type: 'error', value: '#' }]);
    });
  });

  describe('position tracking', () => {
    it('tracks line and column on first token', () => {
      const t = first('hello');
      expect(t.line).toBe(1);
      expect(t.col).toBe(1);
      expect(t.start).toBe(0);
      expect(t.end).toBe(5);
    });

    it('tracks position after spaces', () => {
      const tokens = tokenize('  x');
      expect(tokens[0].col).toBe(3);
      expect(tokens[0].start).toBe(2);
    });

    it('tracks line numbers across newlines', () => {
      const tokens = tokenize('x\ny');
      const yToken = tokens.find((t) => t.value === 'y');
      expect(yToken).toBeDefined();
      expect(yToken!.line).toBe(2);
      expect(yToken!.col).toBe(1);
    });

    it('computes correct start/end for multi-word keywords', () => {
      const tokens = tokenize('fait partie de');
      expect(tokens[0].start).toBe(0);
      expect(tokens[0].end).toBe(14);
    });
  });

  describe('complex expressions', () => {
    it('tokenizes a full comparison expression', () => {
      expect(tok("statut contient 'actif'")).toEqual([
        { type: 'variable', value: 'statut' },
        { type: 'keyword', value: 'contient' },
        { type: 'string', value: 'actif' },
      ]);
    });

    it('tokenizes an and expression', () => {
      expect(tok('x = 1 et y = 2')).toEqual([
        { type: 'variable', value: 'x' },
        { type: 'operator', value: '=' },
        { type: 'number', value: '1' },
        { type: 'keyword', value: 'et' },
        { type: 'variable', value: 'y' },
        { type: 'operator', value: '=' },
        { type: 'number', value: '2' },
      ]);
    });

    it('tokenizes a between expression', () => {
      expect(tok('0 < score < 100')).toEqual([
        { type: 'number', value: '0' },
        { type: 'operator', value: '<' },
        { type: 'variable', value: 'score' },
        { type: 'operator', value: '<' },
        { type: 'number', value: '100' },
      ]);
    });

    it('tokenizes if/then/else', () => {
      expect(tok("Si x = 1 alors 'yes' sinon 'no'")).toEqual([
        { type: 'keyword', value: 'Si' },
        { type: 'variable', value: 'x' },
        { type: 'operator', value: '=' },
        { type: 'number', value: '1' },
        { type: 'keyword', value: 'alors' },
        { type: 'string', value: 'yes' },
        { type: 'keyword', value: 'sinon' },
        { type: 'string', value: 'no' },
      ]);
    });

    it('tokenizes bullet if/then with arrow', () => {
      expect(tok("• Si x = 1 ⇒ 'a'")).toEqual([
        { type: 'bullet', value: '•' },
        { type: 'keyword', value: 'Si' },
        { type: 'variable', value: 'x' },
        { type: 'operator', value: '=' },
        { type: 'number', value: '1' },
        { type: 'operator', value: '⇒' },
        { type: 'string', value: 'a' },
      ]);
    });

    it('tokenizes minimum de (a, b)', () => {
      expect(tok('minimum de (a, b)')).toEqual([
        { type: 'keyword', value: 'minimum de' },
        { type: 'paren_open', value: '(' },
        { type: 'variable', value: 'a' },
        { type: 'operator', value: ',' },
        { type: 'variable', value: 'b' },
        { type: 'paren_close', value: ')' },
      ]);
    });

    it('tokenizes booléen(x)', () => {
      expect(tok('booléen(x)')).toEqual([
        { type: 'keyword', value: 'booléen' },
        { type: 'paren_open', value: '(' },
        { type: 'variable', value: 'x' },
        { type: 'paren_close', value: ')' },
      ]);
    });

    it('tokenizes quantifier with condition', () => {
      expect(tok("au moins un élément de items satisfait : x = 'ok'")).toEqual([
        { type: 'keyword', value: 'au moins un élément de' },
        { type: 'variable', value: 'items' },
        { type: 'keyword', value: 'satisfait' },
        { type: 'colon', value: ':' },
        { type: 'variable', value: 'x' },
        { type: 'operator', value: '=' },
        { type: 'string', value: 'ok' },
      ]);
    });

    it('tokenizes au moins N champ(s) manquant(s) parmi', () => {
      expect(tok("au moins 2 champ(s) manquant(s) parmi ['a', 'b']")).toEqual([
        { type: 'keyword', value: 'au moins' },
        { type: 'number', value: '2' },
        { type: 'keyword', value: 'champ(s) manquant(s) parmi' },
        { type: 'array', value: "['a', 'b']" },
      ]);
    });
  });
});
