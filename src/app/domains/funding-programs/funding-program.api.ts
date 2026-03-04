// API layer — standalone functions, no inject() calls.
// List/detail return Observables (used by rxMethod). Mutations return config objects (consumed by httpMutation).
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '@app/../environments/environment';
import { PaginatedResponse } from '@app/core/api/paginated-response.model';
import { FundingProgram, FundingProgramCreate, FundingProgramUpdate } from './funding-program.models';

const BASE_URL = `${environment.apiBaseUrl}/funding-programs/`;

export function fundingProgramListLoader(
  http: HttpClient,
  params: { cursor: string | null; limit: number; filters?: Record<string, string> },
): Observable<PaginatedResponse<FundingProgram>> {
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
  return http.get<PaginatedResponse<FundingProgram>>(BASE_URL, { params: httpParams });
}

export function loadFundingProgram(http: HttpClient, id: string): Observable<FundingProgram> {
  return http.get<FundingProgram>(`${BASE_URL}${id}`);
}

export function createFundingProgramRequest(data: FundingProgramCreate) {
  return { url: BASE_URL, method: 'POST', body: data };
}

export function updateFundingProgramRequest(params: { id: string; data: FundingProgramUpdate }) {
  return { url: `${BASE_URL}${params.id}`, method: 'PUT', body: params.data };
}

export function deleteFundingProgramRequest(id: string) {
  return { url: `${BASE_URL}${id}`, method: 'DELETE' };
}
