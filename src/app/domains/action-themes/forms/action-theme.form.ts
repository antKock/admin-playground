import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { ActionTheme } from '../action-theme.models';

export function createActionThemeForm(
  fb: FormBuilder,
  initial?: Partial<ActionTheme>,
): FormGroup {
  return fb.group({
    name: [initial?.name ?? '', Validators.required],
    technical_label: [initial?.technical_label ?? '', Validators.required],
    description: [initial?.description ?? null as string | null],
    icon: [initial?.icon ?? null as string | null],
    color: [initial?.color ?? null as string | null],
  });
}
