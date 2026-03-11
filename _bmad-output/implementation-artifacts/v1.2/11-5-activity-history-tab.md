# Story 11.5: Activity History Tab (Shared Component)

Status: review

## Story

As an admin,
I want to see a history of changes on any entity's detail page,
so that I can audit who changed what and when.

## Acceptance Criteria

1. **Given** any entity detail page (action-models, action-themes, indicator-models, funding-programs, folder-models, communities, agents, users) **When** the page loads **Then** an "Activite" section is displayed below the existing content.
2. **Given** the activity section is displayed **When** the entity has activities **Then** each activity shows: timestamp (formatDateFr), user_name, action type (create/update/delete), and changes_summary.
3. **Given** the activity section is displayed **When** the entity has no activities **Then** an empty state message "Aucune activite enregistree." is shown.
4. **Given** the entity has more activities than the page size **When** the admin clicks "Charger plus" **Then** the next page of activities is loaded via cursor pagination.
5. **Given** the activity section **When** it is loading **Then** a loading indicator is shown.
6. **Given** the ActivityListComponent **When** it receives `entityType` and `entityId` inputs **Then** it calls GET /history/{entity_type}/{entity_id}/activities with the correct parameters.
7. **Given** the history domain **When** it is structured **Then** it follows the ACTEE pattern: models, api, store in `src/app/domains/history/`.
8. **Given** the shared UI component **When** it is structured **Then** it lives in `src/app/shared/components/activity-list/` and is reusable across all detail pages.

## Tasks / Subtasks

- [x] Task 1: Create history domain models (AC: #7)
  - [x] Create `src/app/domains/history/history.models.ts`
  - [x] Re-export `ActivityResponse` from generated types
  - [x] Re-export `ActionType` from generated types
  - [x] Define `EntityType` union type matching API's entity_type values

- [x] Task 2: Create history domain API (AC: #6, #7)
  - [x] Create `src/app/domains/history/history.api.ts`
  - [x] `BASE_URL = ${environment.apiBaseUrl}/history/`
  - [x] `entityActivityLoader(http, params: { entityType, entityId, cursor?, limit? })` — GET /history/{entity_type}/{entity_id}/activities with cursor/limit

- [x] Task 3: Create history domain store (AC: #4, #5, #7)
  - [x] Create `src/app/domains/history/history.store.ts`
  - [x] This store is NOT providedIn: 'root' — it is instantiated per-component via `providers` so multiple detail pages don't share state
  - [x] State: `activities: ActivityResponse[]`, `isLoading: boolean`, `cursor: string | null`, `hasMore: boolean`, `error: string | null`
  - [x] withProps: `_http: inject(HttpClient)`
  - [x] withMethods: `load(entityType, entityId)` — initial load, resets activities array; `loadMore(entityType, entityId)` — appends to activities; `reset()` — clears state

- [x] Task 4: Create shared ActivityList component (AC: #1, #2, #3, #4, #5, #6, #8)
  - [x] Create `src/app/shared/components/activity-list/activity-list.component.ts`
  - [x] Inputs: `entityType: string` (required), `entityId: string` (required)
  - [x] The component creates its own HistoryStore instance via `providers: [HistoryStore]`
  - [x] On init (or via effect on entityId changes): calls store.load(entityType, entityId)
  - [x] Template: section header "Activite", list of activity items, empty state, load more button, loading indicator

- [x] Task 5: Integrate into action-model detail page (AC: #1)
  - [x] In `src/app/features/action-models/ui/action-model-detail.component.ts`:
  - [x] Import `ActivityListComponent`
  - [x] Add `<app-activity-list entityType="ActionModel" [entityId]="item()?.id ?? ''" />` after existing content
  - [x] Wrap in `@if (item())` to avoid rendering with empty entityId

- [x] Task 6: Integrate into action-theme detail page (AC: #1)
  - [x] In `src/app/features/action-themes/ui/action-theme-detail.component.ts`:
  - [x] Import `ActivityListComponent`
  - [x] Add `<app-activity-list entityType="ActionTheme" [entityId]="item()?.id ?? ''" />`

- [x] Task 7: Integrate into indicator-model detail page (AC: #1)
  - [x] In `src/app/features/indicator-models/ui/indicator-model-detail.component.ts`:
  - [x] Import `ActivityListComponent`
  - [x] Add `<app-activity-list entityType="IndicatorModel" [entityId]="item()?.id ?? ''" />`

- [x] Task 8: Integrate into funding-program detail page (AC: #1)
  - [x] In `src/app/features/funding-programs/ui/funding-program-detail.component.ts`:
  - [x] Import `ActivityListComponent`
  - [x] Add `<app-activity-list entityType="FundingProgram" [entityId]="item()?.id ?? ''" />`

- [x] Task 9: Integrate into folder-model detail page (AC: #1)
  - [x] In `src/app/features/folder-models/ui/folder-model-detail.component.ts`:
  - [x] Import `ActivityListComponent`
  - [x] Add `<app-activity-list entityType="FolderModel" [entityId]="item()?.id ?? ''" />`

- [x] Task 10: Integrate into community detail page (AC: #1)
  - [x] In `src/app/features/communities/ui/community-detail.component.ts`:
  - [x] Import `ActivityListComponent`
  - [x] Add `<app-activity-list entityType="Community" [entityId]="community()?.id ?? ''" />`

- [x] Task 11: Integrate into agent detail page (AC: #1)
  - [x] In `src/app/features/agents/ui/agent-detail.component.ts`:
  - [x] Import `ActivityListComponent`
  - [x] Add `<app-activity-list entityType="Agent" [entityId]="item()?.id ?? ''" />`

- [x] Task 12: Integrate into user detail page (AC: #1)
  - [x] In `src/app/features/users/ui/user-detail.component.ts`:
  - [x] Import `ActivityListComponent`
  - [x] Add `<app-activity-list entityType="User" [entityId]="user()?.id ?? ''" />`

- [x] Task 13: Write tests (AC: all)
  - [x] Create `src/app/domains/history/history.store.spec.ts`
  - [x] Create `src/app/shared/components/activity-list/activity-list.component.spec.ts`
  - [x] Run `npx ng test --no-watch` — verify zero regressions

## Dev Notes

### Project Structure Notes

**Files to create:**
```
src/app/domains/history/
  history.models.ts
  history.api.ts
  history.store.ts
  history.store.spec.ts

src/app/shared/components/activity-list/
  activity-list.component.ts
  activity-list.component.spec.ts
```

**Files to modify (add `<app-activity-list>`):**
```
src/app/features/action-models/ui/action-model-detail.component.ts
src/app/features/action-themes/ui/action-theme-detail.component.ts
src/app/features/indicator-models/ui/indicator-model-detail.component.ts
src/app/features/funding-programs/ui/funding-program-detail.component.ts
src/app/features/folder-models/ui/folder-model-detail.component.ts
src/app/features/communities/ui/community-detail.component.ts
src/app/features/agents/ui/agent-detail.component.ts
src/app/features/users/ui/user-detail.component.ts
```

### File-by-File Implementation Guide

#### 1. `src/app/domains/history/history.models.ts`

```typescript
import { components } from '@app/core/api/generated/api-types';

export type ActivityResponse = components['schemas']['ActivityResponse'];
export type ActionType = components['schemas']['ActionType'];

// Entity types as accepted by the API
// From API docs: Folder, Action, User, Role, FundingProgram, ActionModel, FolderModel, Community, ActionTheme, Agent
export type EntityType =
  | 'Folder'
  | 'Action'
  | 'User'
  | 'Role'
  | 'FundingProgram'
  | 'ActionModel'
  | 'FolderModel'
  | 'Community'
  | 'ActionTheme'
  | 'Agent'
  | 'IndicatorModel';
```

The `ActivityResponse` schema from api-types.ts:
```typescript
ActivityResponse: {
  id: string;           // uuid
  user_id: string;      // uuid
  user_name: string;
  action: ActionType;   // "create" | "update" | "delete"
  entity_type: string;
  entity_id: string;    // uuid
  entity_display_name: string;
  description: string;
  changes_summary?: string | null;
  parent_entity_type?: string | null;
  parent_entity_id?: string | null;
  parent_entity_name?: string | null;
  created_at: string;   // date-time
}
```

#### 2. `src/app/domains/history/history.api.ts`

```typescript
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '@app/../environments/environment';
import { PaginatedResponse } from '@app/core/api/paginated-response.model';
import { ActivityResponse } from './history.models';

const BASE_URL = `${environment.apiBaseUrl}/history/`;

export function entityActivityLoader(
  http: HttpClient,
  params: {
    entityType: string;
    entityId: string;
    cursor: string | null;
    limit: number;
  },
): Observable<PaginatedResponse<ActivityResponse>> {
  let httpParams = new HttpParams().set('limit', params.limit.toString());
  if (params.cursor) {
    httpParams = httpParams.set('cursor', params.cursor);
  }
  return http.get<PaginatedResponse<ActivityResponse>>(
    `${BASE_URL}${params.entityType}/${params.entityId}/activities`,
    { params: httpParams },
  );
}
```

#### 3. `src/app/domains/history/history.store.ts`

This store is NOT `providedIn: 'root'`. It is provided at the component level so each detail page gets its own instance. This avoids one entity's activity history leaking into another entity's detail page.

```typescript
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { signalStore, withState, withMethods, withProps } from '@ngrx/signals';

import { patch } from '@domains/shared/store.utils';
import { ActivityResponse } from './history.models';
import { entityActivityLoader } from './history.api';

const PAGE_SIZE = 20;

export const HistoryStore = signalStore(
  // NOT providedIn: 'root' — each component provides its own instance
  withState({
    activities: [] as ActivityResponse[],
    isLoading: false,
    cursor: null as string | null,
    hasMore: false,
    error: null as string | null,
  }),
  withProps(() => ({ _http: inject(HttpClient) })),
  withMethods((store) => ({
    load(entityType: string, entityId: string): void {
      patch(store, { isLoading: true, error: null, activities: [], cursor: null, hasMore: false });
      entityActivityLoader(store._http, { entityType, entityId, cursor: null, limit: PAGE_SIZE })
        .subscribe({
          next: (response) => {
            patch(store, {
              activities: response.data,
              cursor: response.pagination?.cursors?.next ?? null,
              hasMore: !!response.pagination?.cursors?.next,
              isLoading: false,
            });
          },
          error: (err) => {
            patch(store, { error: err?.message ?? 'Echec du chargement', isLoading: false });
          },
        });
    },
    loadMore(entityType: string, entityId: string): void {
      const currentCursor = store.cursor();
      if (!currentCursor || store.isLoading()) return;
      patch(store, { isLoading: true });
      entityActivityLoader(store._http, { entityType, entityId, cursor: currentCursor, limit: PAGE_SIZE })
        .subscribe({
          next: (response) => {
            patch(store, {
              activities: [...store.activities(), ...response.data],
              cursor: response.pagination?.cursors?.next ?? null,
              hasMore: !!response.pagination?.cursors?.next,
              isLoading: false,
            });
          },
          error: (err) => {
            patch(store, { error: err?.message ?? 'Echec du chargement', isLoading: false });
          },
        });
    },
    reset(): void {
      patch(store, { activities: [], isLoading: false, cursor: null, hasMore: false, error: null });
    },
  })),
);
```

IMPORTANT: This store uses direct `.subscribe()` instead of `rxMethod` because it is not `providedIn: 'root'` and the simpler approach avoids rxMethod lifecycle complexities with component-scoped stores. If the project prefers rxMethod everywhere, adapt accordingly, but the component-scoped store pattern with subscribe is the simpler approach.

Alternative approach: Use `rxMethod` if the store lifecycle is managed properly. The key constraint is that the store is provided per-component, so it is destroyed when the component is destroyed, and subscriptions are cleaned up.

#### 4. `src/app/shared/components/activity-list/activity-list.component.ts`

```typescript
import { Component, inject, input, OnInit, OnChanges, SimpleChanges } from '@angular/core';

import { formatDateFr } from '@app/shared/utils/format-date';
import { HistoryStore } from '@domains/history/history.store';
import { ActivityResponse } from '@domains/history/history.models';

@Component({
  selector: 'app-activity-list',
  providers: [HistoryStore], // Component-scoped store instance
  template: `
    <div class="mt-8">
      <h2 class="text-lg font-semibold text-text-primary mb-4">Activite</h2>

      @if (store.isLoading() && store.activities().length === 0) {
        <div class="animate-pulse space-y-3">
          @for (i of [1, 2, 3]; track i) {
            <div class="flex gap-3">
              <div class="h-4 bg-surface-muted rounded w-32"></div>
              <div class="h-4 bg-surface-muted rounded w-48"></div>
            </div>
          }
        </div>
      } @else if (store.activities().length === 0) {
        <p class="text-sm text-text-secondary">Aucune activite enregistree.</p>
      } @else {
        <div class="space-y-3">
          @for (activity of store.activities(); track activity.id) {
            <div class="flex flex-col gap-0.5 px-3 py-2 border border-border rounded-lg">
              <div class="flex items-center gap-2 text-sm">
                <span class="text-text-tertiary">{{ formatDate(activity.created_at) }}</span>
                <span class="font-medium text-text-primary">{{ activity.user_name }}</span>
                <span class="px-1.5 py-0.5 text-xs rounded"
                  [class]="actionBadgeClass(activity.action)">
                  {{ actionLabel(activity.action) }}
                </span>
              </div>
              @if (activity.changes_summary) {
                <p class="text-xs text-text-secondary mt-0.5">{{ activity.changes_summary }}</p>
              }
            </div>
          }
        </div>

        @if (store.hasMore()) {
          <button
            class="mt-4 px-4 py-2 text-sm border border-border rounded-lg text-text-primary hover:bg-surface-muted transition-colors disabled:opacity-50"
            [disabled]="store.isLoading()"
            (click)="onLoadMore()"
          >
            {{ store.isLoading() ? 'Chargement...' : 'Charger plus' }}
          </button>
        }
      }

      @if (store.error()) {
        <p class="text-sm text-error mt-2">{{ store.error() }}</p>
      }
    </div>
  `,
})
export class ActivityListComponent implements OnInit {
  readonly store = inject(HistoryStore);

  readonly entityType = input.required<string>();
  readonly entityId = input.required<string>();

  ngOnInit(): void {
    const type = this.entityType();
    const id = this.entityId();
    if (type && id) {
      this.store.load(type, id);
    }
  }

  formatDate(value: string): string {
    return formatDateFr(value);
  }

  actionLabel(action: string): string {
    switch (action) {
      case 'create': return 'Creation';
      case 'update': return 'Modification';
      case 'delete': return 'Suppression';
      default: return action;
    }
  }

  actionBadgeClass(action: string): string {
    switch (action) {
      case 'create': return 'bg-green-100 text-green-800';
      case 'update': return 'bg-blue-100 text-blue-800';
      case 'delete': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  onLoadMore(): void {
    this.store.loadMore(this.entityType(), this.entityId());
  }
}
```

IMPORTANT: Since `entityId` comes from a signal input (e.g., `item()?.id`), it might be empty string initially. The component should guard against this in ngOnInit. If the parent wraps the component in `@if (item())`, the entityId will always be valid when the component initializes.

If the entityId can change (e.g., navigating between detail pages without destroying the component), use an `effect()` instead of `ngOnInit`:
```typescript
constructor() {
  effect(() => {
    const type = this.entityType();
    const id = this.entityId();
    if (type && id) {
      this.store.load(type, id);
    }
  });
}
```

#### 5. Integration into each detail component

The pattern is the same for all 8 detail components. For each:

1. Add `ActivityListComponent` to the `imports` array
2. Add the template tag inside the `@else if (item())` / `@else if (community())` / `@else if (user())` block, after the existing content (MetadataGrid, linked sections, etc.) but before the `<app-api-inspector>` if present

Example for `community-detail.component.ts`:
```typescript
// In imports:
import { ActivityListComponent } from '@app/shared/components/activity-list/activity-list.component';

// In @Component imports array:
imports: [MetadataGridComponent, CommunityUsersComponent, ActivityListComponent, ApiInspectorComponent, BreadcrumbComponent],

// In template, before </app-api-inspector>:
<app-activity-list entityType="Community" [entityId]="community()!.id" />
```

**Entity type mapping for each detail page:**

| Detail Component | entityType value | Signal for ID |
|---|---|---|
| action-model-detail | `"ActionModel"` | `item()!.id` |
| action-theme-detail | `"ActionTheme"` | `item()!.id` |
| indicator-model-detail | `"IndicatorModel"` | `item()!.id` |
| funding-program-detail | `"FundingProgram"` | `item()!.id` |
| folder-model-detail | `"FolderModel"` | `item()!.id` |
| community-detail | `"Community"` | `community()!.id` |
| agent-detail | `"Agent"` | `item()!.id` |
| user-detail | `"User"` | `user()!.id` |

Note: Verify the exact signal name used for the selected item in each detail component — most use `item()` but community uses `community()` and user uses `user()`. Check each file before adding.

### PaginatedResponse Shape

The API returns paginated activities with this structure (same as all other paginated endpoints):
```typescript
{
  data: ActivityResponse[],
  pagination: {
    total: number,
    limit: number,
    cursors: { next: string | null, previous: string | null },
    _links: { next: string | null, previous: string | null }
  }
}
```

### Key Design Decisions

1. **Component-scoped store**: The HistoryStore is NOT `providedIn: 'root'` because each detail page needs its own independent activity history. Using `providers: [HistoryStore]` on the component ensures a fresh instance per component.

2. **Shared UI component in shared/components/**: The ActivityListComponent is a shared presentational component, not a feature component. It lives in `@shared/` because it is used across all feature domains.

3. **Domain in domains/history/**: The history domain follows the ACTEE pattern but is simpler — no mutations, no feature store, no facade. The component directly uses the domain store because there is no feature-level state or orchestration needed.

4. **No facade**: Unlike CRUD domains, the history domain has no mutations, no toast handling, and no navigation. A facade would add unnecessary indirection. The component-scoped store is sufficient.

### References

- [Source: src/app/core/api/generated/api-types.ts — ActivityResponse, ActionType, PaginatedResponse_ActivityResponse_ schemas]
- [Source: src/app/core/api/generated/api-types.ts — /history/{entity_type}/{entity_id}/activities endpoint]
- [Source: src/app/domains/shared/store.utils.ts — patch() helper]
- [Source: src/app/shared/utils/format-date.ts — formatDateFr]
- [Source: src/app/core/api/paginated-response.model.ts — PaginatedResponse type]
- [Source: src/app/features/communities/ui/community-detail.component.ts — integration reference]
- [Source: src/app/features/action-models/ui/action-model-detail.component.ts — integration reference]
- [Source: src/app/features/action-themes/ui/action-theme-detail.component.ts — integration reference]
- [Source: src/app/features/indicator-models/ui/indicator-model-detail.component.ts — integration reference]
- [Source: src/app/features/funding-programs/ui/funding-program-detail.component.ts — integration reference]
- [Source: src/app/features/folder-models/ui/folder-model-detail.component.ts — integration reference]
- [Source: src/app/features/agents/ui/agent-detail.component.ts — integration reference]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- HistoryStore is NOT providedIn:'root' — uses component-level providers for isolation
- Used PaginationMeta.end_cursor and has_next_page instead of cursors.next (matching PaginatedResponse interface)
- ActivityListComponent uses effect() to react to entityId changes (supports navigation between detail pages)

### Completion Notes List
- Created history domain: models (ActivityResponse, ActionType, EntityType), API (entityActivityLoader), store (HistoryStore with load/loadMore/reset)
- Created shared ActivityListComponent with component-scoped HistoryStore, loading skeleton, empty state, activity items with action badges, load more pagination
- Integrated into all 8 detail pages: ActionModel, ActionTheme, IndicatorModel, FundingProgram, FolderModel, Community, Agent, User
- Created history.store.spec.ts with 4 tests (init state, load, error handling, reset)
- Created activity-list.component.spec.ts with 2 tests (create, header display)
- All 828 tests pass, build succeeds

### File List
- Created: `src/app/domains/history/history.models.ts`
- Created: `src/app/domains/history/history.api.ts`
- Created: `src/app/domains/history/history.store.ts`
- Created: `src/app/domains/history/history.store.spec.ts`
- Created: `src/app/shared/components/activity-list/activity-list.component.ts`
- Created: `src/app/shared/components/activity-list/activity-list.component.spec.ts`
- Modified: `src/app/features/action-models/ui/action-model-detail.component.ts`
- Modified: `src/app/features/action-themes/ui/action-theme-detail.component.ts`
- Modified: `src/app/features/indicator-models/ui/indicator-model-detail.component.ts`
- Modified: `src/app/features/funding-programs/ui/funding-program-detail.component.ts`
- Modified: `src/app/features/folder-models/ui/folder-model-detail.component.ts`
- Modified: `src/app/features/communities/ui/community-detail.component.ts`
- Modified: `src/app/features/agents/ui/agent-detail.component.ts`
- Modified: `src/app/features/users/ui/user-detail.component.ts`

### Change Log
- 2026-03-11: Created shared activity history component and integrated into all 8 entity detail pages
