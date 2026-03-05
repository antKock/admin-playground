import { translateJsonLogicToProse } from './jsonlogic-prose';

describe('translateJsonLogicToProse', () => {
  it('translates simple equality', () => {
    expect(translateJsonLogicToProse('{"==": [{"var": "mode_chauffe"}, "autre"]}')).toBe("mode_chauffe equals 'autre'");
  });

  it('translates strict equality', () => {
    expect(translateJsonLogicToProse('{"===": [{"var": "x"}, 1]}')).toBe('x strictly equals 1');
  });

  it('translates inequality', () => {
    expect(translateJsonLogicToProse('{"!=": [{"var": "x"}, "y"]}')).toBe("x does not equal 'y'");
  });

  it('translates less than', () => {
    expect(translateJsonLogicToProse('{"<": [{"var": "age"}, 18]}')).toBe('age is less than 18');
  });

  it('translates greater than or equal', () => {
    expect(translateJsonLogicToProse('{">=": [{"var": "score"}, 50]}')).toBe('score is at least 50');
  });

  it('translates and', () => {
    const rule = '{"and": [{"==": [{"var": "mode"}, "a"]}, {"==": [{"var": "type"}, "b"]}]}';
    expect(translateJsonLogicToProse(rule)).toBe("mode equals 'a' and type equals 'b'");
  });

  it('translates or', () => {
    const rule = '{"or": [{"==": [{"var": "x"}, 1]}, {"==": [{"var": "y"}, 2]}]}';
    expect(translateJsonLogicToProse(rule)).toBe('x equals 1 or y equals 2');
  });

  it('translates not', () => {
    const rule = '{"!": [{"==": [{"var": "x"}, "y"]}]}';
    expect(translateJsonLogicToProse(rule)).toBe("not (x equals 'y')");
  });

  it('translates in operator', () => {
    const rule = '{"in": [{"var": "x"}, ["a", "b"]]}';
    expect(translateJsonLogicToProse(rule)).toBe("x is one of ['a', 'b']");
  });

  it('translates if/then/else', () => {
    const rule = '{"if": [{"==": [{"var": "x"}, 1]}, "yes", "no"]}';
    expect(translateJsonLogicToProse(rule)).toBe("If x equals 1 then 'yes' else 'no'");
  });

  it('returns null for deeply nested rules (>3 levels)', () => {
    // 4+ levels of nesting
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
    expect(translateJsonLogicToProse('{"==": [{"var": "active"}, true]}')).toBe('active equals true');
  });

  it('handles null values', () => {
    expect(translateJsonLogicToProse('{"==": [{"var": "field"}, null]}')).toBe('field equals null');
  });
});
