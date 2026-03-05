import { Component, inject, OnInit, OnDestroy, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { MetadataGridComponent, MetadataField } from '@app/shared/components/metadata-grid/metadata-grid.component';
import { ApiInspectorComponent } from '@app/shared/components/api-inspector/api-inspector.component';
import { BreadcrumbComponent, BreadcrumbItem } from '@app/shared/components/breadcrumb/breadcrumb.component';
import { ConfirmDialogService } from '@app/shared/services/confirm-dialog.service';
import { ApiInspectorService } from '@app/shared/services/api-inspector.service';
import { formatDateFr } from '@app/shared/utils/format-date';
import { CommunityFacade } from '../community.facade';
import { CommunityUsersComponent } from './community-users.component';

@Component({
  selector: 'app-community-detail',
  imports: [MetadataGridComponent, CommunityUsersComponent, ApiInspectorComponent, BreadcrumbComponent],
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
          <app-breadcrumb [items]="[{ label: 'Communities', route: '/communities' }, { label: 'Error' }]" />
          <p class="text-error mb-4">{{ facade.detailError() }}</p>
        </div>
      } @else if (community()) {
        <app-breadcrumb [items]="breadcrumbs()" />
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-text-primary">{{ community()!.name }}</h1>
            <p class="text-xs text-text-tertiary mt-1">Updated {{ formatDate(community()!.updated_at) }} · ID: {{ community()!.id }}</p>
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

        <app-api-inspector [requestUrl]="inspectorService.lastRequestUrl()" [responseBody]="inspectorService.lastResponseBody()" />
      }
    </div>
  `,
})
export class CommunityDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly confirmDialog = inject(ConfirmDialogService);
  readonly facade = inject(CommunityFacade);
  readonly inspectorService = inject(ApiInspectorService);
  readonly router = inject(Router);

  readonly community = this.facade.selectedItem;

  readonly skeletonFields = Array(6).fill(0);

  readonly breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const c = this.community();
    return [
      { label: 'Communities', route: '/communities' },
      { label: c?.name ?? '...' },
    ];
  });

  readonly fields = computed<MetadataField[]>(() => {
    const c = this.community();
    if (!c) return [];
    return [
      { label: 'Name', value: c.name, type: 'text' as const },
      { label: 'SIRET', value: c.siret, type: 'mono' as const },
      { label: 'Public Comment', value: c.public_comment ?? '—', type: 'text' as const },
      { label: 'Internal Comment', value: c.internal_comment ?? '—', type: 'text' as const },
      { label: 'Created', value: c.created_at, type: 'date' as const },
      { label: 'Updated', value: c.updated_at, type: 'date' as const },
    ];
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.facade.select(id);
      this.facade.loadUsers();
    }
  }

  ngOnDestroy(): void {
    this.facade.clearSelection();
  }

  formatDate(value: string | null | undefined): string {
    return formatDateFr(value);
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

    await this.facade.delete(c.id);
  }
}
