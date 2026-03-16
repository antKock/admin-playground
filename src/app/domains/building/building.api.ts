// API layer — standalone functions, no inject() calls.
// List/detail return Observables (used by rxMethod). Mutations return config objects (consumed by httpMutation).
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '@app/../environments/environment';
import { PaginatedResponse } from '@app/core/api/paginated-response.model';
import { Building, BuildingCreate, BuildingUpdate } from './building.models';

const BASE_URL = `${environment.apiBaseUrl}/buildings/`;

export function buildingListLoader(
  http: HttpClient,
  params: { cursor: string | null; limit: number; filters?: Record<string, string> },
): Observable<PaginatedResponse<Building>> {
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
  return http.get<PaginatedResponse<Building>>(BASE_URL, { params: httpParams });
}

export function loadBuilding(http: HttpClient, id: string): Observable<Building> {
  return http.get<Building>(`${BASE_URL}${id}`);
}

// CRUD mutations — concatOp
export function createBuildingRequest(data: BuildingCreate) {
  return { url: BASE_URL, method: 'POST', body: data };
}

export function updateBuildingRequest(params: { id: string; data: BuildingUpdate }) {
  return { url: `${BASE_URL}${params.id}`, method: 'PUT', body: params.data };
}

export function deleteBuildingRequest(id: string) {
  return { url: `${BASE_URL}${id}`, method: 'DELETE' };
}

// RNB mutations
export function addRnbRequest(params: { buildingId: string; rnbId: string }) {
  return { url: `${BASE_URL}${params.buildingId}/rnbs?rnb_id=${encodeURIComponent(params.rnbId)}`, method: 'POST', body: {} };
}

export function removeRnbRequest(params: { buildingId: string; rnbId: string }) {
  return { url: `${BASE_URL}${params.buildingId}/rnbs/${encodeURIComponent(params.rnbId)}`, method: 'DELETE' };
}
