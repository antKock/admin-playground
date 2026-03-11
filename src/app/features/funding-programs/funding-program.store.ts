// Feature store — ONLY withComputed, no mutations or methods.
// Projects typed signals from the domain store for UI consumption.
import { computed, inject } from '@angular/core';
import { signalStore, withComputed } from '@ngrx/signals';

import { FundingProgramDomainStore } from '@domains/funding-programs/funding-program.store';
import { FundingProgram } from '@domains/funding-programs/funding-program.models';
import { FolderModelDomainStore } from '@domains/folder-models/folder-model.store';
import { FolderModel } from '@domains/folder-models/folder-model.models';

export const FundingProgramFeatureStore = signalStore(
  { providedIn: 'root' },
  withComputed(() => {
    const domainStore = inject(FundingProgramDomainStore);
    const fmStore = inject(FolderModelDomainStore);
    return {
      items: computed(() => domainStore.items() as FundingProgram[]),
      selectedItem: computed(() => domainStore.selectedItem()),
      isLoading: computed(() => domainStore.isLoading()),
      isLoadingDetail: computed(() => domainStore.isLoadingDetail()),
      hasMore: computed(() => domainStore.hasMore()),
      error: computed(() => domainStore.error()),
      detailError: computed(() => domainStore.detailError()),
      isEmpty: computed(() => domainStore.isEmpty()),
      totalLoaded: computed(() => domainStore.totalLoaded()),
      totalCount: computed(() => domainStore.totalCount()),

      // Cross-domain signals for folder-model dropdown
      fmOptions: computed(() =>
        (fmStore.items() as FolderModel[]).map((fm) => ({ id: fm.id, label: fm.name })),
      ),
      fmLoading: computed(() => fmStore.isLoading()),
    };
  }),
);
