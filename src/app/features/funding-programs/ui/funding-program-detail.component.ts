import { Component, inject, OnInit, OnDestroy, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { MetadataGridComponent, MetadataField } from '@app/shared/components/metadata-grid/metadata-grid.component';
import { ActivityListComponent } from '@app/shared/components/activity-list/activity-list.component';
import { BreadcrumbComponent, BreadcrumbItem } from '@app/shared/components/breadcrumb/breadcrumb.component';
import { DetailPageLayoutComponent } from '@app/shared/components/layouts/detail-page-layout.component';
import { ConfirmDialogService } from '@shared/components/confirm-dialog/confirm-dialog.service';
import { UserNameResolverService } from '@app/shared/services/user-name-resolver.service';
import { formatDateFr } from '@app/shared/utils/format-date';
import { FundingProgramFacade } from '../funding-program.facade';

@Component({
  selector: 'app-funding-program-detail',
  imports: [MetadataGridComponent, ActivityListComponent, BreadcrumbComponent, DetailPageLayoutComponent],
  templateUrl: './funding-program-detail.component.html',
})
export class FundingProgramDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly confirmDialog = inject(ConfirmDialogService);
  readonly facade = inject(FundingProgramFacade);
  private readonly userNameResolver = inject(UserNameResolverService);
  readonly router = inject(Router);

  readonly program = this.facade.selectedItem;

  readonly breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const p = this.program();
    return [
      { label: 'Programmes de financement', route: '/funding-programs' },
      { label: p?.name ?? '...' },
    ];
  });

  private readonly currencyFmt = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });

  readonly folderModelName = computed(() => {
    const p = this.program();
    if (!p?.folder_model_id) return null;
    const options = this.facade.fmOptions();
    return options.find(o => o.id === p.folder_model_id)?.label ?? null;
  });

  readonly fields = computed<MetadataField[]>(() => {
    const p = this.program();
    if (!p) return [];
    return [
      { label: 'Nom', value: p.name, type: 'text' as const },
      { label: 'Description', value: p.description ?? '—', type: 'text' as const },
      { label: 'Budget', value: p.budget != null ? this.currencyFmt.format(p.budget) : '—', type: 'text' as const },
      { label: 'Statut', value: p.is_active ? 'Actif' : 'Inactif', type: 'status' as const },
      { label: 'Date de début', value: p.start_date ?? '—', type: 'date' as const },
      { label: 'Date de fin', value: p.end_date ?? '—', type: 'date' as const },
      {
        label: 'Modèle de dossier',
        value: this.folderModelName() ?? '—',
        type: p.folder_model_id ? 'linked' as const : 'text' as const,
        linkedRoute: p.folder_model_id ? '/folder-models/' + p.folder_model_id : undefined,
      },
      { label: 'Créé le', value: p.created_at, type: 'date' as const },
      { label: 'Mis à jour le', value: p.last_updated_at, type: 'date' as const },
      { label: 'Dernière modification par', value: this.userNameResolver.resolve(p.last_updated_by_id), type: 'text' as const },
    ];
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.facade.select(id);
    }
    this.facade.loadAssociationData();
  }

  // Required: clear stale selection so navigating to a different item doesn't briefly show the old one.
  ngOnDestroy(): void {
    this.facade.clearSelection();
  }

  formatDate(value: string | null | undefined): string {
    return formatDateFr(value);
  }

  async onDelete(): Promise<void> {
    const p = this.program();
    if (!p) return;

    const confirmed = await this.confirmDialog.confirm({
      title: 'Supprimer le programme de financement',
      message: `Êtes-vous sûr de vouloir supprimer '${p.name}' ? Cette action est irréversible.`,
      confirmLabel: 'Supprimer',
      confirmVariant: 'danger',
    });

    if (!confirmed) return;

    await this.facade.delete(p.id);
  }
}
