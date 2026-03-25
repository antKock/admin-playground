import { Component, inject, OnInit, OnDestroy, computed, effect, signal, ElementRef, DestroyRef, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HasUnsavedChanges } from '@shared/guards/unsaved-changes.guard';
import { BreadcrumbItem } from '@app/shared/components/breadcrumb/breadcrumb.component';
import { FormFieldComponent } from '@shared/components/form-field/form-field.component';
import { FormPageLayoutComponent } from '@app/shared/components/layouts/form-page-layout.component';

import { createIndicatorModelForm } from '@domains/indicator-models/forms/indicator-model.form';
import { IndicatorModelFacade } from '../indicator-model.facade';

@Component({
  selector: 'app-indicator-model-form',
  imports: [ReactiveFormsModule, FormsModule, FormFieldComponent, FormPageLayoutComponent],
  templateUrl: './indicator-model-form.component.html',
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

  // Choices management for list_single / list_multiple types
  readonly choices = signal<{ value: string; label: string; position: number }[]>([]);

  // Reactive type value for template conditionals
  private readonly typeValue: Signal<string | null> = toSignal(
    this.form.get('type')!.valueChanges,
    { initialValue: this.form.get('type')!.value },
  );
  readonly isListType = computed(() => {
    const t = this.typeValue();
    return t === 'list_single' || t === 'list_multiple';
  });

  readonly filteredAvailable = this.facade.availableChildIndicators;

  readonly unitOptions = [
    'kWh', 'MWh', 'GWh', 'kW', 'MW', 'GW', 'tep', 'ktep',
    'tCO2', 'tCO2e', 'kgCO2e',
    'm²', 'ha', 'km²', 'm', 'km', 'ml', 'm³', 'L',
    'kg', 't', 'kt',
    '€', 'k€', 'M€', '€/m²', '€/MWh', '€/tCO2',
    'h', 'jour', 'mois', 'an',
    '%', 'kWh/m²/an', 'kWh/m²', 'W/m²', 'kWc', 'kWh/an',
    'unité', 'logement', 'ETP',
  ];

  private static readonly ENTITY_LABEL = 'Modèles d\'indicateur';
  private static readonly EDIT_TITLE = 'Modifier le modèle d\'indicateur';
  private static readonly CREATE_TITLE = 'Créer un modèle d\'indicateur';
  private static readonly NEW_LABEL = 'Nouveau modèle d\'indicateur';

  get formTitle(): string {
    return this.isEditMode ? IndicatorModelFormComponent.EDIT_TITLE : IndicatorModelFormComponent.CREATE_TITLE;
  }

  readonly formBreadcrumbs = computed<BreadcrumbItem[]>(() => {
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
        // Pre-populate choices for list types
        if ((item.type === 'list_single' || item.type === 'list_multiple') && item.choices) {
          this.choices.set(
            item.choices.map(c => ({ value: c.value, label: c.label, position: c.position })),
          );
        }
        // Pre-populate children for group type
        if (item.type === 'group' && item.children) {
          this.attachedChildren.set(
            item.children.map(c => ({ id: c.id, name: c.name, type: c.type })),
          );
          this.facade.setExcludeChildrenIds(item.children.map(c => c.id));
        }
      }
    });
  }

  ngOnInit(): void {
    this.editId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.editId;
    this.facade.setEditItemId(this.editId);

    // Load all indicators for the children picker
    this.facade.load();

    if (this.isEditMode && this.editId) {
      this.facade.select(this.editId);
    }

    // Clear type-specific state when type changes
    this.form.get('type')?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((type) => {
      if (type !== 'group') {
        this.attachedChildren.set([]);
        this.searchTerm.set('');
        this.facade.setChildSearchTerm('');
        this.facade.setExcludeChildrenIds([]);
      }
      if (type !== 'list_single' && type !== 'list_multiple') {
        this.choices.set([]);
      }
    });
  }

  ngOnDestroy(): void {
    this.facade.clearSelection();
    this.facade.setEditItemId(null);
    this.facade.setChildSearchTerm('');
    this.facade.setExcludeChildrenIds([]);
  }

  addChoice(): void {
    this.choices.update(list => [...list, { value: '', label: '', position: list.length }]);
    this.form.markAsDirty();
  }

  removeChoice(index: number): void {
    this.choices.update(list => list.filter((_, i) => i !== index).map((c, i) => ({ ...c, position: i })));
    this.form.markAsDirty();
  }

  updateChoice(index: number, field: 'value' | 'label', val: string): void {
    this.choices.update(list => list.map((c, i) => i === index ? { ...c, [field]: val } : c));
    this.form.markAsDirty();
  }

  onChildSearch(term: string): void {
    this.searchTerm.set(term);
    this.facade.setChildSearchTerm(term);
  }

  attachChild(indicator: { id: string; name: string; type: string }): void {
    this.attachedChildren.update(list => [...list, { id: indicator.id, name: indicator.name, type: indicator.type }]);
    this.facade.setExcludeChildrenIds(this.attachedChildren().map(c => c.id));
    this.form.markAsDirty();
  }

  detachChild(id: string): void {
    this.attachedChildren.update(list => list.filter(c => c.id !== id));
    this.facade.setExcludeChildrenIds(this.attachedChildren().map(c => c.id));
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
    const data = this.facade.prepareIndicatorData(
      { name: raw.name!, technical_label: raw.technical_label!, description: raw.description, type: raw.type!, unit: raw.unit },
      this.attachedChildren().map(c => c.id),
      this.isListType() ? this.choices() : null,
    );
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
      this.router.navigate(['/indicator-models', this.editId]);
    } else {
      this.router.navigate(['/indicator-models']);
    }
  }
}
