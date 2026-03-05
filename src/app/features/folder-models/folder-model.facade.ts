// Facade — single entry point for UI components.
// Exposes readonly signals (via feature store) and intention methods (via domain store).
// No status workflow for Folder Models.
import { Injectable, inject, computed } from '@angular/core';
import { Router } from '@angular/router';

import { FolderModelDomainStore } from '@domains/folder-models/folder-model.store';
import { FolderModelCreate, FolderModelUpdate } from '@domains/folder-models/folder-model.models';
import { FundingProgramDomainStore } from '@domains/funding-programs/funding-program.store';
import { ToastService } from '@app/shared/services/toast.service';
import { FolderModelFeatureStore } from './folder-model.store';

@Injectable({ providedIn: 'root' })
export class FolderModelFacade {
  private readonly domainStore = inject(FolderModelDomainStore);
  private readonly featureStore = inject(FolderModelFeatureStore);
  private readonly fpDomainStore = inject(FundingProgramDomainStore);
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

  // Cross-domain FP signals (projected through feature store)
  readonly fpOptions = this.featureStore.fpOptions;
  readonly fpLoading = this.featureStore.fpLoading;

  // Per-mutation CRUD status signals (projected through feature store)
  readonly createIsPending = this.featureStore.createIsPending;
  readonly updateIsPending = this.featureStore.updateIsPending;
  readonly deleteIsPending = this.featureStore.deleteIsPending;
  readonly anyMutationPending = computed(() =>
    this.createIsPending() || this.updateIsPending() || this.deleteIsPending(),
  );

  // Intention methods
  // TODO: [H3] load() only fetches the first page (default limit ~20). If there are >20 FPs,
  // multi-selector options will be incomplete. Fix: add a loadAll() to withCursorPagination or
  // use a dedicated non-paginated endpoint for association selectors.
  loadAssociationData(): void {
    this.fpDomainStore.load(undefined);
  }

  load(filters?: Record<string, string>): void {
    this.domainStore.load(filters);
  }

  loadMore(): void {
    this.domainStore.loadMore();
  }

  select(id: string): void {
    this.domainStore.selectById(id);
  }

  clearSelection(): void {
    this.domainStore.clearSelection();
  }

  async create(data: FolderModelCreate): Promise<void> {
    const result = await this.domainStore.createMutation(data);
    if (result.status === 'success') {
      this.toast.success('Modèle de dossier créé');
      this.router.navigate(['/folder-models']);
    } else if (result.status === 'error') {
      this.handleMutationError(result.error);
    }
  }

  async update(id: string, data: FolderModelUpdate): Promise<void> {
    const result = await this.domainStore.updateMutation({ id, data });
    if (result.status === 'success') {
      this.toast.success('Modèle de dossier mis à jour');
      this.domainStore.refresh(undefined);
      this.router.navigate(['/folder-models', id]);
    } else if (result.status === 'error') {
      this.handleMutationError(result.error);
    }
  }

  async delete(id: string): Promise<void> {
    const result = await this.domainStore.deleteMutation(id);
    if (result.status === 'success') {
      this.toast.success('Modèle de dossier supprimé');
      this.router.navigate(['/folder-models']);
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
