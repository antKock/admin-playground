// API layer — standalone functions, no inject() calls.
// List/detail return Observables (used by rxMethod). Mutations return config objects (consumed by httpMutation).
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '@app/../environments/environment';
import { EntityModel, EntityModelUpdate, EntityModelType, SectionModelCreate, SectionModelUpdate, SectionIndicatorAssociationInput } from './entity-model.models';

const BASE_URL = `${environment.apiBaseUrl}/entity-models/`;

export function entityModelListLoader(http: HttpClient): Observable<EntityModel[]> {
  return http.get<EntityModel[]>(BASE_URL);
}

export function loadEntityModel(http: HttpClient, entityType: EntityModelType): Observable<EntityModel> {
  return http.get<EntityModel>(`${BASE_URL}${entityType}`);
}

export function updateEntityModelRequest(params: { entityType: EntityModelType; data: EntityModelUpdate }) {
  return { url: `${BASE_URL}${params.entityType}`, method: 'PUT', body: params.data };
}

// Section mutations
export function createEntitySectionRequest(params: { entityType: EntityModelType; data: SectionModelCreate }) {
  return { url: `${BASE_URL}${params.entityType}/sections`, method: 'POST', body: params.data };
}

export function updateEntitySectionRequest(params: { entityType: EntityModelType; sectionId: string; data: SectionModelUpdate }) {
  return { url: `${BASE_URL}${params.entityType}/sections/${params.sectionId}`, method: 'PUT', body: params.data };
}

export function deleteEntitySectionRequest(params: { entityType: EntityModelType; sectionId: string }) {
  return { url: `${BASE_URL}${params.entityType}/sections/${params.sectionId}`, method: 'DELETE' };
}

export function updateEntitySectionIndicatorsRequest(params: { entityType: EntityModelType; sectionId: string; data: SectionIndicatorAssociationInput[] }) {
  return { url: `${BASE_URL}${params.entityType}/sections/${params.sectionId}/indicators`, method: 'PUT', body: params.data };
}
