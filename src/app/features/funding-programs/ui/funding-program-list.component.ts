import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { Router } from '@angular/router';

import { LucideAngularModule, Plus } from 'lucide-angular';
import { DataTableComponent, ColumnDef } from '@app/shared/components/data-table/data-table.component';
import { FundingProgramFacade } from '../funding-program.facade';

@Component({
  selector: 'app-funding-program-list',
  imports: [DataTableComponent, LucideAngularModule],
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-text-primary">Programmes de financement</h1>
        <button
          class="inline-flex items-center gap-1 whitespace-nowrap px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors"
          (click)="router.navigate(['/funding-programs/new'])"
        >
          <lucide-icon [img]="PlusIcon" [size]="16" /> Créer un programme
        </button>
      </div>

      <div class="flex items-center gap-3 mb-4">
        <select
          class="px-3 py-2 border border-border rounded-lg bg-surface-base text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          [class.bg-brand-light]="activeFilter()"
          [value]="activeFilter() || ''"
          (change)="onActiveFilterChange($event)"
        >
          <option value="">Tous les programmes</option>
          <option value="true">Actif</option>
          <option value="false">Inactif</option>
        </select>
        @if (activeFilter()) {
          <button
            class="text-sm text-text-link hover:text-text-link-hover"
            (click)="clearFilters()"
          >
            Effacer les filtres
          </button>
        }
      </div>

      @if (!facade.isLoading() && hasLoaded() && facade.items().length === 0) {
        <div class="text-center py-16">
          @if (activeFilter()) {
            <p class="text-text-secondary mb-4">Aucun programme de financement ne correspond à vos filtres.</p>
            <button
              class="text-sm text-text-link hover:text-text-link-hover"
              (click)="clearFilters()"
            >
              Effacer les filtres
            </button>
          } @else {
            <p class="text-text-secondary mb-4">Aucun programme de financement trouvé.</p>
            <button
              class="inline-flex items-center gap-1 whitespace-nowrap px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors"
              (click)="router.navigate(['/funding-programs/new'])"
            >
              <lucide-icon [img]="PlusIcon" [size]="16" /> Créer un programme
            </button>
          }
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
export class FundingProgramListComponent implements OnInit {
  protected readonly PlusIcon = Plus;
  readonly facade = inject(FundingProgramFacade);
  readonly router = inject(Router);
  readonly activeFilter = signal<string>('');
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
    { key: 'name', label: 'Nom', sortable: true },
    { key: 'description', label: 'Description' },
    { key: 'created_at', label: 'Créé le', sortable: true },
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

  onActiveFilterChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.activeFilter.set(value);
    this.facade.load(this.buildFilters());
  }

  clearFilters(): void {
    this.activeFilter.set('');
    this.facade.load(this.buildFilters());
  }

  private buildFilters(): Record<string, string> {
    const filters: Record<string, string> = {};
    const active = this.activeFilter();
    if (active) {
      filters['is_active'] = active;
    }
    return filters;
  }
}
