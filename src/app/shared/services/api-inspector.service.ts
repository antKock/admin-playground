import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ApiInspectorService {
  readonly lastRequestUrl = signal<string | null>(null);
  readonly lastResponseBody = signal<unknown>(null);

  capture(url: string, body: unknown): void {
    this.lastRequestUrl.set(url);
    this.lastResponseBody.set(body);
  }

  clear(): void {
    this.lastRequestUrl.set(null);
    this.lastResponseBody.set(null);
  }
}
