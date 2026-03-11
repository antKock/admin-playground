import { Component, inject, input, output, signal, effect, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, X } from 'lucide-angular';

import { formatDateFr } from '@app/shared/utils/format-date';
import { ActivityFeedFacade } from '../activity-feed.facade';
import { entityRoute, actionLabel, actionBadgeClass } from '@domains/history/history.utils';

interface EntityTypeOption {
  label: string;
  value: string;
}

const ENTITY_TYPE_OPTIONS: EntityTypeOption[] = [
  { label: 'Tous', value: '' },
  { label: 'Programme de financement', value: 'FundingProgram' },
  { label: 'Modèle de dossier', value: 'FolderModel' },
  { label: "Modèle d'action", value: 'ActionModel' },
  { label: "Thème d'action", value: 'ActionTheme' },
  { label: 'Communauté', value: 'Community' },
  { label: 'Agent', value: 'Agent' },
  { label: "Modèle d'indicateur", value: 'IndicatorModel' },
  { label: 'Utilisateur', value: 'User' },
];

const ACTION_TYPE_OPTIONS = [
  { label: 'Toutes', value: '' },
  { label: 'Création', value: 'create' },
  { label: 'Modification', value: 'update' },
  { label: 'Suppression', value: 'delete' },
];

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
          class="relative w-[480px] max-w-full h-full bg-surface-base shadow-xl flex flex-col overflow-hidden"
          tabindex="-1"
        >
          <!-- Header -->
          <div class="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 class="text-lg font-semibold text-text-primary">Activité récente</h2>
            <button (click)="close()" class="p-1 rounded hover:bg-surface-muted" aria-label="Fermer">
              <lucide-icon [img]="X" [size]="18"></lucide-icon>
            </button>
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
            } @else if (facade.activities().length === 0 && !facade.isLoading()) {
              <p class="p-4 text-sm text-text-secondary">Aucune activité trouvée.</p>
            } @else {
              <div class="divide-y divide-border">
                @for (activity of facade.activities(); track activity.id) {
                  @let route = entityRoute(activity.entity_type, activity.entity_id);
                  <div
                    class="px-4 py-3 hover:bg-surface-muted transition-colors"
                    [class.cursor-pointer]="route"
                    (click)="route ? onActivityClick(route) : null"
                  >
                    <div class="flex items-center gap-2 text-sm">
                      <span class="text-text-tertiary text-xs whitespace-nowrap">{{ formatDate(activity.created_at) }}</span>
                      <span class="font-medium text-text-primary text-xs">{{ activity.user_name }}</span>
                      <span class="px-1.5 py-0.5 text-xs rounded" [class]="actionBadgeClass(activity.action)">
                        {{ actionLabel(activity.action) }}
                      </span>
                    </div>
                    <div class="mt-1 text-sm text-text-primary">
                      <span class="text-text-secondary text-xs">{{ entityTypeLabel(activity.entity_type) }}:</span>
                      {{ activity.entity_display_name || activity.entity_id }}
                    </div>
                    @if (activity.changes_summary) {
                      <p class="mt-0.5 text-xs text-text-secondary line-clamp-2">{{ activity.changes_summary }}</p>
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
export class GlobalActivityFeedComponent implements OnInit, OnDestroy {
  readonly facade = inject(ActivityFeedFacade);
  private readonly router = inject(Router);

  readonly isOpen = input.required<boolean>();
  readonly closed = output<void>();

  readonly X = X;
  readonly entityTypeOptions = ENTITY_TYPE_OPTIONS;
  readonly actionTypeOptions = ACTION_TYPE_OPTIONS;

  readonly filterEntityType = signal('');
  readonly filterAction = signal('');
  readonly filterSince = signal('');

  ngOnInit(): void {
    // Initial load handled by effect watching isOpen
  }

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

  formatDate(value: string): string {
    return formatDateFr(value);
  }

  entityRoute(entityType: string, entityId: string): string | null {
    return entityRoute(entityType, entityId);
  }

  entityTypeLabel(entityType: string): string {
    const found = ENTITY_TYPE_OPTIONS.find((o) => o.value === entityType);
    return found ? found.label : entityType;
  }

  actionLabel(action: string): string {
    return actionLabel(action);
  }

  actionBadgeClass(action: string): string {
    return actionBadgeClass(action);
  }

  private reloadWithFilters(): void {
    const filters: Record<string, string> = {};
    const entityType = this.filterEntityType();
    const action = this.filterAction();
    const since = this.filterSince();
    if (entityType) filters['entity_type'] = entityType;
    if (action) filters['action'] = action;
    if (since) filters['since'] = new Date(since).toISOString();
    this.facade.load(filters as any);
  }
}
