import { Component, inject, OnInit, OnDestroy, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { MetadataGridComponent, MetadataField } from '@app/shared/components/metadata-grid/metadata-grid.component';
import { BreadcrumbComponent, BreadcrumbItem } from '@app/shared/components/breadcrumb/breadcrumb.component';
import { ConfirmDialogService } from '@shared/components/confirm-dialog/confirm-dialog.service';
import { UserNameResolverService } from '@app/shared/services/user-name-resolver.service';
import { formatDateFr } from '@app/shared/utils/format-date';
import { ActivityListComponent } from '@app/shared/components/activity-list/activity-list.component';
import { CommunityFacade } from '../community.facade';
import { CommunityUsersComponent } from './community-users.component';

@Component({
  selector: 'app-community-detail',
  imports: [MetadataGridComponent, CommunityUsersComponent, ActivityListComponent, BreadcrumbComponent, RouterLink],
  templateUrl: './community-detail.component.html',
})
export class CommunityDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly destroyRef = inject(DestroyRef);
  readonly facade = inject(CommunityFacade);
  private readonly userNameResolver = inject(UserNameResolverService);
  readonly router = inject(Router);

  readonly community = this.facade.selectedItem;

  readonly skeletonFields = Array(6).fill(0);

  readonly breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const c = this.community();
    return [
      { label: 'Communautés', route: '/communities' },
      { label: c?.name ?? '...' },
    ];
  });

  readonly fields = computed<MetadataField[]>(() => {
    const c = this.community();
    if (!c) return [];
    return [
      { label: 'Nom', value: c.name, type: 'text' as const },
      { label: 'SIRET', value: c.siret, type: 'mono' as const },
      { label: 'Commentaire public', value: c.public_comment ?? '—', type: 'text' as const },
      { label: 'Commentaire interne', value: c.internal_comment ?? '—', type: 'text' as const },
      { label: 'Créé le', value: c.created_at, type: 'date' as const },
      { label: 'Mis à jour le', value: c.last_updated_at, type: 'date' as const },
      { label: 'Dernière modification par', value: this.userNameResolver.resolve(c.last_updated_by_id), type: 'text' as const },
    ];
  });

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.facade.select(id);
        this.facade.loadUsers();
      }
    });
  }

  // Required: clear stale selection so navigating to a different item doesn't briefly show the old one.
  ngOnDestroy(): void {
    this.facade.clearSelection();
  }

  formatDate(value: string | null | undefined): string {
    return formatDateFr(value);
  }

  async onDelete(): Promise<void> {
    const c = this.community();
    if (!c) return;

    const confirmed = await this.confirmDialog.confirm({
      title: 'Supprimer la communauté ?',
      message: `Êtes-vous sûr de vouloir supprimer '${c.name}' ? Cette action est irréversible.`,
      confirmLabel: 'Supprimer',
      confirmVariant: 'danger',
    });

    if (!confirmed) return;

    await this.facade.delete(c.id);
  }
}
