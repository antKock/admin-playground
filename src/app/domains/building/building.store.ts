// Domain store — owns all server state and mutations for buildings.
// Composition order matters: withState → withProps → withFeature(pagination) → withMutations → withMethods.
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { signalStore, withState, withMethods, withProps, withFeature } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, EMPTY } from 'rxjs';
import { withMutations } from '@angular-architects/ngrx-toolkit';
import { httpMutation, concatOp } from '@angular-architects/ngrx-toolkit';

import { withCursorPagination } from '@domains/shared/with-cursor-pagination';
import { patch } from '@domains/shared/store.utils';
import { Building, BuildingCreate, BuildingUpdate } from './building.models';
import {
  buildingListLoader,
  loadBuilding,
  createBuildingRequest,
  updateBuildingRequest,
  deleteBuildingRequest,
  addRnbRequest,
  removeRnbRequest,
} from './building.api';

export const BuildingDomainStore = signalStore(
  { providedIn: 'root' },
  withState({
    selectedItem: null as Building | null,
    isLoadingDetail: false,
    detailError: null as string | null,
  }),
  withProps(() => ({ _http: inject(HttpClient) })),
  // Provides: load, loadMore, refresh, reset + items, cursor, hasMore, isLoading, isEmpty, totalLoaded
  withFeature((store) =>
    withCursorPagination<Building>({
      loader: (params) => buildingListLoader(store._http, params),
    }),
  ),
  // httpMutation auto-generates per-mutation status signals (e.g. createMutationIsPending).
  withMutations(() => ({
    // CRUD mutations — concatOp (queues requests sequentially)
    createMutation: httpMutation({
      request: (data: BuildingCreate) => createBuildingRequest(data),
      operator: concatOp,
    }),
    updateMutation: httpMutation({
      request: (params: { id: string; data: BuildingUpdate }) =>
        updateBuildingRequest(params),
      operator: concatOp,
    }),
    deleteMutation: httpMutation({
      request: (id: string) => deleteBuildingRequest(id),
      operator: concatOp,
    }),
    // RNB mutations
    addRnbMutation: httpMutation({
      request: (params: { buildingId: string; rnbId: string }) => addRnbRequest(params),
      operator: concatOp,
    }),
    removeRnbMutation: httpMutation({
      request: (params: { buildingId: string; rnbId: string }) => removeRnbRequest(params),
      operator: concatOp,
    }),
  })),
  withMethods((store) => ({
    // switchMap in the pipe below auto-cancels the previous HTTP request on rapid re-calls.
    selectById: rxMethod<string>(
      pipe(
        tap(() => patch(store, { isLoadingDetail: true })),
        switchMap((id) =>
          loadBuilding(store._http, id).pipe(
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
