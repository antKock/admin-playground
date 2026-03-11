# Story 11.4: User Community Assignment

Status: review

## Story

As an admin,
I want to manage which communities a user belongs to from the user detail page,
so that I can control user access to communities without leaving the user's page.

## Acceptance Criteria

1. **Given** the user detail page is displayed **When** the user has communities in `UserRead.communities[]` **Then** the "Communautes" section shows each community with its name and a remove button.
2. **Given** the admin clicks "+ Assigner une communaute" **When** the picker opens **Then** all communities are loaded and displayed in a searchable dropdown list.
3. **Given** the community picker is open **When** a community is already assigned to the user **Then** that community row is greyed out with a "Deja assignee" badge and no assign button.
4. **Given** the admin clicks "Assigner" on an unassigned community **When** the request succeeds **Then** POST /communities/{community_id}/users/{user_id} is called, a success toast is shown, and the user detail is refreshed to show the new community.
5. **Given** the admin clicks the remove button on an assigned community **When** they confirm the dialog **Then** DELETE /communities/{community_id}/users/{user_id} is called, a success toast is shown, and the community is removed from the list.
6. **Given** the community picker is open **When** the admin types in the search box **Then** the community list is filtered by name (case-insensitive).
7. **Given** the community picker is open **When** the admin clicks outside the picker **Then** the picker closes.

## Tasks / Subtasks

- [x] Task 1: Add community loading to user domain (AC: #2)
  - [x] In `src/app/domains/users/user.api.ts`, add `loadAllCommunities(http)` — GET /communities/ (load all, no pagination, or use a high limit)
  - [x] In `src/app/domains/users/user.store.ts`, add state: `allCommunities: [] as CommunityRead[]`, `isLoadingCommunities: false`
  - [x] Add `loadCommunities` rxMethod to fetch all communities
  - [x] NOTE: Alternatively, reuse the existing community domain store's data. Since CommunityDomainStore is providedIn: 'root', you could inject it into the UserFacade. This avoids duplicating the community loading logic. Choose the approach that feels cleaner.

- [x] Task 2: Add community assignment mutations to user domain (AC: #4, #5)
  - [x] Community assignment uses the SAME endpoints as CommunityUsersComponent: `POST /communities/{community_id}/users/{user_id}` and `DELETE /communities/{community_id}/users/{user_id}`
  - [x] In `src/app/domains/users/user.store.ts`, add mutations: `assignCommunityMutation`, `removeCommunityMutation`
  - [x] In `src/app/domains/users/user.api.ts`, add request functions: `assignCommunityRequest({ communityId, userId })`, `removeCommunityRequest({ communityId, userId })`
  - [x] These use the same URLs as `assignUserRequest` and `removeUserRequest` in community.api.ts — same endpoint, just called from the user context

- [x] Task 3: Update facade with community assignment methods (AC: #2, #4, #5)
  - [x] In `src/app/features/users/user.facade.ts`:
  - [x] Add `loadCommunities()` method
  - [x] Add `allCommunities` readonly signal
  - [x] Add `isLoadingCommunities` readonly signal
  - [x] Add `userCommunities` computed signal: maps from `selectedItem()?.communities` to full CommunityRead objects by matching against allCommunities, OR simply returns `selectedItem()?.communities` directly (UserCommunityBrief has id and name)
  - [x] Add `assignCommunity(communityId, userId)` — on success: toast "Communaute assignee", refresh user detail via `select(userId)`
  - [x] Add `removeCommunity(communityId, userId)` — on success: toast "Communaute retiree", refresh user detail via `select(userId)`
  - [x] Add `assignCommunityIsPending`, `removeCommunityIsPending` signals
  - [x] Update `anyMutationPending` to include assign/remove community

- [x] Task 4: Update feature store projections (AC: #2)
  - [x] In `src/app/features/users/user.store.ts`, add: `allCommunities`, `isLoadingCommunities`

- [x] Task 5: Create user-communities component (AC: #1, #2, #3, #4, #5, #6, #7)
  - [x] Create `src/app/features/users/ui/user-communities.component.ts`
  - [x] Follow `src/app/features/communities/ui/community-users.component.ts` as the EXACT reference, but INVERTED:
    - Instead of showing users for a community, show communities for a user
    - Instead of searching users, search communities
    - The picker shows communities, not users
    - "Deja assignee" replaces "Deja assigne"

- [x] Task 6: Integrate into user detail component (AC: #1)
  - [x] In `src/app/features/users/ui/user-detail.component.ts`:
  - [x] Import `UserCommunitiesComponent`
  - [x] Add `<app-user-communities />` in the template after MetadataGrid
  - [x] Remove the simple read-only communities list from Story 11.2 (replaced by the interactive component)

- [x] Task 7: Write tests (AC: all)
  - [x] Create `src/app/features/users/ui/user-communities.component.spec.ts`
  - [x] Run `npx ng test --no-watch`

## Dev Notes

### Project Structure Notes

**Files to create:**
```
src/app/features/users/ui/user-communities.component.ts
src/app/features/users/ui/user-communities.component.spec.ts
```

**Files to modify:**
```
src/app/domains/users/user.api.ts                — add community loading + assignment requests
src/app/domains/users/user.store.ts              — add community state, mutations, methods
src/app/features/users/user.store.ts             — add community projections
src/app/features/users/user.facade.ts            — add community methods and signals
src/app/features/users/ui/user-detail.component.ts — integrate UserCommunitiesComponent
```

**Prerequisites:** Stories 11.1, 11.2.

### File-by-File Implementation Guide

#### `src/app/domains/users/user.api.ts` — additions

```typescript
import { CommunityRead } from '@domains/communities/community.models';

const COMMUNITIES_URL = `${environment.apiBaseUrl}/communities/`;

// Load all communities for the picker
export function loadAllCommunities(http: HttpClient): Observable<CommunityRead[]> {
  // Use a high limit to get all communities in one request, or use the paginated endpoint
  // The community list endpoint is GET /communities/ with cursor pagination
  // For a picker, load with a high limit to get all at once
  return http.get<PaginatedResponse<CommunityRead>>(COMMUNITIES_URL, {
    params: new HttpParams().set('limit', '500'),
  }).pipe(map(response => response.data));
}

// Community assignment — uses the SAME endpoints as community.api.ts
export function assignCommunityRequest(params: { communityId: string; userId: string }) {
  return { url: `${COMMUNITIES_URL}${params.communityId}/users/${params.userId}`, method: 'POST' };
}

export function removeCommunityRequest(params: { communityId: string; userId: string }) {
  return { url: `${COMMUNITIES_URL}${params.communityId}/users/${params.userId}`, method: 'DELETE' };
}
```

#### `src/app/domains/users/user.store.ts` — additions

Add to withState:
```typescript
allCommunities: [] as CommunityRead[],
isLoadingCommunities: false,
```

Add to withMutations:
```typescript
assignCommunityMutation: httpMutation({
  request: (params: { communityId: string; userId: string }) => assignCommunityRequest(params),
  operator: concatOp,
}),
removeCommunityMutation: httpMutation({
  request: (params: { communityId: string; userId: string }) => removeCommunityRequest(params),
  operator: concatOp,
}),
```

Add to withMethods:
```typescript
loadCommunities: rxMethod<void>(
  pipe(
    tap(() => patch(store, { isLoadingCommunities: true })),
    switchMap(() =>
      loadAllCommunities(store._http).pipe(
        tap((communities) => patch(store, { allCommunities: communities, isLoadingCommunities: false })),
        catchError(() => {
          patch(store, { isLoadingCommunities: false });
          return EMPTY;
        }),
      ),
    ),
  ),
),
```

#### `src/app/features/users/user.facade.ts` — additions

```typescript
// Community assignment signals
readonly allCommunities = this.featureStore.allCommunities;
readonly isLoadingCommunities = this.featureStore.isLoadingCommunities;
readonly assignCommunityIsPending = this.domainStore.assignCommunityMutationIsPending;
readonly removeCommunityIsPending = this.domainStore.removeCommunityMutationIsPending;

// Update anyMutationPending to include community mutations
readonly anyMutationPending = computed(() =>
  this.createIsPending() || this.updateIsPending() || this.deleteIsPending() ||
  this.updateRoleIsPending() || this.assignCommunityIsPending() || this.removeCommunityIsPending(),
);

loadCommunities(): void {
  this.domainStore.loadCommunities();
}

async assignCommunity(communityId: string, userId: string): Promise<void> {
  const result = await this.domainStore.assignCommunityMutation({ communityId, userId });
  if (result.status === 'success') {
    this.toast.success('Communaute assignee');
    this.domainStore.selectById(userId); // refresh user detail to get updated communities
  } else if (result.status === 'error') {
    this.handleMutationError(result.error);
  }
}

async removeCommunity(communityId: string, userId: string): Promise<void> {
  const result = await this.domainStore.removeCommunityMutation({ communityId, userId });
  if (result.status === 'success') {
    this.toast.success('Communaute retiree');
    this.domainStore.selectById(userId); // refresh user detail
  } else if (result.status === 'error') {
    this.handleMutationError(result.error);
  }
}
```

#### `src/app/features/users/ui/user-communities.component.ts`

This is the INVERTED version of `src/app/features/communities/ui/community-users.component.ts`. Key structural differences:

| CommunityUsersComponent | UserCommunitiesComponent |
|---|---|
| Shows users assigned to a community | Shows communities assigned to a user |
| Picker lists all users | Picker lists all communities |
| `facade.allUsers()` | `facade.allCommunities()` |
| `facade.communityUsers` | `user.communities` (from UserRead) |
| `facade.assignUser(communityId, userId)` | `facade.assignCommunity(communityId, userId)` |
| `facade.removeUser(communityId, userId)` | `facade.removeCommunity(communityId, userId)` |
| `isAssigned(user)` checks `user.communities` | `isAssigned(community)` checks `user.communities` |
| Search by user name/email | Search by community name |

```typescript
@Component({
  selector: 'app-user-communities',
  imports: [FormsModule],
  template: `
    <div class="mt-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-text-primary">Communautes</h2>
        <button
          class="px-3 py-1.5 text-sm bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors"
          (click)="togglePicker()"
        >
          {{ showPicker() ? 'Fermer' : '+ Assigner une communaute' }}
        </button>
      </div>

      @if (showPicker()) {
        <div class="mb-4 p-4 border border-border rounded-lg bg-surface-base">
          <input type="text" ... placeholder="Rechercher des communautes par nom..." ... />
          @if (facade.isLoadingCommunities()) {
            <p class="text-sm text-text-secondary">Chargement des communautes...</p>
          } @else if (filteredCommunities().length === 0) {
            <p class="text-sm text-text-secondary">Aucune communaute trouvee.</p>
          } @else {
            <div class="max-h-48 overflow-y-auto space-y-1">
              @for (community of filteredCommunities(); track community.id) {
                <!-- community row with assign button or "Deja assignee" badge -->
              }
            </div>
          }
        </div>
      }

      @if (assignedCommunities().length === 0) {
        <p class="text-sm text-text-secondary">Aucune communaute assignee a cet utilisateur.</p>
      } @else {
        <div class="space-y-1">
          @for (community of assignedCommunities(); track community.id) {
            <!-- community row with name and remove button -->
          }
        </div>
      }
    </div>
  `,
})
```

**isAssigned logic:**
```typescript
isAssigned(community: CommunityRead): boolean {
  const user = this.facade.selectedItem();
  if (!user) return false;
  return user.communities?.some(c => c.id === community.id) ?? false;
}
```

**assignedCommunities:**
```typescript
readonly assignedCommunities = computed(() => {
  const user = this.facade.selectedItem();
  return user?.communities ?? [];
});
```

**filteredCommunities:**
```typescript
readonly filteredCommunities = computed(() => {
  const query = this.searchQuery().toLowerCase();
  const communities = this.facade.allCommunities();
  if (!query) return communities;
  return communities.filter(c => c.name.toLowerCase().includes(query));
});
```

**togglePicker:**
```typescript
togglePicker(): void {
  const next = !this.showPicker();
  this.showPicker.set(next);
  if (next) {
    this.searchQuery.set('');
    this.facade.loadCommunities();
  }
}
```

**Remove with confirm:**
```typescript
async onRemove(community: UserCommunityBrief): Promise<void> {
  const user = this.facade.selectedItem();
  if (!user) return;
  const confirmed = await this.confirmDialog.confirm({
    title: 'Retirer la communaute ?',
    message: `Ceci retirera <strong>${community.name}</strong> de cet utilisateur.`,
    confirmLabel: 'Retirer',
    confirmVariant: 'danger',
  });
  if (!confirmed) return;
  this.facade.removeCommunity(community.id, user.id);
}
```

**Document click to close picker (same pattern):**
```typescript
@HostListener('document:click', ['$event'])
onDocumentClick(event: MouseEvent): void {
  if (this.showPicker() && !this.el.nativeElement.contains(event.target)) {
    this.showPicker.set(false);
  }
}
```

#### `src/app/features/users/ui/user-detail.component.ts` — modifications

Replace the simple read-only communities list (from Story 11.2) with:
```typescript
// In imports array:
imports: [MetadataGridComponent, UserCommunitiesComponent, ApiInspectorComponent, BreadcrumbComponent],

// In template, replace the communities section with:
<app-user-communities />
```

Remove the `RouterLink` import if it was only used for community links (the UserCommunitiesComponent handles its own display).

### References

- [Source: src/app/features/communities/ui/community-users.component.ts — EXACT reference, inverted pattern]
- [Source: src/app/domains/communities/community.api.ts — assignUserRequest, removeUserRequest (same endpoints)]
- [Source: src/app/domains/communities/community.store.ts — assignUserMutation, removeUserMutation pattern]
- [Source: src/app/features/communities/community.facade.ts — assignUser, removeUser methods]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
Used loadAllCommunities with PaginatedResponse and limit=500 approach; reused same community assignment endpoints as community.api.ts

### Completion Notes List
- Added loadAllCommunities, assignCommunityRequest, removeCommunityRequest to user.api.ts
- Added allCommunities/isLoadingCommunities state, assignCommunity/removeCommunity mutations, loadCommunities rxMethod to domain store
- Added allCommunities/isLoadingCommunities projections to feature store
- Added loadCommunities, assignCommunity, removeCommunity methods + assignCommunityIsPending/removeCommunityIsPending signals to facade
- Created UserCommunitiesComponent following CommunityUsersComponent pattern (inverted: shows communities for a user)
- Replaced simple read-only communities list in user-detail with interactive UserCommunitiesComponent
- Created user-communities.component.spec.ts with 4 tests
- All 828 tests pass

### File List
- Modified: `src/app/domains/users/user.api.ts`
- Modified: `src/app/domains/users/user.store.ts`
- Modified: `src/app/features/users/user.store.ts`
- Modified: `src/app/features/users/user.facade.ts`
- Modified: `src/app/features/users/ui/user-detail.component.ts`
- Created: `src/app/features/users/ui/user-communities.component.ts`
- Created: `src/app/features/users/ui/user-communities.component.spec.ts`

### Change Log
- 2026-03-11: Added interactive community assignment to user detail page with picker, search, assign/remove actions
