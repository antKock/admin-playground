import { Component, inject, OnInit, OnDestroy, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { MetadataGridComponent, MetadataField } from '@app/shared/components/metadata-grid/metadata-grid.component';
import { ConfirmDialogService } from '@app/shared/services/confirm-dialog.service';
import { IndicatorModelFacade } from '../indicator-model.facade';

@Component({
  selector: 'app-indicator-model-detail',
  imports: [MetadataGridComponent, RouterLink],
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
      } @else if (model()) {
        <div class="flex items-center justify-between mb-6">
          <div>
            <button
              class="text-sm text-text-secondary hover:text-text-primary mb-2 inline-flex items-center gap-1"
              (click)="router.navigate(['/indicator-models'])"
            >
              &larr; Back to list
            </button>
            <h1 class="text-2xl font-bold text-text-primary">{{ model()!.name }}</h1>
          </div>
          <div class="flex gap-2">
            <button
              class="px-4 py-2 border border-border rounded-lg text-text-primary hover:bg-surface-muted transition-colors"
              (click)="router.navigate(['/indicator-models', model()!.id, 'edit'])"
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

        <section class="mt-8">
          <h2 class="text-lg font-semibold text-text-primary mb-3">
            Used in {{ facade.usageCount() }} model{{ facade.usageCount() !== 1 ? 's' : '' }}
          </h2>
          @if (facade.isLoadingUsage()) {
            <div class="animate-pulse h-4 bg-surface-muted rounded w-48"></div>
          } @else if (facade.usageCount() === 0) {
            <p class="text-text-secondary text-sm">Not used in any Action Model yet.</p>
          } @else {
            <ul class="space-y-1">
              @for (am of facade.usedInModels(); track am.id) {
                <li>
                  <a [routerLink]="['/action-models', am.id]" class="text-brand hover:underline text-sm">
                    {{ am.name }}
                  </a>
                </li>
              }
            </ul>
          }
        </section>
      } @else if (facade.detailError()) {
        <div class="text-center py-16">
          <button
            class="text-sm text-text-secondary hover:text-text-primary mb-4 inline-flex items-center gap-1"
            (click)="router.navigate(['/indicator-models'])"
          >
            &larr; Back to list
          </button>
          <p class="text-status-invalid font-medium mb-2">Failed to load indicator model</p>
          <p class="text-text-secondary text-sm">{{ facade.detailError() }}</p>
        </div>
      }
    </div>
  `,
})
export class IndicatorModelDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly confirmDialog = inject(ConfirmDialogService);
  readonly facade = inject(IndicatorModelFacade);
  readonly router = inject(Router);

  readonly model = this.facade.selectedItem;

  readonly skeletonFields = Array(7).fill(0);

  readonly fields = computed<MetadataField[]>(() => {
    const m = this.model();
    if (!m) return [];
    return [
      { label: 'Name', value: m.name, type: 'text' as const },
      { label: 'Technical Label', value: m.technical_label, type: 'text' as const },
      { label: 'Description', value: m.description ?? '—', type: 'text' as const },
      { label: 'Type', value: m.type, type: 'text' as const },
      { label: 'Unit', value: m.unit ?? '—', type: 'text' as const },
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

  ngOnDestroy(): void {
    this.facade.clearSelection();
  }

  async onDelete(): Promise<void> {
    const m = this.model();
    if (!m) return;

    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete Indicator Model',
      message: `Are you sure you want to delete '${m.name}'? This action cannot be undone.`,
      confirmLabel: 'Delete',
      confirmVariant: 'danger',
    });

    if (!confirmed) return;

    await this.facade.delete(m.id);
  }
}
