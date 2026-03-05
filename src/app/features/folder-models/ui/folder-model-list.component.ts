import { Component, inject, OnInit, computed, signal, effect } from '@angular/core';
import { Router } from '@angular/router';

import { LucideAngularModule, Plus } from 'lucide-angular';
import { DataTableComponent, ColumnDef } from '@app/shared/components/data-table/data-table.component';
import { FolderModelFacade } from '../folder-model.facade';

@Component({
  selector: 'app-folder-model-list',
  imports: [DataTableComponent, LucideAngularModule],
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-text-primary">Folder Models</h1>
        <button
          class="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors"
          (click)="router.navigate(['/folder-models/new'])"
        >
          <lucide-icon [img]="PlusIcon" [size]="16" /> Create Folder Model
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
          @for (fp of facade.fpOptions(); track fp.id) {
            <option [value]="fp.id">{{ fp.label }}</option>
          }
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

      @if (!facade.isLoading() && hasLoaded() && facade.items().length === 0) {
        <div class="text-center py-16">
          @if (fpFilter()) {
            <p class="text-text-secondary mb-4">No folder models match your filters.</p>
            <button
              class="text-sm text-text-link hover:text-text-link-hover"
              (click)="clearFilters()"
            >
              Clear filters
            </button>
          } @else {
            <p class="text-text-secondary mb-4">No folder models found.</p>
            <button
              class="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors"
              (click)="router.navigate(['/folder-models/new'])"
            >
              <lucide-icon [img]="PlusIcon" [size]="16" /> Create Folder Model
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
export class FolderModelListComponent implements OnInit {
  protected readonly PlusIcon = Plus;
  readonly facade = inject(FolderModelFacade);
  readonly router = inject(Router);
  readonly fpFilter = signal<string>('');
  // Prevents empty-state flash on first render — stays false until the first load completes.
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
    { key: 'funding_programs_display', label: 'Funding Programs' },
    { key: 'created_at', label: 'Created', sortable: true },
  ];

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
