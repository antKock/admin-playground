import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { IndicatorModel } from '../indicator-model.models';

export function createIndicatorModelForm(
  fb: FormBuilder,
  initial?: Partial<IndicatorModel>,
): FormGroup {
  return fb.group({
    name: [initial?.name ?? '', Validators.required],
    technical_label: [initial?.technical_label ?? '', Validators.required],
    description: [initial?.description ?? null as string | null],
    type: [initial?.type ?? '', Validators.required],
    unit: [initial?.unit ?? null as string | null],
  });
}
