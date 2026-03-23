/* eslint-disable @typescript-eslint/no-explicit-any */
import { FormBuilder } from '@angular/forms';
import { createFundingProgramForm } from './funding-program.form';

describe('createFundingProgramForm', () => {
  const fb = new FormBuilder();

  it('should create form with folder_model_id field', () => {
    const form = createFundingProgramForm(fb);
    expect(form.get('folder_model_id')).toBeTruthy();
    expect(form.get('folder_model_id')!.value).toBeNull();
  });

  it('should include all enriched fields', () => {
    const form = createFundingProgramForm(fb);
    expect(form.get('budget')).toBeTruthy();
    expect(form.get('is_active')).toBeTruthy();
    expect(form.get('start_date')).toBeTruthy();
    expect(form.get('end_date')).toBeTruthy();
    expect(form.get('folder_model_id')).toBeTruthy();
  });

  it('should default is_active to true', () => {
    const form = createFundingProgramForm(fb);
    expect(form.get('is_active')!.value).toBe(true);
  });

  it('should pre-populate folder_model_id from initial value', () => {
    const form = createFundingProgramForm(fb, { folder_model_id: 'fm-123' } as any);
    expect(form.get('folder_model_id')!.value).toBe('fm-123');
  });
});
