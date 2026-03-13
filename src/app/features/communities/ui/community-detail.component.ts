import { Component, inject, OnInit, OnDestroy, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { MetadataGridComponent, MetadataField } from '@app/shared/components/metadata-grid/metadata-grid.component';
import { ApiInspectorComponent } from '@app/shared/components/api-inspector/api-inspector.component';
import { BreadcrumbComponent, BreadcrumbItem } from '@app/shared/components/breadcrumb/breadcrumb.component';
import { ConfirmDialogService } from '@app/shared/services/confirm-dialog.service';
import { ApiInspectorService } from '@app/shared/services/api-inspector.service';
import { formatDateFr } from '@app/shared/utils/format-date';
import { ActivityListComponent } from '@app/shared/components/activity-list/activity-list.component';
import { CommunityFacade } from '../community.facade';
import { CommunityUsersComponent } from './community-users.component';

@Component({
  selector: 'app-community-detail',
  imports: [MetadataGridComponent, CommunityUsersComponent, ActivityListComponent, ApiInspectorComponent, BreadcrumbComponent, RouterLink],
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
          <app-breadcrumb [items]="[{ label: 'Communautés', route: '/communities' }, { label: 'Erreur' }]" />
          <p class="text-error mb-4">{{ facade.detailError() }}</p>
        </div>
      } @else if (community()) {
        <app-breadcrumb [items]="breadcrumbs()" />
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-text-primary">{{ community()!.name }}</h1>
            <p class="text-xs text-text-tertiary mt-1">Mis à jour le {{ formatDate(community()!.updated_at) }} · ID: {{ community()!.id }}</p>
          </div>
          <div class="flex gap-2">
            <button
              class="px-4 py-2 border border-border rounded-lg text-text-primary hover:bg-surface-muted transition-colors"
              (click)="router.navigate(['/communities', community()!.id, 'edit'])"
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

        <section class="mt-6">
          <h2 class="text-lg font-semibold text-text-primary mb-3">Communautés parentes</h2>
          @if (facade.isLoadingParents()) {
            <div class="animate-pulse h-4 bg-surface-muted rounded w-48"></div>
          } @else if (facade.parentsError()) {
            <p class="text-sm text-error">{{ facade.parentsError() }}</p>
          } @else if (facade.parents().length === 0) {
            <p class="text-sm text-text-tertiary">Aucune communauté parente.</p>
          } @else {
            <ul class="space-y-1">
              @for (parent of facade.parents(); track parent.id) {
                <li>
                  <a [routerLink]="['/communities', parent.id]" target="_blank" rel="noopener noreferrer" class="text-brand hover:underline text-sm">
                    {{ parent.name }}
                  </a>
                </li>
              }
            </ul>
          }
        </section>

        <section class="mt-6">
          <h2 class="text-lg font-semibold text-text-primary mb-3">Communautés enfants</h2>
          @if (facade.isLoadingChildren()) {
            <div class="animate-pulse h-4 bg-surface-muted rounded w-48"></div>
          } @else if (facade.childrenError()) {
            <p class="text-sm text-error">{{ facade.childrenError() }}</p>
          } @else if (facade.children().length === 0) {
            <p class="text-sm text-text-tertiary">Aucune communauté enfant.</p>
          } @else {
            <ul class="space-y-1">
              @for (child of facade.children(); track child.id) {
                <li>
                  <a [routerLink]="['/communities', child.id]" target="_blank" rel="noopener noreferrer" class="text-brand hover:underline text-sm">
                    {{ child.name }}
                  </a>
                </li>
              }
            </ul>
          }
        </section>

        <app-community-users />

        <app-activity-list entityType="Community" [entityId]="community()!.id" />

        <app-api-inspector [requestUrl]="inspectorService.lastRequestUrl()" [responseBody]="inspectorService.lastResponseBody()" />
      }
    </div>
  `,
})
export class CommunityDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly destroyRef = inject(DestroyRef);
  readonly facade = inject(CommunityFacade);
  readonly inspectorService = inject(ApiInspectorService);
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
      { label: 'Mis à jour le', value: c.updated_at, type: 'date' as const },
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
