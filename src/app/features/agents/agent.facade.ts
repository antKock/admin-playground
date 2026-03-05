// Facade — single entry point for UI components.
// Exposes readonly signals (via feature store) and intention methods (via domain store).
// Handles toast feedback, navigation, and error mapping so components stay presentation-only.
import { Injectable, inject, computed } from '@angular/core';
import { Router } from '@angular/router';

import { AgentDomainStore } from '@domains/agents/agent.store';
import { AgentCreate, AgentUpdate, AgentStatus } from '@domains/agents/agent.models';
import { CommunityDomainStore } from '@domains/communities/community.store';
import { ToastService } from '@app/shared/services/toast.service';
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
    this.communityDomainStore.load(undefined);
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
      this.handleMutationError(result.error);
    }
  }

  async update(id: string, data: AgentUpdate): Promise<void> {
    const result = await this.domainStore.updateMutation({ id, data });
    if (result.status === 'success') {
      this.toast.success('Agent mis à jour');
      this.domainStore.load(undefined);
      this.router.navigate(['/agents', id]);
    } else if (result.status === 'error') {
      this.handleMutationError(result.error);
    }
  }

  async delete(id: string): Promise<void> {
    const result = await this.domainStore.deleteMutation(id);
    if (result.status === 'success') {
      this.toast.success('Agent supprimé');
      this.router.navigate(['/agents']);
    } else if (result.status === 'error') {
      this.handleMutationError(result.error);
    }
  }

  async changeStatus(id: string, newStatus: AgentStatus): Promise<void> {
    const result = await this.domainStore.changeStatusMutation({ id, status: newStatus });
    if (result.status === 'success') {
      this.toast.success(`Statut de l'agent changé en ${newStatus}`);
      this.domainStore.selectById(id);
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
