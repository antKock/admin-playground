import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RuleFieldComponent } from './rule-field.component';

describe('RuleFieldComponent', () => {
  let component: RuleFieldComponent;
  let fixture: ComponentFixture<RuleFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RuleFieldComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RuleFieldComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render a textarea', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('textarea')).toBeTruthy();
  });

  it('should return empty string for variables label when empty', () => {
    fixture.detectChanges();
    expect(component.variablesLabel()).toBe('');
  });

  it('should extract variable names from JSONLogic', () => {
    fixture.componentRef.setInput('value', '{"==": [{"var": "mode_chauffe"}, "autre"]}');
    fixture.detectChanges();
    expect(component.variablesLabel()).toBe('Rule references: mode_chauffe');
  });

  it('should extract multiple variables', () => {
    fixture.componentRef.setInput('value', '{"and": [{"==": [{"var": "mode"}, "a"]}, {"==": [{"var": "type"}, "b"]}]}');
    fixture.detectChanges();
    expect(component.variablesLabel()).toBe('Rule references: mode, type');
  });

  it('should show no error initially', () => {
    fixture.detectChanges();
    expect(component.hasError()).toBe(false);
  });

  it('should set error on invalid JSON blur', () => {
    fixture.componentRef.setInput('value', '{invalid json}');
    fixture.detectChanges();
    component.onBlur();
    expect(component.hasError()).toBe(true);
  });

  it('should clear error on valid JSON blur', () => {
    fixture.componentRef.setInput('value', '{"==": [1, 1]}');
    fixture.detectChanges();
    component.onBlur();
    expect(component.hasError()).toBe(false);
  });

  it('should allow empty string without error', () => {
    fixture.componentRef.setInput('value', '');
    fixture.detectChanges();
    component.onBlur();
    expect(component.hasError()).toBe(false);
  });

  it('should emit valueChange on input', () => {
    fixture.detectChanges();
    const changeSpy = vi.fn();
    component.valueChange.subscribe(changeSpy);

    const textarea = fixture.nativeElement.querySelector('textarea');
    textarea.value = '{"var": "test"}';
    textarea.dispatchEvent(new Event('input'));

    expect(changeSpy).toHaveBeenCalledWith('{"var": "test"}');
  });

  it('should show error message when invalid', () => {
    fixture.componentRef.setInput('value', 'not json');
    fixture.detectChanges();
    component.onBlur();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Invalid JSON syntax');
  });
});
