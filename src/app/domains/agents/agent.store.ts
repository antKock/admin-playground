// Domain store — owns all server state and mutations for agents.
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
import { AgentRead, AgentCreate, AgentUpdate, AgentStatus } from './agent.models';
import {
  agentListLoader,
  loadAgent,
  createAgentRequest,
  updateAgentRequest,
  deleteAgentRequest,
  changeAgentStatusRequest,
} from './agent.api';

export const AgentDomainStore = signalStore(
  { providedIn: 'root' },
  withState({
    selectedItem: null as AgentRead | null,
    isLoadingDetail: false,
    detailError: null as string | null,
  }),
  withProps(() => ({ _http: inject(HttpClient) })),
  // Provides: load, loadMore, refresh, reset + items, cursor, hasMore, isLoading, isEmpty, totalLoaded
  withFeature((store) =>
    withCursorPagination<AgentRead>({
      loader: (params) => agentListLoader(store._http, params),
    }),
  ),
  // httpMutation auto-generates per-mutation status signals (e.g. createMutationIsPending).
  // concatOp queues requests sequentially — safe for CRUD where order matters.
  withMutations(() => ({
    createMutation: httpMutation({
      request: (data: AgentCreate) => createAgentRequest(data),
      operator: concatOp,
    }),
    updateMutation: httpMutation({
      request: (params: { id: string; data: AgentUpdate }) =>
        updateAgentRequest(params),
      operator: concatOp,
    }),
    deleteMutation: httpMutation({
      request: (id: string) => deleteAgentRequest(id),
      operator: concatOp,
    }),
    // Status mutation — exhaustOp ignores new calls while in-flight (prevents double-click)
    changeStatusMutation: httpMutation({
      request: (params: { id: string; status: AgentStatus }) => changeAgentStatusRequest(params),
      operator: exhaustOp,
    }),
  })),
  withMethods((store) => ({
    // switchMap in the pipe below auto-cancels the previous HTTP request on rapid re-calls.
    selectById: rxMethod<string>(
      pipe(
        tap(() => patch(store, { isLoadingDetail: true })),
        switchMap((id) =>
          loadAgent(store._http, id).pipe(
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
  })),
);
