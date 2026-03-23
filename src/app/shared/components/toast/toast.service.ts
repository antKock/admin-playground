import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  type: ToastType;
  message: string;
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 0;
  private _toasts = signal<ToastMessage[]>([]);
  readonly toasts = this._toasts.asReadonly();

  success(message: string, duration = 4000): void {
    this.addToast('success', message, duration);
  }

  error(message: string, duration = 6000): void {
    this.addToast('error', message, duration);
  }

  info(message: string, duration = 4000): void {
    this.addToast('info', message, duration);
  }

  dismiss(id: number): void {
    this._toasts.update((toasts) => toasts.filter((t) => t.id !== id));
  }

  private addToast(type: ToastType, message: string, duration: number): void {
    const id = this.nextId++;
    const toast: ToastMessage = { id, type, message, duration };
    this._toasts.update((toasts) => [...toasts, toast]);

    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
  }
}
