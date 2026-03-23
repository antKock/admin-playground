import { Component, ViewEncapsulation, input } from '@angular/core';
import { AbstractControl } from '@angular/forms';

@Component({
  selector: 'app-form-field',
  templateUrl: './form-field.component.html',
  styleUrl: './form-field.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class FormFieldComponent {
  readonly label = input.required<string>();
  readonly control = input.required<AbstractControl>();
  readonly errorMessage = input('Ce champ est requis');
  readonly fieldId = input('');
  readonly required = input(false);

  get showError(): boolean {
    const ctrl = this.control();
    return ctrl?.invalid && (ctrl.dirty || ctrl.touched);
  }

  get errorId(): string | null {
    const id = this.fieldId();
    return id ? `${id}-error` : null;
  }
}
