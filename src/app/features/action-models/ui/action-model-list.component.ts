import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { Router } from '@angular/router';

import { DataTableComponent, ColumnDef } from '@app/shared/components/data-table/data-table.component';
import { ActionModelFacade } from '../action-model.facade';

@Component({
  selector: 'app-action-model-list',
  imports: [DataTableComponent],
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-text-primary">Action Models</h1>
        <button
          class="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors"
          (click)="router.navigate(['/action-models/new'])"
        >
          Create Action Model
        </button>
      </div>

      <div class="flex items-center gap-3 mb-4">
        <select
          class="px-3 py-2 border border-border rounded-lg bg-surface-base text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          [class.bg-brand-light]="fpFilter()"
          [value]="fpFilter() || ''"
          (change)="onFpFilterChange($event)"
        >
          <option value="">All Funding Programs</option>
        </select>
        @if (fpFilter()) {
          <button
            class="text-sm text-text-link hover:text-text-link-hover"
            (click)="clearFilters()"
          >
            Clear filters
          </button>
        }
      </div>

      @if (!facade.isLoading() && facade.items().length === 0) {
        <div class="text-center py-16">
          @if (fpFilter()) {
            <p class="text-text-secondary mb-4">No action models match your filters.</p>
            <button
              class="text-sm text-text-link hover:text-text-link-hover"
              (click)="clearFilters()"
            >
              Clear filters
            </button>
          } @else {
            <p class="text-text-secondary mb-4">No action models found.</p>
            <button
              class="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors"
              (click)="router.navigate(['/action-models/new'])"
            >
              Create Action Model
            </button>
          }
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
export class ActionModelListComponent implements OnInit {
  readonly facade = inject(ActionModelFacade);
  readonly router = inject(Router);
  readonly fpFilter = signal<string>('');

  readonly rows = computed(() =>
    this.facade.items().map((item) => ({
      ...item,
      funding_program_name: item.funding_program?.name ?? '—',
      action_theme_name: item.action_theme?.name ?? '—',
    })),
  );

  readonly columns: ColumnDef[] = [
    { key: 'name', label: 'Name' },
    { key: 'funding_program_name', label: 'Funding Program' },
    { key: 'action_theme_name', label: 'Action Theme' },
    { key: 'created_at', label: 'Created' },
  ];

  ngOnInit(): void {
    this.facade.load(this.buildFilters());
  }

  onRowClick(row: Record<string, unknown>): void {
    this.router.navigate(['/action-models', row['id']]);
  }

  onLoadMore(): void {
    this.facade.loadMore();
  }

  onFpFilterChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.fpFilter.set(value);
    this.facade.load(this.buildFilters());
  }

  clearFilters(): void {
    this.fpFilter.set('');
    this.facade.load(this.buildFilters());
  }

  private buildFilters(): Record<string, string> {
    const filters: Record<string, string> = {};
    const fp = this.fpFilter();
    if (fp) {
      filters['funding_program_id'] = fp;
    }
    return filters;
  }
}
