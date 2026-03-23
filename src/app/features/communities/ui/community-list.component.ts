import { Component, inject, OnInit, signal, computed, effect } from '@angular/core';
import { Router } from '@angular/router';

import { DataTableComponent, ColumnDef } from '@app/shared/components/data-table/data-table.component';
import { ListPageLayoutComponent } from '@app/shared/components/layouts/list-page-layout.component';
import { CommunityFacade } from '../community.facade';

@Component({
  selector: 'app-community-list',
  imports: [DataTableComponent, ListPageLayoutComponent],
  templateUrl: './community-list.component.html',
})
export class CommunityListComponent implements OnInit {
  readonly facade = inject(CommunityFacade);
  readonly router = inject(Router);
  readonly hasLoaded = signal(false);

  readonly emptyMessage = computed(() => {
    if (!this.hasLoaded()) return null;
    return 'Aucune communauté trouvée.';
  });

  constructor() {
    effect(() => {
      if (!this.facade.isLoading()) {
        this.hasLoaded.set(true);
      }
    });
  }

  readonly columns: ColumnDef[] = [
    { key: 'name', label: 'Nom', sortable: true, bold: true, width: '250px' },
    { key: 'siret', label: 'SIRET', width: '140px' },
    { key: 'public_comment', label: 'Commentaire public' },
    { key: 'last_updated_at', label: 'Mis à jour le', sortable: true, type: 'date', width: '175px' },
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
