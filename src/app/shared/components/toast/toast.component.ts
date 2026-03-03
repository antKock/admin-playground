import { Component, inject } from '@angular/core';
import { LucideAngularModule, LucideIconData, CheckCircle, XCircle, Info, X } from 'lucide-angular';

import { ToastService } from '@app/shared/services/toast.service';

@Component({
  selector: 'app-toast-container',
  imports: [LucideAngularModule],
  template: `
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="toast"
          [class.toast-success]="toast.type === 'success'"
          [class.toast-error]="toast.type === 'error'"
          [class.toast-info]="toast.type === 'info'"
          role="alert"
          aria-live="assertive"
          (click)="toastService.dismiss(toast.id)"
          (keydown.enter)="toastService.dismiss(toast.id)"
          tabindex="0"
        >
          <lucide-icon
            [img]="getIcon(toast.type)"
            [size]="18"
            class="toast-icon"
          ></lucide-icon>
          <span class="toast-message">{{ toast.message }}</span>
          <button class="toast-close" (click)="toastService.dismiss(toast.id)">
            <lucide-icon [img]="X" [size]="14"></lucide-icon>
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    .toast-container {
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-width: 400px;
    }

    .toast {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      cursor: pointer;
      animation: slideIn 0.2s ease-out;
    }

    .toast-success {
      background-color: var(--color-surface-success);
      color: white;
    }

    .toast-error {
      background-color: var(--color-surface-error);
      color: var(--color-text-error);
    }

    .toast-info {
      background-color: var(--color-surface-base);
      color: var(--color-text-primary);
      border: 1px solid var(--color-stroke-standard);
    }

    .toast-message {
      flex: 1;
      font-size: 14px;
    }

    .toast-close {
      background: none;
      border: none;
      cursor: pointer;
      opacity: 0.7;
      padding: 2px;
      color: inherit;
    }

    .toast-close:hover {
      opacity: 1;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `,
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);

  readonly CheckCircle = CheckCircle;
  readonly XCircle = XCircle;
  readonly Info = Info;
  readonly X = X;

  getIcon(type: string): LucideIconData {
    switch (type) {
      case 'success':
        return this.CheckCircle;
      case 'error':
        return this.XCircle;
      default:
        return this.Info;
    }
  }
}
