import { FormBuilder } from '@angular/forms';
import { createCommunityForm } from './community.form';

describe('createCommunityForm', () => {
  const fb = new FormBuilder();

  it('should create the form with correct controls', () => {
    const form = createCommunityForm(fb);
    expect(form.get('name')).toBeTruthy();
    expect(form.get('siret')).toBeTruthy();
    expect(form.get('public_comment')).toBeTruthy();
    expect(form.get('internal_comment')).toBeTruthy();
  });

  it('should have required validators', () => {
    const form = createCommunityForm(fb);
    form.get('name')!.setValue('');
    form.get('siret')!.setValue('');
    expect(form.valid).toBe(false);
  });

  it('should be valid with minimum required data', () => {
    const form = createCommunityForm(fb);
    form.get('name')!.setValue('Community A');
    form.get('siret')!.setValue('12345678901234');
    expect(form.valid).toBe(true);
  });

  it('should accept optional fields as null', () => {
    const form = createCommunityForm(fb);
    form.get('name')!.setValue('Community A');
    form.get('siret')!.setValue('12345678901234');
    form.get('public_comment')!.setValue(null);
    form.get('internal_comment')!.setValue(null);
    expect(form.valid).toBe(true);
  });

  it('should reject invalid SIRET format', () => {
    const form = createCommunityForm(fb);
    const siret = form.get('siret')!;

    siret.setValue('123');
    expect(siret.valid).toBe(false);

    siret.setValue('abcdefghijklmn');
    expect(siret.valid).toBe(false);

    siret.setValue('123456789012345');
    expect(siret.valid).toBe(false);

    siret.setValue('12345678901234');
    expect(siret.valid).toBe(true);
  });

  it('should pre-populate from initial value', () => {
    const form = createCommunityForm(fb, {
      name: 'My Community',
      siret: '98765432109876',
      public_comment: 'Public note',
      internal_comment: 'Internal note',
    } as any);
    expect(form.get('name')!.value).toBe('My Community');
    expect(form.get('siret')!.value).toBe('98765432109876');
    expect(form.get('public_comment')!.value).toBe('Public note');
    expect(form.get('internal_comment')!.value).toBe('Internal note');
  });
});
