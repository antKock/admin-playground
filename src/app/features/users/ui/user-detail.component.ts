import { Component, inject, OnInit, OnDestroy, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { MetadataGridComponent, MetadataField } from '@app/shared/components/metadata-grid/metadata-grid.component';
import { ApiInspectorComponent } from '@app/shared/components/api-inspector/api-inspector.component';
import { BreadcrumbComponent, BreadcrumbItem } from '@app/shared/components/breadcrumb/breadcrumb.component';
import { ConfirmDialogService } from '@app/shared/services/confirm-dialog.service';
import { ApiInspectorService } from '@app/shared/services/api-inspector.service';
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
  imports: [MetadataGridComponent, UserCommunitiesComponent, ActivityListComponent, ApiInspectorComponent, BreadcrumbComponent],
  template: `
    <div class="p-6">
      @if (facade.isLoadingDetail()) {
        <div class="animate-pulse space-y-4">
          <div class="h-8 bg-surface-muted rounded w-1/3"></div>
          <div class="h-4 bg-surface-muted rounded w-1/4"></div>
          <div class="grid grid-cols-2 gap-4 mt-6">
            @for (i of skeletonFields; track $index) {
              <div class="space-y-2">
                <div class="h-3 bg-surface-muted rounded w-20"></div>
                <div class="h-4 bg-surface-muted rounded w-32"></div>
              </div>
            }
          </div>
        </div>
      } @else if (facade.detailError()) {
        <div class="text-center py-16">
          <app-breadcrumb [items]="[{ label: 'Utilisateurs', route: '/users' }, { label: 'Erreur' }]" />
          <p class="text-error mb-4">{{ facade.detailError() }}</p>
        </div>
      } @else if (user()) {
        <app-breadcrumb [items]="breadcrumbs()" />
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-text-primary">{{ user()!.first_name }} {{ user()!.last_name }}</h1>
            <p class="text-xs text-text-tertiary mt-1">Mis à jour le {{ formatDate(user()!.last_updated_at) }} · ID: {{ user()!.id }}</p>
          </div>
          <div class="flex gap-2">
            <button
              class="px-4 py-2 border border-border rounded-lg text-text-primary hover:bg-surface-muted transition-colors"
              (click)="router.navigate(['/users', user()!.id, 'edit'])"
            >
              Modifier
            </button>
            <button
              class="px-4 py-2 bg-status-invalid text-white rounded-lg hover:opacity-90 transition-opacity"
              (click)="onDelete()"
            >
              Supprimer
            </button>
          </div>
        </div>

        <app-metadata-grid [fields]="fields()" />

        <app-user-communities />

        <app-activity-list entityType="User" [entityId]="user()!.id" />

        <app-api-inspector [requestUrl]="inspectorService.lastRequestUrl()" [responseBody]="inspectorService.lastResponseBody()" />
      }
    </div>
  `,
})
export class UserDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly confirmDialog = inject(ConfirmDialogService);
  readonly facade = inject(UserFacade);
  readonly inspectorService = inject(ApiInspectorService);
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
