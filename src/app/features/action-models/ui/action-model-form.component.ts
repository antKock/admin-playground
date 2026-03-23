import { Component, inject, OnInit, computed, effect, ElementRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HasUnsavedChanges } from '@shared/guards/unsaved-changes.guard';
import { BreadcrumbItem } from '@app/shared/components/breadcrumb/breadcrumb.component';
import { FormFieldComponent } from '@shared/components/form-field/form-field.component';
import { FormPageLayoutComponent } from '@app/shared/components/layouts/form-page-layout.component';

import { createActionModelForm } from '@domains/action-models/forms/action-model.form';
import { ActionModelFacade } from '../action-model.facade';

@Component({
  selector: 'app-action-model-form',
  imports: [ReactiveFormsModule, FormFieldComponent, FormPageLayoutComponent],
  templateUrl: './action-model-form.component.html',
})
export class ActionModelFormComponent implements OnInit, HasUnsavedChanges {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly facade = inject(ActionModelFacade);
  private readonly el = inject(ElementRef);

  isEditMode = false;
  editId: string | null = null;
  readonly submitting = computed(() => this.facade.createIsPending() || this.facade.updateIsPending());
  readonly form = createActionModelForm(this.fb);

  get formTitle(): string {
    return this.isEditMode ? 'Modifier le mod\u00e8le d\'action' : 'Cr\u00e9er un mod\u00e8le d\'action';
  }

  readonly formBreadcrumbs = computed<BreadcrumbItem[]>(() => {
    if (this.isEditMode) {
      return [
        { label: 'Mod\u00e8les d\'action', route: '/action-models' },
        { label: this.facade.selectedItem()?.name ?? '...', route: '/action-models/' + this.editId },
        { label: 'Modifier' },
      ];
    }
    return [
      { label: 'Mod\u00e8les d\'action', route: '/action-models' },
      { label: 'Nouveau mod\u00e8le d\'action' },
    ];
  });

  // effect() watches selectedItem signal — patches form when item loads in edit mode (formPatched guards against re-runs).
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

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      const firstInvalid = this.el.nativeElement.querySelector('.ng-invalid[formControlName]') as HTMLElement | null;
      firstInvalid?.focus();
      return;
    }

    const raw = this.form.getRawValue();
    const data = { ...raw, name: raw.name!, status: 'draft' as const };
    this.form.markAsPristine();

    if (this.isEditMode && this.editId) {
      await this.facade.update(this.editId, data);
    } else {
      await this.facade.create(data);
    }
  }

  hasUnsavedChanges(): boolean {
    return this.form.dirty && !this.submitting();
  }

  goBack(): void {
    if (this.isEditMode && this.editId) {
      this.router.navigate(['/action-models', this.editId]);
    } else {
      this.router.navigate(['/action-models']);
    }
  }
}
