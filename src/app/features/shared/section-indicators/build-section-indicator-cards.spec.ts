import { buildSectionIndicatorCards } from './build-section-indicator-cards';
import { components } from '@app/core/api/generated/api-types';

type SectionIndicatorModelRead = components['schemas']['SectionIndicatorModelRead'];
type SectionChildIndicatorModelRead = components['schemas']['SectionChildIndicatorModelRead'];

const makeIndicator = (overrides: Partial<SectionIndicatorModelRead> = {}): SectionIndicatorModelRead => ({
  id: 'sec-ind-1',
  name: 'Section Indicator 1',
  technical_label: 'sec_ind_1',
  type: 'number',
  created_at: '2026-01-01T00:00:00Z',
  last_updated_at: '2026-01-01T00:00:00Z',
  hidden_rule: 'false',
  required_rule: 'false',
  disabled_rule: 'false',
  default_value_rule: 'false',
  occurrence_rule: { min: 'false', max: 'false' },
  constrained_rule: 'false',
  position: 0,
  ...overrides,
});

const makeChild = (overrides: Partial<SectionChildIndicatorModelRead> = {}): SectionChildIndicatorModelRead => ({
  id: 'child-1',
  name: 'Child Indicator',
  technical_label: 'child_1',
  type: 'text_short',
  created_at: '2026-01-01T00:00:00Z',
  last_updated_at: '2026-01-01T00:00:00Z',
  hidden_rule: 'false',
  required_rule: 'false',
  disabled_rule: 'false',
  default_value_rule: 'false',
  occurrence_rule: { min: 'false', max: 'false' },
  constrained_rule: 'false',
  ...overrides,
});

describe('buildSectionIndicatorCards', () => {
  it('should map basic section indicator to card data', () => {
    const cards = buildSectionIndicatorCards([makeIndicator()]);

    expect(cards).toHaveLength(1);
    expect(cards[0].id).toBe('sec-ind-1');
    expect(cards[0].name).toBe('Section Indicator 1');
    expect(cards[0].technical_label).toBe('sec_ind_1');
    expect(cards[0].type).toBe('number');
  });

  it('should set all paramHints to off when rules are default', () => {
    const cards = buildSectionIndicatorCards([makeIndicator()]);
    const hints = cards[0].paramHints;

    expect(hints.visibility).toBe('off');
    expect(hints.required).toBe('off');
    expect(hints.editable).toBe('off');
    expect(hints.defaultValue).toBe('off');
    expect(hints.occurrence).toBe('off');
    expect(hints.constrained).toBe('off');
  });

  it('should set paramHints to on for boolean true rules', () => {
    const cards = buildSectionIndicatorCards([
      makeIndicator({ hidden_rule: 'true', required_rule: 'true' }),
    ]);
    const hints = cards[0].paramHints;

    expect(hints.visibility).toBe('on');
    expect(hints.required).toBe('on');
  });

  it('should set paramHints to rule for JSON rule values', () => {
    const cards = buildSectionIndicatorCards([
      makeIndicator({ hidden_rule: '{"if": [true]}' }),
    ]);

    expect(cards[0].paramHints.visibility).toBe('rule');
  });

  it('should map children with their param hints', () => {
    const cards = buildSectionIndicatorCards([
      makeIndicator({
        children: [makeChild({ hidden_rule: 'true' })],
      }),
    ]);

    expect(cards[0].children).toHaveLength(1);
    expect(cards[0].children![0].id).toBe('child-1');
    expect(cards[0].children![0].name).toBe('Child Indicator');
    expect(cards[0].children![0].paramHints.visibility).toBe('on');
  });

  it('should return empty array for empty input', () => {
    expect(buildSectionIndicatorCards([])).toEqual([]);
  });

  it('should omit children when empty', () => {
    const cards = buildSectionIndicatorCards([makeIndicator({ children: [] })]);
    expect(cards[0].children).toBeUndefined();
  });

  it('should omit children when null', () => {
    const cards = buildSectionIndicatorCards([makeIndicator({ children: null })]);
    expect(cards[0].children).toBeUndefined();
  });
});
