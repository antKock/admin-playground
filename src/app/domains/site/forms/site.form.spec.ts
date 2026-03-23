/* eslint-disable @typescript-eslint/no-explicit-any */
import { FormBuilder } from '@angular/forms';
import { createSiteForm } from './site.form';

describe('createSiteForm', () => {
  const fb = new FormBuilder();

  it('should create the form with correct controls', () => {
    const form = createSiteForm(fb);
    expect(form.get('name')).toBeTruthy();
    expect(form.get('siren')).toBeTruthy();
    expect(form.get('usage')).toBeTruthy();
    expect(form.get('external_id')).toBeTruthy();
    expect(form.get('community_id')).toBeTruthy();
  });

  it('should have required validators', () => {
    const form = createSiteForm(fb);
    form.get('name')!.setValue('');
    form.get('siren')!.setValue('');
    form.get('community_id')!.setValue('');
    expect(form.valid).toBe(false);
  });

  it('should be valid with minimum required data', () => {
    const form = createSiteForm(fb);
    form.get('name')!.setValue('Site Alpha');
    form.get('siren')!.setValue('123456789');
    form.get('community_id')!.setValue('comm-1');
    expect(form.valid).toBe(true);
  });

  it('should accept optional fields as null', () => {
    const form = createSiteForm(fb);
    form.get('name')!.setValue('Site Alpha');
    form.get('siren')!.setValue('123456789');
    form.get('community_id')!.setValue('comm-1');
    form.get('usage')!.setValue(null);
    form.get('external_id')!.setValue(null);
    expect(form.valid).toBe(true);
  });

  it('should reject invalid SIREN format', () => {
    const form = createSiteForm(fb);
    const siren = form.get('siren')!;

    siren.setValue('123');
    expect(siren.valid).toBe(false);

    siren.setValue('abcdefghi');
    expect(siren.valid).toBe(false);

    siren.setValue('1234567890');
    expect(siren.valid).toBe(false);

    siren.setValue('123456789');
    expect(siren.valid).toBe(true);
  });

  it('should pre-populate from initial value', () => {
    const form = createSiteForm(fb, {
      name: 'Main Site',
      siren: '987654321',
      community_id: 'comm-99',
      usage: 'industrial',
      external_id: 'ext-site-1',
    } as any);
    expect(form.get('name')!.value).toBe('Main Site');
    expect(form.get('siren')!.value).toBe('987654321');
    expect(form.get('community_id')!.value).toBe('comm-99');
    expect(form.get('usage')!.value).toBe('industrial');
    expect(form.get('external_id')!.value).toBe('ext-site-1');
  });
});
