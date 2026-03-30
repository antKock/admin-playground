// Facade — single entry point for UI components.
// Exposes readonly signals (via feature store) and intention methods (via domain store).
// Handles toast feedback, navigation, and error mapping so components stay presentation-only.
import { Injectable, inject, computed } from '@angular/core';
import { Router } from '@angular/router';

import { EntityModelDomainStore } from '@domains/entity-models/entity-model.store';
import { EntityModelUpdate, EntityModelType } from '@domains/entity-models/entity-model.models';
import { IndicatorModelDomainStore } from '@domains/indicator-models/indicator-model.store';
import { ToastService } from '@shared/components/toast/toast.service';
import { handleMutationError } from '@domains/shared/mutation-error-handler';
import { createSectionFacadeHelpers } from '@features/shared/section-indicators/section-facade.helpers';
import { SectionKey } from '@shared/components/section-card/section-card.models';
import { EntityModelFeatureStore } from './entity-model.store';

@Injectable({ providedIn: 'root' })
export class EntityModelFacade {
  private readonly domainStore = inject(EntityModelDomainStore);
  private readonly featureStore = inject(EntityModelFeatureStore);
  private readonly imDomainStore = inject(IndicatorModelDomainStore);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  // Data signals — readonly
  readonly items = this.featureStore.items;
  readonly selectedItem = this.featureStore.selectedItem;
  readonly isLoading = this.featureStore.isLoading;
  readonly isLoadingDetail = this.featureStore.isLoadingDetail;
  readonly error = this.featureStore.error;
  readonly detailError = this.featureStore.detailError;

  // Cross-domain: indicator model signals
  readonly availableIndicators = this.featureStore.availableIndicators;
  readonly indicatorsLoading = this.featureStore.indicatorsLoading;

  // Card display data
  readonly entityModelCards = this.featureStore.entityModelCards;

  // Additional info section computed
  readonly additionalInfoSection = computed(() => {
    const sections = this.selectedItem()?.sections ?? [];
    return sections.find((s) => s.key === 'additional_info') ?? null;
  });

  // Mutation status signals (directly from domain store)
  readonly updateIsPending = this.domainStore.updateMutationIsPending;
  readonly createSectionIsPending = this.domainStore.createSectionMutationIsPending;
  readonly updateSectionIsPending = this.domainStore.updateSectionMutationIsPending;
  readonly deleteSectionIsPending = this.domainStore.deleteSectionMutationIsPending;
  readonly updateSectionIndicatorsIsPending = this.domainStore.updateSectionIndicatorsMutationIsPending;
  readonly sectionMutationPending = computed(() =>
    this.createSectionIsPending() || this.deleteSectionIsPending() ||
    this.updateSectionIsPending() || this.updateSectionIndicatorsIsPending(),
  );

  // --- Section indicator operations (shared helpers) ---
  private readonly _sectionHelpers = createSectionFacadeHelpers(
    {
      toast: this.toast,
      getSelectedItem: () => this.selectedItem(),
      updateSectionIndicatorsMutation: (sectionId, data) =>
        this.domainStore.updateSectionIndicatorsMutation({ entityType: this.selectedItem()!.entity_type, sectionId, data }),
      createSectionMutation: (data) =>
        this.domainStore.createSectionMutation({ entityType: this.selectedItem()!.entity_type, data }),
      updateSectionMutation: (sectionId, data) =>
        this.domainStore.updateSectionMutation({ entityType: this.selectedItem()!.entity_type, sectionId, data }),
      refresh: () => this.domainStore.selectByType(this.selectedItem()!.entity_type),
    },
    () => {
      const sections = this.selectedItem()?.sections ?? [];
      return sections.map((s) => ({ id: s.id, key: s.key, indicators: s.indicators }));
    },
  );

  readonly sectionParamEdits = this._sectionHelpers.sectionParamEdits;
  readonly unsavedCount = this._sectionHelpers.unsavedCount;
  readonly modifiedIds = this._sectionHelpers.modifiedIds;
  readonly getSectionIndicatorParams = this._sectionHelpers.getSectionIndicatorParams;
  readonly getSectionChildParams = this._sectionHelpers.getSectionChildParams;
  readonly updateSectionIndicatorParams = this._sectionHelpers.updateSectionIndicatorParams;
  readonly updateSectionChildParams = this._sectionHelpers.updateSectionChildParams;
  readonly getEditsForSection = this._sectionHelpers.getEditsForSection;
  readonly isSectionIndicatorModified = this._sectionHelpers.isSectionIndicatorModified;
  readonly discardParamEdits = this._sectionHelpers.discardParamEdits;
  readonly saveParamEdits = this._sectionHelpers.saveParamEdits;
  readonly reorderSectionIndicators = this._sectionHelpers.reorderSectionIndicators;
  readonly addIndicatorToSection = this._sectionHelpers.addIndicatorToSection;
  readonly removeIndicatorFromSection = this._sectionHelpers.removeIndicatorFromSection;
  readonly updateSectionParams = this._sectionHelpers.updateSectionParams;

  // Intention methods
  loadAll(): void {
    this.domainStore.loadAll(undefined);
  }

  selectByType(entityType: EntityModelType): void {
    this.domainStore.selectByType(entityType);
  }

  clearSelection(): void {
    this.domainStore.clearSelection();
    this._sectionHelpers.discardParamEdits();
  }

  loadIndicators(): void {
    this.imDomainStore.loadAll(undefined);
  }

  async update(entityType: EntityModelType, data: EntityModelUpdate): Promise<void> {
    const result = await this.domainStore.updateMutation({ entityType, data });
    if (result.status === 'success') {
      this.toast.success('Modèle d\'entité mis à jour');
      this.domainStore.selectByType(entityType);
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error);
    }
  }

  async ensureSectionExists(sectionKey: SectionKey): Promise<string | null> {
    return this._sectionHelpers.ensureSectionExists(sectionKey);
  }
}
