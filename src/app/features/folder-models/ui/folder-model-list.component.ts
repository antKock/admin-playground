import { Component, inject, OnInit, computed, signal, effect } from '@angular/core';
import { Router } from '@angular/router';

import { LucideAngularModule, Plus } from 'lucide-angular';
import { DataTableComponent, ColumnDef } from '@app/shared/components/data-table/data-table.component';
import { FolderModelFacade } from '../folder-model.facade';

@Component({
  selector: 'app-folder-model-list',
  imports: [DataTableComponent, LucideAngularModule],
  templateUrl: './folder-model-list.component.html',
})
export class FolderModelListComponent implements OnInit {
  protected readonly PlusIcon = Plus;
  readonly facade = inject(FolderModelFacade);
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

  readonly columns = computed<ColumnDef[]>(() => [
    { key: 'name', label: 'Nom', sortable: true, bold: true, width: '250px' },
    { key: 'description', label: 'Description' },
    {
      key: 'funding_programs_display',
      label: 'Programmes de financement',
      filterable: true,
      filterKey: 'funding_program_id',
      filterOptions: this.facade.fpOptions().map(fp => ({ id: fp.id, label: fp.label })),
    },
    { key: 'last_updated_at', label: 'Mis à jour le', sortable: true, type: 'date', width: '175px' },
  ]);

  readonly rows = computed(() =>
    this.facade.items().map((item) => ({
      ...item,
      funding_programs_display:
        item.funding_programs?.map((fp) => fp.name).join(', ') || '—',
    })),
  );

  ngOnInit(): void {
    this.facade.loadAssociationData();
    this.facade.load(this.buildFilters());
  }

  onRowClick(row: Record<string, unknown>): void {
    this.router.navigate(['/folder-models', row['id']]);
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
