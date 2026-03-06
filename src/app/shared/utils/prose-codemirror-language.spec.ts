import { StringStream } from '@codemirror/language';
import { proseStreamParser, proseLanguage, proseHighlightStyle, proseLanguageExtension } from './prose-codemirror-language';

/** Tokenize a single line, returning an array of [text, tokenType] pairs */
function tokenizeLine(line: string): [string, string | null][] {
  const state = proseStreamParser.startState!(2);
  const stream = new StringStream(line, 2, 2);
  const tokens: [string, string | null][] = [];
  while (!stream.eol()) {
    const start = stream.pos;
    const type = proseStreamParser.token(stream, state);
    const text = line.slice(start, stream.pos);
    if (text) {
      tokens.push([text, type]);
    }
  }
  return tokens;
}

/** Tokenize and return only non-null token pairs (skip whitespace) */
function tokenize(line: string): [string, string][] {
  return tokenizeLine(line).filter((t): t is [string, string] => t[1] !== null);
}

describe('prose-codemirror-language', () => {
  describe('variables', () => {
    it('recognizes simple variable names', () => {
      const tokens = tokenize('statut');
      expect(tokens).toEqual([['statut', 'variableName']]);
    });

    it('recognizes dotted identifiers', () => {
      const tokens = tokenize('community.siret');
      expect(tokens).toEqual([['community.siret', 'variableName']]);
    });

    it('recognizes deeply dotted identifiers', () => {
      const tokens = tokenize('data.0.field.name');
      expect(tokens).toEqual([['data.0.field.name', 'variableName']]);
    });
  });

  describe('operators', () => {
    it('recognizes = operator', () => {
      const tokens = tokenize('=');
      expect(tokens).toEqual([['=', 'operator']]);
    });

    it('recognizes all symbolic operators', () => {
      for (const op of ['=', '≠', '>', '<', '≥', '≤', '×', '÷', '⇒']) {
        const tokens = tokenize(op);
        expect(tokens).toEqual([[op, 'operator']]);
      }
    });

    it('recognizes + as operator', () => {
      const tokens = tokenize('x + y');
      expect(tokens).toEqual([
        ['x', 'variableName'],
        ['+', 'operator'],
        ['y', 'variableName'],
      ]);
    });

    it('recognizes - as operator when followed by space', () => {
      const tokens = tokenize('x - y');
      expect(tokens).toEqual([
        ['x', 'variableName'],
        ['-', 'operator'],
        ['y', 'variableName'],
      ]);
    });
  });

  describe('strings', () => {
    it('recognizes quoted strings', () => {
      const tokens = tokenize("'actif'");
      expect(tokens).toEqual([["'actif'", 'string']]);
    });

    it('recognizes strings with escaped quotes', () => {
      const tokens = tokenize("'it\\'s'");
      expect(tokens).toEqual([["'it\\'s'", 'string']]);
    });
  });

  describe('numbers', () => {
    it('recognizes integers', () => {
      const tokens = tokenize('1000');
      expect(tokens).toEqual([['1000', 'number']]);
    });

    it('recognizes floats', () => {
      const tokens = tokenize('3.14');
      expect(tokens).toEqual([['3.14', 'number']]);
    });

    it('recognizes negative numbers', () => {
      const tokens = tokenize('-5');
      expect(tokens).toEqual([['-5', 'number']]);
    });

    it('recognizes negative floats', () => {
      const tokens = tokenize('-3.14');
      expect(tokens).toEqual([['-3.14', 'number']]);
    });
  });

  describe('arrays', () => {
    it('recognizes array literals', () => {
      const tokens = tokenize("['a', 'b', 'c']");
      expect(tokens).toEqual([["['a', 'b', 'c']", 'list']]);
    });

    it('recognizes nested arrays', () => {
      const tokens = tokenize('[[1, 2], [3]]');
      expect(tokens).toEqual([['[[1, 2], [3]]', 'list']]);
    });
  });

  describe('parentheses', () => {
    it('recognizes parentheses', () => {
      const tokens = tokenize('(x)');
      expect(tokens).toEqual([
        ['(', 'paren'],
        ['x', 'variableName'],
        [')', 'paren'],
      ]);
    });
  });

  describe('single-word keywords', () => {
    it('recognizes et', () => {
      const tokens = tokenize('x et y');
      expect(tokens).toEqual([
        ['x', 'variableName'],
        ['et', 'keyword'],
        ['y', 'variableName'],
      ]);
    });

    it('recognizes ou', () => {
      const tokens = tokenize('x ou y');
      expect(tokens).toEqual([
        ['x', 'variableName'],
        ['ou', 'keyword'],
        ['y', 'variableName'],
      ]);
    });

    it('recognizes all single keywords', () => {
      const keywords = [
        'et', 'ou', 'non', 'Si', 'alors', 'sinon', 'booléen',
        'satisfait', 'satisfont', 'modulo',
        'Sinon', 'de', 'transformer', 'chaque', 'élément', 'filtrer', 'où',
      ];
      for (const kw of keywords) {
        const tokens = tokenize(kw);
        expect(tokens).toEqual([[kw, 'keyword']]);
      }
    });
  });

  describe('multi-word keywords', () => {
    it('recognizes "fait partie de"', () => {
      const tokens = tokenize('x fait partie de y');
      expect(tokens).toEqual([
        ['x', 'variableName'],
        ['fait partie de', 'keyword'],
        ['y', 'variableName'],
      ]);
    });

    it('recognizes "ne contient pas"', () => {
      const tokens = tokenize('x ne contient pas y');
      expect(tokens).toEqual([
        ['x', 'variableName'],
        ['ne contient pas', 'keyword'],
        ['y', 'variableName'],
      ]);
    });

    it('recognizes "est absent"', () => {
      const tokens = tokenize('x est absent');
      expect(tokens).toEqual([
        ['x', 'variableName'],
        ['est absent', 'keyword'],
      ]);
    });

    it('recognizes "au moins un élément de"', () => {
      const tokens = tokenize('au moins un élément de x');
      expect(tokens).toEqual([
        ['au moins un élément de', 'keyword'],
        ['x', 'variableName'],
      ]);
    });

    it('recognizes "tous les éléments de"', () => {
      const tokens = tokenize('tous les éléments de x');
      expect(tokens).toEqual([
        ['tous les éléments de', 'keyword'],
        ['x', 'variableName'],
      ]);
    });

    it('recognizes "aucun élément de"', () => {
      const tokens = tokenize('aucun élément de x');
      expect(tokens).toEqual([
        ['aucun élément de', 'keyword'],
        ['x', 'variableName'],
      ]);
    });

    it('recognizes "champs manquants parmi"', () => {
      const tokens = tokenize("champs manquants parmi ['a']");
      expect(tokens).toEqual([
        ['champs manquants parmi', 'keyword'],
        ["['a']", 'list'],
      ]);
    });

    it('recognizes "aucun champ manquant parmi"', () => {
      const tokens = tokenize("aucun champ manquant parmi ['x']");
      expect(tokens).toEqual([
        ['aucun champ manquant parmi', 'keyword'],
        ["['x']", 'list'],
      ]);
    });

    it('recognizes "ne satisfait"', () => {
      const tokens = tokenize('x ne satisfait y');
      expect(tokens).toEqual([
        ['x', 'variableName'],
        ['ne satisfait', 'keyword'],
        ['y', 'variableName'],
      ]);
    });

    it('recognizes "transformer chaque élément de" as individual keywords', () => {
      const tokens = tokenize('transformer chaque élément de x');
      expect(tokens).toEqual([
        ['transformer', 'keyword'],
        ['chaque', 'keyword'],
        ['élément', 'keyword'],
        ['de', 'keyword'],
        ['x', 'variableName'],
      ]);
    });
  });

  describe('au moins N champ(s) manquant(s) parmi', () => {
    it('recognizes the pattern with a number', () => {
      const tokens = tokenize("au moins 3 champ(s) manquant(s) parmi ['a', 'b']");
      expect(tokens).toEqual([
        ['au moins 3 champ(s) manquant(s) parmi', 'keyword'],
        ["['a', 'b']", 'list'],
      ]);
    });
  });

  describe('complex expressions', () => {
    it('tokenizes "statut = \'actif\'"', () => {
      const tokens = tokenize("statut = 'actif'");
      expect(tokens).toEqual([
        ['statut', 'variableName'],
        ['=', 'operator'],
        ["'actif'", 'string'],
      ]);
    });

    it('tokenizes "booléen(x)"', () => {
      const tokens = tokenize('booléen(x)');
      expect(tokens).toEqual([
        ['booléen', 'keyword'],
        ['(', 'paren'],
        ['x', 'variableName'],
        [')', 'paren'],
      ]);
    });

    it('tokenizes "minimum de" as multi-word keyword', () => {
      const tokens = tokenize('minimum de');
      expect(tokens).toEqual([
        ['minimum de', 'keyword'],
      ]);
    });

    it('tokenizes if/then/else', () => {
      const tokens = tokenize("Si x = 'a' alors 1 sinon 0");
      expect(tokens).toEqual([
        ['Si', 'keyword'],
        ['x', 'variableName'],
        ['=', 'operator'],
        ["'a'", 'string'],
        ['alors', 'keyword'],
        ['1', 'number'],
        ['sinon', 'keyword'],
        ['0', 'number'],
      ]);
    });

    it('tokenizes arrow operator', () => {
      const tokens = tokenize('x ⇒ y');
      expect(tokens).toEqual([
        ['x', 'variableName'],
        ['⇒', 'operator'],
        ['y', 'variableName'],
      ]);
    });
  });

  describe('invalid tokens', () => {
    it('marks unrecognized characters as invalid', () => {
      const tokens = tokenize('§');
      expect(tokens).toEqual([['§', 'invalid']]);
    });

    it('marks @ as invalid', () => {
      const tokens = tokenize('@');
      expect(tokens).toEqual([['@', 'invalid']]);
    });
  });

  describe('whitespace', () => {
    it('returns null for whitespace', () => {
      const allTokens = tokenizeLine('  x  ');
      // Whitespace tokens have null type
      const wsTokens = allTokens.filter((t) => t[1] === null);
      expect(wsTokens.length).toBeGreaterThan(0);
    });
  });

  describe('exports', () => {
    it('exports proseLanguage as a StreamLanguage', () => {
      expect(proseLanguage).toBeDefined();
    });

    it('exports proseHighlightStyle', () => {
      expect(proseHighlightStyle).toBeDefined();
    });

    it('exports proseLanguageExtension as array', () => {
      expect(Array.isArray(proseLanguageExtension)).toBe(true);
      expect(proseLanguageExtension.length).toBe(2);
    });
  });

  describe('word before multi-word match failure falls back to variable', () => {
    it('treats "fait" as variable when not followed by "partie de"', () => {
      const tokens = tokenize('fait x');
      expect(tokens).toEqual([
        ['fait', 'variableName'],
        ['x', 'variableName'],
      ]);
    });

    it('treats "tous" as variable when not followed by "les éléments de"', () => {
      const tokens = tokenize('tous x');
      expect(tokens).toEqual([
        ['tous', 'variableName'],
        ['x', 'variableName'],
      ]);
    });

    it('treats "au" alone as variable', () => {
      const tokens = tokenize('au x');
      expect(tokens).toEqual([
        ['au', 'variableName'],
        ['x', 'variableName'],
      ]);
    });
  });
});
