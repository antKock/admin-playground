import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { signalStore, withState, withMethods, withProps } from '@ngrx/signals';

import { patch } from '@domains/shared/store.utils';
import { ActivityResponse, ActivityFilters } from './history.models';
import { entityActivityLoader, globalActivityLoader } from './history.api';

const PAGE_SIZE = 20;

export const HistoryStore = signalStore(
  withState({
    activities: [] as ActivityResponse[],
    isLoading: false,
    cursor: null as string | null,
    hasMore: false,
    error: null as string | null,
  }),
  withProps(() => ({ _http: inject(HttpClient) })),
  withMethods((store) => ({
    load(entityType: string, entityId: string): void {
      patch(store, { isLoading: true, error: null, activities: [], cursor: null, hasMore: false });
      entityActivityLoader(store._http, { entityType, entityId, cursor: null, limit: PAGE_SIZE })
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
    loadMore(entityType: string, entityId: string): void {
      const currentCursor = store.cursor();
      if (!currentCursor || store.isLoading()) return;
      patch(store, { isLoading: true });
      entityActivityLoader(store._http, { entityType, entityId, cursor: currentCursor, limit: PAGE_SIZE })
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
      patch(store, { activities: [], isLoading: false, cursor: null, hasMore: false, error: null });
    },
  })),
);

export const GlobalHistoryStore = signalStore(
  { providedIn: 'root' },
  withState({
    activities: [] as ActivityResponse[],
    isLoading: false,
    cursor: null as string | null,
    hasMore: false,
    error: null as string | null,
  }),
  withProps(() => ({ _http: inject(HttpClient) })),
  withMethods((store) => {
    let currentFilters: ActivityFilters = {};
    return {
      load(filters?: ActivityFilters): void {
        currentFilters = { ...filters, cursor: undefined };
        patch(store, { isLoading: true, error: null, activities: [], cursor: null, hasMore: false });
        globalActivityLoader(store._http, currentFilters)
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
        globalActivityLoader(store._http, { ...currentFilters, cursor: currentCursor })
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
        currentFilters = {};
        patch(store, { activities: [], isLoading: false, cursor: null, hasMore: false, error: null });
      },
    };
  }),
);
