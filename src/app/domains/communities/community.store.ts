// Domain store — owns all server state and mutations for communities.
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
import { CommunityRead, CommunityCreate, CommunityUpdate, UserRead } from './community.models';
import {
  communityListLoader,
  loadCommunity,
  loadAllUsers,
  loadCommunityParents,
  loadCommunityChildren,
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
    usersError: null as string | null,
    parents: [] as CommunityRead[],
    children: [] as CommunityRead[],
    isLoadingParents: false,
    isLoadingChildren: false,
    parentsError: null as string | null,
    childrenError: null as string | null,
  }),
  withProps(() => ({ _http: inject(HttpClient) })),
  // Provides: load, loadMore, refresh, reset + items, cursor, hasMore, isLoading, isEmpty, totalLoaded
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
    loadUsers: rxMethod<void>(
      pipe(
        tap(() => patch(store, { isLoadingUsers: true, usersError: null })),
        switchMap(() =>
          loadAllUsers(store._http).pipe(
            tap((users) => patch(store, { allUsers: users, isLoadingUsers: false })),
            catchError((err) => {
              patch(store, { isLoadingUsers: false, usersError: err?.message ?? 'Échec du chargement des utilisateurs' });
              return EMPTY;
            }),
          ),
        ),
      ),
    ),
    loadParents: rxMethod<string>(
      pipe(
        tap(() => patch(store, { isLoadingParents: true, parentsError: null })),
        switchMap((id) =>
          loadCommunityParents(store._http, id).pipe(
            tap((parents) => patch(store, { parents, isLoadingParents: false })),
            catchError((err) => {
              patch(store, { isLoadingParents: false, parents: [], parentsError: err?.message ?? 'Échec du chargement des parents' });
              return EMPTY;
            }),
          ),
        ),
      ),
    ),
    loadChildren: rxMethod<string>(
      pipe(
        tap(() => patch(store, { isLoadingChildren: true, childrenError: null })),
        switchMap((id) =>
          loadCommunityChildren(store._http, id).pipe(
            tap((children) => patch(store, { children, isLoadingChildren: false })),
            catchError((err) => {
              patch(store, { isLoadingChildren: false, children: [], childrenError: err?.message ?? 'Échec du chargement des enfants' });
              return EMPTY;
            }),
          ),
        ),
      ),
    ),
    clearHierarchy(): void {
      patch(store, { parents: [], children: [], parentsError: null, childrenError: null });
    },
  })),
);
