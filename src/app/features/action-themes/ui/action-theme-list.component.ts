import { Component, inject, OnInit, signal, computed, effect } from '@angular/core';
import { Router } from '@angular/router';

import { LucideAngularModule, Plus } from 'lucide-angular';
import { DataTableComponent, ColumnDef } from '@app/shared/components/data-table/data-table.component';
import { ActionThemeFacade } from '../action-theme.facade';

@Component({
  selector: 'app-action-theme-list',
  imports: [DataTableComponent, LucideAngularModule],
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-text-primary">Thèmes d'action</h1>
        <button
          class="inline-flex items-center gap-1 whitespace-nowrap px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors"
          (click)="router.navigate(['/action-themes/new'])"
        >
          <lucide-icon [img]="PlusIcon" [size]="16" /> Créer un thème d'action
        </button>
      </div>

      <app-data-table
        [columns]="columns"
        [data]="facade.items()"
        [isLoading]="facade.isLoading()"
        [hasMore]="facade.hasMore()"
        [emptyMessage]="emptyMessage()"
        (rowClick)="onRowClick($event)"
        (loadMore)="onLoadMore()"
        (filterChange)="onFilterChange($event)"
        (clearFiltersClick)="clearFilters()"
      />
    </div>
  `,
})
export class ActionThemeListComponent implements OnInit {
  protected readonly PlusIcon = Plus;
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
    { key: 'name', label: 'Nom', sortable: true, type: 'dual-line', secondaryKey: 'technical_label' },
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
    { key: 'updated_at', label: 'Mis à jour le', sortable: true, type: 'date', width: '150px' },
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
