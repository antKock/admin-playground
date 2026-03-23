import { Component, inject, OnInit, OnDestroy, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { MetadataGridComponent, MetadataField } from '@app/shared/components/metadata-grid/metadata-grid.component';
import { StatusBadgeComponent } from '@app/shared/components/status-badge/status-badge.component';
import { ActivityListComponent } from '@app/shared/components/activity-list/activity-list.component';
import { BreadcrumbComponent, BreadcrumbItem } from '@app/shared/components/breadcrumb/breadcrumb.component';
import { DetailPageLayoutComponent } from '@app/shared/components/layouts/detail-page-layout.component';
import { ConfirmDialogService } from '@shared/components/confirm-dialog/confirm-dialog.service';
import { UserNameResolverService } from '@app/shared/services/user-name-resolver.service';
import { formatDateFr } from '@app/shared/utils/format-date';
import { ActionThemeFacade } from '../action-theme.facade';

@Component({
  selector: 'app-action-theme-detail',
  imports: [MetadataGridComponent, StatusBadgeComponent, BreadcrumbComponent, ActivityListComponent, DetailPageLayoutComponent],
  templateUrl: './action-theme-detail.component.html',
})
export class ActionThemeDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly confirmDialog = inject(ConfirmDialogService);
  readonly facade = inject(ActionThemeFacade);
  private readonly userNameResolver = inject(UserNameResolverService);
  readonly router = inject(Router);

  readonly theme = this.facade.selectedItem;

  readonly errorBreadcrumbs: BreadcrumbItem[] = [
    { label: 'Thèmes d\'action', route: '/action-themes' },
    { label: 'Erreur' },
  ];

  private get themeId(): string {
    return this.route.snapshot.paramMap.get('id')!;
  }

  readonly breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const t = this.theme();
    return [
      { label: 'Thèmes d\'action', route: '/action-themes' },
      { label: t?.name ?? '...' },
    ];
  });

  readonly fields = computed<MetadataField[]>(() => {
    const t = this.theme();
    if (!t) return [];
    return [
      { label: 'Nom', value: t.name, type: 'text' as const },
      { label: 'Label technique', value: t.technical_label, type: 'mono' as const },
      { label: 'Description', value: t.description ?? '—', type: 'text' as const },
      { label: 'Statut', value: t.status, type: 'text' as const },
      { label: 'Icône', value: t.icon ?? '—', type: 'text' as const },
      { label: 'Couleur', value: t.color ?? '—', type: 'text' as const },
      { label: 'Créé le', value: t.created_at, type: 'date' as const },
      { label: 'Mis à jour le', value: t.last_updated_at, type: 'date' as const },
      { label: 'Dernière modification par', value: this.userNameResolver.resolve(t.last_updated_by_id), type: 'text' as const },
    ];
  });

  ngOnInit(): void {
    this.facade.select(this.themeId);
  }

  // Required: clear stale selection so navigating to a different item doesn't briefly show the old one.
  ngOnDestroy(): void {
    this.facade.clearSelection();
  }

  formatDate(value: string | null | undefined): string {
    return formatDateFr(value);
  }

  onPublish(): void {
    this.facade.publish(this.themeId);
  }

  onDisable(): void {
    this.facade.disable(this.themeId);
  }

  onActivate(): void {
    this.facade.activate(this.themeId);
  }

  onDuplicate(): void {
    this.facade.duplicate(this.themeId);
  }

  async onDelete(): Promise<void> {
    const t = this.theme();
    if (!t) return;

    const confirmed = await this.confirmDialog.confirm({
      title: 'Supprimer le thème d\'action',
      message: `Êtes-vous sûr de vouloir supprimer '${t.name}' ? Cette action est irréversible.`,
      confirmLabel: 'Supprimer',
      confirmVariant: 'danger',
    });

    if (!confirmed) return;

    await this.facade.delete(t.id);
  }
}
