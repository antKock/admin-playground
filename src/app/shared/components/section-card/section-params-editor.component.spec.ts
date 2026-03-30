import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SectionParamsEditorComponent, SectionParams } from './section-params-editor.component';

describe('SectionParamsEditorComponent', () => {
  let component: SectionParamsEditorComponent;
  let fixture: ComponentFixture<SectionParamsEditorComponent>;

  const defaultParams: SectionParams = {
    hidden_rule: 'false',
    required_rule: 'false',
    disabled_rule: 'false',
    occurrence_rule: { min: 'false', max: 'false' },
    constrained_rule: 'false',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SectionParamsEditorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SectionParamsEditorComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('params', defaultParams);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should render all 5 toggle rows', () => {
    fixture.detectChanges();
    const toggles = fixture.nativeElement.querySelectorAll('app-toggle-row');
    expect(toggles.length).toBe(5);
  });

  it('should emit paramsChange with toggled field when toggle is activated', () => {
    fixture.detectChanges();

    let emitted: SectionParams | undefined;
    component.paramsChange.subscribe((p) => (emitted = p));

    component.onToggle('hidden_rule', true);

    expect(emitted).toBeDefined();
    expect(emitted!.hidden_rule).toBe('true');
    expect(emitted!.required_rule).toBe('false');
  });

  it('should emit paramsChange with false when toggle is deactivated', () => {
    fixture.componentRef.setInput('params', { ...defaultParams, hidden_rule: 'true' });
    fixture.detectChanges();

    let emitted: SectionParams | undefined;
    component.paramsChange.subscribe((p) => (emitted = p));

    component.onToggle('hidden_rule', false);

    expect(emitted!.hidden_rule).toBe('false');
  });

  it('should detect overridden rules', () => {
    expect(component.isOverridden('false')).toBe(false);
    expect(component.isOverridden('true')).toBe(true);
    expect(component.isOverridden('{"if": [true]}')).toBe(true);
  });

  it('should detect occurrence overridden when min is active', () => {
    fixture.componentRef.setInput('params', {
      ...defaultParams,
      occurrence_rule: { min: 'true', max: 'false' },
    });
    fixture.detectChanges();
    expect(component.isOccurrenceOverridden()).toBe(true);
  });

  it('should detect occurrence overridden when max is active', () => {
    fixture.componentRef.setInput('params', {
      ...defaultParams,
      occurrence_rule: { min: 'false', max: '{"if": [true]}' },
    });
    fixture.detectChanges();
    expect(component.isOccurrenceOverridden()).toBe(true);
  });

  it('should not detect occurrence overridden when both are false', () => {
    fixture.detectChanges();
    expect(component.isOccurrenceOverridden()).toBe(false);
  });

  it('should emit occurrence_rule with defaults when toggle is activated', () => {
    fixture.detectChanges();

    let emitted: SectionParams | undefined;
    component.paramsChange.subscribe((p) => (emitted = p));

    component.onOccurrenceToggle(true);

    expect(emitted!.occurrence_rule).toEqual({ min: 'true', max: 'false' });
  });

  it('should emit occurrence_rule as false/false when toggle is deactivated', () => {
    fixture.componentRef.setInput('params', {
      ...defaultParams,
      occurrence_rule: { min: 'true', max: 'true' },
    });
    fixture.detectChanges();

    let emitted: SectionParams | undefined;
    component.paramsChange.subscribe((p) => (emitted = p));

    component.onOccurrenceToggle(false);

    expect(emitted!.occurrence_rule).toEqual({ min: 'false', max: 'false' });
  });

  it('should restore saved custom occurrence rules on re-enable', () => {
    fixture.componentRef.setInput('params', {
      ...defaultParams,
      occurrence_rule: { min: '{"gte": 2}', max: '{"lte": 5}' },
    });
    fixture.detectChanges();

    let emitted: SectionParams | undefined;
    component.paramsChange.subscribe((p) => (emitted = p));

    // Disable — saves custom rules
    component.onOccurrenceToggle(false);
    expect(emitted!.occurrence_rule).toEqual({ min: 'false', max: 'false' });

    // Re-enable — restores saved custom rules
    component.onOccurrenceToggle(true);
    expect(emitted!.occurrence_rule).toEqual({ min: '{"gte": 2}', max: '{"lte": 5}' });
  });

  it('should emit updated min on onOccurrenceMinChange', () => {
    fixture.componentRef.setInput('params', {
      ...defaultParams,
      occurrence_rule: { min: 'true', max: 'false' },
    });
    fixture.detectChanges();

    let emitted: SectionParams | undefined;
    component.paramsChange.subscribe((p) => (emitted = p));

    component.onOccurrenceMinChange('{"gte": 3}');

    expect(emitted!.occurrence_rule).toEqual({ min: '{"gte": 3}', max: 'false' });
  });

  it('should emit updated max on onOccurrenceMaxChange', () => {
    fixture.componentRef.setInput('params', {
      ...defaultParams,
      occurrence_rule: { min: 'true', max: 'false' },
    });
    fixture.detectChanges();

    let emitted: SectionParams | undefined;
    component.paramsChange.subscribe((p) => (emitted = p));

    component.onOccurrenceMaxChange('{"lte": 10}');

    expect(emitted!.occurrence_rule).toEqual({ min: 'true', max: '{"lte": 10}' });
  });

  it('should default to true when onOccurrenceMinChange receives empty string', () => {
    fixture.componentRef.setInput('params', {
      ...defaultParams,
      occurrence_rule: { min: '{"gte": 3}', max: 'false' },
    });
    fixture.detectChanges();

    let emitted: SectionParams | undefined;
    component.paramsChange.subscribe((p) => (emitted = p));

    component.onOccurrenceMinChange('');

    expect(emitted!.occurrence_rule.min).toBe('true');
  });
});
