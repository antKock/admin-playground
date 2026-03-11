# Story 12.2: Global Activity Feed

Status: review

## Story

As an admin,
I want to access a global activity feed from the application shell,
so that I can monitor recent changes across all entities.

## Acceptance Criteria

1. **Given** I am on any page in the application **When** I click the activity bell icon in the shell header **Then** a slide-over panel opens showing recent activities
2. **Given** the activity panel is open **When** activities load **Then** each entry shows: formatted timestamp, user name, action type badge (create/update/delete), entity type, entity display name, and changes summary
3. **Given** the activity panel is open **When** I click an activity entry **Then** I am navigated to that entity's detail page (e.g., `/funding-programs/{id}`) and the panel closes
4. **Given** the activity panel is open **When** I scroll to the bottom **Then** the next page of activities loads via cursor pagination
5. **Given** the activity panel is open **When** I select filters **Then** the list is filtered by entity type, action type (create/update/delete), and/or time range (since)
6. **Given** the activity panel is open **When** I click outside the panel or press Escape **Then** the panel closes

## Tasks / Subtasks

- [x] Task 1: Create history domain layer if not yet established (AC: #2)
  - [x] Check if `src/app/domains/history/` exists from Story 11.5; if not, create it
  - [x] Create `src/app/domains/history/history.models.ts` — re-export `ActivityResponse` from generated types, define `ActivityFilters` interface: `{ entity_type?: string; action?: 'create' | 'update' | 'delete'; since?: string; cursor?: string; limit?: number }`
  - [x] Create `src/app/domains/history/history.api.ts` — inject `ApiService`, add `getActivities(filters?: ActivityFilters): Observable<PaginatedResponse_ActivityResponse_>` calling `GET /history/activities` with query params
  - [x] Create `src/app/domains/history/history.store.ts` — signal store with `activities: Activity[]`, `isLoading`, `error`, `cursor`, `hasMore` signals; `load(filters)` and `loadMore()` methods with cursor append logic
- [x] Task 2: Create entity route mapping utility (AC: #3)
  - [x] Create `src/app/domains/history/history.utils.ts`
  - [x] Add `entityRoute(entityType: string, entityId: string): string | null` function mapping entity_type strings to route paths
  - [x] Mappings: `FundingProgram` -> `/funding-programs/{id}`, `FolderModel` -> `/folder-models/{id}`, `ActionModel` -> `/action-models/{id}`, `ActionTheme` -> `/action-themes/{id}`, `Community` -> `/communities/{id}`, `Agent` -> `/agents/{id}`, `IndicatorModel` -> `/indicator-models/{id}`
- [x] Task 3: Create GlobalActivityFeedComponent as a slide-over panel (AC: #1, #2, #5, #6)
  - [x] Create `src/app/features/activity-feed/ui/global-activity-feed.component.ts` — standalone component
  - [x] Input signal: `isOpen` (boolean), output: `closed` (EventEmitter)
  - [x] Template: fixed overlay with slide-over panel from the right, backdrop click closes
  - [x] Header: "Activité récente" title with close button
  - [x] Filter bar: entity type dropdown (all known entity types), action type dropdown (create/update/delete), date range input (since)
  - [x] Activity list: each item shows timestamp (via `formatDateFr`), user name, action badge (color-coded: create=green, update=blue, delete=red), entity type label, entity display name (clickable), changes_summary (truncated)
  - [x] Keyboard: listen for Escape key to close panel
- [x] Task 4: Create ActivityFeedFacade (AC: #2, #4, #5)
  - [x] Create `src/app/features/activity-feed/activity-feed.facade.ts`
  - [x] Inject HistoryStore, Router
  - [x] Expose signals: `activities`, `isLoading`, `hasMore`, `error`
  - [x] Methods: `load(filters?)`, `loadMore()`, `navigateToEntity(entityType, entityId)` using the route mapping utility
- [x] Task 5: Implement cursor pagination with infinite scroll (AC: #4)
  - [x] In GlobalActivityFeedComponent, detect scroll-to-bottom on the activity list container
  - [x] On scroll-to-bottom, call `facade.loadMore()` if `facade.hasMore()` is true and not already loading
  - [x] Show loading spinner at bottom while fetching more
- [x] Task 6: Add activity bell icon to shell header (AC: #1)
  - [x] Edit `src/app/core/layout/app-layout.component.ts` — import `Bell` from `lucide-angular`, add `Bell` icon reference, add `activityPanelOpen` signal (boolean)
  - [x] Edit `src/app/core/layout/app-layout.component.html` — add bell icon button in header between the spacer div and the user email span, add `<app-global-activity-feed>` component with `[isOpen]="activityPanelOpen()"` and `(closed)="activityPanelOpen.set(false)"`
  - [x] Import `GlobalActivityFeedComponent` in `AppLayoutComponent`
- [x] Task 7: Write tests (AC: #1, #2, #3, #4, #5)
  - [x] Test: HistoryApi `getActivities()` calls correct endpoint with query params
  - [x] Test: HistoryStore loads activities and updates signals
  - [x] Test: HistoryStore `loadMore()` appends to existing activities using cursor
  - [x] Test: `entityRoute()` maps all entity types correctly, returns null for unknown types
  - [x] Test: GlobalActivityFeedComponent renders activity entries with expected fields
  - [x] Test: clicking an activity entry calls facade navigation
  - [x] Test: Escape key emits `closed`
  - [x] Run `npx ng test --no-watch` — all tests pass

## Dev Notes

### Project Structure Notes

This story introduces a new feature module at `src/app/features/activity-feed/` following the ACTEE pattern. The history domain layer may already exist from Story 11.5 at `src/app/domains/history/` — if so, extend it with the global endpoint; if not, create it fresh.

### API Endpoint Details

**Global activities:** `GET /history/activities`

Query parameters (all optional):
- `user_id: string` — filter by user
- `entity_type: string` — filter by entity type (e.g., "FundingProgram", "FolderModel")
- `action: "create" | "update" | "delete"` — filter by action type (ActionType enum)
- `since: string` — ISO 8601 date, filter activities after this date
- `cursor: string` — pagination cursor for next page
- `limit: number` — results per page (max 200, default likely 20)

Response: `PaginatedResponse_ActivityResponse_`
```typescript
{
  data: ActivityResponse[];
  pagination: PaginationMeta;
}
```

**ActivityResponse** (from `api-types.ts:2220-2258`):
```typescript
{
  id: string;             // UUID
  user_id: string;        // UUID
  user_name: string;
  action: "create" | "update" | "delete";
  entity_type: string;    // e.g. "FundingProgram", "FolderModel"
  entity_id: string;      // UUID
  entity_display_name: string;
  description: string;
  changes_summary?: string | null;
  parent_entity_type?: string | null;
  parent_entity_id?: string | null;
  parent_entity_name?: string | null;
  created_at: string;     // ISO 8601 datetime
}
```

**PaginationMeta**:
```typescript
{
  total_count: number;
  page_size: number;
  has_next_page: boolean;
  has_previous_page: boolean;
  // cursor fields for next/prev page
}
```

### Entity Type to Route Mapping

The application routes are defined in `src/app/app.routes.ts`. Map `entity_type` strings from the API to frontend routes:

| API entity_type | Frontend Route | Detail Route |
|----------------|---------------|-------------|
| `FundingProgram` | `/funding-programs` | `/funding-programs/{id}` |
| `FolderModel` | `/folder-models` | `/folder-models/{id}` |
| `ActionModel` | `/action-models` | `/action-models/{id}` |
| `ActionTheme` | `/action-themes` | `/action-themes/{id}` |
| `Community` | `/communities` | `/communities/{id}` |
| `Agent` | `/agents` | `/agents/{id}` |
| `IndicatorModel` | `/indicator-models` | `/indicator-models/{id}` |

Unknown entity types should render as non-clickable text (return null from `entityRoute()`).

### Shell Header Integration

**Current header** (`src/app/core/layout/app-layout.component.html` lines 39-62):
```html
<header class="header">
  <div class="flex-1"></div>
  <div class="flex items-center gap-3">
    <!-- user email, help link, logout button -->
  </div>
</header>
```

Add the bell icon button **before** the user email span, inside the flex container:
```html
<button
  (click)="activityPanelOpen.set(!activityPanelOpen())"
  class="flex items-center gap-1 rounded px-2 py-1.5 text-sm text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary"
  aria-label="Activité récente"
>
  <lucide-icon [img]="Bell" [size]="16"></lucide-icon>
</button>
```

The `activityPanelOpen` signal should be a writable signal:
```typescript
readonly activityPanelOpen = signal(false);
readonly Bell = Bell;
```

Import `Bell` from `lucide-angular` alongside the existing Lucide imports.

### Slide-Over Panel Pattern

Use a fixed-position overlay with a right-anchored panel:

```html
@if (isOpen()) {
  <div class="fixed inset-0 z-50 flex justify-end" (click)="onBackdropClick($event)">
    <div class="absolute inset-0 bg-black/30"></div>
    <div class="relative w-[480px] max-w-full h-full bg-surface-base shadow-xl flex flex-col overflow-hidden"
         (keydown.escape)="close()">
      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 class="text-lg font-semibold text-text-primary">Activité récente</h2>
        <button (click)="close()" class="p-1 rounded hover:bg-surface-muted">
          <lucide-icon [img]="X" [size]="18"></lucide-icon>
        </button>
      </div>
      <!-- Filters -->
      <!-- Activity list with scroll -->
    </div>
  </div>
}
```

### Action Type Badge Styling

Color-code action types using existing design tokens:
- `create` — green background: `bg-status-valid/10 text-status-valid`
- `update` — blue background: `bg-brand/10 text-brand`
- `delete` — red background: `bg-status-invalid/10 text-status-invalid`

French labels: `create` -> "Création", `update` -> "Modification", `delete` -> "Suppression"

### Infinite Scroll Implementation

Listen for scroll events on the activity list container:
```typescript
onScroll(event: Event): void {
  const el = event.target as HTMLElement;
  const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  if (nearBottom && this.facade.hasMore() && !this.facade.isLoading()) {
    this.facade.loadMore();
  }
}
```

### History Store — Cursor Pagination with Append

The store must support appending new pages to existing data (not replacing):

```typescript
// Pseudocode for store
load(filters?: ActivityFilters): void {
  // Reset activities, set cursor to null, fetch first page
}

loadMore(): void {
  // Fetch next page using current cursor, APPEND to existing activities
}
```

### Exact Files to Create/Modify

| File | Action | What |
|------|--------|------|
| `src/app/domains/history/history.models.ts` | Create (if missing) | `Activity` type alias, `ActivityFilters` interface |
| `src/app/domains/history/history.api.ts` | Create (if missing) | `HistoryApi` service with `getActivities()` |
| `src/app/domains/history/history.store.ts` | Create (if missing) | Signal store with cursor pagination, load/loadMore |
| `src/app/domains/history/history.utils.ts` | Create | `entityRoute()` mapping function |
| `src/app/features/activity-feed/activity-feed.facade.ts` | Create | Facade exposing history signals and navigation |
| `src/app/features/activity-feed/ui/global-activity-feed.component.ts` | Create | Slide-over panel component |
| `src/app/core/layout/app-layout.component.ts` | Modify | Add `Bell` icon import, `activityPanelOpen` signal |
| `src/app/core/layout/app-layout.component.html` | Modify | Add bell button in header, add `<app-global-activity-feed>` |

### Anti-Patterns to Avoid

- Do NOT import domain stores in UI components — use the facade only
- Do NOT make API calls from the panel component directly — go through facade -> store -> api
- Do NOT replace existing activities on `loadMore()` — append to the array
- Do NOT forget to close the panel on navigation (after clicking an activity entry)
- Do NOT use `@angular/cdk/overlay` unless already in the project — use a simple fixed-position div
- Do NOT forget keyboard accessibility — Escape to close, tab trapping within the panel
- Do NOT hardcode entity type strings in the component — use the centralized `entityRoute()` utility
- Do NOT use `ngFor` directive — use `@for` block syntax (Angular 21)
- Do NOT forget to unsubscribe/clean up scroll listeners in `ngOnDestroy`
- Do NOT import the GlobalActivityFeedComponent lazily — it's part of the shell layout, import it directly in `AppLayoutComponent`

### Date Formatting

Use `formatDateFr()` from `@app/shared/utils/format-date` for all timestamps. Activity `created_at` is ISO 8601 datetime, and `formatDateFr` handles this format.

### Filter Controls

Entity type dropdown options (French labels):
- Tous (all / no filter)
- Programme de financement (`FundingProgram`)
- Modèle de dossier (`FolderModel`)
- Modèle d'action (`ActionModel`)
- Thème d'action (`ActionTheme`)
- Communauté (`Community`)
- Agent (`Agent`)
- Modèle d'indicateur (`IndicatorModel`)

Action type dropdown options:
- Toutes (all / no filter)
- Création (`create`)
- Modification (`update`)
- Suppression (`delete`)

### References

- [Source: `src/app/core/layout/app-layout.component.ts` — shell layout with Lucide icons, NavItem pattern]
- [Source: `src/app/core/layout/app-layout.component.html` — header layout where bell icon goes]
- [Source: `src/app/core/layout/app-layout.component.css` — header is 56px tall with flex layout]
- [Source: `src/app/core/api/generated/api-types.ts:2220-2258` — ActivityResponse schema]
- [Source: `src/app/core/api/generated/api-types.ts:2132-2136` — ActionType enum: "create" | "update" | "delete"]
- [Source: `src/app/core/api/generated/api-types.ts:3289-3298` — PaginatedResponse_ActivityResponse_]
- [Source: `src/app/core/api/generated/api-types.ts:6670-6700` — get_activities_history_activities_get operation with query params]
- [Source: `src/app/core/api/generated/api-types.ts:3423-3443` — PaginationMeta schema]
- [Source: `src/app/app.routes.ts` — all entity routes for navigation mapping]
- [Source: `src/app/shared/utils/format-date.ts` — `formatDateFr()` utility]
- [Source: `src/app/features/folder-models/folder-model.facade.ts` — ACTEE facade pattern reference]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- Fixed DI: `GlobalHistoryStore` needed `{ providedIn: 'root' }` since `ActivityFeedFacade` is root-scoped
- Fixed regression: app-layout test selectors updated — bell button became first `<button>` in header, breaking `querySelector('button')` for logout tests

### Completion Notes List
- Extended existing history domain (from Story 11.5) with `ActivityFilters` interface and `globalActivityLoader` API function
- Created `GlobalHistoryStore` as a root-provided signal store with cursor pagination and filter support
- Created `entityRoute()` utility mapping all 8 entity types to frontend routes
- Created `ActivityFeedFacade` following ACTEE pattern — exposes store signals and navigation
- Created `GlobalActivityFeedComponent` as slide-over panel with entity/action filters, infinite scroll, Escape/backdrop close
- Integrated bell icon button in shell header via `AppLayoutComponent`
- 28 new tests added across 4 test files; all 856 tests passing with 0 regressions

### File List
- `src/app/domains/history/history.models.ts` — Modified: added `ActivityFilters` interface
- `src/app/domains/history/history.api.ts` — Modified: added `globalActivityLoader()` function
- `src/app/domains/history/history.store.ts` — Modified: added `GlobalHistoryStore` signal store
- `src/app/domains/history/history.utils.ts` — Created: `entityRoute()` mapping utility
- `src/app/domains/history/history.utils.spec.ts` — Created: 10 tests for entity route mapping
- `src/app/domains/history/history.api.spec.ts` — Created: 4 tests for global activity API
- `src/app/domains/history/global-history.store.spec.ts` — Created: 7 tests for GlobalHistoryStore
- `src/app/features/activity-feed/activity-feed.facade.ts` — Created: ActivityFeedFacade
- `src/app/features/activity-feed/ui/global-activity-feed.component.ts` — Created: slide-over panel component
- `src/app/features/activity-feed/ui/global-activity-feed.component.spec.ts` — Created: 7 tests for component
- `src/app/core/layout/app-layout.component.ts` — Modified: added Bell icon, activityPanelOpen signal, GlobalActivityFeedComponent import
- `src/app/core/layout/app-layout.component.html` — Modified: added bell button in header, added activity feed component
- `src/app/core/layout/app-layout.component.spec.ts` — Modified: updated button selectors for new bell button

## Change Log

- 2026-03-11: Implemented Story 12.2 — Global Activity Feed with slide-over panel, entity/action filters, infinite scroll, bell icon in shell header. Extended history domain with global activities API support.
