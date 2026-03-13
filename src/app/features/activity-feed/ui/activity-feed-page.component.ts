import { Component, inject, OnInit, OnDestroy, DestroyRef, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LucideAngularModule, X } from 'lucide-angular';
import { Eye, GitCompareArrows } from 'lucide-angular';

import { DataTableComponent, ColumnDef, RowAction } from '@app/shared/components/data-table/data-table.component';
import { formatDateFr } from '@app/shared/utils/format-date';
import { ActivityFeedFacade } from '../activity-feed.facade';
import { ActivityFilters, ActivityResponse, EntityTypeCategory, VersionComparison } from '@domains/history/history.models';
import {
  ENTITY_TYPE_OPTIONS,
  ENTITY_TYPE_LABELS,
  ACTION_TYPE_OPTIONS,
  CATEGORY_OPTIONS,
  entityRoute,
  actionLabel,
  filterByCategory,
} from '@domains/history/history.utils';
import { entityStateAtDate, compareEntityVersions } from '@domains/history/history.api';

@Component({
  selector: 'app-activity-feed-page',
  imports: [DataTableComponent, FormsModule, LucideAngularModule],
  template: `
    <div class="p-6 relative">
      <h1 class="text-2xl font-bold text-text-primary mb-6">Activité globale</h1>

      <div class="flex flex-wrap items-center gap-3 mb-4">
        <!-- Category toggle -->
        <div class="flex gap-1">
          @for (cat of categoryOptions; track cat.value) {
            <button
              class="px-3 py-1.5 text-xs rounded-full transition-colors"
              [class]="filterCategory() === cat.value
                ? 'bg-brand text-white'
                : 'bg-surface-muted text-text-secondary hover:text-text-primary'"
              (click)="onCategoryChange(cat.value)"
            >
              {{ cat.label }}
            </button>
          }
        </div>

        <div class="w-px h-6 bg-border"></div>

        <select
          class="text-sm border border-border rounded-lg px-3 py-2 bg-surface-base text-text-primary"
          [ngModel]="filterEntityType()"
          (ngModelChange)="onEntityTypeChange($event)"
        >
          @for (opt of entityTypeOptions; track opt.value) {
            <option [value]="opt.value">{{ opt.label }}</option>
          }
        </select>
        <select
          class="text-sm border border-border rounded-lg px-3 py-2 bg-surface-base text-text-primary"
          [ngModel]="filterAction()"
          (ngModelChange)="onActionChange($event)"
        >
          @for (opt of actionTypeOptions; track opt.value) {
            <option [value]="opt.value">{{ opt.label }}</option>
          }
        </select>
        <input
          type="date"
          class="text-sm border border-border rounded-lg px-3 py-2 bg-surface-base text-text-primary"
          [ngModel]="filterSince()"
          (ngModelChange)="onSinceChange($event)"
        />
      </div>

      @if (facade.error()) {
        <p class="text-sm text-error mb-4">{{ facade.error() }}</p>
      }

      <app-data-table
        [columns]="columns"
        [data]="rows()"
        [actions]="tableActions"
        [isLoading]="facade.isLoading()"
        [hasMore]="facade.hasMore()"
        [emptyMessage]="!facade.isLoading() && rows().length === 0 ? 'Aucune activité trouvée.' : null"
        (rowClick)="onRowClick($event)"
        (actionClick)="onActionClick($event)"
        (loadMore)="onLoadMore()"
      />

      <!-- Detail side panel -->
      @if (detailPanel(); as panel) {
        <div class="fixed inset-0 z-50 flex justify-end" (click)="onBackdropClick($event)" (keydown.escape)="closeDetail()">
          <div class="absolute inset-0 bg-black/30"></div>
          <div class="relative w-[520px] max-w-full h-full bg-surface-base shadow-xl flex flex-col overflow-hidden">
            <div class="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 class="text-sm font-semibold text-text-primary">{{ panel.title }}</h3>
              <button (click)="closeDetail()" class="p-1 rounded hover:bg-surface-muted" aria-label="Fermer">
                <lucide-icon [img]="X" [size]="18"></lucide-icon>
              </button>
            </div>
            <div class="flex-1 overflow-y-auto p-4">
              @if (panel.loading) {
                <div class="animate-pulse space-y-2">
                  @for (i of [1, 2, 3, 4]; track i) {
                    <div class="h-4 bg-surface-muted rounded w-3/4"></div>
                  }
                </div>
              } @else if (panel.error) {
                <p class="text-sm text-error">{{ panel.error }}</p>
              } @else if (panel.type === 'state') {
                @if (panel.stateData; as data) {
                  @let entries = objectEntries(data);
                  <div class="space-y-2">
                    @for (entry of entries; track entry[0]) {
                      <div class="text-sm">
                        <span class="font-medium text-text-secondary">{{ entry[0] }}:</span>
                        <span class="text-text-primary ml-1">{{ formatValue(entry[1]) }}</span>
                      </div>
                    }
                  </div>
                }
              } @else if (panel.type === 'compare') {
                @if (panel.comparison; as comp) {
                  @if (comp.added_fields.length > 0) {
                    <div class="mb-3">
                      <h4 class="text-xs font-semibold text-status-done mb-1">Champs ajoutés</h4>
                      @for (field of comp.added_fields; track field) {
                        <div class="text-sm text-status-done bg-status-done/5 px-2 py-1 rounded mb-1">+ {{ field }}</div>
                      }
                    </div>
                  }
                  @if (comp.removed_fields.length > 0) {
                    <div class="mb-3">
                      <h4 class="text-xs font-semibold text-status-invalid mb-1">Champs supprimés</h4>
                      @for (field of comp.removed_fields; track field) {
                        <div class="text-sm text-status-invalid bg-status-invalid/5 px-2 py-1 rounded mb-1">- {{ field }}</div>
                      }
                    </div>
                  }
                  @let changeEntries = objectEntries(comp.changes);
                  @if (changeEntries.length > 0) {
                    <div>
                      <h4 class="text-xs font-semibold text-brand mb-1">Modifications</h4>
                      @for (entry of changeEntries; track entry[0]) {
                        <div class="text-sm border border-border rounded px-2 py-1.5 mb-1">
                          <span class="font-medium text-text-secondary">{{ entry[0] }}</span>
                          @if (isChangePair(entry[1])) {
                            <div class="mt-0.5 text-xs text-status-invalid bg-status-invalid/5 px-1 py-0.5 rounded">- {{ formatValue(asChangePair(entry[1]).old) }}</div>
                            <div class="mt-0.5 text-xs text-status-done bg-status-done/5 px-1 py-0.5 rounded">+ {{ formatValue(asChangePair(entry[1]).new) }}</div>
                          } @else {
                            <div class="mt-0.5 text-xs text-text-primary">{{ formatValue(entry[1]) }}</div>
                          }
                        </div>
                      }
                    </div>
                  }
                  @if (comp.added_fields.length === 0 && comp.removed_fields.length === 0 && changeEntries.length === 0) {
                    <p class="text-sm text-text-secondary">Aucun changement détecté.</p>
                  }
                }
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class ActivityFeedPageComponent implements OnInit, OnDestroy {
  readonly facade = inject(ActivityFeedFacade);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);

  readonly X = X;
  readonly entityTypeOptions = ENTITY_TYPE_OPTIONS;
  readonly actionTypeOptions = ACTION_TYPE_OPTIONS;
  readonly categoryOptions = CATEGORY_OPTIONS;

  readonly filterEntityType = signal('');
  readonly filterAction = signal('');
  readonly filterSince = signal('');
  readonly filterCategory = signal<EntityTypeCategory>('all');
  readonly detailPanel = signal<DetailPanel | null>(null);

  readonly columns: ColumnDef[] = [
    { key: 'date_display', label: 'Date', width: '160px' },
    { key: 'user_name', label: 'Utilisateur', width: '150px', bold: true },
    { key: 'action_display', label: 'Action', width: '120px' },
    { key: 'entity_type_display', label: 'Type', width: '120px' },
    { key: 'entity_display_name', label: 'Entité', bold: true },
    { key: 'parent_display', label: 'Parent', width: '150px' },
    { key: 'changes_summary', label: 'Résumé' },
  ];

  readonly tableActions: RowAction[] = [
    { label: 'Voir l\'état', icon: Eye, handler: 'view-state' },
    { label: 'Comparer', icon: GitCompareArrows, handler: 'compare' },
  ];

  readonly filteredActivities = computed(() =>
    filterByCategory(this.facade.activities(), this.filterCategory()),
  );

  readonly rows = computed(() =>
    this.filteredActivities().map((activity) => ({
      ...activity,
      date_display: formatDateFr(activity.created_at),
      action_display: actionLabel(activity.action),
      entity_type_display: ENTITY_TYPE_LABELS[activity.entity_type] ?? activity.entity_type,
      entity_display_name: activity.entity_display_name || activity.entity_id,
      parent_display: activity.parent_entity_name ?? '',
      _route: entityRoute(activity.entity_type, activity.entity_id),
    })),
  );

  ngOnInit(): void {
    this.reloadWithFilters();
  }

  ngOnDestroy(): void {
    this.facade.reset();
  }

  onCategoryChange(value: EntityTypeCategory): void {
    this.filterCategory.set(value);
  }

  onEntityTypeChange(value: string): void {
    this.filterEntityType.set(value);
    this.reloadWithFilters();
  }

  onActionChange(value: string): void {
    this.filterAction.set(value);
    this.reloadWithFilters();
  }

  onSinceChange(value: string): void {
    this.filterSince.set(value);
    this.reloadWithFilters();
  }

  onRowClick(row: Record<string, unknown>): void {
    const route = row['_route'] as string | null;
    if (route) {
      this.router.navigateByUrl(route);
    }
  }

  onActionClick(event: { action: string; row: Record<string, unknown> }): void {
    const activity = event.row as unknown as ActivityResponse;
    if (event.action === 'view-state') {
      this.onViewState(activity);
    } else if (event.action === 'compare') {
      this.onCompare(activity);
    }
  }

  onLoadMore(): void {
    this.facade.loadMore();
  }

  closeDetail(): void {
    this.detailPanel.set(null);
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('fixed')) {
      this.closeDetail();
    }
  }

  objectEntries(obj: Record<string, unknown>): [string, unknown][] {
    return Object.entries(obj);
  }

  formatValue(value: unknown): string {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  isChangePair(value: unknown): boolean {
    return typeof value === 'object' && value !== null && 'old' in value && 'new' in value;
  }

  asChangePair(value: unknown): { old: unknown; new: unknown } {
    return value as { old: unknown; new: unknown };
  }

  private onViewState(activity: ActivityResponse): void {
    const title = `État: ${activity.entity_display_name || activity.entity_id}`;
    this.detailPanel.set({ type: 'state', title, loading: true, error: null, stateData: null, comparison: null });

    entityStateAtDate(this.http, activity.entity_type, activity.entity_id, activity.created_at)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.detailPanel.set({ type: 'state', title, loading: false, error: null, stateData: response.data, comparison: null });
        },
        error: (err) => {
          this.detailPanel.set({ type: 'state', title, loading: false, error: detailErrorMessage(err), stateData: null, comparison: null });
        },
      });
  }

  private onCompare(activity: ActivityResponse): void {
    const title = `Diff: ${activity.entity_display_name || activity.entity_id}`;
    this.detailPanel.set({ type: 'compare', title, loading: true, error: null, stateData: null, comparison: null });

    const date2 = activity.created_at;
    const date1 = new Date(new Date(date2).getTime() - 1).toISOString();

    compareEntityVersions(this.http, activity.entity_type, activity.entity_id, date1, date2)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (comparison) => {
          this.detailPanel.set({ type: 'compare', title, loading: false, error: null, stateData: null, comparison });
        },
        error: (err) => {
          this.detailPanel.set({ type: 'compare', title, loading: false, error: detailErrorMessage(err), stateData: null, comparison: null });
        },
      });
  }

  private reloadWithFilters(): void {
    const filters: ActivityFilters = {};
    const entityType = this.filterEntityType();
    const action = this.filterAction();
    const since = this.filterSince();
    if (entityType) filters.entity_type = entityType;
    if (action) filters.action = action as ActivityFilters['action'];
    if (since) filters.since = new Date(since).toISOString();
    this.facade.load(filters);
  }
}

interface DetailPanel {
  type: 'state' | 'compare';
  title: string;
  loading: boolean;
  error: string | null;
  stateData: Record<string, unknown> | null;
  comparison: VersionComparison | null;
}

function detailErrorMessage(err: { status?: number }): string {
  if (err?.status === 404) return 'Aucun snapshot trouvé pour cette date.';
  return 'Erreur lors du chargement.';
}
