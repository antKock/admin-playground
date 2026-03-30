# Story 22.4: Cleanup Legacy Param Editor & Dead Code

Status: review

## Story

As a developer,
I want to remove the legacy `SectionIndicatorParamEditor` and any dead code left from the migration,
So that the codebase has a single, clean section editing pattern with no unused code.

## Acceptance Criteria

1. **Legacy param editor is removed**
   - Given all three model types use the working copy pattern
   - When this story is complete
   - Then `section-indicator-param-editor.ts` is deleted
   - And no file imports from it

2. **Dead mutation wiring is removed**
   - Given facades no longer call section mutations directly (only through save callbacks)
   - When this story is complete
   - Then any unused facade methods or mutation exposure that was only needed for "save as you go" is removed

3. **Build and tests pass**
   - Given all cleanup is done
   - When `npx ng build` and `npx ng test --no-watch` are run
   - Then both pass with zero errors

4. **No functional regression**
   - Given the cleanup only removes unused code
   - When the application runs
   - Then all three model types behave identically to after Stories 22.2–22.3

## Tasks / Subtasks

- [x] Task 1: Delete legacy param editor (AC: #1)
  - [x] 1.1 Delete `src/app/features/shared/section-indicators/section-indicator-param-editor.ts`
  - [x] 1.2 Search codebase for any remaining imports of the deleted file — remove them
  - [x] 1.3 Delete associated test file if it exists

- [x] Task 2: Remove dead facade methods and signals (AC: #2)
  - [x] 2.1 Review all three facades for methods/signals that were only used for "save as you go" and are now unused
  - [x] 2.2 Remove unused mutation status signals that were exposed for per-action pending states (e.g., individual `updateSectionParamsIsPending` if no longer bound in templates)
  - [x] 2.3 Review domain stores — if any mutations are no longer called by any consumer, consider removing (but keep mutations needed by save callbacks)

- [x] Task 3: Clean up helper files (AC: #1, #2)
  - [x] 3.1 Review `section-facade.helpers.ts` for any remaining references to the old param editor pattern
  - [x] 3.2 Review `section-indicator-editing.helpers.ts` — simplify or remove if the interface is no longer needed
  - [x] 3.3 Review `build-section-association-inputs.ts` — check if it's still used or if the working copy builds inputs differently

- [x] Task 4: Verify build and tests (AC: #3, #4)
  - [x] 4.1 Run `npx ng build` — zero errors
  - [x] 4.2 Run `npx ng test --no-watch` — all tests pass
  - [x] 4.3 Run `npx ng lint` — no lint errors

## Dev Notes

### Architecture & Patterns

- This is a **cleanup-only** story. No functional changes. If something looks like it might still be used, leave it — better to keep a small amount of dead code than break something.
- Run `grep -r "section-indicator-param-editor" src/` to find all references before deleting.
- The domain store mutations (`createSectionMutation`, `deleteSectionMutation`, `updateSectionMutation`, `updateSectionIndicatorsMutation`) are still needed — they're used as save callbacks. DO NOT remove them.

### Critical Guardrails

- **DO NOT** remove domain store mutations — they're used by save callbacks
- **DO NOT** make functional changes — this is cleanup only
- **Verify** every deletion with a grep to ensure nothing still imports the removed code
- **Run full build + test suite** after each deletion

### Dependencies

- Story 22.2 (all facades migrated)
- Story 22.3 (all detail components updated)

### References

- [Legacy param editor: src/app/features/shared/section-indicators/section-indicator-param-editor.ts]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Completion Notes List

- Deleted `section-indicator-param-editor.ts` — legacy param editor fully replaced by working copy
- Moved `sectionIndicatorToParams()` utility to `section-facade.helpers.ts` (only consumer)
- Removed dead facade properties: `sectionParamEdits`, `modifiedIds`, `getEditsForSection` from all 3 facades
- Removed dead computed signals from `section-facade.helpers.ts` return value
- Removed `getSectionEdits()` from `section-indicator-editing.helpers.ts` and cleaned interface
- Removed unused `computed` import from helpers
- `buildSectionAssociationInputs` kept despite no current consumers — may be reused
- 1299 tests pass, 0 lint errors, build successful

### Change Log

- 2026-03-30: Deleted legacy param editor and removed all dead code from batch save migration

### File List

- `src/app/features/shared/section-indicators/section-indicator-param-editor.ts` (deleted)
- `src/app/features/shared/section-indicators/section-facade.helpers.ts` (modified: absorbed sectionIndicatorToParams, removed dead code)
- `src/app/features/shared/section-indicators/section-indicator-editing.helpers.ts` (modified: removed getSectionEdits, cleaned interface)
- `src/app/features/action-models/action-model.facade.ts` (modified: removed dead properties)
- `src/app/features/folder-models/folder-model.facade.ts` (modified: removed dead properties)
- `src/app/features/entity-models/entity-model.facade.ts` (modified: removed dead properties)
