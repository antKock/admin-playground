// Facade — single entry point for UI components.
// Exposes readonly signals (via feature store) and intention methods (via domain store).
// No status workflow for Folder Models.
import { Injectable, inject, computed } from '@angular/core';
import { Router } from '@angular/router';

import { FolderModelDomainStore } from '@domains/folder-models/folder-model.store';
import { FolderModelCreate, FolderModelUpdate } from '@domains/folder-models/folder-model.models';
import { FundingProgramDomainStore } from '@domains/funding-programs/funding-program.store';
import { ToastService } from '@shared/components/toast/toast.service';
import { handleMutationError } from '@domains/shared/mutation-error-handler';
import { FilterParams } from '@domains/shared/with-cursor-pagination';
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
  readonly totalCount = this.featureStore.totalCount;

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
  loadAssociationData(): void {
    this.fpDomainStore.loadAll(undefined);
  }

  load(filters?: FilterParams): void {
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
      handleMutationError(this.toast, result.error);
    }
  }

  async update(id: string, data: FolderModelUpdate): Promise<void> {
    const result = await this.domainStore.updateMutation({ id, data });
    if (result.status === 'success') {
      this.toast.success('Modèle de dossier mis à jour');
      this.domainStore.refresh(undefined);
      this.router.navigate(['/folder-models', id]);
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error);
    }
  }

  async delete(id: string): Promise<void> {
    const result = await this.domainStore.deleteMutation(id);
    if (result.status === 'success') {
      this.toast.success('Modèle de dossier supprimé');
      this.router.navigate(['/folder-models']);
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error);
    }
  }
}
