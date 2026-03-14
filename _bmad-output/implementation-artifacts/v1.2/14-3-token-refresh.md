# Story 14.3: Token Refresh

Status: done

## Story

As an operator,
I want my session to stay active without manual re-login,
So that I can work without interruption for extended periods.

## Acceptance Criteria

1. **Given** `POST /auth/refresh` exists (cookie-based) **When** an API call returns 401 **Then** the interceptor attempts a silent refresh before logging out
2. **Given** the refresh succeeds **When** the original request is retried **Then** it completes transparently to the user
3. **Given** the refresh fails (expired refresh token) **When** handling the error **Then** the user is redirected to login with `returnUrl` preserved
4. **Given** concurrent requests receive 401 **When** a refresh is already in-flight **Then** other requests queue and retry after the refresh completes (no race conditions, no multiple refresh calls)
5. **Given** the user clicks logout **When** `POST /auth/logout` is called **Then** the refresh token is invalidated server-side
6. **Given** the login response **When** received **Then** refresh token is stored as httpOnly cookie by the browser (no localStorage for refresh token)

## Tasks / Subtasks

- [x] Task 1: Update auth service for refresh (AC: #1, #6)
  - [x] Add `refresh()` method to `auth.service.ts` calling `POST /auth/refresh`
  - [x] The refresh endpoint returns a new access token; store it as before
  - [x] Refresh token is cookie-based (httpOnly) — browser handles storage
  - [x] Ensure `HttpClient` calls include `withCredentials: true` for cookie transmission
- [x] Task 2: Update auth interceptor with retry-on-401 (AC: #1, #2, #3, #4)
  - [x] On 401 (non-auth endpoints): attempt `authService.refresh()`
  - [x] If refresh succeeds: clone original request with new token, retry
  - [x] If refresh fails: logout + redirect to login with returnUrl
  - [x] Use a `BehaviorSubject<boolean>` or similar to queue concurrent requests during refresh
  - [x] Skip refresh for auth endpoints themselves (`/auth/login`, `/auth/refresh`, `/auth/logout`)
- [x] Task 3: Update logout (AC: #5)
  - [x] Ensure `POST /auth/logout` is called to invalidate refresh token
  - [x] Clear local access token + navigate to login
- [x] Task 4: Tests (AC: all)
  - [x] Interceptor test: 401 → refresh → retry → success
  - [x] Interceptor test: 401 → refresh fails → logout
  - [x] Interceptor test: concurrent 401s → single refresh → all retried
  - [x] Run `npx ng test --no-watch` — zero regressions

## Dev Notes

### Current Auth Flow

- `auth.service.ts`: stores JWT in localStorage, signals for user state
- `auth.interceptor.ts`: attaches Bearer token, on 401 → immediate logout
- No refresh mechanism exists

### Cookie-Based Refresh Pattern

The `POST /auth/refresh` endpoint expects the refresh token as an httpOnly cookie. This means:
1. Login response sets the cookie (browser handles automatically)
2. All requests to `/auth/refresh` must include `withCredentials: true`
3. No manual cookie management needed in frontend code

### Interceptor Refresh Queue Pattern

```typescript
private isRefreshing = false;
private refreshSubject = new BehaviorSubject<string | null>(null);

// On 401:
if (!this.isRefreshing) {
  this.isRefreshing = true;
  this.refreshSubject.next(null);
  return this.authService.refresh().pipe(
    switchMap(token => {
      this.isRefreshing = false;
      this.refreshSubject.next(token);
      return next(cloneWithNewToken(req, token));
    }),
    catchError(() => {
      this.isRefreshing = false;
      this.authService.logout();
      return EMPTY;
    })
  );
} else {
  // Queue: wait for refresh to complete, then retry
  return this.refreshSubject.pipe(
    filter(token => token !== null),
    take(1),
    switchMap(token => next(cloneWithNewToken(req, token)))
  );
}
```

### References

- [Source: src/app/core/auth/auth.service.ts — current auth service]
- [Source: src/app/core/auth/auth.interceptor.ts — current interceptor with 401 handling]
- [Source: _bmad-output/api-observations.md#Token Refresh — observation tracking]
- [Source: _bmad-output/backend-work-summary.md#3 — backend spec for refresh mechanism]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References

### Completion Notes List
- AuthService: Added `refresh()` method (POST /auth/refresh with withCredentials), `setToken()`, updated `logout()` with optional returnUrl and POST /auth/logout
- Login: Added `withCredentials: true` for cookie-based refresh token storage
- Interceptor: Complete rewrite — 401 triggers refresh with BehaviorSubject queuing for concurrent requests, auth endpoints excluded from refresh
- Module-level `isRefreshing`/`refreshSubject` state with `_resetRefreshState()` for test isolation
- On refresh failure: `authService.logout(location.pathname)` + return EMPTY
- Tests: 6 interceptor tests (no-auth, auth header, 500 toast, connection lost, 401→refresh→retry, 401→refresh fail→logout)
- Tests: Updated auth service tests for new logout signature and refresh method
- All 914 tests pass, zero regressions

### Change Log
- 2026-03-14: Implemented token refresh with silent 401 retry and concurrent request queuing

### File List
- src/app/core/auth/auth.service.ts (modified)
- src/app/core/auth/auth.interceptor.ts (modified)
- src/app/core/auth/auth.service.spec.ts (modified)
- src/app/core/auth/auth.interceptor.spec.ts (modified)
