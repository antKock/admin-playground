import { translateJsonLogicToProse } from './jsonlogic-prose';

describe('translateJsonLogicToProse', () => {
  it('translates simple equality', () => {
    expect(translateJsonLogicToProse('{"==": [{"var": "mode_chauffe"}, "autre"]}')).toBe("mode_chauffe est égal à 'autre'");
  });

  it('translates strict equality', () => {
    expect(translateJsonLogicToProse('{"===": [{"var": "x"}, 1]}')).toBe('x est strictement égal à 1');
  });

  it('translates inequality', () => {
    expect(translateJsonLogicToProse('{"!=": [{"var": "x"}, "y"]}')).toBe("x est différent de 'y'");
  });

  it('translates less than', () => {
    expect(translateJsonLogicToProse('{"<": [{"var": "age"}, 18]}')).toBe('age est inférieur à 18');
  });

  it('translates greater than or equal', () => {
    expect(translateJsonLogicToProse('{">=": [{"var": "score"}, 50]}')).toBe('score est supérieur ou égal à 50');
  });

  it('translates between (3-arg less than)', () => {
    const rule = '{"<": [0, {"var": "score"}, 100]}';
    expect(translateJsonLogicToProse(rule)).toBe('0 est inférieur à score est inférieur à 100');
  });

  it('translates and', () => {
    const rule = '{"and": [{"==": [{"var": "mode"}, "a"]}, {"==": [{"var": "type"}, "b"]}]}';
    expect(translateJsonLogicToProse(rule)).toBe("mode est égal à 'a' et type est égal à 'b'");
  });

  it('translates or', () => {
    const rule = '{"or": [{"==": [{"var": "x"}, 1]}, {"==": [{"var": "y"}, 2]}]}';
    expect(translateJsonLogicToProse(rule)).toBe('x est égal à 1 ou y est égal à 2');
  });

  it('translates not', () => {
    const rule = '{"!": [{"==": [{"var": "x"}, "y"]}]}';
    expect(translateJsonLogicToProse(rule)).toBe("non (x est égal à 'y')");
  });

  it('translates in operator', () => {
    const rule = '{"in": [{"var": "x"}, ["a", "b"]]}';
    expect(translateJsonLogicToProse(rule)).toBe("x fait partie de ['a', 'b']");
  });

  it('translates if/then/else', () => {
    const rule = '{"if": [{"==": [{"var": "x"}, 1]}, "yes", "no"]}';
    expect(translateJsonLogicToProse(rule)).toBe("Si x est égal à 1 alors 'yes' sinon 'no'");
  });

  it('handles var with array syntax (default value)', () => {
    const rule = '{"<": [{"var": ["e_aide_sollicitee", 0]}, {"var": ["d_aide_sollicitable", 0]}]}';
    expect(translateJsonLogicToProse(rule)).toBe('e_aide_sollicitee est inférieur à d_aide_sollicitable');
  });

  it('handles var with numeric index', () => {
    expect(translateJsonLogicToProse('{"var": 1}')).toBe('1');
  });

  it('translates arithmetic operations', () => {
    expect(translateJsonLogicToProse('{"+":[{"var":"a"},{"var":"b"}]}')).toBe('a + b');
    expect(translateJsonLogicToProse('{"-":[{"var":"a"},{"var":"b"}]}')).toBe('a - b');
    expect(translateJsonLogicToProse('{"*":[{"var":"a"},{"var":"b"}]}')).toBe('a × b');
    expect(translateJsonLogicToProse('{"/":[{"var":"a"},{"var":"b"}]}')).toBe('a ÷ b');
    expect(translateJsonLogicToProse('{"%":[{"var":"a"},3]}')).toBe('a modulo 3');
  });

  it('translates min/max', () => {
    expect(translateJsonLogicToProse('{"min":[{"var":"a"},{"var":"b"}]}')).toBe('minimum de (a, b)');
    expect(translateJsonLogicToProse('{"max":[{"var":"a"},{"var":"b"}]}')).toBe('maximum de (a, b)');
  });

  it('returns null for deeply nested rules (>3 levels)', () => {
    const rule = '{"and": [{"or": [{"and": [{"or": [{"==": [{"var": "x"}, 1]}]}]}]}]}';
    expect(translateJsonLogicToProse(rule)).toBeNull();
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

  it('handles boolean values in comparisons', () => {
    expect(translateJsonLogicToProse('{"==": [{"var": "active"}, true]}')).toBe('active est égal à true');
  });

  it('handles null values', () => {
    expect(translateJsonLogicToProse('{"==": [{"var": "field"}, null]}')).toBe('field est égal à null');
  });
});
