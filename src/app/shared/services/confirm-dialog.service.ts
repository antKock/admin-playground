import { Injectable, signal } from '@angular/core';

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: 'primary' | 'danger';
}

export interface ConfirmDialogState extends ConfirmDialogOptions {
  resolve: (value: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private _dialog = signal<ConfirmDialogState | null>(null);
  readonly dialog = this._dialog.asReadonly();

  confirm(options: ConfirmDialogOptions): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this._dialog.set({ ...options, resolve });
    });
  }

  close(result: boolean): void {
    const dialog = this._dialog();
    if (dialog) {
      dialog.resolve(result);
      this._dialog.set(null);
    }
  }
}
