import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { Site } from '../site.models';

export function createSiteForm(
  fb: FormBuilder,
  initial?: Partial<Site>,
): FormGroup {
  return fb.group({
    name: [initial?.name ?? '', Validators.required],
    siren: [initial?.siren ?? '', [Validators.required, Validators.pattern(/^[0-9]{9}$/)]],
    usage: [initial?.usage ?? null as string | null],
    external_id: [initial?.external_id ?? null as string | null],
    community_id: [initial?.community_id ?? '', Validators.required],
  });
}
