import { Component, inject, OnInit, computed, effect, ElementRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HasUnsavedChanges } from '@shared/guards/unsaved-changes.guard';
import { FormFieldComponent } from '@shared/components/form-field/form-field.component';
import { FormPageLayoutComponent } from '@app/shared/components/layouts/form-page-layout.component';
import { BreadcrumbItem } from '@app/shared/components/breadcrumb/breadcrumb.component';

import { createCommunityForm } from '@domains/communities/forms/community.form';
import { CommunityFacade } from '../community.facade';

@Component({
  selector: 'app-community-form',
  imports: [ReactiveFormsModule, FormFieldComponent, FormPageLayoutComponent],
  templateUrl: './community-form.component.html',
})
export class CommunityFormComponent implements OnInit, HasUnsavedChanges {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly facade = inject(CommunityFacade);
  private readonly el = inject(ElementRef);

  isEditMode = false;
  editId: string | null = null;
  readonly itemName = computed(() => this.facade.selectedItem()?.name);
  readonly submitting = computed(() => this.facade.createIsPending() || this.facade.updateIsPending());
  readonly form = createCommunityForm(this.fb);

  get formTitle(): string {
    return this.isEditMode ? 'Modifier la communauté' : 'Créer une communauté';
  }

  readonly formBreadcrumbs = computed<BreadcrumbItem[]>(() => {
    if (this.isEditMode) {
      return [
        { label: 'Communautés', route: '/communities' },
        { label: this.itemName() ?? '...', route: '/communities/' + this.editId },
        { label: 'Modifier' },
      ];
    }
    return [
      { label: 'Communautés', route: '/communities' },
      { label: 'Nouvelle communauté' },
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
          siret: item.siret,
          public_comment: item.public_comment ?? null,
          internal_comment: item.internal_comment ?? null,
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
    this.form.markAsPristine();

    if (this.isEditMode && this.editId) {
      this.facade.update(this.editId, raw);
    } else {
      this.facade.create(raw);
    }
  }

  hasUnsavedChanges(): boolean {
    return this.form.dirty && !this.submitting();
  }

  goBack(): void {
    if (this.isEditMode && this.editId) {
      this.router.navigate(['/communities', this.editId]);
    } else {
      this.router.navigate(['/communities']);
    }
  }
}
