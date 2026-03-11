import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { FundingProgram } from '../funding-program.models';

export function createFundingProgramForm(
  fb: FormBuilder,
  initial?: Partial<FundingProgram>,
): FormGroup {
  return fb.group({
    name: [initial?.name ?? '', Validators.required],
    description: [initial?.description ?? null as string | null],
    budget: [initial?.budget ?? null as number | null],
    is_active: [initial?.is_active ?? true],
    start_date: [initial?.start_date ?? null as string | null],
    end_date: [initial?.end_date ?? null as string | null],
    folder_model_id: [initial?.folder_model_id ?? null as string | null],
  });
}
