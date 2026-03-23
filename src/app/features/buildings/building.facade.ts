// Facade — single entry point for UI components.
// Exposes readonly signals (via feature store) and intention methods (via domain store).
// Handles toast feedback, navigation, and error mapping so components stay presentation-only.
import { Injectable, inject, computed } from '@angular/core';
import { Router } from '@angular/router';

import { BuildingDomainStore } from '@domains/building/building.store';
import { BuildingCreate, BuildingUpdate } from '@domains/building/building.models';
import { SiteDomainStore } from '@domains/site/site.store';
import { ToastService } from '@app/shared/services/toast.service';
import { handleMutationError } from '@domains/shared/mutation-error-handler';
import { FilterParams } from '@domains/shared/with-cursor-pagination';
import { BuildingFeatureStore } from './building.store';

@Injectable({ providedIn: 'root' })
export class BuildingFacade {
  private readonly domainStore = inject(BuildingDomainStore);
  private readonly featureStore = inject(BuildingFeatureStore);
  private readonly siteStore = inject(SiteDomainStore);
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

  // Per-mutation CRUD status signals
  readonly createIsPending = this.domainStore.createMutationIsPending;
  readonly updateIsPending = this.domainStore.updateMutationIsPending;
  readonly deleteIsPending = this.domainStore.deleteMutationIsPending;
  readonly addRnbIsPending = this.domainStore.addRnbMutationIsPending;
  readonly removeRnbIsPending = this.domainStore.removeRnbMutationIsPending;
  readonly anyMutationPending = computed(() =>
    this.createIsPending() || this.updateIsPending() || this.deleteIsPending() ||
    this.addRnbIsPending() || this.removeRnbIsPending(),
  );

  // Site options for form select
  readonly siteOptions = computed(() =>
    (this.siteStore.items() as { id: string; name: string }[]).map((s) => ({ id: s.id, name: s.name })),
  );
  readonly siteLoading = computed(() => this.siteStore.isLoading());

  // Resolve site name from loaded items (for detail view)
  readonly siteName = computed(() => {
    const item = this.selectedItem();
    if (!item) return null;
    const site = this.siteOptions().find((s) => s.id === item.site_id);
    return site?.name ?? null;
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

  loadSiteOptions(): void {
    this.siteStore.loadAll(undefined);
  }

  // CRUD mutations
  async create(data: BuildingCreate): Promise<void> {
    const result = await this.domainStore.createMutation(data);
    if (result.status === 'success') {
      this.toast.success('Bâtiment créé');
      this.router.navigate(['/buildings']);
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error);
    }
  }

  async update(id: string, data: BuildingUpdate): Promise<void> {
    const result = await this.domainStore.updateMutation({ id, data });
    if (result.status === 'success') {
      this.toast.success('Bâtiment mis à jour');
      this.domainStore.load(undefined);
      this.router.navigate(['/buildings', id]);
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error);
    }
  }

  async delete(id: string): Promise<void> {
    const result = await this.domainStore.deleteMutation(id);
    if (result.status === 'success') {
      this.toast.success('Bâtiment supprimé');
      this.router.navigate(['/buildings']);
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error);
    }
  }

  // RNB mutations
  async addRnb(buildingId: string, rnbId: string): Promise<void> {
    const result = await this.domainStore.addRnbMutation({ buildingId, rnbId });
    if (result.status === 'success') {
      this.toast.success('RNB ajouté');
      this.domainStore.selectById(buildingId);
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error, 'Impossible d\'ajouter le RNB');
    }
  }

  async removeRnb(buildingId: string, rnbId: string): Promise<void> {
    const result = await this.domainStore.removeRnbMutation({ buildingId, rnbId });
    if (result.status === 'success') {
      this.toast.success('RNB supprimé');
      this.domainStore.selectById(buildingId);
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error, 'Impossible de supprimer le RNB');
    }
  }
}
