# withCursorPagination — Developer Reference

Custom `signalStoreFeature` that adds cursor-based pagination to any domain store.

**Source:** `src/app/domains/shared/with-cursor-pagination.ts`

## Overview

The API uses **cursor-based** pagination (not offset). Each response includes an opaque `end_cursor` token. To fetch the next page, pass the cursor back. This avoids consistency issues with offset pagination when data changes between pages.

## Configuration

```typescript
import { withCursorPagination, FilterParams } from '@domains/shared/with-cursor-pagination';

withFeature((store) =>
  withCursorPagination<MyModel>({
    loader: (params) => myListLoader(store._http, params),
    defaultLimit: 20, // optional, defaults to 20
  }),
);
```

The `loader` function receives `{ cursor, limit, filters }` and must return `Observable<PaginatedResponse<T>>`.

## State

| Signal | Type | Description |
|--------|------|-------------|
| `items` | `T[]` | Current loaded items. Accumulates across `loadMore()` calls. |
| `cursor` | `string \| null` | Opaque cursor for next page. `null` when no pages loaded or all loaded. |
| `hasMore` | `boolean` | Whether more pages are available. |
| `isLoading` | `boolean` | True during any active fetch. |
| `error` | `string \| null` | Last error message, or `null`. Cleared on new fetch. |
| `totalCount` | `number \| null` | Server-reported total count (from `pagination.total_count`). |

## Computed

| Signal | Type | Description |
|--------|------|-------------|
| `isEmpty` | `boolean` | `items.length === 0 && !isLoading` — true only after load completes with no results. |
| `totalLoaded` | `number` | `items.length` — how many items are currently in memory. |

## Methods

### `load(filters?: FilterParams)`

Loads the **first page**, replacing all current items. Resets cursor, hasMore, error.

- **Clears** items before fetching (shows loading state)
- **Stores** filters for use by subsequent `loadMore()` calls
- Uses `switchMap` — cancels any in-flight load

### `loadMore()`

Loads the **next page**, appending to existing items.

- **Guarded**: no-op if `!hasMore || isLoading` (safe to call on every scroll)
- Reuses filters from the last `load()` call
- Uses `switchMap` internally

### `refresh(filters?)`

Reloads the **first page** while preserving filter context.

- If called with `filters`, uses those and stores them
- If called with `undefined`, reuses the last applied filters
- Clears items and resets to first page (like `load()`)
- **Use case**: after a mutation succeeds, refresh the list with current filters

### `loadAll(filters?)`

Fetches **every page** sequentially using `expand()` + `reduce()`.

- Loops `cursor → fetch → cursor → fetch` until `has_next_page` is false
- Returns all items at once when complete
- Sets `hasMore = false` and `cursor = null` on completion
- **Warning**: can be slow/expensive for large datasets. Use only for dropdown population or small collections.

### `reset()`

Clears all state to initial values. Clears stored filters.

## Filter Persistence

```
load({ status: ['draft'] })   → stores filters, fetches page 1
loadMore()                     → reuses { status: ['draft'] }, fetches page 2
loadMore()                     → reuses { status: ['draft'] }, fetches page 3
refresh(undefined)             → reuses { status: ['draft'] }, re-fetches page 1
refresh({ status: ['active'] })→ stores NEW filters, fetches page 1
load(undefined)                → clears filters, fetches page 1 (no filters)
```

## When to Use Which Method

| Scenario | Method | Why |
|----------|--------|-----|
| Initial page load | `load(filters)` | Starts fresh with explicit filters |
| Infinite scroll / "Load more" | `loadMore()` | Appends next page, preserves filters |
| After mutation (create/update/delete) | `refresh(undefined)` | Reloads page 1 with current filters |
| User changes filters | `load(newFilters)` | Starts fresh with new filters |
| Populate a dropdown with all options | `loadAll(undefined)` | Fetches everything — use sparingly |
| Navigate away from list | `reset()` | Clears memory |

## FilterParams Format

```typescript
export type FilterParams = Record<string, string | string[]>;
```

Examples:
```typescript
{ status: 'draft' }                          // single value
{ status: ['draft', 'published'] }           // multi-value (OR)
{ status: ['draft'], funding_program_id: 'uuid-123' } // cross-filter (AND)
```

Array values are expanded into repeated query params by `applyFilters()` in `api.utils.ts`:
```
?status=draft&status=published&funding_program_id=uuid-123
```

## Integration Example

From `action-model.store.ts`:

```typescript
// 1. Domain store composes withCursorPagination
export const ActionModelDomainStore = signalStore(
  { providedIn: 'root' },
  withState({ selectedItem: null as ActionModel | null, isLoadingDetail: false, detailError: null as string | null }),
  withProps(() => ({ _http: inject(HttpClient) })),
  withFeature((store) =>
    withCursorPagination<ActionModel>({
      loader: (params) => actionModelListLoader(store._http, params),
    }),
  ),
  withMutations(() => ({ /* ... */ })),
  withMethods((store) => ({ /* selectById, clearSelection */ })),
);
```

```typescript
// 2. API loader function (action-model.api.ts)
export function actionModelListLoader(
  http: HttpClient,
  params: { cursor: string | null; limit: number; filters?: FilterParams },
): Observable<PaginatedResponse<ActionModel>> {
  let httpParams = new HttpParams();
  if (params.cursor) httpParams = httpParams.set('cursor', params.cursor);
  httpParams = httpParams.set('limit', params.limit.toString());
  httpParams = applyFilters(httpParams, params.filters);
  return http.get<PaginatedResponse<ActionModel>>(BASE_URL, { params: httpParams });
}
```

```typescript
// 3. Facade exposes load/loadMore to UI (action-model.facade.ts)
load(filters?: FilterParams): void { this.domainStore.load(filters); }
loadMore(): void { this.domainStore.loadMore(); }
```

## API Response Format

```json
{
  "data": [{ "id": "...", "name": "..." }],
  "pagination": {
    "total_count": 42,
    "page_size": 20,
    "has_next_page": true,
    "has_previous_page": false,
    "cursors": { "start_cursor": "abc", "end_cursor": "xyz" },
    "_links": { "self": "...", "next": "...", "prev": null, "first": "..." }
  }
}
```
