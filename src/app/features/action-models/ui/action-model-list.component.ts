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
        <h1 class="text-2xl font-bold text-text-primary">Modèles d'action</h1>
        <button
          class="inline-flex items-center gap-1 whitespace-nowrap px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors"
          (click)="router.navigate(['/action-models/new'])"
        >
          <lucide-icon [img]="PlusIcon" [size]="16" /> Créer un modèle d'action
        </button>
      </div>

      @if (!facade.isLoading() && hasLoaded() && facade.items().length === 0) {
        <div class="text-center py-16">
          @if (hasActiveFilters()) {
            <p class="text-text-secondary mb-4">Aucun modèle d'action ne correspond à vos filtres.</p>
            <button
              class="text-sm text-text-link hover:text-text-link-hover"
              (click)="clearFilters()"
            >
              Effacer les filtres
            </button>
          } @else {
            <p class="text-text-secondary mb-4">Aucun modèle d'action trouvé.</p>
            <button
              class="inline-flex items-center gap-1 whitespace-nowrap px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors"
              (click)="router.navigate(['/action-models/new'])"
            >
              <lucide-icon [img]="PlusIcon" [size]="16" /> Créer un modèle d'action
            </button>
          }
        </div>
      } @else {
        <app-data-table
          [columns]="columns()"
          [data]="rows()"
          [isLoading]="facade.isLoading()"
          [hasMore]="facade.hasMore()"
          (rowClick)="onRowClick($event)"
          (linkClick)="onLinkClick($event)"
          (loadMore)="onLoadMore()"
          (filterChange)="onFilterChange($event)"
        />
      }
    </div>
  `,
})
export class ActionModelListComponent implements OnInit {
  protected readonly PlusIcon = Plus;
  readonly facade = inject(ActionModelFacade);
  readonly router = inject(Router);
  readonly activeFilters = signal<Record<string, string[]>>({});
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

  readonly columns = computed<ColumnDef[]>(() => [
    { key: 'name', label: 'Nom', sortable: true, type: 'dual-line', secondaryKey: 'technical_label' },
    {
      key: 'funding_program_name',
      label: 'Programme de financement',
      sortable: true,
      type: 'link',
      linkRoute: '/funding-programs',
      linkIdKey: 'funding_program_id',
      filterable: true,
      filterKey: 'funding_program_id',
      filterOptions: this.facade.fpOptions().map(fp => ({ id: fp.id, label: fp.name })),
    },
    { key: 'action_theme_name', label: 'Thème d\'action', sortable: true, type: 'link', linkRoute: '/action-themes', linkIdKey: 'action_theme_id' },
    { key: 'created_at', label: 'Créé le', sortable: true, type: 'date' },
  ]);

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
