import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { DataTableComponent, ColumnDef } from '@app/shared/components/data-table/data-table.component';
import { CommunityFacade } from '../community.facade';

@Component({
  selector: 'app-community-list',
  imports: [DataTableComponent],
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-text-primary">Communities</h1>
        <button
          class="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors"
          (click)="router.navigate(['/communities/new'])"
        >
          Create Community
        </button>
      </div>

      @if (!facade.isLoading() && facade.items().length === 0) {
        <div class="text-center py-16">
          <p class="text-text-secondary mb-4">No communities found.</p>
          <button
            class="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors"
            (click)="router.navigate(['/communities/new'])"
          >
            Create Community
          </button>
        </div>
      } @else {
        <app-data-table
          [columns]="columns"
          [data]="facade.items()"
          [isLoading]="facade.isLoading()"
          [hasMore]="facade.hasMore()"
          (rowClick)="onRowClick($event)"
          (loadMore)="onLoadMore()"
        />
      }
    </div>
  `,
})
export class CommunityListComponent implements OnInit {
  readonly facade = inject(CommunityFacade);
  readonly router = inject(Router);

  readonly columns: ColumnDef[] = [
    { key: 'name', label: 'Name' },
    { key: 'siret', label: 'SIRET' },
    { key: 'public_comment', label: 'Public Comment' },
    { key: 'created_at', label: 'Created' },
    { key: 'updated_at', label: 'Updated' },
  ];

  ngOnInit(): void {
    this.facade.load();
  }

  onRowClick(row: Record<string, unknown>): void {
    this.router.navigate(['/communities', row['id']]);
  }

  onLoadMore(): void {
    this.facade.loadMore();
  }
}
