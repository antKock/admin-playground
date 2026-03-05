import { Component, input, signal } from '@angular/core';

@Component({
  selector: 'app-api-inspector',
  standalone: true,
  template: `
    <div class="mt-8 border border-border rounded-lg bg-surface-subtle">
      <button
        class="w-full flex items-center justify-between px-4 py-3 cursor-pointer text-left"
        (click)="isOpen.set(!isOpen())"
      >
        <span class="text-sm font-medium text-text-secondary">API Inspector</span>
        <svg
          class="w-4 h-4 text-text-secondary transition-transform"
          [class.rotate-180]="isOpen()"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      @if (isOpen()) {
        <div class="border-t border-border px-4 py-3 space-y-3">
          @if (requestUrl() === null && responseBody() === null) {
            <p class="text-sm text-text-secondary">No API data captured yet</p>
          } @else {
            @if (requestUrl()) {
              <div>
                <p class="text-xs text-text-secondary mb-1">Request URL</p>
                <p class="font-mono text-sm text-text-primary break-all">{{ requestUrl() }}</p>
              </div>
            }

            @if (responseBody() !== null) {
              <div>
                <div class="flex items-center justify-between mb-1">
                  <p class="text-xs text-text-secondary">Response Body</p>
                  <button
                    class="text-xs px-2 py-1 rounded border border-border text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-colors"
                    (click)="copyResponse()"
                  >
                    {{ copyLabel() }}
                  </button>
                </div>
                <pre class="font-mono text-sm text-text-primary bg-surface-muted rounded p-3 overflow-auto max-h-96"><code>{{ formattedBody() }}</code></pre>
              </div>
            }
          }
        </div>
      }
    </div>
  `,
})
export class ApiInspectorComponent {
  readonly requestUrl = input<string | null>(null);
  readonly responseBody = input<unknown>(null);

  readonly isOpen = signal(false);
  readonly copyLabel = signal('Copy');

  formattedBody(): string {
    const body = this.responseBody();
    if (body === null || body === undefined) return '';
    return JSON.stringify(body, null, 2);
  }

  copyResponse(): void {
    navigator.clipboard.writeText(this.formattedBody());
    this.copyLabel.set('Copied!');
    setTimeout(() => this.copyLabel.set('Copy'), 2000);
  }
}
