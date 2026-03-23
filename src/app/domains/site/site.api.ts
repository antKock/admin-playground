// API layer — standalone functions, no inject() calls.
// List/detail return Observables (used by rxMethod). Mutations return config objects (consumed by httpMutation).
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '@app/../environments/environment';
import { PaginatedResponse } from '@app/core/api/paginated-response.model';
import { applyFilters } from '@domains/shared/api.utils';
import { FilterParams } from '@domains/shared/with-cursor-pagination';
import { Site, SiteCreate, SiteUpdate, Building } from './site.models';

const BASE_URL = `${environment.apiBaseUrl}/sites/`;

export function siteListLoader(
  http: HttpClient,
  params: { cursor: string | null; limit: number; filters?: FilterParams },
): Observable<PaginatedResponse<Site>> {
  let httpParams = new HttpParams();
  if (params.cursor) {
    httpParams = httpParams.set('cursor', params.cursor);
  }
  httpParams = httpParams.set('limit', params.limit.toString());
  httpParams = applyFilters(httpParams, params.filters);
  return http.get<PaginatedResponse<Site>>(BASE_URL, { params: httpParams });
}

export function loadSite(http: HttpClient, id: string): Observable<Site> {
  return http.get<Site>(`${BASE_URL}${id}`);
}

export function loadSiteBuildings(
  http: HttpClient,
  siteId: string,
  params: { cursor: string | null; limit: number },
): Observable<PaginatedResponse<Building>> {
  let httpParams = new HttpParams();
  if (params.cursor) {
    httpParams = httpParams.set('cursor', params.cursor);
  }
  httpParams = httpParams.set('limit', params.limit.toString());
  return http.get<PaginatedResponse<Building>>(`${BASE_URL}${siteId}/buildings`, { params: httpParams });
}

// CRUD mutations — concatOp
export function createSiteRequest(data: SiteCreate) {
  return { url: BASE_URL, method: 'POST', body: data };
}

export function updateSiteRequest(params: { id: string; data: SiteUpdate }) {
  return { url: `${BASE_URL}${params.id}`, method: 'PUT', body: params.data };
}

export function deleteSiteRequest(id: string) {
  return { url: `${BASE_URL}${id}`, method: 'DELETE' };
}
