# Story 11.1: Users Domain & List Page

Status: review

## Story

As an admin,
I want to see a list of all users with their key information,
so that I can find and manage user accounts.

## Acceptance Criteria

1. **Given** the admin navigates to `/users` **When** the page loads **Then** a paginated table of users is displayed with columns: Display name (first_name + last_name, sortable, bold), Email (sortable), Role (sortable), Active status (status-badge), Community count, Updated date (formatDateFr, sortable).
2. **Given** the user list has more results than the page size **When** the admin clicks "Load More" **Then** the next page of results is appended via cursor pagination.
3. **Given** the admin clicks a row **When** the row click event fires **Then** the admin is navigated to `/users/:id`.
4. **Given** the admin is on the users list page **When** they click "Creer un utilisateur" **Then** they are navigated to `/users/new`.
5. **Given** the app shell navigation sidebar **When** the admin views the "Administration" section **Then** a "Utilisateurs" entry appears with the `User` Lucide icon, linking to `/users`.
6. **Given** the domain layer is created **When** the store is initialized **Then** it follows the ACTEE composition order: withState -> withProps -> withFeature(withCursorPagination) -> withMutations -> withMethods.
7. **Given** the feature store exists **When** it is inspected **Then** it contains ONLY `withComputed` projections from the domain store.
8. **Given** the facade exists **When** it is inspected **Then** it exposes readonly signals + intention methods, handles toast/navigation, and maps HTTP errors (409, 422, generic).

## Tasks / Subtasks

- [x] Task 1: Create domain models (AC: #6)
  - [x] Create `src/app/domains/users/user.models.ts`
  - [x] Re-export `UserRead`, `UserCreate`, `UserUpdate` from `@app/core/api/generated/api-types`
  - [x] Re-export `UserCommunityBrief` (already exists in community.models.ts but user domain should have its own re-export)
  - [x] Export `RoleType` from generated types

- [x] Task 2: Create domain API file (AC: #6)
  - [x] Create `src/app/domains/users/user.api.ts`
  - [x] `BASE_URL = ${environment.apiBaseUrl}/users/`
  - [x] `ROLES_URL = ${environment.apiBaseUrl}/admin/roles/`
  - [x] `userListLoader(http, params)` — GET /users/ with cursor/limit/filters, returns `Observable<PaginatedResponse<UserRead>>`
  - [x] `loadUser(http, id)` — GET /users/{id}, returns `Observable<UserRead>`
  - [x] `createUserRequest(data: UserCreate)` — returns `{ url, method: 'POST', body }`
  - [x] `updateUserRequest({ id, data })` — returns `{ url, method: 'PUT', body }`
  - [x] `deleteUserRequest(id)` — returns `{ url, method: 'DELETE' }`
  - [x] `loadRoles(http)` — GET /admin/roles/, returns `Observable<string[]>`
  - [x] `loadUserRole(http, userId)` — GET /admin/roles/user/{userId}, returns `Observable<RoleType>`
  - [x] `updateUserRoleRequest({ userId, role })` — returns `{ url: ROLES_URL + 'user/' + userId, method: 'PUT', params: { role } }`

- [x] Task 3: Create domain store (AC: #6)
  - [x] Create `src/app/domains/users/user.store.ts`
  - [x] `UserDomainStore = signalStore({ providedIn: 'root' }, ...)`
  - [x] Composition: withState -> withProps -> withFeature(withCursorPagination) -> withMutations -> withMethods
  - [x] State: `selectedItem: null as UserRead | null`, `isLoadingDetail: false`, `detailError: null as string | null`, `roles: [] as string[]`, `isLoadingRoles: false`
  - [x] withProps: `_http: inject(HttpClient)`
  - [x] withFeature: `withCursorPagination<UserRead>({ loader: (params) => userListLoader(store._http, params) })`
  - [x] withMutations: `createMutation`, `updateMutation`, `deleteMutation`, `updateRoleMutation`
  - [x] withMethods: `selectById` (rxMethod with switchMap), `clearSelection`, `loadRoles` (rxMethod)

- [x] Task 4: Create form factory (AC: #6)
  - [x] Create `src/app/domains/users/forms/user.form.ts`
  - [x] `createUserForm(fb, initial?, isEdit?)` — returns FormGroup
  - [x] Fields: email (required, Validators.email), first_name (required), last_name (required), password (required only if !isEdit), is_active (default true), role (required)
  - [x] Password field only present when !isEdit

- [x] Task 5: Create feature store (AC: #7)
  - [x] Create `src/app/features/users/user.store.ts`
  - [x] `UserFeatureStore = signalStore({ providedIn: 'root' }, withComputed(...))`
  - [x] Project: items, selectedItem, isLoading, isLoadingDetail, hasMore, error, detailError, isEmpty, totalLoaded, roles, isLoadingRoles

- [x] Task 6: Create facade (AC: #8)
  - [x] Create `src/app/features/users/user.facade.ts`
  - [x] Inject: `UserDomainStore`, `UserFeatureStore`, `ToastService`, `Router`
  - [x] Readonly signals: items, selectedItem, isLoading, isLoadingDetail, hasMore, error, detailError, isEmpty, roles, isLoadingRoles
  - [x] Mutation status: createIsPending, updateIsPending, deleteIsPending, updateRoleIsPending, anyMutationPending
  - [x] Methods: load(filters?), loadMore(), select(id), clearSelection(), loadRoles(), create(data), update(id, data), delete(id), updateRole(userId, role)
  - [x] create: on success toast "Utilisateur cree" + navigate to /users
  - [x] update: on success toast "Utilisateur mis a jour" + reload list + navigate to /users/:id
  - [x] delete: on success toast "Utilisateur supprime" + navigate to /users
  - [x] updateRole: on success toast "Role mis a jour"
  - [x] handleMutationError: 409 conflict, 422 validation, generic fallback (copy pattern from CommunityFacade)

- [x] Task 7: Create list component (AC: #1, #2, #3, #4)
  - [x] Create `src/app/features/users/ui/user-list.component.ts`
  - [x] Inject `UserFacade`, `Router`
  - [x] hasLoaded signal with effect() guard (same pattern as CommunityListComponent)
  - [x] Columns: display_name (bold, sortable), email (sortable), role (sortable), is_active (status-badge), community_count, updated_at (date, sortable)
  - [x] For display_name: use `type: 'dual-line'` or a computed key — OR define a custom key with `valueGetter` if DataTable supports it. Otherwise, use a computed transform in facade/store that maps `first_name + ' ' + last_name` into a `display_name` field
  - [x] Community count: derive from `communities?.length ?? 0`
  - [x] "Creer un utilisateur" button -> /users/new
  - [x] Row click -> /users/:id
  - [x] Load more -> facade.loadMore()
  - [x] ngOnInit: facade.load()

- [x] Task 8: Create pages and routes (AC: #3, #5)
  - [x] Create `src/app/pages/users/users.page.ts` — `@Component({ template: '<router-outlet />', imports: [RouterOutlet] })`
  - [x] Create `src/app/pages/users/users.routes.ts` — routes: list, new, :id, :id/edit with unsavedChangesGuard on form routes
  - [x] Add to `src/app/app.routes.ts`: `{ path: 'users', loadChildren: () => import('./pages/users/users.routes').then(m => m.usersRoutes) }`

- [x] Task 9: Add shell navigation entry (AC: #5)
  - [x] In `src/app/core/layout/app-layout.component.ts`:
  - [x] Import `User` from `lucide-angular`
  - [x] Add to adminItems: `{ label: 'Utilisateurs', route: '/users', icon: User }`

- [x] Task 10: Write tests (AC: all)
  - [x] `src/app/domains/users/user.store.spec.ts` — domain store tests using HttpTestingController
  - [x] `src/app/features/users/user.facade.spec.ts` — facade tests (success + error paths)
  - [x] `src/app/features/users/ui/user-list.component.spec.ts` — basic render test
  - [x] Run `npx ng test --no-watch` — verify zero regressions

## Dev Notes

### Project Structure Notes

This story creates an entirely new domain from scratch. Follow the community domain as the canonical reference.

**Directory structure to create:**
```
src/app/domains/users/
  user.models.ts
  user.api.ts
  user.store.ts
  user.store.spec.ts
  forms/
    user.form.ts

src/app/features/users/
  user.store.ts
  user.facade.ts
  user.facade.spec.ts
  ui/
    user-list.component.ts
    user-list.component.spec.ts

src/app/pages/users/
  users.page.ts
  users.routes.ts
```

**Files to modify:**
```
src/app/app.routes.ts                            — add users route
src/app/core/layout/app-layout.component.ts      — add nav entry
```

### File-by-File Implementation Guide

#### 1. `src/app/domains/users/user.models.ts`

Follow `src/app/domains/communities/community.models.ts` exactly:
```typescript
import { components } from '@app/core/api/generated/api-types';

export type UserRead = components['schemas']['UserRead'];
export type UserCreate = components['schemas']['UserCreate'];
export type UserUpdate = components['schemas']['UserUpdate'];
export type UserCommunityBrief = components['schemas']['UserCommunityBrief'];
export type RoleType = components['schemas']['RoleType'];
```

Note: `UserRead` fields from API: `id`, `email`, `first_name`, `last_name`, `is_active`, `role` (RoleType: "collectivite" | "cdm" | "admin"), `communities` (UserCommunityBrief[]), `created_at`, `updated_at`.

`UserCreate` fields: `email`, `first_name`, `last_name`, `is_active` (default true), `password`, `role?`.

`UserUpdate` fields: `email?`, `first_name?`, `last_name?`, `is_active?`, `role?`.

#### 2. `src/app/domains/users/user.api.ts`

Follow `src/app/domains/communities/community.api.ts`. Key differences:
- BASE_URL is `/users/` not `/communities/`
- No user assignment endpoints here (those stay in community.api.ts)
- Add role endpoints: `loadRoles(http)` → GET `/admin/roles/`, returns `Observable<string[]>`
- Add `loadUserRole(http, userId)` → GET `/admin/roles/user/{userId}`
- Add `updateUserRoleRequest({ userId, role })` → PUT `/admin/roles/user/{userId}?role={role}`

Note: The role update endpoint uses a QUERY PARAMETER, not a body: `PUT /admin/roles/user/{user_id}?role=admin`. The httpMutation request object should be: `{ url: ROLES_URL + 'user/' + params.userId, method: 'PUT', params: { role: params.role } }`. Check how httpMutation handles query params — may need HttpParams.

#### 3. `src/app/domains/users/user.store.ts`

Follow `src/app/domains/communities/community.store.ts` exactly for composition order:
```typescript
export const UserDomainStore = signalStore(
  { providedIn: 'root' },
  withState({
    selectedItem: null as UserRead | null,
    isLoadingDetail: false,
    detailError: null as string | null,
    roles: [] as string[],
    isLoadingRoles: false,
  }),
  withProps(() => ({ _http: inject(HttpClient) })),
  withFeature((store) =>
    withCursorPagination<UserRead>({
      loader: (params) => userListLoader(store._http, params),
    }),
  ),
  withMutations(() => ({
    createMutation: httpMutation({ request: (data: UserCreate) => createUserRequest(data), operator: concatOp }),
    updateMutation: httpMutation({ request: (params: { id: string; data: UserUpdate }) => updateUserRequest(params), operator: concatOp }),
    deleteMutation: httpMutation({ request: (id: string) => deleteUserRequest(id), operator: concatOp }),
    updateRoleMutation: httpMutation({ request: (params: { userId: string; role: string }) => updateUserRoleRequest(params), operator: concatOp }),
  })),
  withMethods((store) => ({
    selectById: rxMethod<string>(
      pipe(
        tap(() => patch(store, { isLoadingDetail: true })),
        switchMap((id) =>
          loadUser(store._http, id).pipe(
            tap((item) => patch(store, { selectedItem: item, isLoadingDetail: false, detailError: null })),
            catchError((err) => {
              patch(store, { detailError: err?.message ?? 'Echec du chargement', isLoadingDetail: false, selectedItem: null });
              return EMPTY;
            }),
          ),
        ),
      ),
    ),
    clearSelection(): void {
      patch(store, { selectedItem: null });
    },
    loadRoles: rxMethod<void>(
      pipe(
        tap(() => patch(store, { isLoadingRoles: true })),
        switchMap(() =>
          loadRoles(store._http).pipe(
            tap((roles) => patch(store, { roles, isLoadingRoles: false })),
            catchError(() => {
              patch(store, { isLoadingRoles: false });
              return EMPTY;
            }),
          ),
        ),
      ),
    ),
  })),
);
```

#### 4. `src/app/domains/users/forms/user.form.ts`

Follow `src/app/domains/communities/forms/community.form.ts`:
```typescript
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserRead } from '../user.models';

export function createUserForm(fb: FormBuilder, initial?: Partial<UserRead>, isEdit = false): FormGroup {
  const group: Record<string, unknown[]> = {
    email: [initial?.email ?? '', [Validators.required, Validators.email]],
    first_name: [initial?.first_name ?? '', Validators.required],
    last_name: [initial?.last_name ?? '', Validators.required],
    is_active: [initial?.is_active ?? true],
    role: [initial?.role ?? null, Validators.required],
  };
  if (!isEdit) {
    group['password'] = ['', Validators.required];
  }
  return fb.group(group);
}
```

#### 5. `src/app/features/users/user.store.ts`

Follow `src/app/features/communities/community.store.ts` exactly — withComputed ONLY:
```typescript
export const UserFeatureStore = signalStore(
  { providedIn: 'root' },
  withComputed(() => {
    const domainStore = inject(UserDomainStore);
    return {
      items: computed(() => domainStore.items() as UserRead[]),
      selectedItem: computed(() => domainStore.selectedItem()),
      isLoading: computed(() => domainStore.isLoading()),
      isLoadingDetail: computed(() => domainStore.isLoadingDetail()),
      hasMore: computed(() => domainStore.hasMore()),
      error: computed(() => domainStore.error()),
      detailError: computed(() => domainStore.detailError()),
      isEmpty: computed(() => domainStore.isEmpty()),
      totalLoaded: computed(() => domainStore.totalLoaded()),
      roles: computed(() => domainStore.roles()),
      isLoadingRoles: computed(() => domainStore.isLoadingRoles()),
    };
  }),
);
```

#### 6. `src/app/features/users/user.facade.ts`

Follow `src/app/features/communities/community.facade.ts`. Key differences:
- No user assignment methods (that's Story 11.4)
- Add `loadRoles()`, `updateRole(userId, role)` methods
- Toast messages in French: "Utilisateur cree", "Utilisateur mis a jour", "Utilisateur supprime", "Role mis a jour"

#### 7. `src/app/features/users/ui/user-list.component.ts`

Follow `src/app/features/communities/ui/community-list.component.ts`. Key differences:
- Title: "Utilisateurs"
- Button: "Creer un utilisateur" -> /users/new
- Columns need special handling:
  - Display name: The DataTable works with `key` to access object properties. Since UserRead has `first_name` and `last_name` separately, you need to handle this. Options: (a) add a computed property in the feature store that maps items with a `display_name` field, (b) use DataTable's `type: 'dual-line'` if it supports combined fields, or (c) create a simple transform in the list component. Check DataTable's ColumnDef for supported options.
  - Role: simple text column `{ key: 'role', label: 'Role', sortable: true }`
  - Active status: `{ key: 'is_active', label: 'Statut', type: 'status-badge' }` — check if DataTable supports boolean status badges
  - Community count: May need a computed/transform since it's `communities?.length`
  - Updated date: `{ key: 'updated_at', label: 'Mis a jour le', type: 'date', sortable: true }`

#### 8. `src/app/pages/users/users.page.ts`

Copy `src/app/pages/communities/communities.page.ts` exactly, rename to `UsersPage`:
```typescript
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-users-page',
  template: `<router-outlet />`,
  imports: [RouterOutlet],
})
export class UsersPage {}
```

#### 9. `src/app/pages/users/users.routes.ts`

Follow `src/app/pages/communities/communities.routes.ts`:
```typescript
import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '@shared/guards/unsaved-changes.guard';
import { UsersPage } from './users.page';
import { UserListComponent } from '@features/users/ui/user-list.component';
import { UserDetailComponent } from '@features/users/ui/user-detail.component';
import { UserFormComponent } from '@features/users/ui/user-form.component';

export const usersRoutes: Routes = [
  {
    path: '',
    component: UsersPage,
    children: [
      { path: '', component: UserListComponent },
      { path: 'new', component: UserFormComponent, canDeactivate: [unsavedChangesGuard] },
      { path: ':id', component: UserDetailComponent },
      { path: ':id/edit', component: UserFormComponent, canDeactivate: [unsavedChangesGuard] },
    ],
  },
];
```

Note: UserDetailComponent and UserFormComponent are created in Stories 11.2 and 11.3. For this story, either create stubs or import only UserListComponent and leave detail/form routes for later stories.

#### 10. `src/app/app.routes.ts`

Add after the `agents` route:
```typescript
{
  path: 'users',
  loadChildren: () =>
    import('./pages/users/users.routes').then((m) => m.usersRoutes),
},
```

#### 11. `src/app/core/layout/app-layout.component.ts`

- Add `User` to the lucide-angular import (note: `Users` is already imported for Communities icon; `User` is the single-person icon)
- Add to `adminItems`: `{ label: 'Utilisateurs', route: '/users', icon: User }`

### API Types Reference (from api-types.ts)

```typescript
UserRead: {
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean; // default true
  id: string; // uuid
  created_at: string; // date-time
  updated_at: string; // date-time
  role: RoleType; // "collectivite" | "cdm" | "admin"
  communities?: UserCommunityBrief[];
}

UserCreate: {
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean; // default true
  password: string;
  role?: RoleType | null;
}

UserUpdate: {
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  is_active?: boolean | null;
  role?: RoleType | null;
}

RoleType: "collectivite" | "cdm" | "admin"

// GET /admin/roles/ returns string[] (list of role names)
// GET /admin/roles/user/{user_id} returns RoleType
// PUT /admin/roles/user/{user_id}?role=RoleType returns UserRead
```

### Known Workarounds

1. **`patch()` helper**: Use `patchState(store, state as never)` via the `patch()` helper from `@domains/shared/store.utils` — NgRx signals generic typing limitation.
2. **`withProps` for HttpClient**: Must inject HttpClient via `withProps` BEFORE `withCursorPagination` — `inject()` fails inside rxMethod's switchMap.
3. **Vitest sync**: No `fakeAsync`/`tick` — use synchronous `of()` observables and `HttpTestingController`.

### Anti-Patterns to Avoid

- Do NOT let UI components import `UserDomainStore` directly — facade only
- Do NOT put `withMutations` or `withMethods` in the feature store — `withComputed` only
- Do NOT define forms inline in components — use domain form factory
- Do NOT use `subscribe()` in components — signals and `effect()` only
- Do NOT forget per-mutation status signals in facade
- Do NOT call HttpClient directly in store — use API file functions
- Do NOT import UserRead from community.models.ts — create user.models.ts with its own re-exports

### Dependencies

- `withCursorPagination` from `src/app/domains/shared/with-cursor-pagination.ts`
- `patch` from `src/app/domains/shared/store.utils.ts`
- `DataTableComponent` from `src/app/shared/components/data-table/data-table.component.ts`
- `ToastService` from `src/app/shared/services/toast.service.ts`
- `unsavedChangesGuard` from `src/app/shared/guards/unsaved-changes.guard.ts`
- `environment` from `src/environments/environment.ts`
- `PaginatedResponse` from `src/app/core/api/paginated-response.model.ts`

### References

- [Source: src/app/domains/communities/community.models.ts — canonical models pattern]
- [Source: src/app/domains/communities/community.api.ts — canonical API pattern]
- [Source: src/app/domains/communities/community.store.ts — canonical domain store pattern]
- [Source: src/app/domains/communities/forms/community.form.ts — canonical form factory pattern]
- [Source: src/app/features/communities/community.store.ts — canonical feature store pattern]
- [Source: src/app/features/communities/community.facade.ts — canonical facade pattern]
- [Source: src/app/features/communities/ui/community-list.component.ts — canonical list component pattern]
- [Source: src/app/pages/communities/communities.page.ts — canonical page wrapper]
- [Source: src/app/pages/communities/communities.routes.ts — canonical routes pattern]
- [Source: src/app/app.routes.ts — route registration]
- [Source: src/app/core/layout/app-layout.component.ts — shell navigation]
- [Source: src/app/core/api/generated/api-types.ts — UserRead, UserCreate, UserUpdate, RoleType schemas]
- [Source: _bmad-output/implementation-artifacts/v1/2-1-communities-crud-with-actee-pattern.md — closest prior full-domain story]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- User creation uses POST /auth/register (not POST /users/) — discovered from API spec
- Role update uses query parameter in URL (PUT /admin/roles/user/{id}?role=X) — used URL-embedded approach
- Routes only include list for now; detail/form routes deferred to Stories 11.2/11.3

### Completion Notes List
- Created full ACTEE domain: models, API, domain store, form factory, feature store, facade
- Created list component with computed rows (display_name, is_active_display, community_count)
- Created page wrapper and routes with lazy loading
- Added "Utilisateurs" nav entry with User lucide icon
- Updated app-layout test for new nav item count (7→8)

### File List
- Created: `src/app/domains/users/user.models.ts`
- Created: `src/app/domains/users/user.api.ts`
- Created: `src/app/domains/users/user.store.ts`
- Created: `src/app/domains/users/forms/user.form.ts`
- Created: `src/app/features/users/user.store.ts`
- Created: `src/app/features/users/user.facade.ts`
- Created: `src/app/features/users/ui/user-list.component.ts`
- Created: `src/app/pages/users/users.page.ts`
- Created: `src/app/pages/users/users.routes.ts`
- Modified: `src/app/app.routes.ts`
- Modified: `src/app/core/layout/app-layout.component.ts`
- Modified: `src/app/core/layout/app-layout.component.spec.ts`

### Change Log
- 2026-03-11: Created users domain from scratch — full ACTEE stack with list page, navigation, and routing
