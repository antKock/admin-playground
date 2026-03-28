import { buildSectionAssociationInputs } from './build-section-association-inputs';
import { components } from '@app/core/api/generated/api-types';

type SectionIndicatorModelRead = components['schemas']['SectionIndicatorModelRead'];

const makeIndicator = (overrides: Partial<SectionIndicatorModelRead> = {}): SectionIndicatorModelRead => ({
  id: 'sec-ind-1',
  name: 'Indicator 1',
  technical_label: 'ind_1',
  type: 'number',
  created_at: '2026-01-01T00:00:00Z',
  last_updated_at: '2026-01-01T00:00:00Z',
  hidden_rule: 'false',
  required_rule: 'false',
  disabled_rule: 'false',
  default_value_rule: 'false',
  occurrence_min_rule: 'false',
  occurrence_max_rule: 'false',
  constrained_rule: 'false',
  position: 0,
  ...overrides,
});

describe('buildSectionAssociationInputs', () => {
  it('should map indicators to association inputs', () => {
    const inputs = buildSectionAssociationInputs([makeIndicator()]);

    expect(inputs).toHaveLength(1);
    expect(inputs[0].indicator_model_id).toBe('sec-ind-1');
    expect(inputs[0].position).toBe(0);
    expect(inputs[0].hidden_rule).toBe('false');
  });

  it('should preserve rule values', () => {
    const inputs = buildSectionAssociationInputs([
      makeIndicator({ hidden_rule: 'true', required_rule: '{"if": [true]}' }),
    ]);

    expect(inputs[0].hidden_rule).toBe('true');
    expect(inputs[0].required_rule).toBe('{"if": [true]}');
  });

  it('should assign sequential positions', () => {
    const inputs = buildSectionAssociationInputs([
      makeIndicator({ id: 'ind-1' }),
      makeIndicator({ id: 'ind-2' }),
    ]);

    expect(inputs[0].position).toBe(0);
    expect(inputs[1].position).toBe(1);
  });

  it('should return empty array for empty input', () => {
    expect(buildSectionAssociationInputs([])).toEqual([]);
  });

  it('should flatten children after their parent', () => {
    const inputs = buildSectionAssociationInputs([
      makeIndicator({
        id: 'parent-1',
        children: [
          { id: 'child-1', name: 'C1', technical_label: 'c1', type: 'number', created_at: '', last_updated_at: '', hidden_rule: 'false', required_rule: 'true', disabled_rule: 'false', default_value_rule: 'false', occurrence_min_rule: 'false', occurrence_max_rule: 'false', constrained_rule: 'false' },
        ],
      }),
    ]);

    expect(inputs).toHaveLength(2);
    expect(inputs[0].indicator_model_id).toBe('parent-1');
    expect(inputs[0].position).toBe(0);
    expect(inputs[1].indicator_model_id).toBe('child-1');
    expect(inputs[1].position).toBe(1);
    expect(inputs[1].required_rule).toBe('true');
  });

  it('should apply param edits to children', () => {
    const paramEdits = new Map([
      ['parent-1:child-1', { hidden_rule: 'true', required_rule: null, disabled_rule: null, default_value_rule: null, occurrence_rule: null, constrained_rule: null }],
    ]);
    const inputs = buildSectionAssociationInputs([
      makeIndicator({
        id: 'parent-1',
        children: [
          { id: 'child-1', name: 'C1', technical_label: 'c1', type: 'number', created_at: '', last_updated_at: '', hidden_rule: 'false', required_rule: 'false', disabled_rule: 'false', default_value_rule: 'false', occurrence_min_rule: 'false', occurrence_max_rule: 'false', constrained_rule: 'false' },
        ],
      }),
    ], paramEdits);

    expect(inputs[1].indicator_model_id).toBe('child-1');
    expect(inputs[1].hidden_rule).toBe('true');
  });

  it('should include occurrence rules', () => {
    const inputs = buildSectionAssociationInputs([
      makeIndicator({ occurrence_min_rule: 'true', occurrence_max_rule: '5' }),
    ]);

    expect(inputs[0].occurrence_min_rule).toBe('true');
    expect(inputs[0].occurrence_max_rule).toBe('5');
  });
});
