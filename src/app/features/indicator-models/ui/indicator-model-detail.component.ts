import { Component, inject, OnInit, OnDestroy, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { MetadataGridComponent, MetadataField } from '@app/shared/components/metadata-grid/metadata-grid.component';
import { StatusBadgeComponent } from '@app/shared/components/status-badge/status-badge.component';
import { ActivityListComponent } from '@app/shared/components/activity-list/activity-list.component';
import { ApiInspectorComponent } from '@shared/api-inspector/api-inspector.component';
import { BreadcrumbComponent, BreadcrumbItem } from '@app/shared/components/breadcrumb/breadcrumb.component';
import { SectionAnchorsComponent, SectionDef } from '@app/shared/components/section-anchors/section-anchors.component';
import { ConfirmDialogService } from '@shared/components/confirm-dialog/confirm-dialog.service';
import { ApiInspectorService } from '@shared/api-inspector/api-inspector.service';
import { UserNameResolverService } from '@app/shared/services/user-name-resolver.service';
import { formatDateFr } from '@app/shared/utils/format-date';
import { IndicatorModelFacade } from '../indicator-model.facade';

@Component({
  selector: 'app-indicator-model-detail',
  imports: [MetadataGridComponent, StatusBadgeComponent, RouterLink, ActivityListComponent, ApiInspectorComponent, BreadcrumbComponent, SectionAnchorsComponent],
  templateUrl: './indicator-model-detail.component.html',
})
export class IndicatorModelDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly confirmDialog = inject(ConfirmDialogService);
  readonly facade = inject(IndicatorModelFacade);
  readonly inspectorService = inject(ApiInspectorService);
  private readonly userNameResolver = inject(UserNameResolverService);
  readonly router = inject(Router);

  readonly model = this.facade.selectedItem;

  readonly skeletonFields = Array(7).fill(0);

  readonly errorBreadcrumbs: BreadcrumbItem[] = [
    { label: 'Modèles d\'indicateur', route: '/indicator-models' },
    { label: 'Erreur' },
  ];

  readonly breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const m = this.model();
    return [
      { label: 'Modèles d\'indicateur', route: '/indicator-models' },
      { label: m?.name ?? '...' },
    ];
  });

  readonly sectionDefs = computed<SectionDef[]>(() => [
    { label: 'Métadonnées', targetId: 'section-metadata' },
    { label: 'Utilisation', targetId: 'section-usage', count: this.facade.usageCount() },
    { label: 'Activité', targetId: 'section-activity' },
    { label: 'Inspecteur API', targetId: 'section-api-inspector' },
  ]);

  readonly fields = computed<MetadataField[]>(() => {
    const m = this.model();
    if (!m) return [];
    const fields: MetadataField[] = [
      { label: 'Nom', value: m.name, type: 'text' as const },
      { label: 'Label technique', value: m.technical_label, type: 'text' as const },
      { label: 'Description', value: m.description ?? '—', type: 'text' as const },
      { label: 'Type', value: m.type, type: 'text' as const },
    ];
    if (m.type !== 'group') {
      fields.push({ label: 'Unité', value: m.unit ?? '—', type: 'text' as const });
    }
    fields.push(
      { label: 'Créé le', value: m.created_at, type: 'date' as const },
      { label: 'Mis à jour le', value: m.last_updated_at, type: 'date' as const },
      { label: 'Dernière modification par', value: this.userNameResolver.resolve(m.last_updated_by_id), type: 'text' as const },
    );
    return fields;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.facade.select(id);
    }
  }

  // Required: clear stale selection so navigating to a different item doesn't briefly show the old one.
  ngOnDestroy(): void {
    this.facade.clearSelection();
  }

  formatDate(value: string | null | undefined): string {
    return formatDateFr(value);
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
      title: 'Supprimer le modèle d\'indicateur',
      message: `Êtes-vous sûr de vouloir supprimer '${m.name}' ? Cette action est irréversible.`,
      confirmLabel: 'Supprimer',
      confirmVariant: 'danger',
    });

    if (!confirmed) return;

    await this.facade.delete(m.id);
  }
}
