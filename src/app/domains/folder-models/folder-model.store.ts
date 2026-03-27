// Domain store — owns all server state and mutations for folder models.
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
import { FolderModel, FolderModelCreate, FolderModelUpdate, SectionModelCreate, SectionModelUpdate, SectionIndicatorAssociationInput } from './folder-model.models';
import {
  folderModelListLoader,
  loadFolderModel,
  createFolderModelRequest,
  updateFolderModelRequest,
  deleteFolderModelRequest,
  createFolderSectionRequest,
  updateFolderSectionRequest,
  deleteFolderSectionRequest,
  updateFolderSectionIndicatorsRequest,
} from './folder-model.api';

export const FolderModelDomainStore = signalStore(
  { providedIn: 'root' },
  withState({
    selectedItem: null as FolderModel | null,
    isLoadingDetail: false,
    detailError: null as string | null,
  }),
  withProps(() => ({ _http: inject(HttpClient) })),
  // Provides: load, loadMore, refresh, reset + items, cursor, hasMore, isLoading, isEmpty, totalLoaded
  withFeature((store) =>
    withCursorPagination<FolderModel>({
      loader: (params) => folderModelListLoader(store._http, params),
    }),
  ),
  // CRUD mutations — no status workflow for Folder Models.
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
    // Section mutations — concatOp (sequential)
    createSectionMutation: httpMutation({
      request: (params: { folderModelId: string; data: SectionModelCreate }) =>
        createFolderSectionRequest(params),
      operator: concatOp,
    }),
    updateSectionMutation: httpMutation({
      request: (params: { folderModelId: string; sectionId: string; data: SectionModelUpdate }) =>
        updateFolderSectionRequest(params),
      operator: concatOp,
    }),
    deleteSectionMutation: httpMutation({
      request: (params: { folderModelId: string; sectionId: string }) =>
        deleteFolderSectionRequest(params),
      operator: concatOp,
    }),
    updateSectionIndicatorsMutation: httpMutation({
      request: (params: { folderModelId: string; sectionId: string; data: SectionIndicatorAssociationInput[] }) =>
        updateFolderSectionIndicatorsRequest(params),
      operator: concatOp,
    }),
  })),
  withMethods((store) => ({
    selectById: rxMethod<string>(
      pipe(
        tap(() => patch(store, { isLoadingDetail: true })),
        switchMap((id) =>
          loadFolderModel(store._http, id).pipe(
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
