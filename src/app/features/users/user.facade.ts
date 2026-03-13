// Facade — single entry point for UI components.
// Exposes readonly signals (via feature store) and intention methods (via domain store).
// Handles toast feedback, navigation, and error mapping so components stay presentation-only.
import { Injectable, inject, computed } from '@angular/core';
import { Router } from '@angular/router';

import { UserDomainStore } from '@domains/users/user.store';
import { UserCreate, UserUpdate } from '@domains/users/user.models';
import { ToastService } from '@app/shared/services/toast.service';
import { handleMutationError } from '@domains/shared/mutation-error-handler';
import { UserFeatureStore } from './user.store';

@Injectable({ providedIn: 'root' })
export class UserFacade {
  private readonly domainStore = inject(UserDomainStore);
  private readonly featureStore = inject(UserFeatureStore);
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

  // Role signals
  readonly roles = this.featureStore.roles;
  readonly isLoadingRoles = this.featureStore.isLoadingRoles;

  // Community signals
  readonly allCommunities = this.featureStore.allCommunities;
  readonly isLoadingCommunities = this.featureStore.isLoadingCommunities;
  readonly communitiesError = this.featureStore.communitiesError;

  // Per-mutation CRUD status signals
  readonly createIsPending = this.domainStore.createMutationIsPending;
  readonly updateIsPending = this.domainStore.updateMutationIsPending;
  readonly deleteIsPending = this.domainStore.deleteMutationIsPending;
  readonly updateRoleIsPending = this.domainStore.updateRoleMutationIsPending;
  readonly assignCommunityIsPending = this.domainStore.assignCommunityMutationIsPending;
  readonly removeCommunityIsPending = this.domainStore.removeCommunityMutationIsPending;
  readonly anyMutationPending = computed(() =>
    this.createIsPending() || this.updateIsPending() || this.deleteIsPending() ||
    this.updateRoleIsPending() || this.assignCommunityIsPending() || this.removeCommunityIsPending(),
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
  }

  clearSelection(): void {
    this.domainStore.clearSelection();
  }

  loadRoles(): void {
    this.domainStore.loadRoles();
  }

  async create(data: UserCreate): Promise<void> {
    const result = await this.domainStore.createMutation(data);
    if (result.status === 'success') {
      this.toast.success('Utilisateur créé');
      this.router.navigate(['/users']);
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error);
    }
  }

  async update(id: string, data: UserUpdate): Promise<void> {
    const result = await this.domainStore.updateMutation({ id, data });
    if (result.status === 'success') {
      this.toast.success('Utilisateur mis à jour');
      this.domainStore.selectById(id);
      this.router.navigate(['/users', id]);
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error);
    }
  }

  async delete(id: string): Promise<void> {
    const result = await this.domainStore.deleteMutation(id);
    if (result.status === 'success') {
      this.toast.success('Utilisateur supprimé');
      this.router.navigate(['/users']);
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error);
    }
  }

  loadCommunities(): void {
    this.domainStore.loadCommunities();
  }

  async assignCommunity(communityId: string, userId: string): Promise<void> {
    const result = await this.domainStore.assignCommunityMutation({ communityId, userId });
    if (result.status === 'success') {
      this.toast.success('Communauté assignée');
      this.domainStore.selectById(userId);
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error);
    }
  }

  async removeCommunity(communityId: string, userId: string): Promise<void> {
    const result = await this.domainStore.removeCommunityMutation({ communityId, userId });
    if (result.status === 'success') {
      this.toast.success('Communauté retirée');
      this.domainStore.selectById(userId);
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error);
    }
  }

  async updateRole(userId: string, role: string): Promise<void> {
    const result = await this.domainStore.updateRoleMutation({ userId, role });
    if (result.status === 'success') {
      this.toast.success('Rôle mis à jour');
      this.domainStore.selectById(userId);
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error);
    }
  }
}
