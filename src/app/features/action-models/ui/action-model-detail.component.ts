import { Component, inject, OnInit, OnDestroy, computed, signal, effect, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CdkDragDrop, CdkDrag, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';

import { MetadataGridComponent, MetadataField } from '@app/shared/components/metadata-grid/metadata-grid.component';
import { StatusBadgeComponent } from '@app/shared/components/status-badge/status-badge.component';
import { ApiInspectorComponent } from '@app/shared/components/api-inspector/api-inspector.component';
import { BreadcrumbComponent, BreadcrumbItem } from '@app/shared/components/breadcrumb/breadcrumb.component';
import { SectionAnchorsComponent, SectionDef } from '@app/shared/components/section-anchors/section-anchors.component';
import { ConfirmDialogService } from '@app/shared/services/confirm-dialog.service';
import { ApiInspectorService } from '@app/shared/services/api-inspector.service';
import { UserNameResolverService } from '@app/shared/services/user-name-resolver.service';
import { formatDateFr } from '@app/shared/utils/format-date';
import {
  IndicatorPickerComponent,
  IndicatorOption,
} from '@app/shared/components/indicator-picker/indicator-picker.component';
import {
  IndicatorCardComponent,
  IndicatorCardData,
  IndicatorParams,
  ChildCardData,
  ChildParamsChangeEvent,
} from '@app/shared/components/indicator-card/indicator-card.component';
import { ParamState } from '@app/shared/components/param-hint-icons/param-hint-icons.component';
import { SaveBarComponent } from '@app/shared/components/save-bar/save-bar.component';
import { ActivityListComponent } from '@app/shared/components/activity-list/activity-list.component';
import { ActionModelFacade } from '../action-model.facade';

@Component({
  selector: 'app-action-model-detail',
  imports: [
    MetadataGridComponent,
    StatusBadgeComponent,
    IndicatorPickerComponent,
    IndicatorCardComponent,
    SaveBarComponent,
    ApiInspectorComponent,
    BreadcrumbComponent,
    SectionAnchorsComponent,
    CdkDropList,
    CdkDrag,
    ActivityListComponent,
  ],
  template: `
    <div class="p-6" [class.pb-20]="facade.unsavedCount() > 0">
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
      } @else if (model()) {
        <app-breadcrumb [items]="breadcrumbs()" />
        <div class="flex items-center justify-between mb-2">
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-2xl font-bold text-text-primary">{{ model()!.name }}</h1>
              <app-status-badge [status]="model()!.status" />
            </div>
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
              (click)="router.navigate(['/action-models', model()!.id, 'edit'])"
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

        <!-- Indicators Section -->
        <hr style="border: none; border-top: 1px solid var(--color-stroke-standard); margin: 32px 0 0;" />
        <div id="section-indicators" class="mt-6">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
            <h2 class="text-lg font-semibold text-text-primary" style="margin: 0;">Indicateurs</h2>
            <span style="font-size: 13px; color: var(--color-text-tertiary);">{{ indicatorCards().length }} attaché(s)</span>
          </div>

          @if (indicatorCards().length === 0) {
            <p class="text-sm text-text-secondary mb-3">Aucun indicateur attaché</p>
          } @else {
            <div
              cdkDropList
              class="space-y-2 mb-3"
              (cdkDropListDropped)="onDrop($event)"
            >
              @for (card of indicatorCards(); track card.id) {
                <div cdkDrag cdkDragLockAxis="y">
                  <app-indicator-card
                    [indicator]="card"
                    [params]="getParams(card.id)"
                    [childParams]="getChildParamsMap(card.id)"
                    [modified]="isModified(card.id)"
                    modelType="action"
                    [modelId]="model()!.id"
                    (remove)="onDetach($event)"
                    (paramsChange)="onParamsChange(card.id, $event)"
                    (childParamsChange)="onChildParamsChange(card.id, $event)"
                  />
                </div>
              }
            </div>
          }

          <app-indicator-picker
            [options]="pickerOptions()"
            [attachedIds]="attachedIds()"
            [loading]="facade.indicatorsLoading()"
            (attach)="onAttach($event)"
          />
        </div>

        @if (model()) {
          <div id="section-activity">
            <app-activity-list entityType="ActionModel" [entityId]="model()!.id" />
          </div>
        }

        <div id="section-api-inspector">
          <app-api-inspector [requestUrl]="inspectorService.lastRequestUrl()" [responseBody]="inspectorService.lastResponseBody()" />
        </div>
      }
    </div>

    <app-save-bar
      [count]="facade.unsavedCount()"
      [saving]="facade.updateIsPending()"
      (save)="onSave()"
      (discard)="onDiscard()"
    />
  `,
})
export class ActionModelDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly confirmDialog = inject(ConfirmDialogService);
  readonly facade = inject(ActionModelFacade);
  readonly inspectorService = inject(ApiInspectorService);
  private readonly userNameResolver = inject(UserNameResolverService);
  readonly router = inject(Router);

  readonly model = this.facade.selectedItem;

  readonly skeletonFields = Array(6).fill(0);

  readonly errorBreadcrumbs: BreadcrumbItem[] = [
    { label: 'Modèles d\'action', route: '/action-models' },
    { label: 'Erreur' },
  ];

  readonly breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const m = this.model();
    return [
      { label: 'Modèles d\'action', route: '/action-models' },
      { label: m?.name ?? '...' },
    ];
  });

  readonly sectionDefs = computed<SectionDef[]>(() => [
    { label: 'Métadonnées', targetId: 'section-metadata' },
    { label: 'Indicateurs', targetId: 'section-indicators', count: this.indicatorCards().length },
    { label: 'Activité', targetId: 'section-activity' },
    { label: 'Inspecteur API', targetId: 'section-api-inspector' },
  ]);

  readonly fields = computed<MetadataField[]>(() => {
    const m = this.model();
    if (!m) return [];
    return [
      { label: 'Nom', value: m.name, type: 'text' as const },
      { label: 'Description', value: m.description ?? '—', type: 'text' as const },
      { label: 'Programme de financement', value: m.funding_program?.name ?? '—', type: 'text' as const },
      { label: 'Thème d\'action', value: m.action_theme?.name ?? '—', type: 'text' as const },
      { label: 'Créé le', value: m.created_at, type: 'date' as const },
      { label: 'Mis à jour le', value: m.last_updated_at, type: 'date' as const },
      { label: 'Dernière modification par', value: this.userNameResolver.resolve(m.last_updated_by_id), type: 'text' as const },
    ];
  });

  private readonly serverCards = computed<IndicatorCardData[]>(() => {
    const attached = this.facade.attachedIndicators();
    const available = this.facade.availableIndicators();
    const availableMap = new Map(available.map((a) => [a.id, a]));
    const edits = this.facade.paramEdits();
    return attached.map((im) => {
      const edited = edits.get(im.id);
      const p = edited ?? im;
      const full = availableMap.get(im.id);
      const children: ChildCardData[] | undefined = im.children?.map((child) => ({
        id: child.id,
        name: child.name,
        technical_label: child.technical_label,
        type: child.type,
        paramHints: {
          visibility: this.ruleState(child.hidden_rule, 'false'),
          required: this.ruleState(child.required_rule, 'false'),
          editable: this.ruleState(child.disabled_rule, 'false'),
          defaultValue: this.ruleState(child.default_value_rule, 'false'),
          duplicable: this.ruleState(child.duplicable_rule, 'false'),
          constrained: this.ruleState(child.constrained_rule, 'false'),
        },
      }));
      return {
        id: im.id,
        name: im.name,
        technical_label: full?.technical_label,
        type: im.type,
        paramHints: {
          visibility: this.ruleState(p.hidden_rule, 'false'),
          required: this.ruleState(p.required_rule, 'false'),
          editable: this.ruleState(p.disabled_rule, 'false'),
          defaultValue: this.ruleState(p.default_value_rule, 'false'),
          duplicable: this.ruleState(p.duplicable_rule, 'false'),
          constrained: this.ruleState(p.constrained_rule, 'false'),
        },
        children: children?.length ? children : undefined,
      };
    });
  });

  // Local override for optimistic drag-to-reorder — cleared when server data refreshes
  private readonly _localCardOrder = signal<IndicatorCardData[] | null>(null);

  readonly indicatorCards = computed(() => this._localCardOrder() ?? this.serverCards());

  readonly attachedIds = computed(() => this.facade.attachedIndicators().map((im) => im.id));

  readonly pickerOptions = computed<IndicatorOption[]>(() =>
    this.facade.availableIndicators().map((im) => ({
      id: im.id,
      name: im.name,
      technical_label: im.technical_label,
      type: im.type,
    })),
  );

  constructor() {
    // Clear local order override when server data changes
    effect(() => {
      this.serverCards();
      this._localCardOrder.set(null);
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.facade.select(id);
      this.facade.loadIndicators();
    }
  }

  // Required: clear stale selection so navigating to a different item doesn't briefly show the old one.
  ngOnDestroy(): void {
    this.facade.clearSelection();
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key === 's') {
      event.preventDefault();
      if (this.facade.unsavedCount() > 0) {
        this.onSave();
      }
    }
  }

  getParams(indicatorId: string): IndicatorParams {
    return this.facade.getParamsForIndicator(indicatorId);
  }

  isModified(indicatorId: string): boolean {
    return this.facade.modifiedIds().includes(indicatorId);
  }

  onParamsChange(indicatorId: string, params: IndicatorParams): void {
    this.facade.updateParams(indicatorId, params);
  }

  getChildParamsMap(parentId: string): Record<string, IndicatorParams> {
    const attached = this.facade.attachedIndicators().find((im) => im.id === parentId);
    if (!attached?.children?.length) return {};
    const map: Record<string, IndicatorParams> = {};
    for (const child of attached.children) {
      map[child.id] = this.facade.getParamsForChild(parentId, child.id);
    }
    return map;
  }

  onChildParamsChange(parentId: string, event: ChildParamsChangeEvent): void {
    this.facade.updateChildParams(parentId, event.childId, event.params);
  }

  async onSave(): Promise<void> {
    const m = this.model();
    if (!m) return;
    await this.facade.saveParamEdits(m.id);
  }

  onDiscard(): void {
    this.facade.discardParamEdits();
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
      title: 'Supprimer le modèle d\'action',
      message: `Êtes-vous sûr de vouloir supprimer '${m.name}' ? Cette action est irréversible.`,
      confirmLabel: 'Supprimer',
      confirmVariant: 'danger',
    });

    if (!confirmed) return;

    await this.facade.delete(m.id);
  }

  async onAttach(indicator: IndicatorOption): Promise<void> {
    const m = this.model();
    if (!m) return;
    await this.facade.attachIndicator(m.id, indicator.id);
  }

  async onDetach(indicatorId: string): Promise<void> {
    const m = this.model();
    if (!m) return;

    const indicator = this.facade.attachedIndicators().find((im) => im.id === indicatorId);
    const confirmed = await this.confirmDialog.confirm({
      title: 'Retirer l\'indicateur',
      message: `Êtes-vous sûr de vouloir retirer '${indicator?.name ?? 'cet indicateur'}' ?`,
      confirmLabel: 'Retirer',
      confirmVariant: 'danger',
    });

    if (!confirmed) return;

    await this.facade.detachIndicator(m.id, indicatorId);
  }

  onDrop(event: CdkDragDrop<unknown>): void {
    const m = this.model();
    if (!m || event.previousIndex === event.currentIndex) return;

    // Optimistic UI: reorder locally before API call
    const cards = [...this.indicatorCards()];
    moveItemInArray(cards, event.previousIndex, event.currentIndex);
    this._localCardOrder.set(cards);

    const ids = cards.map((c) => c.id);
    this.facade.reorderIndicators(m.id, ids);
  }

  formatDate(value: string | null | undefined): string {
    return formatDateFr(value);
  }

  private ruleState(value: string | null, defaultVal: string): ParamState {
    if (value == null || value === defaultVal) return 'off';
    if (value === 'true' || value === 'false') return 'on';
    return 'rule';
  }
}
