import { Component, inject, OnInit, OnDestroy, computed, signal, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CdkDragDrop, CdkDrag, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';

import { MetadataGridComponent, MetadataField } from '@app/shared/components/metadata-grid/metadata-grid.component';
import { StatusBadgeComponent } from '@app/shared/components/status-badge/status-badge.component';
import { BreadcrumbComponent, BreadcrumbItem } from '@app/shared/components/breadcrumb/breadcrumb.component';
import { DetailPageLayoutComponent } from '@app/shared/components/layouts/detail-page-layout.component';
import { SectionAnchorsComponent, SectionDef } from '@app/shared/components/section-anchors/section-anchors.component';
import { ConfirmDialogService } from '@shared/components/confirm-dialog/confirm-dialog.service';
import { UserNameResolverService } from '@app/shared/services/user-name-resolver.service';
import { formatDateFr } from '@app/shared/utils/format-date';
import {
  IndicatorPickerComponent,
  IndicatorOption,
} from '@app/shared/components/indicator-picker/indicator-picker.component';
import {
  IndicatorCardComponent,
  IndicatorCardData,
  IndicatorParams,
} from '@app/shared/components/indicator-card/indicator-card.component';
import { SaveBarComponent } from '@app/shared/components/save-bar/save-bar.component';
import { ActivityListComponent } from '@app/shared/components/activity-list/activity-list.component';
import { SectionCardComponent } from '@app/shared/components/section-card/section-card.component';
import { AssociationSectionToggleComponent } from '@app/shared/components/section-card/association-section-toggle.component';
import { SectionParamsEditorComponent, SectionParams } from '@app/shared/components/section-card/section-params-editor.component';
import { SectionKey, SECTION_TYPE_MAP, ASSOCIATION_SECTION_TYPES } from '@app/shared/components/section-card/section-card.models';
import { ActionModelFacade, DisplaySection } from '../action-model.facade';
import { buildSectionIndicatorCards } from '../use-cases/build-section-indicator-cards';

@Component({
  selector: 'app-action-model-detail',
  imports: [
    MetadataGridComponent,
    StatusBadgeComponent,
    IndicatorPickerComponent,
    IndicatorCardComponent,
    SaveBarComponent,
    BreadcrumbComponent,
    DetailPageLayoutComponent,
    SectionAnchorsComponent,
    CdkDropList,
    CdkDrag,
    ActivityListComponent,
    SectionCardComponent,
    AssociationSectionToggleComponent,
    SectionParamsEditorComponent,
  ],
  templateUrl: './action-model-detail.component.html',
})
export class ActionModelDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly confirmDialog = inject(ConfirmDialogService);
  readonly facade = inject(ActionModelFacade);
  private readonly userNameResolver = inject(UserNameResolverService);
  readonly router = inject(Router);

  readonly model = this.facade.selectedItem;

  readonly errorBreadcrumbs: BreadcrumbItem[] = [
    { label: 'Modèles d\'action', route: '/action-models' },
    { label: 'Erreur' },
  ];

  readonly breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const m = this.model();
    return [
      { label: 'Modèles d\'action', route: '/action-models' },
      { label: m?.name ?? '...' },
    ];
  });

  readonly sectionDefs = computed<SectionDef[]>(() => [
    { label: 'Métadonnées', targetId: 'section-metadata' },
    { label: 'Sections d\'association', targetId: 'section-association-sections' },
    { label: 'Sections', targetId: 'section-fixed-sections' },
    { label: 'Activité', targetId: 'section-activity' },
  ]);

  readonly fields = computed<MetadataField[]>(() => {
    const m = this.model();
    if (!m) return [];
    return [
      { label: 'Nom', value: m.name, type: 'text' as const },
      { label: 'Description', value: m.description ?? '—', type: 'text' as const },
      { label: 'Programme de financement', value: m.funding_program?.name ?? '—', type: 'text' as const },
      { label: 'Thème d\'action', value: m.action_theme?.name ?? '—', type: 'text' as const },
      { label: 'Créé le', value: m.created_at, type: 'date' as const },
      { label: 'Mis à jour le', value: m.last_updated_at, type: 'date' as const },
      { label: 'Dernière modification par', value: this.userNameResolver.resolve(m.last_updated_by_id), type: 'text' as const },
    ];
  });

  readonly mergedFixedSections = this.facade.mergedFixedSections;
  readonly sectionTypeMap = SECTION_TYPE_MAP;

  // Pre-computed association section view data
  readonly associationSectionViews = computed(() =>
    ASSOCIATION_SECTION_TYPES.map((sType) => {
      const sections = this.facade.selectedItem()?.sections ?? [];
      const section = sections.find((s) => s.key === sType) as DisplaySection | undefined;
      const sectionId = section?.id ?? '';
      const sectionEdits = sectionId ? this._getSectionEdits(sectionId) : undefined;
      return {
        sType,
        enabled: !!section,
        section,
        config: SECTION_TYPE_MAP[sType],
        indicatorCards: section ? buildSectionIndicatorCards(section.indicators ?? [], sectionEdits) : [],
        attachedIds: (section?.indicators ?? []).map((ind) => ind.id),
      };
    }),
  );

  // Pre-computed fixed section indicator cards
  readonly fixedSectionViews = computed(() =>
    this.mergedFixedSections().map((section) => {
      const sectionId = section.id ?? '';
      const sectionEdits = sectionId ? this._getSectionEdits(sectionId) : undefined;
      return {
        section,
        indicatorCards: buildSectionIndicatorCards(section.indicators ?? [], sectionEdits),
        attachedIds: (section.indicators ?? []).map((ind) => ind.id),
      };
    }),
  );

  readonly pickerOptions = computed<IndicatorOption[]>(() =>
    this.facade.availableIndicators().map((im) => ({
      id: im.id,
      name: im.name,
      technical_label: im.technical_label,
      type: im.type,
    })),
  );

  // Local override for optimistic drag-to-reorder per section
  private readonly _localSectionCardOrder = signal<Map<string, IndicatorCardData[]>>(new Map());

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

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key === 's') {
      event.preventDefault();
      if (this.facade.unsavedCount() > 0) {
        this.onSave();
      }
    }
  }

  getSectionIndicatorParams(sectionId: string, indicatorId: string): IndicatorParams {
    return this.facade.getSectionIndicatorParams(sectionId, indicatorId);
  }

  onSectionIndicatorParamsChange(sectionId: string, indicatorId: string, params: IndicatorParams): void {
    this.facade.updateSectionIndicatorParams(sectionId, indicatorId, params);
  }

  async onSave(): Promise<void> {
    await this.facade.saveParamEdits();
  }

  onDiscard(): void {
    this.facade.discardParamEdits();
  }

  private get modelId(): string {
    return this.route.snapshot.paramMap.get('id')!;
  }

  onPublish(): void {
    this.facade.publish(this.modelId);
  }

  onDisable(): void {
    this.facade.disable(this.modelId);
  }

  onActivate(): void {
    this.facade.activate(this.modelId);
  }

  async onDelete(): Promise<void> {
    const m = this.model();
    if (!m) return;

    const confirmed = await this.confirmDialog.confirm({
      title: 'Supprimer le modèle d\'action',
      message: `Êtes-vous sûr de vouloir supprimer '${m.name}' ? Cette action est irréversible.`,
      confirmLabel: 'Supprimer',
      confirmVariant: 'danger',
    });

    if (!confirmed) return;

    await this.facade.delete(m.id);
  }

  onToggleAssociation(sectionKey: SectionKey): void {
    this.facade.toggleAssociationSection(sectionKey);
  }

  getSectionParams(section: DisplaySection): SectionParams {
    return {
      hidden_rule: section.hidden_rule,
      required_rule: section.required_rule,
      disabled_rule: section.disabled_rule,
      occurrence_min_rule: section.occurrence_min_rule,
      occurrence_max_rule: section.occurrence_max_rule,
      constrained_rule: section.constrained_rule,
    };
  }

  onSectionParamsChange(section: DisplaySection, params: SectionParams): void {
    this.facade.updateSectionParams(section.id, section.key, params);
  }

  async onSectionAttach(section: DisplaySection, indicator: IndicatorOption): Promise<void> {
    await this.facade.addIndicatorToSection(section.id, section.key, indicator.id);
  }

  async onSectionDetach(section: DisplaySection, indicatorId: string): Promise<void> {
    if (!section.id) return;
    await this.facade.removeIndicatorFromSection(section.id, indicatorId);
  }

  onSectionDrop(section: DisplaySection, event: CdkDragDrop<string | null>): void {
    if (!section.id || event.previousIndex === event.currentIndex) return;

    const sectionId = section.id;
    const indicators = section.indicators ?? [];
    const ids = indicators.map((ind) => ind.id);
    moveItemInArray(ids, event.previousIndex, event.currentIndex);

    this.facade.reorderSectionIndicators(sectionId, ids);
  }

  formatDate(value: string | null | undefined): string {
    return formatDateFr(value);
  }

  private _getSectionEdits(sectionId: string): Map<string, IndicatorParams> | undefined {
    const edits = this.facade.getEditsForSection(sectionId);
    return edits.size > 0 ? edits : undefined;
  }
}
