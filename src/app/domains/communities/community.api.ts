// API layer — standalone functions, no inject() calls.
// List/detail return Observables (used by rxMethod). Mutations return config objects (consumed by httpMutation).
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '@app/../environments/environment';
import { PaginatedResponse } from '@app/core/api/paginated-response.model';
import { CommunityRead, CommunityCreate, CommunityUpdate, UserRead } from './community.models';

const BASE_URL = `${environment.apiBaseUrl}/communities/`;

export function communityListLoader(
  http: HttpClient,
  params: { cursor: string | null; limit: number; filters?: Record<string, string> },
): Observable<PaginatedResponse<CommunityRead>> {
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
  return http.get<PaginatedResponse<CommunityRead>>(BASE_URL, { params: httpParams });
}

export function loadCommunity(http: HttpClient, id: string): Observable<CommunityRead> {
  return http.get<CommunityRead>(`${BASE_URL}${id}`);
}

export function createCommunityRequest(data: CommunityCreate) {
  return { url: BASE_URL, method: 'POST', body: data };
}

export function updateCommunityRequest(params: { id: string; data: CommunityUpdate }) {
  return { url: `${BASE_URL}${params.id}`, method: 'PUT', body: params.data };
}

export function deleteCommunityRequest(id: string) {
  return { url: `${BASE_URL}${id}`, method: 'DELETE' };
}

// User assignment endpoints
export function loadAllUsers(http: HttpClient): Observable<UserRead[]> {
  return http.get<UserRead[]>(`${environment.apiBaseUrl}/auth/users`);
}

export function assignUserRequest(params: { communityId: string; userId: string }) {
  return { url: `${BASE_URL}${params.communityId}/users/${params.userId}`, method: 'POST' };
}

export function removeUserRequest(params: { communityId: string; userId: string }) {
  return { url: `${BASE_URL}${params.communityId}/users/${params.userId}`, method: 'DELETE' };
}
