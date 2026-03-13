// Facade — single entry point for UI components.
// Exposes readonly signals (via feature store) and intention methods (via domain store).
// Handles toast feedback, navigation, and error mapping so components stay presentation-only.
import { Injectable, inject, computed } from '@angular/core';
import { Router } from '@angular/router';

import { AgentDomainStore } from '@domains/agents/agent.store';
import { AgentCreate, AgentUpdate, AgentStatus } from '@domains/agents/agent.models';
import { CommunityDomainStore } from '@domains/communities/community.store';
import { ToastService } from '@app/shared/services/toast.service';
import { handleMutationError } from '@domains/shared/mutation-error-handler';
import { AgentFeatureStore } from './agent.store';

@Injectable({ providedIn: 'root' })
export class AgentFacade {
  private readonly domainStore = inject(AgentDomainStore);
  private readonly featureStore = inject(AgentFeatureStore);
  private readonly communityDomainStore = inject(CommunityDomainStore);
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

  // Cross-domain signals for community selector
  readonly communityOptions = this.featureStore.communityOptions;
  readonly communityLoading = this.featureStore.communityLoading;

  // Per-mutation CRUD status signals
  readonly createIsPending = this.domainStore.createMutationIsPending;
  readonly updateIsPending = this.domainStore.updateMutationIsPending;
  readonly deleteIsPending = this.domainStore.deleteMutationIsPending;
  readonly changeStatusIsPending = this.domainStore.changeStatusMutationIsPending;
  readonly anyMutationPending = computed(() =>
    this.createIsPending() || this.updateIsPending() || this.deleteIsPending() || this.changeStatusIsPending(),
  );

  // Intention methods
  loadAssociationData(): void {
    this.communityDomainStore.loadAll(undefined);
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

  async create(data: AgentCreate): Promise<void> {
    const result = await this.domainStore.createMutation(data);
    if (result.status === 'success') {
      this.toast.success('Agent créé');
      this.router.navigate(['/agents']);
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error);
    }
  }

  async update(id: string, data: AgentUpdate): Promise<void> {
    const result = await this.domainStore.updateMutation({ id, data });
    if (result.status === 'success') {
      this.toast.success('Agent mis à jour');
      this.domainStore.load(undefined);
      this.router.navigate(['/agents', id]);
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error);
    }
  }

  async delete(id: string): Promise<void> {
    const result = await this.domainStore.deleteMutation(id);
    if (result.status === 'success') {
      this.toast.success('Agent supprimé');
      this.router.navigate(['/agents']);
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error);
    }
  }

  async changeStatus(id: string, newStatus: AgentStatus): Promise<void> {
    const result = await this.domainStore.changeStatusMutation({ id, status: newStatus });
    if (result.status === 'success') {
      this.toast.success(`Statut de l'agent changé en ${newStatus}`);
      this.domainStore.selectById(id);
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error);
    }
  }
}
