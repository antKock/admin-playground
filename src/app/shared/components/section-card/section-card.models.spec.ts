import { sectionParamsToHints } from './section-card.models';
import { SectionParams } from './section-params-editor.component';

describe('sectionParamsToHints', () => {
  const defaultParams: SectionParams = {
    hidden_rule: 'false',
    required_rule: 'false',
    disabled_rule: 'false',
    occurrence_rule: { min: 'false', max: 'false' },
    constrained_rule: 'false',
  };

  it('should return all off for default params', () => {
    const hints = sectionParamsToHints(defaultParams);
    expect(hints.visibility).toBe('off');
    expect(hints.required).toBe('off');
    expect(hints.editable).toBe('off');
    expect(hints.defaultValue).toBe('off');
    expect(hints.occurrence).toBe('off');
    expect(hints.constrained).toBe('off');
  });

  it('should return "on" for true boolean overrides', () => {
    const hints = sectionParamsToHints({
      ...defaultParams,
      hidden_rule: 'true',
      required_rule: 'true',
      disabled_rule: 'true',
      constrained_rule: 'true',
    });
    expect(hints.visibility).toBe('on');
    expect(hints.required).toBe('on');
    expect(hints.editable).toBe('on');
    expect(hints.constrained).toBe('on');
  });

  it('should return "rule" for JSONLogic custom values', () => {
    const hints = sectionParamsToHints({
      ...defaultParams,
      hidden_rule: '{"if": [true]}',
      constrained_rule: '{"gte": 5}',
    });
    expect(hints.visibility).toBe('rule');
    expect(hints.constrained).toBe('rule');
  });

  it('should return "on" for occurrence with true min', () => {
    const hints = sectionParamsToHints({
      ...defaultParams,
      occurrence_rule: { min: 'true', max: 'false' },
    });
    expect(hints.occurrence).toBe('on');
  });

  it('should return "on" for occurrence with true max', () => {
    const hints = sectionParamsToHints({
      ...defaultParams,
      occurrence_rule: { min: 'false', max: 'true' },
    });
    expect(hints.occurrence).toBe('on');
  });

  it('should return "rule" for occurrence with JSONLogic min', () => {
    const hints = sectionParamsToHints({
      ...defaultParams,
      occurrence_rule: { min: '{"gte": 2}', max: 'false' },
    });
    expect(hints.occurrence).toBe('rule');
  });

  it('should return "rule" for occurrence with JSONLogic max', () => {
    const hints = sectionParamsToHints({
      ...defaultParams,
      occurrence_rule: { min: 'true', max: '{"lte": 5}' },
    });
    expect(hints.occurrence).toBe('rule');
  });

  it('should always return "off" for defaultValue (sections have no default_value_rule)', () => {
    const hints = sectionParamsToHints({
      ...defaultParams,
      hidden_rule: 'true',
    });
    expect(hints.defaultValue).toBe('off');
  });
});
