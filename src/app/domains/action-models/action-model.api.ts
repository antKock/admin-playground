// API layer — standalone functions, no inject() calls.
// List/detail return Observables (used by rxMethod). Mutations return config objects (consumed by httpMutation).
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '@app/../environments/environment';
import { PaginatedResponse } from '@app/core/api/paginated-response.model';
import { ActionModel, ActionModelCreate, ActionModelUpdate } from './action-model.models';

const BASE_URL = `${environment.apiBaseUrl}/action-models/`;

export function actionModelListLoader(
  http: HttpClient,
  params: { cursor: string | null; limit: number; filters?: Record<string, string> },
): Observable<PaginatedResponse<ActionModel>> {
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
  return http.get<PaginatedResponse<ActionModel>>(BASE_URL, { params: httpParams });
}

export function loadActionModel(http: HttpClient, id: string): Observable<ActionModel> {
  return http.get<ActionModel>(`${BASE_URL}${id}`);
}

export function createActionModelRequest(data: ActionModelCreate) {
  return { url: BASE_URL, method: 'POST', body: data };
}

export function updateActionModelRequest(params: { id: string; data: ActionModelUpdate }) {
  return { url: `${BASE_URL}${params.id}`, method: 'PUT', body: params.data };
}

export function deleteActionModelRequest(id: string) {
  return { url: `${BASE_URL}${id}`, method: 'DELETE' };
}

// Status mutations — exhaustOp
export function publishActionModelRequest(id: string) {
  return { url: `${BASE_URL}${id}/publish`, method: 'PUT', body: {} };
}

export function disableActionModelRequest(id: string) {
  return { url: `${BASE_URL}${id}/disable`, method: 'PUT', body: {} };
}

export function activateActionModelRequest(id: string) {
  return { url: `${BASE_URL}${id}/activate`, method: 'PUT', body: {} };
}
