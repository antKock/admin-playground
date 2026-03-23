// API layer — standalone functions, no inject() calls.
// List/detail return Observables (used by rxMethod). Mutations return config objects (consumed by httpMutation).
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, expand, reduce, EMPTY } from 'rxjs';

import { environment } from '@app/../environments/environment';
import { PaginatedResponse } from '@app/core/api/paginated-response.model';
import { applyFilters } from '@domains/shared/api.utils';
import { FilterParams } from '@domains/shared/with-cursor-pagination';
import { CommunityRead, CommunityCreate, CommunityUpdate, UserRead } from './community.models';

const BASE_URL = `${environment.apiBaseUrl}/communities/`;

export function communityListLoader(
  http: HttpClient,
  params: { cursor: string | null; limit: number; filters?: FilterParams },
): Observable<PaginatedResponse<CommunityRead>> {
  let httpParams = new HttpParams();
  if (params.cursor) {
    httpParams = httpParams.set('cursor', params.cursor);
  }
  httpParams = httpParams.set('limit', params.limit.toString());
  httpParams = applyFilters(httpParams, params.filters);
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

// User assignment endpoints — fetch all users by paginating through /users/
const USERS_URL = `${environment.apiBaseUrl}/users/`;

export function loadAllUsers(http: HttpClient): Observable<UserRead[]> {
  const fetchPage = (cursor: string | null) => {
    let params = new HttpParams().set('limit', '20');
    if (cursor) params = params.set('cursor', cursor);
    return http.get<PaginatedResponse<UserRead>>(USERS_URL, { params });
  };

  return fetchPage(null).pipe(
    expand(response =>
      response.pagination.has_next_page && response.pagination.cursors.end_cursor
        ? fetchPage(response.pagination.cursors.end_cursor)
        : EMPTY,
    ),
    reduce((acc, response) => [...acc, ...response.data], [] as UserRead[]),
  );
}

export function assignUserRequest(params: { communityId: string; userId: string }) {
  return { url: `${BASE_URL}${params.communityId}/users/${params.userId}`, method: 'POST' };
}

export function removeUserRequest(params: { communityId: string; userId: string }) {
  return { url: `${BASE_URL}${params.communityId}/users/${params.userId}`, method: 'DELETE' };
}

// Hierarchy endpoints — return raw arrays (not paginated)
export function loadCommunityParents(http: HttpClient, communityId: string): Observable<CommunityRead[]> {
  return http.get<CommunityRead[]>(`${BASE_URL}${communityId}/parents`);
}

export function loadCommunityChildren(http: HttpClient, communityId: string): Observable<CommunityRead[]> {
  return http.get<CommunityRead[]>(`${BASE_URL}${communityId}/children`);
}
