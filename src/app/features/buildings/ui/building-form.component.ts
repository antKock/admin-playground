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
  template: `
    <div class="p-6 max-w-2xl">
      <app-breadcrumb [items]="formBreadcrumbs()" />
      <h1 class="text-2xl font-bold text-text-primary mb-6">
        {{ formTitle }}
      </h1>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
        <div>
          <label for="name" class="block text-sm font-medium text-text-primary mb-1">Nom *</label>
          <input
            id="name"
            formControlName="name"
            class="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand"
            [class.border-error]="showError('name')"
          />
          @if (showError('name')) {
            <p class="mt-1 text-sm text-error">Le nom est obligatoire.</p>
          }
        </div>

        <div>
          <label for="usage" class="block text-sm font-medium text-text-primary mb-1">Usage</label>
          <textarea
            id="usage"
            formControlName="usage"
            rows="2"
            class="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand"
          ></textarea>
        </div>

        <div>
          <label for="external_id" class="block text-sm font-medium text-text-primary mb-1">ID externe</label>
          <input
            id="external_id"
            formControlName="external_id"
            class="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand font-mono"
          />
        </div>

        <div>
          <label for="site_id" class="block text-sm font-medium text-text-primary mb-1">Site *</label>
          <select
            id="site_id"
            formControlName="site_id"
            class="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand"
            [class.border-error]="showError('site_id')"
          >
            @if (facade.siteLoading()) {
              <option value="" disabled>Chargement...</option>
            } @else if (facade.siteOptions().length === 0) {
              <option value="" disabled>Aucun site disponible</option>
            } @else {
              <option value="" disabled>Sélectionner un site</option>
              @for (s of facade.siteOptions(); track s.id) {
                <option [value]="s.id">{{ s.name }}</option>
              }
            }
          </select>
          @if (showError('site_id')) {
            <p class="mt-1 text-sm text-error">Le site est obligatoire.</p>
          }
        </div>

        <div class="flex gap-3 pt-4">
          <button
            type="submit"
            class="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors disabled:opacity-50"
            [disabled]="submitting()"
          >
            {{ submitting() ? 'Enregistrement...' : (isEditMode ? 'Enregistrer' : 'Créer') }}
          </button>
          <button
            type="button"
            class="px-4 py-2 border border-border rounded-lg text-text-primary hover:bg-surface-muted transition-colors"
            (click)="goBack()"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  `,
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
