# Story 6.1: DataTable In-Column Multi-Select Filters

Status: ready-for-dev

## Story

As an admin user, I want to filter table data using multi-select dropdowns embedded in column headers, so that I can quickly narrow results without separate filter controls above the table.

## Acceptance Criteria

1. Filterable columns display a funnel icon (🔽) next to the sort indicator in the column header.
2. Clicking the funnel icon opens a popover/dropdown anchored to that column header.
3. The popover contains checkboxes for each available option, with a search input if > 10 options.
4. Multiple values can be selected simultaneously (multi-select).
5. Selected filters show a visual indicator on the column header (e.g., filled funnel icon, badge count).
6. Filters trigger server-side API calls (existing pattern — send query params). Client-side filtering is NOT used.
7. A "Clear" action in the popover resets that column's filter.
8. Existing above-table `<select>` filter dropdowns in list components are removed and replaced by the in-column approach.
9. Column sorting continues to work independently of filtering (sort indicator + filter icon coexist).
10. Filter state persists across pagination/infinite scroll loads.

## Tasks

- [ ] Task 1: Extend `ColumnDef` interface with `filterable?: boolean`, `filterKey?: string`, `filterOptions?: Signal<{ id: string; label: string }[]>` (AC: #1, #6)
- [ ] Task 2: Create `ColumnFilterPopoverComponent` — standalone popover with checkbox list, optional search input, apply/clear buttons (AC: #2, #3, #4, #7)
- [ ] Task 3: Add filter icon (lucide `Filter` or `ListFilter`) to `DataTable` header cells for filterable columns (AC: #1, #9)
- [ ] Task 4: Add `filterChange` output to `DataTableComponent` emitting `{ key: string; values: string[] }` (AC: #6)
- [ ] Task 5: Add active-filter visual indicator (filled icon or badge) on column headers with active filters (AC: #5)
- [ ] Task 6: Update `action-model-list` — move funding program filter into column config, remove above-table `<select>` (AC: #8)
- [ ] Task 7: Update `agent-list` — move status filter into column config, remove above-table `<select>` (AC: #8)
- [ ] Task 8: Ensure filter state persists across `loadMore()` infinite scroll calls (AC: #10)
- [ ] Task 9: Unit tests for `ColumnFilterPopoverComponent` and updated `DataTableComponent` filter logic
- [ ] Task 10: Verify sort + filter coexistence — clicking sort vs filter icon are distinct actions (AC: #9)

## Dev Notes

### Current Architecture
- Filters currently live in list components as `<select>` elements above the table (e.g., `action-model-list.component.ts:24-44`)
- Filter values are sent to `facade.load(filters)` as query params — this pattern stays
- `DataTable` currently only handles sorting in headers, not filtering
- Sort click targets the entire `<th>` — with filter icon, need to separate click zones

### Key Files
| File | Role |
|------|------|
| `src/app/shared/components/data-table/data-table.component.ts` | Add filter state, icon, popover trigger |
| `src/app/shared/components/data-table/data-table.component.html` | Add filter icon + popover in `<th>` |
| `src/app/shared/components/data-table/data-table.component.css` | Filter icon + active indicator styles |
| `src/app/shared/components/column-filter-popover/` | New component (popover with checkboxes) |
| `src/app/features/action-models/ui/action-model-list.component.ts` | Remove above-table filter, add column config |
| `src/app/features/agents/ui/agent-list.component.ts` | Remove above-table filter, add column config |

### Patterns to Follow
- Use Angular CDK Overlay or a simple absolutely-positioned div for the popover (CDK preferred for positioning)
- Popover should close on outside click and Escape key
- Filter options are provided by the parent list component via `filterOptions` signal on column config
- The `DataTable` emits filter changes; the list component calls `facade.load(buildFilters())` — same pattern as today
- Use lucide `ListFilter` icon (outline = no filter active, filled appearance = filter active)

### Anti-Patterns
- Do NOT implement client-side filtering — all filtering is server-side via API query params
- Do NOT create a global filter state service — keep filter state local to each list component
- Do NOT use Angular Material dialog/overlay — use CDK directly or simple CSS positioning
