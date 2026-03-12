// Feature store — ONLY withComputed, no mutations or methods.
// Projects typed signals from the domain store for UI consumption.
import { computed, inject } from '@angular/core';
import { signalStore, withComputed } from '@ngrx/signals';

import { UserDomainStore } from '@domains/users/user.store';
import { UserRead } from '@domains/users/user.models';

export const UserFeatureStore = signalStore(
  { providedIn: 'root' },
  withComputed(() => {
    const domainStore = inject(UserDomainStore);
    return {
      items: computed(() => domainStore.items() as UserRead[]),
      selectedItem: computed(() => domainStore.selectedItem()),
      isLoading: computed(() => domainStore.isLoading()),
      isLoadingDetail: computed(() => domainStore.isLoadingDetail()),
      hasMore: computed(() => domainStore.hasMore()),
      error: computed(() => domainStore.error()),
      detailError: computed(() => domainStore.detailError()),
      isEmpty: computed(() => domainStore.isEmpty()),
      totalLoaded: computed(() => domainStore.totalLoaded()),
      totalCount: computed(() => domainStore.totalCount()),
      roles: computed(() => domainStore.roles()),
      isLoadingRoles: computed(() => domainStore.isLoadingRoles()),
      allCommunities: computed(() => domainStore.allCommunities()),
      isLoadingCommunities: computed(() => domainStore.isLoadingCommunities()),
      communitiesError: computed(() => domainStore.communitiesError()),
    };
  }),
);
