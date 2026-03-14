import { Component, inject, OnInit, OnDestroy, computed, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { MetadataGridComponent, MetadataField } from '@app/shared/components/metadata-grid/metadata-grid.component';
import { ApiInspectorComponent } from '@app/shared/components/api-inspector/api-inspector.component';
import { ActivityListComponent } from '@app/shared/components/activity-list/activity-list.component';
import { BreadcrumbComponent, BreadcrumbItem } from '@app/shared/components/breadcrumb/breadcrumb.component';
import { ConfirmDialogService } from '@app/shared/services/confirm-dialog.service';
import { ApiInspectorService } from '@app/shared/services/api-inspector.service';
import { UserNameResolverService } from '@app/shared/services/user-name-resolver.service';
import { formatDateFr } from '@app/shared/utils/format-date';
import { LucideAngularModule, X } from 'lucide-angular';
import { BuildingFacade } from '../building.facade';

@Component({
  selector: 'app-building-detail',
  imports: [MetadataGridComponent, ApiInspectorComponent, BreadcrumbComponent, ActivityListComponent, FormsModule, LucideAngularModule],
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
      } @else if (building()) {
        <app-breadcrumb [items]="breadcrumbs()" />
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-text-primary">{{ building()!.name }}</h1>
            <p class="text-xs text-text-tertiary mt-1">Mis à jour le {{ formatDate(building()!.last_updated_at) }} · ID: {{ building()!.id }}</p>
          </div>
          <div class="flex gap-2">
            <button
              class="px-4 py-2 border border-border rounded-lg text-text-primary hover:bg-surface-muted transition-colors"
              (click)="router.navigate(['/buildings', building()!.id, 'edit'])"
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

        <!-- RNB Management -->
        <div class="mt-8">
          <h2 class="text-lg font-semibold text-text-primary mb-4">Identifiants RNB</h2>

          <!-- Chip list -->
          <div class="flex flex-wrap gap-2 mb-4">
            @for (rnbId of building()!.rnb_ids ?? []; track rnbId) {
              <span class="inline-flex items-center gap-1 px-3 py-1 bg-surface-muted rounded-full text-sm text-text-primary font-mono">
                {{ rnbId }}
                <button
                  class="ml-1 text-text-tertiary hover:text-error transition-colors disabled:opacity-50"
                  (click)="onRemoveRnb(rnbId)"
                  [disabled]="facade.anyMutationPending()"
                  title="Supprimer"
                >
                  <lucide-icon [img]="XIcon" [size]="14" />
                </button>
              </span>
            }
            @if ((building()!.rnb_ids ?? []).length === 0) {
              <p class="text-text-tertiary text-sm">Aucun identifiant RNB.</p>
            }
          </div>

          <!-- Add RNB -->
          <div class="flex items-center gap-2">
            <input
              [(ngModel)]="newRnbId"
              placeholder="Identifiant RNB"
              class="px-3 py-2 border border-border rounded-lg text-text-primary bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand font-mono text-sm w-64"
              (keydown.enter)="onAddRnb()"
            />
            <button
              class="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors disabled:opacity-50 text-sm"
              (click)="onAddRnb()"
              [disabled]="!newRnbId().trim() || facade.anyMutationPending()"
            >
              {{ facade.addRnbIsPending() ? 'Ajout...' : 'Ajouter' }}
            </button>
          </div>
        </div>

        <app-activity-list entityType="Building" [entityId]="building()!.id" />

        <app-api-inspector [requestUrl]="inspectorService.lastRequestUrl()" [responseBody]="inspectorService.lastResponseBody()" />
      }
    </div>
  `,
})
export class BuildingDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly confirmDialog = inject(ConfirmDialogService);
  readonly facade = inject(BuildingFacade);
  readonly inspectorService = inject(ApiInspectorService);
  private readonly userNameResolver = inject(UserNameResolverService);
  readonly router = inject(Router);
  protected readonly XIcon = X;

  readonly building = this.facade.selectedItem;
  readonly skeletonFields = Array(6).fill(0);
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
