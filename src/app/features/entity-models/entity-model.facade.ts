// Facade — single entry point for UI components.
// Exposes readonly signals (via feature store) and intention methods (via domain store).
// Handles toast feedback, navigation, and error mapping so components stay presentation-only.
import { Injectable, inject, computed } from '@angular/core';
import { Router } from '@angular/router';

import { EntityModelDomainStore } from '@domains/entity-models/entity-model.store';
import { EntityModelUpdate, EntityModelType, SectionModelUpdate, SectionIndicatorAssociationInput } from '@domains/entity-models/entity-model.models';
import { IndicatorModelDomainStore } from '@domains/indicator-models/indicator-model.store';
import { SectionKey, SECTION_TYPE_MAP } from '@shared/components/section-card/section-card.models';
import { ToastService } from '@shared/components/toast/toast.service';
import { IndicatorParams } from '@app/shared/components/indicator-card/indicator-card.component';
import { handleMutationError } from '@domains/shared/mutation-error-handler';
import { buildSectionAssociationInputs } from '@features/action-models/use-cases/build-section-association-inputs';
import { createSectionIndicatorParamEditor } from '@features/action-models/use-cases/section-indicator-param-editor';
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

  // --- Section indicator parameter edit sub-system ---
  private readonly sectionParamEditor = createSectionIndicatorParamEditor(() => {
    const sections = this.selectedItem()?.sections ?? [];
    return sections.map((s) => ({ id: s.id, key: s.key, indicators: s.indicators }));
  });

  readonly sectionParamEdits = this.sectionParamEditor.edits;
  readonly unsavedCount = this.sectionParamEditor.unsavedCount;
  readonly modifiedIds = this.sectionParamEditor.modifiedIds;

  getSectionIndicatorParams(sectionId: string, indicatorId: string): IndicatorParams {
    return this.sectionParamEditor.getParamsForIndicator(sectionId, indicatorId);
  }

  getSectionChildParams(sectionId: string, parentId: string, childId: string): IndicatorParams {
    return this.sectionParamEditor.getParamsForChild(sectionId, parentId, childId);
  }

  updateSectionIndicatorParams(sectionId: string, indicatorId: string, params: IndicatorParams): void {
    this.sectionParamEditor.updateParams(sectionId, indicatorId, params);
  }

  updateSectionChildParams(sectionId: string, parentId: string, childId: string, params: IndicatorParams): void {
    this.sectionParamEditor.updateChildParams(sectionId, parentId, childId, params);
  }

  getEditsForSection(sectionId: string): Map<string, IndicatorParams> {
    return this.sectionParamEditor.getEditsForSection(sectionId);
  }

  isSectionIndicatorModified(sectionId: string, indicatorId: string): boolean {
    return this.sectionParamEditor.isModified(sectionId, indicatorId);
  }

  discardParamEdits(): void {
    this.sectionParamEditor.discard();
  }

  async saveParamEdits(): Promise<void> {
    const validationError = this.sectionParamEditor.validateRules();
    if (validationError) {
      this.toast.error(validationError);
      return;
    }

    const m = this.selectedItem();
    if (!m) return;

    const editedSectionIds = this.sectionParamEditor.editedSectionIds();
    if (editedSectionIds.size === 0) return;

    const sections = m.sections ?? [];
    let hasError = false;

    for (const sectionId of editedSectionIds) {
      const section = sections.find((s) => s.id === sectionId);
      if (!section) continue;

      const sectionEdits = this.sectionParamEditor.getEditsForSection(sectionId);
      const inputs = buildSectionAssociationInputs(section.indicators ?? [], sectionEdits);

      const result = await this.domainStore.updateSectionIndicatorsMutation({
        entityType: m.entity_type,
        sectionId,
        data: inputs,
      });
      if (result.status === 'error') {
        handleMutationError(this.toast, result.error);
        hasError = true;
        break;
      }
    }

    if (!hasError) {
      this.toast.success('Paramètres enregistrés');
      this.sectionParamEditor.discard();
      this.domainStore.selectByType(m.entity_type);
    }
  }

  async reorderSectionIndicators(sectionId: string, orderedIds: string[]): Promise<void> {
    const m = this.selectedItem();
    if (!m) return;

    const section = (m.sections ?? []).find((s) => s.id === sectionId);
    if (!section) return;

    const indicators = section.indicators ?? [];
    const reordered = orderedIds
      .map((id) => indicators.find((ind) => ind.id === id))
      .filter((ind): ind is NonNullable<typeof ind> => !!ind);

    const sectionEdits = this.sectionParamEditor.getEditsForSection(sectionId);
    const inputs = buildSectionAssociationInputs(reordered, sectionEdits);

    const result = await this.domainStore.updateSectionIndicatorsMutation({
      entityType: m.entity_type,
      sectionId,
      data: inputs,
    });
    if (result.status === 'success') {
      this.domainStore.selectByType(m.entity_type);
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error);
      this.domainStore.selectByType(m.entity_type);
    }
  }

  // Intention methods
  loadAll(): void {
    this.domainStore.loadAll(undefined);
  }

  selectByType(entityType: EntityModelType): void {
    this.domainStore.selectByType(entityType);
  }

  clearSelection(): void {
    this.domainStore.clearSelection();
    this.sectionParamEditor.discard();
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

  async updateSectionParams(sectionId: string | null, sectionKey: SectionKey, params: SectionModelUpdate): Promise<void> {
    const m = this.selectedItem();
    if (!m) return;

    let resolvedId = sectionId;
    if (!resolvedId) {
      resolvedId = await this.ensureSectionExists(sectionKey);
      if (!resolvedId) return;
    }

    const result = await this.domainStore.updateSectionMutation({
      entityType: m.entity_type,
      sectionId: resolvedId,
      data: params,
    });
    if (result.status === 'success') {
      this.toast.success('Paramètres de section enregistrés');
      this.domainStore.selectByType(m.entity_type);
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error, 'Impossible de mettre à jour la section');
    }
  }

  async addIndicatorToSection(sectionId: string | null, sectionKey: SectionKey, indicatorModelId: string): Promise<void> {
    const m = this.selectedItem();
    if (!m) return;

    let resolvedId = sectionId;
    if (!resolvedId) {
      resolvedId = await this.ensureSectionExists(sectionKey);
      if (!resolvedId) return;
    }

    const section = (m.sections ?? []).find((s) => s.id === resolvedId);
    const existing = section?.indicators ?? [];
    const inputs: SectionIndicatorAssociationInput[] = [
      ...buildSectionAssociationInputs(existing),
      {
        indicator_model_id: indicatorModelId,
        hidden_rule: 'false',
        required_rule: 'false',
        disabled_rule: 'false',
        default_value_rule: 'false',
        occurrence_min_rule: 'false',
        occurrence_max_rule: 'false',
        constrained_rule: 'false',
        position: existing.length,
      },
    ];

    const result = await this.domainStore.updateSectionIndicatorsMutation({
      entityType: m.entity_type,
      sectionId: resolvedId,
      data: inputs,
    });
    if (result.status === 'success') {
      this.toast.success('Indicateur ajouté à la section');
      this.domainStore.selectByType(m.entity_type);
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error, 'Impossible d\'ajouter l\'indicateur');
    }
  }

  async removeIndicatorFromSection(sectionId: string, indicatorModelId: string): Promise<void> {
    const m = this.selectedItem();
    if (!m) return;

    const section = (m.sections ?? []).find((s) => s.id === sectionId);
    if (!section) return;

    const remaining = (section.indicators ?? []).filter((ind) => ind.id !== indicatorModelId);
    const inputs = buildSectionAssociationInputs(remaining);

    const result = await this.domainStore.updateSectionIndicatorsMutation({
      entityType: m.entity_type,
      sectionId,
      data: inputs,
    });
    if (result.status === 'success') {
      this.toast.success('Indicateur retiré de la section');
      this.domainStore.selectByType(m.entity_type);
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error, 'Impossible de retirer l\'indicateur');
    }
  }

  async ensureSectionExists(sectionKey: SectionKey): Promise<string | null> {
    const m = this.selectedItem();
    if (!m) return null;

    const existing = (m.sections ?? []).find((s) => s.key === sectionKey);
    if (existing) return existing.id;

    const config = SECTION_TYPE_MAP[sectionKey];
    const result = await this.domainStore.createSectionMutation({
      entityType: m.entity_type,
      data: {
        key: sectionKey,
        name: config.label,
        is_enabled: true,
        position: 0,
        hidden_rule: 'false',
        disabled_rule: 'false',
        required_rule: 'false',
        occurrence_min_rule: 'false',
        occurrence_max_rule: 'false',
        constrained_rule: 'false',
      },
    });

    if (result.status === 'success') {
      this.domainStore.selectByType(m.entity_type);
      return (result.value as { id: string }).id;
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error, 'Impossible de créer la section');
      return null;
    }
    return null;
  }
}
