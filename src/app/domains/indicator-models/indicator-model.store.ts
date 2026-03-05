// Domain store — owns all server state and mutations for indicator models.
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
import { IndicatorModel, IndicatorModelCreate, IndicatorModelUpdate } from './indicator-model.models';
import {
  indicatorModelListLoader,
  loadIndicatorModel,
  createIndicatorModelRequest,
  updateIndicatorModelRequest,
  deleteIndicatorModelRequest,
  loadUsageByIndicatorModel,
} from './indicator-model.api';

export const IndicatorModelDomainStore = signalStore(
  { providedIn: 'root' },
  withState({
    selectedItem: null as IndicatorModel | null,
    isLoadingDetail: false,
    detailError: null as string | null,
    usedInActionModels: [] as { id: string; name: string }[],
    isLoadingUsage: false,
    usageError: null as string | null,
  }),
  withProps(() => ({ _http: inject(HttpClient) })),
  // Provides: load, loadMore, refresh, reset + items, cursor, hasMore, isLoading, isEmpty, totalLoaded
  withFeature((store) =>
    withCursorPagination<IndicatorModel>({
      loader: (params) => indicatorModelListLoader(store._http, params),
    }),
  ),
  // httpMutation auto-generates per-mutation status signals (e.g. createMutationIsPending).
  // concatOp queues requests sequentially — safe for CRUD where order matters.
  withMutations(() => ({
    createMutation: httpMutation({
      request: (data: IndicatorModelCreate) => createIndicatorModelRequest(data),
      operator: concatOp,
    }),
    updateMutation: httpMutation({
      request: (params: { id: string; data: IndicatorModelUpdate }) =>
        updateIndicatorModelRequest(params),
      operator: concatOp,
    }),
    deleteMutation: httpMutation({
      request: (id: string) => deleteIndicatorModelRequest(id),
      operator: concatOp,
    }),
  })),
  withMethods((store) => ({
    // switchMap in the pipe below auto-cancels the previous HTTP request on rapid re-calls.
    selectById: rxMethod<string>(
      pipe(
        tap(() => patch(store, { isLoadingDetail: true })),
        switchMap((id) =>
          loadIndicatorModel(store._http, id).pipe(
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
      patch(store, { selectedItem: null, usedInActionModels: [], isLoadingUsage: false });
    },
    loadUsage: rxMethod<string>(
      pipe(
        tap(() => patch(store, { isLoadingUsage: true, usageError: null })),
        switchMap((indicatorModelId) =>
          loadUsageByIndicatorModel(store._http, indicatorModelId).pipe(
            tap((models) => patch(store, { usedInActionModels: models, isLoadingUsage: false })),
            catchError((err) => {
              patch(store, { isLoadingUsage: false, usageError: err?.message ?? 'Échec du chargement de l\'utilisation' });
              return EMPTY;
            }),
          ),
        ),
      ),
    ),
  })),
);
