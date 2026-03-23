import { Component, inject, OnInit, computed, effect, ElementRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HasUnsavedChanges } from '@shared/guards/unsaved-changes.guard';
import { FormFieldComponent } from '@shared/components/form-field/form-field.component';
import { FormPageLayoutComponent } from '@app/shared/components/layouts/form-page-layout.component';
import { BreadcrumbItem } from '@app/shared/components/breadcrumb/breadcrumb.component';

import { createFolderModelForm } from '@domains/folder-models/forms/folder-model.form';
import { MultiSelectorComponent } from '@app/shared/components/multi-selector/multi-selector.component';
import { FolderModelFacade } from '../folder-model.facade';

@Component({
  selector: 'app-folder-model-form',
  imports: [ReactiveFormsModule, MultiSelectorComponent, FormFieldComponent, FormPageLayoutComponent],
  templateUrl: './folder-model-form.component.html',
})
export class FolderModelFormComponent implements OnInit, HasUnsavedChanges {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly facade = inject(FolderModelFacade);
  private readonly el = inject(ElementRef);

  isEditMode = false;
  editId: string | null = null;
  readonly submitting = computed(() => this.facade.createIsPending() || this.facade.updateIsPending());
  readonly form = createFolderModelForm(this.fb);

  get formTitle(): string {
    return this.isEditMode ? 'Modifier le modèle de dossier' : 'Créer un modèle de dossier';
  }

  readonly formBreadcrumbs = computed<BreadcrumbItem[]>(() => {
    if (this.isEditMode) {
      return [
        { label: 'Modèles de dossier', route: '/folder-models' },
        { label: this.facade.selectedItem()?.name ?? '...', route: '/folder-models/' + this.editId },
        { label: 'Modifier' },
      ];
    }
    return [
      { label: 'Modèles de dossier', route: '/folder-models' },
      { label: 'Nouveau modèle de dossier' },
    ];
  });

  // effect() watches selectedItem signal — patches form when item loads in edit mode (formPatched guards against re-runs).
  private formPatched = false;
  get fpIds(): string[] {
    return this.form.get('funding_program_ids')!.value;
  }

  constructor() {
    effect(() => {
      const item = this.facade.selectedItem();
      if (this.isEditMode && item && item.id === this.editId && !this.formPatched) {
        this.formPatched = true;
        this.form.patchValue({
          name: item.name,
          description: item.description ?? null,
          funding_program_ids: item.funding_programs?.map(fp => fp.id) ?? [],
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

  onFpSelectionChange(ids: string[]): void {
    const ctrl = this.form.get('funding_program_ids')!;
    ctrl.setValue(ids);
    ctrl.markAsDirty();
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
      this.router.navigate(['/folder-models', this.editId]);
    } else {
      this.router.navigate(['/folder-models']);
    }
  }
}
