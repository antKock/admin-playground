/* eslint-disable @typescript-eslint/no-explicit-any */
import { FormBuilder } from '@angular/forms';
import { createActionThemeForm } from './action-theme.form';

describe('createActionThemeForm', () => {
  const fb = new FormBuilder();

  it('should create the form with correct controls', () => {
    const form = createActionThemeForm(fb);
    expect(form.get('name')).toBeTruthy();
    expect(form.get('technical_label')).toBeTruthy();
    expect(form.get('description')).toBeTruthy();
    expect(form.get('icon')).toBeTruthy();
    expect(form.get('color')).toBeTruthy();
  });

  it('should have required validators', () => {
    const form = createActionThemeForm(fb);
    form.get('name')!.setValue('');
    form.get('technical_label')!.setValue('');
    expect(form.valid).toBe(false);
  });

  it('should be valid with minimum required data', () => {
    const form = createActionThemeForm(fb);
    form.get('name')!.setValue('Theme A');
    form.get('technical_label')!.setValue('theme_a');
    expect(form.valid).toBe(true);
  });

  it('should accept optional fields as null', () => {
    const form = createActionThemeForm(fb);
    form.get('name')!.setValue('Theme A');
    form.get('technical_label')!.setValue('theme_a');
    form.get('description')!.setValue(null);
    form.get('icon')!.setValue(null);
    form.get('color')!.setValue(null);
    expect(form.valid).toBe(true);
  });

  it('should pre-populate from initial value', () => {
    const form = createActionThemeForm(fb, {
      name: 'Energy',
      technical_label: 'energy',
      description: 'Energy theme',
      icon: 'bolt',
      color: '#ff0000',
    } as any);
    expect(form.get('name')!.value).toBe('Energy');
    expect(form.get('technical_label')!.value).toBe('energy');
    expect(form.get('description')!.value).toBe('Energy theme');
    expect(form.get('icon')!.value).toBe('bolt');
    expect(form.get('color')!.value).toBe('#ff0000');
  });
});
