import { Component, inject, OnInit, signal, computed, effect } from '@angular/core';
import { Router } from '@angular/router';

import { LucideAngularModule, Plus } from 'lucide-angular';
import { DataTableComponent, ColumnDef } from '@app/shared/components/data-table/data-table.component';
import { UserFacade } from '../user.facade';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  cdm: 'CDM',
  collectivite: 'Collectivite',
};

@Component({
  selector: 'app-user-list',
  imports: [DataTableComponent, LucideAngularModule],
  templateUrl: './user-list.component.html',
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
      role_display: ROLE_LABELS[item.role] ?? item.role,
      is_active_display: item.is_active ? 'actif' : 'inactif',
      community_count: item.communities?.length?.toString() ?? '0',
    })),
  );

  readonly columns: ColumnDef[] = [
    { key: 'display_name', label: 'Nom', sortable: true, bold: true, width: '200px' },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'role_display', label: 'Rôle', sortable: true, type: 'status-badge', width: '120px' },
    { key: 'is_active_display', label: 'Statut', type: 'status-badge', width: '100px' },
    { key: 'community_count', label: 'Communautés', width: '120px' },
    { key: 'last_updated_at', label: 'Mis à jour le', sortable: true, type: 'date', width: '175px' },
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
