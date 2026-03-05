import { Component, inject, OnInit, OnDestroy, computed, effect, ElementRef, HostListener } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HasUnsavedChanges } from '@shared/guards/unsaved-changes.guard';
import { BreadcrumbComponent } from '@app/shared/components/breadcrumb/breadcrumb.component';

import { createIndicatorModelForm } from '@domains/indicator-models/forms/indicator-model.form';
import { IndicatorModelFacade } from '../indicator-model.facade';

@Component({
  selector: 'app-indicator-model-form',
  imports: [ReactiveFormsModule, BreadcrumbComponent],
  template: `
    <div class="p-6 max-w-2xl">
      @if (isEditMode) {
        <app-breadcrumb [items]="[
          { label: 'Indicator Models', route: '/indicator-models' },
          { label: facade.selectedItem()?.name ?? '...', route: '/indicator-models/' + editId },
          { label: 'Edit' }
        ]" />
      } @else {
        <app-breadcrumb [items]="[
          { label: 'Indicator Models', route: '/indicator-models' },
          { label: 'New Indicator Model' }
        ]" />
      }
      <h1 class="text-2xl font-bold text-text-primary mb-6">
        {{ isEditMode ? 'Edit Indicator Model' : 'Create Indicator Model' }}
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
            class="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand"
            [class.border-error]="showError('technical_label')"
          />
          @if (showError('technical_label')) {
            <p class="mt-1 text-sm text-error">Technical Label is required.</p>
          }
        </div>

        <div>
          <label for="type" class="block text-sm font-medium text-text-primary mb-1">Type *</label>
          <select
            id="type"
            formControlName="type"
            class="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand"
            [class.border-error]="showError('type')"
          >
            <option value="" disabled>Select a type</option>
            <option value="text">Text</option>
            <option value="number">Number</option>
          </select>
          @if (showError('type')) {
            <p class="mt-1 text-sm text-error">Type is required.</p>
          }
        </div>

        <div>
          <label for="unit" class="block text-sm font-medium text-text-primary mb-1">Unit</label>
          <input
            id="unit"
            formControlName="unit"
            class="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand"
          />
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
export class IndicatorModelFormComponent implements OnInit, OnDestroy, HasUnsavedChanges {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly facade = inject(IndicatorModelFacade);
  private readonly el = inject(ElementRef);

  isEditMode = false;
  editId: string | null = null;
  readonly submitting = computed(() => this.facade.createIsPending() || this.facade.updateIsPending());
  readonly form = createIndicatorModelForm(this.fb);

  private formPatched = false;

  constructor() {
    effect(() => {
      const item = this.facade.selectedItem();
      if (this.isEditMode && item && item.id === this.editId && !this.formPatched) {
        this.formPatched = true;
        this.form.patchValue({
          name: item.name,
          technical_label: item.technical_label,
          description: item.description ?? null,
          type: item.type,
          unit: item.unit ?? null,
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

  ngOnDestroy(): void {
    this.facade.clearSelection();
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
    const data = { ...raw, name: raw.name!, technical_label: raw.technical_label!, type: raw.type! };

    if (this.isEditMode && this.editId) {
      await this.facade.update(this.editId, data);
    } else {
      await this.facade.create(data);
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
      this.router.navigate(['/indicator-models', this.editId]);
    } else {
      this.router.navigate(['/indicator-models']);
    }
  }
}
