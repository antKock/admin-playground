import { FormBuilder } from '@angular/forms';
import { createAgentForm } from './agent.form';

describe('createAgentForm', () => {
  const fb = new FormBuilder();

  it('should create the form with correct controls', () => {
    const form = createAgentForm(fb);
    expect(form.get('first_name')).toBeTruthy();
    expect(form.get('last_name')).toBeTruthy();
    expect(form.get('email')).toBeTruthy();
    expect(form.get('phone')).toBeTruthy();
    expect(form.get('position')).toBeTruthy();
    expect(form.get('agent_type')).toBeTruthy();
    expect(form.get('community_id')).toBeTruthy();
    expect(form.get('public_comment')).toBeTruthy();
    expect(form.get('internal_comment')).toBeTruthy();
  });

  it('should have required validators', () => {
    const form = createAgentForm(fb);
    form.get('email')!.setValue(null);
    form.get('agent_type')!.setValue('');
    form.get('community_id')!.setValue('');
    expect(form.valid).toBe(false);
  });

  it('should be valid with minimum required data', () => {
    const form = createAgentForm(fb);
    form.get('email')!.setValue('agent@example.com');
    form.get('agent_type')!.setValue('internal');
    form.get('community_id')!.setValue('comm-1');
    expect(form.valid).toBe(true);
  });

  it('should accept optional fields as null', () => {
    const form = createAgentForm(fb);
    form.get('email')!.setValue('agent@example.com');
    form.get('agent_type')!.setValue('internal');
    form.get('community_id')!.setValue('comm-1');
    form.get('first_name')!.setValue(null);
    form.get('last_name')!.setValue(null);
    form.get('phone')!.setValue(null);
    form.get('position')!.setValue(null);
    form.get('public_comment')!.setValue(null);
    form.get('internal_comment')!.setValue(null);
    expect(form.valid).toBe(true);
  });

  it('should reject invalid email', () => {
    const form = createAgentForm(fb);
    form.get('email')!.setValue('not-an-email');
    expect(form.get('email')!.valid).toBe(false);

    form.get('email')!.setValue('valid@example.com');
    expect(form.get('email')!.valid).toBe(true);
  });
});
