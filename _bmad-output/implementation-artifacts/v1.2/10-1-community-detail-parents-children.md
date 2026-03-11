# Story 10.1: Community Detail — Parents & Children Display

Status: review

## Story

As an admin,
I want to see a community's parent and child communities on its detail page,
so that I can understand the organizational hierarchy.

## Acceptance Criteria

1. **Given** a community detail page **When** the page loads **Then** a "Parents" section is displayed, populated from `GET /communities/{id}/parents`, and a "Children" section is displayed, populated from `GET /communities/{id}/children`
2. **Given** a community with parents or children **When** the sections render **Then** each community name is a clickable `routerLink` navigating to `/communities/{id}`
3. **Given** a community with no parents **When** the detail page loads **Then** the "Parents" section displays "Aucune communauté parente."
4. **Given** a community with no children **When** the detail page loads **Then** the "Children" section displays "Aucune communauté enfant."

## Tasks / Subtasks

- [x] Task 1: Add API functions for parents and children (AC: #1)
  - [x] Add `loadCommunityParents(http, communityId): Observable<CommunityRead[]>` to `community.api.ts` — `GET ${BASE_URL}${communityId}/parents`
  - [x] Add `loadCommunityChildren(http, communityId): Observable<CommunityRead[]>` to `community.api.ts` — `GET ${BASE_URL}${communityId}/children`
  - [x] Both return `CommunityRead[]` (not paginated — confirmed in `api-types.ts`)

- [x] Task 2: Add parents/children state and methods to domain store (AC: #1)
  - [x] Add to `withState`: `parents: [] as CommunityRead[]`, `children: [] as CommunityRead[]`, `isLoadingParents: false`, `isLoadingChildren: false`
  - [x] Add `loadParents: rxMethod<string>` — `pipe(tap → isLoadingParents=true, switchMap → loadCommunityParents, tap → set parents, catchError)`
  - [x] Add `loadChildren: rxMethod<string>` — same pattern with `loadCommunityChildren`
  - [x] Add `clearHierarchy()` method to reset parents/children to `[]`

- [x] Task 3: Project signals through feature store (AC: #1)
  - [x] Add `parents`, `children`, `isLoadingParents`, `isLoadingChildren` computed projections in `src/app/features/communities/community.store.ts`

- [x] Task 4: Expose signals and methods in facade (AC: #1)
  - [x] Add `readonly parents = this.featureStore.parents;` and `readonly children = this.featureStore.children;`
  - [x] Add `readonly isLoadingParents = this.featureStore.isLoadingParents;` and `readonly isLoadingChildren = this.featureStore.isLoadingChildren;`
  - [x] Update `select(id)` to also call `this.domainStore.loadParents(id)` and `this.domainStore.loadChildren(id)`
  - [x] Update `clearSelection()` to also call `this.domainStore.clearHierarchy()`

- [x] Task 5: Update detail component with Parents and Children sections (AC: #1, #2, #3, #4)
  - [x] Add `RouterLink` to imports
  - [x] Add "Communautés parentes" section after MetadataGrid and before CommunityUsers
  - [x] Add "Communautés enfants" section after parents section
  - [x] Each section: `@if (isLoadingParents()) { skeleton } @else if (parents().length === 0) { empty state } @else { list with routerLinks }`
  - [x] Each community link: `<a [routerLink]="['/communities', parent.id]" class="text-brand hover:underline">{{ parent.name }}</a>`
  - [x] Use a simple list layout (not DataTable — these are short lists)

- [x] Task 6: Tests (AC: #1, #2, #3, #4)
  - [x] Test facade `select()` triggers parent/children loading (updated existing test)
  - [x] Test detail component renders (existing tests pass)
  - [x] Run `npx ng test --no-watch` — verify zero regressions ✅ 807/807 pass

## Dev Notes

### Project Structure Notes

**Files to modify:**
- `src/app/domains/communities/community.api.ts` — add `loadCommunityParents`, `loadCommunityChildren` functions
- `src/app/domains/communities/community.store.ts` — add parents/children state, `loadParents`/`loadChildren` rxMethods, `clearHierarchy`
- `src/app/features/communities/community.store.ts` — project new signals
- `src/app/features/communities/community.facade.ts` — expose signals, update `select()`/`clearSelection()`
- `src/app/features/communities/ui/community-detail.component.ts` — add Parents/Children UI sections

**No new files needed** — all changes extend existing files.

### API Endpoints (confirmed in api-types.ts)

```typescript
// GET /communities/{community_id}/parents → CommunityRead[]
// Response: operations["get_community_parents_communities__community_id__parents_get"]
// Returns: components["schemas"]["CommunityRead"][]

// GET /communities/{community_id}/children → CommunityRead[]
// Response: operations["get_community_children_communities__community_id__children_get"]
// Returns: components["schemas"]["CommunityRead"][]
// Supports optional query param: recursive?: boolean (do NOT use — flat list is sufficient)
```

Both endpoints return raw arrays (NOT paginated responses), so no cursor handling is needed.

### API Function Pattern (match existing style in community.api.ts)

```typescript
export function loadCommunityParents(http: HttpClient, communityId: string): Observable<CommunityRead[]> {
  return http.get<CommunityRead[]>(`${BASE_URL}${communityId}/parents`);
}

export function loadCommunityChildren(http: HttpClient, communityId: string): Observable<CommunityRead[]> {
  return http.get<CommunityRead[]>(`${BASE_URL}${communityId}/children`);
}
```

### Domain Store Pattern (match existing `selectById` and `loadUsers` in community.store.ts)

Use `rxMethod<string>` with `pipe(tap → loading=true, switchMap → API call, tap → set data, catchError)`. Same pattern as `selectById` (line 69-82) and `loadUsers` (line 86-99) in the existing store.

### Detail Component UI Pattern

Use simple list with `routerLink`, NOT DataTable. Parents/children are short lists (typically 0-5 items). Example layout:

```html
<!-- Parents section -->
<section class="mt-6">
  <h2 class="text-lg font-semibold text-text-primary mb-3">Communautés parentes</h2>
  @if (facade.isLoadingParents()) {
    <div class="animate-pulse h-4 bg-surface-muted rounded w-48"></div>
  } @else if (facade.parents().length === 0) {
    <p class="text-sm text-text-tertiary">Aucune communauté parente.</p>
  } @else {
    <ul class="space-y-1">
      @for (parent of facade.parents(); track parent.id) {
        <li>
          <a [routerLink]="['/communities', parent.id]" class="text-brand hover:underline text-sm">
            {{ parent.name }}
          </a>
        </li>
      }
    </ul>
  }
</section>
```

### Facade `select()` Pattern

The facade's `select()` method currently only calls `this.domainStore.selectById(id)`. Update to also load hierarchy:

```typescript
select(id: string): void {
  this.domainStore.selectById(id);
  this.domainStore.loadParents(id);
  this.domainStore.loadChildren(id);
}
```

This matches the pattern in `IndicatorModelFacade.select()` which calls both `selectById` and `loadUsage`.

### Anti-Patterns to Avoid

- Do NOT use DataTable for parents/children — these are short lists, a simple `<ul>` with `routerLink` is appropriate
- Do NOT use the `recursive` query param on the children endpoint — flat direct children only
- Do NOT create separate components for the parents/children lists — inline in detail component is sufficient for this scope
- Do NOT forget to call `clearHierarchy()` in `clearSelection()` — prevents stale data when navigating between communities
- Do NOT use `forkJoin` or parallel loading in the facade — let the domain store handle each independently via separate `rxMethod` calls

### References

- [Source: src/app/core/api/generated/api-types.ts line 496-535 — `/communities/{community_id}/parents` and `/children` paths]
- [Source: src/app/core/api/generated/api-types.ts line 4620-4681 — operations returning `CommunityRead[]`]
- [Source: src/app/domains/communities/community.api.ts — existing API functions pattern]
- [Source: src/app/domains/communities/community.store.ts — existing `selectById`, `loadUsers` rxMethod patterns]
- [Source: src/app/features/communities/community.facade.ts — existing facade pattern]
- [Source: src/app/features/communities/ui/community-detail.component.ts — existing detail component]
- [Source: src/app/features/indicator-models/indicator-model.facade.ts line 52-54 — `select()` calling multiple domain store methods]
- [Source: _bmad-output/planning-artifacts/v1.2/epics.md — Epic 10 Story 10.1]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- Existing facade test needed updating: `select()` now fires 3 HTTP requests instead of 1. Updated test to use `httpTesting.match()` instead of `expectOne()`.

### Completion Notes List
- Added `loadCommunityParents` and `loadCommunityChildren` API functions returning raw `CommunityRead[]` arrays
- Added parents/children state, `loadParents`/`loadChildren` rxMethods, and `clearHierarchy()` to domain store
- Projected new signals through feature store
- Updated facade `select()` to load hierarchy and `clearSelection()` to clear it
- Added Parents and Children sections to detail component with loading, empty state, and routerLink navigation
- Updated existing facade test to handle 3 concurrent requests from `select()`
- All 807 tests pass

### File List
- Modified: `src/app/domains/communities/community.api.ts`
- Modified: `src/app/domains/communities/community.store.ts`
- Modified: `src/app/features/communities/community.store.ts`
- Modified: `src/app/features/communities/community.facade.ts`
- Modified: `src/app/features/communities/community.facade.spec.ts`
- Modified: `src/app/features/communities/ui/community-detail.component.ts`

### Change Log
- 2026-03-11: Implemented community hierarchy display — parents & children sections on detail page with loading states, empty states, and navigation links
