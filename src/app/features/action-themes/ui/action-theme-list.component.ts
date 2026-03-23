import { Component, inject, OnInit, signal, computed, effect } from '@angular/core';
import { Router } from '@angular/router';

import { DataTableComponent, ColumnDef } from '@app/shared/components/data-table/data-table.component';
import { ListPageLayoutComponent } from '@app/shared/components/layouts/list-page-layout.component';
import { ActionThemeFacade } from '../action-theme.facade';

@Component({
  selector: 'app-action-theme-list',
  imports: [DataTableComponent, ListPageLayoutComponent],
  templateUrl: './action-theme-list.component.html',
})
export class ActionThemeListComponent implements OnInit {
  readonly facade = inject(ActionThemeFacade);
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
      ? 'Aucun thème d\'action ne correspond à vos filtres.'
      : 'Aucun thème d\'action trouvé.';
  });

  readonly columns: ColumnDef[] = [
    { key: 'name', label: 'Nom', sortable: true, type: 'dual-line', secondaryKey: 'technical_label', width: '200px' },
    {
      key: 'status',
      label: 'Statut',
      type: 'status-badge',
      width: '120px',
      filterable: true,
      filterKey: 'status',
      filterOptions: [
        { id: 'draft', label: 'Brouillon' },
        { id: 'published', label: 'Publié' },
        { id: 'disabled', label: 'Désactivé' },
      ],
    },
    { key: 'last_updated_at', label: 'Mis à jour le', sortable: true, type: 'date', width: '175px' },
  ];

  ngOnInit(): void {
    this.facade.load(this.buildFilters());
  }

  onRowClick(row: Record<string, unknown>): void {
    this.router.navigate(['/action-themes', row['id']]);
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
