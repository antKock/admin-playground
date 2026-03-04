// Domain store — owns all server state and mutations for action themes.
// Composition order matters: withState → withProps → withFeature(pagination) → withMutations → withMethods.
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { signalStore, withState, withMethods, withProps, withFeature, patchState, WritableStateSource } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, EMPTY } from 'rxjs';
import { withMutations } from '@angular-architects/ngrx-toolkit';
import { httpMutation, concatOp, exhaustOp } from '@angular-architects/ngrx-toolkit';

import { withCursorPagination } from '@domains/shared/with-cursor-pagination';
import { ActionTheme, ActionThemeCreate, ActionThemeUpdate } from './action-theme.models';

function patch(store: WritableStateSource<object>, state: Record<string, unknown>): void {
  patchState(store, state as never);
}
import {
  actionThemeListLoader,
  loadActionTheme,
  createActionThemeRequest,
  updateActionThemeRequest,
  deleteActionThemeRequest,
  publishActionThemeRequest,
  disableActionThemeRequest,
  activateActionThemeRequest,
  duplicateActionThemeRequest,
} from './action-theme.api';

export const ActionThemeDomainStore = signalStore(
  { providedIn: 'root' },
  withState({
    selectedItem: null as ActionTheme | null,
    isLoadingDetail: false,
  }),
  withProps(() => ({ _http: inject(HttpClient) })),
  withFeature((store) =>
    withCursorPagination<ActionTheme>({
      loader: (params) => actionThemeListLoader(store._http, params),
    }),
  ),
  // httpMutation auto-generates per-mutation status signals (e.g. createMutationIsPending).
  withMutations(() => ({
    // CRUD mutations — concatOp (queues requests sequentially)
    createMutation: httpMutation({
      request: (data: ActionThemeCreate) => createActionThemeRequest(data),
      operator: concatOp,
    }),
    updateMutation: httpMutation({
      request: (params: { id: string; data: ActionThemeUpdate }) =>
        updateActionThemeRequest(params),
      operator: concatOp,
    }),
    deleteMutation: httpMutation({
      request: (id: string) => deleteActionThemeRequest(id),
      operator: concatOp,
    }),
    // Status mutations — exhaustOp (ignores new calls while in-flight, prevents double-clicks)
    publishMutation: httpMutation({
      request: (id: string) => publishActionThemeRequest(id),
      operator: exhaustOp,
    }),
    disableMutation: httpMutation({
      request: (id: string) => disableActionThemeRequest(id),
      operator: exhaustOp,
    }),
    activateMutation: httpMutation({
      request: (id: string) => activateActionThemeRequest(id),
      operator: exhaustOp,
    }),
    // Duplicate mutation
    duplicateMutation: httpMutation({
      request: (id: string) => duplicateActionThemeRequest(id),
      operator: concatOp,
    }),
  })),
  withMethods((store) => ({
    // switchMap in the pipe below auto-cancels the previous HTTP request on rapid re-calls.
    selectById: rxMethod<string>(
      pipe(
        tap(() => patch(store, { isLoadingDetail: true })),
        switchMap((id) =>
          loadActionTheme(store._http, id).pipe(
            tap((item) => patch(store, { selectedItem: item, isLoadingDetail: false })),
            catchError((err) => {
              patch(store, { error: err?.message ?? 'Failed to load item', isLoadingDetail: false });
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
