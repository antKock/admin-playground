# Story 2.5: List Filtering

Status: done

## Story

As an operator (Sophie/Alex),
I want to filter entity lists by available criteria (status, associated program, etc.),
so that I can quickly find specific entities without scrolling through the full list.

## Acceptance Criteria

1. **Status Filter** — Given the user is on the Action Themes list, when filter controls are available, then the user can filter by status (draft, published, disabled) where the API supports it
2. **Filter Application** — Given the user applies a filter, when the list reloads, then only matching entities are displayed, the pagination resets to the beginning, and the active filter is visually indicated
3. **Filter Clearing** — Given the user clears all filters, when the list reloads, then the full unfiltered list is displayed
4. **Funding Program Filters** — Apply same filter pattern to Funding Programs list where applicable

## Tasks / Subtasks

- [x] Task 1: Design Filter UI Component/Pattern
  - [x] Add filter bar above DataTable (below page title, above table)
  - [x] Use dropdown/select for status filter (All, Draft, Published, Disabled)
  - [x] Style with Tailwind: `surface-subtle` background, `stroke-standard` border, inline layout
  - [x] Active filter indicator: badge count or highlighted state
  - [x] "Clear filters" button when any filter is active

- [x] Task 2: Implement Filter Logic for Action Themes (AC: #1, #2, #3)
  - [x] Add filter state signals to `action-theme-list.component.ts`
  - [x] On filter change: reset cursor to null, call `service.list()` with filter params
  - [x] Pass filter parameters to API: `?status=published` (verify API supports query params for filtering)
  - [x] If API does NOT support filtering: implement client-side filtering as fallback
  - [x] Pagination resets on filter change
  - [x] Active filter visually indicated

- [x] Task 3: Implement Filter Logic for Funding Programs (AC: #4)
  - [x] Add filter bar to `funding-program-list.component.ts`
  - [x] Apply same pattern as Action Themes
  - [x] Determine available filter criteria from API (may be different from Action Themes)

- [x] Task 4: Update DataTable or List Components
  - [x] Ensure DataTable handles data reset gracefully (new filtered data replaces old)
  - [x] Skeleton loading shows during filter application
  - [x] Empty state shows "No results match your filters" (different from "no data" empty state)

- [x] Task 5: Verification & Tests
  - [x] Filter by status shows only matching Action Themes
  - [x] Pagination resets on filter change
  - [x] Clear filters shows full list
  - [x] Filtering works for both Funding Programs and Action Themes
  - [x] All tests pass

## Dev Notes

### Architecture Patterns & Constraints

- **API-Side Filtering Preferred** — Pass filter query params to API if supported (e.g., `?status=published`)
- **Client-Side Fallback** — If API doesn't support filtering, filter loaded data client-side (less ideal but functional for v1)
- **Pagination Reset** — Any filter change resets cursor to null and fetches fresh page 1
- **Signal-Based State** — Filter state stored as signals in list component, not in service
- **No URL State** — v1: filters are not persisted in URL query params (enhancement for later)

### Filter Implementation Options

**Option A: API-supported filtering (preferred)**
```typescript
// Service method extended to accept filter params
list(cursor?: string, limit?: number, filters?: Record<string, string>): Observable<PaginatedResponse<T>>

// Adds query params: GET /api/action-themes?status=published&cursor=xxx&limit=50
```

**Option B: Client-side filtering (fallback)**
```typescript
// Filter loaded items in component
filteredItems = computed(() => {
  const items = this.service.items();
  const statusFilter = this.statusFilter();
  if (!statusFilter) return items;
  return items.filter(item => item.status === statusFilter);
});
```

### Filter UI Specifications

- Filter bar: horizontal layout, `gap-3` spacing between filters
- Dropdowns: `surface-base` background, `stroke-standard` border, rounded
- Active filter: `brand-light` (#d9c8f5) background on active dropdown
- Clear button: text-only, `text-link` color, appears only when filters active
- Position: between page title and DataTable

### Available Filters by Entity

| Entity | Filter | Values | API Support |
|--------|--------|--------|-------------|
| Action Themes | Status | All, Draft, Published, Disabled | Verify |
| Funding Programs | TBD | Verify against API | Verify |

### Files Modified by This Story

```
src/app/features/action-themes/
├── action-theme-list.component.ts    ← add filter bar + logic
└── action-theme-list.component.html  ← add filter UI

src/app/features/funding-programs/
├── funding-program-list.component.ts  ← add filter bar + logic
└── funding-program-list.component.html ← add filter UI

src/app/core/api/
└── base-entity.service.ts            ← possibly extend list() to accept filter params
```

### Dependencies

- **Story 2.1**: Funding Program list component
- **Story 2.3**: Action Theme list component
- **Story 1.5**: DataTable component (may need minor updates for filter integration)

### What This Story Does NOT Create

- No full-text search (v1 uses dropdown filters only)
- No URL-persisted filter state
- No saved filter presets
- No multi-criteria combined filtering (if API doesn't support it)

### Anti-Patterns to Avoid

- DO NOT persist filter state in service — keep in component
- DO NOT fetch all pages to filter client-side — use API filtering if available
- DO NOT forget to reset pagination on filter change
- DO NOT show "no data" empty state when filters return empty — show "no matching results"

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.5] — Acceptance criteria
- [Source: _bmad-output/planning-artifacts/architecture.md#API Patterns] — Query param filtering
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#DataTable] — Filter UI placement
- [Source: _bmad-output/api-observations.md] — Pagination contract, query param support

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

Extended BaseEntityService.list() to accept optional filter params. Action Theme list has status filter dropdown (All/Draft/Published/Disabled). Funding Program list has active status filter (All/Active/Inactive). Filter changes reset pagination. Filtered empty state shows "No results match your filters" message with clear button.

### File List

- `src/app/core/api/base-entity.service.ts` (modified - added filters param to list())
- `src/app/features/action-themes/action-theme-list.component.ts` (modified - added status filter)
- `src/app/features/action-themes/action-theme-list.component.spec.ts` (modified - added filter tests)
- `src/app/features/funding-programs/funding-program-list.component.ts` (modified - added active filter)
- `src/app/features/funding-programs/funding-program-list.component.spec.ts` (modified - added filter tests)

### Change Log

- 2026-03-04: Story implemented — API-side filtering for both entities, filter UI with clear
