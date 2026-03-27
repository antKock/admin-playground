import { Component, inject, OnInit, OnDestroy, computed, viewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { MetadataGridComponent, MetadataField } from '@app/shared/components/metadata-grid/metadata-grid.component';
import { BreadcrumbComponent, BreadcrumbItem } from '@app/shared/components/breadcrumb/breadcrumb.component';
import { DetailPageLayoutComponent } from '@app/shared/components/layouts/detail-page-layout.component';
import { SectionCardComponent } from '@app/shared/components/section-card/section-card.component';
import { SectionParamsEditorComponent, SectionParams } from '@app/shared/components/section-card/section-params-editor.component';
import { IndicatorPickerComponent, IndicatorOption } from '@app/shared/components/indicator-picker/indicator-picker.component';
import { ParamHintIconsComponent } from '@app/shared/components/param-hint-icons/param-hint-icons.component';
import { UserNameResolverService } from '@app/shared/services/user-name-resolver.service';
import { HasUnsavedChanges } from '@shared/guards/unsaved-changes.guard';
import { EntityModelType, SectionModelWithIndicators } from '@domains/entity-models/entity-model.models';
import { buildSectionIndicatorCards } from '@features/action-models/use-cases/build-section-indicator-cards';
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
    ParamHintIconsComponent,
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
    return this.formSection()?.hasUnsavedChanges() ?? false;
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

  getSectionParams(section: SectionModelWithIndicators): SectionParams {
    return {
      hidden_rule: section.hidden_rule,
      required_rule: section.required_rule,
      disabled_rule: section.disabled_rule,
      occurrence_min_rule: section.occurrence_min_rule,
      occurrence_max_rule: section.occurrence_max_rule,
      constrained_rule: section.constrained_rule,
    };
  }

  onSectionParamsChange(section: SectionModelWithIndicators, params: SectionParams): void {
    this.facade.updateSectionParams(section.id, section.key, params);
  }

  async onSectionAttach(section: SectionModelWithIndicators, indicator: IndicatorOption): Promise<void> {
    await this.facade.addIndicatorToSection(section.id, section.key, indicator.id);
  }

  async onSectionDetach(section: SectionModelWithIndicators, indicatorId: string): Promise<void> {
    await this.facade.removeIndicatorFromSection(section.id, indicatorId);
  }

  async onCreateSectionAndAttach(indicator: IndicatorOption): Promise<void> {
    await this.facade.addIndicatorToSection(null, 'additional_info', indicator.id);
  }
}
