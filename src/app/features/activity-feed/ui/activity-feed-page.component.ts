import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { DataTableComponent, ColumnDef } from '@app/shared/components/data-table/data-table.component';
import { formatDateFr } from '@app/shared/utils/format-date';
import { ActivityFeedFacade } from '../activity-feed.facade';
import { entityRoute, actionLabel } from '@domains/history/history.utils';

const ENTITY_TYPE_OPTIONS = [
  { label: 'Tous les types', value: '' },
  { label: 'Programme de financement', value: 'FundingProgram' },
  { label: 'Modèle de dossier', value: 'FolderModel' },
  { label: "Modèle d'action", value: 'ActionModel' },
  { label: "Thème d'action", value: 'ActionTheme' },
  { label: 'Communauté', value: 'Community' },
  { label: 'Agent', value: 'Agent' },
  { label: "Modèle d'indicateur", value: 'IndicatorModel' },
  { label: 'Utilisateur', value: 'User' },
];

const ENTITY_TYPE_LABELS: Record<string, string> = {
  FundingProgram: 'Programme',
  FolderModel: 'Dossier',
  ActionModel: 'Action',
  ActionTheme: 'Thème',
  Community: 'Communauté',
  Agent: 'Agent',
  IndicatorModel: 'Indicateur',
  User: 'Utilisateur',
};

const ACTION_TYPE_OPTIONS = [
  { label: 'Toutes les actions', value: '' },
  { label: 'Création', value: 'create' },
  { label: 'Modification', value: 'update' },
  { label: 'Suppression', value: 'delete' },
];

@Component({
  selector: 'app-activity-feed-page',
  imports: [DataTableComponent, FormsModule],
  template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold text-text-primary mb-6">Activité globale</h1>

      <div class="flex flex-wrap gap-3 mb-4">
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
        [isLoading]="facade.isLoading()"
        [hasMore]="facade.hasMore()"
        [emptyMessage]="!facade.isLoading() && facade.activities().length === 0 ? 'Aucune activité trouvée.' : null"
        (rowClick)="onRowClick($event)"
        (loadMore)="onLoadMore()"
      />
    </div>
  `,
})
export class ActivityFeedPageComponent implements OnInit, OnDestroy {
  readonly facade = inject(ActivityFeedFacade);
  private readonly router = inject(Router);

  readonly entityTypeOptions = ENTITY_TYPE_OPTIONS;
  readonly actionTypeOptions = ACTION_TYPE_OPTIONS;

  readonly filterEntityType = signal('');
  readonly filterAction = signal('');
  readonly filterSince = signal('');

  readonly columns: ColumnDef[] = [
    { key: 'date_display', label: 'Date', width: '160px' },
    { key: 'user_name', label: 'Utilisateur', width: '150px', bold: true },
    { key: 'action_display', label: 'Action', width: '120px' },
    { key: 'entity_type_display', label: 'Type', width: '120px' },
    { key: 'entity_display_name', label: 'Entité', bold: true },
    { key: 'changes_summary', label: 'Résumé' },
  ];

  readonly rows = computed(() =>
    this.facade.activities().map((activity) => ({
      ...activity,
      date_display: formatDateFr(activity.created_at),
      action_display: actionLabel(activity.action),
      entity_type_display: ENTITY_TYPE_LABELS[activity.entity_type] ?? activity.entity_type,
      entity_display_name: activity.entity_display_name || activity.entity_id,
      _route: entityRoute(activity.entity_type, activity.entity_id),
    })),
  );

  ngOnInit(): void {
    this.reloadWithFilters();
  }

  ngOnDestroy(): void {
    this.facade.reset();
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

  onLoadMore(): void {
    this.facade.loadMore();
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
