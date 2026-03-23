import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ApiInspectorService {
  private readonly _lastRequestUrl = signal<string | null>(null);
  private readonly _lastResponseBody = signal<unknown>(null);

  readonly lastRequestUrl = this._lastRequestUrl.asReadonly();
  readonly lastResponseBody = this._lastResponseBody.asReadonly();

  capture(url: string, body: unknown): void {
    this._lastRequestUrl.set(url);
    this._lastResponseBody.set(body);
  }

  clear(): void {
    this._lastRequestUrl.set(null);
    this._lastResponseBody.set(null);
  }
}
