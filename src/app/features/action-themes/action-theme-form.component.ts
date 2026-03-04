import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { ToastService } from '@app/shared/services/toast.service';
import { ActionThemeService } from './action-theme.service';

@Component({
  selector: 'app-action-theme-form',
  imports: [ReactiveFormsModule],
  template: `
    <div class="p-6 max-w-2xl">
      <button
        class="text-sm text-text-secondary hover:text-text-primary mb-2 inline-flex items-center gap-1"
        (click)="goBack()"
      >
        &larr; Back
      </button>
      <h1 class="text-2xl font-bold text-text-primary mb-6">
        {{ isEditMode ? 'Edit Action Theme' : 'Create Action Theme' }}
      </h1>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
        <div>
          <label for="name" class="block text-sm font-medium text-text-primary mb-1">Name *</label>
          <input
            id="name"
            formControlName="name"
            class="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand"
            [class.border-error]="showError('name')"
          />
          @if (showError('name')) {
            <p class="mt-1 text-sm text-error">Name is required.</p>
          }
        </div>

        <div>
          <label for="technical_label" class="block text-sm font-medium text-text-primary mb-1">Technical Label *</label>
          <input
            id="technical_label"
            formControlName="technical_label"
            class="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand font-mono"
            [class.border-error]="showError('technical_label')"
          />
          @if (showError('technical_label')) {
            <p class="mt-1 text-sm text-error">Technical label is required.</p>
          }
        </div>

        <div>
          <label for="description" class="block text-sm font-medium text-text-primary mb-1">Description</label>
          <textarea
            id="description"
            formControlName="description"
            rows="3"
            class="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand"
          ></textarea>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="icon" class="block text-sm font-medium text-text-primary mb-1">Icon</label>
            <input
              id="icon"
              formControlName="icon"
              class="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <div>
            <label for="color" class="block text-sm font-medium text-text-primary mb-1">Color</label>
            <input
              id="color"
              formControlName="color"
              class="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
        </div>

        <div class="flex gap-3 pt-4">
          <button
            type="submit"
            class="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors disabled:opacity-50"
            [disabled]="submitting()"
          >
            {{ submitting() ? 'Saving...' : (isEditMode ? 'Save' : 'Create') }}
          </button>
          <button
            type="button"
            class="px-4 py-2 border border-border rounded-lg text-text-primary hover:bg-surface-muted transition-colors"
            (click)="goBack()"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  `,
})
export class ActionThemeFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(ActionThemeService);
  private readonly toast = inject(ToastService);

  isEditMode = false;
  private editId: string | null = null;
  readonly submitting = signal(false);

  readonly form = this.fb.group({
    name: ['', Validators.required],
    technical_label: ['', Validators.required],
    description: [null as string | null],
    icon: [null as string | null],
    color: [null as string | null],
  });

  ngOnInit(): void {
    this.editId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.editId;

    if (this.isEditMode && this.editId) {
      this.service.getById(this.editId).subscribe((theme) => {
        this.form.patchValue({
          name: theme.name,
          technical_label: theme.technical_label,
          description: theme.description ?? null,
          icon: theme.icon ?? null,
          color: theme.color ?? null,
        });
      });
    }
  }

  showError(field: string): boolean {
    const control = this.form.get(field);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      const firstInvalid = document.querySelector<HTMLElement>('.ng-invalid[formControlName]');
      firstInvalid?.focus();
      return;
    }

    this.submitting.set(true);
    const raw = this.form.getRawValue();
    const data = { ...raw, name: raw.name!, technical_label: raw.technical_label! };

    if (this.isEditMode && this.editId) {
      this.service.update(this.editId, data).subscribe({
        next: () => {
          this.submitting.set(false);
          this.toast.success('Action Theme updated');
          this.router.navigate(['/action-themes', this.editId]);
        },
        error: (err: HttpErrorResponse) => {
          this.submitting.set(false);
          this.handleError(err);
        },
      });
    } else {
      this.service.create({ ...data, status: 'draft' }).subscribe({
        next: (created) => {
          this.submitting.set(false);
          this.toast.success('Action Theme created');
          this.router.navigate(['/action-themes', created.id]);
        },
        error: (err: HttpErrorResponse) => {
          this.submitting.set(false);
          this.handleError(err);
        },
      });
    }
  }

  goBack(): void {
    if (this.isEditMode && this.editId) {
      this.router.navigate(['/action-themes', this.editId]);
    } else {
      this.router.navigate(['/action-themes']);
    }
  }

  private handleError(err: HttpErrorResponse): void {
    if (err.status === 422 && err.error?.detail) {
      const details = Array.isArray(err.error.detail) ? err.error.detail : [err.error.detail];
      for (const detail of details) {
        const field = detail.loc?.[detail.loc.length - 1];
        if (field && this.form.get(field)) {
          this.form.get(field)!.setErrors({ serverError: detail.msg });
        }
      }
      this.toast.error('Please fix the validation errors');
    } else {
      const message = err.error?.detail || err.error?.message || 'An error occurred';
      this.toast.error(typeof message === 'string' ? message : 'An error occurred');
    }
  }
}
