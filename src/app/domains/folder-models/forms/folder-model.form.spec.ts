import { FormBuilder } from '@angular/forms';
import { createFolderModelForm } from './folder-model.form';

describe('createFolderModelForm', () => {
  const fb = new FormBuilder();

  it('should create form with funding_program_ids field', () => {
    const form = createFolderModelForm(fb);
    expect(form.get('funding_program_ids')).toBeTruthy();
    expect(form.get('funding_program_ids')!.value).toEqual([]);
  });

  it('should not require funding_program_ids', () => {
    const form = createFolderModelForm(fb);
    const ctrl = form.get('funding_program_ids')!;
    ctrl.setValue([]);
    expect(ctrl.valid).toBe(true);
  });

  it('should require name', () => {
    const form = createFolderModelForm(fb);
    const ctrl = form.get('name')!;
    ctrl.setValue('');
    expect(ctrl.valid).toBe(false);
    ctrl.setValue('Test');
    expect(ctrl.valid).toBe(true);
  });
});
