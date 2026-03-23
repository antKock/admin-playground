import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { Router } from '@angular/router';

import { LucideAngularModule, Plus } from 'lucide-angular';
import { DataTableComponent, ColumnDef } from '@app/shared/components/data-table/data-table.component';
import { CommunityFacade } from '../community.facade';

@Component({
  selector: 'app-community-list',
  imports: [DataTableComponent, LucideAngularModule],
  templateUrl: './community-list.component.html',
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
