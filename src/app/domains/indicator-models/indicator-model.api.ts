// API layer — standalone functions, no inject() calls.
// List/detail return Observables (used by rxMethod). Mutations return config objects (consumed by httpMutation).
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, EMPTY } from 'rxjs';

import { map, expand, reduce, catchError } from 'rxjs';

import { environment } from '@app/../environments/environment';
import { PaginatedResponse } from '@app/core/api/paginated-response.model';
import { ActionModel } from '@domains/action-models/action-model.models';
import { IndicatorModel, IndicatorModelCreate, IndicatorModelUpdate } from './indicator-model.models';

const BASE_URL = `${environment.apiBaseUrl}/indicator-models/`;

export function indicatorModelListLoader(
  http: HttpClient,
  params: { cursor: string | null; limit: number; filters?: Record<string, string> },
): Observable<PaginatedResponse<IndicatorModel>> {
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
  return http.get<PaginatedResponse<IndicatorModel>>(BASE_URL, { params: httpParams });
}

export function loadIndicatorModel(http: HttpClient, id: string): Observable<IndicatorModel> {
  return http.get<IndicatorModel>(`${BASE_URL}${id}`);
}

export function createIndicatorModelRequest(data: IndicatorModelCreate) {
  return { url: BASE_URL, method: 'POST', body: data };
}

export function updateIndicatorModelRequest(params: { id: string; data: IndicatorModelUpdate }) {
  return { url: `${BASE_URL}${params.id}`, method: 'PUT', body: params.data };
}

export function deleteIndicatorModelRequest(id: string) {
  return { url: `${BASE_URL}${id}`, method: 'DELETE' };
}

// Cross-domain: load action models that reference a given indicator model.
// Iterates all pages of action models and filters client-side by indicator_models array.
// TODO: Replace with server-side filter endpoint (GET /action-models?indicator_id=X) when available.
const ACTION_MODELS_URL = `${environment.apiBaseUrl}/action-models/`;
const USAGE_PAGE_SIZE = 50;

export function loadUsageByIndicatorModel(
  http: HttpClient,
  indicatorModelId: string,
): Observable<{ id: string; name: string }[]> {
  const fetchPage = (cursor: string | null) => {
    let params = new HttpParams().set('limit', String(USAGE_PAGE_SIZE));
    if (cursor) params = params.set('cursor', cursor);
    return http.get<PaginatedResponse<ActionModel>>(ACTION_MODELS_URL, { params });
  };

  return fetchPage(null).pipe(
    expand((response) =>
      response.pagination.has_next_page
        ? fetchPage(response.pagination.cursors.end_cursor).pipe(
            catchError(() => EMPTY),
          )
        : EMPTY,
    ),
    map((response) =>
      response.data
        .filter((am) =>
          am.indicator_models?.some((im) => im.id === indicatorModelId),
        )
        .map((am) => ({ id: am.id, name: am.name })),
    ),
    reduce((acc, matches) => [...acc, ...matches], [] as { id: string; name: string }[]),
  );
}
