import { Component, inject, OnInit, OnDestroy, computed, viewChild, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CdkDragDrop, CdkDrag, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';

import { MetadataGridComponent, MetadataField } from '@app/shared/components/metadata-grid/metadata-grid.component';
import { BreadcrumbComponent, BreadcrumbItem } from '@app/shared/components/breadcrumb/breadcrumb.component';
import { DetailPageLayoutComponent } from '@app/shared/components/layouts/detail-page-layout.component';
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
import { UserNameResolverService } from '@app/shared/services/user-name-resolver.service';
import { HasUnsavedChanges } from '@shared/guards/unsaved-changes.guard';
import { EntityModelType } from '@domains/entity-models/entity-model.models';
import { buildSectionIndicatorCards } from '@features/shared/section-indicators/build-section-indicator-cards';
import { DisplaySection } from '@features/shared/section-indicators/display-section.model';
import * as helpers from '@features/shared/section-indicators/section-indicator-editing.helpers';
import { EntityModelFacade } from '../entity-model.facade';
import { EntityModelFormSectionComponent } from './entity-model-form-section.component';

const ENTITY_TYPE_LABELS: Record<EntityModelType, string> = {
  community: 'Communautés',
  agent: 'Agents',
  site: 'Sites',
};

@Component({
  selector: 'app-entity-model-detail',
  imports: [
    MetadataGridComponent,
    BreadcrumbComponent,
    DetailPageLayoutComponent,
    SectionCardComponent,
    SectionParamsEditorComponent,
    IndicatorPickerComponent,
    IndicatorCardComponent,
    SaveBarComponent,
    CdkDropList,
    CdkDrag,
    EntityModelFormSectionComponent,
  ],
  templateUrl: './entity-model-detail.component.html',
})
export class EntityModelDetailComponent implements OnInit, OnDestroy, HasUnsavedChanges {
  private readonly route = inject(ActivatedRoute);
  readonly facade = inject(EntityModelFacade);
  private readonly userNameResolver = inject(UserNameResolverService);
  readonly router = inject(Router);

  private readonly formSection = viewChild(EntityModelFormSectionComponent);

  readonly model = this.facade.selectedItem;

  readonly breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const m = this.model();
    const label = m ? (ENTITY_TYPE_LABELS[m.entity_type] ?? m.name) : '...';
    return [
      { label: 'Modèles d\'entités', route: '/entity-models' },
      { label },
    ];
  });

  readonly headerLabel = computed(() => {
    const m = this.model();
    if (!m) return '...';
    return `Modèle d'entité: ${ENTITY_TYPE_LABELS[m.entity_type] ?? m.entity_type}`;
  });

  readonly fields = computed<MetadataField[]>(() => {
    const m = this.model();
    if (!m) return [];
    return [
      { label: 'Créé le', value: m.created_at, type: 'date' as const },
      { label: 'Mis à jour le', value: m.last_updated_at, type: 'date' as const },
      { label: 'Dernière modification par', value: this.userNameResolver.resolve(m.last_updated_by_id), type: 'text' as const },
    ];
  });

  readonly additionalInfoSection = this.facade.additionalInfoSection;

  readonly sectionView = computed(() => {
    const section = this.additionalInfoSection();
    if (!section) return null;
    return {
      section,
      indicatorCards: buildSectionIndicatorCards(section.indicators ?? []),
      attachedIds: (section.indicators ?? []).map((ind) => ind.id),
    };
  });

  readonly pickerOptions = computed<IndicatorOption[]>(() =>
    this.facade.availableIndicators().map((im) => ({
      id: im.id,
      name: im.name,
      technical_label: im.technical_label,
      type: im.type,
    })),
  );

  hasUnsavedChanges(): boolean {
    return (this.formSection()?.hasUnsavedChanges() ?? false) || this.facade.isDirty();
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    helpers.handleParamSaveKeydown(this.facade, event, () => this.onSave());
  }

  ngOnInit(): void {
    const entityType = this.route.snapshot.paramMap.get('entityType') as EntityModelType;
    if (entityType) {
      this.facade.selectByType(entityType);
      this.facade.loadIndicators();
    }
  }

  ngOnDestroy(): void {
    this.facade.clearSelection();
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

  async onCreateSectionAndAttach(indicator: IndicatorOption): Promise<void> {
    this.facade.ensureSectionExists('additional_info');
    this.facade.addIndicatorToSection(null, 'additional_info', indicator);
  }

  async onSave(): Promise<void> {
    await this.facade.saveParamEdits();
  }

  onDiscard(): void {
    this.facade.discardParamEdits();
  }

}
