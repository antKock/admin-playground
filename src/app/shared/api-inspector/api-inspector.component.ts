import { Component, OnDestroy, inject, signal } from '@angular/core';
import { ApiInspectorService } from './api-inspector.service';

@Component({
  selector: 'app-api-inspector',
  standalone: true,
  templateUrl: './api-inspector.component.html',
})
export class ApiInspectorComponent implements OnDestroy {
  private readonly inspectorService = inject(ApiInspectorService);

  readonly requestUrl = this.inspectorService.lastRequestUrl;
  readonly responseBody = this.inspectorService.lastResponseBody;

  readonly isOpen = signal(false);
  readonly copyLabel = signal('Copier');

  private copyTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnDestroy(): void {
    if (this.copyTimer) {
      clearTimeout(this.copyTimer);
    }
  }

  formattedBody(): string {
    const body = this.responseBody();
    if (body === null || body === undefined) return '';
    return JSON.stringify(body, null, 2);
  }

  async copyResponse(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.formattedBody());
      this.copyLabel.set('Copié !');
    } catch {
      this.copyLabel.set('Échec');
    }
    if (this.copyTimer) clearTimeout(this.copyTimer);
    this.copyTimer = setTimeout(() => this.copyLabel.set('Copier'), 2000);
  }
}
