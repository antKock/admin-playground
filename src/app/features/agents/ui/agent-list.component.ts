import { Component, inject, OnInit, computed } from '@angular/core';
import { Router } from '@angular/router';

import { DataTableComponent, ColumnDef } from '@app/shared/components/data-table/data-table.component';
import { AgentFacade } from '../agent.facade';

@Component({
  selector: 'app-agent-list',
  imports: [DataTableComponent],
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-text-primary">Agents</h1>
        <button
          class="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors"
          (click)="router.navigate(['/agents/new'])"
        >
          Create Agent
        </button>
      </div>

      @if (!facade.isLoading() && facade.items().length === 0) {
        <div class="text-center py-16">
          <p class="text-text-secondary mb-4">No agents found.</p>
          <button
            class="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors"
            (click)="router.navigate(['/agents/new'])"
          >
            Create Agent
          </button>
        </div>
      } @else {
        <app-data-table
          [columns]="columns"
          [data]="rows()"
          [isLoading]="facade.isLoading()"
          [hasMore]="facade.hasMore()"
          (rowClick)="onRowClick($event)"
          (loadMore)="onLoadMore()"
        />
      }
    </div>
  `,
})
export class AgentListComponent implements OnInit {
  readonly facade = inject(AgentFacade);
  readonly router = inject(Router);

  readonly columns: ColumnDef[] = [
    { key: 'displayName', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'agent_type', label: 'Agent Type' },
    { key: 'status', label: 'Status', type: 'status-badge' },
    { key: 'community_name', label: 'Community' },
    { key: 'created_at', label: 'Created' },
  ];

  private readonly agentTypeLabels: Record<string, string> = {
    energy_performance_advisor: 'Energy Performance Advisor',
    other: 'Other',
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
    this.facade.load();
  }

  onRowClick(row: Record<string, unknown>): void {
    this.router.navigate(['/agents', row['id']]);
  }

  onLoadMore(): void {
    this.facade.loadMore();
  }
}
