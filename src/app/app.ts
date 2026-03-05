import { Component, inject, afterNextRender } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ToastContainerComponent } from '@app/shared/components/toast/toast.component';
import { ConfirmDialogComponent } from '@app/shared/components/confirm-dialog/confirm-dialog.component';
import { OpenApiBannerComponent } from '@app/shared/components/openapi-banner/openapi-banner.component';
import { OpenApiWatcherService } from '@app/core/services/openapi-watcher.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainerComponent, ConfirmDialogComponent, OpenApiBannerComponent],
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
