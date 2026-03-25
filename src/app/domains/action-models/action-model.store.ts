// Domain store — owns all server state and mutations for action models.
// Composition order matters: withState → withProps → withFeature(pagination) → withMutations → withMethods.
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { signalStore, withState, withMethods, withProps, withFeature } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, EMPTY } from 'rxjs';
import { withMutations } from '@angular-architects/ngrx-toolkit';
import { httpMutation, concatOp, exhaustOp } from '@angular-architects/ngrx-toolkit';

import { withCursorPagination } from '@domains/shared/with-cursor-pagination';
import { patch } from '@domains/shared/store.utils';
import { ActionModel, ActionModelCreate, ActionModelUpdate, SectionModelCreate, SectionModelUpdate, SectionIndicatorAssociationInput } from './action-model.models';
import {
  actionModelListLoader,
  loadActionModel,
  createActionModelRequest,
  updateActionModelRequest,
  deleteActionModelRequest,
  publishActionModelRequest,
  disableActionModelRequest,
  activateActionModelRequest,
  createSectionRequest,
  deleteSectionRequest,
  updateSectionRequest,
  updateSectionIndicatorsRequest,
} from './action-model.api';

export const ActionModelDomainStore = signalStore(
  { providedIn: 'root' },
  withState({
    selectedItem: null as ActionModel | null,
    isLoadingDetail: false,
    detailError: null as string | null,
  }),
  withProps(() => ({ _http: inject(HttpClient) })),
  // Provides: load, loadMore, refresh, reset + items, cursor, hasMore, isLoading, isEmpty, totalLoaded
  withFeature((store) =>
    withCursorPagination<ActionModel>({
      loader: (params) => actionModelListLoader(store._http, params),
    }),
  ),
  // httpMutation auto-generates per-mutation status signals (e.g. createMutationIsPending).
  // concatOp queues requests sequentially — safe for CRUD where order matters.
  withMutations(() => ({
    createMutation: httpMutation({
      request: (data: ActionModelCreate) => createActionModelRequest(data),
      operator: concatOp,
    }),
    updateMutation: httpMutation({
      request: (params: { id: string; data: ActionModelUpdate }) =>
        updateActionModelRequest(params),
      operator: concatOp,
    }),
    deleteMutation: httpMutation({
      request: (id: string) => deleteActionModelRequest(id),
      operator: concatOp,
    }),
    // Status mutations — exhaustOp (ignores new calls while in-flight, prevents double-clicks)
    publishMutation: httpMutation({
      request: (id: string) => publishActionModelRequest(id),
      operator: exhaustOp,
    }),
    disableMutation: httpMutation({
      request: (id: string) => disableActionModelRequest(id),
      operator: exhaustOp,
    }),
    activateMutation: httpMutation({
      request: (id: string) => activateActionModelRequest(id),
      operator: exhaustOp,
    }),
    // Section mutations — concatOp (sequential, user might toggle multiple sections)
    createSectionMutation: httpMutation({
      request: (params: { actionModelId: string; data: SectionModelCreate }) =>
        createSectionRequest(params),
      operator: concatOp,
    }),
    deleteSectionMutation: httpMutation({
      request: (params: { actionModelId: string; sectionId: string }) =>
        deleteSectionRequest(params),
      operator: concatOp,
    }),
    updateSectionMutation: httpMutation({
      request: (params: { actionModelId: string; sectionId: string; data: SectionModelUpdate }) =>
        updateSectionRequest(params),
      operator: concatOp,
    }),
    updateSectionIndicatorsMutation: httpMutation({
      request: (params: { actionModelId: string; sectionId: string; data: SectionIndicatorAssociationInput[] }) =>
        updateSectionIndicatorsRequest(params),
      operator: concatOp,
    }),
  })),
  withMethods((store) => ({
    // switchMap in the pipe below auto-cancels the previous HTTP request on rapid re-calls.
    selectById: rxMethod<string>(
      pipe(
        tap(() => patch(store, { isLoadingDetail: true })),
        switchMap((id) =>
          loadActionModel(store._http, id).pipe(
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
