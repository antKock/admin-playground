# Story 15.5: Co-locate Service Files with Their Components

Status: review

## Story

As a developer,
I want Toast service, Confirm Dialog service, and OpenAPI watcher placed alongside their related files,
so that logically coupled files are easy to find.

## Acceptance Criteria

1. `toast.service.ts` is in `src/app/shared/components/toast/`
2. `confirm-dialog.service.ts` is in `src/app/shared/components/confirm-dialog/`
3. `openapi-watcher.service.ts` is in `src/app/core/api/`
4. All import paths across the entire codebase are updated to the new locations
5. No logic changes in any file
6. `npx ng build` passes with zero errors
7. `npx ng test --no-watch` passes with zero regressions

## Tasks / Subtasks

- [x] Task 1: Move Toast service (AC: #1, #4, #5)
  - [x] 1.1 Move `src/app/shared/services/toast.service.ts` → `src/app/shared/components/toast/toast.service.ts`
  - [x] 1.2 No spec file existed in shared/services/ (toast.service.spec.ts was already in toast/ directory)
  - [x] 1.3 Found ~15 imports of toast.service across facades, interceptors, and specs
  - [x] 1.4 Updated all imports; co-located files use relative `./toast.service`
  - [x] 1.5 Build verified

- [x] Task 2: Move Confirm Dialog service (AC: #2, #4, #5)
  - [x] 2.1 Move `src/app/shared/services/confirm-dialog.service.ts` → `src/app/shared/components/confirm-dialog/confirm-dialog.service.ts`
  - [x] 2.2 No spec file existed in shared/services/ (already in confirm-dialog/ directory)
  - [x] 2.3 Found ~12 imports across detail components, guards, and specs
  - [x] 2.4 Updated all imports; co-located files use relative `./confirm-dialog.service`
  - [x] 2.5 Build verified

- [x] Task 3: Move OpenAPI Watcher service (AC: #3, #4, #5)
  - [x] 3.1 Move `src/app/core/services/openapi-watcher.service.ts` → `src/app/core/api/openapi-watcher.service.ts`
  - [x] 3.2 Move `src/app/core/services/openapi-watcher.service.spec.ts` → `src/app/core/api/openapi-watcher.service.spec.ts`
  - [x] 3.3 Found 3 imports (app.ts, openapi-banner component, openapi-banner spec)
  - [x] 3.4 Updated all imports to reference `@core/api/openapi-watcher.service`
  - [x] 3.5 Build verified

- [x] Task 4: Final verification (AC: #6, #7)
  - [x] 4.1 Grep confirms zero remaining references to old paths
  - [x] 4.2 Run full `npx ng build` — zero errors
  - [x] 4.3 Run full `npx ng test --no-watch` — zero regressions (82 files, 971 tests)

- [x] Task 5: Clean up (AC: #1, #2, #3)
  - [x] 5.1 No orphaned files at old locations
  - [x] 5.2 `src/app/core/services/` was empty — removed. `src/app/shared/services/` still has `user-name-resolver.service.ts` — left in place.

## Dev Notes

- **Depends on:** No hard dependency, but coordinate with 15.4 if running in parallel (both touch `shared/services/`)
- **No logic changes** — this is a pure file relocation refactor
- **Barrel files:** Do NOT create `index.ts` barrel/re-export files. The project does not use barrel files — all imports reference specific file paths directly.
- **File inventory (current locations and sizes):**

  | File | Current Location | Target Location | Lines |
  |------|-----------------|-----------------|-------|
  | `toast.service.ts` | `src/app/shared/services/` | `src/app/shared/components/toast/` | 43 |
  | `confirm-dialog.service.ts` | `src/app/shared/services/` | `src/app/shared/components/confirm-dialog/` | 32 |
  | `openapi-watcher.service.ts` | `src/app/core/services/` | `src/app/core/api/` | 121 |

- **Rationale for each move:**
  - **Toast service** → co-located with toast component because the service controls toast display and is tightly coupled to the component
  - **Confirm dialog service** → co-located with confirm dialog component because the service opens/closes the dialog and is tightly coupled to the component
  - **OpenAPI watcher** → moved to `core/api/` because it monitors API spec changes and belongs with other API infrastructure (alongside the API inspector interceptor, HTTP client config, etc.)

- **Import search commands:**
  ```bash
  grep -r "toast.service" src/ --include="*.ts"
  grep -r "confirm-dialog.service" src/ --include="*.ts"
  grep -r "openapi-watcher" src/ --include="*.ts"
  ```

- **Path alias updates:**
  - `@shared/services/toast.service` → `@shared/components/toast/toast.service`
  - `@shared/services/confirm-dialog.service` → `@shared/components/confirm-dialog/confirm-dialog.service`
  - `@core/services/openapi-watcher.service` → `@core/api/openapi-watcher.service`

- **Note on `core/services/` directory:** After moving `openapi-watcher.service.ts`, check if any other files remain in `core/services/`. If it is now empty, remove the directory. If other services remain, leave it.

### Project Structure Notes

**Before:**
```
src/app/
  shared/
    services/
      toast.service.ts              ← moving out
      confirm-dialog.service.ts     ← moving out
      ... (other services remain)
    components/
      toast/
        toast.component.ts
        toast.component.html
        toast.component.css
      confirm-dialog/
        confirm-dialog.component.ts
        confirm-dialog.component.html
        confirm-dialog.component.css
  core/
    services/
      openapi-watcher.service.ts    ← moving out
    api/
      ... (existing API files)
```

**After:**
```
src/app/
  shared/
    services/
      ... (other services remain, if any)
    components/
      toast/
        toast.component.ts
        toast.component.html
        toast.component.css
        toast.service.ts            ← moved here
      confirm-dialog/
        confirm-dialog.component.ts
        confirm-dialog.component.html
        confirm-dialog.component.css
        confirm-dialog.service.ts   ← moved here
  core/
    api/
      openapi-watcher.service.ts    ← moved here
      ... (existing API files)
```

### References

- [Source: _bmad-output/planning-artifacts/v2/epics.md#Story 15.5]
- [Source: _bmad-output/implementation-artifacts/v2/v2-technical-analysis.md#Co-location]
- [Source: docs/architecture-ACTEE.md]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

### Completion Notes List

- Moved toast.service.ts to `shared/components/toast/` alongside component
- Moved confirm-dialog.service.ts to `shared/components/confirm-dialog/` alongside component
- Moved openapi-watcher.service.ts + spec to `core/api/` alongside other API infrastructure
- Updated ~30 import references across the codebase
- Removed empty `core/services/` directory; `shared/services/` kept (has user-name-resolver)
- Build: zero errors. Tests: 82 files, 971 tests, zero regressions.

### Change Log

- 2026-03-23: Co-located toast, confirm-dialog, and openapi-watcher services with their related files

### File List

- src/app/shared/components/toast/toast.service.ts (moved from shared/services/)
- src/app/shared/components/confirm-dialog/confirm-dialog.service.ts (moved from shared/services/)
- src/app/core/api/openapi-watcher.service.ts (moved from core/services/)
- src/app/core/api/openapi-watcher.service.spec.ts (moved from core/services/)
- src/app/shared/components/toast/toast.component.ts (modified import)
- src/app/shared/components/toast/toast.component.spec.ts (modified import)
- src/app/shared/components/toast/toast.service.spec.ts (modified import)
- src/app/shared/components/confirm-dialog/confirm-dialog.component.ts (modified import)
- src/app/shared/components/confirm-dialog/confirm-dialog.component.spec.ts (modified import)
- src/app/shared/components/openapi-banner/openapi-banner.component.ts (modified import)
- src/app/shared/components/openapi-banner/openapi-banner.component.spec.ts (modified import)
- src/app/shared/guards/unsaved-changes.guard.ts (modified import)
- src/app/shared/guards/unsaved-changes.guard.spec.ts (modified import)
- src/app/app.ts (modified import)
- src/app/core/auth/auth.interceptor.ts (modified import)
- src/app/core/auth/auth.interceptor.spec.ts (modified import)
- src/app/domains/shared/mutation-error-handler.ts (modified import)
- src/app/features/*/**.ts (multiple facade + detail component import updates)
- src/app/core/services/ (deleted - empty directory)
