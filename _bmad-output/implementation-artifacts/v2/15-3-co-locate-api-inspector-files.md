# Story 15.3: Co-locate API Inspector Files

Status: review

## Story

As a developer,
I want all API Inspector-related files grouped in a single folder,
so that I can find and maintain the entire feature in one place.

## Acceptance Criteria

1. All API Inspector files (interceptor, service, component, template, styles, spec) are in `src/app/shared/api-inspector/`
2. All import paths across the entire codebase are updated to the new locations
3. No logic changes in any file
4. `npx ng build` passes with zero errors
5. `npx ng test --no-watch` passes with zero regressions

## Tasks / Subtasks

- [x] Task 1: Create target directory (AC: #1)
  - [x] 1.1 Create `src/app/shared/api-inspector/`

- [x] Task 2: Move interceptor (AC: #1, #2, #3)
  - [x] 2.1 Move `src/app/core/api/api-inspector.interceptor.ts` → `src/app/shared/api-inspector/api-inspector.interceptor.ts`
  - [x] 2.2 Update all imports referencing `@core/api/api-inspector.interceptor` or relative paths to the interceptor

- [x] Task 3: Move service (AC: #1, #2, #3)
  - [x] 3.1 Move `src/app/shared/services/api-inspector.service.ts` → `src/app/shared/api-inspector/api-inspector.service.ts`
  - [x] 3.2 Update all imports referencing `@shared/services/api-inspector.service` or relative paths to the service

- [x] Task 4: Move component and related files (AC: #1, #2, #3)
  - [x] 4.1 Move `src/app/shared/components/api-inspector/api-inspector.component.ts` → `src/app/shared/api-inspector/api-inspector.component.ts`
  - [x] 4.2 Move `src/app/shared/components/api-inspector/api-inspector.component.html` → `src/app/shared/api-inspector/api-inspector.component.html`
  - [x] 4.3 No `.css` file exists for api-inspector (no inline styles)
  - [x] 4.4 Move `api-inspector.component.spec.ts` → `src/app/shared/api-inspector/`
  - [x] 4.5 Update all imports referencing `@shared/components/api-inspector/` or relative paths to the component

- [x] Task 5: Update remaining imports and verify (AC: #2, #4, #5)
  - [x] 5.1 Grep confirms zero remaining references to old paths
  - [x] 5.2 No barrel exports or index files to update
  - [x] 5.3 Run `npx ng build` — zero errors
  - [x] 5.4 Run `npx ng test --no-watch` — zero regressions (82 files, 971 tests)

- [x] Task 6: Clean up empty directories (AC: #1)
  - [x] 6.1 Removed empty `src/app/shared/components/api-inspector/` directory
  - [x] 6.2 No orphaned files at old locations

## Dev Notes

- **Depends on:** Stories 15.1 and 15.2 should ideally be completed first (so `.html`/`.css` files exist to move), but this can proceed with just the `.ts` files if needed
- **No logic changes** — this is a pure file relocation refactor
- **Barrel files:** Do NOT create `index.ts` barrel/re-export files in the new folders. The project does not use barrel files — all imports reference specific file paths directly.
- **File inventory (current locations):**
  - `src/app/core/api/api-inspector.interceptor.ts` (21 lines) — HTTP interceptor that logs API calls
  - `src/app/shared/services/api-inspector.service.ts` (20 lines) — service that stores intercepted API calls
  - `src/app/shared/components/api-inspector/api-inspector.component.ts` (88 lines) — UI component displaying logged calls
- **Import search commands:**
  ```bash
  grep -r "api-inspector.interceptor" src/ --include="*.ts"
  grep -r "api-inspector.service" src/ --include="*.ts"
  grep -r "api-inspector.component" src/ --include="*.ts"
  grep -r "api-inspector" src/ --include="*.ts"
  ```
- **Path alias consideration:** Check `tsconfig.json` for any path aliases that map to `@shared/services/` or `@shared/components/` — the new imports should use `@shared/api-inspector/`
- **Interceptor registration:** The interceptor is likely registered in `app.config.ts` or a providers array — update that import path too

### Project Structure Notes

**Before:**
```
src/app/
  core/api/
    api-inspector.interceptor.ts          ← interceptor
  shared/
    services/
      api-inspector.service.ts            ← service
    components/
      api-inspector/
        api-inspector.component.ts        ← component
        api-inspector.component.html      ← template (after 15.1/15.2)
        api-inspector.component.css       ← styles (after 15.1/15.2)
        api-inspector.component.spec.ts   ← spec (if exists)
```

**After:**
```
src/app/
  shared/
    api-inspector/
      api-inspector.interceptor.ts
      api-inspector.service.ts
      api-inspector.component.ts
      api-inspector.component.html
      api-inspector.component.css
      api-inspector.component.spec.ts
```

### References

- [Source: _bmad-output/planning-artifacts/v2/epics.md#Story 15.3]
- [Source: _bmad-output/implementation-artifacts/v2/v2-technical-analysis.md#Co-location]
- [Source: docs/architecture-ACTEE.md]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

### Completion Notes List

- Moved interceptor, service, component, HTML, and spec files to `src/app/shared/api-inspector/`
- Updated 12 files with import path changes (10 detail components, app.config.ts, interceptor itself)
- Interceptor's service import changed to relative since they are now co-located
- Removed empty old directory `shared/components/api-inspector/`
- Build: zero errors. Tests: 82 files, 971 tests, zero regressions.

### Change Log

- 2026-03-23: Co-located all API Inspector files into `src/app/shared/api-inspector/`

### File List

- src/app/shared/api-inspector/api-inspector.interceptor.ts (moved from core/api/)
- src/app/shared/api-inspector/api-inspector.interceptor.spec.ts (moved from core/api/)
- src/app/shared/api-inspector/api-inspector.service.ts (moved from shared/services/)
- src/app/shared/api-inspector/api-inspector.service.spec.ts (moved from shared/services/)
- src/app/shared/api-inspector/api-inspector.component.ts (moved from shared/components/api-inspector/)
- src/app/shared/api-inspector/api-inspector.component.html (moved from shared/components/api-inspector/)
- src/app/shared/api-inspector/api-inspector.component.spec.ts (moved from shared/components/api-inspector/)
- src/app/app.config.ts (modified import)
- src/app/features/communities/ui/community-detail.component.ts (modified imports)
- src/app/features/indicator-models/ui/indicator-model-detail.component.ts (modified imports)
- src/app/features/agents/ui/agent-detail.component.ts (modified imports)
- src/app/features/action-themes/ui/action-theme-detail.component.ts (modified imports)
- src/app/features/users/ui/user-detail.component.ts (modified imports)
- src/app/features/buildings/ui/building-detail.component.ts (modified imports)
- src/app/features/folder-models/ui/folder-model-detail.component.ts (modified imports)
- src/app/features/action-models/ui/action-model-detail.component.ts (modified imports)
- src/app/features/funding-programs/ui/funding-program-detail.component.ts (modified imports)
- src/app/features/sites/ui/site-detail.component.ts (modified imports)
- src/app/shared/components/api-inspector/ (deleted - empty directory)
