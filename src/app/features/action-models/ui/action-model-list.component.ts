import { Component, inject, OnInit, signal, computed, effect } from '@angular/core';
import { Router } from '@angular/router';

import { LucideAngularModule, Plus } from 'lucide-angular';
import { DataTableComponent, ColumnDef } from '@app/shared/components/data-table/data-table.component';
import { navigateToLink } from '@app/shared/utils/navigate-to-link';
import { ActionModelFacade } from '../action-model.facade';

@Component({
  selector: 'app-action-model-list',
  imports: [DataTableComponent, LucideAngularModule],
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-text-primary">Action Models</h1>
        <button
          class="inline-flex items-center gap-1 whitespace-nowrap px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors"
          (click)="router.navigate(['/action-models/new'])"
        >
          <lucide-icon [img]="PlusIcon" [size]="16" /> Create Action Model
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
            <option [value]="fp.id">{{ fp.name }}</option>
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
            <p class="text-text-secondary mb-4">No action models match your filters.</p>
            <button
              class="text-sm text-text-link hover:text-text-link-hover"
              (click)="clearFilters()"
            >
              Clear filters
            </button>
          } @else {
            <p class="text-text-secondary mb-4">No action models found.</p>
            <button
              class="inline-flex items-center gap-1 whitespace-nowrap px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors"
              (click)="router.navigate(['/action-models/new'])"
            >
              <lucide-icon [img]="PlusIcon" [size]="16" /> Create Action Model
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
          (linkClick)="onLinkClick($event)"
          (loadMore)="onLoadMore()"
        />
      }
    </div>
  `,
})
export class ActionModelListComponent implements OnInit {
  protected readonly PlusIcon = Plus;
  readonly facade = inject(ActionModelFacade);
  readonly router = inject(Router);
  readonly fpFilter = signal<string>('');
  // Prevents empty-state flash on first render — stays false until the first load completes.
  readonly hasLoaded = signal(false);

  readonly rows = computed(() =>
    this.facade.items().map((item) => ({
      ...item,
      funding_program_name: item.funding_program?.name ?? '—',
      action_theme_name: item.action_theme?.name ?? '—',
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
    { key: 'name', label: 'Name', sortable: true, type: 'dual-line', secondaryKey: 'technical_label' },
    { key: 'funding_program_name', label: 'Funding Program', sortable: true, type: 'link', linkRoute: '/funding-programs', linkIdKey: 'funding_program_id' },
    { key: 'action_theme_name', label: 'Action Theme', sortable: true, type: 'link', linkRoute: '/action-themes', linkIdKey: 'action_theme_id' },
    { key: 'created_at', label: 'Created', sortable: true },
  ];

  ngOnInit(): void {
    this.facade.loadAssociationData();
    this.facade.load(this.buildFilters());
  }

  onRowClick(row: Record<string, unknown>): void {
    this.router.navigate(['/action-models', row['id']]);
  }

  onLinkClick(event: { route: string; id: string }): void {
    navigateToLink(this.router, event);
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
