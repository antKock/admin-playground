// Facade — single entry point for UI components.
// Exposes readonly signals (via feature store) and intention methods (via domain store).
// Handles toast feedback, navigation, and error mapping so components stay presentation-only.
import { Injectable, inject, computed } from '@angular/core';
import { Router } from '@angular/router';

import { IndicatorModelDomainStore } from '@domains/indicator-models/indicator-model.store';
import { IndicatorModelCreate, IndicatorModelUpdate } from '@domains/indicator-models/indicator-model.models';
import { ToastService } from '@app/shared/services/toast.service';
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

  // Per-mutation CRUD status signals (projected through feature store)
  readonly createIsPending = this.featureStore.createIsPending;
  readonly updateIsPending = this.featureStore.updateIsPending;
  readonly deleteIsPending = this.featureStore.deleteIsPending;
  readonly anyMutationPending = computed(() =>
    this.createIsPending() || this.updateIsPending() || this.deleteIsPending(),
  );

  // Intention methods
  load(filters?: Record<string, string>): void {
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
      this.handleMutationError(result.error);
    }
  }

  async update(id: string, data: IndicatorModelUpdate): Promise<void> {
    const result = await this.domainStore.updateMutation({ id, data });
    if (result.status === 'success') {
      this.toast.success('Modèle d\'indicateur mis à jour');
      this.domainStore.refresh(undefined);
      this.router.navigate(['/indicator-models', id]);
    } else if (result.status === 'error') {
      this.handleMutationError(result.error);
    }
  }

  async delete(id: string): Promise<void> {
    const result = await this.domainStore.deleteMutation(id);
    if (result.status === 'success') {
      this.toast.success('Modèle d\'indicateur supprimé');
      this.router.navigate(['/indicator-models']);
    } else if (result.status === 'error') {
      this.handleMutationError(result.error);
    }
  }

  // Intentionally inlined per facade (not shared) — each facade may need custom error handling in the future.
  private handleMutationError(error: unknown): void {
    const httpError = error as { status?: number; error?: { detail?: unknown; message?: string }; message?: string };
    if (httpError?.status === 409) {
      const reason = httpError.error?.detail || 'lié à d\'autres ressources';
      this.toast.error(`Conflit — ${typeof reason === 'string' ? reason : 'lié à d\'autres ressources'}`);
    } else if (httpError?.status === 422 && httpError.error?.detail) {
      this.toast.error('Veuillez corriger les erreurs de validation');
    } else {
      const message = httpError?.error?.detail || httpError?.error?.message || httpError?.message || 'Une erreur est survenue';
      this.toast.error(typeof message === 'string' ? message : 'Une erreur est survenue');
    }
  }
}
