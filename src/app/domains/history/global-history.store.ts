import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { signalStore, withState, withMethods, withProps } from '@ngrx/signals';

import { patch } from '@domains/shared/store.utils';
import { ActivityResponse, ActivityFilters } from './history.models';
import { globalActivityLoader } from './history.api';

export const GlobalHistoryStore = signalStore(
  { providedIn: 'root' },
  withState({
    activities: [] as ActivityResponse[],
    isLoading: false,
    cursor: null as string | null,
    hasMore: false,
    error: null as string | null,
    currentFilters: {} as ActivityFilters,
  }),
  withProps(() => ({ _http: inject(HttpClient) })),
  withMethods((store) => {
    return {
      load(filters?: ActivityFilters): void {
        const newFilters = { ...filters, cursor: undefined };
        patch(store, { isLoading: true, error: null, activities: [], cursor: null, hasMore: false, currentFilters: newFilters });
        globalActivityLoader(store._http, newFilters)
          .subscribe({
            next: (response) => {
              patch(store, {
                activities: response.data,
                cursor: response.pagination?.cursors?.end_cursor ?? null,
                hasMore: response.pagination?.has_next_page ?? false,
                isLoading: false,
              });
            },
            error: (err) => {
              patch(store, { error: err?.message ?? 'Échec du chargement', isLoading: false });
            },
          });
      },
      loadMore(): void {
        const currentCursor = store.cursor();
        if (!currentCursor || store.isLoading()) return;
        patch(store, { isLoading: true });
        globalActivityLoader(store._http, { ...store.currentFilters(), cursor: currentCursor })
          .subscribe({
            next: (response) => {
              patch(store, {
                activities: [...store.activities(), ...response.data],
                cursor: response.pagination?.cursors?.end_cursor ?? null,
                hasMore: response.pagination?.has_next_page ?? false,
                isLoading: false,
              });
            },
            error: (err) => {
              patch(store, { error: err?.message ?? 'Échec du chargement', isLoading: false });
            },
          });
      },
      reset(): void {
        patch(store, { activities: [], isLoading: false, cursor: null, hasMore: false, error: null, currentFilters: {} });
      },
    };
  }),
);
