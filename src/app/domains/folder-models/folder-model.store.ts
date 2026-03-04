// Domain store — owns all server state and mutations for folder models.
// Composition order matters: withState → withProps → withFeature(pagination) → withMutations → withMethods.
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { signalStore, withState, withMethods, withProps, withFeature, patchState, WritableStateSource } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, EMPTY } from 'rxjs';
import { withMutations } from '@angular-architects/ngrx-toolkit';
import { httpMutation, concatOp } from '@angular-architects/ngrx-toolkit';

import { withCursorPagination } from '@domains/shared/with-cursor-pagination';
import { FolderModel, FolderModelCreate, FolderModelUpdate } from './folder-model.models';

function patch(store: WritableStateSource<object>, state: Record<string, unknown>): void {
  patchState(store, state as never);
}
import {
  folderModelListLoader,
  loadFolderModel,
  createFolderModelRequest,
  updateFolderModelRequest,
  deleteFolderModelRequest,
} from './folder-model.api';

export const FolderModelDomainStore = signalStore(
  { providedIn: 'root' },
  withState({
    selectedItem: null as FolderModel | null,
    isLoadingDetail: false,
  }),
  withProps(() => ({ _http: inject(HttpClient) })),
  withFeature((store) =>
    withCursorPagination<FolderModel>({
      loader: (params) => folderModelListLoader(store._http, params),
    }),
  ),
  // CRUD mutations only — no status workflow for Folder Models.
  withMutations(() => ({
    createMutation: httpMutation({
      request: (data: FolderModelCreate) => createFolderModelRequest(data),
      operator: concatOp,
    }),
    updateMutation: httpMutation({
      request: (params: { id: string; data: FolderModelUpdate }) =>
        updateFolderModelRequest(params),
      operator: concatOp,
    }),
    deleteMutation: httpMutation({
      request: (id: string) => deleteFolderModelRequest(id),
      operator: concatOp,
    }),
  })),
  withMethods((store) => ({
    selectById: rxMethod<string>(
      pipe(
        tap(() => patch(store, { isLoadingDetail: true })),
        switchMap((id) =>
          loadFolderModel(store._http, id).pipe(
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
