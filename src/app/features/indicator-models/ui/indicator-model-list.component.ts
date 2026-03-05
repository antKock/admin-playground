import { Component, inject, OnInit, signal, computed, effect } from '@angular/core';
import { Router } from '@angular/router';

import { LucideAngularModule, Plus } from 'lucide-angular';
import { DataTableComponent, ColumnDef } from '@app/shared/components/data-table/data-table.component';
import { IndicatorModelFacade } from '../indicator-model.facade';

@Component({
  selector: 'app-indicator-model-list',
  imports: [DataTableComponent, LucideAngularModule],
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-text-primary">Indicator Models</h1>
        <button
          class="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors"
          (click)="router.navigate(['/indicator-models/new'])"
        >
          <lucide-icon [img]="PlusIcon" [size]="16" /> Create Indicator Model
        </button>
      </div>

      <div class="flex items-center gap-3 mb-4">
        <select
          class="px-3 py-2 border border-border rounded-lg bg-surface-base text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          [class.bg-brand-light]="typeFilter()"
          [value]="typeFilter() || ''"
          (change)="onTypeFilterChange($event)"
        >
          <option value="">All Types</option>
          <option value="text">Text</option>
          <option value="number">Number</option>
        </select>
        @if (typeFilter()) {
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
          @if (typeFilter()) {
            <p class="text-text-secondary mb-4">No indicator models match your filters.</p>
            <button
              class="text-sm text-text-link hover:text-text-link-hover"
              (click)="clearFilters()"
            >
              Clear filters
            </button>
          } @else {
            <p class="text-text-secondary mb-4">No indicator models found.</p>
            <button
              class="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors"
              (click)="router.navigate(['/indicator-models/new'])"
            >
              <lucide-icon [img]="PlusIcon" [size]="16" /> Create Indicator Model
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
export class IndicatorModelListComponent implements OnInit {
  protected readonly PlusIcon = Plus;
  readonly facade = inject(IndicatorModelFacade);
  readonly router = inject(Router);
  readonly typeFilter = signal<string>('');
  // Prevents empty-state flash on first render — stays false until the first load completes.
  readonly hasLoaded = signal(false);

  readonly rows = computed(() =>
    this.facade.items().map((item) => ({
      ...item,
      type_display: item.type,
    })),
  );

  constructor() {
    effect(() => {
      if (!this.facade.isLoading()) {
        this.hasLoaded.set(true);
      }
    });
  }

  readonly columns: ColumnDef[] = [
    { key: 'name', label: 'Name', sortable: true, type: 'dual-line', secondaryKey: 'technical_label' },
    { key: 'type_display', label: 'Type', type: 'status-badge' },
    { key: 'unit', label: 'Unit', sortable: true },
    { key: 'created_at', label: 'Created', type: 'date', sortable: true },
  ];

  ngOnInit(): void {
    this.facade.load(this.buildFilters());
  }

  onRowClick(row: Record<string, unknown>): void {
    this.router.navigate(['/indicator-models', row['id']]);
  }

  onLoadMore(): void {
    this.facade.loadMore();
  }

  onTypeFilterChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.typeFilter.set(value);
    this.facade.load(this.buildFilters());
  }

  clearFilters(): void {
    this.typeFilter.set('');
    this.facade.load(this.buildFilters());
  }

  private buildFilters(): Record<string, string> {
    const filters: Record<string, string> = {};
    const type = this.typeFilter();
    if (type) {
      filters['type'] = type;
    }
    return filters;
  }
}
