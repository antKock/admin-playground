import { FormBuilder } from '@angular/forms';
import { createActionModelForm } from './action-model.form';

describe('createActionModelForm', () => {
  const fb = new FormBuilder();

  it('should create the form with correct controls', () => {
    const form = createActionModelForm(fb);
    expect(form.get('name')).toBeTruthy();
    expect(form.get('description')).toBeTruthy();
    expect(form.get('funding_program_id')).toBeTruthy();
    expect(form.get('action_theme_id')).toBeTruthy();
  });

  it('should have required validators', () => {
    const form = createActionModelForm(fb);
    form.get('name')!.setValue('');
    form.get('funding_program_id')!.setValue('');
    form.get('action_theme_id')!.setValue('');
    expect(form.valid).toBe(false);
  });

  it('should be valid with minimum required data', () => {
    const form = createActionModelForm(fb);
    form.get('name')!.setValue('Test Action');
    form.get('funding_program_id')!.setValue('fp-1');
    form.get('action_theme_id')!.setValue('at-1');
    expect(form.valid).toBe(true);
  });

  it('should accept optional fields as null', () => {
    const form = createActionModelForm(fb);
    form.get('name')!.setValue('Test Action');
    form.get('funding_program_id')!.setValue('fp-1');
    form.get('action_theme_id')!.setValue('at-1');
    form.get('description')!.setValue(null);
    expect(form.valid).toBe(true);
  });

  it('should pre-populate from initial value', () => {
    const form = createActionModelForm(fb, {
      name: 'My Action',
      funding_program_id: 'fp-123',
      action_theme_id: 'at-456',
      description: 'A description',
    } as any);
    expect(form.get('name')!.value).toBe('My Action');
    expect(form.get('funding_program_id')!.value).toBe('fp-123');
    expect(form.get('action_theme_id')!.value).toBe('at-456');
    expect(form.get('description')!.value).toBe('A description');
  });
});
