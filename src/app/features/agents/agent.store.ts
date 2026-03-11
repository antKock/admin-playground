// Feature store — ONLY withComputed, no mutations or methods.
// Projects typed signals from the domain store for UI consumption.
// Cross-domain composition: aggregates Agent and Community domain stores.
import { computed, inject } from '@angular/core';
import { signalStore, withComputed } from '@ngrx/signals';

import { AgentDomainStore } from '@domains/agents/agent.store';
import { AgentRead } from '@domains/agents/agent.models';
import { CommunityDomainStore } from '@domains/communities/community.store';
import { CommunityRead } from '@domains/communities/community.models';

export const AgentFeatureStore = signalStore(
  { providedIn: 'root' },
  withComputed(() => {
    const domainStore = inject(AgentDomainStore);
    const communityStore = inject(CommunityDomainStore);
    return {
      items: computed(() => domainStore.items() as AgentRead[]),
      selectedItem: computed(() => domainStore.selectedItem()),
      isLoading: computed(() => domainStore.isLoading()),
      isLoadingDetail: computed(() => domainStore.isLoadingDetail()),
      hasMore: computed(() => domainStore.hasMore()),
      error: computed(() => domainStore.error()),
      detailError: computed(() => domainStore.detailError()),
      isEmpty: computed(() => domainStore.isEmpty()),
      totalLoaded: computed(() => domainStore.totalLoaded()),
      totalCount: computed(() => domainStore.totalCount()),

      // Cross-domain signals for community selector
      communityOptions: computed(() =>
        (communityStore.items() as CommunityRead[]).map(c => ({ id: c.id, label: c.name })),
      ),
      communityLoading: computed(() => communityStore.isLoading()),
    };
  }),
);
