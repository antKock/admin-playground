// Feature store — ONLY withComputed, no mutations or methods.
// Projects typed signals from the domain store for UI consumption.
import { computed, inject } from '@angular/core';
import { signalStore, withComputed } from '@ngrx/signals';

import { CommunityDomainStore } from '@domains/communities/community.store';
import { CommunityRead, UserRead } from '@domains/communities/community.models';

export const CommunityFeatureStore = signalStore(
  { providedIn: 'root' },
  withComputed(() => {
    const domainStore = inject(CommunityDomainStore);
    return {
      items: computed(() => domainStore.items() as CommunityRead[]),
      selectedItem: computed(() => domainStore.selectedItem()),
      isLoading: computed(() => domainStore.isLoading()),
      isLoadingDetail: computed(() => domainStore.isLoadingDetail()),
      hasMore: computed(() => domainStore.hasMore()),
      error: computed(() => domainStore.error()),
      detailError: computed(() => domainStore.detailError()),
      isEmpty: computed(() => domainStore.isEmpty()),
      totalLoaded: computed(() => domainStore.totalLoaded()),
      totalCount: computed(() => domainStore.totalCount()),
      allUsers: computed(() => domainStore.allUsers() as UserRead[]),
      isLoadingUsers: computed(() => domainStore.isLoadingUsers()),
      parents: computed(() => domainStore.parents()),
      children: computed(() => domainStore.children()),
      isLoadingParents: computed(() => domainStore.isLoadingParents()),
      isLoadingChildren: computed(() => domainStore.isLoadingChildren()),
      parentsError: computed(() => domainStore.parentsError()),
      childrenError: computed(() => domainStore.childrenError()),
    };
  }),
);
