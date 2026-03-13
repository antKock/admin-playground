// Facade — single entry point for UI components.
// Exposes readonly signals (via feature store) and intention methods (via domain store).
// Handles toast feedback, navigation, and error mapping so components stay presentation-only.
import { Injectable, inject, computed } from '@angular/core';
import { Router } from '@angular/router';

import { CommunityDomainStore } from '@domains/communities/community.store';
import { CommunityCreate, CommunityUpdate, UserRead } from '@domains/communities/community.models';
import { ToastService } from '@app/shared/services/toast.service';
import { handleMutationError } from '@domains/shared/mutation-error-handler';
import { CommunityFeatureStore } from './community.store';

@Injectable({ providedIn: 'root' })
export class CommunityFacade {
  private readonly domainStore = inject(CommunityDomainStore);
  private readonly featureStore = inject(CommunityFeatureStore);
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

  // User assignment signals
  readonly allUsers = this.featureStore.allUsers;
  readonly isLoadingUsers = this.featureStore.isLoadingUsers;

  // Hierarchy signals
  readonly parents = this.featureStore.parents;
  readonly children = this.featureStore.children;
  readonly isLoadingParents = this.featureStore.isLoadingParents;
  readonly isLoadingChildren = this.featureStore.isLoadingChildren;
  readonly parentsError = this.featureStore.parentsError;
  readonly childrenError = this.featureStore.childrenError;

  // Computed: users assigned to the currently selected community
  readonly communityUsers = computed<UserRead[]>(() => {
    const community = this.selectedItem();
    const users = this.allUsers();
    if (!community) return [];
    return users.filter(u =>
      u.communities?.some(c => c.id === community.id) ?? false,
    );
  });

  // Per-mutation CRUD status signals
  readonly createIsPending = this.domainStore.createMutationIsPending;
  readonly updateIsPending = this.domainStore.updateMutationIsPending;
  readonly deleteIsPending = this.domainStore.deleteMutationIsPending;
  readonly assignIsPending = this.domainStore.assignUserMutationIsPending;
  readonly removeIsPending = this.domainStore.removeUserMutationIsPending;
  readonly anyMutationPending = computed(() =>
    this.createIsPending() || this.updateIsPending() || this.deleteIsPending() ||
    this.assignIsPending() || this.removeIsPending(),
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
    this.domainStore.loadParents(id);
    this.domainStore.loadChildren(id);
  }

  clearSelection(): void {
    this.domainStore.clearSelection();
    this.domainStore.clearHierarchy();
  }

  loadUsers(): void {
    this.domainStore.loadUsers();
  }

  async create(data: CommunityCreate): Promise<void> {
    const result = await this.domainStore.createMutation(data);
    if (result.status === 'success') {
      this.toast.success('Communauté créée');
      this.router.navigate(['/communities']);
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error);
    }
  }

  async update(id: string, data: CommunityUpdate): Promise<void> {
    const result = await this.domainStore.updateMutation({ id, data });
    if (result.status === 'success') {
      this.toast.success('Communauté mise à jour');
      this.domainStore.load(undefined);
      this.router.navigate(['/communities', id]);
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error);
    }
  }

  async delete(id: string): Promise<void> {
    const result = await this.domainStore.deleteMutation(id);
    if (result.status === 'success') {
      this.toast.success('Communauté supprimée');
      this.router.navigate(['/communities']);
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error);
    }
  }

  async assignUser(communityId: string, userId: string): Promise<void> {
    const result = await this.domainStore.assignUserMutation({ communityId, userId });
    if (result.status === 'success') {
      this.toast.success('Utilisateur assigné à la communauté');
      this.domainStore.loadUsers();
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error);
    }
  }

  async removeUser(communityId: string, userId: string): Promise<void> {
    const result = await this.domainStore.removeUserMutation({ communityId, userId });
    if (result.status === 'success') {
      this.toast.success('Utilisateur retiré de la communauté');
      this.domainStore.loadUsers();
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error);
    }
  }
}
