# Story 0.2: Create Reusable Cursor Pagination Store Feature

Status: review

## Story

As a development team,
I want a reusable `withCursorPagination<T>()` store feature,
So that all 7 entity domain stores share a single, tested pagination implementation instead of duplicating cursor logic.

## Acceptance Criteria

1. `withCursorPagination<T>()` is located at `src/app/domains/shared/with-cursor-pagination.ts`
2. It encapsulates: items array, cursor state, hasMore flag, isLoading state, error state
3. Initial load calls API with `cursor: null` and `limit: N`, populates items, sets `hasMore` based on next cursor
4. `loadMore()` calls API with current cursor, **appends** new items (does not replace), updates cursor
5. When `hasMore === false`, `loadMore()` makes no API call
6. Unit tests pass covering: initial load, load more, end of list, error handling, loading state transitions

## Tasks / Subtasks

- [x] Task 1: Create the custom store feature (AC: #1, #2)
  - [x] Create `src/app/domains/shared/with-cursor-pagination.ts`
  - [x] Implement `withCursorPagination<T>()` as a custom `signalStoreFeature`
  - [x] Define state: `items: T[]`, `cursor: string | null`, `hasMore: boolean`, `isLoading: boolean`, `error: string | null`
  - [x] Accept configuration: `loader` function that takes `{ cursor, limit, filters }` and returns `Observable<PaginatedResponse<T>>`
  - [x] Accept configuration: `defaultLimit` (default 20)
- [x] Task 2: Implement load method (AC: #3)
  - [x] `load(filters?)` resets items, cursor, sets `isLoading`, calls loader with `cursor: null`
  - [x] On success: set items from `response.data`, set cursor from `response.pagination.cursors.end_cursor`, set `hasMore` from `response.pagination.has_next_page`
  - [x] On error: set error message, set `isLoading` false
- [x] Task 3: Implement loadMore method (AC: #4, #5)
  - [x] `loadMore()` checks `hasMore` — if false, return immediately (no API call)
  - [x] If `hasMore`, call loader with current cursor
  - [x] On success: **append** items to existing array, update cursor, update hasMore
  - [x] On error: set error, keep existing items intact
- [x] Task 4: Implement reset/refresh method
  - [x] `reset()` clears all state to initial values
  - [x] `refresh(filters?)` calls `load()` again with current/new filters
- [x] Task 5: Write unit tests (AC: #6)
  - [x] Create `src/app/domains/shared/with-cursor-pagination.spec.ts`
  - [x] Test: initial load populates items and sets cursor
  - [x] Test: loadMore appends items
  - [x] Test: loadMore with hasMore=false makes no API call
  - [x] Test: error handling sets error state
  - [x] Test: loading state transitions (isLoading true during call, false after)
  - [x] Test: reset clears all state
  - [x] Test: load replaces items (not appends)

## Dev Notes

### Current Pagination Contract

The existing `BaseEntityService<T>.list()` (at `src/app/core/api/base-entity.service.ts:36-71`) already implements cursor pagination. The API response shape is defined in `src/app/core/api/paginated-response.model.ts`:

```typescript
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total_count: number;
    page_size: number;
    has_next_page: boolean;
    has_previous_page: boolean;
    cursors: {
      start_cursor: string | null;
      end_cursor: string | null;
    };
    _links: { self: string; next: string | null; prev: string | null; first: string };
  };
}
```

Your `withCursorPagination` must work with this exact response shape. Import `PaginatedResponse` from `@app/core/api/paginated-response.model`.

### How Components Currently Use Pagination

See `funding-program-list.component.ts:122-133` for the current pattern:
```typescript
this.service.list(cursor, undefined, filters).subscribe((response) => {
  this.hasMore = response.pagination.has_next_page;
  this.endCursor = response.pagination.cursors.end_cursor;
});
```

The `withCursorPagination` feature must fully encapsulate this — components will read `facade.hasMore()` and call `facade.loadMore()` instead.

### Implementation Approach — signalStoreFeature

Use `signalStoreFeature` from `@ngrx/signals` to create a composable store feature:

```typescript
import { signalStoreFeature, withState, withMethods, withComputed } from '@ngrx/signals';
import { patchState } from '@ngrx/signals';

export function withCursorPagination<T>(config: {
  loader: (params: { cursor: string | null; limit: number; filters?: Record<string, string> }) => Observable<PaginatedResponse<T>>;
  defaultLimit?: number;
}) {
  return signalStoreFeature(
    withState({
      items: [] as T[],
      cursor: null as string | null,
      hasMore: false,
      isLoading: false,
      error: null as string | null,
    }),
    withMethods((store) => ({
      load(filters?: Record<string, string>) { /* ... */ },
      loadMore() { /* ... */ },
      reset() { /* ... */ },
    })),
  );
}
```

### How Domain Stores Will Compose This

Each domain store (Story 0.3+) will compose `withCursorPagination`:
```typescript
export const FundingProgramDomainStore = signalStore(
  { providedIn: 'root' },
  withCursorPagination<FundingProgram>({
    loader: (params) => inject(HttpClient).get<PaginatedResponse<FundingProgram>>(/* ... */),
  }),
  // ... other store features
);
```

### API Base URL Pattern

All entity API endpoints follow: `${environment.apiBaseUrl}/{entity-path}/`
- Funding Programs: `${environment.apiBaseUrl}/funding-programs/`
- Action Themes: `${environment.apiBaseUrl}/action-themes/`

The `loader` function passed to `withCursorPagination` handles the actual HTTP call — the store feature only manages state.

### Testing with Vitest

The project uses Vitest (`^4.0.8`). Tests run via `ng test`. NgRx signal stores can be tested without Angular TestBed — they're plain TypeScript objects when instantiated directly.

### Anti-Patterns to Avoid

- Do NOT use `withEntityResources` for pagination — `withCursorPagination` is a **custom** store feature that wraps the cursor logic specifically
- Do NOT put HttpClient in this file — the `loader` function is injected from outside
- Do NOT use `subscribe()` inside the store — use RxJS operators. The store should handle subscriptions internally using `rxMethod` or similar patterns
- Do NOT duplicate state that `withEntityResources` would manage — this feature is specifically for cursor-paginated list endpoints
- Do NOT add filtering logic to this file — filters are passed through to the loader function

### Project Structure Notes

- File location: `src/app/domains/shared/with-cursor-pagination.ts` (directory created in Story 0.1)
- Test location: `src/app/domains/shared/with-cursor-pagination.spec.ts` (co-located)
- This is the ONLY file in `domains/shared/` for now

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture — Cursor Pagination]
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure Patterns — Shared Domain Utilities]
- [Source: src/app/core/api/paginated-response.model.ts — API response shape]
- [Source: src/app/core/api/base-entity.service.ts:36-71 — current pagination implementation]
- [Source: docs/architecture-ACTEE.md#Stores de domain — withEntityResources pattern]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- Fixed NgRx Signals v21 generic typing issue: `signalStoreFeature` with generics requires type assertions for `patchState` due to index signature constraints. Used a `patch()` helper with `as never` cast.
- Removed `fakeAsync`/`tick` from tests — Vitest environment does not include zone.js; synchronous `of()` observables resolve immediately without zone.

### Completion Notes List
- Created `withCursorPagination<T>()` as a reusable `signalStoreFeature` with full state management (items, cursor, hasMore, isLoading, error)
- Implemented `load()` via `rxMethod` for reactive filter changes, `loadMore()` for cursor-based append, `reset()` and `refresh()` for state management
- Added `isEmpty` and `totalLoaded` computed signals
- 15 unit tests covering all acceptance criteria: initial load, loadMore append, end-of-list guard, error handling, loading transitions, reset, load-replaces-not-appends

### Change Log
- 2026-03-04: Story 0.2 implemented — withCursorPagination store feature created with 15 passing unit tests

### File List
- src/app/domains/shared/with-cursor-pagination.ts (new)
- src/app/domains/shared/with-cursor-pagination.spec.ts (new)
