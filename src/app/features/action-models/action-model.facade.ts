// Facade — single entry point for UI components.
// Exposes readonly signals (via feature store) and intention methods (via domain store).
// Handles toast feedback, navigation, and error mapping so components stay presentation-only.
import { Injectable, inject, computed } from '@angular/core';
import { Router } from '@angular/router';

import { ActionModelDomainStore } from '@domains/action-models/action-model.store';
import {
  ActionModelCreate, ActionModelUpdate,
} from '@domains/action-models/action-model.models';
import { SectionKey, SECTION_TYPE_MAP, FIXED_SECTION_TYPES } from '@shared/components/section-card/section-card.models';
import { DisplaySection } from '@features/shared/section-indicators/display-section.model';
export type { DisplaySection } from '@features/shared/section-indicators/display-section.model';
import { FundingProgramDomainStore } from '@domains/funding-programs/funding-program.store';
import { ActionThemeDomainStore } from '@domains/action-themes/action-theme.store';
import { IndicatorModelDomainStore } from '@domains/indicator-models/indicator-model.store';
import { ToastService } from '@shared/components/toast/toast.service';
import { IndicatorParams } from '@app/shared/components/indicator-card/indicator-card.component';
import { handleMutationError } from '@domains/shared/mutation-error-handler';
import { FilterParams } from '@domains/shared/with-cursor-pagination';
import { buildSectionAssociationInputs } from '@features/shared/section-indicators/build-section-association-inputs';
import { createSectionIndicatorParamEditor } from '@features/shared/section-indicators/section-indicator-param-editor';
import { ActionModelFeatureStore } from './action-model.store';

@Injectable({ providedIn: 'root' })
export class ActionModelFacade {
  private readonly domainStore = inject(ActionModelDomainStore);
  private readonly featureStore = inject(ActionModelFeatureStore);
  private readonly fpDomainStore = inject(FundingProgramDomainStore);
  private readonly atDomainStore = inject(ActionThemeDomainStore);
  private readonly imDomainStore = inject(IndicatorModelDomainStore);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  // Data signals — readonly
  readonly items = this.featureStore.items;
  readonly selectedItem = this.featureStore.selectedItem;
  readonly isLoading = this.featureStore.isLoading;
  readonly isLoadingDetail = this.featureStore.isLoadingDetail;
  readonly hasMore = this.featureStore.hasMore;
  readonly error = this.featureStore.error;
  readonly detailError = this.featureStore.detailError;
  readonly isEmpty = this.featureStore.isEmpty;
  readonly totalCount = this.featureStore.totalCount;

  // Cross-domain signals for FP/AT dropdowns (projected through feature store)
  readonly fpOptions = this.featureStore.fpOptions;
  readonly atOptions = this.featureStore.atOptions;
  readonly fpLoading = this.featureStore.fpLoading;
  readonly atLoading = this.featureStore.atLoading;

  // Cross-domain: indicator model signals
  readonly availableIndicators = this.featureStore.availableIndicators;
  readonly indicatorsLoading = this.featureStore.indicatorsLoading;

  // Sections (read-only display)
  readonly associationSections = this.featureStore.associationSections;
  readonly fixedSections = this.featureStore.fixedSections;

  // Section mutation status
  readonly createSectionIsPending = this.domainStore.createSectionMutationIsPending;
  readonly deleteSectionIsPending = this.domainStore.deleteSectionMutationIsPending;
  readonly updateSectionIsPending = this.domainStore.updateSectionMutationIsPending;
  readonly updateSectionIndicatorsIsPending = this.domainStore.updateSectionIndicatorsMutationIsPending;
  readonly sectionMutationPending = computed(() =>
    this.createSectionIsPending() || this.deleteSectionIsPending() ||
    this.updateSectionIsPending() || this.updateSectionIndicatorsIsPending(),
  );

  // Merged fixed sections — always includes both application + progress, with stubs for missing
  readonly mergedFixedSections = computed<DisplaySection[]>(() => {
    const sections = this.selectedItem()?.sections ?? [];
    return FIXED_SECTION_TYPES.map((sType, idx) => {
      const existing = sections.find((s) => s.key === sType);
      if (existing) return existing as DisplaySection;
      const config = SECTION_TYPE_MAP[sType];
      return {
        id: null,
        name: config.label,
        key: sType,
        is_enabled: true,
        position: idx,
        hidden_rule: 'false',
        disabled_rule: 'false',
        required_rule: 'false',
        occurrence_min_rule: 'false',
        occurrence_max_rule: 'false',
        constrained_rule: 'false',
        created_at: '',
        last_updated_at: '',
        indicators: [],
      } as DisplaySection;
    });
  });

  // Per-mutation status signals (directly from domain store)
  readonly createIsPending = this.domainStore.createMutationIsPending;
  readonly updateIsPending = this.domainStore.updateMutationIsPending;
  readonly deleteIsPending = this.domainStore.deleteMutationIsPending;
  readonly publishIsPending = this.domainStore.publishMutationIsPending;
  readonly disableIsPending = this.domainStore.disableMutationIsPending;
  readonly activateIsPending = this.domainStore.activateMutationIsPending;
  readonly anyMutationPending = computed(() =>
    this.createIsPending() || this.updateIsPending() || this.deleteIsPending() ||
    this.publishIsPending() || this.disableIsPending() || this.activateIsPending(),
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
        actionModelId: m.id,
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
      this.domainStore.selectById(m.id);
    }
  }

  // Intention methods
  loadAssociationData(): void {
    this.fpDomainStore.loadAll(undefined);
    this.atDomainStore.loadAll(undefined);
  }

  loadIndicators(): void {
    this.imDomainStore.loadAll(undefined);
  }

  load(filters?: FilterParams): void {
    this.domainStore.load(filters);
  }

  loadMore(): void {
    this.domainStore.loadMore();
  }

  select(id: string): void {
    this.domainStore.selectById(id);
  }

  clearSelection(): void {
    this.domainStore.clearSelection();
    this.sectionParamEditor.discard();
  }

  async create(data: ActionModelCreate): Promise<void> {
    const result = await this.domainStore.createMutation(data);
    if (result.status === 'success') {
      this.toast.success('Modèle d\'action créé');
      this.router.navigate(['/action-models']);
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error);
    }
  }

  async update(id: string, data: ActionModelUpdate): Promise<void> {
    const result = await this.domainStore.updateMutation({ id, data });
    if (result.status === 'success') {
      this.toast.success('Modèle d\'action mis à jour');
      this.domainStore.refresh(undefined);
      this.router.navigate(['/action-models', id]);
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error);
    }
  }

  async delete(id: string): Promise<void> {
    const result = await this.domainStore.deleteMutation(id);
    if (result.status === 'success') {
      this.toast.success('Modèle d\'action supprimé');
      this.router.navigate(['/action-models']);
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error);
    }
  }

  // Lifecycle / status mutations
  async publish(id: string): Promise<void> {
    const result = await this.domainStore.publishMutation(id);
    if (result.status === 'success') {
      this.toast.success('Modèle d\'action publié');
      this.domainStore.selectById(id);
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error, 'Impossible de publier le modèle d\'action');
    }
  }

  async disable(id: string): Promise<void> {
    const result = await this.domainStore.disableMutation(id);
    if (result.status === 'success') {
      this.toast.success('Modèle d\'action désactivé');
      this.domainStore.selectById(id);
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error, 'Impossible de désactiver le modèle d\'action');
    }
  }

  async activate(id: string): Promise<void> {
    const result = await this.domainStore.activateMutation(id);
    if (result.status === 'success') {
      this.toast.success('Modèle d\'action activé');
      this.domainStore.selectById(id);
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error, 'Impossible d\'activer le modèle d\'action');
    }
  }

  async updateSectionParams(sectionId: string | null, sectionKey: SectionKey, params: import('@domains/action-models/action-model.models').SectionModelUpdate): Promise<void> {
    const m = this.selectedItem();
    if (!m) return;

    let resolvedId = sectionId;
    if (!resolvedId) {
      resolvedId = await this.ensureSectionExists(sectionKey);
      if (!resolvedId) return;
    }

    const result = await this.domainStore.updateSectionMutation({
      actionModelId: m.id,
      sectionId: resolvedId,
      data: params,
    });
    if (result.status === 'success') {
      this.toast.success('Paramètres de section enregistrés');
      this.domainStore.selectById(m.id);
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
    const inputs = [
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
      actionModelId: m.id,
      sectionId: resolvedId,
      data: inputs,
    });
    if (result.status === 'success') {
      this.toast.success('Indicateur ajouté à la section');
      this.domainStore.selectById(m.id);
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
      actionModelId: m.id,
      sectionId,
      data: inputs,
    });
    if (result.status === 'success') {
      this.toast.success('Indicateur retiré de la section');
      this.domainStore.selectById(m.id);
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error, 'Impossible de retirer l\'indicateur');
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
      actionModelId: m.id,
      sectionId,
      data: inputs,
    });
    if (result.status === 'success') {
      this.domainStore.selectById(m.id);
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error);
      this.domainStore.selectById(m.id);
    }
  }

  async ensureSectionExists(sectionKey: SectionKey): Promise<string | null> {
    const m = this.selectedItem();
    if (!m) return null;

    const existing = (m.sections ?? []).find((s) => s.key === sectionKey);
    if (existing) return existing.id;

    const config = SECTION_TYPE_MAP[sectionKey];
    const result = await this.domainStore.createSectionMutation({
      actionModelId: m.id,
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
      return (result.value as { id: string }).id;
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error, 'Impossible de créer la section');
      return null;
    }
    return null;
  }

  isAssociationSectionEnabled(sectionKey: SectionKey): boolean {
    const sections = this.selectedItem()?.sections ?? [];
    return sections.some((s) => s.key === sectionKey);
  }

  getAssociationSectionId(sectionKey: SectionKey): string | undefined {
    const sections = this.selectedItem()?.sections ?? [];
    return sections.find((s) => s.key === sectionKey)?.id;
  }

  async toggleAssociationSection(sectionKey: SectionKey): Promise<void> {
    const m = this.selectedItem();
    if (!m) return;

    const existingSection = (m.sections ?? []).find((s) => s.key === sectionKey);

    if (existingSection) {
      // Toggle OFF — delete section
      const result = await this.domainStore.deleteSectionMutation({
        actionModelId: m.id,
        sectionId: existingSection.id,
      });
      if (result.status === 'success') {
        this.toast.success('Section supprimée');
        this.domainStore.selectById(m.id);
      } else if (result.status === 'error') {
        handleMutationError(this.toast, result.error, 'Impossible de supprimer la section');
        this.domainStore.selectById(m.id);
      }
    } else {
      // Toggle ON — create section
      const config = SECTION_TYPE_MAP[sectionKey];
      const result = await this.domainStore.createSectionMutation({
        actionModelId: m.id,
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
        this.toast.success('Section créée');
        this.domainStore.selectById(m.id);
      } else if (result.status === 'error') {
        handleMutationError(this.toast, result.error, 'Impossible de créer la section');
        this.domainStore.selectById(m.id);
      }
    }
  }
}
