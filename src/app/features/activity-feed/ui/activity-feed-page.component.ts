import { Component, inject, OnInit, OnDestroy, signal, computed, effect } from '@angular/core';
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

const LAST_VISIT_KEY_PREFIX = 'activity-last-visit-';

@Component({
  selector: 'app-activity-feed-page',
  imports: [LucideAngularModule],
  templateUrl: './activity-feed-page.component.html',
})
export class ActivityFeedPageComponent implements OnInit, OnDestroy {
  readonly facade = inject(ActivityFeedFacade);

  readonly X = X;
  readonly Eye = Eye;
  readonly GitCompareArrows = GitCompareArrows;

  readonly detailPanel = this.facade.detailPanel;

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

  // ── Detail panel ──────────────

  closeDetail(): void {
    this.facade.closeDetail();
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
    this.facade.viewEntityState(activity);
  }

  onCompare(activity: ActivityResponse): void {
    this.facade.compareVersions(activity);
  }
}
