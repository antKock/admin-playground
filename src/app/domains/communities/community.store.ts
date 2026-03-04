// Domain store — owns all server state and mutations for communities.
// Composition order matters: withState → withProps → withFeature(pagination) → withMutations → withMethods.
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { signalStore, withState, withMethods, withProps, withFeature, patchState, WritableStateSource } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, EMPTY } from 'rxjs';
import { withMutations } from '@angular-architects/ngrx-toolkit';
import { httpMutation, concatOp } from '@angular-architects/ngrx-toolkit';

import { withCursorPagination } from '@domains/shared/with-cursor-pagination';
import { CommunityRead, CommunityCreate, CommunityUpdate, UserRead } from './community.models';

function patch(store: WritableStateSource<object>, state: Record<string, unknown>): void {
  patchState(store, state as never);
}
import {
  communityListLoader,
  loadCommunity,
  loadAllUsers,
  createCommunityRequest,
  updateCommunityRequest,
  deleteCommunityRequest,
  assignUserRequest,
  removeUserRequest,
} from './community.api';

export const CommunityDomainStore = signalStore(
  { providedIn: 'root' },
  withState({
    selectedItem: null as CommunityRead | null,
    isLoadingDetail: false,
    detailError: null as string | null,
    allUsers: [] as UserRead[],
    isLoadingUsers: false,
  }),
  withProps(() => ({ _http: inject(HttpClient) })),
  withFeature((store) =>
    withCursorPagination<CommunityRead>({
      loader: (params) => communityListLoader(store._http, params),
    }),
  ),
  // httpMutation auto-generates per-mutation status signals (e.g. createMutationIsPending).
  // concatOp queues requests sequentially — safe for CRUD where order matters.
  withMutations(() => ({
    createMutation: httpMutation({
      request: (data: CommunityCreate) => createCommunityRequest(data),
      operator: concatOp,
    }),
    updateMutation: httpMutation({
      request: (params: { id: string; data: CommunityUpdate }) =>
        updateCommunityRequest(params),
      operator: concatOp,
    }),
    deleteMutation: httpMutation({
      request: (id: string) => deleteCommunityRequest(id),
      operator: concatOp,
    }),
    assignUserMutation: httpMutation({
      request: (params: { communityId: string; userId: string }) => assignUserRequest(params),
      operator: concatOp,
    }),
    removeUserMutation: httpMutation({
      request: (params: { communityId: string; userId: string }) => removeUserRequest(params),
      operator: concatOp,
    }),
  })),
  withMethods((store) => ({
    // switchMap in the pipe below auto-cancels the previous HTTP request on rapid re-calls.
    selectById: rxMethod<string>(
      pipe(
        tap(() => patch(store, { isLoadingDetail: true })),
        switchMap((id) =>
          loadCommunity(store._http, id).pipe(
            tap((item) => patch(store, { selectedItem: item, isLoadingDetail: false, detailError: null })),
            catchError((err) => {
              patch(store, { detailError: err?.message ?? 'Failed to load item', isLoadingDetail: false, selectedItem: null });
              return EMPTY;
            }),
          ),
        ),
      ),
    ),
    clearSelection(): void {
      patch(store, { selectedItem: null });
    },
    loadUsers: rxMethod<void>(
      pipe(
        tap(() => patch(store, { isLoadingUsers: true })),
        switchMap(() =>
          loadAllUsers(store._http).pipe(
            tap((users) => patch(store, { allUsers: users, isLoadingUsers: false })),
            catchError(() => {
              patch(store, { isLoadingUsers: false });
              return EMPTY;
            }),
          ),
        ),
      ),
    ),
  })),
);
