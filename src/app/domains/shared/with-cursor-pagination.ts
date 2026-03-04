import { computed } from '@angular/core';
import {
  signalStoreFeature,
  withState,
  withMethods,
  withComputed,
  patchState,
  WritableStateSource,
} from '@ngrx/signals';
import { pipe, switchMap, tap, catchError, filter, EMPTY, Observable } from 'rxjs';
import { rxMethod } from '@ngrx/signals/rxjs-interop';

import { PaginatedResponse } from '@app/core/api/paginated-response.model';

export interface CursorPaginationState {
  items: unknown[];
  cursor: string | null;
  hasMore: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface CursorPaginationConfig<T> {
  loader: (params: {
    cursor: string | null;
    limit: number;
    filters?: Record<string, string>;
  }) => Observable<PaginatedResponse<T>>;
  defaultLimit?: number;
}

const initialState: CursorPaginationState = {
  items: [],
  cursor: null,
  hasMore: false,
  isLoading: false,
  error: null,
};

function patch(store: WritableStateSource<object>, state: Partial<CursorPaginationState>): void {
  patchState(store, state as never);
}

export function withCursorPagination<T>(config: CursorPaginationConfig<T>) {
  const limit = config.defaultLimit ?? 20;

  return signalStoreFeature(
    withState(initialState),
    withComputed((state: Record<string, () => unknown>) => ({
      isEmpty: computed(
        () =>
          (state['items']() as T[]).length === 0 && !(state['isLoading']() as boolean),
      ),
      totalLoaded: computed(() => (state['items']() as T[]).length),
    })),
    withMethods((store: Record<string, unknown> & WritableStateSource<object>) => {
      let currentFilters: Record<string, string> | undefined;

      const items = store['items'] as () => T[];
      const cursor = store['cursor'] as () => string | null;
      const hasMore = store['hasMore'] as () => boolean;
      const isLoading = store['isLoading'] as () => boolean;

      return {
        load: rxMethod<Record<string, string> | undefined>(
          pipe(
            tap((filters) => {
              currentFilters = filters;
              patch(store, {
                items: [],
                cursor: null,
                hasMore: false,
                isLoading: true,
                error: null,
              });
            }),
            switchMap((filters) =>
              config.loader({ cursor: null, limit, filters }).pipe(
                tap((response) => {
                  patch(store, {
                    items: response.data,
                    cursor: response.pagination.cursors.end_cursor,
                    hasMore: response.pagination.has_next_page,
                    isLoading: false,
                  });
                }),
                catchError((err) => {
                  patch(store, {
                    error: err?.message ?? 'Failed to load items',
                    isLoading: false,
                  });
                  return EMPTY;
                }),
              ),
            ),
          ),
        ),

        loadMore: rxMethod<void>(
          pipe(
            filter(() => hasMore() && !isLoading()),
            tap(() => patch(store, { isLoading: true, error: null })),
            switchMap(() =>
              config.loader({ cursor: cursor(), limit, filters: currentFilters }).pipe(
                tap((response) => {
                  patch(store, {
                    items: [...items(), ...response.data],
                    cursor: response.pagination.cursors.end_cursor,
                    hasMore: response.pagination.has_next_page,
                    isLoading: false,
                  });
                }),
                catchError((err) => {
                  patch(store, {
                    error: err?.message ?? 'Failed to load more items',
                    isLoading: false,
                  });
                  return EMPTY;
                }),
              ),
            ),
          ),
        ),

        reset(): void {
          currentFilters = undefined;
          patch(store, { ...initialState });
        },

        refresh: rxMethod<Record<string, string> | undefined>(
          pipe(
            tap((filters) => {
              currentFilters = filters ?? currentFilters;
              patch(store, {
                items: [],
                cursor: null,
                hasMore: false,
                isLoading: true,
                error: null,
              });
            }),
            switchMap(() =>
              config.loader({ cursor: null, limit, filters: currentFilters }).pipe(
                tap((response) => {
                  patch(store, {
                    items: response.data,
                    cursor: response.pagination.cursors.end_cursor,
                    hasMore: response.pagination.has_next_page,
                    isLoading: false,
                  });
                }),
                catchError((err) => {
                  patch(store, {
                    error: err?.message ?? 'Failed to refresh items',
                    isLoading: false,
                  });
                  return EMPTY;
                }),
              ),
            ),
          ),
        ),
      };
    }),
  );
}
