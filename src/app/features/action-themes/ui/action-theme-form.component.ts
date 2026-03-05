import { Component, inject, OnInit, computed, effect, ElementRef, HostListener } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { HasUnsavedChanges } from '@shared/guards/unsaved-changes.guard';
import { BreadcrumbComponent } from '@app/shared/components/breadcrumb/breadcrumb.component';
import { createActionThemeForm } from '@domains/action-themes/forms/action-theme.form';
import { ActionThemeFacade } from '../action-theme.facade';

@Component({
  selector: 'app-action-theme-form',
  imports: [ReactiveFormsModule, BreadcrumbComponent],
  template: `
    <div class="p-6 max-w-2xl">
      @if (isEditMode) {
        <app-breadcrumb [items]="[
          { label: 'Action Themes', route: '/action-themes' },
          { label: itemName() ?? '...', route: '/action-themes/' + editId },
          { label: 'Edit' }
        ]" />
      } @else {
        <app-breadcrumb [items]="[
          { label: 'Action Themes', route: '/action-themes' },
          { label: 'New Action Theme' }
        ]" />
      }
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
export class ActionThemeFormComponent implements OnInit, HasUnsavedChanges {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly facade = inject(ActionThemeFacade);
  private readonly el = inject(ElementRef);

  isEditMode = false;
  editId: string | null = null;
  readonly itemName = computed(() => this.facade.selectedItem()?.name);
  readonly submitting = computed(() => this.facade.createIsPending() || this.facade.updateIsPending());
  readonly form = createActionThemeForm(this.fb);

  private formPatched = false;

  // effect() watches selectedItem signal — patches form when item loads in edit mode (formPatched guards against re-runs).
  constructor() {
    effect(() => {
      const item = this.facade.selectedItem();
      if (this.isEditMode && item && item.id === this.editId && !this.formPatched) {
        this.formPatched = true;
        this.form.patchValue({
          name: item.name,
          technical_label: item.technical_label,
          description: item.description ?? null,
          icon: item.icon ?? null,
          color: item.color ?? null,
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
      const firstInvalid = this.el.nativeElement.querySelector('.ng-invalid[formControlName]') as HTMLElement | null;
      firstInvalid?.focus();
      return;
    }

    const raw = this.form.getRawValue();
    const data = { ...raw, name: raw.name!, technical_label: raw.technical_label! };

    if (this.isEditMode && this.editId) {
      this.facade.update(this.editId, data);
    } else {
      this.facade.create({ ...data, status: 'draft' });
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
      this.router.navigate(['/action-themes', this.editId]);
    } else {
      this.router.navigate(['/action-themes']);
    }
  }
}
