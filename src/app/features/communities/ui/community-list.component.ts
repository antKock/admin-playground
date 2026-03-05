import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { Router } from '@angular/router';

import { LucideAngularModule, Plus } from 'lucide-angular';
import { DataTableComponent, ColumnDef } from '@app/shared/components/data-table/data-table.component';
import { CommunityFacade } from '../community.facade';

@Component({
  selector: 'app-community-list',
  imports: [DataTableComponent, LucideAngularModule],
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-text-primary">Communities</h1>
        <button
          class="inline-flex items-center gap-1 whitespace-nowrap px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors"
          (click)="router.navigate(['/communities/new'])"
        >
          <lucide-icon [img]="PlusIcon" [size]="16" /> Create Community
        </button>
      </div>

      @if (!facade.isLoading() && hasLoaded() && facade.items().length === 0) {
        <div class="text-center py-16">
          <p class="text-text-secondary mb-4">No communities found.</p>
          <button
            class="inline-flex items-center gap-1 whitespace-nowrap px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors"
            (click)="router.navigate(['/communities/new'])"
          >
            <lucide-icon [img]="PlusIcon" [size]="16" /> Create Community
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
  protected readonly PlusIcon = Plus;
  readonly facade = inject(CommunityFacade);
  readonly router = inject(Router);
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
    { key: 'siret', label: 'SIRET' },
    { key: 'public_comment', label: 'Public Comment' },
    { key: 'created_at', label: 'Created', sortable: true },
    { key: 'updated_at', label: 'Updated', sortable: true },
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
