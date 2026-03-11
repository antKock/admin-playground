import { Component, inject, OnInit, signal, computed, effect } from '@angular/core';
import { Router } from '@angular/router';

import { LucideAngularModule, Plus } from 'lucide-angular';
import { DataTableComponent, ColumnDef } from '@app/shared/components/data-table/data-table.component';
import { UserFacade } from '../user.facade';

@Component({
  selector: 'app-user-list',
  imports: [DataTableComponent, LucideAngularModule],
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-text-primary">Utilisateurs</h1>
        <button
          class="inline-flex items-center gap-1 whitespace-nowrap px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors"
          (click)="router.navigate(['/users/new'])"
        >
          <lucide-icon [img]="PlusIcon" [size]="16" /> Créer un utilisateur
        </button>
      </div>

      <app-data-table
        [columns]="columns"
        [data]="rows()"
        [isLoading]="facade.isLoading()"
        [hasMore]="facade.hasMore()"
        [totalCount]="facade.totalCount()"
        [emptyMessage]="hasLoaded() ? 'Aucun utilisateur trouvé.' : null"
        (rowClick)="onRowClick($event)"
        (loadMore)="onLoadMore()"
      />
    </div>
  `,
})
export class UserListComponent implements OnInit {
  protected readonly PlusIcon = Plus;
  readonly facade = inject(UserFacade);
  readonly router = inject(Router);
  readonly hasLoaded = signal(false);

  constructor() {
    effect(() => {
      if (!this.facade.isLoading()) {
        this.hasLoaded.set(true);
      }
    });
  }

  readonly rows = computed(() =>
    this.facade.items().map((item) => ({
      ...item,
      display_name: [item.first_name, item.last_name].filter(Boolean).join(' ') || '—',
      is_active_display: item.is_active ? 'actif' : 'inactif',
      community_count: item.communities?.length?.toString() ?? '0',
    })),
  );

  readonly columns: ColumnDef[] = [
    { key: 'display_name', label: 'Nom', sortable: true, bold: true, width: '200px' },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'role', label: 'Rôle', sortable: true, type: 'status-badge', width: '120px' },
    { key: 'is_active_display', label: 'Statut', type: 'status-badge', width: '100px' },
    { key: 'community_count', label: 'Communautés', width: '120px' },
    { key: 'updated_at', label: 'Mis à jour le', sortable: true, type: 'date', width: '175px' },
  ];

  ngOnInit(): void {
    this.facade.load();
  }

  onRowClick(row: Record<string, unknown>): void {
    this.router.navigate(['/users', row['id']]);
  }

  onLoadMore(): void {
    this.facade.loadMore();
  }
}
