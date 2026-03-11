import { Component, inject, OnInit, computed, effect, ElementRef, HostListener } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HasUnsavedChanges } from '@shared/guards/unsaved-changes.guard';
import { BreadcrumbComponent } from '@app/shared/components/breadcrumb/breadcrumb.component';

import { createUserForm } from '@domains/users/forms/user.form';
import { UserFacade } from '../user.facade';

@Component({
  selector: 'app-user-form',
  imports: [ReactiveFormsModule, BreadcrumbComponent],
  template: `
    <div class="p-6 max-w-2xl">
      @if (isEditMode) {
        <app-breadcrumb [items]="[
          { label: 'Utilisateurs', route: '/users' },
          { label: itemName() ?? '...', route: '/users/' + editId },
          { label: 'Modifier' }
        ]" />
      } @else {
        <app-breadcrumb [items]="[
          { label: 'Utilisateurs', route: '/users' },
          { label: 'Nouvel utilisateur' }
        ]" />
      }
      <h1 class="text-2xl font-bold text-text-primary mb-6">
        {{ isEditMode ? 'Modifier l\\'utilisateur' : 'Créer un utilisateur' }}
      </h1>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
        <div>
          <label for="email" class="block text-sm font-medium text-text-primary mb-1">Email *</label>
          <input
            id="email"
            formControlName="email"
            type="email"
            class="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand"
            [class.border-error]="showError('email')"
          />
          @if (showError('email')) {
            <p class="mt-1 text-sm text-error">Un email valide est obligatoire.</p>
          }
        </div>

        <div>
          <label for="first_name" class="block text-sm font-medium text-text-primary mb-1">Prénom *</label>
          <input
            id="first_name"
            formControlName="first_name"
            class="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand"
            [class.border-error]="showError('first_name')"
          />
          @if (showError('first_name')) {
            <p class="mt-1 text-sm text-error">Le prénom est obligatoire.</p>
          }
        </div>

        <div>
          <label for="last_name" class="block text-sm font-medium text-text-primary mb-1">Nom *</label>
          <input
            id="last_name"
            formControlName="last_name"
            class="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand"
            [class.border-error]="showError('last_name')"
          />
          @if (showError('last_name')) {
            <p class="mt-1 text-sm text-error">Le nom est obligatoire.</p>
          }
        </div>

        @if (!isEditMode) {
          <div>
            <label for="password" class="block text-sm font-medium text-text-primary mb-1">Mot de passe *</label>
            <input
              id="password"
              formControlName="password"
              type="password"
              class="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand"
              [class.border-error]="showError('password')"
            />
            @if (showError('password')) {
              <p class="mt-1 text-sm text-error">Le mot de passe est obligatoire.</p>
            }
          </div>
        }

        <div>
          <label for="role" class="block text-sm font-medium text-text-primary mb-1">Rôle *</label>
          <select
            id="role"
            formControlName="role"
            class="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand"
            [class.border-error]="showError('role')"
          >
            <option [ngValue]="null" disabled>Sélectionner un rôle</option>
            @for (role of facade.roles(); track role) {
              <option [value]="role">{{ role }}</option>
            }
          </select>
          @if (showError('role')) {
            <p class="mt-1 text-sm text-error">Le rôle est obligatoire.</p>
          }
        </div>

        <div class="flex items-center gap-3">
          <input
            id="is_active"
            formControlName="is_active"
            type="checkbox"
            class="h-4 w-4 rounded border-border text-brand focus:ring-brand"
          />
          <label for="is_active" class="text-sm font-medium text-text-primary">Actif</label>
        </div>

        <div class="flex gap-3 pt-4">
          <button
            type="submit"
            class="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors disabled:opacity-50"
            [disabled]="submitting()"
          >
            {{ submitting() ? 'Enregistrement...' : (isEditMode ? 'Enregistrer' : 'Créer') }}
          </button>
          <button
            type="button"
            class="px-4 py-2 border border-border rounded-lg text-text-primary hover:bg-surface-muted transition-colors"
            (click)="goBack()"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  `,
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

  showError(field: string): boolean {
    const control = this.form.get(field);
    return !!control && control.invalid && (control.dirty || control.touched);
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
