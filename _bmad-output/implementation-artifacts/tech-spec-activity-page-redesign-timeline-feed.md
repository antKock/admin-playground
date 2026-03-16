---
title: 'Activity Page Redesign — Timeline Feed'
slug: 'activity-page-redesign-timeline-feed'
created: '2026-03-13'
status: 'completed'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['Angular 21', 'Signals', 'Standalone Components', 'ACTEE Pattern', 'NgRx Signal Store', 'Tailwind CSS v4']
files_to_modify:
  - 'src/app/core/auth/auth.service.ts'
  - 'src/app/domains/history/history.models.ts'
  - 'src/app/domains/history/history.utils.ts'
  - 'src/app/domains/history/history.store.ts'
  - 'src/app/features/activity-feed/activity-feed.facade.ts'
  - 'src/app/features/activity-feed/ui/activity-feed-page.component.ts'
  - 'src/app/pages/activity/activity.routes.ts'
code_patterns: ['ACTEE (facade → store → API)', 'Signals (signal, computed, input, output)', 'Standalone components', 'NgRx signalStore with patch helper']
test_patterns: ['vitest via Angular builder', 'npx ng test --no-watch', 'spec files co-located with source']
---

# Tech-Spec: Activity Page Redesign — Timeline Feed

**Created:** 2026-03-13

## Overview

### Problem Statement

The current Activity page is a flat DataTable with 7 columns (Date, User, Action, Type, Entity, Parent, Summary) that provides no narrative, no visual hierarchy, and no way to quickly understand what other admins changed. Specific problems:

1. **No "catch-up" experience** — admins can't see what happened since their last visit
2. **Wall of rows** — every activity is the same visual weight, no grouping by day or user session
3. **Indicator instance noise** — indicator changes on Actions show as standalone rows instead of rolling up under the parent Action
4. **No Admin/User separation** — admin config objects (programmes, themes, models) mixed with operational user objects (actions, folders, buildings)
5. **Entity naming inconsistency** — some entities show UUIDs instead of human-readable display names
6. **Filters require prior knowledge** — 3 dropdowns + date picker assume the admin knows what to look for

### Solution

Replace the existing DataTable-based Activity page with a timeline card feed. The page uses a single continuous timeline with:
- **Admin / User scope pill toggle** filtering by entity type category
- **"Hide my actions" toggle** to focus on other admins' changes
- **"Last visit" visual separator** showing where the admin left off
- **Day-based grouping** with time-proximity grouping within days
- **Indicator instance rollup** under parent Action cards (User scope only)
- **Quick actions on hover** for View State and Compare

**Visual reference:** Static mockup at `/activity/mockup` (`activity-feed-mockup.component.ts`). **Dev MUST match this mockup's visual output exactly.**

### Scope

**In Scope:**
1. Replace existing DataTable activity page with timeline card feed
2. Admin / User scope pill toggle (filtering by entity type category)
3. "Hide my actions" toggle (filters by current user_id)
4. "Last visit" visual separator with `localStorage`-persisted timestamp
5. Day-based grouping (Aujourd'hui, Hier, date labels)
6. Time-based grouping within days (same user + entity within 1min window — reuse existing `groupByTime()`)
7. Indicator instance rollup under parent Action cards (User scope only, using `parent_entity_type`/`parent_entity_id`)
8. Quick actions on hover (View state / Compare — reuse existing detail panel logic)
9. Entity naming consistency — always use `entity_display_name`
10. Remove dead code from old DataTable implementation (old columns, old filter dropdowns, orphaned imports)

**Out of Scope:**
- Notification badge in nav sidebar (future — `/activities/count` endpoint exists)
- Backend changes
- Entity detail page activity tabs (unchanged — `ActivityListComponent`)
- New API endpoints
- Additional filter dropdowns on the new page (entity type, action type, date — remove these)

## Context for Development

### UX Decisions (from Party Mode — PM + UX Designer, 2026-03-13)

| Decision | Detail |
| ---- | ------- |
| Single timeline | No tabs. One continuous feed with controls. |
| "Last visit" separator | Dashed line with timestamp. `localStorage` key: `activity-last-visit-{userId}`. Updated on page load AFTER rendering the marker position. |
| Hide my actions toggle | When ON, filters out activities where `user_id` matches current user. When OFF, own actions still appear but visually distinct (opacity 60%, `border-border/50 bg-surface-subtle`). |
| Admin / User pill | Two-state toggle. Defaults to **Admin**. Maps to entity type sets defined below. |
| Timeline cards, not table | Each activity = card with: who (bold), when (time), action badge (color-coded), entity type (grey label), entity name (bold, always human-readable), changes summary, child rollups. |
| Day headers | "Aujourd'hui", "Hier", "Lundi 10 mars", etc. French locale date formatting. |
| Time grouping | Reuse existing `groupByTime()` — same entity + user within 1min window. |
| Indicator instance rollup | **User scope only.** When `entity_type` is an indicator instance AND `parent_entity_type === 'Action'` → collapse under parent Action card as "N indicateurs modifiés". |
| Quick actions | 👁 View state / ⇄ Compare — hover-visible icons on each card (`opacity-0 group-hover:opacity-100`). Reuse existing `entityStateAtDate()` and `compareEntityVersions()` API calls + detail panel. |
| Entity naming | Always use `entity_display_name`. Never show UUIDs in card text. |

### Entity Type Categorization

```typescript
// Admin config objects
const ADMIN_ENTITY_TYPES = new Set([
  'FundingProgram', 'ActionTheme', 'ActionModel', 'FolderModel',
  'IndicatorModel', 'User', 'Community',
]);

// User operational objects
const USER_ENTITY_TYPES = new Set([
  'Action', 'Folder', 'Agent', 'Site', 'Building', 'Indicator',
]);
```

### Codebase Patterns

- **ACTEE pattern**: Component → Facade → Store → API → HTTP
- **Signals**: All state management uses Angular signals (`signal`, `computed`, `input`, `output`)
- **Standalone components**: No NgModules
- **Path aliases**: `@app/`, `@shared/`, `@domains/`, `@features/`, `@core/`
- **NgRx signalStore**: `GlobalHistoryStore` uses `signalStore()` with `withState`, `withMethods`, `withProps`
- **Store patch helper**: `patch(store, { ... })` from `@domains/shared/store.utils`
- **Date formatting**: `formatDateFr()` from `@app/shared/utils/format-date`
- **Design tokens**: Tailwind v4 `@theme` directive in `src/styles.css` — colors like `text-text-primary`, `bg-surface-muted`, `border-border`, `bg-brand`, `text-status-done`, etc.

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `src/app/features/activity-feed/ui/activity-feed-mockup.component.ts` | **Static mockup — THE visual target.** Dev must match this exactly. |
| `src/app/features/activity-feed/ui/activity-feed-page.component.ts` | **Current implementation to REPLACE.** Contains detail panel logic (View State / Compare) to carry over. |
| `src/app/features/activity-feed/activity-feed.facade.ts` | Facade exposing GlobalHistoryStore. Will need scope and hide-own signals. |
| `src/app/domains/history/history.store.ts` | `GlobalHistoryStore` (root singleton). Store layer unchanged. |
| `src/app/domains/history/history.api.ts` | API functions: `globalActivityLoader()`, `entityStateAtDate()`, `compareEntityVersions()`. **No changes needed.** |
| `src/app/domains/history/history.models.ts` | `ActivityResponse`, `ActivityFilters`, `EntityTypeCategory`, `TimeGroup`. Needs updated scope type. |
| `src/app/domains/history/history.utils.ts` | `groupByTime()`, `filterByCategory()`, `actionLabel()`, `actionBadgeClass()`. Needs new utilities. |
| `src/app/core/auth/auth.service.ts` | Auth service. Needs `userId` computed from JWT payload. |
| `src/app/core/api/generated/api-types.ts` | `ActivityResponse` schema: `user_id`, `user_name`, `entity_type`, `entity_display_name`, `parent_entity_type`, `parent_entity_id`, `parent_entity_name`, `changes_summary`, `created_at`. |

### Technical Decisions

- **"Last visit" timestamp**: Stored in `localStorage` with key `activity-last-visit-{userId}`. On page init, read the stored timestamp, use it to position the separator, THEN update it to `now`. The `userId` comes from a new `userId` computed on `AuthService` (decoded from JWT `sub` field).
- **No new API calls**: The existing `globalActivityLoader()` with filters is sufficient. The `/activities/since` endpoint is useful for a future notification badge, but the timeline uses the regular endpoint and draws the separator client-side.
- **Indicator rollup is client-side grouping**: After fetching and filtering activities, group where `parent_entity_type === 'Action'` and entity type is in `USER_ENTITY_TYPES` (specifically indicator instances). Display as child summary lines under the parent Action card.
- **Admin/User scope filter**: Client-side filtering on `entity_type` using `ADMIN_ENTITY_TYPES` and `USER_ENTITY_TYPES` sets. If the API adds a `category` param later, this can be moved server-side.
- **Detail panel reuse**: The existing side panel (View State / Compare) from `activity-feed-page.component.ts` is carried over. Only the trigger changes (hover icon on card instead of table row action button).
- **Dead code removal**: Remove the old `columns` array, `tableActions` array, `DataTableComponent` import, `FormsModule` import, old filter dropdowns (entity type `<select>`, action type `<select>`, date `<input>`), old `rows` computed with `date_display`/`action_display`/`entity_type_display` mapping, old `CATEGORY_OPTIONS` (all/models/instances), and `filterByCategory()` that used the old categories.

## Implementation Plan

### Tasks

- [x] Task 1: Add `userId` computed to AuthService
  - File: `src/app/core/auth/auth.service.ts`
  - Action: Add a `userId` computed signal that extracts `sub` (or `id`) from the decoded JWT payload, following the existing `userName` and `userEmail` pattern.
  - Notes: The JWT `sub` field is the standard claim for user ID. Check the decoded payload structure. This is needed for the "hide my actions" filter and the `localStorage` key.

- [x] Task 2: Update domain models and entity type sets
  - File: `src/app/domains/history/history.models.ts`
  - Action: Replace `EntityTypeCategory = 'all' | 'models' | 'instances'` with `ActivityScope = 'admin' | 'user'`. Keep all other types unchanged.
  - File: `src/app/domains/history/history.utils.ts`
  - Action:
    1. Replace `MODEL_ENTITY_TYPES` set and `CATEGORY_OPTIONS` with `ADMIN_ENTITY_TYPES` and `USER_ENTITY_TYPES` sets (see Entity Type Categorization above).
    2. Replace `filterByCategory()` with `filterByScope(activities, scope: ActivityScope)` that filters on the new sets.
    3. Add `groupByDay(activities): DayGroup[]` utility — groups activities by calendar day, returns `{ label: string, date: string, activities: ActivityResponse[] }[]`. Labels: "Aujourd'hui", "Hier", or French-formatted date ("Lundi 10 mars"). Use `fr-FR` locale.
    4. Add `rollupIndicators(activities): ActivityWithChildren[]` utility — for User scope, collapses indicator-instance activities under their parent Action. Returns activities with an optional `children: { label: string, count: number }[]` array. Matching: `parent_entity_type === 'Action'` and `entity_type` in `USER_ENTITY_TYPES` (the indicator instance types — `Indicator` specifically). Standalone activities pass through unchanged.
    5. Keep existing `groupByTime()`, `actionLabel()`, `actionBadgeClass()`, `entityRoute()`, `ENTITY_TYPE_OPTIONS`, `ENTITY_TYPE_LABELS`, `ACTION_TYPE_OPTIONS` — these are used by `ActivityListComponent` on entity detail pages.
  - Notes: Export a new `ActivityWithChildren` interface from `history.models.ts`: `ActivityResponse & { children?: { label: string; count: number }[] }`. Also export `DayGroup` interface: `{ label: string; date: string; activities: ActivityWithChildren[] }`.

- [x] Task 3: Update facade with scope and hide-own signals
  - File: `src/app/features/activity-feed/activity-feed.facade.ts`
  - Action:
    1. Add `scope = signal<ActivityScope>('admin')` and `hideOwnActions = signal(false)` as public signals.
    2. Add `currentUserId` — inject `AuthService` and expose `authService.userId()`.
    3. Add `filteredActivities = computed(() => ...)` that pipes `this.activities()` through `filterByScope()` → (if User scope) `rollupIndicators()` → (if hideOwnActions) filter out `user_id === currentUserId`.
    4. Add `lastVisitTimestamp = signal<string | null>(null)` — read from `localStorage` on init, updated by component after render.
  - Notes: Keep existing `load()`, `loadMore()`, `reset()` methods unchanged — they delegate to `GlobalHistoryStore`. The filtering is layered on top via computeds.

- [x] Task 4: Rewrite the page component as timeline feed
  - File: `src/app/features/activity-feed/ui/activity-feed-page.component.ts`
  - Action: **Full rewrite.** Replace the entire template and class. Follow the mockup (`activity-feed-mockup.component.ts`) as the visual reference. Specific changes:
    1. **Remove**: `DataTableComponent` import, `FormsModule` import, `columns` array, `tableActions` array, `filterEntityType`/`filterAction`/`filterSince` signals, `filteredActivities` computed (moved to facade), `rows` computed, `onRowClick()`, old filter event handlers, `categoryOptions`/`entityTypeOptions`/`actionTypeOptions` references.
    2. **Keep and adapt**: `detailPanel` signal, `DetailPanel` interface, `detailErrorMessage()`, `onViewState()`, `onCompare()`, `closeDetail()`, `onBackdropClick()`, `objectEntries()`, `formatValue()`, `isChangePair()`, `asChangePair()` — these power the side panel overlay which remains.
    3. **Template structure** (match mockup exactly):
       - Page title: `<h1>Activité</h1>`
       - Controls bar: Admin/User pill toggle (bound to `facade.scope`) + "Masquer mes actions" toggle (bound to `facade.hideOwnActions`)
       - Timeline: iterate `dayGroups()` computed → day header (`<h2>` with label) → activity cards within each day
       - Each card: `group` class on container, user name (bold) + time, action badge + entity type label + entity name, changes summary, child rollups (indicator lines), hover quick-action icons (Eye, GitCompareArrows)
       - Own-action styling: `border-border/50 bg-surface-subtle opacity-60` when `activity.user_id === currentUserId` and `hideOwnActions` is OFF
       - "Last visit" separator: dashed line with brand color, positioned after the last activity that is newer than `lastVisitTimestamp`
       - "Charger plus" button at bottom (bound to `facade.hasMore`)
       - Detail panel overlay (carried over from current implementation)
    4. **New computeds in component**:
       - `dayGroups = computed(() => groupByDay(facade.filteredActivities()))` — applies day grouping
       - `currentUserId` — from facade
       - `lastVisitTimestamp` — from facade
    5. **Lifecycle**:
       - `ngOnInit`: Read `localStorage` last-visit timestamp → set on facade → call `facade.load()` → after first render, update `localStorage` to `new Date().toISOString()`
       - `ngOnDestroy`: Call `facade.reset()`
  - Notes: The mockup component at `activity-feed-mockup.component.ts` has the exact Tailwind classes, card structure, pill toggle, separator styling, and hover behavior. Copy the template patterns directly. The mockup uses hardcoded data — this task wires it to real data via the facade.

- [x] Task 5: Update route config and remove mockup route
  - File: `src/app/pages/activity/activity.routes.ts`
  - Action: Remove the `/mockup` child route and `ActivityFeedMockupComponent` import. The mockup was a design reference — it should not ship to production. Keep the default route pointing to the rewritten `ActivityFeedPageComponent`.
  - Notes: The mockup file (`activity-feed-mockup.component.ts`) can remain in the codebase as a reference but should not be routed.

- [x] Task 6: Dead code cleanup
  - File: `src/app/domains/history/history.utils.ts`
  - Action: Remove `CATEGORY_OPTIONS` (the old all/models/instances array) and the old `filterByCategory()` function. Remove `MODEL_ENTITY_TYPES` set. Keep `ENTITY_TYPE_OPTIONS`, `ENTITY_TYPE_LABELS`, `ACTION_TYPE_OPTIONS` — these are still used by `ActivityListComponent`.
  - File: `src/app/domains/history/history.models.ts`
  - Action: Remove `EntityTypeCategory` type (replaced by `ActivityScope`). Remove `ParentChildGroup` interface (no longer used — replaced by `ActivityWithChildren`).
  - File: `src/app/features/activity-feed/ui/activity-feed-page.component.ts`
  - Action: Verify no old imports remain (`DataTableComponent`, `FormsModule`, `ColumnDef`, `RowAction`). Verify no old filter signals remain.
  - Notes: Run `npx ng build` to verify no broken imports across the codebase. Check that `ActivityListComponent` (entity detail pages) still works — it uses `HistoryStore` (not `GlobalHistoryStore`) and `groupByTime()` which are NOT modified.

- [x] Task 7: Update tests
  - File: `src/app/domains/history/history.utils.spec.ts`
  - Action: Add tests for `filterByScope()`, `groupByDay()`, `rollupIndicators()`. Remove tests for old `filterByCategory()` and `CATEGORY_OPTIONS`.
  - File: `src/app/domains/history/history.store.spec.ts` / `src/app/domains/history/global-history.store.spec.ts`
  - Action: Verify existing store tests still pass (no store changes expected).
  - File: `src/app/shared/components/activity-list/activity-list.component.spec.ts`
  - Action: Verify existing tests still pass (this component is unchanged).
  - Notes: Run `npx ng test --no-watch` for full test suite. Run `npx ng build` for compilation check.

### Acceptance Criteria

- [ ] AC 1: Given the Activity page loads, when the admin views the page, then activities are displayed as timeline cards grouped by day with headers ("Aujourd'hui", "Hier", or French-formatted dates), NOT as a DataTable.
- [ ] AC 2: Given the admin toggles "Administration" / "Utilisateurs" pill, when "Administration" is selected, then only admin entity types are shown (FundingProgram, ActionTheme, ActionModel, FolderModel, IndicatorModel, User, Community). When "Utilisateurs" is selected, then only user entity types are shown (Action, Folder, Agent, Site, Building, Indicator). Default is "Administration".
- [ ] AC 3: Given the admin toggles "Masquer mes actions", when ON, then activities where `user_id` matches the current authenticated user are hidden. When OFF, own actions are visible but styled with reduced opacity (60%) and muted border.
- [ ] AC 4: Given the admin has visited the page before, when the page loads, then a dashed separator line with brand color appears between activities that are newer vs older than the last visit timestamp, with label "Dernière visite · {formatted date}".
- [ ] AC 5: Given the admin visits the page, when it finishes loading, then the `localStorage` last-visit timestamp is updated to `now` (so the next visit will show the new separator position).
- [ ] AC 6: Given the "Utilisateurs" scope is active, when indicator instance activities have `parent_entity_type === 'Action'`, then they are rolled up under their parent Action card as child summary lines (e.g., "3 indicateurs modifiés"), NOT shown as separate cards.
- [ ] AC 7: Given any activity card, when the admin hovers over it, then "View state" (Eye icon) and "Compare" (GitCompareArrows icon) action buttons appear. Clicking them opens the existing detail side panel with entity state snapshot or version comparison.
- [ ] AC 8: Given any activity card, when displayed, then the entity name shown is always `entity_display_name` (human-readable), never a UUID.
- [ ] AC 9: Given the old DataTable implementation, when the redesign is complete, then no dead code remains: no `DataTableComponent` import, no `columns`/`tableActions` arrays, no old filter dropdowns (entity type select, action type select, date input), no `FormsModule` import, no old `CATEGORY_OPTIONS`/`filterByCategory()`.
- [ ] AC 10: Given the entity detail pages (ActionModel, Agent, Community, etc.), when viewing their Activity tab, then `ActivityListComponent` continues to work unchanged — it uses `HistoryStore` (not `GlobalHistoryStore`) and `groupByTime()` which are preserved.

## Additional Context

### Dependencies

- No backend changes required
- No new API endpoints needed
- Existing `ActivityResponse` schema has all required fields (`user_id`, `parent_entity_type`, `parent_entity_id`, `entity_display_name`)
- `AuthService` needs a `userId` computed (Task 1) — derived from JWT `sub` claim in the already-decoded payload

### Testing Strategy

- **Unit tests** for new utilities: `filterByScope()`, `groupByDay()`, `rollupIndicators()` in `history.utils.spec.ts`
- **Regression tests**: Verify existing `groupByTime()`, `actionLabel()`, `actionBadgeClass()` tests still pass
- **Regression tests**: Verify `ActivityListComponent` tests still pass (unchanged component)
- **Build check**: `npx ng build` must succeed with no errors
- **Full test suite**: `npx ng test --no-watch` must pass
- **Manual verification**: Compare rendered output against `/activity/mockup` for visual parity

### Notes

- Party mode discussion (2026-03-13) with PM (John) and UX Designer (Sally) informed all UX decisions
- Key correction during party mode: indicator **instances** are linked to Action **instances** (user objects), NOT to ActionModel (admin objects). IndicatorModel itself IS an admin object.
- The API does NOT track association history (e.g., linking IndicatorModel to ActionModel) — only entity CRUD is logged
- Reference mockup: `src/app/features/activity-feed/ui/activity-feed-mockup.component.ts`
- The mockup route (`/activity/mockup`) is removed in Task 5 but the file is kept as dev reference
- Future enhancement: notification badge using `/history/activities/count` endpoint with `exclude_current_user` param

## Review Notes

- Adversarial review completed
- Findings: 8 total, 7 fixed, 1 acknowledged (F6 — Agent in both old/new entity type sets, pre-existing inconsistency, no runtime impact)
- Resolution approach: confirmed each finding, fixed all confirmed real issues
- Fixed: F1 (separator never reset — replaced mutable flag with computed), F2 (indexOf reference equality — use ID comparison), F3 (UTC day boundaries — use local timezone), F4 (orphan indicator card shows wrong entity — use parent info), F5 (unknown action labels — explicit switch), F7 (localStorage race — defer write until data loads), F8 (unsorted day groups — sort descending)
