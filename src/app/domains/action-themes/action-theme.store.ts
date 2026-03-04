import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { signalStore, withState, withMethods, withProps, withFeature, patchState } from '@ngrx/signals';
import { withMutations } from '@angular-architects/ngrx-toolkit';
import { httpMutation, concatOp, exhaustOp } from '@angular-architects/ngrx-toolkit';

import { withCursorPagination } from '@domains/shared/with-cursor-pagination';
import { ActionTheme, ActionThemeCreate, ActionThemeUpdate } from './action-theme.models';
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
  withMutations(() => ({
    // CRUD mutations — concatOp
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
    // Status mutations — exhaustOp (prevent double-clicks)
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
  withMethods((store) => {
    const http = inject(HttpClient);
    return {
      selectById(id: string): void {
        patchState(store, { isLoadingDetail: true } as never);
        loadActionTheme(http, id).subscribe({
          next: (item) => patchState(store, { selectedItem: item, isLoadingDetail: false } as never),
          error: (err) => patchState(store, { error: err?.message ?? 'Failed to load item', isLoadingDetail: false } as never),
        });
      },
      clearSelection(): void {
        patchState(store, { selectedItem: null } as never);
      },
    };
  }),
);
