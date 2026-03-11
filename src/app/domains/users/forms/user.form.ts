import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { UserRead } from '../user.models';

export function createUserForm(
  fb: FormBuilder,
  initial?: Partial<UserRead>,
  isEdit = false,
): FormGroup {
  const group: Record<string, unknown> = {
    email: [initial?.email ?? '', [Validators.required, Validators.email]],
    first_name: [initial?.first_name ?? '', Validators.required],
    last_name: [initial?.last_name ?? '', Validators.required],
    is_active: [initial?.is_active ?? true],
    role: [initial?.role ?? null, Validators.required],
  };
  if (!isEdit) {
    group['password'] = ['', Validators.required];
  }
  return fb.group(group);
}
