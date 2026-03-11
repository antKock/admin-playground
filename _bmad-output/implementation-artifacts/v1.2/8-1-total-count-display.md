# Story 8.1: Total Count Display in DataTable Footer

Status: review

## Story

As an admin user,
I want to see "Showing X of Y" in every table footer,
so that I know how many items exist versus how many are currently loaded.

## Acceptance Criteria

1. **Given** any entity list page **When** data loads **Then** the table footer displays "Affichage de {loaded_count} sur {total_count}" using `PaginationMeta.total_count`
2. **Given** items are loaded via "Load More" **When** more items appear **Then** the loaded count updates (e.g., "Affichage de 40 sur 128")
3. **Given** `total_count` is null or undefined **When** data loads **Then** the footer displays only "Affichage de {loaded_count}" without "sur Y"

## Tasks / Subtasks

- [x] Task 1: Expose `totalCount` from `withCursorPagination` (AC: #1, #2, #3)
  - [x] Add `totalCount: number | null` to `CursorPaginationState` in `with-cursor-pagination.ts`, default `null`
  - [x] In the `load` method's tap callback, set `totalCount: response.pagination.total_count ?? null`
  - [x] In the `loadMore` method's tap callback, set `totalCount: response.pagination.total_count ?? null` (total_count stays stable across pages but refresh it anyway)
  - [x] In `reset()`, set `totalCount: null`
  - [x] In `refresh` method's tap callback, set `totalCount: response.pagination.total_count ?? null`
  - [x] Add a `totalCount` computed in the `withComputed` section: `totalCount: computed(() => state['totalCount']() as number | null)`

- [x] Task 2: Add `totalCount` input to DataTable component (AC: #1)
  - [x] Add `readonly totalCount = input<number | null>(null);` to `DataTableComponent`
  - [x] Add footer section in `data-table.component.html` after `</table>` and before the loading-more div
  - [x] Footer template: `<div class="table-footer">` with text "Affichage de {totalLoaded} sur {totalCount}" when totalCount is not null, or just "Affichage de {totalLoaded}" when null
  - [x] Use `data().length` for the loaded count (this reflects actual rendered items)
  - [x] Only show footer when `data().length > 0` (hide during skeleton/empty state)

- [x] Task 3: Style the footer (AC: #1)
  - [x] Add `.table-footer` styles in `data-table.component.css`: `padding: 0.75rem 1rem; font-size: 0.8125rem; color: var(--color-text-tertiary); border-top: 1px solid var(--color-border);`

- [x] Task 4: Wire totalCount through feature stores (AC: #1, #2)
  - [x] Each feature store already projects `totalLoaded` from domain store -- add `totalCount: computed(() => domainStore.totalCount())` to each feature store
  - [x] Files to update:
    - `src/app/features/action-models/action-model.store.ts`
    - `src/app/features/action-themes/action-theme.store.ts`
    - `src/app/features/indicator-models/indicator-model.store.ts`
    - `src/app/features/funding-programs/funding-program.store.ts`
    - `src/app/features/folder-models/folder-model.store.ts`
    - `src/app/features/communities/community.store.ts`
    - `src/app/features/agents/agent.store.ts`

- [x] Task 5: Wire totalCount through facades (AC: #1, #2)
  - [x] Add `readonly totalCount = this.featureStore.totalCount;` to each facade
  - [x] Files to update:
    - `src/app/features/action-models/action-model.facade.ts`
    - `src/app/features/action-themes/action-theme.facade.ts`
    - `src/app/features/indicator-models/indicator-model.facade.ts`
    - `src/app/features/funding-programs/funding-program.facade.ts`
    - `src/app/features/folder-models/folder-model.facade.ts`
    - `src/app/features/communities/community.facade.ts`
    - `src/app/features/agents/agent.facade.ts`

- [x] Task 6: Pass `totalCount` in all list components (AC: #1, #2)
  - [x] Add `[totalCount]="facade.totalCount()"` to each `<app-data-table>` instance
  - [x] Files to update:
    - `src/app/features/action-models/ui/action-model-list.component.ts`
    - `src/app/features/action-themes/ui/action-theme-list.component.ts`
    - `src/app/features/indicator-models/ui/indicator-model-list.component.ts`
    - `src/app/features/funding-programs/ui/funding-program-list.component.ts`
    - `src/app/features/folder-models/ui/folder-model-list.component.ts`
    - `src/app/features/communities/ui/community-list.component.ts`
    - `src/app/features/agents/ui/agent-list.component.ts`

- [x] Task 7: Tests (AC: #1, #2, #3)
  - [x] Test DataTable renders footer with "Affichage de 5 sur 20" when totalCount=20 and data has 5 items
  - [x] Test DataTable renders "Affichage de 5" when totalCount=null
  - [x] Test DataTable hides footer when data is empty

## Dev Notes

### Key Files

| File | Change |
|------|--------|
| `src/app/domains/shared/with-cursor-pagination.ts` | Add `totalCount` to state, set from `response.pagination.total_count` |
| `src/app/shared/components/data-table/data-table.component.ts` | Add `totalCount` input |
| `src/app/shared/components/data-table/data-table.component.html` | Add footer section |
| `src/app/shared/components/data-table/data-table.component.css` | Footer styles |
| All 7 feature stores | Add `totalCount` computed |
| All 7 facades | Add `totalCount` readonly signal |
| All 7 list components | Add `[totalCount]` binding |

### Patterns to Follow

- **Signal input pattern**: Use `readonly totalCount = input<number | null>(null);` -- same pattern as existing `isLoading`, `hasMore` inputs on DataTable.
- **withCursorPagination state**: Add `totalCount` alongside existing `cursor`, `hasMore`, etc. in `initialState`. Set it in every `tap` callback where `response.pagination` is read (load, loadMore, refresh).
- **Feature store projection pattern**: Follow the existing `totalLoaded: computed(() => domainStore.totalLoaded())` pattern for `totalCount`.
- **Facade signal forwarding**: Follow `readonly hasMore = this.featureStore.hasMore;` pattern.
- **Template binding**: Follow `[hasMore]="facade.hasMore()"` pattern.
- **French UI strings**: Use "Affichage de" (not "Showing"), "sur" (not "of").

### Anti-Patterns

- Do NOT compute totalCount client-side by iterating -- it comes from `PaginationMeta.total_count` on the API response.
- Do NOT add totalCount as a method or computed in the domain store's `withMethods` -- it should be state set in `withCursorPagination` automatically.
- Do NOT show the footer during skeleton loading state -- only when `data().length > 0`.
- Do NOT create a separate component for the footer -- it is part of DataTable's template.

### Project Structure Notes

- `withCursorPagination` is the single source of truth for pagination state. Every domain store composes it via `withFeature()`. Adding `totalCount` there propagates to all 7 entities automatically.
- The `PaginationMeta` interface already has `total_count: number` (not optional), so null handling is only needed as a defensive measure.

### References

- [Source: src/app/domains/shared/with-cursor-pagination.ts] -- pagination feature
- [Source: src/app/core/api/paginated-response.model.ts] -- PaginationMeta with total_count
- [Source: src/app/shared/components/data-table/data-table.component.ts] -- DataTable component
- [Source: src/app/shared/components/data-table/data-table.component.html] -- DataTable template

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- Removed redundant `totalCount` computed from `withComputed` — state signals are already exposed by ngrx/signals, adding a computed with the same name triggers "SignalStore members cannot be overridden" warning.

### Completion Notes List
- Added `totalCount` to `CursorPaginationState` and set it from `response.pagination.total_count` in load/loadMore/refresh callbacks
- Added `totalCount` input to DataTableComponent with footer display logic
- Wired `totalCount` through all 7 feature stores, facades, and list components
- Added 3 unit tests for footer rendering (with count, null count, empty data)
- All 790 tests pass, build succeeds

### File List
- `src/app/domains/shared/with-cursor-pagination.ts` (modified)
- `src/app/shared/components/data-table/data-table.component.ts` (modified)
- `src/app/shared/components/data-table/data-table.component.html` (modified)
- `src/app/shared/components/data-table/data-table.component.css` (modified)
- `src/app/shared/components/data-table/data-table.component.spec.ts` (modified)
- `src/app/features/action-models/action-model.store.ts` (modified)
- `src/app/features/action-models/action-model.facade.ts` (modified)
- `src/app/features/action-models/ui/action-model-list.component.ts` (modified)
- `src/app/features/action-themes/action-theme.store.ts` (modified)
- `src/app/features/action-themes/action-theme.facade.ts` (modified)
- `src/app/features/action-themes/ui/action-theme-list.component.ts` (modified)
- `src/app/features/indicator-models/indicator-model.store.ts` (modified)
- `src/app/features/indicator-models/indicator-model.facade.ts` (modified)
- `src/app/features/indicator-models/ui/indicator-model-list.component.ts` (modified)
- `src/app/features/funding-programs/funding-program.store.ts` (modified)
- `src/app/features/funding-programs/funding-program.facade.ts` (modified)
- `src/app/features/funding-programs/ui/funding-program-list.component.ts` (modified)
- `src/app/features/folder-models/folder-model.store.ts` (modified)
- `src/app/features/folder-models/folder-model.facade.ts` (modified)
- `src/app/features/folder-models/ui/folder-model-list.component.ts` (modified)
- `src/app/features/communities/community.store.ts` (modified)
- `src/app/features/communities/community.facade.ts` (modified)
- `src/app/features/communities/ui/community-list.component.ts` (modified)
- `src/app/features/agents/agent.store.ts` (modified)
- `src/app/features/agents/agent.facade.ts` (modified)
- `src/app/features/agents/ui/agent-list.component.ts` (modified)

### Change Log
- 2026-03-11: Implemented total count display in DataTable footer across all 7 entity list pages
