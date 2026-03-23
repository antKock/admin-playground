/* eslint-disable @typescript-eslint/no-explicit-any */
import { FormBuilder } from '@angular/forms';
import { createBuildingForm } from './building.form';

describe('createBuildingForm', () => {
  const fb = new FormBuilder();

  it('should create the form with correct controls', () => {
    const form = createBuildingForm(fb);
    expect(form.get('name')).toBeTruthy();
    expect(form.get('usage')).toBeTruthy();
    expect(form.get('external_id')).toBeTruthy();
    expect(form.get('site_id')).toBeTruthy();
  });

  it('should have required validators', () => {
    const form = createBuildingForm(fb);
    form.get('name')!.setValue('');
    form.get('site_id')!.setValue('');
    expect(form.valid).toBe(false);
  });

  it('should be valid with minimum required data', () => {
    const form = createBuildingForm(fb);
    form.get('name')!.setValue('Building A');
    form.get('site_id')!.setValue('site-1');
    expect(form.valid).toBe(true);
  });

  it('should accept optional fields as null', () => {
    const form = createBuildingForm(fb);
    form.get('name')!.setValue('Building A');
    form.get('site_id')!.setValue('site-1');
    form.get('usage')!.setValue(null);
    form.get('external_id')!.setValue(null);
    expect(form.valid).toBe(true);
  });

  it('should pre-populate from initial value', () => {
    const form = createBuildingForm(fb, {
      name: 'Main Office',
      site_id: 'site-99',
      usage: 'office',
      external_id: 'ext-001',
    } as any);
    expect(form.get('name')!.value).toBe('Main Office');
    expect(form.get('site_id')!.value).toBe('site-99');
    expect(form.get('usage')!.value).toBe('office');
    expect(form.get('external_id')!.value).toBe('ext-001');
  });
});
