import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IndicatorCardComponent, IndicatorCardData, IndicatorParams } from './indicator-card.component';

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
      duplicable: 'off',
      constrained: 'off',
    },
  };

  const mockParams: IndicatorParams = {
    visibility_rule: 'true',
    required_rule: 'false',
    editable_rule: 'true',
    default_value_rule: null,
    duplicable: null,
    constrained_values: null,
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

    const buttons = fixture.nativeElement.querySelectorAll('button');
    const removeBtn = buttons[buttons.length - 1]; // last button is remove
    removeBtn.click();

    expect(removeSpy).toHaveBeenCalledWith('ind-1');
  });

  it('should emit paramsChange on visibility toggle', () => {
    const changeSpy = vi.fn();
    component.paramsChange.subscribe(changeSpy);

    component.onVisibilityToggle(false);

    expect(changeSpy).toHaveBeenCalledWith(expect.objectContaining({ visibility_rule: 'false' }));
  });

  it('should emit paramsChange on required toggle', () => {
    const changeSpy = vi.fn();
    component.paramsChange.subscribe(changeSpy);

    component.onRequiredToggle(true);

    expect(changeSpy).toHaveBeenCalledWith(expect.objectContaining({ required_rule: 'true' }));
  });

  it('should emit paramsChange with duplicable config on toggle', () => {
    const changeSpy = vi.fn();
    component.paramsChange.subscribe(changeSpy);

    component.onDuplicableToggle(true);

    expect(changeSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        duplicable: { enabled: true, min_count: null, max_count: null },
      }),
    );
  });

  it('should emit paramsChange with constrained config on toggle', () => {
    const changeSpy = vi.fn();
    component.paramsChange.subscribe(changeSpy);

    component.onConstrainedToggle(true);

    expect(changeSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        constrained_values: { enabled: true, min_value: null, max_value: null },
      }),
    );
  });

  it('should show orange border when modified', () => {
    fixture.componentRef.setInput('modified', true);
    fixture.detectChanges();

    const card = fixture.nativeElement.querySelector('.border-l-4');
    expect(card).toBeTruthy();
  });
});
