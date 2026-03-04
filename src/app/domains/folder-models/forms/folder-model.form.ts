import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

import { FolderModel } from '../folder-model.models';

export function createFolderModelForm(
  fb: FormBuilder,
  initial?: Partial<FolderModel>,
): FormGroup {
  return fb.group({
    name: [initial?.name ?? '', Validators.required],
    description: [initial?.description ?? null as string | null],
    funding_program_ids: new FormControl<string[]>([], { validators: Validators.required }),
  });
}
