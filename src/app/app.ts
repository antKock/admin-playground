import { Component, inject, afterNextRender } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ToastContainerComponent } from '@app/shared/components/toast/toast.component';
import { ConfirmDialogComponent } from '@app/shared/components/confirm-dialog/confirm-dialog.component';
import { OpenApiWatcherService } from '@core/api/openapi-watcher.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainerComponent, ConfirmDialogComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  constructor() {
    const watcher = inject(OpenApiWatcherService);
    afterNextRender(() => {
      watcher.check();
    });
  }
}
