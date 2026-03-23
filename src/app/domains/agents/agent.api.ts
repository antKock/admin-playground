// API layer — standalone functions, no inject() calls.
// List/detail return Observables (used by rxMethod). Mutations return config objects (consumed by httpMutation).
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '@app/../environments/environment';
import { PaginatedResponse } from '@app/core/api/paginated-response.model';
import { applyFilters } from '@domains/shared/api.utils';
import { FilterParams } from '@domains/shared/with-cursor-pagination';
import { AgentRead, AgentCreate, AgentUpdate, AgentStatus } from './agent.models';

const BASE_URL = `${environment.apiBaseUrl}/agents/`;

export function agentListLoader(
  http: HttpClient,
  params: { cursor: string | null; limit: number; filters?: FilterParams },
): Observable<PaginatedResponse<AgentRead>> {
  let httpParams = new HttpParams();
  if (params.cursor) {
    httpParams = httpParams.set('cursor', params.cursor);
  }
  httpParams = httpParams.set('limit', params.limit.toString());
  httpParams = applyFilters(httpParams, params.filters);
  return http.get<PaginatedResponse<AgentRead>>(BASE_URL, { params: httpParams });
}

export function loadAgent(http: HttpClient, id: string): Observable<AgentRead> {
  return http.get<AgentRead>(`${BASE_URL}${id}`);
}

export function createAgentRequest(data: AgentCreate) {
  return { url: BASE_URL, method: 'POST', body: data };
}

export function updateAgentRequest(params: { id: string; data: AgentUpdate }) {
  return { url: `${BASE_URL}${params.id}`, method: 'PUT', body: params.data };
}

export function deleteAgentRequest(id: string) {
  return { url: `${BASE_URL}${id}`, method: 'DELETE' };
}

// Status mutation — exhaustOp (prevents double-click on transition buttons)
export function changeAgentStatusRequest(params: { id: string; status: AgentStatus }) {
  return { url: `${BASE_URL}${params.id}`, method: 'PUT', body: { status: params.status } };
}
