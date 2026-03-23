import { Component, inject, OnInit, computed, effect, ElementRef, HostListener } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HasUnsavedChanges } from '@shared/guards/unsaved-changes.guard';
import { BreadcrumbComponent, BreadcrumbItem } from '@app/shared/components/breadcrumb/breadcrumb.component';

import { createActionModelForm } from '@domains/action-models/forms/action-model.form';
import { ActionModelFacade } from '../action-model.facade';

@Component({
  selector: 'app-action-model-form',
  imports: [ReactiveFormsModule, BreadcrumbComponent],
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

  readonly heading = computed(() =>
    this.isEditMode ? 'Modifier le mod\u00e8le d\'action' : 'Cr\u00e9er un mod\u00e8le d\'action',
  );

  readonly editBreadcrumbs = computed<BreadcrumbItem[]>(() => [
    { label: 'Mod\u00e8les d\'action', route: '/action-models' },
    { label: this.facade.selectedItem()?.name ?? '...', route: '/action-models/' + this.editId },
    { label: 'Modifier' },
  ]);

  readonly createBreadcrumbs: BreadcrumbItem[] = [
    { label: 'Mod\u00e8les d\'action', route: '/action-models' },
    { label: 'Nouveau mod\u00e8le d\'action' },
  ];

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
      this.router.navigate(['/action-models', this.editId]);
    } else {
      this.router.navigate(['/action-models']);
    }
  }
}
