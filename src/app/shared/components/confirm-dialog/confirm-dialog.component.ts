import { Component, HostListener, inject, ElementRef, viewChild } from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';

import { ConfirmDialogService } from './confirm-dialog.service';

@Component({
  selector: 'app-confirm-dialog',
  imports: [A11yModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.css',
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
