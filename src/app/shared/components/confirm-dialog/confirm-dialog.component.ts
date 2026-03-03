import { Component, HostListener, inject, ElementRef, viewChild } from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';

import { ConfirmDialogService } from '@app/shared/services/confirm-dialog.service';

@Component({
  selector: 'app-confirm-dialog',
  imports: [A11yModule],
  template: `
    @if (dialogService.dialog(); as dialog) {
      <div class="confirm-overlay" (click)="onBackdropClick()" (keydown)="onOverlayKeydown($event)" role="presentation">
        <div
          class="confirm-dialog"
          role="alertdialog"
          aria-modal="true"
          [attr.aria-describedby]="'confirm-dialog-message'"
          cdkTrapFocus
          cdkTrapFocusAutoCapture
          #dialogPanel
          (click)="$event.stopPropagation()"
          (keydown)="$event.stopPropagation()"
        >
          <h2 class="text-lg font-semibold text-text-primary">{{ dialog.title }}</h2>
          <p id="confirm-dialog-message" class="mt-2 text-sm text-text-secondary">{{ dialog.message }}</p>
          <div class="mt-6 flex justify-end gap-3">
            <button
              class="rounded border border-stroke-standard px-4 py-2 text-sm text-text-secondary hover:bg-surface-muted"
              (click)="dialogService.close(false)"
            >
              Cancel
            </button>
            <button
              class="rounded px-4 py-2 text-sm font-medium text-white"
              [class.bg-surface-button-primary]="dialog.confirmVariant !== 'danger'"
              [class.hover:bg-surface-button-hover]="dialog.confirmVariant !== 'danger'"
              [class.bg-text-error]="dialog.confirmVariant === 'danger'"
              (click)="dialogService.close(true)"
            >
              {{ dialog.confirmLabel || 'Confirm' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .confirm-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1100;
    }

    .confirm-dialog {
      background: var(--color-surface-base);
      border-radius: 12px;
      padding: 24px;
      min-width: 400px;
      max-width: 480px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    }
  `,
})
export class ConfirmDialogComponent {
  readonly dialogService = inject(ConfirmDialogService);
  readonly dialogPanel = viewChild<ElementRef>('dialogPanel');

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.dialogService.dialog()) {
      this.dialogService.close(false);
    }
  }

  onBackdropClick(): void {
    this.dialogService.close(false);
  }

  onOverlayKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.onEscape();
    }
  }
}
