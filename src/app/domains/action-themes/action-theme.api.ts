import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '@app/../environments/environment';
import { PaginatedResponse } from '@app/core/api/paginated-response.model';
import { ActionTheme, ActionThemeCreate, ActionThemeUpdate } from './action-theme.models';

const BASE_URL = `${environment.apiBaseUrl}/action-themes/`;

export function actionThemeListLoader(
  http: HttpClient,
  params: { cursor: string | null; limit: number; filters?: Record<string, string> },
): Observable<PaginatedResponse<ActionTheme>> {
  let httpParams = new HttpParams();
  if (params.cursor) {
    httpParams = httpParams.set('cursor', params.cursor);
  }
  httpParams = httpParams.set('limit', params.limit.toString());
  if (params.filters) {
    for (const [key, value] of Object.entries(params.filters)) {
      if (value) {
        httpParams = httpParams.set(key, value);
      }
    }
  }
  return http.get<PaginatedResponse<ActionTheme>>(BASE_URL, { params: httpParams });
}

export function loadActionTheme(http: HttpClient, id: string): Observable<ActionTheme> {
  return http.get<ActionTheme>(`${BASE_URL}${id}`);
}

// CRUD mutations — concatOp
export function createActionThemeRequest(data: ActionThemeCreate) {
  return { url: BASE_URL, method: 'POST', body: data };
}

export function updateActionThemeRequest(params: { id: string; data: ActionThemeUpdate }) {
  return { url: `${BASE_URL}${params.id}`, method: 'PUT', body: params.data };
}

export function deleteActionThemeRequest(id: string) {
  return { url: `${BASE_URL}${id}`, method: 'DELETE' };
}

// Status mutations — exhaustOp
export function publishActionThemeRequest(id: string) {
  return { url: `${BASE_URL}${id}/publish`, method: 'PUT', body: {} };
}

export function disableActionThemeRequest(id: string) {
  return { url: `${BASE_URL}${id}/disable`, method: 'PUT', body: {} };
}

export function activateActionThemeRequest(id: string) {
  return { url: `${BASE_URL}${id}/activate`, method: 'PUT', body: {} };
}

// Duplicate mutation
export function duplicateActionThemeRequest(id: string) {
  return { url: `${BASE_URL}${id}/duplicate`, method: 'POST', body: {} };
}
