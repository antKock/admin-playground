import { Component, inject, OnInit, computed, signal, effect, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CdkDragDrop, CdkDrag, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';

import { MetadataGridComponent, MetadataField } from '@app/shared/components/metadata-grid/metadata-grid.component';
import { ConfirmDialogService } from '@app/shared/services/confirm-dialog.service';
import {
  IndicatorPickerComponent,
  IndicatorOption,
} from '@app/shared/components/indicator-picker/indicator-picker.component';
import {
  IndicatorCardComponent,
  IndicatorCardData,
  IndicatorParams,
} from '@app/shared/components/indicator-card/indicator-card.component';
import { ParamState } from '@app/shared/components/param-hint-icons/param-hint-icons.component';
import { SaveBarComponent } from '@app/shared/components/save-bar/save-bar.component';
import { ActionModelFacade } from '../action-model.facade';

@Component({
  selector: 'app-action-model-detail',
  imports: [
    MetadataGridComponent,
    IndicatorPickerComponent,
    IndicatorCardComponent,
    SaveBarComponent,
    CdkDropList,
    CdkDrag,
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
      } @else if (model()) {
        <div class="flex items-center justify-between mb-6">
          <div>
            <button
              class="text-sm text-text-secondary hover:text-text-primary mb-2 inline-flex items-center gap-1"
              (click)="router.navigate(['/action-models'])"
            >
              &larr; Back to list
            </button>
            <h1 class="text-2xl font-bold text-text-primary">{{ model()!.name }}</h1>
          </div>
          <div class="flex gap-2">
            <button
              class="px-4 py-2 border border-border rounded-lg text-text-primary hover:bg-surface-muted transition-colors"
              (click)="router.navigate(['/action-models', model()!.id, 'edit'])"
            >
              Edit
            </button>
            <button
              class="px-4 py-2 bg-status-invalid text-white rounded-lg hover:opacity-90 transition-opacity"
              (click)="onDelete()"
            >
              Delete
            </button>
          </div>
        </div>

        <app-metadata-grid [fields]="fields()" />

        <!-- Indicators Section -->
        <hr style="border: none; border-top: 1px solid var(--color-stroke-standard); margin: 32px 0 0;" />
        <div class="mt-6">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
            <h2 class="text-lg font-semibold text-text-primary" style="margin: 0;">Indicators</h2>
            <span style="font-size: 13px; color: var(--color-text-tertiary);">{{ indicatorCards().length }} attached</span>
          </div>

          @if (indicatorCards().length === 0) {
            <p class="text-sm text-text-secondary mb-3">No indicators attached yet</p>
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
                    [modified]="isModified(card.id)"
                    (remove)="onDetach($event)"
                    (paramsChange)="onParamsChange(card.id, $event)"
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
export class ActionModelDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly confirmDialog = inject(ConfirmDialogService);
  readonly facade = inject(ActionModelFacade);
  readonly router = inject(Router);

  readonly model = this.facade.selectedItem;

  readonly skeletonFields = Array(6).fill(0);

  readonly fields = computed<MetadataField[]>(() => {
    const m = this.model();
    if (!m) return [];
    return [
      { label: 'Name', value: m.name, type: 'text' as const },
      { label: 'Description', value: m.description ?? '—', type: 'text' as const },
      { label: 'Funding Program', value: m.funding_program?.name ?? '—', type: 'text' as const },
      { label: 'Action Theme', value: m.action_theme?.name ?? '—', type: 'text' as const },
      { label: 'Created', value: m.created_at, type: 'text' as const },
      { label: 'Updated', value: m.updated_at, type: 'text' as const },
    ];
  });

  private readonly serverCards = computed<IndicatorCardData[]>(() => {
    const attached = this.facade.attachedIndicators();
    const edits = this.facade.paramEdits();
    return attached.map((im) => {
      const edited = edits.get(im.id);
      const p = edited ?? im;
      return {
        id: im.id,
        name: im.name,
        type: im.type,
        paramHints: {
          visibility: this.ruleState(p.visibility_rule, 'true'),
          required: this.ruleState(p.required_rule, 'false'),
          editable: this.ruleState(p.editable_rule, 'true'),
          defaultValue: (p.default_value_rule ?? null) != null ? 'on' as ParamState : 'off' as ParamState,
          duplicable: p.duplicable != null ? 'on' as ParamState : 'off' as ParamState,
          constrained: p.constrained_values != null ? 'on' as ParamState : 'off' as ParamState,
        },
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

  async onSave(): Promise<void> {
    const m = this.model();
    if (!m) return;
    await this.facade.saveParamEdits(m.id);
  }

  onDiscard(): void {
    this.facade.discardParamEdits();
  }

  async onDelete(): Promise<void> {
    const m = this.model();
    if (!m) return;

    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete Action Model',
      message: `Are you sure you want to delete '${m.name}'? This action cannot be undone.`,
      confirmLabel: 'Delete',
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
      title: 'Remove Indicator',
      message: `Are you sure you want to remove '${indicator?.name ?? 'this indicator'}'?`,
      confirmLabel: 'Remove',
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

  private ruleState(value: string, defaultVal: string): ParamState {
    if (value === defaultVal) return 'off';
    if (value === 'true' || value === 'false') return 'on';
    return 'rule';
  }
}
