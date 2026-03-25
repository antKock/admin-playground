import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IndicatorCardComponent, IndicatorCardData, IndicatorParams, isRuleOverridden } from './indicator-card.component';

describe('IndicatorCardComponent', () => {
  let component: IndicatorCardComponent;
  let fixture: ComponentFixture<IndicatorCardComponent>;

  const mockIndicator: IndicatorCardData = {
    id: 'ind-1',
    name: 'Test Indicator',
    technical_label: 'test_ind',
    type: 'number',
    paramHints: {
      visibility: 'off',
      required: 'off',
      editable: 'off',
      defaultValue: 'off',
      occurrence: 'off',
      constrained: 'off',
    },
  };

  const mockParams: IndicatorParams = {
    hidden_rule: null,
    required_rule: null,
    disabled_rule: null,
    default_value_rule: null,
    occurrence_rule: null,
    constrained_rule: null,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IndicatorCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(IndicatorCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('indicator', mockIndicator);
    fixture.componentRef.setInput('params', mockParams);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display indicator name', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Test Indicator');
  });

  it('should display technical label', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('test_ind');
  });

  it('should start collapsed', () => {
    expect(component.expanded()).toBe(false);
  });

  it('should toggle expansion on click', () => {
    fixture.detectChanges();
    component.expanded.set(true);
    fixture.detectChanges();

    expect(component.expanded()).toBe(true);
  });

  it('should emit remove event on remove button click', () => {
    fixture.detectChanges();
    const removeSpy = vi.fn();
    component.remove.subscribe(removeSpy);

    const removeBtn = fixture.nativeElement.querySelector('.remove-indicator-btn');
    removeBtn.click();

    expect(removeSpy).toHaveBeenCalledWith('ind-1');
  });

  it('should emit null when toggling hidden OFF (no override)', () => {
    const changeSpy = vi.fn();
    component.paramsChange.subscribe(changeSpy);

    component.onHiddenToggle(false);

    expect(changeSpy).toHaveBeenCalledWith(expect.objectContaining({ hidden_rule: null }));
  });

  it('should emit "true" when toggling hidden ON (override: hide)', () => {
    const changeSpy = vi.fn();
    component.paramsChange.subscribe(changeSpy);

    component.onHiddenToggle(true);

    expect(changeSpy).toHaveBeenCalledWith(expect.objectContaining({ hidden_rule: 'true' }));
  });

  it('should emit "true" when toggling required ON (override: required)', () => {
    const changeSpy = vi.fn();
    component.paramsChange.subscribe(changeSpy);

    component.onRequiredToggle(true);

    expect(changeSpy).toHaveBeenCalledWith(expect.objectContaining({ required_rule: 'true' }));
  });

  it('should emit null when toggling required OFF (no override)', () => {
    const changeSpy = vi.fn();
    component.paramsChange.subscribe(changeSpy);

    component.onRequiredToggle(false);

    expect(changeSpy).toHaveBeenCalledWith(expect.objectContaining({ required_rule: null }));
  });

  it('should emit "true" when toggling disabled ON (override: non-editable)', () => {
    const changeSpy = vi.fn();
    component.paramsChange.subscribe(changeSpy);

    component.onDisabledToggle(true);

    expect(changeSpy).toHaveBeenCalledWith(expect.objectContaining({ disabled_rule: 'true' }));
  });

  it('should emit null when toggling disabled OFF (no override)', () => {
    const changeSpy = vi.fn();
    component.paramsChange.subscribe(changeSpy);

    component.onDisabledToggle(false);

    expect(changeSpy).toHaveBeenCalledWith(expect.objectContaining({ disabled_rule: null }));
  });

  it('should emit paramsChange with occurrence_rule on toggle', () => {
    const changeSpy = vi.fn();
    component.paramsChange.subscribe(changeSpy);

    component.onOccurrenceToggle(true);

    expect(changeSpy).toHaveBeenCalledWith(
      expect.objectContaining({ occurrence_rule: { min: 'true', max: 'false' } }),
    );
  });

  it('should emit paramsChange with null occurrence_rule on toggle off', () => {
    const changeSpy = vi.fn();
    component.paramsChange.subscribe(changeSpy);

    component.onOccurrenceToggle(false);

    expect(changeSpy).toHaveBeenCalledWith(
      expect.objectContaining({ occurrence_rule: null }),
    );
  });

  it('should emit paramsChange with constrained_rule "true" on toggle', () => {
    const changeSpy = vi.fn();
    component.paramsChange.subscribe(changeSpy);

    component.onConstrainedToggle(true);

    expect(changeSpy).toHaveBeenCalledWith(
      expect.objectContaining({ constrained_rule: 'true' }),
    );
  });

  it('should show unsaved class when modified', () => {
    fixture.componentRef.setInput('modified', true);
    fixture.detectChanges();

    const card = fixture.nativeElement.querySelector('.unsaved');
    expect(card).toBeTruthy();
  });

  it('should emit paramsChange with empty string on default value toggle on', () => {
    const changeSpy = vi.fn();
    component.paramsChange.subscribe(changeSpy);

    component.onDefaultValueToggle(true);

    expect(changeSpy).toHaveBeenCalledWith(expect.objectContaining({ default_value_rule: '' }));
  });

  it('should emit paramsChange with null on default value toggle off', () => {
    const changeSpy = vi.fn();
    component.paramsChange.subscribe(changeSpy);

    component.onDefaultValueToggle(false);

    expect(changeSpy).toHaveBeenCalledWith(expect.objectContaining({ default_value_rule: null }));
  });

  it('should preserve and restore JSONLogic rule across toggle cycle', () => {
    // Start with a custom JSONLogic rule on required
    const paramsWithRule: IndicatorParams = {
      ...mockParams,
      required_rule: '{"if": [{"var": "x"}, true, false]}',
    };
    fixture.componentRef.setInput('params', paramsWithRule);

    const changeSpy = vi.fn();
    component.paramsChange.subscribe(changeSpy);

    // Toggle OFF — should save the rule and emit null
    component.onRequiredToggle(false);
    expect(changeSpy).toHaveBeenCalledWith(expect.objectContaining({ required_rule: null }));

    // Toggle ON again — should restore the saved rule
    changeSpy.mockClear();
    component.onRequiredToggle(true);
    expect(changeSpy).toHaveBeenCalledWith(
      expect.objectContaining({ required_rule: '{"if": [{"var": "x"}, true, false]}' }),
    );
  });
});

describe('isRuleOverridden', () => {
  it('should return false for null (no override)', () => {
    expect(isRuleOverridden('required_rule', null)).toBe(false);
    expect(isRuleOverridden('disabled_rule', null)).toBe(false);
    expect(isRuleOverridden('hidden_rule', null)).toBe(false);
    expect(isRuleOverridden('constrained_rule', null)).toBe(false);
  });

  it('should return false for backend string defaults', () => {
    expect(isRuleOverridden('required_rule', 'false')).toBe(false);
    expect(isRuleOverridden('disabled_rule', 'false')).toBe(false);
    expect(isRuleOverridden('hidden_rule', 'false')).toBe(false);
    expect(isRuleOverridden('constrained_rule', 'false')).toBe(false);
  });

  it('should return true for active overrides', () => {
    expect(isRuleOverridden('required_rule', 'true')).toBe(true);
    expect(isRuleOverridden('disabled_rule', 'true')).toBe(true);
    expect(isRuleOverridden('hidden_rule', 'true')).toBe(true);
    expect(isRuleOverridden('constrained_rule', 'true')).toBe(true);
  });

  it('should return true for JSONLogic rules', () => {
    expect(isRuleOverridden('required_rule', '{"if": [true]}')).toBe(true);
    expect(isRuleOverridden('constrained_rule', '{"if": [true]}')).toBe(true);
  });
});
