import { translateJsonLogicToProse } from './jsonlogic-prose';

/** Shorthand for <strong>text</strong> to keep expectations readable */
const b = (s: string) => `<strong>${s}</strong>`;

describe('translateJsonLogicToProse', () => {
  it('translates simple equality (==)', () => {
    expect(translateJsonLogicToProse('{"==": [{"var": "mode_chauffe"}, "autre"]}')).toBe(`${b('mode_chauffe')} contient ${b("'autre'")}`);
  });

  it('translates strict equality (===)', () => {
    expect(translateJsonLogicToProse('{"===": [{"var": "x"}, 1]}')).toBe(`${b('x')} = ${b('1')}`);
  });

  it('translates inequality (!=)', () => {
    expect(translateJsonLogicToProse('{"!=": [{"var": "x"}, "y"]}')).toBe(`${b('x')} ne contient pas ${b("'y'")}`);
  });

  it('translates strict inequality (!==)', () => {
    expect(translateJsonLogicToProse('{"!==": [{"var": "x"}, "y"]}')).toBe(`${b('x')} ≠ ${b("'y'")}`);
  });

  it('translates less than', () => {
    expect(translateJsonLogicToProse('{"<": [{"var": "age"}, 18]}')).toBe(`${b('age')} &lt; ${b('18')}`);
  });

  it('translates greater than or equal', () => {
    expect(translateJsonLogicToProse('{">=": [{"var": "score"}, 50]}')).toBe(`${b('score')} ≥ ${b('50')}`);
  });

  it('translates between (3-arg less than)', () => {
    const rule = '{"<": [0, {"var": "score"}, 100]}';
    expect(translateJsonLogicToProse(rule)).toBe(`${b('0')} &lt; ${b('score')} &lt; ${b('100')}`);
  });

  it('translates and', () => {
    const rule = '{"and": [{"==": [{"var": "mode"}, "a"]}, {"==": [{"var": "type"}, "b"]}]}';
    expect(translateJsonLogicToProse(rule)).toBe(`${b('mode')} contient ${b("'a'")} et ${b('type')} contient ${b("'b'")}`);
  });

  it('translates or', () => {
    const rule = '{"or": [{"==": [{"var": "x"}, 1]}, {"==": [{"var": "y"}, 2]}]}';
    expect(translateJsonLogicToProse(rule)).toBe(`• ${b('x')} contient ${b('1')}\n• ${b('y')} contient ${b('2')}`);
  });

  it('translates not by inverting comparison', () => {
    const rule = '{"!": [{"==": [{"var": "x"}, "y"]}]}';
    expect(translateJsonLogicToProse(rule)).toBe(`${b('x')} ne contient pas ${b("'y'")}`);
  });

  it('translates not-missing as aucun champ manquant', () => {
    const rule = '{"!": {"missing": ["numero_siret"]}}';
    expect(translateJsonLogicToProse(rule)).toBe(`aucun champ manquant parmi ${b("['numero_siret']")}`);
  });

  it('translates not-some as aucun élément', () => {
    const rule = '{"!": [{"some": [{"var": "items"}, {"===": [{"var": "status"}, "ok"]}]}]}';
    expect(translateJsonLogicToProse(rule)).toBe(`aucun élément de ${b('items')} ne satisfait : ${b('status')} = ${b("'ok'")}`);
  });

  it('translates not-var as absent', () => {
    const rule = '{"!": [{"var": "x"}]}';
    expect(translateJsonLogicToProse(rule)).toBe(`${b('x')} est absent`);
  });

  it('translates in operator', () => {
    const rule = '{"in": [{"var": "x"}, ["a", "b"]]}';
    expect(translateJsonLogicToProse(rule)).toBe(`${b('x')} fait partie de ${b("['a', 'b']")}`);
  });

  it('translates if/then/else', () => {
    const rule = '{"if": [{"==": [{"var": "x"}, 1]}, "yes", "no"]}';
    expect(translateJsonLogicToProse(rule)).toBe(`Si ${b('x')} contient ${b('1')} alors ${b("'yes'")} sinon ${b("'no'")}`);
  });

  it('handles var with array syntax (default value)', () => {
    const rule = '{"<": [{"var": ["e_aide_sollicitee", 0]}, {"var": ["d_aide_sollicitable", 0]}]}';
    expect(translateJsonLogicToProse(rule)).toBe(`${b('e_aide_sollicitee')} &lt; ${b('d_aide_sollicitable')}`);
  });

  it('handles var with numeric index', () => {
    expect(translateJsonLogicToProse('{"var": 1}')).toBe(b('1'));
  });

  it('translates arithmetic operations', () => {
    expect(translateJsonLogicToProse('{"+":[{"var":"a"},{"var":"b"}]}')).toBe(`${b('a')} + ${b('b')}`);
    expect(translateJsonLogicToProse('{"-":[{"var":"a"},{"var":"b"}]}')).toBe(`${b('a')} - ${b('b')}`);
    expect(translateJsonLogicToProse('{"*":[{"var":"a"},{"var":"b"}]}')).toBe(`${b('a')} × ${b('b')}`);
    expect(translateJsonLogicToProse('{"/":[{"var":"a"},{"var":"b"}]}')).toBe(`${b('a')} ÷ ${b('b')}`);
    expect(translateJsonLogicToProse('{"%":[{"var":"a"},3]}')).toBe(`${b('a')} modulo ${b('3')}`);
  });

  it('translates min/max', () => {
    expect(translateJsonLogicToProse('{"min":[{"var":"a"},{"var":"b"}]}')).toBe(`minimum de (${b('a')}, ${b('b')})`);
    expect(translateJsonLogicToProse('{"max":[{"var":"a"},{"var":"b"}]}')).toBe(`maximum de (${b('a')}, ${b('b')})`);
  });

  it('translates deeply nested rules', () => {
    const rule = '{"and": [{"or": [{"and": [{"or": [{"==": [{"var": "x"}, 1]}]}]}]}]}';
    expect(translateJsonLogicToProse(rule)).toBe(`${b('x')} contient ${b('1')}`);
  });

  it('translates nested or-inside-and with inline parentheses', () => {
    const rule = '{"and": [{"or": [{"==": [{"var": "x"}, 1]}, {"==": [{"var": "y"}, 2]}]}, {"==": [{"var": "z"}, 3]}]}';
    expect(translateJsonLogicToProse(rule)).toBe(`(${b('x')} contient ${b('1')} ou ${b('y')} contient ${b('2')}) et ${b('z')} contient ${b('3')}`);
  });

  it('translates complex or with and branches (no outer parens in bullets)', () => {
    const rule = '{"or": [{"and": [{"==": [{"var": "a"}, 1]}, {"==": [{"var": "b"}, 2]}]}, {"==": [{"var": "c"}, 3]}]}';
    expect(translateJsonLogicToProse(rule)).toBe(`• ${b('a')} contient ${b('1')} et ${b('b')} contient ${b('2')}\n• ${b('c')} contient ${b('3')}`);
  });

  it('wraps nested and-inside-or without outer parens in bullets', () => {
    const rule = '{"or": [{"<": [{"var": "x"}, 10]}, {"and": [{"===": [{"var": "s"}, "p"]}, {">": [{"var": "b"}, 100]}]}]}';
    expect(translateJsonLogicToProse(rule)).toBe(`• ${b('x')} &lt; ${b('10')}\n• ${b('s')} = ${b("'p'")} et ${b('b')} &gt; ${b('100')}`);
  });

  it('returns null for invalid JSON', () => {
    expect(translateJsonLogicToProse('{invalid}')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(translateJsonLogicToProse('')).toBeNull();
  });

  it('returns null for "true" boolean string', () => {
    expect(translateJsonLogicToProse('true')).toBeNull();
  });

  it('returns null for "false" boolean string', () => {
    expect(translateJsonLogicToProse('false')).toBeNull();
  });

  it('returns null for non-object JSON', () => {
    expect(translateJsonLogicToProse('[1, 2, 3]')).toBeNull();
    expect(translateJsonLogicToProse('"hello"')).toBeNull();
    expect(translateJsonLogicToProse('42')).toBeNull();
  });

  it('translates some with condition', () => {
    const rule = '{"some": [{"var": "beneficiaries"}, {"===": [{"var": "departement"}, "75"]}]}';
    expect(translateJsonLogicToProse(rule)).toBe(`au moins un élément de ${b('beneficiaries')} satisfait : ${b('departement')} = ${b("'75'")}`);
  });

  it('translates all with condition', () => {
    const rule = '{"all": [{"var": "items"}, {">": [{"var": "qty"}, 0]}]}';
    expect(translateJsonLogicToProse(rule)).toBe(`tous les éléments de ${b('items')} satisfont : ${b('qty')} &gt; ${b('0')}`);
  });

  it('translates none with condition', () => {
    const rule = '{"none": [{"var": "items"}, {"==": [{"var": "status"}, "rejected"]}]}';
    expect(translateJsonLogicToProse(rule)).toBe(`aucun élément de ${b('items')} ne satisfait : ${b('status')} contient ${b("'rejected'")}`);
  });

  it('handles boolean values in comparisons', () => {
    expect(translateJsonLogicToProse('{"==": [{"var": "active"}, true]}')).toBe(`${b('active')} contient ${b('true')}`);
  });

  it('handles null values', () => {
    expect(translateJsonLogicToProse('{"==": [{"var": "field"}, null]}')).toBe(`${b('field')} contient ${b('null')}`);
  });

  // Edge case fixes
  it('handles empty var "" as (données)', () => {
    expect(translateJsonLogicToProse('{"var": ""}')).toBe(b('(données)'));
  });

  it('handles chained if/else-if (5 args)', () => {
    const rule = '{"if": [{"==": [{"var": "x"}, 1]}, "a", {"==": [{"var": "x"}, 2]}, "b", "c"]}';
    expect(translateJsonLogicToProse(rule)).toBe(
      `Si ${b('x')} contient ${b('1')} alors ${b("'a'")} sinon si ${b('x')} contient ${b('2')} alors ${b("'b'")} sinon ${b("'c'")}`
    );
  });

  it('handles chained if without default (4 args)', () => {
    const rule = '{"if": [{"==": [{"var": "x"}, 1]}, "a", {"==": [{"var": "x"}, 2]}, "b"]}';
    expect(translateJsonLogicToProse(rule)).toBe(
      `Si ${b('x')} contient ${b('1')} alors ${b("'a'")} sinon si ${b('x')} contient ${b('2')} alors ${b("'b'")}`
    );
  });

  it('returns null for empty + args', () => {
    expect(translateJsonLogicToProse('{"+":[]}' )).toBeNull();
  });

  it('returns null for empty cat args', () => {
    expect(translateJsonLogicToProse('{"cat":[]}')).toBeNull();
  });

  it('handles unary negation {"-": [x]}', () => {
    expect(translateJsonLogicToProse('{"-": [{"var": "x"}]}')).toBe(`-${b('x')}`);
  });

  it('handles !! non-array form', () => {
    expect(translateJsonLogicToProse('{"!!": {"var": "x"}}')).toBe(`booléen(${b('x')})`);
  });

  it('handles missing_some operator', () => {
    const rule = '{"missing_some": [1, ["a", "b", "c"]]}';
    expect(translateJsonLogicToProse(rule)).toBe(`au moins ${b('1')} champ(s) manquant(s) parmi ${b("['a', 'b', 'c']")}`);
  });

  // Value mode (ProseMode = 'value')
  it('renders chained if/then/else as bullet list in value mode', () => {
    const rule = '{"if": [{"==": [{"var": "type"}, "logement"]}, 5000, {"==": [{"var": "type"}, "vehicule"]}, 3000, 1000]}';
    expect(translateJsonLogicToProse(rule, 'value')).toBe(
      `• Si ${b('type')} contient ${b("'logement'")} ⇒ ${b('5000')}\n• Si ${b('type')} contient ${b("'vehicule'")} ⇒ ${b('3000')}\n• Sinon ⇒ ${b('1000')}`
    );
  });

  it('renders simple if/then/else as bullets in value mode', () => {
    const rule = '{"if": [{"==": [{"var": "x"}, 1]}, "yes", "no"]}';
    expect(translateJsonLogicToProse(rule, 'value')).toBe(
      `• Si ${b('x')} contient ${b('1')} ⇒ ${b("'yes'")}\n• Sinon ⇒ ${b("'no'")}`
    );
  });

  it('renders non-if rules the same in value mode', () => {
    const rule = '{"*": [{"var": "surface"}, 12]}';
    expect(translateJsonLogicToProse(rule, 'value')).toBe(`${b('surface')} × ${b('12')}`);
  });

  it('keeps inline if format in condition mode (default)', () => {
    const rule = '{"if": [{"==": [{"var": "x"}, 1]}, "yes", "no"]}';
    expect(translateJsonLogicToProse(rule)).toBe(`Si ${b('x')} contient ${b('1')} alors ${b("'yes'")} sinon ${b("'no'")}`);
  });
});
