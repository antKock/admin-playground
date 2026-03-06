import { parseProse, stripHtml, decodeHtmlEntities } from './prose-parser';
import { translateJsonLogicToProse, ProseMode } from './jsonlogic-prose';

/** Helper: translate JSONLogic to prose, strip HTML, decode entities, then parse back */
function roundTrip(jsonLogicStr: string, mode: ProseMode = 'condition'): unknown {
  const prose = translateJsonLogicToProse(jsonLogicStr, mode);
  expect(prose).not.toBeNull();
  const plain = decodeHtmlEntities(stripHtml(prose!));
  const result = parseProse(plain);
  if (!result.success) {
    throw new Error(`Parse failed for prose "${plain}": ${result.errors.map((e) => e.message).join(', ')}`);
  }
  return result.jsonLogic;
}

describe('parseProse', () => {
  describe('direct parsing', () => {
    it('parses simple equality (===)', () => {
      const result = parseProse('x = 1');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.jsonLogic).toEqual({ '===': [{ var: 'x' }, 1] });
      }
    });

    it('parses strict inequality (≠)', () => {
      const result = parseProse("x ≠ 'y'");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.jsonLogic).toEqual({ '!==': [{ var: 'x' }, 'y'] });
      }
    });

    it('parses contains (contient)', () => {
      const result = parseProse("mode_chauffe contient 'autre'");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.jsonLogic).toEqual({ '==': [{ var: 'mode_chauffe' }, 'autre'] });
      }
    });

    it('parses ne contient pas', () => {
      const result = parseProse("x ne contient pas 'y'");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.jsonLogic).toEqual({ '!=': [{ var: 'x' }, 'y'] });
      }
    });

    it('parses less than (<)', () => {
      const result = parseProse('age < 18');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.jsonLogic).toEqual({ '<': [{ var: 'age' }, 18] });
      }
    });

    it('parses greater than or equal (≥)', () => {
      const result = parseProse('score ≥ 50');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.jsonLogic).toEqual({ '>=': [{ var: 'score' }, 50] });
      }
    });

    it('parses between (3-arg less than)', () => {
      const result = parseProse('0 < score < 100');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.jsonLogic).toEqual({ '<': [0, { var: 'score' }, 100] });
      }
    });

    it('parses and', () => {
      const result = parseProse("mode contient 'a' et type contient 'b'");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.jsonLogic).toEqual({
          and: [
            { '==': [{ var: 'mode' }, 'a'] },
            { '==': [{ var: 'type' }, 'b'] },
          ],
        });
      }
    });

    it('parses in (fait partie de)', () => {
      const result = parseProse("x fait partie de ['a', 'b']");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.jsonLogic).toEqual({ in: [{ var: 'x' }, ['a', 'b']] });
      }
    });

    it('parses negation with non (...)', () => {
      const result = parseProse("non (x contient 'y')");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.jsonLogic).toEqual({ '!': [{ '==': [{ var: 'x' }, 'y'] }] });
      }
    });

    it('parses est absent', () => {
      const result = parseProse('x est absent');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.jsonLogic).toEqual({ '!': [{ var: 'x' }] });
      }
    });

    it('parses booléen(...)', () => {
      const result = parseProse('booléen(x)');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.jsonLogic).toEqual({ '!!': [{ var: 'x' }] });
      }
    });

    it('parses champs manquants parmi', () => {
      const result = parseProse("champs manquants parmi ['numero_siret']");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.jsonLogic).toEqual({ missing: ['numero_siret'] });
      }
    });

    it('parses aucun champ manquant parmi', () => {
      const result = parseProse("aucun champ manquant parmi ['numero_siret']");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.jsonLogic).toEqual({ '!': { missing: ['numero_siret'] } });
      }
    });

    it('parses missing_some', () => {
      const result = parseProse("au moins 1 champ(s) manquant(s) parmi ['a', 'b', 'c']");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.jsonLogic).toEqual({ missing_some: [1, ['a', 'b', 'c']] });
      }
    });

    it('parses if/then/else', () => {
      const result = parseProse("Si x contient 1 alors 'yes' sinon 'no'");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.jsonLogic).toEqual({
          if: [{ '==': [{ var: 'x' }, 1] }, 'yes', 'no'],
        });
      }
    });

    it('parses chained if/else-if', () => {
      const result = parseProse("Si x contient 1 alors 'a' sinon si x contient 2 alors 'b' sinon 'c'");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.jsonLogic).toEqual({
          if: [
            { '==': [{ var: 'x' }, 1] }, 'a',
            { '==': [{ var: 'x' }, 2] }, 'b',
            'c',
          ],
        });
      }
    });

    it('parses arithmetic +', () => {
      const result = parseProse('a + b');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.jsonLogic).toEqual({ '+': [{ var: 'a' }, { var: 'b' }] });
      }
    });

    it('parses arithmetic -', () => {
      const result = parseProse('a - b');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.jsonLogic).toEqual({ '-': [{ var: 'a' }, { var: 'b' }] });
      }
    });

    it('parses arithmetic ×', () => {
      const result = parseProse('a × b');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.jsonLogic).toEqual({ '*': [{ var: 'a' }, { var: 'b' }] });
      }
    });

    it('parses arithmetic ÷', () => {
      const result = parseProse('a ÷ b');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.jsonLogic).toEqual({ '/': [{ var: 'a' }, { var: 'b' }] });
      }
    });

    it('parses modulo', () => {
      const result = parseProse('a modulo 3');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.jsonLogic).toEqual({ '%': [{ var: 'a' }, 3] });
      }
    });

    it('parses min', () => {
      const result = parseProse('minimum de (a, b)');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.jsonLogic).toEqual({ min: [{ var: 'a' }, { var: 'b' }] });
      }
    });

    it('parses max', () => {
      const result = parseProse('maximum de (a, b)');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.jsonLogic).toEqual({ max: [{ var: 'a' }, { var: 'b' }] });
      }
    });

    it('parses some quantifier', () => {
      const result = parseProse("au moins un élément de beneficiaries satisfait : departement = '75'");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.jsonLogic).toEqual({
          some: [{ var: 'beneficiaries' }, { '===': [{ var: 'departement' }, '75'] }],
        });
      }
    });

    it('parses all quantifier', () => {
      const result = parseProse('tous les éléments de items satisfont : qty > 0');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.jsonLogic).toEqual({
          all: [{ var: 'items' }, { '>': [{ var: 'qty' }, 0] }],
        });
      }
    });

    it('parses none quantifier', () => {
      const result = parseProse("aucun élément de items ne satisfait : status contient 'rejected'");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.jsonLogic).toEqual({
          none: [{ var: 'items' }, { '==': [{ var: 'status' }, 'rejected'] }],
        });
      }
    });

    it('parses grouped or with parentheses', () => {
      const result = parseProse("(x contient 1 ou y contient 2) et z contient 3");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.jsonLogic).toEqual({
          and: [
            { or: [{ '==': [{ var: 'x' }, 1] }, { '==': [{ var: 'y' }, 2] }] },
            { '==': [{ var: 'z' }, 3] },
          ],
        });
      }
    });

    it('parses bullet-style if/then/else (value mode)', () => {
      const result = parseProse("• Si type contient 'logement' ⇒ 5000\n• Si type contient 'vehicule' ⇒ 3000\n• Sinon ⇒ 1000");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.jsonLogic).toEqual({
          if: [
            { '==': [{ var: 'type' }, 'logement'] }, 5000,
            { '==': [{ var: 'type' }, 'vehicule'] }, 3000,
            1000,
          ],
        });
      }
    });

    it('parses null values', () => {
      const result = parseProse('field contient null');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.jsonLogic).toEqual({ '==': [{ var: 'field' }, null] });
      }
    });

    it('parses boolean values', () => {
      const result = parseProse('active contient true');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.jsonLogic).toEqual({ '==': [{ var: 'active' }, true] });
      }
    });

    it('parses transformer chaque élément', () => {
      const result = parseProse('transformer chaque élément de items');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.jsonLogic).toEqual({ map: [{ var: 'items' }, { var: '' }] });
      }
    });

    it('parses filtrer ... où', () => {
      const result = parseProse("filtrer items où status = 'active'");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.jsonLogic).toEqual({
          filter: [{ var: 'items' }, { '===': [{ var: 'status' }, 'active'] }],
        });
      }
    });
  });

  describe('error cases', () => {
    it('returns error for empty input', () => {
      const result = parseProse('');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0].message).toContain('Entrée vide');
      }
    });

    it('returns error for whitespace-only input', () => {
      const result = parseProse('   ');
      expect(result.success).toBe(false);
    });

    it('tracks position in errors', () => {
      // A malformed expression — just an operator with no operands around it
      const result = parseProse('= =');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0].line).toBeDefined();
        expect(result.errors[0].col).toBeDefined();
      }
    });
  });

  describe('round-trip tests', () => {
    it('round-trips simple equality (==)', () => {
      const result = roundTrip('{"==": [{"var": "mode_chauffe"}, "autre"]}');
      expect(result).toEqual({ '==': [{ var: 'mode_chauffe' }, 'autre'] });
    });

    it('round-trips strict equality (===)', () => {
      const result = roundTrip('{"===": [{"var": "x"}, 1]}');
      expect(result).toEqual({ '===': [{ var: 'x' }, 1] });
    });

    it('round-trips inequality (!=)', () => {
      const result = roundTrip('{"!=": [{"var": "x"}, "y"]}');
      expect(result).toEqual({ '!=': [{ var: 'x' }, 'y'] });
    });

    it('round-trips strict inequality (!==)', () => {
      const result = roundTrip('{"!==": [{"var": "x"}, "y"]}');
      expect(result).toEqual({ '!==': [{ var: 'x' }, 'y'] });
    });

    it('round-trips less than', () => {
      const result = roundTrip('{"<": [{"var": "age"}, 18]}');
      expect(result).toEqual({ '<': [{ var: 'age' }, 18] });
    });

    it('round-trips greater than or equal', () => {
      const result = roundTrip('{">=": [{"var": "score"}, 50]}');
      expect(result).toEqual({ '>=': [{ var: 'score' }, 50] });
    });

    it('round-trips between', () => {
      const result = roundTrip('{"<": [0, {"var": "score"}, 100]}');
      expect(result).toEqual({ '<': [0, { var: 'score' }, 100] });
    });

    it('round-trips and', () => {
      const result = roundTrip('{"and": [{"==": [{"var": "mode"}, "a"]}, {"==": [{"var": "type"}, "b"]}]}');
      expect(result).toEqual({
        and: [
          { '==': [{ var: 'mode' }, 'a'] },
          { '==': [{ var: 'type' }, 'b'] },
        ],
      });
    });

    it('round-trips or (bullet format)', () => {
      const result = roundTrip('{"or": [{"==": [{"var": "x"}, 1]}, {"==": [{"var": "y"}, 2]}]}');
      expect(result).toEqual({
        or: [
          { '==': [{ var: 'x' }, 1] },
          { '==': [{ var: 'y' }, 2] },
        ],
      });
    });

    it('round-trips not by inverting comparison', () => {
      // !{==} → {!=} in prose, then back to {!=}
      const result = roundTrip('{"!": [{"==": [{"var": "x"}, "y"]}]}');
      expect(result).toEqual({ '!=': [{ var: 'x' }, 'y'] });
    });

    it('round-trips not-missing', () => {
      const result = roundTrip('{"!": {"missing": ["numero_siret"]}}');
      expect(result).toEqual({ '!': { missing: ['numero_siret'] } });
    });

    it('round-trips not-some as aucun élément', () => {
      const result = roundTrip('{"!": [{"some": [{"var": "items"}, {"===": [{"var": "status"}, "ok"]}]}]}');
      expect(result).toEqual({
        none: [{ var: 'items' }, { '===': [{ var: 'status' }, 'ok'] }],
      });
    });

    it('round-trips not-var as absent', () => {
      const result = roundTrip('{"!": [{"var": "x"}]}');
      expect(result).toEqual({ '!': [{ var: 'x' }] });
    });

    it('round-trips in operator', () => {
      const result = roundTrip('{"in": [{"var": "x"}, ["a", "b"]]}');
      expect(result).toEqual({ in: [{ var: 'x' }, ['a', 'b']] });
    });

    it('round-trips if/then/else', () => {
      const result = roundTrip('{"if": [{"==": [{"var": "x"}, 1]}, "yes", "no"]}');
      expect(result).toEqual({
        if: [{ '==': [{ var: 'x' }, 1] }, 'yes', 'no'],
      });
    });

    it('round-trips chained if/else-if', () => {
      const result = roundTrip('{"if": [{"==": [{"var": "x"}, 1]}, "a", {"==": [{"var": "x"}, 2]}, "b", "c"]}');
      expect(result).toEqual({
        if: [
          { '==': [{ var: 'x' }, 1] }, 'a',
          { '==': [{ var: 'x' }, 2] }, 'b',
          'c',
        ],
      });
    });

    it('round-trips arithmetic +', () => {
      const result = roundTrip('{"+":[{"var":"a"},{"var":"b"}]}');
      expect(result).toEqual({ '+': [{ var: 'a' }, { var: 'b' }] });
    });

    it('round-trips arithmetic -', () => {
      const result = roundTrip('{"-":[{"var":"a"},{"var":"b"}]}');
      expect(result).toEqual({ '-': [{ var: 'a' }, { var: 'b' }] });
    });

    it('round-trips arithmetic ×', () => {
      const result = roundTrip('{"*":[{"var":"a"},{"var":"b"}]}');
      expect(result).toEqual({ '*': [{ var: 'a' }, { var: 'b' }] });
    });

    it('round-trips arithmetic ÷', () => {
      const result = roundTrip('{"/":[{"var":"a"},{"var":"b"}]}');
      expect(result).toEqual({ '/': [{ var: 'a' }, { var: 'b' }] });
    });

    it('round-trips modulo', () => {
      const result = roundTrip('{"%":[{"var":"a"},3]}');
      expect(result).toEqual({ '%': [{ var: 'a' }, 3] });
    });

    it('round-trips min', () => {
      const result = roundTrip('{"min":[{"var":"a"},{"var":"b"}]}');
      expect(result).toEqual({ min: [{ var: 'a' }, { var: 'b' }] });
    });

    it('round-trips max', () => {
      const result = roundTrip('{"max":[{"var":"a"},{"var":"b"}]}');
      expect(result).toEqual({ max: [{ var: 'a' }, { var: 'b' }] });
    });

    it('round-trips some quantifier', () => {
      const result = roundTrip('{"some": [{"var": "beneficiaries"}, {"===": [{"var": "departement"}, "75"]}]}');
      expect(result).toEqual({
        some: [{ var: 'beneficiaries' }, { '===': [{ var: 'departement' }, '75'] }],
      });
    });

    it('round-trips all quantifier', () => {
      const result = roundTrip('{"all": [{"var": "items"}, {">": [{"var": "qty"}, 0]}]}');
      expect(result).toEqual({
        all: [{ var: 'items' }, { '>': [{ var: 'qty' }, 0] }],
      });
    });

    it('round-trips none quantifier', () => {
      const result = roundTrip('{"none": [{"var": "items"}, {"==": [{"var": "status"}, "rejected"]}]}');
      expect(result).toEqual({
        none: [{ var: 'items' }, { '==': [{ var: 'status' }, 'rejected'] }],
      });
    });

    it('round-trips boolean values', () => {
      const result = roundTrip('{"==": [{"var": "active"}, true]}');
      expect(result).toEqual({ '==': [{ var: 'active' }, true] });
    });

    it('round-trips null values', () => {
      const result = roundTrip('{"==": [{"var": "field"}, null]}');
      expect(result).toEqual({ '==': [{ var: 'field' }, null] });
    });

    it('round-trips nested or-inside-and', () => {
      const result = roundTrip('{"and": [{"or": [{"==": [{"var": "x"}, 1]}, {"==": [{"var": "y"}, 2]}]}, {"==": [{"var": "z"}, 3]}]}');
      expect(result).toEqual({
        and: [
          { or: [{ '==': [{ var: 'x' }, 1] }, { '==': [{ var: 'y' }, 2] }] },
          { '==': [{ var: 'z' }, 3] },
        ],
      });
    });

    it('round-trips complex or with and branches', () => {
      const result = roundTrip('{"or": [{"and": [{"==": [{"var": "a"}, 1]}, {"==": [{"var": "b"}, 2]}]}, {"==": [{"var": "c"}, 3]}]}');
      expect(result).toEqual({
        or: [
          { and: [{ '==': [{ var: 'a' }, 1] }, { '==': [{ var: 'b' }, 2] }] },
          { '==': [{ var: 'c' }, 3] },
        ],
      });
    });

    it('round-trips missing', () => {
      const result = roundTrip('{"missing": ["numero_siret"]}');
      expect(result).toEqual({ missing: ['numero_siret'] });
    });

    it('round-trips missing_some', () => {
      const result = roundTrip('{"missing_some": [1, ["a", "b", "c"]]}');
      expect(result).toEqual({ missing_some: [1, ['a', 'b', 'c']] });
    });

    it('round-trips value mode if/then/else as bullets', () => {
      const result = roundTrip('{"if": [{"==": [{"var": "type"}, "logement"]}, 5000, {"==": [{"var": "type"}, "vehicule"]}, 3000, 1000]}', 'value');
      expect(result).toEqual({
        if: [
          { '==': [{ var: 'type' }, 'logement'] }, 5000,
          { '==': [{ var: 'type' }, 'vehicule'] }, 3000,
          1000,
        ],
      });
    });

    it('round-trips surface × 12 (multiplication)', () => {
      const result = roundTrip('{"*": [{"var": "surface"}, 12]}');
      expect(result).toEqual({ '*': [{ var: 'surface' }, 12] });
    });

    it('round-trips !! (double negation / boolean cast)', () => {
      const result = roundTrip('{"!!": {"var": "x"}}');
      expect(result).toEqual({ '!!': [{ var: 'x' }] });
    });

    it('round-trips greater than', () => {
      const result = roundTrip('{">": [{"var": "b"}, 100]}');
      expect(result).toEqual({ '>': [{ var: 'b' }, 100] });
    });
  });
});
