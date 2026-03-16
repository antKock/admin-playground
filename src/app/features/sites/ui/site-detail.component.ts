import { Component, inject, OnInit, OnDestroy, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { MetadataGridComponent, MetadataField } from '@app/shared/components/metadata-grid/metadata-grid.component';
import { ApiInspectorComponent } from '@app/shared/components/api-inspector/api-inspector.component';
import { ActivityListComponent } from '@app/shared/components/activity-list/activity-list.component';
import { BreadcrumbComponent, BreadcrumbItem } from '@app/shared/components/breadcrumb/breadcrumb.component';
import { ConfirmDialogService } from '@app/shared/services/confirm-dialog.service';
import { ApiInspectorService } from '@app/shared/services/api-inspector.service';
import { UserNameResolverService } from '@app/shared/services/user-name-resolver.service';
import { formatDateFr } from '@app/shared/utils/format-date';
import { SiteFacade } from '../site.facade';

@Component({
  selector: 'app-site-detail',
  imports: [MetadataGridComponent, ApiInspectorComponent, BreadcrumbComponent, ActivityListComponent],
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
          <app-breadcrumb [items]="errorBreadcrumbs" />
          <p class="text-error mb-4">{{ facade.detailError() }}</p>
        </div>
      } @else if (site()) {
        <app-breadcrumb [items]="breadcrumbs()" />
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-text-primary">{{ site()!.name }}</h1>
            <p class="text-xs text-text-tertiary mt-1">Mis à jour le {{ formatDate(site()!.last_updated_at) }} · ID: {{ site()!.id }}</p>
          </div>
          <div class="flex gap-2">
            <button
              class="px-4 py-2 border border-border rounded-lg text-text-primary hover:bg-surface-muted transition-colors"
              (click)="router.navigate(['/sites', site()!.id, 'edit'])"
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

        <!-- Buildings sub-list -->
        <div class="mt-8">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-text-primary">
              Bâtiments
              @if (facade.buildings().length > 0) {
                <span class="text-sm font-normal text-text-tertiary ml-2">({{ facade.buildings().length }}{{ facade.buildings().length >= 100 ? '+' : '' }})</span>
              }
            </h2>
            <button
              class="px-3 py-1.5 text-sm bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors"
              (click)="router.navigate(['/buildings/new'], { queryParams: { site_id: site()!.id } })"
            >
              Ajouter un bâtiment
            </button>
          </div>
          @if (facade.isLoadingBuildings()) {
            <div class="animate-pulse space-y-2">
              @for (i of [1,2,3]; track $index) {
                <div class="h-10 bg-surface-muted rounded"></div>
              }
            </div>
          } @else if (facade.buildingsError()) {
            <p class="text-error text-sm">{{ facade.buildingsError() }}</p>
          } @else if (facade.buildings().length === 0) {
            <p class="text-text-tertiary text-sm">Aucun bâtiment associé à ce site.</p>
          } @else {
            <div class="border border-border rounded-lg overflow-hidden">
              <table class="w-full text-sm">
                <thead class="bg-surface-muted">
                  <tr>
                    <th class="px-4 py-2 text-left font-medium text-text-secondary">Nom</th>
                    <th class="px-4 py-2 text-left font-medium text-text-secondary">Usage</th>
                    <th class="px-4 py-2 text-left font-medium text-text-secondary">RNB IDs</th>
                    <th class="px-4 py-2 text-left font-medium text-text-secondary">Créé le</th>
                  </tr>
                </thead>
                <tbody>
                  @for (building of facade.buildings(); track building.id) {
                    <tr class="border-t border-border hover:bg-surface-muted/50 cursor-pointer" (click)="router.navigate(['/buildings', building.id])">
                      <td class="px-4 py-2 text-text-primary">{{ building.name }}</td>
                      <td class="px-4 py-2 text-text-secondary">{{ building.usage ?? '—' }}</td>
                      <td class="px-4 py-2 text-text-secondary font-mono text-xs">{{ (building.rnb_ids ?? []).join(', ') || '—' }}</td>
                      <td class="px-4 py-2 text-text-secondary">{{ formatDate(building.created_at) }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>

        <app-activity-list entityType="Site" [entityId]="site()!.id" />

        <app-api-inspector [requestUrl]="inspectorService.lastRequestUrl()" [responseBody]="inspectorService.lastResponseBody()" />
      }
    </div>
  `,
})
export class SiteDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly confirmDialog = inject(ConfirmDialogService);
  readonly facade = inject(SiteFacade);
  readonly inspectorService = inject(ApiInspectorService);
  private readonly userNameResolver = inject(UserNameResolverService);
  readonly router = inject(Router);

  readonly site = this.facade.selectedItem;
  readonly skeletonFields = Array(6).fill(0);

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
