import { Component, inject, OnInit, OnDestroy, computed, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { MetadataGridComponent, MetadataField } from '@app/shared/components/metadata-grid/metadata-grid.component';
import { ActivityListComponent } from '@app/shared/components/activity-list/activity-list.component';
import { BreadcrumbComponent, BreadcrumbItem } from '@app/shared/components/breadcrumb/breadcrumb.component';
import { DetailPageLayoutComponent } from '@app/shared/components/layouts/detail-page-layout.component';
import { ConfirmDialogService } from '@shared/components/confirm-dialog/confirm-dialog.service';
import { UserNameResolverService } from '@app/shared/services/user-name-resolver.service';
import { formatDateFr } from '@app/shared/utils/format-date';
import { LucideAngularModule, X } from 'lucide-angular';
import { BuildingFacade } from '../building.facade';

@Component({
  selector: 'app-building-detail',
  imports: [MetadataGridComponent, BreadcrumbComponent, DetailPageLayoutComponent, ActivityListComponent, FormsModule, LucideAngularModule],
  templateUrl: './building-detail.component.html',
})
export class BuildingDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly confirmDialog = inject(ConfirmDialogService);
  readonly facade = inject(BuildingFacade);
  private readonly userNameResolver = inject(UserNameResolverService);
  readonly router = inject(Router);
  protected readonly XIcon = X;

  readonly building = this.facade.selectedItem;
  readonly newRnbId = signal('');

  readonly errorBreadcrumbs: BreadcrumbItem[] = [
    { label: 'Bâtiments', route: '/buildings' },
    { label: 'Erreur' },
  ];

  private get buildingId(): string {
    return this.route.snapshot.paramMap.get('id')!;
  }

  readonly breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const b = this.building();
    return [
      { label: 'Bâtiments', route: '/buildings' },
      { label: b?.name ?? '...' },
    ];
  });

  readonly fields = computed<MetadataField[]>(() => {
    const b = this.building();
    if (!b) return [];
    return [
      { label: 'Nom', value: b.name, type: 'text' as const },
      { label: 'Usage', value: b.usage ?? '—', type: 'text' as const },
      { label: 'ID externe', value: b.external_id ?? '—', type: 'mono' as const },
      { label: 'Site', value: this.facade.siteName() ?? b.site_id, type: 'linked' as const, linkedRoute: '/sites/' + b.site_id },
      { label: 'Identifiant unique', value: b.unique_id, type: 'mono' as const },
      { label: 'Créé le', value: b.created_at, type: 'date' as const },
      { label: 'Mis à jour le', value: b.last_updated_at, type: 'date' as const },
      { label: 'Dernière modification par', value: this.userNameResolver.resolve(b.last_updated_by_id), type: 'text' as const },
    ];
  });

  ngOnInit(): void {
    this.facade.select(this.buildingId);
    this.facade.loadSiteOptions();
  }

  // Required: clear stale selection so navigating to a different item doesn't briefly show the old one.
  ngOnDestroy(): void {
    this.facade.clearSelection();
  }

  formatDate(value: string | null | undefined): string {
    return formatDateFr(value);
  }

  async onDelete(): Promise<void> {
    const b = this.building();
    if (!b) return;

    const confirmed = await this.confirmDialog.confirm({
      title: 'Supprimer le bâtiment',
      message: `Êtes-vous sûr de vouloir supprimer '${b.name}' ? Cette action est irréversible.`,
      confirmLabel: 'Supprimer',
      confirmVariant: 'danger',
    });

    if (!confirmed) return;

    await this.facade.delete(b.id);
  }

  async onAddRnb(): Promise<void> {
    const rnbId = this.newRnbId().trim();
    if (!rnbId) return;
    await this.facade.addRnb(this.buildingId, rnbId);
    this.newRnbId.set('');
  }

  async onRemoveRnb(rnbId: string): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Supprimer l\'identifiant RNB',
      message: `Êtes-vous sûr de vouloir supprimer l'identifiant RNB '${rnbId}' ?`,
      confirmLabel: 'Supprimer',
      confirmVariant: 'danger',
    });

    if (!confirmed) return;

    await this.facade.removeRnb(this.buildingId, rnbId);
  }
}
