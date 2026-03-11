# Story 11.3: User Create & Edit Form

Status: review

## Story

As an admin,
I want to create new users and edit existing ones,
so that I can manage user accounts in the system.

## Acceptance Criteria

1. **Given** the admin navigates to `/users/new` **When** the create form loads **Then** fields are displayed: email (required, email validation), first_name (required), last_name (required), password (required), is_active (toggle, default true), role (dropdown populated from GET /admin/roles/).
2. **Given** the admin fills in the create form and submits **When** validation passes **Then** POST /users/ is called with the form data, a success toast "Utilisateur cree" is shown, and the admin is navigated to `/users`.
3. **Given** the admin navigates to `/users/:id/edit` **When** the edit form loads **Then** the form is pre-populated from the user's data via effect(), the password field is NOT shown, and the role dropdown is populated from GET /admin/roles/.
4. **Given** the admin modifies user data and submits the edit form **When** validation passes **Then** PUT /users/{id} is called with the updated fields. If the role has changed from the original, PUT /admin/roles/user/{user_id}?role={newRole} is called separately. A success toast is shown and the admin is navigated to `/users/:id`.
5. **Given** the form has validation errors **When** the admin submits **Then** all fields are marked as touched, the first invalid field is focused, and inline error messages are shown.
6. **Given** the admin has unsaved changes **When** they try to navigate away **Then** the unsavedChangesGuard prompts for confirmation.
7. **Given** the admin presses Ctrl+S (or Cmd+S) **When** the form is dirty and valid **Then** the form submits.
8. **Given** the admin presses Escape **When** no form control is focused **Then** the admin is navigated back (to detail in edit mode, to list in create mode).

## Tasks / Subtasks

- [x] Task 1: Create user form component (AC: #1, #2, #3, #4, #5, #6, #7, #8)
  - [x] Create `src/app/features/users/ui/user-form.component.ts`
  - [x] Inject `UserFacade`, `FormBuilder`, `ActivatedRoute`, `Router`, `ElementRef`
  - [x] Import `ReactiveFormsModule`, `BreadcrumbComponent`
  - [x] Determine isEditMode from route param `:id`
  - [x] Create form using `createUserForm(fb, undefined, isEditMode)`
  - [x] On edit: call `facade.select(editId)` in ngOnInit, patch form via effect() with formPatched guard
  - [x] On edit: call `facade.loadRoles()` to populate dropdown; on create: also call `facade.loadRoles()`
  - [x] Role dropdown: iterate over `facade.roles()` signal to build `<option>` elements
  - [x] is_active: use a checkbox or toggle input bound to `formControlName="is_active"`
  - [x] Password field: conditionally render only when `!isEditMode`
  - [x] Submit handler: if edit and role changed, call `facade.updateRole(id, newRole)` in addition to `facade.update(id, data)`
  - [x] Implement HasUnsavedChanges interface
  - [x] Implement Ctrl+S and Escape keyboard shortcuts (same pattern as CommunityFormComponent)
  - [x] Implement goBack() navigation

- [x] Task 2: Ensure facade supports role operations (AC: #3, #4)
  - [x] Verify `facade.loadRoles()` triggers domain store's `loadRoles` rxMethod
  - [x] Verify `facade.updateRole(userId, role)` calls `updateRoleMutation` and shows toast on success
  - [x] Verify `facade.roles` signal is projected through feature store

- [x] Task 3: Handle role update on edit submission (AC: #4)
  - [x] In the form component's `onSubmit()`, compare current role with original `facade.selectedItem()?.role`
  - [x] If role has changed: call `facade.update(id, dataWithoutRole)` AND `facade.updateRole(id, newRole)`
  - [x] The UserUpdate schema accepts `role` but Story spec says to use the separate role endpoint — follow the separate endpoint approach for consistency with the API design

- [x] Task 4: Write tests (AC: all)
  - [x] Create `src/app/features/users/ui/user-form.component.spec.ts`
  - [x] Run `npx ng test --no-watch`

## Dev Notes

### Project Structure Notes

**File to create:**
```
src/app/features/users/ui/user-form.component.ts
src/app/features/users/ui/user-form.component.spec.ts
```

**Prerequisites:** Story 11.1 (domain layer with form factory, facade with role methods).

### File-by-File Implementation Guide

#### `src/app/features/users/ui/user-form.component.ts`

Follow `src/app/features/communities/ui/community-form.component.ts` as the exact reference. Key differences:

**Form creation:**
The form factory `createUserForm(fb, initial?, isEdit?)` conditionally includes the password field. Call it with `isEditMode`:
```typescript
readonly form = createUserForm(this.fb, undefined, this.isEditMode);
```
IMPORTANT: `isEditMode` must be determined BEFORE the form is created. Since `isEditMode` depends on the route param, and the route is available in the constructor, you may need to restructure slightly:
```typescript
private readonly route = inject(ActivatedRoute);
readonly isEditMode = !!this.route.snapshot.paramMap.get('id');
readonly editId = this.route.snapshot.paramMap.get('id');
readonly form = createUserForm(this.fb, undefined, this.isEditMode);
```
This works because `inject(ActivatedRoute)` is available in field initializers.

**Template fields:**

Email field:
```html
<div>
  <label for="email" class="block text-sm font-medium text-text-primary mb-1">Email *</label>
  <input id="email" formControlName="email" type="email"
    class="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand"
    [class.border-error]="showError('email')" />
  @if (showError('email')) {
    <p class="mt-1 text-sm text-error">Un email valide est obligatoire.</p>
  }
</div>
```

First name and last name: same pattern with appropriate labels ("Prenom *", "Nom *") and error messages.

Password field (create only):
```html
@if (!isEditMode) {
  <div>
    <label for="password" class="block text-sm font-medium text-text-primary mb-1">Mot de passe *</label>
    <input id="password" formControlName="password" type="password"
      class="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand"
      [class.border-error]="showError('password')" />
    @if (showError('password')) {
      <p class="mt-1 text-sm text-error">Le mot de passe est obligatoire.</p>
    }
  </div>
}
```

Role dropdown:
```html
<div>
  <label for="role" class="block text-sm font-medium text-text-primary mb-1">Role *</label>
  <select id="role" formControlName="role"
    class="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand"
    [class.border-error]="showError('role')">
    <option [ngValue]="null" disabled>Selectionner un role</option>
    @for (role of facade.roles(); track role) {
      <option [value]="role">{{ role }}</option>
    }
  </select>
  @if (showError('role')) {
    <p class="mt-1 text-sm text-error">Le role est obligatoire.</p>
  }
</div>
```
Note: Add `NgSelectOption` or ensure `<option>` works with reactive forms. The `[ngValue]` for null requires importing appropriate directives. Using `[value]` for string options is fine.

is_active toggle:
```html
<div class="flex items-center gap-3">
  <label for="is_active" class="text-sm font-medium text-text-primary">Actif</label>
  <input id="is_active" formControlName="is_active" type="checkbox"
    class="h-4 w-4 rounded border-border text-brand focus:ring-brand" />
</div>
```

**Effect for edit mode patching:**
```typescript
constructor() {
  effect(() => {
    const item = this.facade.selectedItem();
    if (this.isEditMode && item && item.id === this.editId && !this.formPatched) {
      this.formPatched = true;
      this.form.patchValue({
        email: item.email,
        first_name: item.first_name,
        last_name: item.last_name,
        is_active: item.is_active,
        role: item.role,
      });
    }
  });
}
```

**ngOnInit:**
```typescript
ngOnInit(): void {
  this.facade.loadRoles();
  if (this.isEditMode && this.editId) {
    this.facade.select(this.editId);
  }
}
```

**Submit handler with role update:**
```typescript
async onSubmit(): Promise<void> {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    const firstInvalid = this.el.nativeElement.querySelector('.ng-invalid[formControlName]') as HTMLElement | null;
    firstInvalid?.focus();
    return;
  }

  const raw = this.form.getRawValue();
  this.form.markAsPristine();

  if (this.isEditMode && this.editId) {
    const originalRole = this.facade.selectedItem()?.role;
    const { role, ...userData } = raw;
    await this.facade.update(this.editId, userData);
    if (role !== originalRole) {
      await this.facade.updateRole(this.editId, role);
    }
  } else {
    await this.facade.create(raw);
  }
}
```

**Breadcrumbs:**
```html
@if (isEditMode) {
  <app-breadcrumb [items]="[
    { label: 'Utilisateurs', route: '/users' },
    { label: itemName() ?? '...', route: '/users/' + editId },
    { label: 'Modifier' }
  ]" />
} @else {
  <app-breadcrumb [items]="[
    { label: 'Utilisateurs', route: '/users' },
    { label: 'Nouvel utilisateur' }
  ]" />
}
```

Where `itemName = computed(() => { const u = this.facade.selectedItem(); return u ? u.first_name + ' ' + u.last_name : null; })`.

**Keyboard shortcuts and HasUnsavedChanges:** Copy exactly from CommunityFormComponent.

**goBack:**
```typescript
goBack(): void {
  if (this.isEditMode && this.editId) {
    this.router.navigate(['/users', this.editId]);
  } else {
    this.router.navigate(['/users']);
  }
}
```

### Role Update API Pattern — REQUIRES VERIFICATION

> **Action item (2026-03-11 party-mode review):** The dev agent MUST verify whether `httpMutation` from `@angular-architects/ngrx-toolkit` supports `params` in the request config before implementing. If it does not, use the URL-embedded query string fallback.

The role update endpoint is `PUT /admin/roles/user/{user_id}?role={role}` — it uses a **query parameter**, not a request body. Two implementation options:

**Option A (preferred, if `httpMutation` supports `params`):**
```typescript
updateUserRoleRequest({ userId, role }) {
  return {
    url: `${environment.apiBaseUrl}/admin/roles/user/${userId}`,
    method: 'PUT',
    params: new HttpParams().set('role', role),
  };
}
```

**Option B (fallback — embed query param in URL):**
```typescript
updateUserRoleRequest({ userId, role }) {
  return {
    url: `${environment.apiBaseUrl}/admin/roles/user/${userId}?role=${encodeURIComponent(role)}`,
    method: 'PUT',
  };
}
```

Test whichever approach is used with a real API call to confirm the backend accepts the query parameter correctly.

### References

- [Source: src/app/features/communities/ui/community-form.component.ts — canonical form component]
- [Source: src/app/domains/communities/forms/community.form.ts — canonical form factory]
- [Source: src/app/shared/guards/unsaved-changes.guard.ts — unsaved changes guard]
- [Source: src/app/core/api/generated/api-types.ts — UserCreate, UserUpdate, RoleType schemas]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
Form factory was already created in Story 11.1; routes updated to include form routes with unsavedChangesGuard

### Completion Notes List
- Created user-form.component.ts following CommunityFormComponent pattern exactly
- Email, first_name, last_name fields with validation and error messages
- Password field conditionally rendered only in create mode
- Role dropdown populated from facade.roles() signal
- is_active checkbox toggle
- Edit mode: patches form via effect() with formPatched guard, calls facade.select() and facade.loadRoles()
- Submit handler: create mode calls facade.create(), edit mode calls facade.update() + facade.updateRole() if role changed
- HasUnsavedChanges interface, Ctrl+S/Escape keyboard shortcuts
- Updated users.routes.ts with form routes (new, :id/edit) and unsavedChangesGuard
- Created user-form.component.spec.ts with 7 tests covering create and edit modes
- All 828 tests pass

### File List
- Created: `src/app/features/users/ui/user-form.component.ts`
- Created: `src/app/features/users/ui/user-form.component.spec.ts`
- Modified: `src/app/pages/users/users.routes.ts`

### Change Log
- 2026-03-11: Created user form component with create/edit modes, role management, keyboard shortcuts, and unsaved changes guard
