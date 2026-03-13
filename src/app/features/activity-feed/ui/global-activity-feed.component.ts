import { Component, inject, input, output, signal, effect, computed, OnDestroy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LucideAngularModule, X, ChevronDown, ChevronRight, Eye, GitCompareArrows } from 'lucide-angular';

import { formatDateFr } from '@app/shared/utils/format-date';
import { ActivityFeedFacade } from '../activity-feed.facade';
import { ActivityFilters, EntityTypeCategory, VersionComparison } from '@domains/history/history.models';
import {
  ENTITY_TYPE_OPTIONS,
  ACTION_TYPE_OPTIONS,
  CATEGORY_OPTIONS,
  entityRoute,
  entityTypeLabel,
  actionLabel,
  actionBadgeClass,
  filterByCategory,
  groupByParent,
} from '@domains/history/history.utils';
import { entityStateAtDate, compareEntityVersions } from '@domains/history/history.api';

@Component({
  selector: 'app-global-activity-feed',
  imports: [FormsModule, LucideAngularModule],
  template: `
    @if (isOpen()) {
      <div
        class="fixed inset-0 z-50 flex justify-end"
        (click)="onBackdropClick($event)"
        (keydown.escape)="close()"
      >
        <div class="absolute inset-0 bg-black/30"></div>
        <div
          #panel
          class="relative w-[520px] max-w-full h-full bg-surface-base shadow-xl flex flex-col overflow-hidden"
          tabindex="-1"
        >
          <!-- Header -->
          <div class="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 class="text-lg font-semibold text-text-primary">Activité récente</h2>
            <button (click)="close()" class="p-1 rounded hover:bg-surface-muted" aria-label="Fermer">
              <lucide-icon [img]="X" [size]="18"></lucide-icon>
            </button>
          </div>

          <!-- Category toggle -->
          <div class="flex gap-1 px-4 py-2 border-b border-border">
            @for (cat of categoryOptions; track cat.value) {
              <button
                class="px-3 py-1 text-xs rounded-full transition-colors"
                [class]="filterCategory() === cat.value
                  ? 'bg-brand text-white'
                  : 'bg-surface-muted text-text-secondary hover:text-text-primary'"
                (click)="onCategoryChange(cat.value)"
              >
                {{ cat.label }}
              </button>
            }
          </div>

          <!-- Filters -->
          <div class="flex flex-wrap gap-2 px-4 py-2 border-b border-border">
            <select
              class="flex-1 min-w-0 text-sm border border-border rounded px-2 py-1.5 bg-surface-base text-text-primary"
              [ngModel]="filterEntityType()"
              (ngModelChange)="onEntityTypeChange($event)"
            >
              @for (opt of entityTypeOptions; track opt.value) {
                <option [value]="opt.value">{{ opt.label }}</option>
              }
            </select>
            <select
              class="flex-1 min-w-0 text-sm border border-border rounded px-2 py-1.5 bg-surface-base text-text-primary"
              [ngModel]="filterAction()"
              (ngModelChange)="onActionChange($event)"
            >
              @for (opt of actionTypeOptions; track opt.value) {
                <option [value]="opt.value">{{ opt.label }}</option>
              }
            </select>
            <input
              type="date"
              class="flex-1 min-w-0 text-sm border border-border rounded px-2 py-1.5 bg-surface-base text-text-primary"
              [ngModel]="filterSince()"
              (ngModelChange)="onSinceChange($event)"
              placeholder="Depuis"
            />
          </div>

          <!-- Activity list -->
          <div class="flex-1 overflow-y-auto" (scroll)="onScroll($event)">
            @if (facade.isLoading() && facade.activities().length === 0) {
              <div class="animate-pulse space-y-3 p-4">
                @for (i of [1, 2, 3, 4, 5]; track i) {
                  <div class="flex gap-3">
                    <div class="h-4 bg-surface-muted rounded w-28"></div>
                    <div class="h-4 bg-surface-muted rounded w-40"></div>
                  </div>
                }
              </div>
            } @else if (groups().length === 0 && !facade.isLoading()) {
              <p class="p-4 text-sm text-text-secondary">Aucune activité trouvée.</p>
            } @else {
              <div class="divide-y divide-border">
                @for (group of groups(); track group.key) {
                  <div class="px-4 py-3">
                    <!-- Primary activity row -->
                    @let route = entityRoute(group.primary.entity_type, group.primary.entity_id);
                    <div
                      class="hover:bg-surface-muted/50 transition-colors rounded -mx-2 px-2 py-1"
                      [class.cursor-pointer]="route"
                      (click)="route ? onActivityClick(route) : null"
                    >
                      <div class="flex items-center gap-2 text-sm">
                        <span class="text-text-tertiary text-xs whitespace-nowrap">{{ formatDate(group.primary.created_at) }}</span>
                        <span class="font-medium text-text-primary text-xs">{{ group.primary.user_name }}</span>
                        <span class="px-1.5 py-0.5 text-xs rounded" [class]="actionBadgeClass(group.primary.action)">
                          {{ actionLabel(group.primary.action) }}
                        </span>
                        <!-- Detail buttons -->
                        <span class="ml-auto flex gap-1">
                          <button
                            class="p-0.5 rounded hover:bg-surface-muted text-text-tertiary hover:text-text-primary"
                            title="Voir l'état"
                            (click)="onViewState($event, group.primary)"
                          >
                            <lucide-icon [img]="Eye" [size]="14"></lucide-icon>
                          </button>
                          @if (group.primary.action !== 'create') {
                            <button
                              class="p-0.5 rounded hover:bg-surface-muted text-text-tertiary hover:text-text-primary"
                              title="Comparer avec précédent"
                              (click)="onCompare($event, group.primary)"
                            >
                              <lucide-icon [img]="GitCompareArrows" [size]="14"></lucide-icon>
                            </button>
                          }
                        </span>
                      </div>
                      <div class="mt-1 text-sm text-text-primary">
                        <span class="text-text-secondary text-xs">{{ entityTypeLabel(group.primary.entity_type) }}:</span>
                        {{ group.primary.entity_display_name || group.primary.entity_id }}
                      </div>
                      @if (group.primary.parent_entity_name) {
                        <div class="mt-0.5 text-xs text-text-tertiary">
                          (partie de {{ group.primary.parent_entity_name }})
                        </div>
                      }
                      @if (group.primary.changes_summary) {
                        <p class="mt-0.5 text-xs text-text-secondary line-clamp-2">{{ group.primary.changes_summary }}</p>
                      }
                    </div>

                    <!-- Children (expand/collapse) -->
                    @if (group.children.length > 0) {
                      <button
                        class="flex items-center gap-1 mt-1 text-xs text-brand hover:text-brand/80 transition-colors"
                        (click)="toggleGroup(group.key)"
                      >
                        <lucide-icon
                          [img]="expandedGroups().has(group.key) ? ChevronDown : ChevronRight"
                          [size]="14"
                        ></lucide-icon>
                        {{ group.children.length }} opération{{ group.children.length > 1 ? 's' : '' }} liée{{ group.children.length > 1 ? 's' : '' }}
                      </button>

                      @if (expandedGroups().has(group.key)) {
                        <div class="ml-4 mt-1 space-y-1 border-l-2 border-border pl-3">
                          @for (child of group.children; track child.id) {
                            @let childRoute = entityRoute(child.entity_type, child.entity_id);
                            <div
                              class="py-1 hover:bg-surface-muted/50 rounded px-1 transition-colors"
                              [class.cursor-pointer]="childRoute"
                              (click)="childRoute ? onActivityClick(childRoute) : null"
                            >
                              <div class="flex items-center gap-2 text-xs">
                                <span class="px-1.5 py-0.5 rounded" [class]="actionBadgeClass(child.action)">
                                  {{ actionLabel(child.action) }}
                                </span>
                                <span class="text-text-secondary">{{ entityTypeLabel(child.entity_type) }}:</span>
                                <span class="text-text-primary">{{ child.entity_display_name || child.entity_id }}</span>
                              </div>
                            </div>
                          }
                        </div>
                      }
                    }
                  </div>
                }
              </div>

              @if (facade.isLoading()) {
                <div class="flex justify-center py-4">
                  <span class="text-sm text-text-secondary">Chargement...</span>
                </div>
              }
            }

            @if (facade.error()) {
              <p class="p-4 text-sm text-error">{{ facade.error() }}</p>
            }
          </div>

          <!-- Detail drawer -->
          @if (detailPanel(); as panel) {
            <div class="absolute inset-0 bg-surface-base z-10 flex flex-col">
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
                  <!-- State snapshot view -->
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
                  <!-- Compare diff view -->
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
          }
        </div>
      </div>
    }
  `,
  styles: `
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `,
})
export class GlobalActivityFeedComponent implements OnDestroy {
  readonly facade = inject(ActivityFeedFacade);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);

  readonly isOpen = input.required<boolean>();
  readonly closed = output<void>();

  readonly X = X;
  readonly ChevronDown = ChevronDown;
  readonly ChevronRight = ChevronRight;
  readonly Eye = Eye;
  readonly GitCompareArrows = GitCompareArrows;
  readonly entityTypeOptions = ENTITY_TYPE_OPTIONS;
  readonly actionTypeOptions = ACTION_TYPE_OPTIONS;
  readonly categoryOptions = CATEGORY_OPTIONS;

  readonly filterEntityType = signal('');
  readonly filterAction = signal('');
  readonly filterSince = signal('');
  readonly filterCategory = signal<EntityTypeCategory>('all');
  readonly expandedGroups = signal(new Set<string>());
  readonly detailPanel = signal<DetailPanel | null>(null);

  readonly filteredActivities = computed(() =>
    filterByCategory(this.facade.activities(), this.filterCategory()),
  );

  readonly groups = computed(() =>
    groupByParent(this.filteredActivities()),
  );

  private readonly loadEffect = effect(() => {
    if (this.isOpen()) {
      this.reloadWithFilters();
    }
  });

  ngOnDestroy(): void {
    this.facade.reset();
  }

  close(): void {
    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('fixed')) {
      this.close();
    }
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

  onScroll(event: Event): void {
    const el = event.target as HTMLElement;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    if (nearBottom && this.facade.hasMore() && !this.facade.isLoading()) {
      this.facade.loadMore();
    }
  }

  onActivityClick(route: string): void {
    this.router.navigateByUrl(route);
    this.close();
  }

  toggleGroup(key: string): void {
    const current = this.expandedGroups();
    const next = new Set(current);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    this.expandedGroups.set(next);
  }

  onViewState(event: Event, activity: { entity_type: string; entity_id: string; created_at: string; entity_display_name: string }): void {
    event.stopPropagation();
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

  onCompare(event: Event, activity: { entity_type: string; entity_id: string; created_at: string; entity_display_name: string }): void {
    event.stopPropagation();
    const title = `Diff: ${activity.entity_display_name || activity.entity_id}`;
    this.detailPanel.set({ type: 'compare', title, loading: true, error: null, stateData: null, comparison: null });

    // date2 = activity time (state after this event's snapshot)
    // date1 = 1ms before (gets the most recent snapshot before this event)
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

  closeDetail(): void {
    this.detailPanel.set(null);
  }

  formatDate(value: string): string {
    return formatDateFr(value);
  }

  entityRoute(entityType: string, entityId: string): string | null {
    return entityRoute(entityType, entityId);
  }

  entityTypeLabel(entityType: string): string {
    return entityTypeLabel(entityType);
  }

  actionLabel(action: string): string {
    return actionLabel(action);
  }

  actionBadgeClass(action: string): string {
    return actionBadgeClass(action);
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
