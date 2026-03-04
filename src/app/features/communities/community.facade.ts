// Facade — single entry point for UI components.
// Exposes readonly signals (via feature store) and intention methods (via domain store).
// Handles toast feedback, navigation, and error mapping so components stay presentation-only.
import { Injectable, inject, computed } from '@angular/core';
import { Router } from '@angular/router';

import { CommunityDomainStore } from '@domains/communities/community.store';
import { CommunityCreate, CommunityUpdate, UserRead } from '@domains/communities/community.models';
import { ToastService } from '@app/shared/services/toast.service';
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

  // User assignment signals
  readonly allUsers = this.featureStore.allUsers;
  readonly isLoadingUsers = this.featureStore.isLoadingUsers;

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
  }

  clearSelection(): void {
    this.domainStore.clearSelection();
  }

  loadUsers(): void {
    this.domainStore.loadUsers();
  }

  async create(data: CommunityCreate): Promise<void> {
    const result = await this.domainStore.createMutation(data);
    if (result.status === 'success') {
      this.toast.success('Community created');
      this.router.navigate(['/communities']);
    } else if (result.status === 'error') {
      this.handleMutationError(result.error);
    }
  }

  async update(id: string, data: CommunityUpdate): Promise<void> {
    const result = await this.domainStore.updateMutation({ id, data });
    if (result.status === 'success') {
      this.toast.success('Community updated');
      this.domainStore.load(undefined);
      this.router.navigate(['/communities', id]);
    } else if (result.status === 'error') {
      this.handleMutationError(result.error);
    }
  }

  async delete(id: string): Promise<void> {
    const result = await this.domainStore.deleteMutation(id);
    if (result.status === 'success') {
      this.toast.success('Community deleted');
      this.router.navigate(['/communities']);
    } else if (result.status === 'error') {
      this.handleMutationError(result.error);
    }
  }

  async assignUser(communityId: string, userId: string): Promise<void> {
    const result = await this.domainStore.assignUserMutation({ communityId, userId });
    if (result.status === 'success') {
      this.toast.success('User assigned to Community');
      this.domainStore.loadUsers();
    } else if (result.status === 'error') {
      this.handleMutationError(result.error);
    }
  }

  async removeUser(communityId: string, userId: string): Promise<void> {
    const result = await this.domainStore.removeUserMutation({ communityId, userId });
    if (result.status === 'success') {
      this.toast.success('User removed from Community');
      this.domainStore.loadUsers();
    } else if (result.status === 'error') {
      this.handleMutationError(result.error);
    }
  }

  private handleMutationError(error: unknown): void {
    const httpError = error as { status?: number; error?: { detail?: unknown; message?: string }; message?: string };
    if (httpError?.status === 409) {
      const reason = httpError.error?.detail || 'This community is linked to other resources';
      this.toast.error(`Conflict — ${typeof reason === 'string' ? reason : 'linked to other resources'}`);
    } else if (httpError?.status === 422 && httpError.error?.detail) {
      this.toast.error('Please fix the validation errors');
    } else {
      const message = httpError?.error?.detail || httpError?.error?.message || httpError?.message || 'An error occurred';
      this.toast.error(typeof message === 'string' ? message : 'An error occurred');
    }
  }
}
