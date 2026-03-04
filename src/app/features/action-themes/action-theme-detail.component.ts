import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { MetadataGridComponent, MetadataField } from '@app/shared/components/metadata-grid/metadata-grid.component';
import { StatusBadgeComponent } from '@app/shared/components/status-badge/status-badge.component';
import { ToastService } from '@app/shared/services/toast.service';
import { ConfirmDialogService } from '@app/shared/services/confirm-dialog.service';
import { ActionThemeService } from './action-theme.service';

@Component({
  selector: 'app-action-theme-detail',
  imports: [MetadataGridComponent, StatusBadgeComponent],
  template: `
    <div class="p-6">
      @if (isLoading()) {
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
      } @else if (theme()) {
        <div class="flex items-center justify-between mb-6">
          <div>
            <button
              class="text-sm text-text-secondary hover:text-text-primary mb-2 inline-flex items-center gap-1"
              (click)="router.navigate(['/action-themes'])"
            >
              &larr; Back to list
            </button>
            <div class="flex items-center gap-3">
              <h1 class="text-2xl font-bold text-text-primary">{{ theme()!.name }}</h1>
              <app-status-badge [status]="theme()!.status" />
            </div>
          </div>
          <div class="flex gap-2">
            @if (theme()!.status === 'draft') {
              <button
                class="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors disabled:opacity-50"
                (click)="onPublish()"
                [disabled]="actionLoading()"
              >
                {{ actionLoading() ? 'Publishing...' : 'Publish' }}
              </button>
            }
            @if (theme()!.status === 'published') {
              <button
                class="px-4 py-2 border border-border rounded-lg text-text-primary hover:bg-surface-muted transition-colors disabled:opacity-50"
                (click)="onDisable()"
                [disabled]="actionLoading()"
              >
                {{ actionLoading() ? 'Disabling...' : 'Disable' }}
              </button>
            }
            @if (theme()!.status === 'disabled') {
              <button
                class="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors disabled:opacity-50"
                (click)="onActivate()"
                [disabled]="actionLoading()"
              >
                {{ actionLoading() ? 'Activating...' : 'Activate' }}
              </button>
            }
            <button
              class="px-4 py-2 border border-border rounded-lg text-text-primary hover:bg-surface-muted transition-colors disabled:opacity-50"
              (click)="onDuplicate()"
              [disabled]="actionLoading()"
            >
              Duplicate
            </button>
            @if (theme()!.status === 'draft') {
              <button
                class="px-4 py-2 border border-border rounded-lg text-text-primary hover:bg-surface-muted transition-colors"
                (click)="router.navigate(['/action-themes', theme()!.id, 'edit'])"
              >
                Edit
              </button>
            }
            @if (theme()!.status === 'draft' || theme()!.status === 'disabled') {
              <button
                class="px-4 py-2 bg-status-invalid text-white rounded-lg hover:opacity-90 transition-opacity"
                (click)="onDelete()"
              >
                Delete
              </button>
            }
          </div>
        </div>

        <app-metadata-grid [fields]="fields()" />
      }
    </div>
  `,
})
export class ActionThemeDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(ActionThemeService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  readonly router = inject(Router);

  readonly theme = this.service.selectedItem;
  readonly isLoading = this.service.isLoading;
  readonly actionLoading = signal(false);
  readonly skeletonFields = Array(6).fill(0);

  private get themeId(): string {
    return this.route.snapshot.paramMap.get('id')!;
  }

  readonly fields = computed<MetadataField[]>(() => {
    const t = this.theme();
    if (!t) return [];
    return [
      { label: 'Name', value: t.name, type: 'text' as const },
      { label: 'Technical Label', value: t.technical_label, type: 'mono' as const },
      { label: 'Description', value: t.description ?? '—', type: 'text' as const },
      { label: 'Status', value: t.status, type: 'text' as const },
      { label: 'Icon', value: t.icon ?? '—', type: 'text' as const },
      { label: 'Color', value: t.color ?? '—', type: 'text' as const },
      { label: 'Created', value: t.created_at, type: 'text' as const },
      { label: 'Updated', value: t.updated_at, type: 'text' as const },
    ];
  });

  ngOnInit(): void {
    this.service.getById(this.themeId).subscribe();
  }

  onPublish(): void {
    this.actionLoading.set(true);
    this.service.publish(this.themeId).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.toast.success('Action Theme published');
      },
      error: (err: HttpErrorResponse) => {
        this.actionLoading.set(false);
        this.handleError('Cannot publish Action Theme', err);
      },
    });
  }

  onDisable(): void {
    this.actionLoading.set(true);
    this.service.disable(this.themeId).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.toast.success('Action Theme disabled');
      },
      error: (err: HttpErrorResponse) => {
        this.actionLoading.set(false);
        this.handleError('Cannot disable Action Theme', err);
      },
    });
  }

  onActivate(): void {
    this.actionLoading.set(true);
    this.service.activate(this.themeId).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.toast.success('Action Theme activated');
      },
      error: (err: HttpErrorResponse) => {
        this.actionLoading.set(false);
        this.handleError('Cannot activate Action Theme', err);
      },
    });
  }

  onDuplicate(): void {
    this.service.duplicate(this.themeId).subscribe({
      next: (duplicated) => {
        this.toast.success('Action Theme duplicated');
        this.router.navigate(['/action-themes', duplicated.id]);
      },
      error: (err: HttpErrorResponse) => this.handleError('Duplication failed', err),
    });
  }

  async onDelete(): Promise<void> {
    const t = this.theme();
    if (!t) return;

    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete Action Theme',
      message: `Are you sure you want to delete '${t.name}'? This action cannot be undone.`,
      confirmLabel: 'Delete',
      confirmVariant: 'danger',
    });

    if (!confirmed) return;

    this.service.delete(t.id).subscribe({
      next: () => {
        this.toast.success('Action Theme deleted');
        this.router.navigate(['/action-themes']);
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 409) {
          const reason = err.error?.detail || 'linked to action models';
          this.toast.error(`Cannot delete — ${typeof reason === 'string' ? reason : 'linked to other resources'}`);
        } else {
          this.handleError('Cannot delete Action Theme', err);
        }
      },
    });
  }

  private handleError(prefix: string, err: HttpErrorResponse): void {
    const reason = err.error?.detail || err.error?.message || 'An error occurred';
    this.toast.error(`${prefix} — ${typeof reason === 'string' ? reason : 'An error occurred'}`);
  }
}
