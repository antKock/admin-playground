import { Component, inject, OnInit, OnDestroy, DestroyRef, signal, computed, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { LucideAngularModule, X, Eye, GitCompareArrows } from 'lucide-angular';

import { formatDateFr } from '@app/shared/utils/format-date';
import { ActivityFeedFacade } from '../activity-feed.facade';
import { ActivityResponse, ActivityWithChildren, VersionComparison } from '@domains/history/history.models';
import {
  actionLabel,
  actionBadgeClass,
  entityTypeLabel,
  groupByDay,
} from '@domains/history/history.utils';
import { entityStateAtDate, compareEntityVersions } from '@domains/history/history.api';

const LAST_VISIT_KEY_PREFIX = 'activity-last-visit-';

@Component({
  selector: 'app-activity-feed-page',
  imports: [LucideAngularModule],
  template: `
    <div class="p-6 max-w-4xl relative">
      <h1 class="text-2xl font-bold text-text-primary mb-6">Activité</h1>

      <!-- Controls bar -->
      <div class="flex items-center justify-between mb-6">
        <!-- Scope pill toggle -->
        <div class="flex gap-1 bg-surface-muted rounded-lg p-1">
          <button
            class="px-4 py-1.5 text-sm font-medium rounded-md transition-colors"
            [class]="facade.scope() === 'admin'
              ? 'bg-surface-base text-text-primary shadow-sm'
              : 'text-text-secondary hover:text-text-primary'"
            (click)="facade.scope.set('admin')"
          >
            Administration
          </button>
          <button
            class="px-4 py-1.5 text-sm font-medium rounded-md transition-colors"
            [class]="facade.scope() === 'user'
              ? 'bg-surface-base text-text-primary shadow-sm'
              : 'text-text-secondary hover:text-text-primary'"
            (click)="facade.scope.set('user')"
          >
            Utilisateurs
          </button>
        </div>

        <!-- Hide my actions toggle -->
        <label class="flex items-center gap-2 cursor-pointer select-none">
          <div
            class="relative w-9 h-5 rounded-full transition-colors"
            [class]="facade.hideOwnActions() ? 'bg-brand' : 'bg-surface-mid'"
            (click)="facade.hideOwnActions.set(!facade.hideOwnActions())"
          >
            <div
              class="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
              [class]="facade.hideOwnActions() ? 'translate-x-4' : 'translate-x-0.5'"
            ></div>
          </div>
          <span class="text-sm text-text-secondary">Masquer mes actions</span>
        </label>
      </div>

      @if (facade.error()) {
        <p class="text-sm text-error mb-4">{{ facade.error() }}</p>
      }

      <!-- Timeline -->
      <div class="space-y-6">
        @for (group of dayGroups(); track group.date) {
          <!-- Day header -->
          <div>
            <h2 class="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-3">
              {{ group.label }}
            </h2>

            <div class="space-y-2">
              @for (activity of group.activities; track activity.id) {
                <!-- Activity card -->
                <div
                  class="group relative border rounded-lg px-4 py-3 transition-colors"
                  [class]="isOwnAction(activity)
                    ? 'border-border/50 bg-surface-subtle opacity-60'
                    : 'border-border bg-surface-base hover:bg-surface-table-row-hover'"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex-1 min-w-0">
                      <!-- Top line: user + time -->
                      <div class="flex items-center gap-2 mb-1">
                        <span class="text-sm font-semibold text-text-primary">
                          {{ activity.user_name }}
                        </span>
                        <span class="text-xs text-text-tertiary">
                          {{ formatTime(activity.created_at) }}
                        </span>
                      </div>

                      <!-- Action + entity -->
                      <div class="flex items-center gap-2">
                        <span
                          class="inline-flex px-1.5 py-0.5 text-xs font-medium rounded"
                          [class]="actionBadgeClass(activity.action)"
                        >
                          {{ actionLabel(activity.action) }}
                        </span>
                        <span class="text-xs text-text-tertiary">
                          {{ entityTypeLabel(activity.entity_type) }}
                        </span>
                        <span class="text-sm text-text-primary font-medium truncate">
                          {{ activity.entity_display_name }}
                        </span>
                      </div>

                      <!-- Changes summary -->
                      @if (activity.changes_summary) {
                        <p class="text-xs text-text-secondary mt-1 ml-0.5">
                          {{ activity.changes_summary }}
                        </p>
                      }

                      <!-- Child rollups (indicator instances) -->
                      @if (activity.children?.length) {
                        <div class="mt-1.5 ml-3 border-l-2 border-border/60 pl-3 space-y-0.5">
                          @for (child of activity.children; track child.label) {
                            <p class="text-xs text-text-secondary">
                              <span class="text-text-tertiary">└</span>
                              {{ child.count }} {{ child.label }}
                            </p>
                          }
                        </div>
                      }
                    </div>

                    <!-- Quick actions (visible on hover) -->
                    <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pt-1">
                      <button
                        class="p-1.5 rounded-md hover:bg-surface-muted text-icon-secondary hover:text-icon-primary"
                        title="Voir l'état"
                        (click)="onViewState(activity)"
                      >
                        <lucide-icon [img]="Eye" [size]="15"></lucide-icon>
                      </button>
                      <button
                        class="p-1.5 rounded-md hover:bg-surface-muted text-icon-secondary hover:text-icon-primary"
                        title="Comparer"
                        (click)="onCompare(activity)"
                      >
                        <lucide-icon [img]="GitCompareArrows" [size]="15"></lucide-icon>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Last visit separator -->
                @if (isLastVisitAfter(activity)) {
                  <div class="flex items-center gap-3 py-3">
                    <div class="flex-1 border-t border-dashed border-brand/40"></div>
                    <span class="text-xs font-medium text-brand whitespace-nowrap">
                      Dernière visite · {{ lastVisitLabel() }}
                    </span>
                    <div class="flex-1 border-t border-dashed border-brand/40"></div>
                  </div>
                }
              }
            </div>
          </div>
        }
      </div>

      @if (facade.isLoading()) {
        <div class="mt-6 animate-pulse space-y-2">
          @for (i of [1, 2, 3]; track i) {
            <div class="h-16 bg-surface-muted rounded-lg"></div>
          }
        </div>
      }

      @if (!facade.isLoading() && dayGroups().length === 0) {
        <p class="text-sm text-text-secondary mt-4">Aucune activité trouvée.</p>
      }

      <!-- Load more -->
      @if (facade.hasMore() && !facade.isLoading()) {
        <div class="mt-6">
          <button
            class="px-4 py-2 text-sm border border-border rounded-lg text-text-primary hover:bg-surface-muted transition-colors"
            (click)="facade.loadMore()"
          >
            Charger plus
          </button>
        </div>
      }

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
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);

  readonly X = X;
  readonly Eye = Eye;
  readonly GitCompareArrows = GitCompareArrows;

  readonly detailPanel = signal<DetailPanel | null>(null);

  readonly dayGroups = computed(() => groupByDay(this.facade.filteredActivities()));

  readonly lastVisitLabel = computed(() => {
    const ts = this.facade.lastVisitTimestamp();
    if (!ts) return '';
    return formatDateFr(ts);
  });

  /** The activity ID after which the "last visit" separator should appear. */
  readonly lastVisitAfterActivityId = computed<string | null>(() => {
    const ts = this.facade.lastVisitTimestamp();
    if (!ts) return null;

    const lastVisitTime = new Date(ts).getTime();
    const allActivities = this.facade.filteredActivities();

    for (let i = 0; i < allActivities.length; i++) {
      const activityTime = new Date(allActivities[i].created_at).getTime();
      const nextTime = i < allActivities.length - 1
        ? new Date(allActivities[i + 1].created_at).getTime()
        : -Infinity;

      if (activityTime > lastVisitTime && nextTime <= lastVisitTime) {
        return allActivities[i].id;
      }
    }

    return null;
  });

  private lastVisitUpdated = false;

  /** Update localStorage once data has actually loaded (not before). */
  private readonly updateLastVisitEffect = effect(() => {
    const activities = this.facade.activities();
    const isLoading = this.facade.isLoading();

    if (!isLoading && activities.length > 0 && !this.lastVisitUpdated) {
      this.lastVisitUpdated = true;
      const userId = this.facade.currentUserId();
      if (userId) {
        localStorage.setItem(`${LAST_VISIT_KEY_PREFIX}${userId}`, new Date().toISOString());
      }
    }
  });

  ngOnInit(): void {
    const userId = this.facade.currentUserId();
    if (userId) {
      const stored = localStorage.getItem(`${LAST_VISIT_KEY_PREFIX}${userId}`);
      this.facade.lastVisitTimestamp.set(stored);
    }

    this.facade.load();
  }

  ngOnDestroy(): void {
    this.facade.reset();
  }

  isOwnAction(activity: ActivityResponse): boolean {
    if (this.facade.hideOwnActions()) return false; // hidden entirely, no styling needed
    const userId = this.facade.currentUserId();
    return !!userId && activity.user_id === userId;
  }

  isLastVisitAfter(activity: ActivityWithChildren): boolean {
    return activity.id === this.lastVisitAfterActivityId();
  }

  formatTime(isoDate: string): string {
    return new Date(isoDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  actionLabel = actionLabel;
  actionBadgeClass = actionBadgeClass;
  entityTypeLabel = entityTypeLabel;

  // ── Detail panel (carried over from old implementation) ──────────────

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

  onViewState(activity: ActivityResponse): void {
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

  onCompare(activity: ActivityResponse): void {
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
