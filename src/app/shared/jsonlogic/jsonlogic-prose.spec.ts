import { translateJsonLogicToProse } from './jsonlogic-prose';

/** Shorthand helpers for semantic token spans */
const v = (s: string) => `<span class="tk-var">${s}</span>`;
const val = (s: string) => `<span class="tk-val">${s}</span>`;
const kw = (s: string) => `<span class="tk-kw">${s}</span>`;

describe('translateJsonLogicToProse', () => {
  it('translates simple equality (==)', () => {
    expect(translateJsonLogicToProse('{"==": [{"var": "mode_chauffe"}, "autre"]}')).toBe(`${v('mode_chauffe')} ${kw('contient')} ${val("'autre'")}`);
  });

  it('translates strict equality (===)', () => {
    expect(translateJsonLogicToProse('{"===": [{"var": "x"}, 1]}')).toBe(`${v('x')} ${kw('=')} ${val('1')}`);
  });

  it('translates inequality (!=)', () => {
    expect(translateJsonLogicToProse('{"!=": [{"var": "x"}, "y"]}')).toBe(`${v('x')} ${kw('ne contient pas')} ${val("'y'")}`);
  });

  it('translates strict inequality (!==)', () => {
    expect(translateJsonLogicToProse('{"!==": [{"var": "x"}, "y"]}')).toBe(`${v('x')} ${kw('≠')} ${val("'y'")}`);
  });

  it('translates less than', () => {
    expect(translateJsonLogicToProse('{"<": [{"var": "age"}, 18]}')).toBe(`${v('age')} ${kw('&lt;')} ${val('18')}`);
  });

  it('translates greater than or equal', () => {
    expect(translateJsonLogicToProse('{">=": [{"var": "score"}, 50]}')).toBe(`${v('score')} ${kw('≥')} ${val('50')}`);
  });

  it('translates between (3-arg less than)', () => {
    const rule = '{"<": [0, {"var": "score"}, 100]}';
    expect(translateJsonLogicToProse(rule)).toBe(`${val('0')} ${kw('&lt;')} ${v('score')} ${kw('&lt;')} ${val('100')}`);
  });

  it('translates and', () => {
    const rule = '{"and": [{"==": [{"var": "mode"}, "a"]}, {"==": [{"var": "type"}, "b"]}]}';
    expect(translateJsonLogicToProse(rule)).toBe(`${v('mode')} ${kw('contient')} ${val("'a'")} ${kw('et')} ${v('type')} ${kw('contient')} ${val("'b'")}`);
  });

  it('translates or', () => {
    const rule = '{"or": [{"==": [{"var": "x"}, 1]}, {"==": [{"var": "y"}, 2]}]}';
    expect(translateJsonLogicToProse(rule)).toBe(`• ${v('x')} ${kw('contient')} ${val('1')}\n• ${v('y')} ${kw('contient')} ${val('2')}`);
  });

  it('translates or of bare variables inline (truthiness check)', () => {
    const rule = '{"or": [{"var": "indicator_a"}, {"var": "indicator_b"}]}';
    expect(translateJsonLogicToProse(rule)).toBe(`(${v('indicator_a')} ${kw('ou')} ${v('indicator_b')})`);
  });

  it('translates not by inverting comparison', () => {
    const rule = '{"!": [{"==": [{"var": "x"}, "y"]}]}';
    expect(translateJsonLogicToProse(rule)).toBe(`${v('x')} ${kw('ne contient pas')} ${val("'y'")}`);
  });

  it('translates not-missing as aucun champ manquant', () => {
    const rule = '{"!": {"missing": ["numero_siret"]}}';
    expect(translateJsonLogicToProse(rule)).toBe(`${kw('aucun champ manquant parmi')} ${val("['numero_siret']")}`);
  });

  it('translates not-some as aucun élément', () => {
    const rule = '{"!": [{"some": [{"var": "items"}, {"===": [{"var": "status"}, "ok"]}]}]}';
    expect(translateJsonLogicToProse(rule)).toBe(`${kw('aucun élément de')} ${v('items')} ${kw('ne satisfait :')} ${v('status')} ${kw('=')} ${val("'ok'")}`);
  });

  it('translates not-var as absent', () => {
    const rule = '{"!": [{"var": "x"}]}';
    expect(translateJsonLogicToProse(rule)).toBe(`${v('x')} ${kw('est absent')}`);
  });

  it('translates in operator', () => {
    const rule = '{"in": [{"var": "x"}, ["a", "b"]]}';
    expect(translateJsonLogicToProse(rule)).toBe(`${v('x')} ${kw('fait partie de')} ${val("['a', 'b']")}`);
  });

  it('translates if/then/else', () => {
    const rule = '{"if": [{"==": [{"var": "x"}, 1]}, "yes", "no"]}';
    expect(translateJsonLogicToProse(rule)).toBe(`${kw('Si')} ${v('x')} ${kw('contient')} ${val('1')} ${kw('alors')} ${val("'yes'")} ${kw('sinon')} ${val("'no'")}`);
  });

  it('handles var with array syntax (default value)', () => {
    const rule = '{"<": [{"var": ["e_aide_sollicitee", 0]}, {"var": ["d_aide_sollicitable", 0]}]}';
    expect(translateJsonLogicToProse(rule)).toBe(`${v('e_aide_sollicitee')} ${kw('&lt;')} ${v('d_aide_sollicitable')}`);
  });

  it('handles var with numeric index', () => {
    expect(translateJsonLogicToProse('{"var": 1}')).toBe(v('1'));
  });

  it('translates arithmetic operations', () => {
    expect(translateJsonLogicToProse('{"+":[{"var":"a"},{"var":"b"}]}')).toBe(`${v('a')} ${kw('+')} ${v('b')}`);
    expect(translateJsonLogicToProse('{"-":[{"var":"a"},{"var":"b"}]}')).toBe(`${v('a')} ${kw('-')} ${v('b')}`);
    expect(translateJsonLogicToProse('{"*":[{"var":"a"},{"var":"b"}]}')).toBe(`${v('a')} ${kw('×')} ${v('b')}`);
    expect(translateJsonLogicToProse('{"/":[{"var":"a"},{"var":"b"}]}')).toBe(`${v('a')} ${kw('÷')} ${v('b')}`);
    expect(translateJsonLogicToProse('{"%":[{"var":"a"},3]}')).toBe(`${v('a')} ${kw('modulo')} ${val('3')}`);
  });

  it('translates min/max', () => {
    expect(translateJsonLogicToProse('{"min":[{"var":"a"},{"var":"b"}]}')).toBe(`${kw('minimum de')} (${v('a')}, ${v('b')})`);
    expect(translateJsonLogicToProse('{"max":[{"var":"a"},{"var":"b"}]}')).toBe(`${kw('maximum de')} (${v('a')}, ${v('b')})`);
  });

  it('translates deeply nested rules', () => {
    const rule = '{"and": [{"or": [{"and": [{"or": [{"==": [{"var": "x"}, 1]}]}]}]}]}';
    expect(translateJsonLogicToProse(rule)).toBe(`${v('x')} ${kw('contient')} ${val('1')}`);
  });

  it('translates nested or-inside-and with inline parentheses', () => {
    const rule = '{"and": [{"or": [{"==": [{"var": "x"}, 1]}, {"==": [{"var": "y"}, 2]}]}, {"==": [{"var": "z"}, 3]}]}';
    expect(translateJsonLogicToProse(rule)).toBe(`(${v('x')} ${kw('contient')} ${val('1')} ${kw('ou')} ${v('y')} ${kw('contient')} ${val('2')}) ${kw('et')} ${v('z')} ${kw('contient')} ${val('3')}`);
  });

  it('translates complex or with and branches (no outer parens in bullets)', () => {
    const rule = '{"or": [{"and": [{"==": [{"var": "a"}, 1]}, {"==": [{"var": "b"}, 2]}]}, {"==": [{"var": "c"}, 3]}]}';
    expect(translateJsonLogicToProse(rule)).toBe(`• ${v('a')} ${kw('contient')} ${val('1')} ${kw('et')} ${v('b')} ${kw('contient')} ${val('2')}\n• ${v('c')} ${kw('contient')} ${val('3')}`);
  });

  it('wraps nested and-inside-or without outer parens in bullets', () => {
    const rule = '{"or": [{"<": [{"var": "x"}, 10]}, {"and": [{"===": [{"var": "s"}, "p"]}, {">": [{"var": "b"}, 100]}]}]}';
    expect(translateJsonLogicToProse(rule)).toBe(`• ${v('x')} ${kw('&lt;')} ${val('10')}\n• ${v('s')} ${kw('=')} ${val("'p'")} ${kw('et')} ${v('b')} ${kw('&gt;')} ${val('100')}`);
  });

  it('renders unquoted plain string as a string value', () => {
    expect(translateJsonLogicToProse('Test')).toBe(val("'Test'"));
  });

  it('returns null for invalid JSON object/array syntax', () => {
    expect(translateJsonLogicToProse('{invalid}')).toBeNull();
    expect(translateJsonLogicToProse('[invalid]')).toBeNull();
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

  it('returns null for non-object JSON (array, string)', () => {
    expect(translateJsonLogicToProse('[1, 2, 3]')).toBeNull();
    expect(translateJsonLogicToProse('"hello"')).toBeNull();
  });

  it('renders bare numeric rule value as prose', () => {
    expect(translateJsonLogicToProse('42')).toBe(val('42'));
    expect(translateJsonLogicToProse('0')).toBe(val('0'));
    expect(translateJsonLogicToProse('3.14')).toBe(val('3.14'));
  });

  it('translates some with condition', () => {
    const rule = '{"some": [{"var": "beneficiaries"}, {"===": [{"var": "departement"}, "75"]}]}';
    expect(translateJsonLogicToProse(rule)).toBe(`${kw('au moins un élément de')} ${v('beneficiaries')} ${kw('satisfait :')} ${v('departement')} ${kw('=')} ${val("'75'")}`);
  });

  it('translates all with condition', () => {
    const rule = '{"all": [{"var": "items"}, {">": [{"var": "qty"}, 0]}]}';
    expect(translateJsonLogicToProse(rule)).toBe(`${kw('tous les éléments de')} ${v('items')} ${kw('satisfont :')} ${v('qty')} ${kw('&gt;')} ${val('0')}`);
  });

  it('translates none with condition', () => {
    const rule = '{"none": [{"var": "items"}, {"==": [{"var": "status"}, "rejected"]}]}';
    expect(translateJsonLogicToProse(rule)).toBe(`${kw('aucun élément de')} ${v('items')} ${kw('ne satisfait :')} ${v('status')} ${kw('contient')} ${val("'rejected'")}`);
  });

  it('handles boolean values in comparisons', () => {
    expect(translateJsonLogicToProse('{"==": [{"var": "active"}, true]}')).toBe(`${v('active')} ${kw('contient')} ${val('true')}`);
  });

  it('handles null values', () => {
    expect(translateJsonLogicToProse('{"==": [{"var": "field"}, null]}')).toBe(`${v('field')} ${kw('contient')} ${val('null')}`);
  });

  // Edge case fixes
  it('handles empty var "" as (données)', () => {
    expect(translateJsonLogicToProse('{"var": ""}')).toBe(v('(données)'));
  });

  it('handles chained if/else-if (5 args)', () => {
    const rule = '{"if": [{"==": [{"var": "x"}, 1]}, "a", {"==": [{"var": "x"}, 2]}, "b", "c"]}';
    expect(translateJsonLogicToProse(rule)).toBe(
      `${kw('Si')} ${v('x')} ${kw('contient')} ${val('1')} ${kw('alors')} ${val("'a'")} ${kw('sinon si')} ${v('x')} ${kw('contient')} ${val('2')} ${kw('alors')} ${val("'b'")} ${kw('sinon')} ${val("'c'")}`
    );
  });

  it('handles chained if without default (4 args)', () => {
    const rule = '{"if": [{"==": [{"var": "x"}, 1]}, "a", {"==": [{"var": "x"}, 2]}, "b"]}';
    expect(translateJsonLogicToProse(rule)).toBe(
      `${kw('Si')} ${v('x')} ${kw('contient')} ${val('1')} ${kw('alors')} ${val("'a'")} ${kw('sinon si')} ${v('x')} ${kw('contient')} ${val('2')} ${kw('alors')} ${val("'b'")}`
    );
  });

  it('returns null for empty + args', () => {
    expect(translateJsonLogicToProse('{"+":[]}' )).toBeNull();
  });

  it('returns null for empty cat args', () => {
    expect(translateJsonLogicToProse('{"cat":[]}')).toBeNull();
  });

  it('handles unary negation {"-": [x]}', () => {
    expect(translateJsonLogicToProse('{"-": [{"var": "x"}]}')).toBe(`${kw('-')}${v('x')}`);
  });

  it('handles !! non-array form', () => {
    expect(translateJsonLogicToProse('{"!!": {"var": "x"}}')).toBe(`${kw('booléen')}(${v('x')})`);
  });

  it('handles missing_some operator', () => {
    const rule = '{"missing_some": [1, ["a", "b", "c"]]}';
    expect(translateJsonLogicToProse(rule)).toBe(`${kw('au moins')} ${val('1')} ${kw('champ(s) manquant(s) parmi')} ${val("['a', 'b', 'c']")}`);
  });

  // Value mode (ProseMode = 'value')
  it('renders chained if/then/else as bullet list in value mode', () => {
    const rule = '{"if": [{"==": [{"var": "type"}, "logement"]}, 5000, {"==": [{"var": "type"}, "vehicule"]}, 3000, 1000]}';
    expect(translateJsonLogicToProse(rule, 'value')).toBe(
      `• ${kw('Si')} ${v('type')} ${kw('contient')} ${val("'logement'")} ${kw('⇒')} ${val('5000')}\n• ${kw('Si')} ${v('type')} ${kw('contient')} ${val("'vehicule'")} ${kw('⇒')} ${val('3000')}\n• ${kw('Sinon')} ${kw('⇒')} ${val('1000')}`
    );
  });

  it('renders simple if/then/else as bullets in value mode', () => {
    const rule = '{"if": [{"==": [{"var": "x"}, 1]}, "yes", "no"]}';
    expect(translateJsonLogicToProse(rule, 'value')).toBe(
      `• ${kw('Si')} ${v('x')} ${kw('contient')} ${val('1')} ${kw('⇒')} ${val("'yes'")}\n• ${kw('Sinon')} ${kw('⇒')} ${val("'no'")}`
    );
  });

  it('renders non-if rules the same in value mode', () => {
    const rule = '{"*": [{"var": "surface"}, 12]}';
    expect(translateJsonLogicToProse(rule, 'value')).toBe(`${v('surface')} ${kw('×')} ${val('12')}`);
  });

  it('keeps inline if format in condition mode (default)', () => {
    const rule = '{"if": [{"==": [{"var": "x"}, 1]}, "yes", "no"]}';
    expect(translateJsonLogicToProse(rule)).toBe(`${kw('Si')} ${v('x')} ${kw('contient')} ${val('1')} ${kw('alors')} ${val("'yes'")} ${kw('sinon')} ${val("'no'")}`);
  });
});
