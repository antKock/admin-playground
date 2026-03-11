import { Component, inject, OnInit, computed, effect, ElementRef, HostListener } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { HasUnsavedChanges } from '@shared/guards/unsaved-changes.guard';
import { BreadcrumbComponent } from '@app/shared/components/breadcrumb/breadcrumb.component';

import { createFundingProgramForm } from '@domains/funding-programs/forms/funding-program.form';
import { FundingProgramFacade } from '../funding-program.facade';

@Component({
  selector: 'app-funding-program-form',
  imports: [ReactiveFormsModule, BreadcrumbComponent],
  template: `
    <div class="p-6 max-w-2xl">
      @if (isEditMode) {
        <app-breadcrumb [items]="[
          { label: 'Programmes de financement', route: '/funding-programs' },
          { label: itemName() ?? '...', route: '/funding-programs/' + editId },
          { label: 'Modifier' }
        ]" />
      } @else {
        <app-breadcrumb [items]="[
          { label: 'Programmes de financement', route: '/funding-programs' },
          { label: 'Nouveau programme de financement' }
        ]" />
      }
      <h1 class="text-2xl font-bold text-text-primary mb-6">
        {{ isEditMode ? 'Modifier le programme de financement' : 'Créer un programme de financement' }}
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

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="budget" class="block text-sm font-medium text-text-primary mb-1">Budget</label>
            <input
              id="budget"
              type="number"
              formControlName="budget"
              class="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">&nbsp;</label>
            <label class="inline-flex items-center gap-2 mt-2">
              <input type="checkbox" formControlName="is_active" class="rounded" />
              <span class="text-sm text-text-primary">Actif</span>
            </label>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="start_date" class="block text-sm font-medium text-text-primary mb-1">Date de début</label>
            <input
              id="start_date"
              type="date"
              formControlName="start_date"
              class="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <div>
            <label for="end_date" class="block text-sm font-medium text-text-primary mb-1">Date de fin</label>
            <input
              id="end_date"
              type="date"
              formControlName="end_date"
              class="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
        </div>

        <div>
          <label for="folder_model_id" class="block text-sm font-medium text-text-primary mb-1">Modèle de dossier</label>
          <select
            id="folder_model_id"
            formControlName="folder_model_id"
            class="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand"
          >
            <option [ngValue]="null">Aucun</option>
            @for (option of facade.fmOptions(); track option.id) {
              <option [value]="option.id">{{ option.label }}</option>
            }
          </select>
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
export class FundingProgramFormComponent implements OnInit, HasUnsavedChanges {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly facade = inject(FundingProgramFacade);
  private readonly el = inject(ElementRef);

  isEditMode = false;
  editId: string | null = null;
  readonly itemName = computed(() => this.facade.selectedItem()?.name);
  readonly submitting = computed(() => this.facade.createIsPending() || this.facade.updateIsPending());
  readonly form = createFundingProgramForm(this.fb);

  private formPatched = false;

  // effect() watches selectedItem signal — patches form when item loads in edit mode (formPatched guards against re-runs).
  constructor() {
    effect(() => {
      const item = this.facade.selectedItem();
      if (this.isEditMode && item && item.id === this.editId && !this.formPatched) {
        this.formPatched = true;
        this.form.patchValue({
          name: item.name,
          description: item.description ?? null,
          budget: item.budget ?? null,
          is_active: item.is_active,
          start_date: item.start_date?.substring(0, 10) ?? null,
          end_date: item.end_date?.substring(0, 10) ?? null,
          folder_model_id: item.folder_model_id ?? null,
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

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      const firstInvalid = this.el.nativeElement.querySelector('.ng-invalid[formControlName]') as HTMLElement | null;
      firstInvalid?.focus();
      return;
    }

    const raw = this.form.getRawValue();
    const data = { ...raw, name: raw.name!, is_active: raw.is_active ?? true };
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
      this.router.navigate(['/funding-programs', this.editId]);
    } else {
      this.router.navigate(['/funding-programs']);
    }
  }
}
