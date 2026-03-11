import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '@app/../environments/environment';
import { PaginatedResponse } from '@app/core/api/paginated-response.model';
import { ActivityResponse, ActivityFilters } from './history.models';

const BASE_URL = `${environment.apiBaseUrl}/history/`;

export function entityActivityLoader(
  http: HttpClient,
  params: {
    entityType: string;
    entityId: string;
    cursor: string | null;
    limit: number;
  },
): Observable<PaginatedResponse<ActivityResponse>> {
  let httpParams = new HttpParams().set('limit', params.limit.toString());
  if (params.cursor) {
    httpParams = httpParams.set('cursor', params.cursor);
  }
  return http.get<PaginatedResponse<ActivityResponse>>(
    `${BASE_URL}${params.entityType}/${params.entityId}/activities`,
    { params: httpParams },
  );
}

export function globalActivityLoader(
  http: HttpClient,
  filters?: ActivityFilters,
): Observable<PaginatedResponse<ActivityResponse>> {
  let httpParams = new HttpParams();
  if (filters?.entity_type) httpParams = httpParams.set('entity_type', filters.entity_type);
  if (filters?.action) httpParams = httpParams.set('action', filters.action);
  if (filters?.since) httpParams = httpParams.set('since', filters.since);
  if (filters?.cursor) httpParams = httpParams.set('cursor', filters.cursor);
  httpParams = httpParams.set('limit', (filters?.limit ?? 20).toString());
  return http.get<PaginatedResponse<ActivityResponse>>(
    `${BASE_URL}activities`,
    { params: httpParams },
  );
}
