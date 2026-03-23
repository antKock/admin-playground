import { Component, inject, OnInit, OnDestroy, computed, signal, effect, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CdkDragDrop, CdkDrag, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';

import { MetadataGridComponent, MetadataField } from '@app/shared/components/metadata-grid/metadata-grid.component';
import { StatusBadgeComponent } from '@app/shared/components/status-badge/status-badge.component';
import { BreadcrumbComponent, BreadcrumbItem } from '@app/shared/components/breadcrumb/breadcrumb.component';
import { DetailPageLayoutComponent } from '@app/shared/components/layouts/detail-page-layout.component';
import { SectionAnchorsComponent, SectionDef } from '@app/shared/components/section-anchors/section-anchors.component';
import { ConfirmDialogService } from '@shared/components/confirm-dialog/confirm-dialog.service';
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
  ChildParamsChangeEvent,
} from '@app/shared/components/indicator-card/indicator-card.component';
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
    BreadcrumbComponent,
    DetailPageLayoutComponent,
    SectionAnchorsComponent,
    CdkDropList,
    CdkDrag,
    ActivityListComponent,
  ],
  templateUrl: './action-model-detail.component.html',
})
export class ActionModelDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly confirmDialog = inject(ConfirmDialogService);
  readonly facade = inject(ActionModelFacade);
  private readonly userNameResolver = inject(UserNameResolverService);
  readonly router = inject(Router);

  readonly model = this.facade.selectedItem;

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

  // Local override for optimistic drag-to-reorder — cleared when server data refreshes
  private readonly _localCardOrder = signal<IndicatorCardData[] | null>(null);

  readonly indicatorCards = computed(() => this._localCardOrder() ?? this.facade.indicatorCards());

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
      this.facade.indicatorCards();
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
}
