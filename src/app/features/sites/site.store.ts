// Feature store — ONLY withComputed, no mutations or methods.
// Projects typed signals from the domain store for UI consumption.
import { computed, inject } from '@angular/core';
import { signalStore, withComputed } from '@ngrx/signals';

import { SiteDomainStore } from '@domains/site/site.store';
import { Site } from '@domains/site/site.models';

export const SiteFeatureStore = signalStore(
  { providedIn: 'root' },
  withComputed(() => {
    const domainStore = inject(SiteDomainStore);
    return {
      items: computed(() => domainStore.items() as Site[]),
      selectedItem: computed(() => domainStore.selectedItem()),
      isLoading: computed(() => domainStore.isLoading()),
      isLoadingDetail: computed(() => domainStore.isLoadingDetail()),
      hasMore: computed(() => domainStore.hasMore()),
      error: computed(() => domainStore.error()),
      detailError: computed(() => domainStore.detailError()),
      isEmpty: computed(() => domainStore.isEmpty()),
      totalLoaded: computed(() => domainStore.totalLoaded()),
      totalCount: computed(() => domainStore.totalCount()),
      buildings: computed(() => domainStore.buildings()),
      isLoadingBuildings: computed(() => domainStore.isLoadingBuildings()),
      buildingsError: computed(() => domainStore.buildingsError()),
    };
  }),
);
