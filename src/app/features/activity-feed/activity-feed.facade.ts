import { Injectable, inject } from '@angular/core';

import { GlobalHistoryStore } from '@domains/history/history.store';
import { ActivityFilters } from '@domains/history/history.models';

@Injectable({ providedIn: 'root' })
export class ActivityFeedFacade {
  private readonly store = inject(GlobalHistoryStore);

  readonly activities = this.store.activities;
  readonly isLoading = this.store.isLoading;
  readonly hasMore = this.store.hasMore;
  readonly error = this.store.error;

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
