// Facade — single entry point for UI components.
// Exposes readonly signals (via feature store) and intention methods (via domain store).
// No status workflow for Folder Models.
import { Injectable, inject, computed } from '@angular/core';
import { Router } from '@angular/router';

import { FolderModelDomainStore } from '@domains/folder-models/folder-model.store';
import { FolderModelCreate, FolderModelUpdate } from '@domains/folder-models/folder-model.models';
import { buildMergedFixedSections } from '@features/shared/section-indicators/build-merged-fixed-sections';
import { createSectionFacadeHelpers } from '@features/shared/section-indicators/section-facade.helpers';
import { FundingProgramDomainStore } from '@domains/funding-programs/funding-program.store';
import { IndicatorModelDomainStore } from '@domains/indicator-models/indicator-model.store';
import { ToastService } from '@shared/components/toast/toast.service';
import { handleMutationError } from '@domains/shared/mutation-error-handler';
import { FilterParams } from '@domains/shared/with-cursor-pagination';
import { FolderModelFeatureStore } from './folder-model.store';

import { DisplaySection } from '@features/shared/section-indicators/display-section.model';
export type { DisplaySection } from '@features/shared/section-indicators/display-section.model';

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
  readonly updateSectionIndicatorsIsPending = this.domainStore.updateSectionIndicatorsMutationIsPending;
  readonly sectionMutationPending = computed(() =>
    this.createSectionIsPending() || this.updateSectionIsPending() ||
    this.deleteSectionIsPending() || this.updateSectionIndicatorsIsPending(),
  );

  // Cross-domain: indicator model signals
  readonly availableIndicators = this.featureStore.availableIndicators;
  readonly indicatorsLoading = this.featureStore.indicatorsLoading;

  // Merged fixed sections — always includes application + progress, with stubs for missing
  readonly mergedFixedSections = computed<DisplaySection[]>(() =>
    buildMergedFixedSections(this.selectedItem()?.sections ?? []),
  );

  // --- Section indicator operations (shared helpers) ---
  private readonly _sectionHelpers = createSectionFacadeHelpers(
    {
      toast: this.toast,
      getSelectedItem: () => this.selectedItem(),
      updateSectionIndicatorsMutation: (sectionId, data) =>
        this.domainStore.updateSectionIndicatorsMutation({ folderModelId: this.selectedItem()!.id, sectionId, data }),
      createSectionMutation: (data) =>
        this.domainStore.createSectionMutation({ folderModelId: this.selectedItem()!.id, data }),
      updateSectionMutation: (sectionId, data) =>
        this.domainStore.updateSectionMutation({ folderModelId: this.selectedItem()!.id, sectionId, data }),
      refresh: () => this.domainStore.selectById(this.selectedItem()!.id),
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
  readonly ensureSectionExists = this._sectionHelpers.ensureSectionExists;
  readonly updateSectionParams = this._sectionHelpers.updateSectionParams;

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
    this._sectionHelpers.discardParamEdits();
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

  loadIndicators(): void {
    this.imDomainStore.loadAll(undefined);
  }
}
