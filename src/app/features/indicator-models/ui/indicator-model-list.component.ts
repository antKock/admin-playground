import { Component, inject, OnInit, signal, computed, effect } from '@angular/core';
import { Router } from '@angular/router';

import { DataTableComponent, ColumnDef } from '@app/shared/components/data-table/data-table.component';
import { IndicatorModelFacade } from '../indicator-model.facade';

@Component({
  selector: 'app-indicator-model-list',
  imports: [DataTableComponent],
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-text-primary">Indicator Models</h1>
        <button
          class="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors"
          (click)="router.navigate(['/indicator-models/new'])"
        >
          Create Indicator Model
        </button>
      </div>

      @if (!facade.isLoading() && hasLoaded() && facade.items().length === 0) {
        <div class="text-center py-16">
          <p class="text-text-secondary mb-4">No indicator models found.</p>
          <button
            class="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors"
            (click)="router.navigate(['/indicator-models/new'])"
          >
            Create Indicator Model
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
export class IndicatorModelListComponent implements OnInit {
  readonly facade = inject(IndicatorModelFacade);
  readonly router = inject(Router);
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
    { key: 'name', label: 'Name' },
    { key: 'technical_label', label: 'Technical Label' },
    { key: 'type_display', label: 'Type', type: 'status-badge' },
    { key: 'unit', label: 'Unit' },
    { key: 'created_at', label: 'Created', type: 'date' },
  ];

  ngOnInit(): void {
    this.facade.load();
  }

  onRowClick(row: Record<string, unknown>): void {
    this.router.navigate(['/indicator-models', row['id']]);
  }

  onLoadMore(): void {
    this.facade.loadMore();
  }
}
