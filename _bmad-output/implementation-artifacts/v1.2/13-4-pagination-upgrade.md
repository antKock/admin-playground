# Story 13.4: Pagination Upgrade

Status: done

## Story

As an operator,
I want reliable pagination with accurate page state,
So that I know my exact position in result sets.

## Acceptance Criteria

1. **Given** `PaginationMeta` now provides `has_next_page` and `has_previous_page` **When** the pagination store evaluates "has more" **Then** it uses `has_next_page` instead of cursor null-checks
2. **Given** `PaginationMeta` provides `cursors.start_cursor` and `cursors.end_cursor` **When** paginating **Then** the store uses the structured cursor object
3. **Given** `PaginationMeta` provides `_links` **When** available **Then** the store can optionally use link-based navigation
4. **Given** `PaginatedResponse` shape changed from flat to nested `{ data, pagination: PaginationMeta }` **When** consuming paginated responses **Then** the store correctly extracts `data` and `pagination` from the new shape
5. **Given** all pagination changes **When** tests run **Then** zero regressions across all list views

## Tasks / Subtasks

- [x] Task 1: Update PaginatedResponse model (AC: #4)
  - [x] Update `src/app/core/api/paginated-response.model.ts` if it doesn't match new schema
  - [x] Ensure `PaginationMeta` type has: `total_count`, `page_size`, `has_next_page`, `has_previous_page`, `cursors: { start_cursor, end_cursor }`, `_links: { self, next, prev, first }`
- [x] Task 2: Update with-cursor-pagination store feature (AC: #1, #2)
  - [x] Update `hasMore` computed to use `pagination.has_next_page` instead of `cursor !== null`
  - [x] Update cursor tracking to use `pagination.cursors.end_cursor` for next-page requests
  - [x] Ensure `loadMore()` reads cursor from the new structure
- [x] Task 3: Verify all list views work (AC: #5)
  - [x] Test pagination across: action-models, action-themes, agents, communities, funding-programs, folder-models, indicator-models, users
  - [x] Run `npx ng test --no-watch` — zero regressions

## Dev Notes

### Current vs New PaginationMeta

**Current (from code):**
```typescript
{
  data: T[];
  pagination: {
    total_count: number;
    page_size: number;
    has_next_page: boolean;
    has_previous_page: boolean;
    cursors: { start_cursor: string | null; end_cursor: string | null };
    _links: { self: string; next: string | null; prev: string | null; first: string };
  };
}
```

**Live API spec:** Matches the above. The model may already be correct — verify before changing.

### Key File

`src/app/domains/shared/with-cursor-pagination.ts` — the single source of pagination logic. All changes here propagate to all list views.

### References

- [Source: src/app/core/api/paginated-response.model.ts — response model]
- [Source: src/app/domains/shared/with-cursor-pagination.ts — pagination store feature]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No issues — code was already aligned.

### Completion Notes List

- **Verification result**: Both `PaginatedResponse` model and `with-cursor-pagination` store feature were already fully aligned with the new API schema.
- `PaginatedResponse<T>` already uses nested `{ data: T[]; pagination: PaginationMeta }` shape.
- `PaginationMeta` already has all required fields: `total_count`, `page_size`, `has_next_page`, `has_previous_page`, `cursors: { start_cursor, end_cursor }`, `_links: { self, next, prev, first }`.
- `with-cursor-pagination` already uses `response.pagination.has_next_page` for hasMore (not cursor null-checks).
- `with-cursor-pagination` already uses `response.pagination.cursors.end_cursor` for cursor tracking.
- No code changes were needed — all ACs were already satisfied by existing implementation.
- Full test suite: 76 files, 899 tests — all pass, zero regressions.

### Change Log

- 2026-03-14: Verified story 13.4 — pagination model and store feature already aligned with API schema, no changes needed

### File List

(No files modified — existing implementation already satisfied all ACs)
