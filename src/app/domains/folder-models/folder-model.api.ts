// API layer — standalone functions, no inject() calls.
// List/detail return Observables (used by rxMethod). Mutations return config objects (consumed by httpMutation).
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '@app/../environments/environment';
import { PaginatedResponse } from '@app/core/api/paginated-response.model';
import { applyFilters } from '@domains/shared/api.utils';
import { FilterParams } from '@domains/shared/with-cursor-pagination';
import { FolderModel, FolderModelCreate, FolderModelUpdate, SectionModelCreate, SectionModelUpdate, SectionIndicatorAssociationInput } from './folder-model.models';

const BASE_URL = `${environment.apiBaseUrl}/folder-models/`;

export function folderModelListLoader(
  http: HttpClient,
  params: { cursor: string | null; limit: number; filters?: FilterParams },
): Observable<PaginatedResponse<FolderModel>> {
  let httpParams = new HttpParams();
  if (params.cursor) {
    httpParams = httpParams.set('cursor', params.cursor);
  }
  httpParams = httpParams.set('limit', params.limit.toString());
  httpParams = applyFilters(httpParams, params.filters);
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

export function createFolderSectionRequest(params: { folderModelId: string; data: SectionModelCreate }) {
  return { url: `${BASE_URL}${params.folderModelId}/sections`, method: 'POST', body: params.data };
}

export function updateFolderSectionRequest(params: { folderModelId: string; sectionId: string; data: SectionModelUpdate }) {
  return { url: `${BASE_URL}${params.folderModelId}/sections/${params.sectionId}`, method: 'PUT', body: params.data };
}

export function deleteFolderSectionRequest(params: { folderModelId: string; sectionId: string }) {
  return { url: `${BASE_URL}${params.folderModelId}/sections/${params.sectionId}`, method: 'DELETE' };
}

export function updateFolderSectionIndicatorsRequest(params: { folderModelId: string; sectionId: string; data: SectionIndicatorAssociationInput[] }) {
  return { url: `${BASE_URL}${params.folderModelId}/sections/${params.sectionId}/indicators`, method: 'PUT', body: params.data };
}
