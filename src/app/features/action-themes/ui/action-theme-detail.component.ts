import { Component, inject, OnInit, OnDestroy, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { MetadataGridComponent, MetadataField } from '@app/shared/components/metadata-grid/metadata-grid.component';
import { StatusBadgeComponent } from '@app/shared/components/status-badge/status-badge.component';
import { ApiInspectorComponent } from '@app/shared/components/api-inspector/api-inspector.component';
import { BreadcrumbComponent, BreadcrumbItem } from '@app/shared/components/breadcrumb/breadcrumb.component';
import { ConfirmDialogService } from '@app/shared/services/confirm-dialog.service';
import { ApiInspectorService } from '@app/shared/services/api-inspector.service';
import { formatDateFr } from '@app/shared/utils/format-date';
import { ActionThemeFacade } from '../action-theme.facade';

@Component({
  selector: 'app-action-theme-detail',
  imports: [MetadataGridComponent, StatusBadgeComponent, ApiInspectorComponent, BreadcrumbComponent],
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
      } @else if (theme()) {
        <app-breadcrumb [items]="breadcrumbs()" />
        <div class="flex items-center justify-between mb-6">
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-2xl font-bold text-text-primary">{{ theme()!.name }}</h1>
              <app-status-badge [status]="theme()!.status" />
            </div>
            @if (theme()!.technical_label) {
              <p class="text-sm font-mono text-text-tertiary mt-1">{{ theme()!.technical_label }}</p>
            }
            <p class="text-xs text-text-tertiary mt-1">Mis à jour le {{ formatDate(theme()!.updated_at) }} · ID: {{ theme()!.id }}</p>
          </div>
          <div class="flex gap-2">
            @if (theme()!.status === 'draft') {
              <button
                class="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors disabled:opacity-50"
                (click)="onPublish()"
                [disabled]="facade.publishIsPending() || facade.anyMutationPending()"
              >
                {{ facade.publishIsPending() ? 'Publication...' : 'Publier' }}
              </button>
            }
            @if (theme()!.status === 'published') {
              <button
                class="px-4 py-2 border border-border rounded-lg text-text-primary hover:bg-surface-muted transition-colors disabled:opacity-50"
                (click)="onDisable()"
                [disabled]="facade.disableIsPending() || facade.anyMutationPending()"
              >
                {{ facade.disableIsPending() ? 'Désactivation...' : 'Désactiver' }}
              </button>
            }
            @if (theme()!.status === 'disabled') {
              <button
                class="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors disabled:opacity-50"
                (click)="onActivate()"
                [disabled]="facade.activateIsPending() || facade.anyMutationPending()"
              >
                {{ facade.activateIsPending() ? 'Activation...' : 'Activer' }}
              </button>
            }
            <button
              class="px-4 py-2 border border-border rounded-lg text-text-primary hover:bg-surface-muted transition-colors disabled:opacity-50"
              (click)="onDuplicate()"
              [disabled]="facade.duplicateIsPending() || facade.anyMutationPending()"
            >
              {{ facade.duplicateIsPending() ? 'Duplication...' : 'Dupliquer' }}
            </button>
            @if (theme()!.status === 'draft') {
              <button
                class="px-4 py-2 border border-border rounded-lg text-text-primary hover:bg-surface-muted transition-colors"
                (click)="router.navigate(['/action-themes', theme()!.id, 'edit'])"
              >
                Modifier
              </button>
            }
            @if (theme()!.status === 'draft' || theme()!.status === 'disabled') {
              <button
                class="px-4 py-2 bg-status-invalid text-white rounded-lg hover:opacity-90 transition-opacity"
                (click)="onDelete()"
              >
                Supprimer
              </button>
            }
          </div>
        </div>

        <app-metadata-grid [fields]="fields()" />

        <app-api-inspector [requestUrl]="inspectorService.lastRequestUrl()" [responseBody]="inspectorService.lastResponseBody()" />
      }
    </div>
  `,
})
export class ActionThemeDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly confirmDialog = inject(ConfirmDialogService);
  readonly facade = inject(ActionThemeFacade);
  readonly inspectorService = inject(ApiInspectorService);
  readonly router = inject(Router);

  readonly theme = this.facade.selectedItem;
  readonly skeletonFields = Array(6).fill(0);

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
      { label: 'Mis à jour le', value: t.updated_at, type: 'date' as const },
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
