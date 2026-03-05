# Story 5.5: DataTable Sorting & Row Interactions

Status: done

## Story

As an operator (Alex/Sophie),
I want sortable columns, hover actions, and richer cell rendering in entity list tables,
so that I can find, identify, and act on entities efficiently without navigating to detail pages.

## Acceptance Criteria

1. **Given** a DataTable column is configured as sortable **When** the operator clicks the column header **Then** the table sorts by that column (ascending first, toggle to descending, toggle to unsorted) **And** a sort indicator arrow is visible on the active sort column
2. **Given** the operator hovers over a table row **When** the row has configured actions (e.g., duplicate, delete) **Then** action buttons appear in the last column with a fade-in transition **And** clicking an action triggers the corresponding operation
3. **Given** an entity has both `name` and `technical_label` fields **When** the DataTable renders the name column **Then** the display name is shown in bold and the technical name below in monospace gray text
4. **Given** a DataTable column references a foreign entity (e.g., Funding Program, Action Theme) **When** the table renders that column **Then** the entity name is shown as a clickable link that navigates to the referenced entity's detail page

## Tasks / Subtasks

- [x] Task 1: Add client-side column sorting to DataTable (AC: #1)
  - [x] Extend `ColumnDef` interface: added `sortable?: boolean`
  - [x] Add sort state signals: `sortColumn`, `sortDirection`
  - [x] Add `sortedData` computed with locale-aware string comparison
  - [x] Click handler cycles null → asc → desc → null
  - [x] Sort indicator arrows (▲/▼/⇅) in headers
  - [x] Replaced `data()` with `sortedData()` in template

- [x] Task 2: Add hover row actions (AC: #2)
  - [x] Created `RowAction` interface with label, icon, variant, handler
  - [x] Added `actions` input and `actionClick` output
  - [x] Action buttons render in last column, hidden by default, visible on row hover with opacity transition
  - [x] Action click uses stopPropagation to prevent rowClick
  - [x] Danger variant styling for destructive actions

- [x] Task 3: Rich cell rendering — dual-line name + technical_label (AC: #3)
  - [x] Added `'dual-line'` column type with `secondaryKey`
  - [x] Primary line in bold, secondary in monospace gray

- [x] Task 4: Linked foreign entity cells (AC: #4)
  - [x] Added `'link'` column type with `linkRoute` and `linkIdKey`
  - [x] Link cells render as clickable `<a>` with brand color
  - [x] `linkClick` output emits route and id for parent to handle navigation

- [x] Task 5: Update all list components to use new features (AC: #1-4)
  - [x] Action Models: sortable columns, dual-line name with technical_label
  - [x] Indicator Models: sortable columns, dual-line name with technical_label (removed separate column)
  - [x] Action Themes: sortable columns, dual-line name with technical_label (removed separate column)
  - [x] Funding Programs: sortable name and created_at
  - [x] Folder Models: sortable name and created_at
  - [x] Communities: sortable name, created_at, updated_at
  - [x] Agents: sortable name, email, agent_type, community_name, created_at

- [x] Task 6: Tests (AC: #1-4)
  - [x] Sorting: ascending/descending/reset on header click
  - [x] Sort indicator shows on sortable columns
  - [x] Non-sortable columns don't sort
  - [x] Dual-line renders primary and secondary text
  - [x] Link cells render and emit linkClick
  - [x] Action buttons render per row and emit actionClick without rowClick

## Dev Notes

### Architecture Compliance

- Modified DataTable component (TS + HTML + CSS) — backward compatible
- Updated 7 list components with new column configs
- No new files — all changes extend existing DataTable

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Updated indicator-model-list spec to match new column config (removed separate technical_label column)

### Completion Notes List

- Extended ColumnDef with sortable, dual-line, link, secondaryKey, linkRoute, linkIdKey
- Added RowAction interface and hover action buttons with stopPropagation
- Implemented client-side sorting with locale-aware comparison and 3-state toggle
- Updated all 7 list components with sortable columns and dual-line name rendering
- All 391 tests pass, zero regressions, build succeeds

### File List

- `src/app/shared/components/data-table/data-table.component.ts` — modified: sorting, actions, dual-line, link cell types
- `src/app/shared/components/data-table/data-table.component.html` — modified: sort headers, dual-line/link/action rendering
- `src/app/shared/components/data-table/data-table.component.css` — modified: sort, dual-line, link, action styles
- `src/app/shared/components/data-table/data-table.component.spec.ts` — modified: 14 tests covering all new features
- `src/app/features/action-models/ui/action-model-list.component.ts` — modified: sortable + dual-line columns
- `src/app/features/indicator-models/ui/indicator-model-list.component.ts` — modified: sortable + dual-line columns
- `src/app/features/indicator-models/ui/indicator-model-list.component.spec.ts` — modified: updated column key expectations
- `src/app/features/action-themes/ui/action-theme-list.component.ts` — modified: sortable + dual-line columns
- `src/app/features/funding-programs/ui/funding-program-list.component.ts` — modified: sortable columns
- `src/app/features/folder-models/ui/folder-model-list.component.ts` — modified: sortable columns
- `src/app/features/communities/ui/community-list.component.ts` — modified: sortable columns
- `src/app/features/agents/ui/agent-list.component.ts` — modified: sortable columns

## Change Log

- 2026-03-05: Added column sorting, hover actions, dual-line cells, and link cells to DataTable; updated all 7 list components
