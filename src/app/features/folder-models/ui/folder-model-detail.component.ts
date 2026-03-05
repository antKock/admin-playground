import { Component, inject, OnInit, OnDestroy, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { MetadataGridComponent, MetadataField } from '@app/shared/components/metadata-grid/metadata-grid.component';
import { ApiInspectorComponent } from '@app/shared/components/api-inspector/api-inspector.component';
import { BreadcrumbComponent, BreadcrumbItem } from '@app/shared/components/breadcrumb/breadcrumb.component';
import { ConfirmDialogService } from '@app/shared/services/confirm-dialog.service';
import { ApiInspectorService } from '@app/shared/services/api-inspector.service';
import { formatDateFr } from '@app/shared/utils/format-date';
import { FolderModelFacade } from '../folder-model.facade';

@Component({
  selector: 'app-folder-model-detail',
  imports: [MetadataGridComponent, ApiInspectorComponent, BreadcrumbComponent],
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
          <app-breadcrumb [items]="[{ label: 'Folder Models', route: '/folder-models' }, { label: 'Error' }]" />
          <p class="text-error mb-4">{{ facade.detailError() }}</p>
        </div>
      } @else if (model()) {
        <app-breadcrumb [items]="breadcrumbs()" />
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-text-primary">{{ model()!.name }}</h1>
            <p class="text-xs text-text-tertiary mt-1">Updated {{ formatDate(model()!.updated_at) }} · ID: {{ model()!.id }}</p>
          </div>
          <div class="flex gap-2">
            <button
              class="px-4 py-2 border border-border rounded-lg text-text-primary hover:bg-surface-muted transition-colors"
              (click)="router.navigate(['/folder-models', model()!.id, 'edit'])"
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

        <app-api-inspector [requestUrl]="inspectorService.lastRequestUrl()" [responseBody]="inspectorService.lastResponseBody()" />
      }
    </div>
  `,
})
export class FolderModelDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly confirmDialog = inject(ConfirmDialogService);
  readonly facade = inject(FolderModelFacade);
  readonly inspectorService = inject(ApiInspectorService);
  readonly router = inject(Router);

  readonly model = this.facade.selectedItem;

  readonly skeletonFields = Array(4).fill(0);

  readonly breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const m = this.model();
    return [
      { label: 'Folder Models', route: '/folder-models' },
      { label: m?.name ?? '...' },
    ];
  });

  readonly fields = computed<MetadataField[]>(() => {
    const m = this.model();
    if (!m) return [];
    const fpNames = m.funding_programs?.map(fp => fp.name).join(', ') || 'None';
    return [
      { label: 'Name', value: m.name, type: 'text' as const },
      { label: 'Description', value: m.description ?? '—', type: 'text' as const },
      { label: 'Funding Programs', value: fpNames, type: 'text' as const },
      { label: 'Created', value: m.created_at, type: 'date' as const },
      { label: 'Updated', value: m.updated_at, type: 'date' as const },
    ];
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.facade.select(id);
    }
  }

  // Required: clear stale selection so navigating to a different item doesn't briefly show the old one.
  ngOnDestroy(): void {
    this.facade.clearSelection();
  }

  formatDate(value: string | null | undefined): string {
    return formatDateFr(value);
  }

  async onDelete(): Promise<void> {
    const m = this.model();
    if (!m) return;

    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete Folder Model',
      message: `Are you sure you want to delete '${m.name}'? This action cannot be undone.`,
      confirmLabel: 'Delete',
      confirmVariant: 'danger',
    });

    if (!confirmed) return;

    await this.facade.delete(m.id);
  }
}
