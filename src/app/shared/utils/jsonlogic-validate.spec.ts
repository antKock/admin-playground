import { validateJsonLogic } from './jsonlogic-validate';

describe('validateJsonLogic', () => {
  it('accepts valid simple rules', () => {
    expect(validateJsonLogic('{"==": [{"var": "x"}, 1]}')).toEqual([]);
    expect(validateJsonLogic('{"<": [{"var": "score"}, 100]}')).toEqual([]);
    expect(validateJsonLogic('{"in": [{"var": "type"}, ["a", "b"]]}')).toEqual([]);
  });

  it('accepts var with string', () => {
    expect(validateJsonLogic('{"var": "field_name"}')).toEqual([]);
  });

  it('accepts var with array (default value)', () => {
    expect(validateJsonLogic('{"var": ["field_name", 0]}')).toEqual([]);
  });

  it('accepts var with numeric index', () => {
    expect(validateJsonLogic('{"var": 1}')).toEqual([]);
  });

  it('accepts nested rules', () => {
    const rule = '{"and": [{"==": [{"var": "a"}, 1]}, {">=": [{"var": "b"}, 10]}]}';
    expect(validateJsonLogic(rule)).toEqual([]);
  });

  it('accepts all standard operators', () => {
    expect(validateJsonLogic('{"if": [true, 1, 0]}')).toEqual([]);
    expect(validateJsonLogic('{"!": [true]}')).toEqual([]);
    expect(validateJsonLogic('{"!!": [0]}')).toEqual([]);
    expect(validateJsonLogic('{"or": [true, false]}')).toEqual([]);
    expect(validateJsonLogic('{"and": [true, true]}')).toEqual([]);
    expect(validateJsonLogic('{"cat": ["a", "b"]}')).toEqual([]);
    expect(validateJsonLogic('{"min": [1, 2, 3]}')).toEqual([]);
    expect(validateJsonLogic('{"max": [1, 2, 3]}')).toEqual([]);
    expect(validateJsonLogic('{"+": [1, 2]}')).toEqual([]);
    expect(validateJsonLogic('{"-": [5, 3]}')).toEqual([]);
    expect(validateJsonLogic('{"*": [2, 3]}')).toEqual([]);
    expect(validateJsonLogic('{"/": [10, 2]}')).toEqual([]);
    expect(validateJsonLogic('{"%": [10, 3]}')).toEqual([]);
    expect(validateJsonLogic('{"merge": [[1], [2]]}')).toEqual([]);
    expect(validateJsonLogic('{"log": "test"}')).toEqual([]);
    expect(validateJsonLogic('{"missing": ["a", "b"]}')).toEqual([]);
    expect(validateJsonLogic('{"missing_some": [1, ["a", "b"]]}')).toEqual([]);
    expect(validateJsonLogic('{"substr": ["hello", 1, 3]}')).toEqual([]);
    expect(validateJsonLogic('{"map": [[1,2], {"+": [{"var": ""}, 1]}]}')).toEqual([]);
    expect(validateJsonLogic('{"filter": [[1,2,3], {">": [{"var": ""}, 1]}]}')).toEqual([]);
    expect(validateJsonLogic('{"all": [[1,2], {">": [{"var": ""}, 0]}]}')).toEqual([]);
    expect(validateJsonLogic('{"some": [[1,2], {">": [{"var": ""}, 1]}]}')).toEqual([]);
    expect(validateJsonLogic('{"none": [[1,2], {"<": [{"var": ""}, 0]}]}')).toEqual([]);
    expect(validateJsonLogic('{"reduce": [[1,2,3], {"+": [{"var": "current"}, {"var": "accumulator"}]}, 0]}')).toEqual([]);
  });

  it('rejects unknown operators', () => {
    const errors = validateJsonLogic('{"foo": [1, 2]}');
    expect(errors.length).toBe(1);
    expect(errors[0].message).toContain('Opérateur inconnu');
    expect(errors[0].message).toContain('foo');
  });

  it('rejects nested unknown operators', () => {
    const errors = validateJsonLogic('{"and": [{"badop": [1]}, {"==": [1, 1]}]}');
    expect(errors.length).toBe(1);
    expect(errors[0].message).toContain('badop');
  });

  it('rejects objects with multiple keys', () => {
    const errors = validateJsonLogic('{"==": [1, 1], ">": [2, 1]}');
    expect(errors.length).toBe(1);
    expect(errors[0].message).toContain('Un seul opérateur');
  });

  it('rejects empty objects', () => {
    const errors = validateJsonLogic('{}');
    expect(errors.length).toBe(1);
    expect(errors[0].message).toContain('Objet vide');
  });

  it('rejects top-level arrays', () => {
    const errors = validateJsonLogic('[1, 2, 3]');
    expect(errors.length).toBe(1);
    expect(errors[0].message).toContain('objet');
  });

  it('returns empty for empty string', () => {
    expect(validateJsonLogic('')).toEqual([]);
  });

  it('returns empty for invalid JSON (defers to JSON linter)', () => {
    expect(validateJsonLogic('{invalid}')).toEqual([]);
  });
});
