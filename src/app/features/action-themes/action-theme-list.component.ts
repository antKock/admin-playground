import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';

import { DataTableComponent, ColumnDef } from '@app/shared/components/data-table/data-table.component';
import { ActionThemeService } from './action-theme.service';

@Component({
  selector: 'app-action-theme-list',
  imports: [DataTableComponent],
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-text-primary">Action Themes</h1>
        <button
          class="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors"
          (click)="router.navigate(['/action-themes/new'])"
        >
          Create Action Theme
        </button>
      </div>

      <div class="flex items-center gap-3 mb-4">
        <select
          class="px-3 py-2 border border-border rounded-lg bg-surface-base text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          [class.bg-brand-light]="statusFilter()"
          [value]="statusFilter() || ''"
          (change)="onStatusFilterChange($event)"
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="disabled">Disabled</option>
        </select>
        @if (statusFilter()) {
          <button
            class="text-sm text-text-link hover:text-text-link-hover"
            (click)="clearFilters()"
          >
            Clear filters
          </button>
        }
      </div>

      @if (!isLoading() && items().length === 0) {
        <div class="text-center py-16">
          @if (statusFilter()) {
            <p class="text-text-secondary mb-4">No action themes match your filters.</p>
            <button
              class="text-sm text-text-link hover:text-text-link-hover"
              (click)="clearFilters()"
            >
              Clear filters
            </button>
          } @else {
            <p class="text-text-secondary mb-4">No action themes found.</p>
            <button
              class="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors"
              (click)="router.navigate(['/action-themes/new'])"
            >
              Create Action Theme
            </button>
          }
        </div>
      } @else {
        <app-data-table
          [columns]="columns"
          [data]="items()"
          [isLoading]="isLoading()"
          [hasMore]="hasMore"
          (rowClick)="onRowClick($event)"
          (loadMore)="onLoadMore()"
        />
      }
    </div>
  `,
})
export class ActionThemeListComponent implements OnInit {
  private readonly service = inject(ActionThemeService);
  readonly router = inject(Router);

  readonly items = this.service.items;
  readonly isLoading = this.service.isLoading;
  readonly statusFilter = signal<string>('');

  hasMore = false;
  private endCursor: string | null = null;

  readonly columns: ColumnDef[] = [
    { key: 'name', label: 'Name' },
    { key: 'technical_label', label: 'Technical Label' },
    { key: 'status', label: 'Status' },
    { key: 'created_at', label: 'Created' },
  ];

  ngOnInit(): void {
    this.loadData();
  }

  onRowClick(row: Record<string, unknown>): void {
    this.router.navigate(['/action-themes', row['id']]);
  }

  onLoadMore(): void {
    if (this.endCursor && this.hasMore) {
      this.loadData(this.endCursor);
    }
  }

  onStatusFilterChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.statusFilter.set(value);
    this.endCursor = null;
    this.hasMore = false;
    this.loadData();
  }

  clearFilters(): void {
    this.statusFilter.set('');
    this.endCursor = null;
    this.hasMore = false;
    this.loadData();
  }

  private loadData(cursor?: string): void {
    const filters: Record<string, string> = {};
    const status = this.statusFilter();
    if (status) {
      filters['status'] = status;
    }

    this.service.list(cursor, undefined, filters).subscribe((response) => {
      this.hasMore = response.pagination.has_next_page;
      this.endCursor = response.pagination.cursors.end_cursor;
    });
  }
}
