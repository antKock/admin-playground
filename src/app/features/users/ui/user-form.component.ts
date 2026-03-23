import { Component, inject, OnInit, computed, effect, ElementRef, HostListener } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HasUnsavedChanges } from '@shared/guards/unsaved-changes.guard';
import { BreadcrumbComponent } from '@app/shared/components/breadcrumb/breadcrumb.component';
import { FormFieldComponent } from '@shared/components/form-field/form-field.component';

import { createUserForm } from '@domains/users/forms/user.form';
import { UserFacade } from '../user.facade';

@Component({
  selector: 'app-user-form',
  imports: [ReactiveFormsModule, BreadcrumbComponent, FormFieldComponent],
  templateUrl: './user-form.component.html',
})
export class UserFormComponent implements OnInit, HasUnsavedChanges {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly facade = inject(UserFacade);
  private readonly el = inject(ElementRef);

  readonly isEditMode = !!this.route.snapshot.paramMap.get('id');
  readonly editId = this.route.snapshot.paramMap.get('id');
  readonly itemName = computed(() => {
    const u = this.facade.selectedItem();
    return u ? `${u.first_name} ${u.last_name}` : null;
  });
  readonly submitting = computed(() => this.facade.createIsPending() || this.facade.updateIsPending());
  readonly form = createUserForm(this.fb, undefined, this.isEditMode);

  private formPatched = false;

  constructor() {
    effect(() => {
      const item = this.facade.selectedItem();
      if (this.isEditMode && item && item.id === this.editId && !this.formPatched) {
        this.formPatched = true;
        this.form.patchValue({
          email: item.email,
          first_name: item.first_name,
          last_name: item.last_name,
          is_active: item.is_active,
          role: item.role,
        });
      }
    });
  }

  ngOnInit(): void {
    this.facade.loadRoles();
    if (this.isEditMode && this.editId) {
      this.facade.select(this.editId);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      const firstInvalid = this.el.nativeElement.querySelector('.ng-invalid[formControlName]') as HTMLElement | null;
      firstInvalid?.focus();
      return;
    }

    const raw = this.form.getRawValue();
    this.form.markAsPristine();

    if (this.isEditMode && this.editId) {
      const originalRole = this.facade.selectedItem()?.role;
      const { role, ...userData } = raw;
      await this.facade.update(this.editId, userData);
      if (role !== originalRole) {
        await this.facade.updateRole(this.editId, role);
      }
    } else {
      await this.facade.create(raw);
    }
  }

  hasUnsavedChanges(): boolean {
    return this.form.dirty && !this.submitting();
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key === 's') {
      event.preventDefault();
      if (this.form.dirty && !this.form.invalid && !this.submitting()) {
        this.onSubmit();
      }
    }
    if (event.key === 'Escape' && !this.isFormControlActive()) {
      this.goBack();
    }
  }

  private isFormControlActive(): boolean {
    const tag = document.activeElement?.tagName?.toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select';
  }

  goBack(): void {
    if (this.isEditMode && this.editId) {
      this.router.navigate(['/users', this.editId]);
    } else {
      this.router.navigate(['/users']);
    }
  }
}
