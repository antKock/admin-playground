import { Component, inject, OnInit, computed, signal, effect } from '@angular/core';
import { Router } from '@angular/router';

import { LucideAngularModule, Plus } from 'lucide-angular';
import { DataTableComponent, ColumnDef } from '@app/shared/components/data-table/data-table.component';
import { navigateToLink } from '@app/shared/utils/navigate-to-link';
import { AgentFacade } from '../agent.facade';

@Component({
  selector: 'app-agent-list',
  imports: [DataTableComponent, LucideAngularModule],
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-text-primary">Agents</h1>
        <button
          class="inline-flex items-center gap-1 whitespace-nowrap px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors"
          (click)="router.navigate(['/agents/new'])"
        >
          <lucide-icon [img]="PlusIcon" [size]="16" /> Créer un agent
        </button>
      </div>

      <app-data-table
        [columns]="columns()"
        [data]="rows()"
        [isLoading]="facade.isLoading()"
        [hasMore]="facade.hasMore()"
        [totalCount]="facade.totalCount()"
        [emptyMessage]="emptyMessage()"
        (rowClick)="onRowClick($event)"
        (linkClick)="onLinkClick($event)"
        (loadMore)="onLoadMore()"
        (filterChange)="onFilterChange($event)"
        (clearFiltersClick)="clearFilters()"
      />
    </div>
  `,
})
export class AgentListComponent implements OnInit {
  protected readonly PlusIcon = Plus;
  readonly facade = inject(AgentFacade);
  readonly router = inject(Router);
  readonly activeFilters = signal<Record<string, string[]>>({});
  readonly hasLoaded = signal(false);

  readonly emptyMessage = computed(() => {
    if (!this.hasLoaded()) return null;
    return this.hasActiveFilters()
      ? 'Aucun agent ne correspond à vos filtres.'
      : 'Aucun agent trouvé.';
  });

  constructor() {
    effect(() => {
      if (!this.facade.isLoading()) {
        this.hasLoaded.set(true);
      }
    });
  }

  readonly columns = computed<ColumnDef[]>(() => [
    { key: 'displayName', label: 'Nom', sortable: true, bold: true },
    { key: 'email', label: 'E-mail', sortable: true },
    { key: 'agent_type', label: 'Type d\'agent', sortable: true },
    {
      key: 'status',
      label: 'Statut',
      type: 'status-badge',
      width: '120px',
      filterable: true,
      filterKey: 'status',
      filterOptions: [
        { id: 'draft', label: 'Brouillon' },
        { id: 'completed', label: 'Complété' },
        { id: 'deleted', label: 'Supprimé' },
      ],
    },
    {
      key: 'community_name',
      label: 'Communauté',
      sortable: true,
      type: 'link',
      linkRoute: '/communities',
      linkIdKey: 'community_id',
      filterable: true,
      filterKey: 'community_id',
      filterOptions: this.facade.communityOptions(),
    },
    { key: 'last_updated_at', label: 'Mis à jour le', sortable: true, type: 'date', width: '175px' },
  ]);

  private readonly agentTypeLabels: Record<string, string> = {
    energy_performance_advisor: 'Conseiller en performance énergétique',
    other: 'Autre',
  };

  readonly rows = computed(() =>
    this.facade.items().map(agent => ({
      ...agent,
      displayName: [agent.first_name, agent.last_name].filter(Boolean).join(' ') || '—',
      community_name: agent.community?.name ?? '—',
      agent_type: this.agentTypeLabels[agent.agent_type] ?? agent.agent_type,
    })),
  );

  ngOnInit(): void {
    this.facade.loadAssociationData();
    this.facade.load(this.buildFilters());
  }

  onRowClick(row: Record<string, unknown>): void {
    this.router.navigate(['/agents', row['id']]);
  }

  onLinkClick(event: { route: string; id: string }): void {
    navigateToLink(this.router, event);
  }

  onLoadMore(): void {
    this.facade.loadMore();
  }

  onFilterChange(event: { key: string; values: string[] }): void {
    const filters = { ...this.activeFilters() };
    if (event.values.length === 0) {
      delete filters[event.key];
    } else {
      filters[event.key] = event.values;
    }
    this.activeFilters.set(filters);
    this.facade.load(this.buildFilters());
  }

  hasActiveFilters(): boolean {
    return Object.keys(this.activeFilters()).length > 0;
  }

  clearFilters(): void {
    this.activeFilters.set({});
    this.facade.load(this.buildFilters());
  }

  private buildFilters(): Record<string, string[]> {
    const filters: Record<string, string[]> = {};
    const active = this.activeFilters();
    for (const [key, values] of Object.entries(active)) {
      if (values.length > 0) {
        filters[key] = values;
      }
    }
    return filters;
  }
}
