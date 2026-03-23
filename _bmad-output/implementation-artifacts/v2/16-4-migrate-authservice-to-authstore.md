# Story 16.4: Migrate AuthService to AuthStore

Status: ready-for-dev

## Story

As a developer,
I want authentication state managed by an ACTEE-compliant signalStore,
so that auth follows the same pattern as every other domain.

## Acceptance Criteria

1. A new `AuthStore` signalStore exists at `src/app/domains/auth/auth.store.ts` with `withState`, `withComputed`, `withMethods`
2. `LoginComponent` uses `AuthStore` instead of `AuthService`
3. Auth guard uses `AuthStore` instead of `AuthService`
4. HTTP interceptor uses `AuthStore.token()` instead of `AuthService.getToken()`
5. All remaining `AuthService` injections across the codebase are replaced with `AuthStore`
6. Old `core/auth/auth.service.ts` is deleted
7. `npx ng build` and `npx ng test --no-watch` both pass

## Tasks / Subtasks

- [ ] Task 1: Create `domains/auth/auth.store.ts` with signalStore (AC: #1)
  - [ ] 1.1 Create `src/app/domains/auth/auth.models.ts` with types:
    - `AuthUser { name, email, id, role }` (decoded from JWT)
    - `LoginResponse { access_token, token_type }` (moved from auth.service.ts)
    - `AuthState { token: string | null, user: AuthUser | null }`
  - [ ] 1.2 Create `src/app/domains/auth/auth.store.ts` using `signalStore`:
    - `withState<AuthState>({ token: getStoredToken(), user: null })` — initialize from localStorage
    - `withComputed(store => ({ isAuthenticated: computed(() => store.token() !== null) }))`
    - `withMethods(store => ...)` — inject HttpClient, Router:
      - `login(email, password)` — POST to `/auth/login`, set token + decode user, persist to localStorage
      - `refresh()` — POST to `/auth/refresh`, update token + user, persist to localStorage
      - `logout(returnUrl?)` — fire-and-forget server logout, clear localStorage, reset state, navigate to /login
      - `setToken(token)` — update token + user, persist to localStorage (used by interceptor after refresh)
      - `token()` — already exposed as signal from state (no method needed)
    - Helper: `decodeUser(token: string): AuthUser | null` — extract name, email, id (sub), role from JWT payload
  - [ ] 1.3 Convert `login()` from Observable to async/await (Promise-based) for consistency with `refresh()` — do NOT use `rxMethod`
  - [ ] 1.4 Composition order: `withState` -> `withComputed` -> `withMethods`
  - [ ] 1.5 Provide as `{ providedIn: 'root' }`

- [ ] Task 2: Create `src/app/domains/auth/auth.store.spec.ts` (AC: #1)
  - [ ] 2.1 Test initial state from localStorage
  - [ ] 2.2 Test login flow: sets token, decodes user, persists
  - [ ] 2.3 Test logout: clears token, clears user, clears localStorage, navigates
  - [ ] 2.4 Test refresh: updates token + user
  - [ ] 2.5 Test setToken: updates token + user
  - [ ] 2.6 Test isAuthenticated computed

- [ ] Task 3: Update LoginComponent to use AuthStore (AC: #2)
  - [ ] 3.1 Replace `inject(AuthService)` with `inject(AuthStore)` in `src/app/core/auth/login.component.ts`
  - [ ] 3.2 Update login call: `this.authStore.login(email, password)` — note: login may return Observable or Promise depending on store implementation; adapt accordingly
  - [ ] 3.3 Update `login.component.spec.ts`

- [ ] Task 4: Update auth guard to use AuthStore (AC: #3)
  - [ ] 4.1 Replace `inject(AuthService)` with `inject(AuthStore)` in `src/app/core/auth/auth.guard.ts`
  - [ ] 4.2 Use `authStore.isAuthenticated()` for the guard check
  - [ ] 4.3 Update `auth.guard.spec.ts`

- [ ] Task 5: Update HTTP interceptor to use AuthStore (AC: #4)
  - [ ] 5.1 Replace `inject(AuthService)` with `inject(AuthStore)` in `src/app/core/auth/auth.interceptor.ts`
  - [ ] 5.2 Use `authStore.token()` instead of `authService.getToken()`
  - [ ] 5.3 Use `authStore.refresh()` for token refresh logic
  - [ ] 5.4 Use `authStore.setToken()` after successful refresh
  - [ ] 5.5 Use `authStore.logout()` on refresh failure
  - [ ] 5.6 Update `auth.interceptor.spec.ts`

- [ ] Task 6: Replace all remaining AuthService injections (AC: #5)
  - [ ] 6.1 Search codebase for `AuthService` imports/injections
  - [ ] 6.2 Replace each with `AuthStore` — check: app-layout, any other components accessing user info
  - [ ] 6.3 Update all affected spec files

- [ ] Task 7: Delete old `core/auth/auth.service.ts` (AC: #6)
  - [ ] 7.1 Delete `src/app/core/auth/auth.service.ts`
  - [ ] 7.2 Delete `src/app/core/auth/auth.service.spec.ts`
  - [ ] 7.3 Verify no remaining imports reference the deleted files

- [ ] Task 8: Run `npx ng build` and `npx ng test --no-watch` (AC: #7)

## Dev Notes

- **CRITICAL**: This touches authentication — the most sensitive part of the app. Test login, logout, refresh, and interceptor token attachment thoroughly before marking done.
- Current `AuthService` (116 lines) at `src/app/core/auth/auth.service.ts`:
  - Private `_token` signal + localStorage persistence
  - Computeds: `isAuthenticated`, `decodedPayload` (memoized JWT parse), `userName`, `userEmail`, `userId`, `userRole`
  - Methods: `login()` (Observable), `refresh()` (async/Promise), `logout()`, `setToken()`, `getToken()`
- **Key design decision**: The current `login()` returns `Observable<LoginResponse>`. **Convert to async/await (Promise-based)** for consistency with `refresh()`. Do NOT use `rxMethod` — all store methods should be async/Promise. Update `LoginComponent` to `await` the call instead of subscribing.
- **JWT decoding**: The `decodedPayload` computed currently parses JWT on every access (memoized by signal). In the store, decode once at `setToken` time and store the `user` object in state.
- **localStorage key**: `laureat_admin_jwt` — must remain the same for session continuity.
- **Store composition order** (ACTEE rule): `withState` -> `withComputed` -> `withMethods`
- The `token` is already exposed as a state signal — no need for a `getToken()` method. Consumers use `authStore.token()`.
- Impacted files (non-exhaustive):
  - `src/app/core/auth/login.component.ts` + spec
  - `src/app/core/auth/auth.guard.ts` + spec
  - `src/app/core/auth/auth.interceptor.ts` + spec
  - Any component referencing `userName`, `userEmail`, `userRole`, `userId`

### Project Structure Notes

- **Create**: `src/app/domains/auth/auth.models.ts`
- **Create**: `src/app/domains/auth/auth.store.ts`
- **Create**: `src/app/domains/auth/auth.store.spec.ts`
- **Modify**: `src/app/core/auth/login.component.ts` + spec
- **Modify**: `src/app/core/auth/auth.guard.ts` + spec
- **Modify**: `src/app/core/auth/auth.interceptor.ts` + spec
- **Modify**: Any component injecting `AuthService`
- **Delete**: `src/app/core/auth/auth.service.ts`
- **Delete**: `src/app/core/auth/auth.service.spec.ts`

### References

- [Source: docs/architecture-ACTEE.md]
- [Source: _bmad-output/planning-artifacts/v2/epics.md#Story 16.4]
- [Source: _bmad-output/implementation-artifacts/v2/v2-technical-analysis.md]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
