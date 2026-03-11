// API layer — standalone functions, no inject() calls.
// List/detail return Observables (used by rxMethod). Mutations return config objects (consumed by httpMutation).
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '@app/../environments/environment';
import { PaginatedResponse } from '@app/core/api/paginated-response.model';
import { UserRead, UserCreate, UserUpdate } from './user.models';
import { CommunityRead } from '@domains/communities/community.models';

const BASE_URL = `${environment.apiBaseUrl}/users/`;
const REGISTER_URL = `${environment.apiBaseUrl}/auth/register`;
const ROLES_URL = `${environment.apiBaseUrl}/admin/roles/`;

export function userListLoader(
  http: HttpClient,
  params: { cursor: string | null; limit: number; filters?: Record<string, string> },
): Observable<PaginatedResponse<UserRead>> {
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
  return http.get<PaginatedResponse<UserRead>>(BASE_URL, { params: httpParams });
}

export function loadUser(http: HttpClient, id: string): Observable<UserRead> {
  return http.get<UserRead>(`${BASE_URL}${id}`);
}

export function createUserRequest(data: UserCreate) {
  return { url: REGISTER_URL, method: 'POST', body: data };
}

export function updateUserRequest(params: { id: string; data: UserUpdate }) {
  return { url: `${BASE_URL}${params.id}`, method: 'PUT', body: params.data };
}

export function deleteUserRequest(id: string) {
  return { url: `${BASE_URL}${id}`, method: 'DELETE' };
}

export function loadRoles(http: HttpClient): Observable<string[]> {
  return http.get<string[]>(ROLES_URL);
}

export function loadUserRole(http: HttpClient, userId: string): Observable<string> {
  return http.get<string>(`${ROLES_URL}user/${userId}`);
}

// Role update uses query parameter, not body: PUT /admin/roles/user/{user_id}?role={role}
export function updateUserRoleRequest(params: { userId: string; role: string }) {
  return {
    url: `${ROLES_URL}user/${params.userId}?role=${encodeURIComponent(params.role)}`,
    method: 'PUT',
  };
}

// Community assignment — uses the same endpoints as community.api.ts
const COMMUNITIES_URL = `${environment.apiBaseUrl}/communities/`;

export function loadAllCommunities(
  http: HttpClient,
): Observable<PaginatedResponse<CommunityRead>> {
  return http.get<PaginatedResponse<CommunityRead>>(COMMUNITIES_URL, {
    params: new HttpParams().set('limit', '500'),
  });
}

export function assignCommunityRequest(params: { communityId: string; userId: string }) {
  return { url: `${COMMUNITIES_URL}${params.communityId}/users/${params.userId}`, method: 'POST' };
}

export function removeCommunityRequest(params: { communityId: string; userId: string }) {
  return { url: `${COMMUNITIES_URL}${params.communityId}/users/${params.userId}`, method: 'DELETE' };
}
