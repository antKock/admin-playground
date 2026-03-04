import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { signalStore, withState, withMethods, withProps, withFeature, patchState } from '@ngrx/signals';
import { withMutations } from '@angular-architects/ngrx-toolkit';
import { httpMutation, concatOp } from '@angular-architects/ngrx-toolkit';

import { withCursorPagination } from '@domains/shared/with-cursor-pagination';
import { FundingProgram, FundingProgramCreate, FundingProgramUpdate } from './funding-program.models';
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
  withMethods((store) => {
    const http = inject(HttpClient);
    return {
      selectById(id: string): void {
        patchState(store, { isLoadingDetail: true } as never);
        loadFundingProgram(http, id).subscribe({
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
