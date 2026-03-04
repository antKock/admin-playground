import { Component, inject, OnInit, computed, signal, effect } from '@angular/core';
import { Router } from '@angular/router';

import { DataTableComponent, ColumnDef } from '@app/shared/components/data-table/data-table.component';
import { FolderModelFacade } from '../folder-model.facade';

@Component({
  selector: 'app-folder-model-list',
  imports: [DataTableComponent],
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-text-primary">Folder Models</h1>
        <button
          class="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors"
          (click)="router.navigate(['/folder-models/new'])"
        >
          Create Folder Model
        </button>
      </div>

      @if (!facade.isLoading() && hasLoaded() && facade.items().length === 0) {
        <div class="text-center py-16">
          <p class="text-text-secondary mb-4">No folder models found.</p>
          <button
            class="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors"
            (click)="router.navigate(['/folder-models/new'])"
          >
            Create Folder Model
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
export class FolderModelListComponent implements OnInit {
  readonly facade = inject(FolderModelFacade);
  readonly router = inject(Router);
  readonly hasLoaded = signal(false);

  constructor() {
    effect(() => {
      if (!this.facade.isLoading()) {
        this.hasLoaded.set(true);
      }
    });
  }

  readonly columns: ColumnDef[] = [
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'funding_programs_display', label: 'Funding Programs' },
    { key: 'created_at', label: 'Created' },
  ];

  readonly rows = computed(() =>
    this.facade.items().map((item) => ({
      ...item,
      funding_programs_display:
        item.funding_programs?.map((fp) => fp.name).join(', ') || '—',
    })),
  );

  ngOnInit(): void {
    this.facade.load();
  }

  onRowClick(row: Record<string, unknown>): void {
    this.router.navigate(['/folder-models', row['id']]);
  }

  onLoadMore(): void {
    this.facade.loadMore();
  }
}
