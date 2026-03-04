import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { ActionModel } from '../action-model.models';

export function createActionModelForm(
  fb: FormBuilder,
  initial?: Partial<ActionModel>,
): FormGroup {
  return fb.group({
    name: [initial?.name ?? '', Validators.required],
    description: [initial?.description ?? null as string | null],
    funding_program_id: [initial?.funding_program_id ?? '', Validators.required],
    action_theme_id: [initial?.action_theme_id ?? '', Validators.required],
  });
}
