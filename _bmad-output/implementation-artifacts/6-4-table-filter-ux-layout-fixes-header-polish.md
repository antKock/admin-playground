# Story 6.4: Table Filter UX, Layout Fixes & Header Polish

Status: done

## Story

As an operator using the admin dashboard, I want consistent in-column filtering across all tables, a usable empty state, and a clear header identity, so that I can efficiently navigate and filter data without layout issues or confusing UI elements.

## Acceptance Criteria

1. When table filters produce zero results, the table headers (with sort/filter icons) remain visible. The "no results" message and "clear filters" button appear inside the table body area, not as a replacement for the entire table.
2. The column filter popover is never clipped by the table container — it floats above content even when only one row is displayed or the table is short.
3. When multiple values are selected in a single column filter, the API query uses OR logic (comma-separated values: `?key=a,b`). This is already the case — verify, don't change.
4. The sort indicator (▲/▼/⇅) and the filter icon (funnel) appear directly adjacent in column headers with no visual gap between them.
5. In-column multi-select filters are available in **all** list tables that have a filter (migrate old external `<select>` dropdowns to in-column filters):
   - Funding Programs: filter `is_active` column (Actif / Inactif)
   - Action Themes: filter `status` column (Brouillon / Publié / Désactivé)
   - Indicator Models: filter `type` column (Texte / Nombre)
   - Folder Models: filter `funding_program_id` column (dynamic options from facade)
   - Agents: already done (status column)
   - Action Models: already done (funding program column)
   - Communities: no filter (API has no filter params)
6. The Action Models table additionally supports filtering by "Thème d'action" column, using `action_theme_id` as the filter key with options from `facade.atOptions()`.
7. The sidebar navigation label "Programmes de financement" is shortened to "Programmes".
8. The user avatar circle in the header is removed. The user's email (from JWT `payload.email`) is displayed as text. Add a dedicated `userEmail` computed signal to `AuthService`.
9. A help link (icon + "Aide" label or just icon) is added to the header that opens `https://actee.gitbook.io/actee/` in a new tab.
10. The old external `<select>` filter dropdowns are removed from all list components after migration to in-column filters.
11. All existing tests pass. New/modified components have test coverage.

## Tasks

- [x] Task 1: Fix empty state — move "no results" message inside `<app-data-table>` or always render the table and show the empty message in `<tbody>` (AC: #1)
- [x] Task 2: Fix popover overflow — ensure the column filter popover renders above container bounds (use `position: fixed` or CDK overlay strategy, or `overflow: visible` on table container) (AC: #2)
- [x] Task 3: Tighten sort + filter icon layout — remove gap between sort indicator and filter icon in `.th-content` (AC: #4)
- [x] Task 4: Add theme filter to Action Models — add `filterable: true`, `filterKey: 'action_theme_id'`, `filterOptions` from `facade.atOptions()` on the `action_theme_name` column (AC: #6)
- [x] Task 5: Migrate Funding Programs list to in-column filter — move `is_active` filter into column definition, remove external `<select>` (AC: #5, #10)
- [x] Task 6: Migrate Action Themes list to in-column filter — move `status` filter into column definition, remove external `<select>` (AC: #5, #10)
- [x] Task 7: Migrate Indicator Models list to in-column filter — move `type` filter into column definition, remove external `<select>` (AC: #5, #10)
- [x] Task 8: Migrate Folder Models list to in-column filter — move `funding_program_id` filter into column definition, remove external `<select>` (AC: #5, #10)
- [x] Task 9: Shorten nav label — change "Programmes de financement" to "Programmes" in `app-layout.component.ts` (AC: #7)
- [x] Task 10: Replace avatar with email — add `userEmail` computed signal to `AuthService`, remove `.user-avatar` div, display email text in header (AC: #8)
- [x] Task 11: Add help link — add a help icon/link in the header that opens `https://actee.gitbook.io/actee/` in a new tab (AC: #9)
- [x] Task 12: Verify OR filter logic — confirm comma-separated multi-select values produce correct API queries (AC: #3)
- [x] Task 13: Run all tests, fix any regressions (AC: #11)

## Dev Notes

### Current Architecture

**Old filter pattern** (Funding Programs, Action Themes, Indicator Models, Folder Models):
```html
<!-- External <select> above the table -->
<select (change)="onFilterChange($event)">
  <option value="">Tous les X</option>
  <option value="value1">Label 1</option>
</select>
```
Each uses a single `signal<string>` for filter state and calls `facade.load({ key: value })`.

**New filter pattern** (Action Models, Agents — already migrated):
```typescript
// Column definition with filterable flag
{ key: 'col', label: 'Label', filterable: true, filterKey: 'api_param', filterOptions: [...] }
```
Uses `signal<Record<string, string[]>>` for multi-value filter state, `buildFilters()` joins values with commas.

### Migration Pattern

For each old list component:
1. Remove the external `<select>` element from template
2. Change filter signal from `signal<string>` to `signal<Record<string, string[]>>({})`
3. Add `filterable: true`, `filterKey`, and `filterOptions` to the relevant column definition
4. Add `(filterChange)` handler on `<app-data-table>`
5. Add `hasActiveFilters()`, `clearFilters()`, `buildFilters()` methods (copy pattern from `action-model-list.component.ts`)
6. For static options (status, type, is_active), define `filterOptions` as a constant array
7. For dynamic options (funding_program_id), derive from `facade.fpOptions()` inside `computed()`

### Empty State Fix

Current: `@if (items.length === 0) { <div>no results</div> } @else { <app-data-table> }`

Target: Always render `<app-data-table>`. Add an `emptyMessage` input to DataTable. When `data().length === 0 && !isLoading()`, show the message inside `<tbody>` with a full-width `<td colspan>`.

### Popover Overflow Fix

The `column-filter-popover` uses `position: absolute` relative to the `<th>`. When the table is short (1 row), the popover gets clipped by the `.data-table` container's implicit `overflow: hidden` (from scroll behavior). Fix options:
- **Option A:** Set `overflow: visible` on `.data-table` and manage scroll separately
- **Option B:** Switch popover to `position: fixed` with manual coordinate calculation
- **Option C:** Use Angular CDK `Overlay` for proper portal-based positioning

Prefer the simplest approach (A or B) unless it causes scroll regressions.

### Header Changes

**Auth service** (`src/app/core/auth/auth.service.ts`):
```typescript
// Add new computed signal
readonly userEmail = computed(() => {
  const token = this._token();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.email ?? null;
  } catch {
    return null;
  }
});
```

**App layout** (`src/app/core/layout/app-layout.component.html`):
- Remove: `<div class="user-avatar">{{ userInitials() }}</div>`
- Change `userName()` display to show `userEmail()` instead
- Add: help icon link with `HelpCircle` lucide icon targeting `https://actee.gitbook.io/actee/`

### Filter Options Reference

| Table | Column | filterKey | filterOptions |
|-------|--------|-----------|---------------|
| Funding Programs | (new column or existing) | `is_active` | `[{ id: 'true', label: 'Actif' }, { id: 'false', label: 'Inactif' }]` |
| Action Themes | status | `status` | `[{ id: 'draft', label: 'Brouillon' }, { id: 'published', label: 'Publié' }, { id: 'disabled', label: 'Désactivé' }]` |
| Indicator Models | type_display | `type` | `[{ id: 'text', label: 'Texte' }, { id: 'number', label: 'Nombre' }]` |
| Folder Models | funding_programs_display | `funding_program_id` | Dynamic from `facade.fpOptions()` |
| Action Models (new) | action_theme_name | `action_theme_id` | Dynamic from `facade.atOptions()` |

### API Observations

**Document during implementation in `_bmad-output/api-observations.md`:**
- Whether `is_active` filter accepts comma-separated values (e.g., `?is_active=true,false` — may not make sense semantically)
- Whether `type` filter on indicator models accepts CSV
- Any unexpected backend behavior with multi-value filters

### Key Files

| File | Role |
|------|------|
| `src/app/shared/components/data-table/data-table.component.ts` | Add emptyMessage input, fix overflow |
| `src/app/shared/components/data-table/data-table.component.html` | Empty state in tbody, layout tweaks |
| `src/app/shared/components/data-table/data-table.component.css` | Overflow fix, icon gap fix |
| `src/app/shared/components/column-filter-popover/column-filter-popover.component.ts` | Possibly fix positioning strategy |
| `src/app/features/funding-programs/ui/funding-program-list.component.ts` | Migrate to in-column filter |
| `src/app/features/action-themes/ui/action-theme-list.component.ts` | Migrate to in-column filter |
| `src/app/features/indicator-models/ui/indicator-model-list.component.ts` | Migrate to in-column filter |
| `src/app/features/folder-models/ui/folder-model-list.component.ts` | Migrate to in-column filter |
| `src/app/features/action-models/ui/action-model-list.component.ts` | Add theme filter column |
| `src/app/core/layout/app-layout.component.ts` | Nav label, header changes |
| `src/app/core/layout/app-layout.component.html` | Avatar → email, help link |
| `src/app/core/auth/auth.service.ts` | Add userEmail signal |
| `_bmad-output/api-observations.md` | Document filter compatibility findings |

### Anti-Patterns

- Do NOT add client-side filtering — all filters must go through the API via `facade.load(filters)`
- Do NOT create a global filter state service — filters are component-local
- Do NOT use Angular CDK Overlay unless simpler CSS fixes fail for the popover
- Do NOT change the filter `values.join(',')` logic — it already produces OR semantics
- Do NOT add filters to the Communities table — the API has no filter params for it

## Dev Agent Record

### Implementation Plan

1. Added `emptyMessage` input and `clearFiltersClick` output to DataTableComponent
2. Added empty state row in `<tbody>` with full-width colspan when data is empty
3. Changed column-filter-popover from `position: absolute` to `position: fixed` with coordinate calculation from parent `<th>` rect
4. Removed `gap: 4px` from `.th-content` to tighten sort+filter icon spacing
5. Migrated 4 list components (funding-programs, action-themes, indicator-models, folder-models) from external `<select>` to in-column filter pattern
6. Added action_theme_id filter to action-model-list columns
7. Shortened nav label from "Programmes de financement" to "Programmes"
8. Added `userEmail` computed signal to AuthService, replaced avatar with email display in header
9. Added help link with HelpCircle icon to header
10. Updated all list components (including agents, communities) to use DataTable's built-in empty state
11. Removed `.user-avatar` CSS class

### Completion Notes

All 13 tasks completed. 461 tests pass (55 test files), including 4 new tests:
- `auth.service.spec.ts`: userEmail extraction from JWT, null when no token
- `data-table.component.spec.ts`: empty state with headers visible, emptyMessage rendering
- Updated `folder-model-list.component.spec.ts`: adapted to new filter pattern
- Updated `indicator-model-list.component.spec.ts`: adapted to new filter pattern
- Updated `app-layout.component.spec.ts`: replaced avatar test with help link test

## File List

- `src/app/shared/components/data-table/data-table.component.ts` (modified)
- `src/app/shared/components/data-table/data-table.component.html` (modified)
- `src/app/shared/components/data-table/data-table.component.css` (modified)
- `src/app/shared/components/data-table/data-table.component.spec.ts` (modified)
- `src/app/shared/components/column-filter-popover/column-filter-popover.component.ts` (modified)
- `src/app/features/funding-programs/ui/funding-program-list.component.ts` (modified)
- `src/app/features/action-themes/ui/action-theme-list.component.ts` (modified)
- `src/app/features/indicator-models/ui/indicator-model-list.component.ts` (modified)
- `src/app/features/indicator-models/ui/indicator-model-list.component.spec.ts` (modified)
- `src/app/features/folder-models/ui/folder-model-list.component.ts` (modified)
- `src/app/features/folder-models/ui/folder-model-list.component.spec.ts` (modified)
- `src/app/features/action-models/ui/action-model-list.component.ts` (modified)
- `src/app/features/agents/ui/agent-list.component.ts` (modified)
- `src/app/features/communities/ui/community-list.component.ts` (modified)
- `src/app/core/layout/app-layout.component.ts` (modified)
- `src/app/core/layout/app-layout.component.html` (modified)
- `src/app/core/layout/app-layout.component.css` (modified)
- `src/app/core/layout/app-layout.component.spec.ts` (modified)
- `src/app/core/auth/auth.service.ts` (modified)
- `src/app/core/auth/auth.service.spec.ts` (modified)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified)

## Change Log

- 2026-03-05: Story 6.4 implementation complete — empty state inside DataTable tbody, popover fixed positioning, icon gap removed, 4 list components migrated to in-column filters, action model theme filter added, nav label shortened, avatar replaced with email, help link added, all tests pass (461/461)
- 2026-03-05: Code review — 6 issues found and fixed:
  - [HIGH] Fixed DataTable filter state desync: `onClearFilters()` now resets internal `activeFilters` before emitting `clearFiltersClick`
  - [MEDIUM] Removed dead `userInitials` computed signal from AuthService (unused after avatar removal)
  - [MEDIUM] Popover now closes on scroll events to prevent stale `position: fixed` coordinates
  - [MEDIUM] Extracted shared `decodedPayload` computed signal in AuthService to avoid double JWT decode
  - [LOW] Added `type: 'date'` to community list `created_at` and `updated_at` columns for fr-FR formatting
  - [LOW] Added test for `clearFiltersClick` emission and internal state reset (462 tests pass)

