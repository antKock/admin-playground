import { Component, inject, OnInit, signal, computed, effect } from '@angular/core';
import { Router } from '@angular/router';

import { LucideAngularModule, Plus } from 'lucide-angular';
import { DataTableComponent, ColumnDef } from '@app/shared/components/data-table/data-table.component';
import { FundingProgramFacade } from '../funding-program.facade';

@Component({
  selector: 'app-funding-program-list',
  imports: [DataTableComponent, LucideAngularModule],
  templateUrl: './funding-program-list.component.html',
})
export class FundingProgramListComponent implements OnInit {
  protected readonly PlusIcon = Plus;
  readonly facade = inject(FundingProgramFacade);
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

  readonly rows = computed(() =>
    this.facade.items().map((item) => ({
      ...item,
      active_display: item.is_active ? 'Actif' : 'Inactif',
    })),
  );

  readonly columns: ColumnDef[] = [
    { key: 'name', label: 'Nom', sortable: true, bold: true, width: '250px' },
    { key: 'description', label: 'Description' },
    {
      key: 'active_display',
      label: 'Statut',
      width: '120px',
      filterable: true,
      filterKey: 'active_only',
      filterOptions: [
        { id: 'true', label: 'Actif' },
      ],
    },
    { key: 'last_updated_at', label: 'Mis à jour le', sortable: true, type: 'date', width: '175px' },
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
