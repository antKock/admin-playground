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
import { IndicatorModelDomainStore } from '@domains/indicator-models/indicator-model.store';
import { IndicatorModel } from '@domains/indicator-models/indicator-model.models';
import { isAssociationSection } from '@shared/components/section-card/section-card.models';


export const ActionModelFeatureStore = signalStore(
  { providedIn: 'root' },
  withComputed(() => {
    const domainStore = inject(ActionModelDomainStore);
    const fpStore = inject(FundingProgramDomainStore);
    const atStore = inject(ActionThemeDomainStore);
    const imStore = inject(IndicatorModelDomainStore);
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
      totalCount: computed(() => domainStore.totalCount()),

      // Cross-domain signals for FP/AT dropdowns
      fpOptions: computed(() => fpStore.items() as FundingProgram[]),
      atOptions: computed(() => atStore.items() as ActionTheme[]),
      fpLoading: computed(() => fpStore.isLoading()),
      atLoading: computed(() => atStore.isLoading()),

      // Cross-domain: indicator models for picker
      availableIndicators: computed(() => imStore.items() as IndicatorModel[]),
      indicatorsLoading: computed(() => imStore.isLoading()),

      // Sections grouped by type
      associationSections: computed(() => {
        const sections = domainStore.selectedItem()?.sections ?? [];
        return sections
          .filter((s) => isAssociationSection(s))
          .sort((a, b) => a.position - b.position);
      }),
      fixedSections: computed(() => {
        const sections = domainStore.selectedItem()?.sections ?? [];
        return sections
          .filter((s) => !isAssociationSection(s))
          .sort((a, b) => a.position - b.position);
      }),
    };
  }),
);
