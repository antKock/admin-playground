import { Component, inject, OnInit, OnDestroy, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { MetadataGridComponent, MetadataField } from '@app/shared/components/metadata-grid/metadata-grid.component';
import { StatusBadgeComponent } from '@app/shared/components/status-badge/status-badge.component';
import { ActivityListComponent } from '@app/shared/components/activity-list/activity-list.component';
import { ApiInspectorComponent } from '@app/shared/components/api-inspector/api-inspector.component';
import { BreadcrumbComponent, BreadcrumbItem } from '@app/shared/components/breadcrumb/breadcrumb.component';
import { SectionAnchorsComponent, SectionDef } from '@app/shared/components/section-anchors/section-anchors.component';
import { ConfirmDialogService } from '@app/shared/services/confirm-dialog.service';
import { ApiInspectorService } from '@app/shared/services/api-inspector.service';
import { UserNameResolverService } from '@app/shared/services/user-name-resolver.service';
import { formatDateFr } from '@app/shared/utils/format-date';
import { IndicatorModelFacade } from '../indicator-model.facade';

@Component({
  selector: 'app-indicator-model-detail',
  imports: [MetadataGridComponent, StatusBadgeComponent, RouterLink, ActivityListComponent, ApiInspectorComponent, BreadcrumbComponent, SectionAnchorsComponent],
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
      } @else if (model()) {
        <app-breadcrumb [items]="breadcrumbs()" />
        <div class="flex items-center justify-between mb-2">
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-2xl font-bold text-text-primary">{{ model()!.name }}</h1>
              <app-status-badge [status]="model()!.status" />
            </div>
            @if (model()!.technical_label) {
              <p class="text-sm font-mono text-text-tertiary mt-1">{{ model()!.technical_label }}</p>
            }
            <p class="text-xs text-text-tertiary mt-1">Mis à jour le {{ formatDate(model()!.last_updated_at) }} · ID: {{ model()!.id }}</p>
          </div>
          <div class="flex gap-2">
            @if (model()!.status === 'draft') {
              <button
                class="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors disabled:opacity-50"
                (click)="onPublish()"
                [disabled]="facade.anyMutationPending()"
              >
                {{ facade.publishIsPending() ? 'Publication...' : 'Publier' }}
              </button>
            }
            @if (model()!.status === 'published') {
              <button
                class="px-4 py-2 border border-border rounded-lg text-text-primary hover:bg-surface-muted transition-colors disabled:opacity-50"
                (click)="onDisable()"
                [disabled]="facade.anyMutationPending()"
              >
                {{ facade.disableIsPending() ? 'Désactivation...' : 'Désactiver' }}
              </button>
            }
            @if (model()!.status === 'disabled') {
              <button
                class="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors disabled:opacity-50"
                (click)="onActivate()"
                [disabled]="facade.anyMutationPending()"
              >
                {{ facade.activateIsPending() ? 'Activation...' : 'Activer' }}
              </button>
            }
            <button
              class="px-4 py-2 border border-border rounded-lg text-text-primary hover:bg-surface-muted transition-colors disabled:opacity-50"
              (click)="router.navigate(['/indicator-models', model()!.id, 'edit'])"
              [disabled]="facade.anyMutationPending()"
            >
              Modifier
            </button>
            @if (model()!.status !== 'deleted') {
              <button
                class="px-4 py-2 bg-status-invalid text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                (click)="onDelete()"
                [disabled]="facade.anyMutationPending()"
              >
                Supprimer
              </button>
            }
          </div>
        </div>

        <app-section-anchors [sections]="sectionDefs()" class="mb-6 block" />

        <div id="section-metadata">
          <app-metadata-grid [fields]="fields()" />
        </div>

        @if (model()?.type === 'group') {
          <section class="mt-6">
            <h2 class="text-lg font-semibold text-text-primary mb-3">Indicateurs enfants</h2>
            @if ((model()?.children ?? []).length === 0) {
              <p class="text-sm text-text-tertiary">Aucun indicateur enfant.</p>
            } @else {
              <ul class="space-y-1">
                @for (child of model()!.children!; track child.id) {
                  <li class="flex items-center gap-2">
                    <a [routerLink]="['/indicator-models', child.id]"
                       class="text-brand hover:underline text-sm">
                      {{ child.name }}
                    </a>
                    <span class="text-xs text-text-tertiary">({{ child.type }})</span>
                  </li>
                }
              </ul>
            }
          </section>
        }

        <section id="section-usage" class="mt-8">
          <h2 class="text-lg font-semibold text-text-primary mb-3">
            Utilisé dans {{ facade.usageCount() }} modèle{{ facade.usageCount() !== 1 ? 's' : '' }}
          </h2>
          @if (facade.isLoadingUsage()) {
            <div class="animate-pulse h-4 bg-surface-muted rounded w-48"></div>
          } @else if (facade.usageError()) {
            <p class="text-sm text-error">{{ facade.usageError() }}</p>
          } @else if (facade.usageCount() === 0) {
            <p class="text-text-secondary text-sm">Utilisé dans aucun modèle d'action.</p>
          } @else {
            <ul class="space-y-1">
              @for (am of facade.usedInModels(); track am.id) {
                <li>
                  <a [routerLink]="['/action-models', am.id]" target="_blank" rel="noopener noreferrer" class="text-brand hover:underline text-sm">
                    {{ am.name }}
                  </a>
                </li>
              }
            </ul>
          }
        </section>

        <div id="section-activity">
          <app-activity-list entityType="IndicatorModel" [entityId]="model()!.id" />
        </div>

        <div id="section-api-inspector">
          <app-api-inspector [requestUrl]="inspectorService.lastRequestUrl()" [responseBody]="inspectorService.lastResponseBody()" />
        </div>
      } @else if (facade.detailError()) {
        <div class="text-center py-16">
          <app-breadcrumb [items]="errorBreadcrumbs" />
          <p class="text-error font-medium mb-2">Échec du chargement du modèle d'indicateur</p>
          <p class="text-text-secondary text-sm">{{ facade.detailError() }}</p>
        </div>
      }
    </div>
  `,
})
export class IndicatorModelDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly confirmDialog = inject(ConfirmDialogService);
  readonly facade = inject(IndicatorModelFacade);
  readonly inspectorService = inject(ApiInspectorService);
  private readonly userNameResolver = inject(UserNameResolverService);
  readonly router = inject(Router);

  readonly model = this.facade.selectedItem;

  readonly skeletonFields = Array(7).fill(0);

  readonly errorBreadcrumbs: BreadcrumbItem[] = [
    { label: 'Modèles d\'indicateur', route: '/indicator-models' },
    { label: 'Erreur' },
  ];

  readonly breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const m = this.model();
    return [
      { label: 'Modèles d\'indicateur', route: '/indicator-models' },
      { label: m?.name ?? '...' },
    ];
  });

  readonly sectionDefs = computed<SectionDef[]>(() => [
    { label: 'Métadonnées', targetId: 'section-metadata' },
    { label: 'Utilisation', targetId: 'section-usage', count: this.facade.usageCount() },
    { label: 'Activité', targetId: 'section-activity' },
    { label: 'Inspecteur API', targetId: 'section-api-inspector' },
  ]);

  readonly fields = computed<MetadataField[]>(() => {
    const m = this.model();
    if (!m) return [];
    const fields: MetadataField[] = [
      { label: 'Nom', value: m.name, type: 'text' as const },
      { label: 'Label technique', value: m.technical_label, type: 'text' as const },
      { label: 'Description', value: m.description ?? '—', type: 'text' as const },
      { label: 'Type', value: m.type, type: 'text' as const },
    ];
    if (m.type !== 'group') {
      fields.push({ label: 'Unité', value: m.unit ?? '—', type: 'text' as const });
    }
    fields.push(
      { label: 'Créé le', value: m.created_at, type: 'date' as const },
      { label: 'Mis à jour le', value: m.last_updated_at, type: 'date' as const },
      { label: 'Dernière modification par', value: this.userNameResolver.resolve(m.last_updated_by_id), type: 'text' as const },
    );
    return fields;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.facade.select(id);
    }
  }

  // Required: clear stale selection so navigating to a different item doesn't briefly show the old one.
  ngOnDestroy(): void {
    this.facade.clearSelection();
  }

  formatDate(value: string | null | undefined): string {
    return formatDateFr(value);
  }

  private get modelId(): string {
    return this.route.snapshot.paramMap.get('id')!;
  }

  onPublish(): void {
    this.facade.publish(this.modelId);
  }

  onDisable(): void {
    this.facade.disable(this.modelId);
  }

  onActivate(): void {
    this.facade.activate(this.modelId);
  }

  async onDelete(): Promise<void> {
    const m = this.model();
    if (!m) return;

    const confirmed = await this.confirmDialog.confirm({
      title: 'Supprimer le modèle d\'indicateur',
      message: `Êtes-vous sûr de vouloir supprimer '${m.name}' ? Cette action est irréversible.`,
      confirmLabel: 'Supprimer',
      confirmVariant: 'danger',
    });

    if (!confirmed) return;

    await this.facade.delete(m.id);
  }
}
