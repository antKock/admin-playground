import { Component, inject, OnInit, computed, effect, ElementRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { HasUnsavedChanges } from '@shared/guards/unsaved-changes.guard';
import { FormFieldComponent } from '@shared/components/form-field/form-field.component';
import { FormPageLayoutComponent } from '@app/shared/components/layouts/form-page-layout.component';
import { BreadcrumbItem } from '@app/shared/components/breadcrumb/breadcrumb.component';
import { createActionThemeForm } from '@domains/action-themes/forms/action-theme.form';
import { ActionThemeFacade } from '../action-theme.facade';

@Component({
  selector: 'app-action-theme-form',
  imports: [ReactiveFormsModule, FormFieldComponent, FormPageLayoutComponent],
  templateUrl: './action-theme-form.component.html',
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

  get formTitle(): string {
    return this.isEditMode ? 'Modifier le thème d\'action' : 'Créer un thème d\'action';
  }

  readonly formBreadcrumbs = computed<BreadcrumbItem[]>(() => {
    if (this.isEditMode) {
      return [
        { label: 'Thèmes d\'action', route: '/action-themes' },
        { label: this.itemName() ?? '...', route: '/action-themes/' + this.editId },
        { label: 'Modifier' },
      ];
    }
    return [
      { label: 'Thèmes d\'action', route: '/action-themes' },
      { label: 'Nouveau thème d\'action' },
    ];
  });
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

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      const firstInvalid = this.el.nativeElement.querySelector('.ng-invalid[formControlName]') as HTMLElement | null;
      firstInvalid?.focus();
      return;
    }

    const raw = this.form.getRawValue();
    const data = { ...raw, name: raw.name!, technical_label: raw.technical_label! };
    this.form.markAsPristine();

    if (this.isEditMode && this.editId) {
      this.facade.update(this.editId, data);
    } else {
      this.facade.create({ ...data, status: 'draft' });
    }
  }

  hasUnsavedChanges(): boolean {
    return this.form.dirty && !this.submitting();
  }

  goBack(): void {
    if (this.isEditMode && this.editId) {
      this.router.navigate(['/action-themes', this.editId]);
    } else {
      this.router.navigate(['/action-themes']);
    }
  }
}
