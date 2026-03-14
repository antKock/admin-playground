import { Component, inject, OnInit, signal, computed, effect } from '@angular/core';
import { Router } from '@angular/router';

import { LucideAngularModule, Plus } from 'lucide-angular';
import { DataTableComponent, ColumnDef } from '@app/shared/components/data-table/data-table.component';
import { SiteFacade } from '../site.facade';

@Component({
  selector: 'app-site-list',
  imports: [DataTableComponent, LucideAngularModule],
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-text-primary">Sites</h1>
        <button
          class="inline-flex items-center gap-1 whitespace-nowrap px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors"
          (click)="router.navigate(['/sites/new'])"
        >
          <lucide-icon [img]="PlusIcon" [size]="16" /> Créer un site
        </button>
      </div>

      <app-data-table
        [columns]="columns"
        [data]="facade.items()"
        [isLoading]="facade.isLoading()"
        [hasMore]="facade.hasMore()"
        [totalCount]="facade.totalCount()"
        [emptyMessage]="emptyMessage()"
        (rowClick)="onRowClick($event)"
        (loadMore)="onLoadMore()"
        (filterChange)="onFilterChange($event)"
        (clearFiltersClick)="clearFilters()"
      />
    </div>
  `,
})
export class SiteListComponent implements OnInit {
  protected readonly PlusIcon = Plus;
  readonly facade = inject(SiteFacade);
  readonly router = inject(Router);
  readonly activeFilters = signal<Record<string, string[]>>({});
  readonly hasLoaded = signal(false);

  constructor() {
    effect(() => {
      if (!this.facade.isLoading()) {
        this.hasLoaded.set(true);
      }
    });
  }

  readonly emptyMessage = computed(() => {
    if (!this.hasLoaded()) return null;
    return this.hasActiveFilters()
      ? 'Aucun site ne correspond à vos filtres.'
      : 'Aucun site trouvé.';
  });

  readonly columns: ColumnDef[] = [
    { key: 'name', label: 'Nom', sortable: true, width: '200px' },
    { key: 'siren', label: 'SIREN', sortable: true, width: '130px' },
    { key: 'usage', label: 'Usage', width: '150px' },
    { key: 'created_at', label: 'Créé le', sortable: true, type: 'date', width: '175px' },
  ];

  ngOnInit(): void {
    this.facade.load(this.buildFilters());
  }

  onRowClick(row: Record<string, unknown>): void {
    this.router.navigate(['/sites', row['id']]);
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

  private buildFilters(): Record<string, string> {
    const filters: Record<string, string> = {};
    const active = this.activeFilters();
    for (const [key, values] of Object.entries(active)) {
      if (values.length > 0) {
        filters[key] = values.join(',');
      }
    }
    return filters;
  }
}
