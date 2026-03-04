# Story 0.5: Remove Legacy Service Pattern & Final Cleanup

Status: ready-for-dev

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

- [ ] Task 1: Delete legacy base service (AC: #1)
  - [ ] Delete `src/app/core/api/base-entity.service.ts`
  - [ ] Verify: `PaginatedResponse` model (`paginated-response.model.ts`) is still imported by `withCursorPagination` — do NOT delete it
- [ ] Task 2: Delete old Funding Programs files (AC: #2, #4, #5, #6, #7)
  - [ ] Delete `src/app/features/funding-programs/funding-program.service.ts`
  - [ ] Delete `src/app/features/funding-programs/funding-program.service.spec.ts`
  - [ ] Delete `src/app/features/funding-programs/funding-program.model.ts` (replaced by `domains/funding-programs/funding-program.models.ts`)
  - [ ] Delete `src/app/features/funding-programs/funding-program-list.component.ts` (replaced by `features/funding-programs/ui/`)
  - [ ] Delete `src/app/features/funding-programs/funding-program-list.component.spec.ts`
  - [ ] Delete `src/app/features/funding-programs/funding-program-detail.component.ts` (replaced by `features/funding-programs/ui/`)
  - [ ] Delete `src/app/features/funding-programs/funding-program-detail.component.spec.ts`
  - [ ] Delete `src/app/features/funding-programs/funding-program-form.component.ts` (replaced by `features/funding-programs/ui/`)
  - [ ] Delete `src/app/features/funding-programs/funding-program-form.component.spec.ts`
  - [ ] Delete `src/app/features/funding-programs/funding-program.routes.ts` (replaced by `pages/funding-programs/funding-programs.routes.ts`)
- [ ] Task 3: Delete old Action Themes files (AC: #3, #4, #5, #6, #7)
  - [ ] Delete `src/app/features/action-themes/action-theme.service.ts`
  - [ ] Delete `src/app/features/action-themes/action-theme.service.spec.ts`
  - [ ] Delete `src/app/features/action-themes/action-theme.model.ts` (replaced by `domains/action-themes/action-theme.models.ts`)
  - [ ] Delete `src/app/features/action-themes/action-theme-list.component.ts` (replaced by `features/action-themes/ui/`)
  - [ ] Delete `src/app/features/action-themes/action-theme-list.component.spec.ts`
  - [ ] Delete `src/app/features/action-themes/action-theme-detail.component.ts` (replaced by `features/action-themes/ui/`)
  - [ ] Delete `src/app/features/action-themes/action-theme-detail.component.spec.ts`
  - [ ] Delete `src/app/features/action-themes/action-theme-form.component.ts` (replaced by `features/action-themes/ui/`)
  - [ ] Delete `src/app/features/action-themes/action-theme-form.component.spec.ts`
  - [ ] Delete `src/app/features/action-themes/action-theme.routes.ts` (replaced by `pages/action-themes/action-themes.routes.ts`)
- [ ] Task 4: Scan for stale imports (AC: #8)
  - [ ] Search entire `src/` for imports of `BaseEntityService` — must find zero
  - [ ] Search for imports of `FundingProgramService` — must find zero
  - [ ] Search for imports of `ActionThemeService` — must find zero
  - [ ] Search for imports of old component paths (without `ui/` segment) — must find zero
  - [ ] Search for imports of old route file paths — must find zero
  - [ ] Fix any remaining references found
- [ ] Task 5: Build verification (AC: #9)
  - [ ] Run `ng build` — zero errors, zero unused import warnings
  - [ ] Run `ng serve` — starts without runtime errors
- [ ] Task 6: Full regression test (AC: #10)
  - [ ] Auth: login works, redirect to intended page
  - [ ] Auth: logout works, redirects to login
  - [ ] Auth: unauthenticated access redirects to login (FR4)
  - [ ] Navigation: sidebar shows all 7 sections (FR5)
  - [ ] Navigation: auth context in header (FR6)
  - [ ] FP: list loads with infinite scroll pagination (FR7)
  - [ ] FP: create form validates and saves (FR10)
  - [ ] FP: edit form pre-populates and saves (FR11)
  - [ ] FP: delete with confirmation dialog (FR12)
  - [ ] FP: is_active filter works (FR8)
  - [ ] AT: list loads with infinite scroll and StatusBadge per row (FR7, FR16)
  - [ ] AT: create form validates and saves (FR10)
  - [ ] AT: edit form pre-populates and saves (FR11)
  - [ ] AT: delete with confirmation (FR12)
  - [ ] AT: status filter (Draft, Published, Disabled) works (FR8)
  - [ ] AT: publish transition works (FR13)
  - [ ] AT: disable transition works (FR13)
  - [ ] AT: activate transition works (FR13)
  - [ ] AT: invalid transition blocked with error (FR15)
  - [ ] AT: duplicate creates new item (FR14)
  - [ ] Errors: API errors show human-readable messages (FR29)
  - [ ] Errors: success toasts for all operations (FR30)
  - [ ] Errors: constraint violations show explanations (FR31)

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

### Debug Log References

### Completion Notes List

### File List
