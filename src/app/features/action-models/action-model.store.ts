// Feature store — ONLY withComputed, no mutations or methods.
// Projects typed signals from the domain store for UI consumption.
// Cross-domain composition: aggregates AM, FP, and AT domain stores.
import { computed, inject } from '@angular/core';
import { signalStore, withComputed } from '@ngrx/signals';

import { ActionModelDomainStore } from '@domains/action-models/action-model.store';
import { ActionModel } from '@domains/action-models/action-model.models';
import { FundingProgramDomainStore } from '@domains/funding-programs/funding-program.store';
import { FundingProgram } from '@domains/funding-programs/funding-program.models';
import { ActionThemeDomainStore } from '@domains/action-themes/action-theme.store';
import { ActionTheme } from '@domains/action-themes/action-theme.models';

export const ActionModelFeatureStore = signalStore(
  { providedIn: 'root' },
  withComputed(() => {
    const domainStore = inject(ActionModelDomainStore);
    const fpStore = inject(FundingProgramDomainStore);
    const atStore = inject(ActionThemeDomainStore);
    return {
      items: computed(() => domainStore.items() as ActionModel[]),
      selectedItem: computed(() => domainStore.selectedItem()),
      isLoading: computed(() => domainStore.isLoading()),
      isLoadingDetail: computed(() => domainStore.isLoadingDetail()),
      hasMore: computed(() => domainStore.hasMore()),
      error: computed(() => domainStore.error()),
      detailError: computed(() => domainStore.detailError()),
      isEmpty: computed(() => domainStore.isEmpty()),
      totalLoaded: computed(() => domainStore.totalLoaded()),

      // Per-mutation status signals
      createIsPending: computed(() => domainStore.createMutationIsPending()),
      updateIsPending: computed(() => domainStore.updateMutationIsPending()),
      deleteIsPending: computed(() => domainStore.deleteMutationIsPending()),

      // Cross-domain signals for FP/AT dropdowns
      fpOptions: computed(() => fpStore.items() as FundingProgram[]),
      atOptions: computed(() => atStore.items() as ActionTheme[]),
      fpLoading: computed(() => fpStore.isLoading()),
      atLoading: computed(() => atStore.isLoading()),
    };
  }),
);
