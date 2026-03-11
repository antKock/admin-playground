import { Component, inject, input, effect } from '@angular/core';

import { formatDateFr } from '@app/shared/utils/format-date';
import { actionLabel, actionBadgeClass } from '@domains/history/history.utils';
import { HistoryStore } from '@domains/history/history.store';

@Component({
  selector: 'app-activity-list',
  providers: [HistoryStore],
  template: `
    <div class="mt-8">
      <h2 class="text-lg font-semibold text-text-primary mb-4">Activité</h2>

      @if (store.isLoading() && store.activities().length === 0) {
        <div class="animate-pulse space-y-3">
          @for (i of [1, 2, 3]; track i) {
            <div class="flex gap-3">
              <div class="h-4 bg-surface-muted rounded w-32"></div>
              <div class="h-4 bg-surface-muted rounded w-48"></div>
            </div>
          }
        </div>
      } @else if (store.activities().length === 0) {
        <p class="text-sm text-text-secondary">Aucune activité enregistrée.</p>
      } @else {
        <div class="space-y-3">
          @for (activity of store.activities(); track activity.id) {
            <div class="flex flex-col gap-0.5 px-3 py-2 border border-border rounded-lg">
              <div class="flex items-center gap-2 text-sm">
                <span class="text-text-tertiary">{{ formatDate(activity.created_at) }}</span>
                <span class="font-medium text-text-primary">{{ activity.user_name }}</span>
                <span class="px-1.5 py-0.5 text-xs rounded"
                  [class]="actionBadgeClass(activity.action)">
                  {{ actionLabel(activity.action) }}
                </span>
              </div>
              @if (activity.changes_summary) {
                <p class="text-xs text-text-secondary mt-0.5">{{ activity.changes_summary }}</p>
              }
            </div>
          }
        </div>

        @if (store.hasMore()) {
          <button
            class="mt-4 px-4 py-2 text-sm border border-border rounded-lg text-text-primary hover:bg-surface-muted transition-colors disabled:opacity-50"
            [disabled]="store.isLoading()"
            (click)="onLoadMore()"
          >
            {{ store.isLoading() ? 'Chargement...' : 'Charger plus' }}
          </button>
        }
      }

      @if (store.error()) {
        <p class="text-sm text-error mt-2">{{ store.error() }}</p>
      }
    </div>
  `,
})
export class ActivityListComponent {
  readonly store = inject(HistoryStore);

  readonly entityType = input.required<string>();
  readonly entityId = input.required<string>();

  constructor() {
    effect(() => {
      const type = this.entityType();
      const id = this.entityId();
      if (type && id) {
        this.store.load(type, id);
      }
    });
  }

  formatDate(value: string): string {
    return formatDateFr(value);
  }

  actionLabel(action: string): string {
    return actionLabel(action);
  }

  actionBadgeClass(action: string): string {
    return actionBadgeClass(action);
  }

  onLoadMore(): void {
    this.store.loadMore(this.entityType(), this.entityId());
  }
}
