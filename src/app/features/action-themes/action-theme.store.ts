import { computed, inject } from '@angular/core';
import { signalStore, withComputed } from '@ngrx/signals';

import { ActionThemeDomainStore } from '@domains/action-themes/action-theme.store';

export const ActionThemeFeatureStore = signalStore(
  { providedIn: 'root' },
  withComputed(() => {
    const domainStore = inject(ActionThemeDomainStore);
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
