import { FormBuilder, FormGroup, Validators } from '@angular/forms';

export function createAgentForm(fb: FormBuilder): FormGroup {
  return fb.group({
    first_name: [null as string | null],
    last_name: [null as string | null],
    email: [null as string | null, [Validators.required, Validators.email]],
    phone: [null as string | null],
    position: [null as string | null],
    agent_type: ['', Validators.required],
    community_id: ['', Validators.required],
    public_comment: [null as string | null],
    internal_comment: [null as string | null],
  });
}
