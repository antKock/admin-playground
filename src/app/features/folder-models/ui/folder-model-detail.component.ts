import { Component, inject, OnInit, OnDestroy, computed, HostListener } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CdkDragDrop, CdkDrag, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';

import { MetadataGridComponent, MetadataField } from '@app/shared/components/metadata-grid/metadata-grid.component';
import { ActivityListComponent } from '@app/shared/components/activity-list/activity-list.component';
import { BreadcrumbComponent, BreadcrumbItem } from '@app/shared/components/breadcrumb/breadcrumb.component';
import { DetailPageLayoutComponent } from '@app/shared/components/layouts/detail-page-layout.component';
import { SectionAnchorsComponent, SectionDef } from '@app/shared/components/section-anchors/section-anchors.component';
import { SectionCardComponent } from '@app/shared/components/section-card/section-card.component';
import { SectionParamsEditorComponent, SectionParams } from '@app/shared/components/section-card/section-params-editor.component';
import {
  IndicatorPickerComponent,
  IndicatorOption,
} from '@app/shared/components/indicator-picker/indicator-picker.component';
import {
  IndicatorCardComponent,
  IndicatorCardData,
  IndicatorParams,
  ChildParamsChangeEvent,
} from '@app/shared/components/indicator-card/indicator-card.component';
import { SaveBarComponent } from '@app/shared/components/save-bar/save-bar.component';
import { ConfirmDialogService } from '@shared/components/confirm-dialog/confirm-dialog.service';
import { UserNameResolverService } from '@app/shared/services/user-name-resolver.service';
import { formatDateFr } from '@app/shared/utils/format-date';
import { sectionParamsToHints } from '@app/shared/components/section-card/section-card.models';
import { ParamHints } from '@app/shared/components/param-hint-icons/param-hint-icons.component';
import { HasUnsavedChanges } from '@shared/guards/unsaved-changes.guard';
import { FolderModelFacade, DisplaySection } from '../folder-model.facade';
import { buildSectionIndicatorCards } from '@features/shared/section-indicators/build-section-indicator-cards';
import * as helpers from '@features/shared/section-indicators/section-indicator-editing.helpers';

@Component({
  selector: 'app-folder-model-detail',
  imports: [
    MetadataGridComponent,
    ActivityListComponent,
    BreadcrumbComponent,
    DetailPageLayoutComponent,
    SectionAnchorsComponent,
    SectionCardComponent,
    SectionParamsEditorComponent,
    IndicatorPickerComponent,
    IndicatorCardComponent,
    SaveBarComponent,
    CdkDropList,
    CdkDrag,
    RouterLink,
  ],
  templateUrl: './folder-model-detail.component.html',
})
export class FolderModelDetailComponent implements OnInit, OnDestroy, HasUnsavedChanges {
  private readonly route = inject(ActivatedRoute);
  private readonly confirmDialog = inject(ConfirmDialogService);
  readonly facade = inject(FolderModelFacade);
  private readonly userNameResolver = inject(UserNameResolverService);
  readonly router = inject(Router);

  readonly model = this.facade.selectedItem;

  readonly breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const m = this.model();
    return [
      { label: 'Modèles de dossier', route: '/folder-models' },
      { label: m?.name ?? '...' },
    ];
  });

  readonly fields = computed<MetadataField[]>(() => {
    const m = this.model();
    if (!m) return [];
    return [
      { label: 'Nom', value: m.name, type: 'text' as const },
      { label: 'Description', value: m.description ?? '—', type: 'text' as const },
      { label: 'Créé le', value: m.created_at, type: 'date' as const },
      { label: 'Mis à jour le', value: m.last_updated_at, type: 'date' as const },
      { label: 'Dernière modification par', value: this.userNameResolver.resolve(m.last_updated_by_id), type: 'text' as const },
    ];
  });

  readonly sectionDefs = computed<SectionDef[]>(() => [
    { label: 'Métadonnées', targetId: 'section-metadata' },
    { label: 'Sections', targetId: 'section-fixed-sections' },
    { label: 'Activité', targetId: 'section-activity' },
  ]);

  readonly pickerOptions = computed<IndicatorOption[]>(() =>
    this.facade.availableIndicators().map((im) => ({
      id: im.id,
      name: im.name,
      technical_label: im.technical_label,
      type: im.type,
      children: im.children?.map((c) => ({ id: c.id, name: c.name, technical_label: c.technical_label, type: c.type })),
    })),
  );

  readonly fixedSectionViews = computed(() =>
    this.facade.workingSections().map((section) => ({
      section,
      indicatorCards: buildSectionIndicatorCards(section.indicators ?? []),
      attachedIds: (section.indicators ?? []).map((ind) => ind.id),
    })),
  );

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    helpers.handleParamSaveKeydown(this.facade, event, () => this.onSave());
  }

  computeSectionHints(section: DisplaySection): ParamHints {
    return sectionParamsToHints(this.getSectionParams(section));
  }

  getSectionParams(section: DisplaySection): SectionParams {
    return {
      hidden_rule: section.hidden_rule,
      required_rule: section.required_rule,
      disabled_rule: section.disabled_rule,
      occurrence_rule: section.occurrence_rule ?? { min: 'false', max: 'false' },
      constrained_rule: section.constrained_rule,
    };
  }

  getSectionIndicatorParams(sectionId: string, indicatorId: string): IndicatorParams {
    return helpers.getSectionIndicatorParams(this.facade, sectionId, indicatorId);
  }

  getSectionChildParamsMap(sectionId: string, card: IndicatorCardData): Record<string, IndicatorParams> {
    return helpers.getSectionChildParamsMap(this.facade, sectionId, card);
  }

  onSectionIndicatorParamsChange(sectionId: string, indicatorId: string, params: IndicatorParams): void {
    helpers.onSectionIndicatorParamsChange(this.facade, sectionId, indicatorId, params);
  }

  onSectionChildParamsChange(sectionId: string, parentId: string, event: ChildParamsChangeEvent): void {
    helpers.onSectionChildParamsChange(this.facade, sectionId, parentId, event);
  }

  onSectionParamsChange(section: DisplaySection, params: SectionParams): void {
    this.facade.updateSectionParams(section.id, section.key, params);
  }

  async onSectionAttach(section: DisplaySection, indicator: IndicatorOption): Promise<void> {
    this.facade.addIndicatorToSection(section.id, section.key, indicator);
  }

  async onSectionDetach(section: DisplaySection, indicatorId: string): Promise<void> {
    this.facade.removeIndicatorFromSection(section.id, section.key, indicatorId);
  }

  onSectionDrop(section: DisplaySection, event: CdkDragDrop<string | null>): void {
    if (event.previousIndex === event.currentIndex) return;

    const indicators = section.indicators ?? [];
    const ids = indicators.map((ind) => ind.id);
    moveItemInArray(ids, event.previousIndex, event.currentIndex);

    this.facade.reorderSectionIndicators(section.id, section.key, ids);
  }

  async onSave(): Promise<void> {
    await this.facade.saveParamEdits();
  }

  onDiscard(): void {
    this.facade.discardParamEdits();
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.facade.select(id);
      this.facade.loadIndicators();
    }
  }

  ngOnDestroy(): void {
    this.facade.clearSelection();
  }

  hasUnsavedChanges(): boolean {
    return this.facade.isDirty();
  }

  formatDate(value: string | null | undefined): string {
    return formatDateFr(value);
  }

  async onDelete(): Promise<void> {
    const m = this.model();
    if (!m) return;

    const confirmed = await this.confirmDialog.confirm({
      title: 'Supprimer le modèle de dossier',
      message: `Êtes-vous sûr de vouloir supprimer '${m.name}' ? Cette action est irréversible.`,
      confirmLabel: 'Supprimer',
      confirmVariant: 'danger',
    });

    if (!confirmed) return;

    await this.facade.delete(m.id);
  }

}
