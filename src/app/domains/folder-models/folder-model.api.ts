// API layer — standalone functions, no inject() calls.
// List/detail return Observables (used by rxMethod). Mutations return config objects (consumed by httpMutation).
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '@app/../environments/environment';
import { PaginatedResponse } from '@app/core/api/paginated-response.model';
import { FolderModel, FolderModelCreate, FolderModelUpdate } from './folder-model.models';

const BASE_URL = `${environment.apiBaseUrl}/folder-models/`;

export function folderModelListLoader(
  http: HttpClient,
  params: { cursor: string | null; limit: number; filters?: Record<string, string> },
): Observable<PaginatedResponse<FolderModel>> {
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
  return http.get<PaginatedResponse<FolderModel>>(BASE_URL, { params: httpParams });
}

export function loadFolderModel(http: HttpClient, id: string): Observable<FolderModel> {
  return http.get<FolderModel>(`${BASE_URL}${id}`);
}

export function createFolderModelRequest(data: FolderModelCreate) {
  return { url: BASE_URL, method: 'POST', body: data };
}

export function updateFolderModelRequest(params: { id: string; data: FolderModelUpdate }) {
  return { url: `${BASE_URL}${params.id}`, method: 'PUT', body: params.data };
}

export function deleteFolderModelRequest(id: string) {
  return { url: `${BASE_URL}${id}`, method: 'DELETE' };
}
