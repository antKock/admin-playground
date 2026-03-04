// Domain store — owns all server state and mutations for funding programs.
// Composition order matters: withState → withProps → withFeature(pagination) → withMutations → withMethods.
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { signalStore, withState, withMethods, withProps, withFeature, patchState, WritableStateSource } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, EMPTY } from 'rxjs';
import { withMutations } from '@angular-architects/ngrx-toolkit';
import { httpMutation, concatOp } from '@angular-architects/ngrx-toolkit';

import { withCursorPagination } from '@domains/shared/with-cursor-pagination';
import { FundingProgram, FundingProgramCreate, FundingProgramUpdate } from './funding-program.models';

function patch(store: WritableStateSource<object>, state: Record<string, unknown>): void {
  patchState(store, state as never);
}
import {
  fundingProgramListLoader,
  loadFundingProgram,
  createFundingProgramRequest,
  updateFundingProgramRequest,
  deleteFundingProgramRequest,
} from './funding-program.api';

export const FundingProgramDomainStore = signalStore(
  { providedIn: 'root' },
  withState({
    selectedItem: null as FundingProgram | null,
    isLoadingDetail: false,
  }),
  withProps(() => ({ _http: inject(HttpClient) })),
  withFeature((store) =>
    withCursorPagination<FundingProgram>({
      loader: (params) => fundingProgramListLoader(store._http, params),
    }),
  ),
  // httpMutation auto-generates per-mutation status signals (e.g. createMutationIsPending).
  // concatOp queues requests sequentially — safe for CRUD where order matters.
  withMutations(() => ({
    createMutation: httpMutation({
      request: (data: FundingProgramCreate) => createFundingProgramRequest(data),
      operator: concatOp,
    }),
    updateMutation: httpMutation({
      request: (params: { id: string; data: FundingProgramUpdate }) =>
        updateFundingProgramRequest(params),
      operator: concatOp,
    }),
    deleteMutation: httpMutation({
      request: (id: string) => deleteFundingProgramRequest(id),
      operator: concatOp,
    }),
  })),
  withMethods((store) => ({
    // switchMap in the pipe below auto-cancels the previous HTTP request on rapid re-calls.
    selectById: rxMethod<string>(
      pipe(
        tap(() => patch(store, { isLoadingDetail: true })),
        switchMap((id) =>
          loadFundingProgram(store._http, id).pipe(
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
