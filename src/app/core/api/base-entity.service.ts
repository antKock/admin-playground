import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, signal } from '@angular/core';
import { Observable, tap, finalize } from 'rxjs';

import { environment } from '@app/../environments/environment';
import { PaginatedResponse } from './paginated-response.model';

export interface LastApiResponse {
  method: string;
  url: string;
  status: number | null;
  body: unknown;
}

export abstract class BaseEntityService<T> {
  protected http = inject(HttpClient);

  private _items = signal<T[]>([]);
  private _selectedItem = signal<T | null>(null);
  private _isLoading = signal(false);
  private _error = signal<string | null>(null);
  private _lastResponse = signal<LastApiResponse | null>(null);

  readonly items = this._items.asReadonly();
  readonly selectedItem = this._selectedItem.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly lastResponse = this._lastResponse.asReadonly();

  protected get baseUrl(): string {
    return `${environment.apiBaseUrl}/${this.apiPath}`;
  }

  constructor(protected apiPath: string) {}

  list(cursor?: string, limit?: number, filters?: Record<string, string>): Observable<PaginatedResponse<T>> {
    let params = new HttpParams();
    if (cursor) {
      params = params.set('cursor', cursor);
    }
    if (limit) {
      params = params.set('limit', limit.toString());
    }
    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (value) {
          params = params.set(key, value);
        }
      }
    }

    const url = this.baseUrl;
    this._isLoading.set(true);
    this._error.set(null);

    return this.http.get<PaginatedResponse<T>>(url, { params }).pipe(
      tap((response) => {
        if (cursor) {
          this._items.update((existing) => [...existing, ...response.data]);
        } else {
          this._items.set(response.data);
        }
        this._lastResponse.set({
          method: 'GET',
          url: `${url}?${params.toString()}`,
          status: 200,
          body: response,
        });
      }),
      finalize(() => this._isLoading.set(false)),
    );
  }

  getById(id: string): Observable<T> {
    const url = `${this.baseUrl}/${id}`;
    this._isLoading.set(true);
    this._error.set(null);

    return this.http.get<T>(url).pipe(
      tap((response) => {
        this._selectedItem.set(response);
        this._lastResponse.set({
          method: 'GET',
          url,
          status: 200,
          body: response,
        });
      }),
      finalize(() => this._isLoading.set(false)),
    );
  }

  create(data: Partial<T>): Observable<T> {
    const url = this.baseUrl;
    this._isLoading.set(true);
    this._error.set(null);

    return this.http.post<T>(url, data).pipe(
      tap((response) => {
        this._items.update((existing) => [...existing, response]);
        this._lastResponse.set({
          method: 'POST',
          url,
          status: 201,
          body: response,
        });
      }),
      finalize(() => this._isLoading.set(false)),
    );
  }

  update(id: string, data: Partial<T>): Observable<T> {
    const url = `${this.baseUrl}/${id}`;
    this._isLoading.set(true);
    this._error.set(null);

    return this.http.put<T>(url, data).pipe(
      tap((response) => {
        this._items.update((existing) => existing.map((item) => (this.getId(item) === id ? response : item)));
        this._selectedItem.set(response);
        this._lastResponse.set({
          method: 'PUT',
          url,
          status: 200,
          body: response,
        });
      }),
      finalize(() => this._isLoading.set(false)),
    );
  }

  delete(id: string): Observable<void> {
    const url = `${this.baseUrl}/${id}`;
    this._isLoading.set(true);
    this._error.set(null);

    return this.http.delete<void>(url).pipe(
      tap(() => {
        this._items.update((existing) => existing.filter((item) => this.getId(item) !== id));
        this._selectedItem.set(null);
        this._lastResponse.set({
          method: 'DELETE',
          url,
          status: 204,
          body: null,
        });
      }),
      finalize(() => this._isLoading.set(false)),
    );
  }

  clearSelection(): void {
    this._selectedItem.set(null);
  }

  protected setSelectedItem(item: T | null): void {
    this._selectedItem.set(item);
  }

  clearError(): void {
    this._error.set(null);
  }

  protected setError(message: string): void {
    this._error.set(message);
  }

  protected abstract getId(item: T): string;
}
