/* eslint-disable @typescript-eslint/no-explicit-any */
import { FormBuilder } from '@angular/forms';
import { createIndicatorModelForm } from './indicator-model.form';

describe('createIndicatorModelForm', () => {
  const fb = new FormBuilder();

  it('should create the form with correct controls', () => {
    const form = createIndicatorModelForm(fb);
    expect(form.get('name')).toBeTruthy();
    expect(form.get('technical_label')).toBeTruthy();
    expect(form.get('description')).toBeTruthy();
    expect(form.get('type')).toBeTruthy();
    expect(form.get('unit')).toBeTruthy();
  });

  it('should have required validators', () => {
    const form = createIndicatorModelForm(fb);
    form.get('name')!.setValue('');
    form.get('technical_label')!.setValue('');
    form.get('type')!.setValue('');
    expect(form.valid).toBe(false);
  });

  it('should be valid with minimum required data', () => {
    const form = createIndicatorModelForm(fb);
    form.get('name')!.setValue('CO2 Emissions');
    form.get('technical_label')!.setValue('co2_emissions');
    form.get('type')!.setValue('numeric');
    expect(form.valid).toBe(true);
  });

  it('should accept optional fields as null', () => {
    const form = createIndicatorModelForm(fb);
    form.get('name')!.setValue('CO2 Emissions');
    form.get('technical_label')!.setValue('co2_emissions');
    form.get('type')!.setValue('numeric');
    form.get('description')!.setValue(null);
    form.get('unit')!.setValue(null);
    expect(form.valid).toBe(true);
  });

  it('should pre-populate from initial value', () => {
    const form = createIndicatorModelForm(fb, {
      name: 'Energy Use',
      technical_label: 'energy_use',
      type: 'numeric',
      description: 'Total energy',
      unit: 'kWh',
    } as any);
    expect(form.get('name')!.value).toBe('Energy Use');
    expect(form.get('technical_label')!.value).toBe('energy_use');
    expect(form.get('type')!.value).toBe('numeric');
    expect(form.get('description')!.value).toBe('Total energy');
    expect(form.get('unit')!.value).toBe('kWh');
  });
});
