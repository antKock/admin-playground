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
import { SaveCallbacks } from '@features/shared/section-indicators/section-working-copy';
import { DisplaySection } from '@features/shared/section-indicators/display-section.model';
import { SectionKey, SECTION_TYPE_MAP } from '@shared/components/section-card/section-card.models';
import { SectionParams } from '@shared/components/section-card/section-params-editor.component';
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

  // Additional info section computed (reads from working copy to reflect pending changes)
  readonly additionalInfoSection = computed(() => {
    return this._sectionHelpers.workingSections().find((s) => s.key === 'additional_info') ?? null;
  });

  // Mutation status signals (directly from domain store)
  readonly updateIsPending = this.domainStore.updateMutationIsPending;
  // Section mutation status (combined — individual signals not exposed since batch save)
  readonly sectionMutationPending = computed(() =>
    this.domainStore.createSectionMutationIsPending() || this.domainStore.deleteSectionMutationIsPending() ||
    this.domainStore.updateSectionMutationIsPending() || this.domainStore.updateSectionIndicatorsMutationIsPending(),
  );

  // --- Section indicator operations (shared helpers) ---
  private readonly _sectionHelpers = createSectionFacadeHelpers({
    toast: this.toast,
    getSections: (): DisplaySection[] => {
      const sections = this.selectedItem()?.sections ?? [];
      // Entity models have a single additional_info section, no fixed sections
      return sections.map((s) => s as DisplaySection);
    },
    buildSaveCallbacks: (): SaveCallbacks => {
      const entityType = this.selectedItem()!.entity_type;
      return {
        createSection: async (key, assocType) => {
          const config = SECTION_TYPE_MAP[key];
          const result = await this.domainStore.createSectionMutation({
            entityType,
            data: { key, name: config.label, is_enabled: true, position: 0,
              hidden_rule: 'false', disabled_rule: 'false', required_rule: 'false',
              occurrence_rule: { min: 'false', max: 'false' }, constrained_rule: 'false',
              ...(assocType ? { association_entity_type: assocType } : {}),
            },
          });
          return result.status === 'success' ? { id: result.value.id } : { error: 'Impossible de créer la section' };
        },
        deleteSection: async (sectionId) => {
          const result = await this.domainStore.deleteSectionMutation({ entityType, sectionId });
          if (result.status === 'error') return { error: 'Impossible de supprimer la section' };
          return;
        },
        updateSection: async (sectionId, key, params: SectionParams) => {
          const result = await this.domainStore.updateSectionMutation({ entityType, sectionId, data: params });
          if (result.status === 'error') return { error: 'Impossible de mettre à jour la section' };
          return;
        },
        updateSectionIndicators: async (sectionId, indicators) => {
          const result = await this.domainStore.updateSectionIndicatorsMutation({ entityType, sectionId, data: indicators });
          if (result.status === 'error') return { error: 'Impossible de mettre à jour les indicateurs' };
          return;
        },
      };
    },
    refresh: () => this.domainStore.selectByType(this.selectedItem()!.entity_type),
  });

  readonly workingSections = this._sectionHelpers.workingSections;
  readonly isDirty = this._sectionHelpers.isDirty;
  readonly unsavedCount = this._sectionHelpers.unsavedCount;
  readonly getSectionIndicatorParams = this._sectionHelpers.getSectionIndicatorParams;
  readonly getSectionChildParams = this._sectionHelpers.getSectionChildParams;
  readonly updateSectionIndicatorParams = this._sectionHelpers.updateSectionIndicatorParams;
  readonly updateSectionChildParams = this._sectionHelpers.updateSectionChildParams;
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

  ensureSectionExists(sectionKey: SectionKey): string | null {
    // With working copy, stubs are handled locally. Just ensure the section exists in the working copy.
    const existing = this._sectionHelpers.workingSections().find((s) => s.key === sectionKey);
    if (existing) return existing.id;
    // Add a stub section — it will be created on save
    this._sectionHelpers.addSection(sectionKey);
    return null;
  }
}
