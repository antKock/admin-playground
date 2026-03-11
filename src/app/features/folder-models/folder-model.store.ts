// Feature store — ONLY withComputed, no mutations or methods.
// Projects typed signals from the domain store for UI consumption.
// Cross-domain composition: aggregates FM and FP domain stores.
import { computed, inject } from '@angular/core';
import { signalStore, withComputed } from '@ngrx/signals';

import { FolderModelDomainStore } from '@domains/folder-models/folder-model.store';
import { FolderModel } from '@domains/folder-models/folder-model.models';
import { FundingProgramDomainStore } from '@domains/funding-programs/funding-program.store';
import { FundingProgram } from '@domains/funding-programs/funding-program.models';

export const FolderModelFeatureStore = signalStore(
  { providedIn: 'root' },
  withComputed(() => {
    const domainStore = inject(FolderModelDomainStore);
    const fpStore = inject(FundingProgramDomainStore);
    return {
      items: computed(() => domainStore.items() as FolderModel[]),
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

      // Cross-domain signals for FP multi-selector
      fpOptions: computed(() =>
        (fpStore.items() as FundingProgram[]).map((fp) => ({ id: fp.id, label: fp.name })),
      ),
      fpLoading: computed(() => fpStore.isLoading()),
    };
  }),
);
