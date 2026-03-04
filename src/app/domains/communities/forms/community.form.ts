import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommunityRead } from '../community.models';

export function createCommunityForm(fb: FormBuilder, initial?: Partial<CommunityRead>): FormGroup {
  return fb.group({
    name: [initial?.name ?? '', Validators.required],
    siret: [initial?.siret ?? '', [Validators.required, Validators.pattern(/^\d{14}$/)]],
    public_comment: [initial?.public_comment ?? null as string | null],
    internal_comment: [initial?.internal_comment ?? null as string | null],
  });
}
