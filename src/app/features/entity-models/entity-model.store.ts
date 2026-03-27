// Feature store — ONLY withComputed, no mutations or methods.
// Projects typed signals from the domain store for UI consumption.
// Cross-domain composition: aggregates entity model and indicator model domain stores.
import { computed, inject } from '@angular/core';
import { signalStore, withComputed } from '@ngrx/signals';

import { EntityModelDomainStore } from '@domains/entity-models/entity-model.store';
import { EntityModel, EntityModelType } from '@domains/entity-models/entity-model.models';
import { IndicatorModelDomainStore } from '@domains/indicator-models/indicator-model.store';
import { IndicatorModel } from '@domains/indicator-models/indicator-model.models';

export interface EntityModelCardData {
  entityType: EntityModelType;
  label: string;
  icon: string;
  indicatorCount: number;
  route: string;
}

const ENTITY_TYPE_LABELS: Record<EntityModelType, { label: string; icon: string }> = {
  community: { label: 'Communautés', icon: '🏘' },
  agent: { label: 'Agents', icon: '👤' },
  site: { label: 'Sites', icon: '🏠' },
};

export const EntityModelFeatureStore = signalStore(
  { providedIn: 'root' },
  withComputed(() => {
    const domainStore = inject(EntityModelDomainStore);
    const imStore = inject(IndicatorModelDomainStore);
    return {
      items: computed(() => domainStore.items() as EntityModel[]),
      selectedItem: computed(() => domainStore.selectedItem()),
      isLoading: computed(() => domainStore.isLoading()),
      isLoadingDetail: computed(() => domainStore.isLoadingDetail()),
      error: computed(() => domainStore.error()),
      detailError: computed(() => domainStore.detailError()),

      // Cross-domain: indicator models for picker
      availableIndicators: computed(() => imStore.items() as IndicatorModel[]),
      indicatorsLoading: computed(() => imStore.isLoading()),

      // Card display data for list page
      entityModelCards: computed((): EntityModelCardData[] => {
        const items = domainStore.items() as EntityModel[];
        return items.map((item) => {
          const config = ENTITY_TYPE_LABELS[item.entity_type] ?? { label: item.entity_type, icon: '📋' };
          const indicatorCount = item.sections
            ?.find((s) => s.key === 'additional_info')
            ?.indicators?.length ?? 0;
          return {
            entityType: item.entity_type,
            label: config.label,
            icon: config.icon,
            indicatorCount,
            route: `/entity-models/${item.entity_type}`,
          };
        });
      }),
    };
  }),
);
