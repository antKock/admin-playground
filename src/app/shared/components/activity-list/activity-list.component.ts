import { Component, inject, input, effect, computed, signal } from '@angular/core';

import { formatDateFr } from '@app/shared/utils/format-date';
import { actionLabel, actionBadgeClass, groupByTime } from '@domains/history/history.utils';
import { HistoryStore } from '@domains/history/history.store';

@Component({
  selector: 'app-activity-list',
  templateUrl: './activity-list.component.html',
})
export class ActivityListComponent {
  readonly store = inject(HistoryStore);

  readonly entityType = input.required<string>();
  readonly entityId = input.required<string>();

  readonly expandedTimeGroups = signal(new Set<string>());

  readonly timeGroups = computed(() =>
    groupByTime(this.store.activities()),
  );

  constructor() {
    effect(() => {
      const type = this.entityType();
      const id = this.entityId();
      if (type && id) {
        this.store.load({ entity_type: type, entity_id: id });
      }
    });
  }

  toggleTimeGroup(key: string): void {
    const current = this.expandedTimeGroups();
    const next = new Set(current);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    this.expandedTimeGroups.set(next);
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
    this.store.loadMore();
  }
}
