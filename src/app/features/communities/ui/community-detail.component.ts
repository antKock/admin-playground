import { Component, inject, OnInit, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { MetadataGridComponent, MetadataField } from '@app/shared/components/metadata-grid/metadata-grid.component';
import { ConfirmDialogService } from '@app/shared/services/confirm-dialog.service';
import { CommunityFacade } from '../community.facade';
import { CommunityUsersComponent } from './community-users.component';

@Component({
  selector: 'app-community-detail',
  imports: [MetadataGridComponent, CommunityUsersComponent],
  template: `
    <div class="p-6">
      @if (facade.isLoadingDetail()) {
        <div class="animate-pulse space-y-4">
          <div class="h-8 bg-surface-muted rounded w-1/3"></div>
          <div class="h-4 bg-surface-muted rounded w-1/4"></div>
          <div class="grid grid-cols-2 gap-4 mt-6">
            @for (i of skeletonFields; track $index) {
              <div class="space-y-2">
                <div class="h-3 bg-surface-muted rounded w-20"></div>
                <div class="h-4 bg-surface-muted rounded w-32"></div>
              </div>
            }
          </div>
        </div>
      } @else if (facade.detailError()) {
        <div class="text-center py-16">
          <p class="text-error mb-4">{{ facade.detailError() }}</p>
          <button
            class="text-sm text-text-link hover:text-text-link-hover"
            (click)="router.navigate(['/communities'])"
          >
            &larr; Back to list
          </button>
        </div>
      } @else if (community()) {
        <div class="flex items-center justify-between mb-6">
          <div>
            <button
              class="text-sm text-text-secondary hover:text-text-primary mb-2 inline-flex items-center gap-1"
              (click)="router.navigate(['/communities'])"
            >
              &larr; Back to list
            </button>
            <h1 class="text-2xl font-bold text-text-primary">{{ community()!.name }}</h1>
          </div>
          <div class="flex gap-2">
            <button
              class="px-4 py-2 border border-border rounded-lg text-text-primary hover:bg-surface-muted transition-colors"
              (click)="router.navigate(['/communities', community()!.id, 'edit'])"
            >
              Edit
            </button>
            <button
              class="px-4 py-2 bg-status-invalid text-white rounded-lg hover:opacity-90 transition-opacity"
              (click)="onDelete()"
            >
              Delete
            </button>
          </div>
        </div>

        <app-metadata-grid [fields]="fields()" />

        <app-community-users />
      }
    </div>
  `,
})
export class CommunityDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly confirmDialog = inject(ConfirmDialogService);
  readonly facade = inject(CommunityFacade);
  readonly router = inject(Router);

  readonly community = this.facade.selectedItem;

  readonly skeletonFields = Array(6).fill(0);

  readonly fields = computed<MetadataField[]>(() => {
    const c = this.community();
    if (!c) return [];
    return [
      { label: 'Name', value: c.name, type: 'text' as const },
      { label: 'SIRET', value: c.siret, type: 'mono' as const },
      { label: 'Public Comment', value: c.public_comment ?? '—', type: 'text' as const },
      { label: 'Internal Comment', value: c.internal_comment ?? '—', type: 'text' as const },
      { label: 'Created', value: c.created_at, type: 'text' as const },
      { label: 'Updated', value: c.updated_at, type: 'text' as const },
    ];
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.facade.select(id);
      this.facade.loadUsers();
    }
  }

  async onDelete(): Promise<void> {
    const c = this.community();
    if (!c) return;

    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete Community?',
      message: `Are you sure you want to delete '${c.name}'? This action cannot be undone.`,
      confirmLabel: 'Delete',
      confirmVariant: 'danger',
    });

    if (!confirmed) return;

    this.facade.delete(c.id);
  }
}
