import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import { FormFieldComponent } from './form-field.component';

@Component({
  imports: [FormFieldComponent, ReactiveFormsModule],
  template: `
    <app-form-field label="Test Label" [control]="control" errorMessage="Custom error" fieldId="test-input">
      <input id="test-input" [formControl]="control" />
    </app-form-field>
  `,
})
class TestHostComponent {
  control = new FormControl('', Validators.required);
}

describe('FormFieldComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render label text', () => {
    const label = fixture.nativeElement.querySelector('label');
    expect(label.textContent).toContain('Test Label');
  });

  it('should project input via ng-content', () => {
    const input = fixture.nativeElement.querySelector('input#test-input');
    expect(input).toBeTruthy();
  });

  it('should hide error when control is pristine and untouched', () => {
    const errorEl = fixture.nativeElement.querySelector('.text-error');
    expect(errorEl).toBeNull();
  });

  it('should show error when control is invalid and dirty', () => {
    host.control.markAsDirty();
    fixture.detectChanges();

    const errorEl = fixture.nativeElement.querySelector('.text-error');
    expect(errorEl).toBeTruthy();
    expect(errorEl.textContent).toContain('Custom error');
  });

  it('should show error when control is invalid and touched', () => {
    host.control.markAsTouched();
    fixture.detectChanges();

    const errorEl = fixture.nativeElement.querySelector('.text-error');
    expect(errorEl).toBeTruthy();
  });

  it('should hide error when control is valid', () => {
    host.control.setValue('valid value');
    host.control.markAsDirty();
    fixture.detectChanges();

    const errorEl = fixture.nativeElement.querySelector('.text-error');
    expect(errorEl).toBeNull();
  });

  it('should apply border-error-wrapper class when showing error', () => {
    host.control.markAsDirty();
    fixture.detectChanges();

    const wrapper = fixture.nativeElement.querySelector('.border-error-wrapper');
    expect(wrapper).toBeTruthy();
  });
});
