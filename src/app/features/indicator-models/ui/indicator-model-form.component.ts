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
