import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IndicatorPickerComponent, IndicatorOption } from './indicator-picker.component';

describe('IndicatorPickerComponent', () => {
  let component: IndicatorPickerComponent;
  let fixture: ComponentFixture<IndicatorPickerComponent>;

  const mockOptions: IndicatorOption[] = [
    { id: '1', name: 'Energy Use', technical_label: 'energy_use', type: 'number' },
    { id: '2', name: 'Description', technical_label: 'desc', type: 'text' },
    { id: '3', name: 'CO2 Emissions', technical_label: 'co2', type: 'number' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IndicatorPickerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(IndicatorPickerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('options', mockOptions);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show attach CTA when closed', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Attach indicator');
  });

  it('should open picker on CTA click', () => {
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');
    button.click();
    fixture.detectChanges();

    expect(component.isOpen()).toBe(true);
    expect(fixture.nativeElement.querySelector('input[placeholder="Search indicators..."]')).toBeTruthy();
  });

  it('should filter options by search term', () => {
    component.open();
    component.searchTerm.set('energy');

    expect(component.filtered().length).toBe(1);
    expect(component.filtered()[0].name).toBe('Energy Use');
  });

  it('should filter by technical_label', () => {
    component.open();
    component.searchTerm.set('co2');

    expect(component.filtered().length).toBe(1);
    expect(component.filtered()[0].name).toBe('CO2 Emissions');
  });

  it('should dim already-attached items', () => {
    fixture.componentRef.setInput('attachedIds', ['1']);
    component.open();
    fixture.detectChanges();

    expect(component.isAttached('1')).toBe(true);
    expect(component.isAttached('2')).toBe(false);
  });

  it('should emit attach event and close on selection', () => {
    const attachSpy = vi.fn();
    component.attach.subscribe(attachSpy);

    component.onAttach(mockOptions[1]);

    expect(attachSpy).toHaveBeenCalledWith(mockOptions[1]);
    expect(component.isOpen()).toBe(false);
  });

  it('should close on close button click', () => {
    component.open();
    expect(component.isOpen()).toBe(true);

    component.close();
    expect(component.isOpen()).toBe(false);
  });
});
