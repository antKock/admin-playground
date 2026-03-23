# Story 16.4: Migrate AuthService to AuthStore

Status: done

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

- [x] Task 1–8: All completed (see completion notes)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Completion Notes List

- Created `src/app/domains/auth/auth.models.ts` with `AuthUser`, `LoginResponse`, `AuthState` types
- Created `src/app/domains/auth/auth.store.ts` as signalStore with `withState`, `withComputed`, `withMethods`, `withHooks`
- Uses `withHooks.onInit` to read from localStorage on each instantiation (solves test singleton issue)
- Converted `login()` from Observable to async/await (Promise-based) for consistency
- JWT decoded once at `setToken`/`login`/`refresh` time, stored in state as `user` object
- Created comprehensive `auth.store.spec.ts` with 7 tests
- Updated `LoginComponent`: async/await login, `AuthStore` injection
- Updated `auth.guard.ts`: all 3 guards (`authGuard`, `adminGuard`, `loginGuard`) now use `AuthStore`
- Updated `auth.interceptor.ts`: uses `authStore.token()`, `authStore.refresh()`, `authStore.logout()`
- Updated `app-layout.component.ts`: uses `AuthStore` for `userEmail` and `logout()`
- Updated `activity-feed.facade.ts`: uses `AuthStore` for `userId()`
- Updated all affected spec files
- Deleted old `auth.service.ts` and `auth.service.spec.ts`
- Build passes, all 84 test files (990 tests) pass with zero regressions

### File List

- `src/app/domains/auth/auth.models.ts` (new)
- `src/app/domains/auth/auth.store.ts` (new)
- `src/app/domains/auth/auth.store.spec.ts` (new)
- `src/app/core/auth/login.component.ts` (modified)
- `src/app/core/auth/login.component.spec.ts` (modified)
- `src/app/core/auth/auth.guard.ts` (modified)
- `src/app/core/auth/auth.guard.spec.ts` (modified)
- `src/app/core/auth/auth.interceptor.ts` (modified)
- `src/app/core/layout/app-layout.component.ts` (modified)
- `src/app/core/layout/app-layout.component.spec.ts` (modified)
- `src/app/features/activity-feed/activity-feed.facade.ts` (modified)
- `src/app/features/activity-feed/activity-feed.facade.spec.ts` (modified)
- `src/app/core/auth/auth.service.ts` (deleted)
- `src/app/core/auth/auth.service.spec.ts` (deleted)
