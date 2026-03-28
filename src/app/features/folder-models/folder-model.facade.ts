// Facade — single entry point for UI components.
// Exposes readonly signals (via feature store) and intention methods (via domain store).
// No status workflow for Folder Models.
import { Injectable, inject, computed } from '@angular/core';
import { Router } from '@angular/router';

import { FolderModelDomainStore } from '@domains/folder-models/folder-model.store';
import { FolderModelCreate, FolderModelUpdate, SectionModelUpdate, SectionModelWithIndicators } from '@domains/folder-models/folder-model.models';
import { SectionKey, SECTION_TYPE_MAP, FIXED_SECTION_TYPES } from '@shared/components/section-card/section-card.models';
import { FundingProgramDomainStore } from '@domains/funding-programs/funding-program.store';
import { IndicatorModelDomainStore } from '@domains/indicator-models/indicator-model.store';
import { ToastService } from '@shared/components/toast/toast.service';
import { IndicatorParams } from '@app/shared/components/indicator-card/indicator-card.component';
import { handleMutationError } from '@domains/shared/mutation-error-handler';
import { FilterParams } from '@domains/shared/with-cursor-pagination';
import { buildSectionAssociationInputs } from '@features/action-models/use-cases/build-section-association-inputs';
import { createSectionIndicatorParamEditor } from '@features/action-models/use-cases/section-indicator-param-editor';
import { FolderModelFeatureStore } from './folder-model.store';

export type DisplaySection = Omit<SectionModelWithIndicators, 'id'> & { id: string | null };

@Injectable({ providedIn: 'root' })
export class FolderModelFacade {
  private readonly domainStore = inject(FolderModelDomainStore);
  private readonly featureStore = inject(FolderModelFeatureStore);
  private readonly fpDomainStore = inject(FundingProgramDomainStore);
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

  // Cross-domain FP signals (projected through feature store)
  readonly fpOptions = this.featureStore.fpOptions;
  readonly fpLoading = this.featureStore.fpLoading;

  // Display-ready rows for list components
  readonly formattedRows = computed(() =>
    this.items().map((item) => ({
      ...item,
      funding_programs_display:
        item.funding_programs?.map((fp) => fp.name).join(', ') || '—',
    })),
  );

  // Per-mutation status signals (directly from domain store)
  readonly createIsPending = this.domainStore.createMutationIsPending;
  readonly updateIsPending = this.domainStore.updateMutationIsPending;
  readonly deleteIsPending = this.domainStore.deleteMutationIsPending;
  readonly anyMutationPending = computed(() =>
    this.createIsPending() || this.updateIsPending() || this.deleteIsPending(),
  );

  // Section mutation status
  readonly createSectionIsPending = this.domainStore.createSectionMutationIsPending;
  readonly updateSectionIsPending = this.domainStore.updateSectionMutationIsPending;
  readonly deleteSectionIsPending = this.domainStore.deleteSectionMutationIsPending;
  readonly sectionMutationPending = computed(() =>
    this.createSectionIsPending() || this.updateSectionIsPending() || this.deleteSectionIsPending(),
  );

  // Indicator mutation status
  readonly updateSectionIndicatorsIsPending = this.domainStore.updateSectionIndicatorsMutationIsPending;

  // Cross-domain: indicator model signals
  readonly availableIndicators = this.featureStore.availableIndicators;
  readonly indicatorsLoading = this.featureStore.indicatorsLoading;

  // Merged fixed sections — always includes application + progress, with stubs for missing
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
        folderModelId: m.id,
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
      folderModelId: m.id,
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

  // Intention methods
  loadAssociationData(): void {
    this.fpDomainStore.loadAll(undefined);
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

  async create(data: FolderModelCreate): Promise<void> {
    const result = await this.domainStore.createMutation(data);
    if (result.status === 'success') {
      this.toast.success('Modèle de dossier créé');
      this.router.navigate(['/folder-models']);
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error);
    }
  }

  async update(id: string, data: FolderModelUpdate): Promise<void> {
    const result = await this.domainStore.updateMutation({ id, data });
    if (result.status === 'success') {
      this.toast.success('Modèle de dossier mis à jour');
      this.domainStore.refresh(undefined);
      this.router.navigate(['/folder-models', id]);
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error);
    }
  }

  async delete(id: string): Promise<void> {
    const result = await this.domainStore.deleteMutation(id);
    if (result.status === 'success') {
      this.toast.success('Modèle de dossier supprimé');
      this.router.navigate(['/folder-models']);
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
      folderModelId: m.id,
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

  loadIndicators(): void {
    this.imDomainStore.loadAll(undefined);
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
      folderModelId: m.id,
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
      folderModelId: m.id,
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

  async ensureSectionExists(sectionKey: SectionKey): Promise<string | null> {
    const m = this.selectedItem();
    if (!m) return null;

    const existing = (m.sections ?? []).find((s) => s.key === sectionKey);
    if (existing) return existing.id;

    const config = SECTION_TYPE_MAP[sectionKey];
    const result = await this.domainStore.createSectionMutation({
      folderModelId: m.id,
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
}
