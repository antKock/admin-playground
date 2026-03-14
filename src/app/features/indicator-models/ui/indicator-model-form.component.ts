import { Component, inject, OnInit, OnDestroy, computed, effect, signal, ElementRef, HostListener, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HasUnsavedChanges } from '@shared/guards/unsaved-changes.guard';
import { BreadcrumbComponent } from '@app/shared/components/breadcrumb/breadcrumb.component';

import { createIndicatorModelForm } from '@domains/indicator-models/forms/indicator-model.form';
import { IndicatorModelFacade } from '../indicator-model.facade';

@Component({
  selector: 'app-indicator-model-form',
  imports: [ReactiveFormsModule, FormsModule, BreadcrumbComponent],
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
          <label for="technical_label" class="block text-sm font-medium text-text-primary mb-1">Label technique *</label>
          <input
            id="technical_label"
            formControlName="technical_label"
            class="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand"
            [class.border-error]="showError('technical_label')"
          />
          @if (showError('technical_label')) {
            <p class="mt-1 text-sm text-error">Le label technique est obligatoire.</p>
          }
        </div>

        <div>
          <label for="type" class="block text-sm font-medium text-text-primary mb-1">Type *</label>
          <select
            id="type"
            formControlName="type"
            class="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand"
            [class.border-error]="showError('type')"
          >
            <option value="" disabled>Sélectionner un type</option>
            <option value="text">Texte</option>
            <option value="number">Nombre</option>
            <option value="group">Groupe</option>
          </select>
          @if (showError('type')) {
            <p class="mt-1 text-sm text-error">Le type est obligatoire.</p>
          }
        </div>

        @if (form.get('type')?.value !== 'group') {
          <div>
            <label for="unit" class="block text-sm font-medium text-text-primary mb-1">Unité</label>
            <input
              id="unit"
              formControlName="unit"
              class="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
        }

        @if (form.get('type')?.value === 'group') {
          <div class="border border-border rounded-lg p-4">
            <h3 class="text-sm font-semibold text-text-primary mb-3">Indicateurs enfants</h3>

            @if (attachedChildren().length > 0) {
              <div class="space-y-1 mb-3">
                @for (child of attachedChildren(); track child.id) {
                  <div class="flex items-center justify-between px-3 py-2 border border-border rounded-lg bg-surface-base">
                    <div class="flex items-center gap-2">
                      <span class="text-sm text-text-primary">{{ child.name }}</span>
                      <span class="text-xs text-text-tertiary">({{ child.type }})</span>
                    </div>
                    <button type="button" class="text-xs text-error hover:underline" (click)="detachChild(child.id)">Retirer</button>
                  </div>
                }
              </div>
            } @else {
              <p class="text-sm text-text-tertiary mb-3">Aucun indicateur enfant sélectionné.</p>
            }

            <input
              type="text"
              placeholder="Rechercher des indicateurs..."
              class="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand text-sm mb-2"
              [ngModel]="searchTerm()"
              (ngModelChange)="searchTerm.set($event)"
              [ngModelOptions]="{standalone: true}"
            />

            @if (filteredAvailable().length > 0) {
              <div class="max-h-48 overflow-y-auto space-y-1">
                @for (indicator of filteredAvailable(); track indicator.id) {
                  <div class="flex items-center justify-between px-3 py-1.5 border border-border rounded text-sm">
                    <div class="flex items-center gap-2">
                      <span class="text-text-primary">{{ indicator.name }}</span>
                      <span class="text-xs text-text-tertiary">({{ indicator.type }})</span>
                    </div>
                    <button type="button" class="text-xs text-brand hover:underline" (click)="attachChild(indicator)">+ Ajouter</button>
                  </div>
                }
              </div>
            } @else if (searchTerm()) {
              <p class="text-xs text-text-tertiary">Aucun indicateur disponible.</p>
            }
          </div>
        }

        <div>
          <label for="description" class="block text-sm font-medium text-text-primary mb-1">Description</label>
          <textarea
            id="description"
            formControlName="description"
            rows="3"
            class="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand"
          ></textarea>
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
export class IndicatorModelFormComponent implements OnInit, OnDestroy, HasUnsavedChanges {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly facade = inject(IndicatorModelFacade);
  private readonly el = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  isEditMode = false;
  editId: string | null = null;
  readonly submitting = computed(() => this.facade.createIsPending() || this.facade.updateIsPending());
  readonly form = createIndicatorModelForm(this.fb);

  // Children picker state
  readonly attachedChildren = signal<{ id: string; name: string; type: string }[]>([]);
  readonly searchTerm = signal('');

  readonly filteredAvailable = computed(() => {
    const attached = new Set(this.attachedChildren().map(c => c.id));
    const term = this.searchTerm().toLowerCase();
    return this.facade.items()
      .filter(i => i.type !== 'group')
      .filter(i => i.id !== this.editId)
      .filter(i => !attached.has(i.id))
      .filter(i => !term || i.name.toLowerCase().includes(term));
  });

  private static readonly ENTITY_LABEL = 'Modèles d\'indicateur';
  private static readonly EDIT_TITLE = 'Modifier le modèle d\'indicateur';
  private static readonly CREATE_TITLE = 'Créer un modèle d\'indicateur';
  private static readonly NEW_LABEL = 'Nouveau modèle d\'indicateur';

  get formTitle(): string {
    return this.isEditMode ? IndicatorModelFormComponent.EDIT_TITLE : IndicatorModelFormComponent.CREATE_TITLE;
  }

  readonly formBreadcrumbs = computed(() => {
    if (this.isEditMode) {
      return [
        { label: IndicatorModelFormComponent.ENTITY_LABEL, route: '/indicator-models' },
        { label: this.facade.selectedItem()?.name ?? '...', route: '/indicator-models/' + this.editId },
        { label: 'Modifier' },
      ];
    }
    return [
      { label: IndicatorModelFormComponent.ENTITY_LABEL, route: '/indicator-models' },
      { label: IndicatorModelFormComponent.NEW_LABEL },
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
          technical_label: item.technical_label,
          description: item.description ?? null,
          type: item.type,
          unit: item.unit ?? null,
        });
        // Pre-populate children for group type
        if (item.type === 'group' && item.children) {
          this.attachedChildren.set(
            item.children.map(c => ({ id: c.id, name: c.name, type: c.type })),
          );
        }
      }
    });
  }

  ngOnInit(): void {
    this.editId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.editId;

    // Load all indicators for the children picker
    this.facade.load();

    if (this.isEditMode && this.editId) {
      this.facade.select(this.editId);
    }

    // Clear children when type changes away from group
    this.form.get('type')?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((type) => {
      if (type !== 'group') {
        this.attachedChildren.set([]);
        this.searchTerm.set('');
      }
    });
  }

  ngOnDestroy(): void {
    this.facade.clearSelection();
  }

  showError(field: string): boolean {
    const control = this.form.get(field);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  attachChild(indicator: { id: string; name: string; type: string }): void {
    this.attachedChildren.update(list => [...list, { id: indicator.id, name: indicator.name, type: indicator.type }]);
    this.form.markAsDirty();
  }

  detachChild(id: string): void {
    this.attachedChildren.update(list => list.filter(c => c.id !== id));
    this.form.markAsDirty();
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      const firstInvalid = this.el.nativeElement.querySelector('.ng-invalid[formControlName]') as HTMLElement | null;
      firstInvalid?.focus();
      return;
    }

    const raw = this.form.getRawValue();
    const data = {
      name: raw.name!,
      technical_label: raw.technical_label!,
      description: raw.description,
      type: raw.type! as 'text' | 'number' | 'group',
      unit: raw.type === 'group' ? null : raw.unit,
      status: 'draft' as const,
      children_ids: raw.type === 'group' ? this.attachedChildren().map(c => c.id) : null,
    };
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
      this.router.navigate(['/indicator-models', this.editId]);
    } else {
      this.router.navigate(['/indicator-models']);
    }
  }
}
