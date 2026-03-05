import { Component, inject, OnInit, signal, effect } from '@angular/core';
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

      <div class="flex items-center gap-3 mb-4">
        <select
          class="px-3 py-2 border border-border rounded-lg bg-surface-base text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          [class.bg-brand-light]="statusFilter()"
          [value]="statusFilter() || ''"
          (change)="onStatusFilterChange($event)"
        >
          <option value="">Tous les statuts</option>
          <option value="draft">Brouillon</option>
          <option value="published">Publié</option>
          <option value="disabled">Désactivé</option>
        </select>
        @if (statusFilter()) {
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
          @if (statusFilter()) {
            <p class="text-text-secondary mb-4">Aucun thème d'action ne correspond à vos filtres.</p>
            <button
              class="text-sm text-text-link hover:text-text-link-hover"
              (click)="clearFilters()"
            >
              Effacer les filtres
            </button>
          } @else {
            <p class="text-text-secondary mb-4">Aucun thème d'action trouvé.</p>
            <button
              class="inline-flex items-center gap-1 whitespace-nowrap px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors"
              (click)="router.navigate(['/action-themes/new'])"
            >
              <lucide-icon [img]="PlusIcon" [size]="16" /> Créer un thème d'action
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
export class ActionThemeListComponent implements OnInit {
  protected readonly PlusIcon = Plus;
  readonly facade = inject(ActionThemeFacade);
  readonly router = inject(Router);
  readonly statusFilter = signal<string>('');
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
    { key: 'name', label: 'Nom', sortable: true, type: 'dual-line', secondaryKey: 'technical_label' },
    { key: 'status', label: 'Statut', type: 'status-badge' },
    { key: 'created_at', label: 'Créé le', sortable: true },
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

  onStatusFilterChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.statusFilter.set(value);
    this.facade.load(this.buildFilters());
  }

  clearFilters(): void {
    this.statusFilter.set('');
    this.facade.load(this.buildFilters());
  }

  private buildFilters(): Record<string, string> {
    const filters: Record<string, string> = {};
    const status = this.statusFilter();
    if (status) {
      filters['status'] = status;
    }
    return filters;
  }
}
