// Domain store — owns all server state and mutations for entity models.
// NO pagination — entity models are a fixed set of 3 items (community, agent, site).
// Composition order: withState → withProps → withMutations → withMethods.
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { signalStore, withState, withMethods, withProps } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, EMPTY } from 'rxjs';
import { withMutations } from '@angular-architects/ngrx-toolkit';
import { httpMutation, concatOp, exhaustOp } from '@angular-architects/ngrx-toolkit';

import { patch } from '@domains/shared/store.utils';
import { EntityModel, EntityModelUpdate, EntityModelType, SectionModelCreate, SectionModelUpdate, SectionIndicatorAssociationInput } from './entity-model.models';
import {
  entityModelListLoader,
  loadEntityModel,
  updateEntityModelRequest,
  createEntitySectionRequest,
  updateEntitySectionRequest,
  deleteEntitySectionRequest,
  updateEntitySectionIndicatorsRequest,
} from './entity-model.api';

export const EntityModelDomainStore = signalStore(
  { providedIn: 'root' },
  withState({
    items: [] as EntityModel[],
    selectedItem: null as EntityModel | null,
    isLoading: false,
    isLoadingDetail: false,
    error: null as string | null,
    detailError: null as string | null,
  }),
  withProps(() => ({ _http: inject(HttpClient) })),
  withMutations(() => ({
    updateMutation: httpMutation({
      request: (params: { entityType: EntityModelType; data: EntityModelUpdate }) =>
        updateEntityModelRequest(params),
      operator: exhaustOp,
    }),
    // Section mutations — concatOp (sequential)
    createSectionMutation: httpMutation({
      request: (params: { entityType: EntityModelType; data: SectionModelCreate }) =>
        createEntitySectionRequest(params),
      operator: concatOp,
    }),
    updateSectionMutation: httpMutation({
      request: (params: { entityType: EntityModelType; sectionId: string; data: SectionModelUpdate }) =>
        updateEntitySectionRequest(params),
      operator: concatOp,
    }),
    deleteSectionMutation: httpMutation({
      request: (params: { entityType: EntityModelType; sectionId: string }) =>
        deleteEntitySectionRequest(params),
      operator: concatOp,
    }),
    updateSectionIndicatorsMutation: httpMutation({
      request: (params: { entityType: EntityModelType; sectionId: string; data: SectionIndicatorAssociationInput[] }) =>
        updateEntitySectionIndicatorsRequest(params),
      operator: concatOp,
    }),
  })),
  withMethods((store) => ({
    loadAll: rxMethod<void>(
      pipe(
        tap(() => patch(store, { isLoading: true })),
        switchMap(() =>
          entityModelListLoader(store._http).pipe(
            tap((items) => patch(store, { items, isLoading: false, error: null })),
            catchError((err) => {
              patch(store, { error: err?.message ?? 'Échec du chargement', isLoading: false });
              return EMPTY;
            }),
          ),
        ),
      ),
    ),
    selectByType: rxMethod<EntityModelType>(
      pipe(
        tap(() => patch(store, { isLoadingDetail: true })),
        switchMap((entityType) =>
          loadEntityModel(store._http, entityType).pipe(
            tap((item) => patch(store, { selectedItem: item, isLoadingDetail: false, detailError: null })),
            catchError((err) => {
              patch(store, { detailError: err?.message ?? 'Échec du chargement', isLoadingDetail: false, selectedItem: null });
              return EMPTY;
            }),
          ),
        ),
      ),
    ),
    clearSelection(): void {
      patch(store, { selectedItem: null });
    },
  })),
);
