// Facade — single entry point for UI components.
// Exposes readonly signals (via feature store) and intention methods (via domain store).
// Handles toast feedback, navigation, and error mapping so components stay presentation-only.
import { Injectable, inject, computed } from '@angular/core';
import { Router } from '@angular/router';

import { FundingProgramDomainStore } from '@domains/funding-programs/funding-program.store';
import { FundingProgramCreate, FundingProgramUpdate } from '@domains/funding-programs/funding-program.models';
import { FolderModelDomainStore } from '@domains/folder-models/folder-model.store';
import { ToastService } from '@app/shared/services/toast.service';
import { handleMutationError } from '@domains/shared/mutation-error-handler';
import { FundingProgramFeatureStore } from './funding-program.store';

@Injectable({ providedIn: 'root' })
export class FundingProgramFacade {
  private readonly domainStore = inject(FundingProgramDomainStore);
  private readonly featureStore = inject(FundingProgramFeatureStore);
  private readonly fmDomainStore = inject(FolderModelDomainStore);
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

  // Cross-domain signals for folder-model dropdown
  readonly fmOptions = this.featureStore.fmOptions;
  readonly fmLoading = this.featureStore.fmLoading;

  // Per-mutation CRUD status signals
  readonly createIsPending = this.domainStore.createMutationIsPending;
  readonly updateIsPending = this.domainStore.updateMutationIsPending;
  readonly deleteIsPending = this.domainStore.deleteMutationIsPending;
  readonly anyMutationPending = computed(() =>
    this.createIsPending() || this.updateIsPending() || this.deleteIsPending(),
  );

  // Intention methods
  loadAssociationData(): void {
    this.fmDomainStore.loadAll(undefined);
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

  async create(data: FundingProgramCreate): Promise<void> {
    const result = await this.domainStore.createMutation(data);
    if (result.status === 'success') {
      this.toast.success('Programme de financement créé');
      this.router.navigate(['/funding-programs']);
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error);
    }
  }

  async update(id: string, data: FundingProgramUpdate): Promise<void> {
    const result = await this.domainStore.updateMutation({ id, data });
    if (result.status === 'success') {
      this.toast.success('Programme de financement mis à jour');
      this.domainStore.load(undefined);
      this.router.navigate(['/funding-programs', id]);
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error);
    }
  }

  async delete(id: string): Promise<void> {
    const result = await this.domainStore.deleteMutation(id);
    if (result.status === 'success') {
      this.toast.success('Programme de financement supprimé');
      this.router.navigate(['/funding-programs']);
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error);
    }
  }
}
