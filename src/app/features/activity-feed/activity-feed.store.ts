// Feature store — ONLY withComputed, no mutations or methods.
// Projects typed signals from the GlobalHistoryStore for UI consumption.
import { computed, inject } from '@angular/core';
import { signalStore, withComputed } from '@ngrx/signals';

import { GlobalHistoryStore } from '@domains/history/global-history.store';
import { ActivityResponse } from '@domains/history/history.models';

export const ActivityFeedFeatureStore = signalStore(
  { providedIn: 'root' },
  withComputed(() => {
    const domainStore = inject(GlobalHistoryStore);
    return {
      activities: computed(() => domainStore.activities() as ActivityResponse[]),
      isLoading: computed(() => domainStore.isLoading()),
      hasMore: computed(() => domainStore.hasMore()),
      error: computed(() => domainStore.error()),
      isEmpty: computed(() => domainStore.isEmpty()),
      totalLoaded: computed(() => domainStore.totalLoaded()),
    };
  }),
);
