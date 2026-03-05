# Story 5.3: Deep-Link URLs for Detail Pages

Status: review

## Story

As an operator (Alex/Sophie),
I want shareable URLs that link directly to specific entity detail pages,
so that I can share links with teammates and bookmark frequently accessed configurations.

## Acceptance Criteria

1. **Given** an operator is viewing an entity detail page **When** they copy the browser URL **Then** the URL contains the entity type and ID (e.g., `/action-models/abc123`)
2. **Given** an operator pastes a deep-link URL into the browser **When** the page loads **Then** the application navigates directly to the entity detail page **And** the correct data is loaded from the API
3. **Given** an unauthenticated user accesses a deep-link URL **When** the page loads **Then** they are redirected to login with the deep-link preserved as the intended destination (FR4) **And** after login, they are redirected to the deep-linked page

## Tasks / Subtasks

- [x] Task 1: Audit current routing — verify deep-links already work (AC: #1, #2)
  - [x] Test each entity's detail route to confirm URL already contains entity type + ID:
    - `/funding-programs/:id` — verified
    - `/action-themes/:id` — verified
    - `/action-models/:id` — verified
    - `/folder-models/:id` — verified
    - `/communities/:id` — verified
    - `/agents/:id` — verified
    - `/indicator-models/:id` — verified
  - [x] For each route: paste URL directly into browser, verify detail page loads with correct data
  - [x] Verify each detail component reads `id` from `ActivatedRoute.snapshot.paramMap` and calls `facade.select(id)` on init
  - [x] Document any routes that fail to load — NONE failed, all work correctly

- [x] Task 2: Fix auth guard redirect-after-login (AC: #3)
  - [x] Check `src/app/core/auth/auth.guard.ts` — already captures `state.url` via `returnUrl` query param
  - [x] Check `src/app/core/auth/login.component.ts` — already reads `returnUrl` and navigates via `router.navigateByUrl()`
  - [x] No fixes needed — returnUrl flow was already correctly implemented

- [x] Task 3: Handle invalid/deleted entity IDs gracefully (AC: #2)
  - [x] Verify each detail component handles `facade.detailError()` when API returns 404 for unknown ID
  - [x] All 7 entities have error handling with "not found" message + back-to-list link
  - [x] All 7 entities follow the same error pattern — no fixes needed

- [x] Task 4: Tests (AC: #1-3)
  - [x] Test auth guard: redirects to `/login` with `returnUrl` query param when unauthenticated
  - [x] Test login component: navigates to `returnUrl` after successful authentication
  - [x] Test login component: navigates to default route when no `returnUrl` present
  - [x] Test each detail component: loads entity from route param ID on init (pre-existing tests)

## Dev Notes

### What Exists Today (DO NOT Reinvent)

- **Routes already define `:id` params** — all 7 entity modules already have `{ path: ':id', component: ...DetailComponent }` in their `.routes.ts` files
- **Detail components already read route params** — all 7 use `route.snapshot.paramMap.get('id')` and call `facade.select(id)`
- **Auth guard** at `src/app/core/auth/auth.guard.ts` — already captures returnUrl
- **Login component** at `src/app/core/auth/login.component.ts` — already reads returnUrl
- **`facade.detailError()`** pattern — implemented in all 7 detail components

### Architecture Compliance

- **No new files** — this was primarily audit + test enhancement
- **Pattern:** All 7 entities follow identical deep-link behavior

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.3]
- [Source: src/app/app.routes.ts — root routing with authGuard]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- Audited all 7 entity routes — all have `:id` params and detail components correctly read route params + call facade.select(id)
- Auth guard already captures `returnUrl` query param (pre-existing)
- Login component already reads `returnUrl` and navigates (pre-existing)
- All 7 detail components handle `facade.detailError()` (pre-existing)
- Added 3 new tests: auth guard returnUrl inclusion, login returnUrl navigation, login default route navigation
- All 379 tests pass, zero regressions

### File List

- `src/app/core/auth/auth.guard.spec.ts` — modified: added returnUrl query param test
- `src/app/core/auth/login.component.spec.ts` — modified: added returnUrl navigation + default route tests

## Change Log

- 2026-03-05: Verified deep-links work for all 7 entities; added test coverage for returnUrl auth flow
