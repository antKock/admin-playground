// Feature store — ONLY withComputed, no mutations or methods.
// Projects typed signals from the domain store for UI consumption.
import { computed, inject } from '@angular/core';
import { signalStore, withComputed } from '@ngrx/signals';

import { IndicatorModelDomainStore } from '@domains/indicator-models/indicator-model.store';
import { IndicatorModel } from '@domains/indicator-models/indicator-model.models';

export const IndicatorModelFeatureStore = signalStore(
  { providedIn: 'root' },
  withComputed(() => {
    const domainStore = inject(IndicatorModelDomainStore);
    return {
      items: computed(() => domainStore.items() as IndicatorModel[]),
      selectedItem: computed(() => domainStore.selectedItem()),
      isLoading: computed(() => domainStore.isLoading()),
      isLoadingDetail: computed(() => domainStore.isLoadingDetail()),
      hasMore: computed(() => domainStore.hasMore()),
      error: computed(() => domainStore.error()),
      detailError: computed(() => domainStore.detailError()),
      isEmpty: computed(() => domainStore.isEmpty()),
      totalLoaded: computed(() => domainStore.totalLoaded()),
      totalCount: computed(() => domainStore.totalCount()),

      // Per-mutation status signals
      createIsPending: computed(() => domainStore.createMutationIsPending()),
      updateIsPending: computed(() => domainStore.updateMutationIsPending()),
      deleteIsPending: computed(() => domainStore.deleteMutationIsPending()),

      // Usage visibility signals
      usedInModels: computed(() => domainStore.usedInActionModels()),
      usageCount: computed(() => domainStore.usedInActionModels().length),
      isLoadingUsage: computed(() => domainStore.isLoadingUsage()),
      usageError: computed(() => domainStore.usageError()),
    };
  }),
);
