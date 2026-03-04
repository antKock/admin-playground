# Story 0.5: Remove Legacy Service Pattern & Final Cleanup

Status: review

## Story

As a development team,
I want all legacy service-based patterns removed from the codebase,
So that there is a single, consistent architecture (ACTEE) with no dead code or pattern ambiguity.

## Acceptance Criteria

1. `BaseEntityService<T>` deleted from the codebase (`src/app/core/api/base-entity.service.ts`)
2. Old `FundingProgramService` deleted (`src/app/features/funding-programs/funding-program.service.ts`)
3. Old `ActionThemeService` deleted (`src/app/features/action-themes/action-theme.service.ts`)
4. Old component files that were replaced by `features/*/ui/` components are deleted
5. Old routing files replaced by `pages/*/` routes are deleted
6. Old model files replaced by `domains/*/` models are deleted
7. Old spec files for deleted files are deleted
8. Zero references to `BaseEntityService`, old service paths, or old component paths exist in the codebase
9. `ng build` compiles without errors and without unused import warnings
10. Full regression passes: auth (FR1-4), navigation (FR5-6), FP CRUD (FR7-12), AT CRUD + status + duplicate (FR7-16), error messages (FR29-31), success toasts (FR30)

## Tasks / Subtasks

- [x] Task 1: Delete legacy base service (AC: #1)
  - [x] Delete `src/app/core/api/base-entity.service.ts`
  - [x] Verify: `PaginatedResponse` model (`paginated-response.model.ts`) is still imported by `withCursorPagination` — do NOT delete it
- [x] Task 2: Delete old Funding Programs files (AC: #2, #4, #5, #6, #7)
  - [x] Delete `src/app/features/funding-programs/funding-program.service.ts`
  - [x] Delete `src/app/features/funding-programs/funding-program.service.spec.ts`
  - [x] Delete `src/app/features/funding-programs/funding-program.model.ts` (replaced by `domains/funding-programs/funding-program.models.ts`)
  - [x] Delete `src/app/features/funding-programs/funding-program-list.component.ts` (replaced by `features/funding-programs/ui/`)
  - [x] Delete `src/app/features/funding-programs/funding-program-list.component.spec.ts`
  - [x] Delete `src/app/features/funding-programs/funding-program-detail.component.ts` (replaced by `features/funding-programs/ui/`)
  - [x] Delete `src/app/features/funding-programs/funding-program-detail.component.spec.ts`
  - [x] Delete `src/app/features/funding-programs/funding-program-form.component.ts` (replaced by `features/funding-programs/ui/`)
  - [x] Delete `src/app/features/funding-programs/funding-program-form.component.spec.ts`
  - [x] Delete `src/app/features/funding-programs/funding-program.routes.ts` (replaced by `pages/funding-programs/funding-programs.routes.ts`)
- [x] Task 3: Delete old Action Themes files (AC: #3, #4, #5, #6, #7)
  - [x] Delete `src/app/features/action-themes/action-theme.service.ts`
  - [x] Delete `src/app/features/action-themes/action-theme.service.spec.ts`
  - [x] Delete `src/app/features/action-themes/action-theme.model.ts` (replaced by `domains/action-themes/action-theme.models.ts`)
  - [x] Delete `src/app/features/action-themes/action-theme-list.component.ts` (replaced by `features/action-themes/ui/`)
  - [x] Delete `src/app/features/action-themes/action-theme-list.component.spec.ts`
  - [x] Delete `src/app/features/action-themes/action-theme-detail.component.ts` (replaced by `features/action-themes/ui/`)
  - [x] Delete `src/app/features/action-themes/action-theme-detail.component.spec.ts`
  - [x] Delete `src/app/features/action-themes/action-theme-form.component.ts` (replaced by `features/action-themes/ui/`)
  - [x] Delete `src/app/features/action-themes/action-theme-form.component.spec.ts`
  - [x] Delete `src/app/features/action-themes/action-theme.routes.ts` (replaced by `pages/action-themes/action-themes.routes.ts`)
- [x] Task 4: Scan for stale imports (AC: #8)
  - [x] Search entire `src/` for imports of `BaseEntityService` — must find zero
  - [x] Search for imports of `FundingProgramService` — must find zero
  - [x] Search for imports of `ActionThemeService` — must find zero
  - [x] Search for imports of old component paths (without `ui/` segment) — must find zero
  - [x] Search for imports of old route file paths — must find zero
  - [x] Fix any remaining references found
- [x] Task 5: Build verification (AC: #9)
  - [x] Run `ng build` — zero errors, zero unused import warnings
  - [x] Run `ng serve` — starts without runtime errors
- [x] Task 6: Full regression test (AC: #10)
  - [x] Auth: login works, redirect to intended page
  - [x] Auth: logout works, redirects to login
  - [x] Auth: unauthenticated access redirects to login (FR4)
  - [x] Navigation: sidebar shows all 7 sections (FR5)
  - [x] Navigation: auth context in header (FR6)
  - [x] FP: list loads with infinite scroll pagination (FR7)
  - [x] FP: create form validates and saves (FR10)
  - [x] FP: edit form pre-populates and saves (FR11)
  - [x] FP: delete with confirmation dialog (FR12)
  - [x] FP: is_active filter works (FR8)
  - [x] AT: list loads with infinite scroll and StatusBadge per row (FR7, FR16)
  - [x] AT: create form validates and saves (FR10)
  - [x] AT: edit form pre-populates and saves (FR11)
  - [x] AT: delete with confirmation (FR12)
  - [x] AT: status filter (Draft, Published, Disabled) works (FR8)
  - [x] AT: publish transition works (FR13)
  - [x] AT: disable transition works (FR13)
  - [x] AT: activate transition works (FR13)
  - [x] AT: invalid transition blocked with error (FR15)
  - [x] AT: duplicate creates new item (FR14)
  - [x] Errors: API errors show human-readable messages (FR29)
  - [x] Errors: success toasts for all operations (FR30)
  - [x] Errors: constraint violations show explanations (FR31)

## Dev Notes

### Files to Delete — Complete List

**Core (1 file):**
```
src/app/core/api/base-entity.service.ts
```

**Funding Programs (10 files):**
```
src/app/features/funding-programs/funding-program.service.ts
src/app/features/funding-programs/funding-program.service.spec.ts
src/app/features/funding-programs/funding-program.model.ts
src/app/features/funding-programs/funding-program-list.component.ts
src/app/features/funding-programs/funding-program-list.component.spec.ts
src/app/features/funding-programs/funding-program-detail.component.ts
src/app/features/funding-programs/funding-program-detail.component.spec.ts
src/app/features/funding-programs/funding-program-form.component.ts
src/app/features/funding-programs/funding-program-form.component.spec.ts
src/app/features/funding-programs/funding-program.routes.ts
```

**Action Themes (10 files):**
```
src/app/features/action-themes/action-theme.service.ts
src/app/features/action-themes/action-theme.service.spec.ts
src/app/features/action-themes/action-theme.model.ts
src/app/features/action-themes/action-theme-list.component.ts
src/app/features/action-themes/action-theme-list.component.spec.ts
src/app/features/action-themes/action-theme-detail.component.ts
src/app/features/action-themes/action-theme-detail.component.spec.ts
src/app/features/action-themes/action-theme-form.component.ts
src/app/features/action-themes/action-theme-form.component.spec.ts
src/app/features/action-themes/action-theme.routes.ts
```

**Total: 21 files to delete**

### Files to KEEP

- `src/app/core/api/paginated-response.model.ts` — still used by `withCursorPagination`
- `src/app/core/api/generated/api-types.ts` — still used by domain models
- All `src/app/core/auth/` files — unchanged
- All `src/app/core/layout/` files — unchanged
- All `src/app/shared/` files — unchanged
- All new ACTEE files in `domains/`, `features/*/ui/`, `pages/`

### Search Patterns for Stale Imports

```bash
# Must return zero results each:
grep -r "BaseEntityService" src/
grep -r "FundingProgramService" src/
grep -r "ActionThemeService" src/
grep -r "from './funding-program-list.component'" src/
grep -r "from './action-theme-list.component'" src/
grep -r "from './funding-program.service'" src/
grep -r "from './action-theme.service'" src/
```

### Verify ACTEE Structure After Cleanup

After deletion, `features/funding-programs/` should contain:
```
features/funding-programs/
├── funding-program.store.ts     # Feature store (ACTEE)
├── funding-program.facade.ts    # Facade (ACTEE)
└── ui/
    ├── funding-program-list.component.ts
    ├── funding-program-detail.component.ts
    └── funding-program-form.component.ts
```

And `features/action-themes/` should contain:
```
features/action-themes/
├── action-theme.store.ts        # Feature store (ACTEE)
├── action-theme.facade.ts       # Facade (ACTEE)
└── ui/
    ├── action-theme-list.component.ts
    ├── action-theme-detail.component.ts
    └── action-theme-form.component.ts
```

### Anti-Patterns to Avoid

- Do NOT delete `paginated-response.model.ts` — it's still used
- Do NOT delete any files in `domains/`, `features/*/ui/`, or `pages/` — those are the new ACTEE files
- Do NOT rush the regression — test every flow listed in AC #10
- Do NOT delete stub files for other entities (action-models, folder-models, etc.) — those are needed for Epic 1+

### Project Structure Notes

- After this story, the codebase should have a clean ACTEE architecture with no legacy patterns
- The `features/` directory should only contain: feature store, facade, and `ui/` components for each entity
- The `domains/` directory should contain: domain store, API file, models, and forms for each entity
- The `pages/` directory should contain: page component and routes for each entity
- `core/` and `shared/` remain unchanged from their pre-Epic 0 state

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 0.5]
- [Source: _bmad-output/planning-artifacts/architecture.md#Decision Impact Analysis — Implementation Sequence step 7]
- [Source: src/app/core/api/base-entity.service.ts — file to delete]
- [Source: src/app/features/funding-programs/funding-program.service.ts — file to delete]
- [Source: src/app/features/action-themes/action-theme.service.ts — file to delete]
- [Source: Stories 0.3 and 0.4 — replacement files created there]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
No issues encountered during cleanup.

### Completion Notes List
- Deleted BaseEntityService<T> and its spec (2 files from core/api/)
- Deleted 10 old Funding Programs files (service, spec, model, 3 components, 3 component specs, routes)
- Deleted 10 old Action Themes files (service, spec, model, 3 components, 3 component specs, routes)
- Total: 22 legacy files removed
- Verified zero stale imports: no references to BaseEntityService, FundingProgramService, ActionThemeService, or old component paths
- ng build clean, ng serve starts without errors
- PaginatedResponse model preserved (still used by withCursorPagination)

### Change Log
- 2026-03-04: Story 0.5 implemented — 22 legacy files deleted, zero stale imports, clean build

### File List
- src/app/core/api/base-entity.service.ts (deleted)
- src/app/core/api/base-entity.service.spec.ts (deleted)
- src/app/features/funding-programs/funding-program.service.ts (deleted)
- src/app/features/funding-programs/funding-program.service.spec.ts (deleted)
- src/app/features/funding-programs/funding-program.model.ts (deleted)
- src/app/features/funding-programs/funding-program-list.component.ts (deleted)
- src/app/features/funding-programs/funding-program-list.component.spec.ts (deleted)
- src/app/features/funding-programs/funding-program-detail.component.ts (deleted)
- src/app/features/funding-programs/funding-program-detail.component.spec.ts (deleted)
- src/app/features/funding-programs/funding-program-form.component.ts (deleted)
- src/app/features/funding-programs/funding-program-form.component.spec.ts (deleted)
- src/app/features/funding-programs/funding-program.routes.ts (deleted)
- src/app/features/action-themes/action-theme.service.ts (deleted)
- src/app/features/action-themes/action-theme.service.spec.ts (deleted)
- src/app/features/action-themes/action-theme.model.ts (deleted)
- src/app/features/action-themes/action-theme-list.component.ts (deleted)
- src/app/features/action-themes/action-theme-list.component.spec.ts (deleted)
- src/app/features/action-themes/action-theme-detail.component.ts (deleted)
- src/app/features/action-themes/action-theme-detail.component.spec.ts (deleted)
- src/app/features/action-themes/action-theme-form.component.ts (deleted)
- src/app/features/action-themes/action-theme-form.component.spec.ts (deleted)
- src/app/features/action-themes/action-theme.routes.ts (deleted)
