import { Component, inject, OnInit, OnDestroy, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { MetadataGridComponent, MetadataField } from '@app/shared/components/metadata-grid/metadata-grid.component';
import { ActivityListComponent } from '@app/shared/components/activity-list/activity-list.component';
import { BreadcrumbComponent, BreadcrumbItem } from '@app/shared/components/breadcrumb/breadcrumb.component';
import { DetailPageLayoutComponent } from '@app/shared/components/layouts/detail-page-layout.component';
import { ConfirmDialogService } from '@shared/components/confirm-dialog/confirm-dialog.service';
import { UserNameResolverService } from '@app/shared/services/user-name-resolver.service';
import { formatDateFr } from '@app/shared/utils/format-date';
import { SiteFacade } from '../site.facade';

@Component({
  selector: 'app-site-detail',
  imports: [MetadataGridComponent, BreadcrumbComponent, DetailPageLayoutComponent, ActivityListComponent],
  templateUrl: './site-detail.component.html',
})
export class SiteDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly confirmDialog = inject(ConfirmDialogService);
  readonly facade = inject(SiteFacade);
  private readonly userNameResolver = inject(UserNameResolverService);
  readonly router = inject(Router);

  readonly site = this.facade.selectedItem;

  readonly errorBreadcrumbs: BreadcrumbItem[] = [
    { label: 'Sites', route: '/sites' },
    { label: 'Erreur' },
  ];

  private get siteId(): string {
    return this.route.snapshot.paramMap.get('id')!;
  }

  readonly breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const s = this.site();
    return [
      { label: 'Sites', route: '/sites' },
      { label: s?.name ?? '...' },
    ];
  });

  readonly fields = computed<MetadataField[]>(() => {
    const s = this.site();
    if (!s) return [];
    return [
      { label: 'Nom', value: s.name, type: 'text' as const },
      { label: 'SIREN', value: s.siren, type: 'mono' as const },
      { label: 'Usage', value: s.usage ?? '—', type: 'text' as const },
      { label: 'ID externe', value: s.external_id ?? '—', type: 'mono' as const },
      { label: 'Communauté', value: this.facade.communityName() ?? s.community_id, type: 'linked' as const, linkedRoute: '/communities/' + s.community_id },
      { label: 'Identifiant unique', value: s.unique_id, type: 'mono' as const },
      { label: 'Créé le', value: s.created_at, type: 'date' as const },
      { label: 'Mis à jour le', value: s.last_updated_at, type: 'date' as const },
      { label: 'Dernière modification par', value: this.userNameResolver.resolve(s.last_updated_by_id), type: 'text' as const },
    ];
  });

  ngOnInit(): void {
    this.facade.select(this.siteId);
    this.facade.loadBuildings(this.siteId);
    this.facade.loadCommunityOptions();
  }

  // Required: clear stale selection so navigating to a different item doesn't briefly show the old one.
  ngOnDestroy(): void {
    this.facade.clearSelection();
  }

  formatDate(value: string | null | undefined): string {
    return formatDateFr(value);
  }

  async onDelete(): Promise<void> {
    const s = this.site();
    if (!s) return;

    const confirmed = await this.confirmDialog.confirm({
      title: 'Supprimer le site',
      message: `Êtes-vous sûr de vouloir supprimer '${s.name}' ? Cette action est irréversible.`,
      confirmLabel: 'Supprimer',
      confirmVariant: 'danger',
    });

    if (!confirmed) return;

    await this.facade.delete(s.id);
  }
}
