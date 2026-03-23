import { Component, inject, OnInit, OnDestroy, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { MetadataGridComponent, MetadataField } from '@app/shared/components/metadata-grid/metadata-grid.component';
import { BreadcrumbComponent, BreadcrumbItem } from '@app/shared/components/breadcrumb/breadcrumb.component';
import { ConfirmDialogService } from '@shared/components/confirm-dialog/confirm-dialog.service';
import { UserNameResolverService } from '@app/shared/services/user-name-resolver.service';
import { formatDateFr } from '@app/shared/utils/format-date';
import { ActivityListComponent } from '@app/shared/components/activity-list/activity-list.component';
import { UserFacade } from '../user.facade';
import { UserCommunitiesComponent } from './user-communities.component';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  cdm: 'CDM',
  collectivite: 'Collectivite',
};

@Component({
  selector: 'app-user-detail',
  imports: [MetadataGridComponent, UserCommunitiesComponent, ActivityListComponent, BreadcrumbComponent],
  templateUrl: './user-detail.component.html',
})
export class UserDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly confirmDialog = inject(ConfirmDialogService);
  readonly facade = inject(UserFacade);
  private readonly userNameResolver = inject(UserNameResolverService);
  readonly router = inject(Router);

  readonly user = this.facade.selectedItem;

  readonly skeletonFields = Array(7).fill(0);

  readonly breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const u = this.user();
    return [
      { label: 'Utilisateurs', route: '/users' },
      { label: u ? `${u.first_name} ${u.last_name}` : '...' },
    ];
  });

  readonly fields = computed<MetadataField[]>(() => {
    const u = this.user();
    if (!u) return [];
    return [
      { label: 'Email', value: u.email, type: 'mono' as const },
      { label: 'Prénom', value: u.first_name, type: 'text' as const },
      { label: 'Nom', value: u.last_name, type: 'text' as const },
      { label: 'Rôle', value: ROLE_LABELS[u.role] ?? u.role, type: 'text' as const },
      { label: 'Statut', value: u.is_active ? 'Actif' : 'Inactif', type: 'text' as const },
      { label: 'Créé le', value: u.created_at, type: 'date' as const },
      { label: 'Mis à jour le', value: u.last_updated_at, type: 'date' as const },
      { label: 'Dernière modification par', value: this.userNameResolver.resolve(u.last_updated_by_id), type: 'text' as const },
    ];
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.facade.select(id);
    }
  }

  ngOnDestroy(): void {
    this.facade.clearSelection();
  }

  formatDate(value: string | null | undefined): string {
    return formatDateFr(value);
  }

  async onDelete(): Promise<void> {
    const u = this.user();
    if (!u) return;

    const confirmed = await this.confirmDialog.confirm({
      title: 'Supprimer l\'utilisateur ?',
      message: `Êtes-vous sûr de vouloir supprimer '${u.first_name} ${u.last_name}' ? Cette action est irréversible.`,
      confirmLabel: 'Supprimer',
      confirmVariant: 'danger',
    });

    if (!confirmed) return;

    await this.facade.delete(u.id);
  }
}
