import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthStore } from '@domains/auth/auth.store';
import { GlobalHistoryStore } from '@domains/history/global-history.store';
import {
  ActivityFilters,
  ActivityResponse,
  ActivityScope,
  ActivityWithChildren,
  VersionComparison,
} from '@domains/history/history.models';
import { FilterParams } from '@domains/shared/with-cursor-pagination';
import { filterByScope, rollupIndicators } from '@domains/history/history.utils';
import { entityStateAtDate, compareEntityVersions } from '@domains/history/history.api';
import { ActivityFeedFeatureStore } from './activity-feed.store';

export interface DetailPanel {
  type: 'state' | 'compare';
  title: string;
  loading: boolean;
  error: string | null;
  stateData: Record<string, unknown> | null;
  comparison: VersionComparison | null;
}

@Injectable({ providedIn: 'root' })
export class ActivityFeedFacade {
  private readonly domainStore = inject(GlobalHistoryStore);
  private readonly featureStore = inject(ActivityFeedFeatureStore);
  private readonly authStore = inject(AuthStore);
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);

  // Data signals — readonly (projected through feature store)
  readonly activities = this.featureStore.activities;
  readonly isLoading = this.featureStore.isLoading;
  readonly hasMore = this.featureStore.hasMore;
  readonly error = this.featureStore.error;

  readonly scope = signal<ActivityScope>('admin');
  readonly hideOwnActions = signal(false);
  readonly lastVisitTimestamp = signal<string | null>(null);
  readonly detailPanel = signal<DetailPanel | null>(null);

  readonly currentUserId = computed(() => this.authStore.userId());

  readonly filteredActivities = computed<ActivityWithChildren[]>(() => {
    let result = filterByScope(this.activities(), this.scope());

    if (this.scope() === 'user') {
      result = rollupIndicators(result);
    }

    if (this.hideOwnActions()) {
      const userId = this.currentUserId();
      if (userId) {
        result = result.filter((a) => a.user_id !== userId);
      }
    }

    return result;
  });

  load(filters?: ActivityFilters): void {
    const filterParams: FilterParams | undefined = filters
      ? Object.fromEntries(Object.entries(filters).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)]))
      : undefined;
    this.domainStore.load(filterParams);
  }

  loadMore(): void {
    this.domainStore.loadMore();
  }

  reset(): void {
    this.domainStore.reset();
  }

  closeDetail(): void {
    this.detailPanel.set(null);
  }

  viewEntityState(activity: ActivityResponse): void {
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

  compareVersions(activity: ActivityResponse): void {
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

function detailErrorMessage(err: { status?: number }): string {
  if (err?.status === 404) return 'Aucun snapshot trouvé pour cette date.';
  return 'Erreur lors du chargement.';
}
