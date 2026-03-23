import { FormBuilder } from '@angular/forms';
import { createUserForm } from './user.form';

describe('createUserForm', () => {
  const fb = new FormBuilder();

  it('should create the form with correct controls', () => {
    const form = createUserForm(fb);
    expect(form.get('email')).toBeTruthy();
    expect(form.get('first_name')).toBeTruthy();
    expect(form.get('last_name')).toBeTruthy();
    expect(form.get('is_active')).toBeTruthy();
    expect(form.get('role')).toBeTruthy();
    expect(form.get('password')).toBeTruthy();
  });

  it('should have required validators', () => {
    const form = createUserForm(fb);
    form.get('email')!.setValue('');
    form.get('first_name')!.setValue('');
    form.get('last_name')!.setValue('');
    form.get('role')!.setValue(null);
    form.get('password')!.setValue('');
    expect(form.valid).toBe(false);
  });

  it('should be valid with minimum required data', () => {
    const form = createUserForm(fb);
    form.get('email')!.setValue('user@example.com');
    form.get('first_name')!.setValue('Jean');
    form.get('last_name')!.setValue('Dupont');
    form.get('role')!.setValue('admin');
    form.get('password')!.setValue('secret123');
    expect(form.valid).toBe(true);
  });

  it('should default is_active to true', () => {
    const form = createUserForm(fb);
    expect(form.get('is_active')!.value).toBe(true);
  });

  it('should reject invalid email', () => {
    const form = createUserForm(fb);
    form.get('email')!.setValue('not-an-email');
    expect(form.get('email')!.valid).toBe(false);

    form.get('email')!.setValue('valid@example.com');
    expect(form.get('email')!.valid).toBe(true);
  });

  it('should not include password field in edit mode', () => {
    const form = createUserForm(fb, undefined, true);
    expect(form.get('password')).toBeNull();
  });

  it('should include password field in create mode', () => {
    const form = createUserForm(fb, undefined, false);
    expect(form.get('password')).toBeTruthy();
  });

  it('should be valid without password in edit mode', () => {
    const form = createUserForm(fb, undefined, true);
    form.get('email')!.setValue('user@example.com');
    form.get('first_name')!.setValue('Jean');
    form.get('last_name')!.setValue('Dupont');
    form.get('role')!.setValue('admin');
    expect(form.valid).toBe(true);
  });

  it('should pre-populate from initial value', () => {
    const form = createUserForm(fb, {
      email: 'jean@example.com',
      first_name: 'Jean',
      last_name: 'Dupont',
      is_active: false,
      role: 'viewer',
    } as any, true);
    expect(form.get('email')!.value).toBe('jean@example.com');
    expect(form.get('first_name')!.value).toBe('Jean');
    expect(form.get('last_name')!.value).toBe('Dupont');
    expect(form.get('is_active')!.value).toBe(false);
    expect(form.get('role')!.value).toBe('viewer');
  });
});
