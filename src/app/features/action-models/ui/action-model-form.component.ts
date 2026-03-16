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
  template: `
    <div class="p-6 max-w-2xl">
      @if (isEditMode) {
        <app-breadcrumb [items]="editBreadcrumbs()" />
      } @else {
        <app-breadcrumb [items]="createBreadcrumbs" />
      }
      <h1 class="text-2xl font-bold text-text-primary mb-6">
        {{ heading() }}
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
          <label for="description" class="block text-sm font-medium text-text-primary mb-1">Description</label>
          <textarea
            id="description"
            formControlName="description"
            rows="3"
            class="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand"
          ></textarea>
        </div>

        <div>
          <label for="funding_program_id" class="block text-sm font-medium text-text-primary mb-1">Programme de financement *</label>
          <select
            id="funding_program_id"
            formControlName="funding_program_id"
            class="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand"
            [class.border-error]="showError('funding_program_id')"
            [disabled]="facade.fpLoading()"
          >
            @if (facade.fpLoading()) {
              <option value="" disabled>Chargement...</option>
            } @else if (facade.fpOptions().length === 0) {
              <option value="" disabled>Aucun programme de financement disponible</option>
            } @else {
              <option value="" disabled>Sélectionner un programme de financement</option>
              @for (fp of facade.fpOptions(); track fp.id) {
                <option [value]="fp.id">{{ fp.name }}</option>
              }
            }
          </select>
          @if (showError('funding_program_id')) {
            <p class="mt-1 text-sm text-error">Le programme de financement est obligatoire.</p>
          }
        </div>

        <div>
          <label for="action_theme_id" class="block text-sm font-medium text-text-primary mb-1">Thème d'action *</label>
          <select
            id="action_theme_id"
            formControlName="action_theme_id"
            class="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand"
            [class.border-error]="showError('action_theme_id')"
            [disabled]="facade.atLoading()"
          >
            @if (facade.atLoading()) {
              <option value="" disabled>Chargement...</option>
            } @else if (facade.atOptions().length === 0) {
              <option value="" disabled>Aucun thème d'action disponible</option>
            } @else {
              <option value="" disabled>Sélectionner un thème d'action</option>
              @for (at of facade.atOptions(); track at.id) {
                <option [value]="at.id">{{ at.name }}</option>
              }
            }
          </select>
          @if (showError('action_theme_id')) {
            <p class="mt-1 text-sm text-error">Le thème d'action est obligatoire.</p>
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
