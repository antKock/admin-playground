// Facade — single entry point for UI components.
// Exposes readonly signals (via feature store) and intention methods (via domain store).
// Handles toast feedback, navigation, and error mapping so components stay presentation-only.
import { Injectable, inject, computed } from '@angular/core';
import { Router } from '@angular/router';

import { ActionModelDomainStore } from '@domains/action-models/action-model.store';
import {
  ActionModelCreate, ActionModelUpdate,
} from '@domains/action-models/action-model.models';
import { SectionKey, SECTION_TYPE_MAP, isAssociationSection } from '@shared/components/section-card/section-card.models';
import { SectionParams } from '@shared/components/section-card/section-params-editor.component';
import { DisplaySection } from '@features/shared/section-indicators/display-section.model';
export type { DisplaySection } from '@features/shared/section-indicators/display-section.model';
import { buildMergedFixedSections } from '@features/shared/section-indicators/build-merged-fixed-sections';
import { createSectionFacadeHelpers } from '@features/shared/section-indicators/section-facade.helpers';
import { SaveCallbacks } from '@features/shared/section-indicators/section-working-copy';
import { FundingProgramDomainStore } from '@domains/funding-programs/funding-program.store';
import { ActionThemeDomainStore } from '@domains/action-themes/action-theme.store';
import { IndicatorModelDomainStore } from '@domains/indicator-models/indicator-model.store';
import { ToastService } from '@shared/components/toast/toast.service';
import { handleMutationError } from '@domains/shared/mutation-error-handler';
import { FilterParams } from '@domains/shared/with-cursor-pagination';
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
  readonly mergedFixedSections = computed<DisplaySection[]>(() =>
    buildMergedFixedSections(this.selectedItem()?.sections ?? []),
  );

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

  // --- Section indicator operations (shared helpers) ---
  private readonly _sectionHelpers = createSectionFacadeHelpers({
    toast: this.toast,
    getSections: () => {
      const all = this.selectedItem()?.sections ?? [];
      const fixed = buildMergedFixedSections(all);
      const associations = all.filter((s) => isAssociationSection(s)) as DisplaySection[];
      return [...fixed, ...associations];
    },
    buildSaveCallbacks: (): SaveCallbacks => {
      const modelId = this.selectedItem()!.id;
      return {
        createSection: async (key, assocType) => {
          const config = SECTION_TYPE_MAP[key];
          const result = await this.domainStore.createSectionMutation({
            actionModelId: modelId,
            data: { key, name: config.label, is_enabled: true, position: 0,
              hidden_rule: 'false', disabled_rule: 'false', required_rule: 'false',
              occurrence_rule: { min: 'false', max: 'false' }, constrained_rule: 'false',
              ...(assocType ? { association_entity_type: assocType } : {}),
            },
          });
          return result.status === 'success' ? { id: result.value.id } : { error: 'Impossible de créer la section' };
        },
        deleteSection: async (sectionId) => {
          const result = await this.domainStore.deleteSectionMutation({ actionModelId: modelId, sectionId });
          if (result.status === 'error') return { error: 'Impossible de supprimer la section' };
          return;
        },
        updateSection: async (sectionId, key, params: SectionParams) => {
          const result = await this.domainStore.updateSectionMutation({ actionModelId: modelId, sectionId, data: params });
          if (result.status === 'error') return { error: 'Impossible de mettre à jour la section' };
          return;
        },
        updateSectionIndicators: async (sectionId, indicators) => {
          const result = await this.domainStore.updateSectionIndicatorsMutation({ actionModelId: modelId, sectionId, data: indicators });
          if (result.status === 'error') return { error: 'Impossible de mettre à jour les indicateurs' };
          return;
        },
      };
    },
    refresh: () => this.domainStore.selectById(this.selectedItem()!.id),
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
    this._sectionHelpers.discardParamEdits();
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

  isAssociationSectionEnabled(sectionKey: SectionKey): boolean {
    const sections = this.selectedItem()?.sections ?? [];
    return sections.some((s) => s.key === sectionKey);
  }

  getAssociationSectionId(sectionKey: SectionKey): string | undefined {
    const sections = this.selectedItem()?.sections ?? [];
    return sections.find((s) => s.key === sectionKey)?.id;
  }

  toggleAssociationSection(sectionKey: SectionKey): void {
    const existingSection = this._sectionHelpers.workingSections().find((s) => s.key === sectionKey);
    if (existingSection && existingSection.id) {
      this._sectionHelpers.removeSection(existingSection.id);
    } else if (!existingSection) {
      this._sectionHelpers.addSection(sectionKey);
    }
  }
}
