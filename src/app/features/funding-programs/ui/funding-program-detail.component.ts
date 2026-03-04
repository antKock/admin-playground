import { Component, inject, OnInit, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { MetadataGridComponent, MetadataField } from '@app/shared/components/metadata-grid/metadata-grid.component';
import { ConfirmDialogService } from '@app/shared/services/confirm-dialog.service';
import { FundingProgramFacade } from '../funding-program.facade';

@Component({
  selector: 'app-funding-program-detail',
  imports: [MetadataGridComponent],
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
      } @else if (program()) {
        <div class="flex items-center justify-between mb-6">
          <div>
            <button
              class="text-sm text-text-secondary hover:text-text-primary mb-2 inline-flex items-center gap-1"
              (click)="router.navigate(['/funding-programs'])"
            >
              &larr; Back to list
            </button>
            <h1 class="text-2xl font-bold text-text-primary">{{ program()!.name }}</h1>
          </div>
          <div class="flex gap-2">
            <button
              class="px-4 py-2 border border-border rounded-lg text-text-primary hover:bg-surface-muted transition-colors"
              (click)="router.navigate(['/funding-programs', program()!.id, 'edit'])"
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
      }
    </div>
  `,
})
export class FundingProgramDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly confirmDialog = inject(ConfirmDialogService);
  readonly facade = inject(FundingProgramFacade);
  readonly router = inject(Router);

  readonly program = this.facade.selectedItem;

  readonly skeletonFields = Array(6).fill(0);

  readonly fields = computed<MetadataField[]>(() => {
    const p = this.program();
    if (!p) return [];
    return [
      { label: 'Name', value: p.name, type: 'text' as const },
      { label: 'Description', value: p.description ?? '—', type: 'text' as const },
      { label: 'Budget', value: p.budget != null ? `${p.budget}` : '—', type: 'text' as const },
      { label: 'Active', value: p.is_active ? 'Yes' : 'No', type: 'text' as const },
      { label: 'Start Date', value: p.start_date ?? '—', type: 'text' as const },
      { label: 'End Date', value: p.end_date ?? '—', type: 'text' as const },
      { label: 'Created', value: p.created_at, type: 'text' as const },
      { label: 'Updated', value: p.updated_at, type: 'text' as const },
    ];
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.facade.select(id);
    }
  }

  async onDelete(): Promise<void> {
    const p = this.program();
    if (!p) return;

    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete Funding Program',
      message: `Are you sure you want to delete '${p.name}'? This action cannot be undone.`,
      confirmLabel: 'Delete',
      confirmVariant: 'danger',
    });

    if (!confirmed) return;

    this.facade.delete(p.id);
  }
}
