import { Component, inject, OnInit, computed, effect, ElementRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { createActionModelForm } from '@domains/action-models/forms/action-model.form';
import { ActionModelFacade } from '../action-model.facade';

@Component({
  selector: 'app-action-model-form',
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
        {{ isEditMode ? 'Edit Action Model' : 'Create Action Model' }}
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

        <div>
          <label for="funding_program_id" class="block text-sm font-medium text-text-primary mb-1">Funding Program *</label>
          <select
            id="funding_program_id"
            formControlName="funding_program_id"
            class="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand"
            [class.border-error]="showError('funding_program_id')"
            [disabled]="facade.fpLoading()"
          >
            @if (facade.fpLoading()) {
              <option value="" disabled>Loading...</option>
            } @else if (facade.fpOptions().length === 0) {
              <option value="" disabled>No Funding Programs available</option>
            } @else {
              <option value="" disabled>Select a Funding Program</option>
              @for (fp of facade.fpOptions(); track fp.id) {
                <option [value]="fp.id">{{ fp.name }}</option>
              }
            }
          </select>
          @if (showError('funding_program_id')) {
            <p class="mt-1 text-sm text-error">Funding Program is required.</p>
          }
        </div>

        <div>
          <label for="action_theme_id" class="block text-sm font-medium text-text-primary mb-1">Action Theme *</label>
          <select
            id="action_theme_id"
            formControlName="action_theme_id"
            class="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand"
            [class.border-error]="showError('action_theme_id')"
            [disabled]="facade.atLoading()"
          >
            @if (facade.atLoading()) {
              <option value="" disabled>Loading...</option>
            } @else if (facade.atOptions().length === 0) {
              <option value="" disabled>No Action Themes available</option>
            } @else {
              <option value="" disabled>Select an Action Theme</option>
              @for (at of facade.atOptions(); track at.id) {
                <option [value]="at.id">{{ at.name }}</option>
              }
            }
          </select>
          @if (showError('action_theme_id')) {
            <p class="mt-1 text-sm text-error">Action Theme is required.</p>
          }
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
export class ActionModelFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly facade = inject(ActionModelFacade);
  private readonly el = inject(ElementRef);

  isEditMode = false;
  private editId: string | null = null;
  readonly submitting = computed(() => this.facade.createIsPending() || this.facade.updateIsPending());
  readonly form = createActionModelForm(this.fb);

  private formPatched = false;

  constructor() {
    effect(() => {
      const item = this.facade.selectedItem();
      if (this.isEditMode && item && item.id === this.editId && !this.formPatched) {
        this.formPatched = true;
        this.form.patchValue({
          name: item.name,
          description: item.description ?? null,
          funding_program_id: item.funding_program_id,
          action_theme_id: item.action_theme_id,
        });
      }
    });
  }

  ngOnInit(): void {
    this.editId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.editId;

    this.facade.loadAssociationData();

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
    const data = { ...raw, name: raw.name! };

    if (this.isEditMode && this.editId) {
      await this.facade.update(this.editId, data);
    } else {
      await this.facade.create(data);
    }
  }

  goBack(): void {
    if (this.isEditMode && this.editId) {
      this.router.navigate(['/action-models', this.editId]);
    } else {
      this.router.navigate(['/action-models']);
    }
  }
}
