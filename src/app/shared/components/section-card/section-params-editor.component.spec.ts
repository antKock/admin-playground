import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SectionParamsEditorComponent, SectionParams } from './section-params-editor.component';

describe('SectionParamsEditorComponent', () => {
  let component: SectionParamsEditorComponent;
  let fixture: ComponentFixture<SectionParamsEditorComponent>;

  const defaultParams: SectionParams = {
    hidden_rule: 'false',
    required_rule: 'false',
    disabled_rule: 'false',
    occurrence_min_rule: 'false',
    occurrence_max_rule: 'false',
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
});
