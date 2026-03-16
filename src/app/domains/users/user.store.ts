// Domain store — owns all server state and mutations for users.
// Composition order matters: withState → withProps → withFeature(pagination) → withMutations → withMethods.
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { signalStore, withState, withMethods, withProps, withFeature } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, EMPTY, map } from 'rxjs';
import { withMutations } from '@angular-architects/ngrx-toolkit';
import { httpMutation, concatOp } from '@angular-architects/ngrx-toolkit';

import { withCursorPagination } from '@domains/shared/with-cursor-pagination';
import { patch } from '@domains/shared/store.utils';
import { UserRead, UserCreate, UserUpdate } from './user.models';
import { CommunityRead } from '@domains/communities/community.models';
import {
  userListLoader,
  loadUser,
  loadRoles,
  createUserRequest,
  updateUserRequest,
  deleteUserRequest,
  updateUserRoleRequest,
  loadAllCommunities,
  assignCommunityRequest,
  removeCommunityRequest,
} from './user.api';

export const UserDomainStore = signalStore(
  { providedIn: 'root' },
  withState({
    selectedItem: null as UserRead | null,
    isLoadingDetail: false,
    detailError: null as string | null,
    roles: [] as string[],
    isLoadingRoles: false,
    allCommunities: [] as CommunityRead[],
    isLoadingCommunities: false,
    communitiesError: null as string | null,
  }),
  withProps(() => ({ _http: inject(HttpClient) })),
  withFeature((store) =>
    withCursorPagination<UserRead>({
      loader: (params) => userListLoader(store._http, params),
    }),
  ),
  withMutations(() => ({
    createMutation: httpMutation({
      request: (data: UserCreate) => createUserRequest(data),
      operator: concatOp,
    }),
    updateMutation: httpMutation({
      request: (params: { id: string; data: UserUpdate }) => updateUserRequest(params),
      operator: concatOp,
    }),
    deleteMutation: httpMutation({
      request: (id: string) => deleteUserRequest(id),
      operator: concatOp,
    }),
    updateRoleMutation: httpMutation({
      request: (params: { userId: string; role: string }) => updateUserRoleRequest(params),
      operator: concatOp,
    }),
    assignCommunityMutation: httpMutation({
      request: (params: { communityId: string; userId: string }) => assignCommunityRequest(params),
      operator: concatOp,
    }),
    removeCommunityMutation: httpMutation({
      request: (params: { communityId: string; userId: string }) => removeCommunityRequest(params),
      operator: concatOp,
    }),
  })),
  withMethods((store) => ({
    selectById: rxMethod<string>(
      pipe(
        tap(() => patch(store, { isLoadingDetail: true })),
        switchMap((id) =>
          loadUser(store._http, id).pipe(
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
    loadRoles: rxMethod<void>(
      pipe(
        tap(() => patch(store, { isLoadingRoles: true })),
        switchMap(() =>
          loadRoles(store._http).pipe(
            tap((roles) => patch(store, { roles, isLoadingRoles: false })),
            catchError(() => {
              patch(store, { isLoadingRoles: false });
              return EMPTY;
            }),
          ),
        ),
      ),
    ),
    loadCommunities: rxMethod<void>(
      pipe(
        tap(() => patch(store, { isLoadingCommunities: true, communitiesError: null })),
        switchMap(() =>
          loadAllCommunities(store._http).pipe(
            map((response) => response.data),
            tap((communities) => patch(store, { allCommunities: communities, isLoadingCommunities: false })),
            catchError((err) => {
              patch(store, { isLoadingCommunities: false, communitiesError: err?.message ?? 'Échec du chargement des communautés' });
              return EMPTY;
            }),
          ),
        ),
      ),
    ),
  })),
);
