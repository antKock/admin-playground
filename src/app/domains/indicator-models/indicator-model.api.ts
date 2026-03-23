// API layer — standalone functions, no inject() calls.
// List/detail return Observables (used by rxMethod). Mutations return config objects (consumed by httpMutation).
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs';

import { environment } from '@app/../environments/environment';
import { PaginatedResponse } from '@app/core/api/paginated-response.model';
import { applyFilters } from '@domains/shared/api.utils';
import { FilterParams } from '@domains/shared/with-cursor-pagination';
import { ActionModel } from '@domains/action-models/action-model.models';
import { IndicatorModel, IndicatorModelCreate, IndicatorModelUpdate } from './indicator-model.models';

const BASE_URL = `${environment.apiBaseUrl}/indicator-models/`;

export function indicatorModelListLoader(
  http: HttpClient,
  params: { cursor: string | null; limit: number; filters?: FilterParams },
): Observable<PaginatedResponse<IndicatorModel>> {
  let httpParams = new HttpParams();
  if (params.cursor) {
    httpParams = httpParams.set('cursor', params.cursor);
  }
  httpParams = httpParams.set('limit', params.limit.toString());
  httpParams = applyFilters(httpParams, params.filters);
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

// Status mutations — exhaustOp
export function publishIndicatorModelRequest(id: string) {
  return { url: `${BASE_URL}${id}/publish`, method: 'PUT', body: {} };
}

export function disableIndicatorModelRequest(id: string) {
  return { url: `${BASE_URL}${id}/disable`, method: 'PUT', body: {} };
}

export function activateIndicatorModelRequest(id: string) {
  return { url: `${BASE_URL}${id}/activate`, method: 'PUT', body: {} };
}

// Cross-domain: load action models that reference a given indicator model.
// Uses server-side filter: GET /action-models/?indicator_model_id={id}
const ACTION_MODELS_URL = `${environment.apiBaseUrl}/action-models/`;

export function loadUsageByIndicatorModel(
  http: HttpClient,
  indicatorModelId: string,
): Observable<{ id: string; name: string }[]> {
  const params = new HttpParams()
    .set('indicator_model_id', indicatorModelId)
    .set('limit', '100');
  return http.get<PaginatedResponse<ActionModel>>(ACTION_MODELS_URL, { params }).pipe(
    map((response) => response.data.map((am) => ({ id: am.id, name: am.name }))),
  );
}
