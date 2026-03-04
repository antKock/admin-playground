import { Component, inject, OnInit, signal, effect, DestroyRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { createFundingProgramForm } from '@domains/funding-programs/forms/funding-program.form';
import { FundingProgramFacade } from '../funding-program.facade';

@Component({
  selector: 'app-funding-program-form',
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
        {{ isEditMode ? 'Edit Funding Program' : 'Create Funding Program' }}
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
            <label for="budget" class="block text-sm font-medium text-text-primary mb-1">Budget</label>
            <input
              id="budget"
              type="number"
              formControlName="budget"
              class="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">&nbsp;</label>
            <label class="inline-flex items-center gap-2 mt-2">
              <input type="checkbox" formControlName="is_active" class="rounded" />
              <span class="text-sm text-text-primary">Active</span>
            </label>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="start_date" class="block text-sm font-medium text-text-primary mb-1">Start Date</label>
            <input
              id="start_date"
              type="date"
              formControlName="start_date"
              class="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <div>
            <label for="end_date" class="block text-sm font-medium text-text-primary mb-1">End Date</label>
            <input
              id="end_date"
              type="date"
              formControlName="end_date"
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
export class FundingProgramFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly facade = inject(FundingProgramFacade);

  isEditMode = false;
  private editId: string | null = null;
  readonly submitting = signal(false);
  readonly form = createFundingProgramForm(this.fb);

  private formPatched = false;

  constructor() {
    effect(() => {
      const item = this.facade.selectedItem();
      if (this.isEditMode && item && item.id === this.editId && !this.formPatched) {
        this.formPatched = true;
        this.form.patchValue({
          name: item.name,
          description: item.description ?? null,
          budget: item.budget ?? null,
          is_active: item.is_active,
          start_date: item.start_date ?? null,
          end_date: item.end_date ?? null,
        });
      }
    });
  }

  ngOnInit(): void {
    this.editId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.editId;

    if (this.isEditMode && this.editId) {
      this.facade.select(this.editId);
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
    const data = { ...raw, name: raw.name!, is_active: raw.is_active ?? true };

    if (this.isEditMode && this.editId) {
      this.facade.update(this.editId, data).finally(() => this.submitting.set(false));
    } else {
      this.facade.create(data).finally(() => this.submitting.set(false));
    }
  }

  goBack(): void {
    if (this.isEditMode && this.editId) {
      this.router.navigate(['/funding-programs', this.editId]);
    } else {
      this.router.navigate(['/funding-programs']);
    }
  }
}
