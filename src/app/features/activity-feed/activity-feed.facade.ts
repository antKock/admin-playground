import { Injectable, computed, inject, signal } from '@angular/core';

import { AuthService } from '@core/auth/auth.service';
import { GlobalHistoryStore } from '@domains/history/history.store';
import { ActivityFilters, ActivityScope, ActivityWithChildren } from '@domains/history/history.models';
import { filterByScope, rollupIndicators } from '@domains/history/history.utils';

@Injectable({ providedIn: 'root' })
export class ActivityFeedFacade {
  private readonly store = inject(GlobalHistoryStore);
  private readonly authService = inject(AuthService);

  readonly activities = this.store.activities;
  readonly isLoading = this.store.isLoading;
  readonly hasMore = this.store.hasMore;
  readonly error = this.store.error;

  readonly scope = signal<ActivityScope>('admin');
  readonly hideOwnActions = signal(false);
  readonly lastVisitTimestamp = signal<string | null>(null);

  readonly currentUserId = computed(() => this.authService.userId());

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
    this.store.load(filters);
  }

  loadMore(): void {
    this.store.loadMore();
  }

  reset(): void {
    this.store.reset();
  }
}
