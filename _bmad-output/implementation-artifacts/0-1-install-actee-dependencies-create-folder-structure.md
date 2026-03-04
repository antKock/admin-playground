# Story 0.1: Install ACTEE Dependencies & Create Folder Structure

Status: review

## Story

As a development team,
I want the ACTEE dependencies installed and folder structure created,
So that all future entity development follows the ACTEE layered architecture from day one.

## Acceptance Criteria

1. `@ngrx/signals` and `@angular-architects/ngrx-toolkit` are added to `package.json` and installed without peer dependency conflicts
2. ACTEE directories exist: `src/app/domains/`, `src/app/domains/shared/`, `src/app/features/` (already exists — restructure), `src/app/pages/`
3. Placeholder directories exist for all 7 entities under `domains/`, `features/`, and `pages/`
4. TSConfig path aliases configured: `@domains/*`, `@features/*`, `@pages/*`, `@shared/*`, `@core/*` (preserve existing `@app/*`)
5. `ng build` compiles without errors
6. `ng serve` starts with no runtime errors
7. All existing functionality (auth, navigation, FP, AT) continues to work unchanged

## Tasks / Subtasks

- [x] Task 1: Install ACTEE dependencies (AC: #1)
  - [x] Run `npm install @ngrx/signals @angular-architects/ngrx-toolkit`
  - [x] Verify no peer dependency conflicts in npm output
  - [x] Verify both packages appear in `package.json` dependencies section
- [x] Task 2: Create ACTEE directory structure (AC: #2, #3)
  - [x] Create `src/app/domains/shared/` directory
  - [x] Create 7 entity directories under `domains/`: `funding-programs/`, `action-themes/`, `action-models/`, `folder-models/`, `indicator-models/`, `communities/`, `agents/`
  - [x] Create `forms/` subdirectory inside each entity's `domains/` folder
  - [x] Create `src/app/pages/` directory
  - [x] Create 7 entity directories under `pages/`: `funding-programs/`, `action-themes/`, `action-models/`, `folder-models/`, `indicator-models/`, `communities/`, `agents/`
  - [x] Create `ui/` subdirectory inside each entity's `features/` folder (for existing FP and AT, components will be moved here later; for stubs just create the empty dir)
  - [x] Add `.gitkeep` to empty placeholder directories so git tracks them
- [x] Task 3: Update TSConfig path aliases (AC: #4)
  - [x] Edit `tsconfig.json` → add `@domains/*`, `@features/*`, `@pages/*`, `@shared/*`, `@core/*` aliases
  - [x] Preserve existing `@app/*` alias
- [x] Task 4: Verify build and runtime (AC: #5, #6, #7)
  - [x] Run `ng build` — must compile with zero errors
  - [x] Run `ng serve` — must start without runtime errors
  - [x] Verify login page loads
  - [x] Verify Funding Programs list/detail/form still works
  - [x] Verify Action Themes list/detail/form/status transitions still work

## Dev Notes

### Dependencies — Exact Versions

| Package | Version | Angular Compat |
|---------|---------|---------------|
| `@ngrx/signals` | 21.x (matches Angular 21) | Aligned |
| `@angular-architects/ngrx-toolkit` | 21.x | Aligned |

Current Angular version in `package.json`: `^21.2.0`. Both libraries follow Angular's major version scheme.

### TSConfig Changes

Current `tsconfig.json` paths (line 18-20):
```json
"paths": {
  "@app/*": ["src/app/*"]
}
```

Target:
```json
"paths": {
  "@app/*": ["src/app/*"],
  "@domains/*": ["src/app/domains/*"],
  "@features/*": ["src/app/features/*"],
  "@pages/*": ["src/app/pages/*"],
  "@shared/*": ["src/app/shared/*"],
  "@core/*": ["src/app/core/*"]
}
```

### Directory Structure to Create

```
src/app/
├── domains/                          # NEW
│   ├── shared/                       # NEW (for withCursorPagination in Story 0.2)
│   ├── funding-programs/             # NEW (empty placeholder + forms/)
│   │   └── forms/
│   ├── action-themes/                # NEW (empty placeholder + forms/)
│   │   └── forms/
│   ├── action-models/                # NEW
│   │   └── forms/
│   ├── folder-models/                # NEW
│   │   └── forms/
│   ├── indicator-models/             # NEW
│   │   └── forms/
│   ├── communities/                  # NEW
│   │   └── forms/
│   └── agents/                       # NEW
│       └── forms/
├── features/                         # EXISTS — add ui/ subdirs
│   ├── funding-programs/             # EXISTS — add ui/
│   │   └── ui/                       # NEW (components moved here in Story 0.3)
│   ├── action-themes/                # EXISTS — add ui/
│   │   └── ui/                       # NEW (components moved here in Story 0.4)
│   ├── action-models/                # EXISTS (stub) — add ui/
│   │   └── ui/
│   ├── folder-models/                # EXISTS (stub) — add ui/
│   │   └── ui/
│   ├── indicator-models/             # EXISTS (stub) — add ui/
│   │   └── ui/
│   ├── communities/                  # EXISTS (stub) — add ui/
│   │   └── ui/
│   └── agents/                       # EXISTS (stub) — add ui/
│       └── ui/
├── pages/                            # NEW
│   ├── funding-programs/             # NEW (page + routes in Story 0.3)
│   ├── action-themes/                # NEW (page + routes in Story 0.4)
│   ├── action-models/                # NEW
│   ├── folder-models/                # NEW
│   ├── indicator-models/             # NEW
│   ├── communities/                  # NEW
│   └── agents/                       # NEW
```

### Anti-Patterns to Avoid

- Do NOT move or rename any existing files in this story — only create new directories
- Do NOT update `app.routes.ts` yet — routing changes happen in Story 0.3/0.4
- Do NOT delete `BaseEntityService<T>` — that's Story 0.5
- Do NOT create any `.ts` source files — just directories and `.gitkeep`

### Existing Files NOT to Touch

- `src/app/core/` — unchanged
- `src/app/shared/` — unchanged
- `src/app/features/funding-programs/*.ts` — unchanged (migrated in 0.3)
- `src/app/features/action-themes/*.ts` — unchanged (migrated in 0.4)
- `src/app/app.routes.ts` — unchanged
- `src/app/app.config.ts` — unchanged

### Project Structure Notes

- The `features/` directory already exists with flat component structure (components at root, no `ui/` subdir)
- Stub entity features exist (action-models, folder-models, etc.) with just route files
- `src/app/core/api/base-entity.service.ts` is the service being replaced — leave it untouched

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules]
- [Source: _bmad-output/planning-artifacts/architecture.md#TSConfig Path Aliases]
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure Patterns]
- [Source: docs/architecture-ACTEE.md#Structure des dossiers]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
No issues encountered.

### Completion Notes List
- Installed @ngrx/signals@^21.0.1 and @angular-architects/ngrx-toolkit@^21.0.1 with zero peer dependency conflicts
- Created full ACTEE directory structure: domains/ (7 entities with forms/), pages/ (7 entities), features/*/ui/ (7 entities)
- Added .gitkeep to all empty placeholder directories
- Updated tsconfig.json with @domains/*, @features/*, @pages/*, @shared/*, @core/* path aliases while preserving existing @app/*
- ng build compiles with zero errors; ng serve starts with no runtime errors
- No existing files were modified (except tsconfig.json and package.json) — all existing functionality preserved

### Change Log
- 2026-03-04: Story 0.1 implemented — ACTEE dependencies installed, folder structure created, TSConfig aliases configured

### File List
- package.json (modified — added @ngrx/signals, @angular-architects/ngrx-toolkit)
- package-lock.json (modified — lockfile updated)
- tsconfig.json (modified — added 5 new path aliases)
- src/app/domains/shared/.gitkeep (new)
- src/app/domains/funding-programs/forms/.gitkeep (new)
- src/app/domains/action-themes/forms/.gitkeep (new)
- src/app/domains/action-models/forms/.gitkeep (new)
- src/app/domains/folder-models/forms/.gitkeep (new)
- src/app/domains/indicator-models/forms/.gitkeep (new)
- src/app/domains/communities/forms/.gitkeep (new)
- src/app/domains/agents/forms/.gitkeep (new)
- src/app/pages/funding-programs/.gitkeep (new)
- src/app/pages/action-themes/.gitkeep (new)
- src/app/pages/action-models/.gitkeep (new)
- src/app/pages/folder-models/.gitkeep (new)
- src/app/pages/indicator-models/.gitkeep (new)
- src/app/pages/communities/.gitkeep (new)
- src/app/pages/agents/.gitkeep (new)
- src/app/features/funding-programs/ui/.gitkeep (new)
- src/app/features/action-themes/ui/.gitkeep (new)
- src/app/features/action-models/ui/.gitkeep (new)
- src/app/features/folder-models/ui/.gitkeep (new)
- src/app/features/indicator-models/ui/.gitkeep (new)
- src/app/features/communities/ui/.gitkeep (new)
- src/app/features/agents/ui/.gitkeep (new)
