import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { Router } from '@angular/router';

import { DataTableComponent, ColumnDef } from '@app/shared/components/data-table/data-table.component';
import { FundingProgramFacade } from '../funding-program.facade';

@Component({
  selector: 'app-funding-program-list',
  imports: [DataTableComponent],
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-text-primary">Funding Programs</h1>
        <button
          class="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors"
          (click)="router.navigate(['/funding-programs/new'])"
        >
          Create Funding Program
        </button>
      </div>

      <div class="flex items-center gap-3 mb-4">
        <select
          class="px-3 py-2 border border-border rounded-lg bg-surface-base text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          [class.bg-brand-light]="activeFilter()"
          [value]="activeFilter() || ''"
          (change)="onActiveFilterChange($event)"
        >
          <option value="">All Programs</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        @if (activeFilter()) {
          <button
            class="text-sm text-text-link hover:text-text-link-hover"
            (click)="clearFilters()"
          >
            Clear filters
          </button>
        }
      </div>

      @if (!facade.isLoading() && hasLoaded() && facade.items().length === 0) {
        <div class="text-center py-16">
          @if (activeFilter()) {
            <p class="text-text-secondary mb-4">No funding programs match your filters.</p>
            <button
              class="text-sm text-text-link hover:text-text-link-hover"
              (click)="clearFilters()"
            >
              Clear filters
            </button>
          } @else {
            <p class="text-text-secondary mb-4">No funding programs found.</p>
            <button
              class="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors"
              (click)="router.navigate(['/funding-programs/new'])"
            >
              Create Funding Program
            </button>
          }
        </div>
      } @else {
        <app-data-table
          [columns]="columns"
          [data]="facade.items()"
          [isLoading]="facade.isLoading()"
          [hasMore]="facade.hasMore()"
          (rowClick)="onRowClick($event)"
          (loadMore)="onLoadMore()"
        />
      }
    </div>
  `,
})
export class FundingProgramListComponent implements OnInit {
  readonly facade = inject(FundingProgramFacade);
  readonly router = inject(Router);
  readonly activeFilter = signal<string>('');
  readonly hasLoaded = signal(false);

  constructor() {
    effect(() => {
      if (!this.facade.isLoading()) {
        this.hasLoaded.set(true);
      }
    });
  }

  readonly columns: ColumnDef[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'description', label: 'Description' },
    { key: 'created_at', label: 'Created', sortable: true },
  ];

  ngOnInit(): void {
    this.facade.load(this.buildFilters());
  }

  onRowClick(row: Record<string, unknown>): void {
    this.router.navigate(['/funding-programs', row['id']]);
  }

  onLoadMore(): void {
    this.facade.loadMore();
  }

  onActiveFilterChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.activeFilter.set(value);
    this.facade.load(this.buildFilters());
  }

  clearFilters(): void {
    this.activeFilter.set('');
    this.facade.load(this.buildFilters());
  }

  private buildFilters(): Record<string, string> {
    const filters: Record<string, string> = {};
    const active = this.activeFilter();
    if (active) {
      filters['is_active'] = active;
    }
    return filters;
  }
}
