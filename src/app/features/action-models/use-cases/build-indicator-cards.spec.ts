import { buildIndicatorCards, BuildIndicatorCardsInput } from './build-indicator-cards';
import { IndicatorModelWithAssociation } from '@domains/action-models/action-model.models';
import { IndicatorModel } from '@domains/indicator-models/indicator-model.models';

const makeAttached = (overrides: Partial<IndicatorModelWithAssociation> = {}): IndicatorModelWithAssociation => ({
  id: 'ind-1',
  name: 'Indicator 1',
  technical_label: 'ind_1',
  type: 'numeric',
  created_at: '2026-01-01T00:00:00Z',
  last_updated_at: '2026-01-01T00:00:00Z',
  hidden_rule: 'false',
  required_rule: 'false',
  disabled_rule: 'false',
  default_value_rule: 'false',
  duplicable_rule: 'false',
  constrained_rule: 'false',
  ...overrides,
} as IndicatorModelWithAssociation);

const makeAvailable = (overrides: Partial<IndicatorModel> = {}): IndicatorModel => ({
  id: 'ind-1',
  name: 'Indicator 1',
  technical_label: 'ind_1_full',
  type: 'numeric',
  status: 'draft',
  created_at: '2026-01-01T00:00:00Z',
  last_updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
} as IndicatorModel);

describe('buildIndicatorCards', () => {
  it('should map basic attached indicator to card data', () => {
    const input: BuildIndicatorCardsInput = {
      attached: [makeAttached()],
      available: [makeAvailable()],
      paramEdits: new Map(),
    };

    const cards = buildIndicatorCards(input);
    expect(cards).toHaveLength(1);
    expect(cards[0].id).toBe('ind-1');
    expect(cards[0].name).toBe('Indicator 1');
    expect(cards[0].technical_label).toBe('ind_1_full');
    expect(cards[0].type).toBe('numeric');
  });

  it('should set all paramHints to off when rules are default', () => {
    const cards = buildIndicatorCards({
      attached: [makeAttached()],
      available: [makeAvailable()],
      paramEdits: new Map(),
    });

    const hints = cards[0].paramHints!;
    expect(hints.visibility).toBe('off');
    expect(hints.required).toBe('off');
    expect(hints.editable).toBe('off');
    expect(hints.defaultValue).toBe('off');
    expect(hints.duplicable).toBe('off');
    expect(hints.constrained).toBe('off');
  });

  it('should set paramHints to on for boolean true rules', () => {
    const cards = buildIndicatorCards({
      attached: [makeAttached({ hidden_rule: 'true', required_rule: 'true' })],
      available: [makeAvailable()],
      paramEdits: new Map(),
    });

    const hints = cards[0].paramHints!;
    expect(hints.visibility).toBe('on');
    expect(hints.required).toBe('on');
  });

  it('should set paramHints to rule for JSON rule values', () => {
    const cards = buildIndicatorCards({
      attached: [makeAttached({ hidden_rule: '{"if": [true]}' })],
      available: [makeAvailable()],
      paramEdits: new Map(),
    });

    expect(cards[0].paramHints!.visibility).toBe('rule');
  });

  it('should apply param edits over server values', () => {
    const edits = new Map([
      ['ind-1', {
        hidden_rule: 'true',
        required_rule: 'true',
        disabled_rule: 'false',
        default_value_rule: 'false',
        duplicable_rule: 'false',
        constrained_rule: 'false',
      }],
    ]);

    const cards = buildIndicatorCards({
      attached: [makeAttached()],
      available: [makeAvailable()],
      paramEdits: edits,
    });

    expect(cards[0].paramHints!.visibility).toBe('on');
    expect(cards[0].paramHints!.required).toBe('on');
  });

  it('should map children with their param hints', () => {
    const attached = makeAttached({
      children: [{
        id: 'child-1',
        name: 'Child Indicator',
        technical_label: 'child_1',
        type: 'text',
        created_at: '2026-01-01T00:00:00Z',
        last_updated_at: '2026-01-01T00:00:00Z',
        hidden_rule: 'true',
        required_rule: 'false',
        disabled_rule: 'false',
        default_value_rule: 'false',
        duplicable_rule: 'false',
        constrained_rule: 'false',
      } as any],
    });

    const cards = buildIndicatorCards({
      attached: [attached],
      available: [makeAvailable()],
      paramEdits: new Map(),
    });

    expect(cards[0].children).toHaveLength(1);
    expect(cards[0].children![0].id).toBe('child-1');
    expect(cards[0].children![0].paramHints!.visibility).toBe('on');
  });

  it('should return empty array for empty attached', () => {
    const cards = buildIndicatorCards({
      attached: [],
      available: [],
      paramEdits: new Map(),
    });
    expect(cards).toEqual([]);
  });

  it('should omit children when empty', () => {
    const cards = buildIndicatorCards({
      attached: [makeAttached({ children: [] })],
      available: [makeAvailable()],
      paramEdits: new Map(),
    });
    expect(cards[0].children).toBeUndefined();
  });
});
