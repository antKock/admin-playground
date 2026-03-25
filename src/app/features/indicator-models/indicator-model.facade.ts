// Facade — single entry point for UI components.
// Exposes readonly signals (via feature store) and intention methods (via domain store).
// Handles toast feedback, navigation, and error mapping so components stay presentation-only.
import { Injectable, inject, computed, signal } from '@angular/core';
import { Router } from '@angular/router';

import { IndicatorModelDomainStore } from '@domains/indicator-models/indicator-model.store';
import { IndicatorModelCreate, IndicatorModelUpdate, IndicatorModelType } from '@domains/indicator-models/indicator-model.models';
import { ToastService } from '@shared/components/toast/toast.service';
import { handleMutationError } from '@domains/shared/mutation-error-handler';
import { FilterParams } from '@domains/shared/with-cursor-pagination';
import { IndicatorModelFeatureStore } from './indicator-model.store';

@Injectable({ providedIn: 'root' })
export class IndicatorModelFacade {
  private readonly domainStore = inject(IndicatorModelDomainStore);
  private readonly featureStore = inject(IndicatorModelFeatureStore);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  // Data signals — readonly
  readonly items = this.featureStore.items;
  readonly selectedItem = this.featureStore.selectedItem;
  readonly isLoading = this.featureStore.isLoading;
  readonly isLoadingDetail = this.featureStore.isLoadingDetail;
  readonly hasMore = this.featureStore.hasMore;
  readonly error = this.featureStore.error;
  readonly detailError = this.featureStore.detailError;
  readonly isEmpty = this.featureStore.isEmpty;
  readonly totalCount = this.featureStore.totalCount;

  // Usage visibility signals
  readonly usedInModels = this.featureStore.usedInModels;
  readonly usageCount = this.featureStore.usageCount;
  readonly isLoadingUsage = this.featureStore.isLoadingUsage;
  readonly usageError = this.featureStore.usageError;

  // Per-mutation status signals (directly from domain store)
  readonly createIsPending = this.domainStore.createMutationIsPending;
  readonly updateIsPending = this.domainStore.updateMutationIsPending;
  readonly deleteIsPending = this.domainStore.deleteMutationIsPending;

  // Display-ready rows for list components
  readonly formattedRows = computed(() =>
    this.items().map((item) => ({
      ...item,
      type_display: item.type,
      unit_display: item.type === 'number' ? (item.unit ?? '—') : '',
    })),
  );

  // Per-mutation lifecycle status signals
  readonly publishIsPending = this.domainStore.publishMutationIsPending;
  readonly disableIsPending = this.domainStore.disableMutationIsPending;
  readonly activateIsPending = this.domainStore.activateMutationIsPending;
  readonly anyMutationPending = computed(() =>
    this.createIsPending() || this.updateIsPending() || this.deleteIsPending() ||
    this.publishIsPending() || this.disableIsPending() || this.activateIsPending(),
  );

  // Child indicator picker — filtering state
  private readonly _childSearchTerm = signal('');
  private readonly _excludeChildrenIds = signal<Set<string>>(new Set());
  private readonly _editItemId = signal<string | null>(null);

  setChildSearchTerm(term: string): void {
    this._childSearchTerm.set(term);
  }

  setExcludeChildrenIds(ids: string[]): void {
    this._excludeChildrenIds.set(new Set(ids));
  }

  setEditItemId(id: string | null): void {
    this._editItemId.set(id);
  }

  readonly availableChildIndicators = computed(() => {
    const excluded = this._excludeChildrenIds();
    const term = this._childSearchTerm().toLowerCase();
    const editId = this._editItemId();
    return this.items()
      .filter(i => i.type !== 'group')
      .filter(i => i.id !== editId)
      .filter(i => !excluded.has(i.id))
      .filter(i => !term || i.name.toLowerCase().includes(term));
  });

  prepareIndicatorData(formValue: {
    name: string; technical_label: string; description: string | null;
    type: string; unit: string | null;
  }, attachedChildrenIds: string[]): IndicatorModelCreate {
    return {
      name: formValue.name,
      technical_label: formValue.technical_label,
      description: formValue.description,
      type: formValue.type as IndicatorModelType,
      unit: formValue.type === 'group' ? null : (formValue.unit as IndicatorModelCreate['unit']),
      status: 'draft' as const,
      children_ids: formValue.type === 'group' ? attachedChildrenIds : null,
    };
  }

  // Intention methods
  load(filters?: FilterParams): void {
    this.domainStore.load(filters);
  }

  loadMore(): void {
    this.domainStore.loadMore();
  }

  select(id: string): void {
    this.domainStore.selectById(id);
    this.domainStore.loadUsage(id);
  }

  clearSelection(): void {
    this.domainStore.clearSelection();
  }

  async create(data: IndicatorModelCreate): Promise<void> {
    const result = await this.domainStore.createMutation(data);
    if (result.status === 'success') {
      this.toast.success('Modèle d\'indicateur créé');
      this.router.navigate(['/indicator-models']);
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error);
    }
  }

  async update(id: string, data: IndicatorModelUpdate): Promise<void> {
    const result = await this.domainStore.updateMutation({ id, data });
    if (result.status === 'success') {
      this.toast.success('Modèle d\'indicateur mis à jour');
      this.domainStore.refresh(undefined);
      this.router.navigate(['/indicator-models', id]);
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error);
    }
  }

  async delete(id: string): Promise<void> {
    const result = await this.domainStore.deleteMutation(id);
    if (result.status === 'success') {
      this.toast.success('Modèle d\'indicateur supprimé');
      this.router.navigate(['/indicator-models']);
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error);
    }
  }

  // Lifecycle / status mutations
  async publish(id: string): Promise<void> {
    const result = await this.domainStore.publishMutation(id);
    if (result.status === 'success') {
      this.toast.success('Modèle d\'indicateur publié');
      this.domainStore.selectById(id);
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error, 'Impossible de publier le modèle d\'indicateur');
    }
  }

  async disable(id: string): Promise<void> {
    const result = await this.domainStore.disableMutation(id);
    if (result.status === 'success') {
      this.toast.success('Modèle d\'indicateur désactivé');
      this.domainStore.selectById(id);
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error, 'Impossible de désactiver le modèle d\'indicateur');
    }
  }

  async activate(id: string): Promise<void> {
    const result = await this.domainStore.activateMutation(id);
    if (result.status === 'success') {
      this.toast.success('Modèle d\'indicateur activé');
      this.domainStore.selectById(id);
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error, 'Impossible d\'activer le modèle d\'indicateur');
    }
  }
}
