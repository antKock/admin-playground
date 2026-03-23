import { Component, inject, OnInit, computed, effect, ElementRef, HostListener } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { HasUnsavedChanges } from '@shared/guards/unsaved-changes.guard';
import { BreadcrumbComponent, BreadcrumbItem } from '@app/shared/components/breadcrumb/breadcrumb.component';
import { createBuildingForm } from '@domains/building/forms/building.form';
import { BuildingFacade } from '../building.facade';

@Component({
  selector: 'app-building-form',
  imports: [ReactiveFormsModule, BreadcrumbComponent],
  templateUrl: './building-form.component.html',
})
export class BuildingFormComponent implements OnInit, HasUnsavedChanges {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly facade = inject(BuildingFacade);
  private readonly el = inject(ElementRef);

  isEditMode = false;
  editId: string | null = null;
  readonly itemName = computed(() => this.facade.selectedItem()?.name);

  get formTitle(): string {
    return this.isEditMode ? 'Modifier le bâtiment' : 'Créer un bâtiment';
  }

  readonly formBreadcrumbs = computed<BreadcrumbItem[]>(() => {
    if (this.isEditMode) {
      return [
        { label: 'Bâtiments', route: '/buildings' },
        { label: this.itemName() ?? '...', route: '/buildings/' + this.editId },
        { label: 'Modifier' },
      ];
    }
    return [
      { label: 'Bâtiments', route: '/buildings' },
      { label: 'Nouveau bâtiment' },
    ];
  });

  readonly submitting = computed(() => this.facade.createIsPending() || this.facade.updateIsPending());
  readonly form = createBuildingForm(this.fb);

  private formPatched = false;

  // effect() watches selectedItem signal — patches form when item loads in edit mode (formPatched guards against re-runs).
  constructor() {
    effect(() => {
      const item = this.facade.selectedItem();
      if (this.isEditMode && item && item.id === this.editId && !this.formPatched) {
        this.formPatched = true;
        this.form.patchValue({
          name: item.name,
          usage: item.usage ?? null,
          external_id: item.external_id ?? null,
          site_id: item.site_id,
        });
      }
    });
  }

  ngOnInit(): void {
    this.editId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.editId;

    this.facade.loadSiteOptions();

    // Pre-fill site_id from query param when creating from site detail
    const siteIdParam = this.route.snapshot.queryParamMap.get('site_id');
    if (!this.isEditMode && siteIdParam) {
      this.form.patchValue({ site_id: siteIdParam });
    }

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
    const data = { ...raw, name: raw.name! };
    this.form.markAsPristine();

    if (this.isEditMode && this.editId) {
      this.facade.update(this.editId, data);
    } else {
      this.facade.create(data);
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
      this.router.navigate(['/buildings', this.editId]);
    } else {
      this.router.navigate(['/buildings']);
    }
  }
}
