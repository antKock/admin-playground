import { Component, inject, OnInit, signal, computed, effect } from '@angular/core';
import { Router } from '@angular/router';

import { DataTableComponent, ColumnDef } from '@app/shared/components/data-table/data-table.component';
import { ListPageLayoutComponent } from '@app/shared/components/layouts/list-page-layout.component';
import { UserFacade } from '../user.facade';

@Component({
  selector: 'app-user-list',
  imports: [DataTableComponent, ListPageLayoutComponent],
  templateUrl: './user-list.component.html',
})
export class UserListComponent implements OnInit {
  readonly facade = inject(UserFacade);
  readonly router = inject(Router);
  readonly hasLoaded = signal(false);

  readonly emptyMessage = computed(() => {
    if (!this.hasLoaded()) return null;
    return 'Aucun utilisateur trouvé.';
  });

  constructor() {
    effect(() => {
      if (!this.facade.isLoading()) {
        this.hasLoaded.set(true);
      }
    });
  }

  readonly rows = this.facade.formattedRows;

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
