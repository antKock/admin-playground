import { Component, inject } from '@angular/core';
import { LucideAngularModule, LucideIconData, CheckCircle, XCircle, Info, X } from 'lucide-angular';

import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast-container',
  imports: [LucideAngularModule],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.css',
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
