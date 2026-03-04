import { computed, inject } from '@angular/core';
import { signalStore, withComputed } from '@ngrx/signals';

import { FundingProgramDomainStore } from '@domains/funding-programs/funding-program.store';

export const FundingProgramFeatureStore = signalStore(
  { providedIn: 'root' },
  withComputed(() => {
    const domainStore = inject(FundingProgramDomainStore);
    return {
      items: computed(() => domainStore.items()),
      selectedItem: computed(() => domainStore.selectedItem()),
      isLoading: computed(() => domainStore.isLoading()),
      isLoadingDetail: computed(() => domainStore.isLoadingDetail()),
      hasMore: computed(() => domainStore.hasMore()),
      error: computed(() => domainStore.error()),
      isEmpty: computed(() => domainStore.isEmpty()),
      totalLoaded: computed(() => domainStore.totalLoaded()),
    };
  }),
);
