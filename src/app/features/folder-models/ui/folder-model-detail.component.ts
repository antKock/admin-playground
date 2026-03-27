import { Component, inject, OnInit, OnDestroy, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { MetadataGridComponent, MetadataField } from '@app/shared/components/metadata-grid/metadata-grid.component';
import { ActivityListComponent } from '@app/shared/components/activity-list/activity-list.component';
import { BreadcrumbComponent, BreadcrumbItem } from '@app/shared/components/breadcrumb/breadcrumb.component';
import { DetailPageLayoutComponent } from '@app/shared/components/layouts/detail-page-layout.component';
import { SectionAnchorsComponent, SectionDef } from '@app/shared/components/section-anchors/section-anchors.component';
import { SectionCardComponent } from '@app/shared/components/section-card/section-card.component';
import { SectionParamsEditorComponent, SectionParams } from '@app/shared/components/section-card/section-params-editor.component';
import { IndicatorPickerComponent, IndicatorOption } from '@app/shared/components/indicator-picker/indicator-picker.component';
import { ParamHintIconsComponent } from '@app/shared/components/param-hint-icons/param-hint-icons.component';
import { ConfirmDialogService } from '@shared/components/confirm-dialog/confirm-dialog.service';
import { UserNameResolverService } from '@app/shared/services/user-name-resolver.service';
import { formatDateFr } from '@app/shared/utils/format-date';
import { FolderModelFacade, DisplaySection } from '../folder-model.facade';
import { buildSectionIndicatorCards } from '@features/action-models/use-cases/build-section-indicator-cards';

@Component({
  selector: 'app-folder-model-detail',
  imports: [MetadataGridComponent, ActivityListComponent, BreadcrumbComponent, DetailPageLayoutComponent, SectionAnchorsComponent, SectionCardComponent, SectionParamsEditorComponent, IndicatorPickerComponent, ParamHintIconsComponent, RouterLink],
  templateUrl: './folder-model-detail.component.html',
})
export class FolderModelDetailComponent implements OnInit, OnDestroy {
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

  readonly mergedFixedSections = this.facade.mergedFixedSections;

  readonly pickerOptions = computed<IndicatorOption[]>(() =>
    this.facade.availableIndicators().map((im) => ({
      id: im.id,
      name: im.name,
      technical_label: im.technical_label,
      type: im.type,
    })),
  );

  // Pre-computed section views with indicator cards
  readonly fixedSectionViews = computed(() =>
    this.mergedFixedSections().map((section) => ({
      section,
      indicatorCards: buildSectionIndicatorCards(section.indicators ?? []),
      attachedIds: (section.indicators ?? []).map((ind) => ind.id),
    })),
  );

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

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.facade.select(id);
      this.facade.loadIndicators();
    }
  }

  // Required: clear stale selection so navigating to a different item doesn't briefly show the old one.
  ngOnDestroy(): void {
    this.facade.clearSelection();
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
