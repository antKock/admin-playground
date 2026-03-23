// Facade — single entry point for UI components.
// Exposes readonly signals (via feature store) and intention methods (via domain store).
// Handles toast feedback, navigation, and error mapping so components stay presentation-only.
import { Injectable, inject, computed } from '@angular/core';
import { Router } from '@angular/router';

import { SiteDomainStore } from '@domains/site/site.store';
import { SiteCreate, SiteUpdate } from '@domains/site/site.models';
import { CommunityDomainStore } from '@domains/communities/community.store';
import { ToastService } from '@shared/components/toast/toast.service';
import { handleMutationError } from '@domains/shared/mutation-error-handler';
import { FilterParams } from '@domains/shared/with-cursor-pagination';
import { SiteFeatureStore } from './site.store';

@Injectable({ providedIn: 'root' })
export class SiteFacade {
  private readonly domainStore = inject(SiteDomainStore);
  private readonly featureStore = inject(SiteFeatureStore);
  private readonly communityStore = inject(CommunityDomainStore);
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

  // Buildings sub-list
  readonly buildings = this.featureStore.buildings;
  readonly isLoadingBuildings = this.featureStore.isLoadingBuildings;
  readonly buildingsError = this.featureStore.buildingsError;

  // Per-mutation CRUD status signals
  readonly createIsPending = this.domainStore.createMutationIsPending;
  readonly updateIsPending = this.domainStore.updateMutationIsPending;
  readonly deleteIsPending = this.domainStore.deleteMutationIsPending;
  readonly anyMutationPending = computed(() =>
    this.createIsPending() || this.updateIsPending() || this.deleteIsPending(),
  );

  // Community options for form select
  readonly communityOptions = computed(() =>
    (this.communityStore.items() as { id: string; name: string }[]).map((c) => ({ id: c.id, name: c.name })),
  );
  readonly communityLoading = computed(() => this.communityStore.isLoading());

  // Resolve community name from loaded items (for detail view)
  readonly communityName = computed(() => {
    const item = this.selectedItem();
    if (!item) return null;
    const community = this.communityOptions().find((c) => c.id === item.community_id);
    return community?.name ?? null;
  });

  // Intention methods
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

  loadBuildings(siteId: string): void {
    this.domainStore.loadBuildings(siteId);
  }

  loadCommunityOptions(): void {
    this.communityStore.loadAll(undefined);
  }

  // CRUD mutations
  async create(data: SiteCreate): Promise<void> {
    const result = await this.domainStore.createMutation(data);
    if (result.status === 'success') {
      this.toast.success('Site créé');
      this.router.navigate(['/sites']);
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error);
    }
  }

  async update(id: string, data: SiteUpdate): Promise<void> {
    const result = await this.domainStore.updateMutation({ id, data });
    if (result.status === 'success') {
      this.toast.success('Site mis à jour');
      this.domainStore.load(undefined);
      this.router.navigate(['/sites', id]);
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error);
    }
  }

  async delete(id: string): Promise<void> {
    const result = await this.domainStore.deleteMutation(id);
    if (result.status === 'success') {
      this.toast.success('Site supprimé');
      this.router.navigate(['/sites']);
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error);
    }
  }
}
