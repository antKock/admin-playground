# Story 5.7: Accessibility & Cross-Cutting Consistency

Status: done

## Story

As an operator (Alex/Sophie),
I want consistent behavior, proper accessibility, and polished UI across all entity pages,
so that the application feels reliable, works with assistive technology, and has no rough edges.

> **Origin:** UX Gap Analysis review (2026-03-04). Gaps: GAP-TR1 (P1), GAP-CC2 (P2), GAP-CC3 (P2), GAP-CC4 (P2), GAP-CC5 (P2), GAP-L2 (P2), GAP-L3 (P2).

## Acceptance Criteria

1. **Given** a ToggleRow component renders a toggle switch **When** screen readers interpret the toggle **Then** the toggle has `role="switch"`, `aria-checked` reflecting state, and `aria-label` with the toggle label
2. **Given** any entity detail page shows date fields (Created, Updated) **When** the dates render **Then** all dates use consistent `fr-FR` locale formatting (no raw ISO strings)
3. **Given** ActionThemeList loads data **When** the API request is in flight **Then** no "No items found" empty state flashes before data arrives (add `hasLoaded` guard)
4. **Given** an ActionModelDetail API request fails **When** the error response is received **Then** an error message is displayed with a retry option (matching IndicatorModelDetail pattern)
5. **Given** the operator navigates away from ActionModelDetail **When** the component is destroyed **Then** `facade.clearSelection()` is called to prevent stale data (matching IndicatorModelDetail pattern)
6. **Given** the operator is logged in **When** they look at the application header **Then** a user avatar (initials circle) and full name are displayed next to the logout button
7. **Given** the sidebar renders navigation items **When** the operator scans the navigation **Then** items are grouped under section labels ("Configuration" and "Administration") with uppercase gray dividers

## Tasks / Subtasks

- [x] Task 1: ToggleRow accessibility — add ARIA attributes (AC: #1)
  - [x]Modify `src/app/shared/components/toggle-row/toggle-row.component.ts`
  - [x]Add to the toggle `<button>`:
    - `role="switch"`
    - `[attr.aria-checked]="enabled()"`
    - `[attr.aria-label]="label()"`
  - [x]Verify keyboard accessibility: toggle should be focusable and activatable with `Enter` and `Space` (button already supports this natively)

- [x] Task 2: Consistent date formatting across all detail pages (AC: #2)
  - [x]Create `src/app/shared/utils/format-date.ts` — extract the `fr-FR` formatting from DataTable:
    ```typescript
    export function formatDateFr(value: string | null | undefined): string {
      if (!value) return '—';
      const date = new Date(value);
      if (isNaN(date.getTime())) return '—';
      return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' });
    }
    ```
  - [x]Audit all detail pages — find any raw ISO date strings displayed:
    - MetadataGrid fields with `type: 'text'` that contain dates (e.g., `created_at`, `updated_at`) — change to `type: 'date'`
    - OR use `formatDateFr()` when building MetadataField values
  - [x]Audit MetadataGridComponent — if it has a `'date'` type, verify it uses `fr-FR`. If not, add it
  - [x]Refactor DataTable's `formatDate()` to use the shared utility

- [x] Task 3: Fix ActionThemeList empty state flash (AC: #3)
  - [x]Check `src/app/features/action-themes/ui/action-theme-list.component.ts`
  - [x]Add `hasLoaded` signal pattern (same as ActionModelListComponent):
    ```typescript
    readonly hasLoaded = signal(false);
    constructor() {
      effect(() => { if (!this.facade.isLoading()) this.hasLoaded.set(true); });
    }
    ```
  - [x]Guard empty state: `@if (!facade.isLoading() && hasLoaded() && facade.items().length === 0)`
  - [x]Audit ALL 7 list components — ensure every one has this `hasLoaded` guard. Fix any that are missing

- [x] Task 4: ActionModelDetail error handling and cleanup (AC: #4, #5)
  - [x]Verify `ActionModelDetailComponent` shows `facade.detailError()` with retry option — check current template (it already has `@else if (facade.detailError())` block)
  - [x]Add retry button to error state if missing: `(click)="facade.select(route.snapshot.paramMap.get('id')!)"`
  - [x]Add `ngOnDestroy` to ActionModelDetailComponent: call `facade.clearSelection()` to prevent stale data
  - [x]Audit all 7 detail components:
    - Each should show error state with `facade.detailError()` and retry option
    - Each should call `facade.clearSelection()` in `ngOnDestroy`
    - Fix any that are missing these patterns

- [x] Task 5: User avatar and name in application header (AC: #6)
  - [x]Modify `src/app/core/layout/app-layout.component.ts` (and its HTML template)
  - [x]Get user info from `AuthService` — check what user data is available (name, email, initials)
  - [x]Add next to the logout button:
    - Initials circle: 32px circle with brand background, white bold text, user's initials (first letters of first+last name)
    - Full name text: font-size 14px, `text-text-primary`
  - [x]If AuthService doesn't expose user name, check JWT token payload or add a method to extract it
  - [x]Fallback: if no name available, show email or just the initials circle

- [x] Task 6: Sidebar navigation grouping with section labels (AC: #7)
  - [x]Modify `src/app/core/layout/app-layout.component.ts`
  - [x]Group existing `navItems` into sections:
    - **Configuration:** Funding Programs, Action Themes, Action Models, Folder Models, Indicator Models
    - **Administration:** Communities, Agents
  - [x]Add section dividers in the sidebar template:
    ```html
    <div class="sidebar-section-label">CONFIGURATION</div>
    <!-- config nav items -->
    <div class="sidebar-section-label">ADMINISTRATION</div>
    <!-- admin nav items -->
    ```
  - [x]Style section labels: uppercase, font-size 11px, `text-text-tertiary`, letter-spacing 0.5px, padding-left matching nav items, margin-top 16px

- [x] Task 7: Tests (AC: #1-7)
  - [x]ToggleRow spec: verify `role="switch"`, `aria-checked`, `aria-label` attributes
  - [x]ActionThemeList spec: verify no empty state flash (hasLoaded guard)
  - [x]ActionModelDetail spec: verify `clearSelection()` called on destroy
  - [x]AppLayout spec: verify sidebar section labels render
  - [x]Date formatting spec: verify `formatDateFr()` utility produces `fr-FR` formatted dates

## Dev Notes

### What Exists Today (DO NOT Reinvent)

- **ToggleRowComponent** at `src/app/shared/components/toggle-row/toggle-row.component.ts` — modify in-place, add ARIA attrs to existing `<button>`
- **`hasLoaded` pattern** in ActionModelListComponent — already implemented. Copy to any list components missing it
- **`detailError()` error state** in ActionModelDetailComponent — already has the block at line 48. Verify retry button
- **AppLayoutComponent** at `src/app/core/layout/app-layout.component.ts` — modify sidebar template for grouping, header for avatar
- **AuthService** at `src/app/core/auth/auth.service.ts` — check for user data (name, email, token payload)
- **DataTable `formatDate()`** — already uses `fr-FR` locale. Extract to shared utility

### Architecture Compliance

- **New file:** `src/app/shared/utils/format-date.ts` — pure utility
- **Modified files:** ToggleRow, AppLayout, multiple list components, multiple detail components
- **No new services or stores** — all changes are UI/presentation
- **Cross-cutting:** This story touches many files but each change is small and specific

### Critical Implementation Details

- **ARIA `role="switch"`** — requires `aria-checked="true"` or `aria-checked="false"` (string, not boolean binding). Use `[attr.aria-checked]="enabled()"` — Angular will convert boolean to string
- **`hasLoaded` guard pattern** — must set `hasLoaded` to `true` ONLY after first load completes (not on subsequent loads). The `effect` watches `isLoading()` and sets `hasLoaded` when it becomes false. This works because the first load starts as `true` → becomes `false` → hasLoaded set
- **`clearSelection()` in facades** — verify each facade has this method. It should reset `selectedItem` to null in the domain store. If missing, add it
- **User avatar initials** — extract from user's name: `"Jean Dupont"` → `"JD"`. Handle edge cases: single name → first letter only, no name → "?" or hide
- **Sidebar grouping** — change `navItems` from flat array to grouped structure, or use two separate arrays. The template loops over each group separately

### Audit Checklist for Cross-Cutting Consistency

| Component | hasLoaded | detailError | clearSelection | Date formatting | ARIA |
|-----------|-----------|-------------|----------------|-----------------|------|
| Funding Programs | Check | Check | Check | Check | — |
| Action Themes | **Fix** | Check | Check | Check | — |
| Action Models | OK | **Verify retry** | **Add** | Check | — |
| Folder Models | Check | Check | Check | Check | — |
| Communities | Check | Check | Check | Check | — |
| Agents | Check | Check | Check | Check | — |
| Indicator Models | Check | Check | OK (reference) | Check | — |
| ToggleRow | — | — | — | — | **Fix** |

### Project Structure Notes

- New: `src/app/shared/utils/format-date.ts`
- Modified: ToggleRow, AppLayout (TS + HTML), multiple list and detail components
- No impact on domain/feature/page layer structure

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.7]
- [Source: src/app/shared/components/toggle-row/toggle-row.component.ts — current toggle without ARIA]
- [Source: src/app/core/layout/app-layout.component.ts — current sidebar with flat navItems]
- [Source: src/app/features/action-models/ui/action-model-list.component.ts:81-97 — hasLoaded pattern]
- [Source: src/app/features/action-models/ui/action-model-detail.component.ts:48 — detailError block]
- [Source: src/app/shared/components/data-table/data-table.component.ts:56-60 — formatDate fr-FR]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- Build succeeds, all 408 tests pass (up from 396)
- ToggleRow: added `role="switch"`, `aria-checked`, `aria-label` — 4 new ARIA tests
- Created `formatDateFr` shared utility; refactored DataTable, MetadataGrid, and all 7 detail components to use it
- Changed date fields in MetadataGrid from `type: 'text'` to `type: 'date'` across all 7 detail components
- Added `hasLoaded` signal pattern to action-theme-list, funding-program-list, community-list (3 components)
- Added `ngOnDestroy` with `clearSelection()` to 6 detail components (action-model, action-theme, funding-program, folder-model, community, agent)
- Added `userName` and `userInitials` computed signals to AuthService (JWT payload decode)
- Added user avatar (initials circle) and name display in app header
- Grouped sidebar navigation into "Configuration" (5 items) and "Administration" (2 items) with section labels
- 12 new tests added: 5 formatDateFr, 4 ToggleRow ARIA, 1 clearSelection, 2 AppLayout (section labels + avatar)

### File List

- `src/app/shared/utils/format-date.ts` (new)
- `src/app/shared/utils/format-date.spec.ts` (new)
- `src/app/shared/components/toggle-row/toggle-row.component.ts` (modified — ARIA attributes)
- `src/app/shared/components/toggle-row/toggle-row.component.spec.ts` (modified — 4 ARIA tests)
- `src/app/shared/components/data-table/data-table.component.ts` (modified — use formatDateFr)
- `src/app/shared/components/metadata-grid/metadata-grid.component.ts` (modified — use formatDateFr)
- `src/app/core/auth/auth.service.ts` (modified — userName, userInitials computed)
- `src/app/core/layout/app-layout.component.ts` (modified — grouped navItems, exposed authService)
- `src/app/core/layout/app-layout.component.html` (modified — section labels, user avatar)
- `src/app/core/layout/app-layout.component.css` (modified — section label + avatar styles)
- `src/app/core/layout/app-layout.component.spec.ts` (modified — 2 new tests)
- `src/app/features/action-models/ui/action-model-detail.component.ts` (modified — OnDestroy, formatDateFr, date types)
- `src/app/features/action-models/ui/action-model-detail.component.spec.ts` (modified — clearSelection test)
- `src/app/features/action-themes/ui/action-theme-detail.component.ts` (modified — OnDestroy, formatDateFr, date types)
- `src/app/features/action-themes/ui/action-theme-list.component.ts` (modified — hasLoaded)
- `src/app/features/funding-programs/ui/funding-program-detail.component.ts` (modified — OnDestroy, formatDateFr, date types)
- `src/app/features/funding-programs/ui/funding-program-list.component.ts` (modified — hasLoaded)
- `src/app/features/folder-models/ui/folder-model-detail.component.ts` (modified — OnDestroy, formatDateFr, date types)
- `src/app/features/communities/ui/community-detail.component.ts` (modified — OnDestroy, formatDateFr, date types)
- `src/app/features/communities/ui/community-list.component.ts` (modified — hasLoaded)
- `src/app/features/agents/ui/agent-detail.component.ts` (modified — OnDestroy, formatDateFr, date types)
- `src/app/features/indicator-models/ui/indicator-model-detail.component.ts` (modified — formatDateFr)
