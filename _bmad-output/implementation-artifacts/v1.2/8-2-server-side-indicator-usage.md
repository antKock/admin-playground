# Story 8.2: Server-Side Indicator Model Usage Lookup

Status: review

## Story

As an admin user,
I want the indicator-model detail page to show all action models that reference it without a ceiling limit,
so that I get an accurate and complete usage picture.

## Acceptance Criteria

1. **Given** an indicator-model detail page **When** the usage section loads **Then** it fetches action models using paginated iteration (fetching all pages) instead of the current 100-item ceiling
2. **Given** an indicator model used in more than 100 action models **When** usage loads **Then** all action models appear in the usage list (no truncation)
3. **Given** each action model in the usage list **When** displayed **Then** it is a clickable link navigating to `/action-models/{id}`
4. **Given** an indicator model not used by any action model **When** usage loads **Then** the empty state shows "Non utilise dans aucun modele d'action."

## Tasks / Subtasks

- [x] Task 1: Replace single-page fetch with paginated iteration in API layer (AC: #1, #2)
  - [x] In `src/app/domains/indicator-models/indicator-model.api.ts`, rewrite `loadUsageByIndicatorModel()`
  - [x] Use `expand()` operator to iterate all pages of `GET /action-models/` until `has_next_page === false`
  - [x] On each page, filter action models client-side by checking `am.indicator_models?.some(im => im.id === indicatorModelId)`
  - [x] Accumulate matching results across all pages using `reduce()`
  - [x] Remove the `CROSS_DOMAIN_QUERY_LIMIT` constant
  - [x] Use a reasonable page size (e.g., 50) per request to avoid overloading

- [x] Task 2: Verify domain store and facade wiring is correct (AC: #1, #3, #4)
  - [x] The domain store (`src/app/domains/indicator-models/indicator-model.store.ts`) already calls `loadUsageByIndicatorModel` via `loadUsage` rxMethod -- no change needed
  - [x] The feature store already projects `usedInModels` and `usageCount` -- no change needed
  - [x] The facade already exposes `usedInModels`, `usageCount`, `isLoadingUsage` -- no change needed

- [x] Task 3: Verify detail component UI (AC: #3, #4)
  - [x] The detail component (`src/app/features/indicator-models/ui/indicator-model-detail.component.ts`) already renders usage as `routerLink` links -- no change needed
  - [x] Verify empty state text matches AC #4

- [x] Task 4: Tests (AC: #1, #2)
  - [x] Test `loadUsageByIndicatorModel` with multi-page response (mock 3 pages, indicator in pages 1 and 3)
  - [x] Test single-page response with no matches returns empty array
  - [x] Test that function completes (does not loop) when `has_next_page` is false

## Dev Notes

### Key Files

| File | Change |
|------|--------|
| `src/app/domains/indicator-models/indicator-model.api.ts` | Rewrite `loadUsageByIndicatorModel()` to paginate all pages |
| `src/app/domains/indicator-models/indicator-model.store.ts` | No change needed (already wired) |
| `src/app/features/indicator-models/indicator-model.store.ts` | No change needed |
| `src/app/features/indicator-models/indicator-model.facade.ts` | No change needed |
| `src/app/features/indicator-models/ui/indicator-model-detail.component.ts` | No change needed |

### Implementation Approach

The current code fetches a single page of 100 action models and filters client-side:

```typescript
// CURRENT (to be replaced):
const CROSS_DOMAIN_QUERY_LIMIT = 100;
export function loadUsageByIndicatorModel(http, id) {
  return http.get(ACTION_MODELS_URL, { params: { limit: '100' } })
    .pipe(map(response => response.data.filter(...)));
}
```

Replace with RxJS `expand()` to iterate all pages:

```typescript
// NEW:
export function loadUsageByIndicatorModel(http, indicatorModelId) {
  const PAGE_SIZE = 50;

  const fetchPage = (cursor: string | null) => {
    let params = new HttpParams().set('limit', String(PAGE_SIZE));
    if (cursor) params = params.set('cursor', cursor);
    return http.get<PaginatedResponse<ActionModel>>(ACTION_MODELS_URL, { params });
  };

  return fetchPage(null).pipe(
    expand(response =>
      response.pagination.has_next_page
        ? fetchPage(response.pagination.cursors.end_cursor)
        : EMPTY
    ),
    map(response =>
      response.data
        .filter(am => am.indicator_models?.some(im => im.id === indicatorModelId))
        .map(am => ({ id: am.id, name: am.name }))
    ),
    reduce((acc, matches) => [...acc, ...matches], [] as { id: string; name: string }[]),
  );
}
```

### Patterns to Follow

- **`expand()` + `EMPTY`**: Standard RxJS pattern for paginated iteration. `expand()` re-subscribes with the next cursor until `EMPTY` terminates the recursion.
- **`reduce()`**: Accumulates all matches into a single emission. The store's `tap()` receives one final array.
- **Client-side filtering**: The API does not support `?indicator_model_id=` filter on the action-models endpoint. We must fetch all action models and check their `indicator_models` array. This is a known limitation documented in the existing code.
- **Import `expand` and `EMPTY` from `rxjs`**: These are already available in the project (EMPTY is used in the same file's catchError).

> **Clarification (2026-03-11 party-mode review):** The `?action_model_id=` server-side filter exists on the **indicator-models** endpoint (finds indicator models for a given action model). That is the **wrong direction** for this use case — we need action models for a given indicator model. There is no `?indicator_model_id=` filter on the action-models endpoint. The `expand()` paginated iteration approach is therefore the correct solution.

### Anti-Patterns

- Do NOT try to use `GET /indicator-models/by-action-model/{id}` -- that endpoint returns indicator models for a given action model, NOT action models for a given indicator model. It is the reverse direction.
- Do NOT use `GET /indicator-models/?action_model_id=` -- that filters indicator models, not action models.
- Do NOT use `switchMap` inside `expand()` -- `expand` already handles sequential requests.
- Do NOT use `forkJoin` to parallelize pages -- cursor pagination is sequential by nature.
- Do NOT add a loading spinner change -- `isLoadingUsage` is already managed by the domain store's `loadUsage` rxMethod.

### Project Structure Notes

- Only the API function changes. The domain store, feature store, facade, and detail component are already correctly wired for the usage feature (added in story 3.3).
- The `ActionModel` type is already imported in `indicator-model.api.ts`.

### References

- [Source: src/app/domains/indicator-models/indicator-model.api.ts#loadUsageByIndicatorModel] -- current 100-item ceiling implementation
- [Source: src/app/domains/indicator-models/indicator-model.store.ts#loadUsage] -- rxMethod that calls the API function
- [Source: src/app/features/indicator-models/ui/indicator-model-detail.component.ts#section-usage] -- UI rendering

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- Fixed existing facade spec: usage response mock had `has_next_page: true` which triggered expand to fetch another page, causing `httpTesting.verify()` failure.

### Completion Notes List
- Replaced single-page 100-item ceiling with `expand()`+`reduce()` paginated iteration
- Removed `CROSS_DOMAIN_QUERY_LIMIT` constant, added `USAGE_PAGE_SIZE = 50`
- Verified domain store, feature store, facade, and detail component are already correctly wired
- Verified empty state text "Non utilisé dans aucun modèle d'action." matches AC #4
- Added 3 unit tests for `loadUsageByIndicatorModel` (multi-page, no matches, completion)
- Fixed existing facade spec to handle paginated usage response
- All 793 tests pass

### File List
- `src/app/domains/indicator-models/indicator-model.api.ts` (modified)
- `src/app/domains/indicator-models/indicator-model.api.spec.ts` (new)
- `src/app/features/indicator-models/indicator-model.facade.spec.ts` (modified)

### Change Log
- 2026-03-11: Replaced single-page usage lookup with paginated iteration to remove 100-item ceiling
