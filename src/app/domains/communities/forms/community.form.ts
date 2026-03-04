import { FormBuilder, FormGroup, Validators } from '@angular/forms';

export function createCommunityForm(fb: FormBuilder): FormGroup {
  return fb.group({
    name: ['', Validators.required],
    siret: ['', [Validators.required, Validators.pattern(/^\d{14}$/)]],
    public_comment: [null as string | null],
    internal_comment: [null as string | null],
  });
}
