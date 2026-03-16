// Domain store — owns all server state and mutations for sites.
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
import { Site, SiteCreate, SiteUpdate, Building } from './site.models';
import {
  siteListLoader,
  loadSite,
  loadSiteBuildings,
  createSiteRequest,
  updateSiteRequest,
  deleteSiteRequest,
} from './site.api';

export const SiteDomainStore = signalStore(
  { providedIn: 'root' },
  withState({
    selectedItem: null as Site | null,
    isLoadingDetail: false,
    detailError: null as string | null,
    buildings: [] as Building[],
    isLoadingBuildings: false,
    buildingsError: null as string | null,
  }),
  withProps(() => ({ _http: inject(HttpClient) })),
  // Provides: load, loadMore, refresh, reset + items, cursor, hasMore, isLoading, isEmpty, totalLoaded
  withFeature((store) =>
    withCursorPagination<Site>({
      loader: (params) => siteListLoader(store._http, params),
    }),
  ),
  // httpMutation auto-generates per-mutation status signals (e.g. createMutationIsPending).
  withMutations(() => ({
    // CRUD mutations — concatOp (queues requests sequentially)
    createMutation: httpMutation({
      request: (data: SiteCreate) => createSiteRequest(data),
      operator: concatOp,
    }),
    updateMutation: httpMutation({
      request: (params: { id: string; data: SiteUpdate }) =>
        updateSiteRequest(params),
      operator: concatOp,
    }),
    deleteMutation: httpMutation({
      request: (id: string) => deleteSiteRequest(id),
      operator: concatOp,
    }),
  })),
  withMethods((store) => ({
    // switchMap in the pipe below auto-cancels the previous HTTP request on rapid re-calls.
    selectById: rxMethod<string>(
      pipe(
        tap(() => patch(store, { isLoadingDetail: true })),
        switchMap((id) =>
          loadSite(store._http, id).pipe(
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
      patch(store, { selectedItem: null, buildings: [], buildingsError: null });
    },
    loadBuildings: rxMethod<string>(
      pipe(
        tap(() => patch(store, { isLoadingBuildings: true, buildingsError: null })),
        switchMap((siteId) =>
          loadSiteBuildings(store._http, siteId, { cursor: null, limit: 100 }).pipe(
            tap((response) => patch(store, { buildings: response.data, isLoadingBuildings: false })),
            catchError((err) => {
              patch(store, { isLoadingBuildings: false, buildingsError: err?.message ?? 'Échec du chargement des bâtiments' });
              return EMPTY;
            }),
          ),
        ),
      ),
    ),
  })),
);
