import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { Building } from '../building.models';

export function createBuildingForm(
  fb: FormBuilder,
  initial?: Partial<Building>,
): FormGroup {
  return fb.group({
    name: [initial?.name ?? '', Validators.required],
    usage: [initial?.usage ?? null as string | null],
    external_id: [initial?.external_id ?? null as string | null],
    site_id: [initial?.site_id ?? '', Validators.required],
  });
}
