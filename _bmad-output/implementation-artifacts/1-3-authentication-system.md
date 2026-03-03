# Story 1.3: Authentication System

Status: done

## Story

As an operator (Sophie/Alex),
I want to log in with my email and password and have my session managed automatically,
so that I can securely access the admin interface without manually managing tokens.

## Acceptance Criteria

1. **Route Guard Redirect** — Given the user is not authenticated, when they navigate to any protected route, then they are redirected to the login page and the intended destination URL is preserved
2. **Successful Login** — Given the user is on the login page, when they enter valid email and password and submit, then the JWT token is stored in localStorage under a namespaced key and the user is redirected to their intended destination (or the default landing page)
3. **Invalid Credentials** — Given the user enters invalid credentials, when they submit the login form, then a clear error message is displayed (not a generic "error occurred") and the password field is cleared but email is preserved
4. **JWT Auto-Attach** — Given the user is authenticated, when any HTTP request is made to the API, then the JWT token is automatically attached via the HTTP interceptor and all requests go over HTTPS
5. **Token Expiry Handling** — Given the user is authenticated and the token has expired, when an API call returns 401, then the user is redirected to the login page with the current URL preserved as intended destination
6. **Logout** — Given the user clicks logout, when the logout action completes, then the JWT is removed from localStorage and the user is redirected to the login page
7. **Server Error Toast** — When an API call returns 500, then a "Server error" toast is displayed
8. **Network Error Toast** — When a network error occurs (status 0), then a "Connection lost" toast is displayed

## Tasks / Subtasks

- [x] Task 1: Create AuthService (AC: #2, #6)
  - [x] Create `src/app/core/auth/auth.service.ts`
  - [x] Implement `login(email: string, password: string): Observable<LoginResponse>`
  - [x] POST to `/auth/login` with email/password payload
  - [x] On success: store JWT in localStorage under namespaced key (e.g., `laureat_admin_jwt`)
  - [x] Expose `isAuthenticated` signal (computed from token presence)
  - [x] Expose `currentUser` signal if login response includes user info
  - [x] Implement `logout()`: remove JWT from localStorage, redirect to login
  - [x] Implement `getToken(): string | null` for interceptor use
  - [x] Create `auth.service.spec.ts` with unit tests

- [x] Task 2: Create Login Component (AC: #2, #3)
  - [x] Create `src/app/core/auth/login.component.ts` (standalone)
  - [x] Use Angular Reactive Forms: email (required, email format) + password (required) fields
  - [x] Style with Tailwind: centered card on `surface-subtle` background, brand-primary submit button
  - [x] On submit: call AuthService.login()
  - [x] On success: navigate to preserved destination or default route
  - [x] On error: display clear error message, clear password field, preserve email
  - [x] Show loading state on submit button while request is in flight
  - [x] Create `login.component.spec.ts` with tests

- [x] Task 3: Create Auth Interceptor (AC: #4, #5, #7, #8)
  - [x] Create `src/app/core/auth/auth.interceptor.ts` as functional interceptor
  - [x] Attach `Authorization: Bearer {token}` header to ALL outgoing requests
  - [x] Handle 401: redirect to login with preserved current URL
  - [x] Handle 500: show "Server error" toast via ToastService (or basic alert if Toast not yet available)
  - [x] Handle network error (status 0): show "Connection lost" toast
  - [x] Register interceptor in `app.config.ts` via `provideHttpClient(withInterceptors([authInterceptor]))`
  - [x] Create `auth.interceptor.spec.ts` with tests

- [x] Task 4: Create Auth Guard (AC: #1)
  - [x] Create `src/app/core/auth/auth.guard.ts` as functional `canActivate` guard
  - [x] Check JWT presence in localStorage via AuthService
  - [x] If no token: redirect to `/login` with `returnUrl` query param preserving intended destination
  - [x] If token present: allow navigation
  - [x] No client-side token expiry validation (server is authority)
  - [x] Create `auth.guard.spec.ts` with tests

- [x] Task 5: Configure Routing (AC: #1)
  - [x] Update `app.routes.ts`: add login route (unguarded) and apply auth guard to all other routes
  - [x] Ensure login route renders LoginComponent
  - [x] Default redirect to first entity section (or dashboard placeholder)

- [x] Task 6: Verification
  - [x] Verify unauthenticated user is redirected to login
  - [x] Verify successful login stores token and redirects
  - [x] Verify invalid credentials show error
  - [x] Verify logout clears token
  - [x] Verify interceptor attaches token to API calls
  - [x] All tests pass

## Dev Notes

### Architecture Patterns & Constraints

- **JWT Storage**: `localStorage` with namespaced key `laureat_admin_jwt` (3 trusted internal users, XSS risk minimal)
- **No Token Refresh**: Deferred — backend needs `/auth/refresh` endpoint first. On expiry: 401 → redirect to login
- **Functional Interceptor**: Angular 20 uses functional interceptors with `withInterceptors()`, NOT class-based `HTTP_INTERCEPTORS`
- **Functional Guard**: Use `canActivate` as a function, NOT class-based guard
- **HTTPS Only**: `environment.apiBaseUrl` is configured with HTTPS
- **No Session Persistence**: Session expires on logout; no persistent session across browser restarts required for v1

### Login API Contract

```
POST /auth/login
Body: { email: string, password: string }
Response: { token: string, ... }  // JWT token in response
```

### Error Handling Strategy (Hybrid)

- **Interceptor handles**: 401 (redirect), 500 ("Server error" toast), network errors ("Connection lost" toast)
- **Components handle**: 400, 409, 422 (domain-specific errors) — Story 2.2+
- **Single Toast service**: Centralized notification channel for both paths

### Files Created by This Story

```
src/app/core/auth/
├── auth.service.ts
├── auth.service.spec.ts
├── auth.guard.ts
├── auth.guard.spec.ts
├── auth.interceptor.ts
├── auth.interceptor.spec.ts
├── login.component.ts
├── login.component.html (or inline template)
└── login.component.spec.ts
```

### Dependencies

- **Story 1.1**: Project scaffold, Tailwind design tokens, environment.ts
- **Story 1.2**: BaseEntityService (for HttpClient provider setup), environment.apiBaseUrl

### What This Story Does NOT Create

- No application shell/layout (Story 1.4)
- No sidebar or header (Story 1.4)
- No Toast component (Story 1.5) — use basic alert/console as fallback if Toast not available

### Anti-Patterns to Avoid

- DO NOT validate token expiry client-side — server is the authority
- DO NOT store sensitive data beyond JWT in localStorage
- DO NOT use class-based interceptors or guards — use functional pattern
- DO NOT expose raw Observable subscriptions in components — use signals
- DO NOT use `@Input`/`@Output` decorators — use `input()`/`output()` functions
- DO NOT create NgModule — standalone components only

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.3] — Acceptance criteria
- [Source: _bmad-output/planning-artifacts/architecture.md#JWT Authentication] — Storage, interceptor, guard patterns
- [Source: _bmad-output/planning-artifacts/architecture.md#Error Handling] — Hybrid interceptor/component strategy
- [Source: _bmad-output/api-observations.md] — Missing refresh token endpoint
- [Source: _bmad-output/planning-artifacts/architecture.md#Security Requirements] — HTTPS, credential management

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- 8/8 ACs implemented. Auth interceptor handles 401 redirect, 500 "Server error" toast, and network error "Connection lost" toast. Functional guard and interceptor patterns. JWT stored under laureat_admin_jwt key.

### File List

- src/app/core/auth/auth.service.ts — JWT auth with signals
- src/app/core/auth/auth.service.spec.ts — 4 unit tests
- src/app/core/auth/auth.guard.ts — Functional canActivate guard
- src/app/core/auth/auth.guard.spec.ts — 2 unit tests
- src/app/core/auth/auth.interceptor.ts — Token attach + 401/500/network error handling
- src/app/core/auth/auth.interceptor.spec.ts — 5 unit tests
- src/app/core/auth/login.component.ts — Login form with reactive forms + Tailwind
- src/app/core/auth/login.component.spec.ts — 4 unit tests
