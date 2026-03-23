# Story 16.3: Extract Indicator-Model Form Logic

Status: done

## Story

As a developer,
I want filtering and data preparation logic moved out of the indicator-model form,
so that the form contains only UI state and facade calls.

## Acceptance Criteria

1. `filteredAvailable` computed is extracted to `IndicatorModelFacade`
2. Submit data preparation logic is extracted to `IndicatorModelFacade`
3. The indicator-model-form component uses facade methods instead of local business logic
4. All existing tests pass with zero regressions

## Tasks / Subtasks

- [x] Task 1: Extract `filteredAvailable` filtering logic to IndicatorModelFacade (AC: #1)
- [x] Task 2: Extract submit data preparation to IndicatorModelFacade (AC: #2)
- [x] Task 3: Update form component to use facade methods (AC: #3)
- [x] Task 4: Adapt existing tests (AC: #4)
- [x] Task 5: Run `npx ng test --no-watch` and verify zero regressions (AC: #4)

## Dev Notes

(unchanged from original)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

### Completion Notes List

- Added `_childSearchTerm`, `_excludeChildrenIds`, `_editItemId` signals to `IndicatorModelFacade`
- Added `setChildSearchTerm()`, `setExcludeChildrenIds()`, `setEditItemId()` methods
- Added `availableChildIndicators` computed with 4-condition filter (non-group, exclude self, exclude attached, search term)
- Added `prepareIndicatorData()` method for submit data preparation
- Updated form component to delegate filtering to facade signal and submit prep to facade method
- Added `onChildSearch()` method in component to sync local + facade search state
- Updated `ngOnDestroy` to reset facade state
- Added facade tests for `availableChildIndicators` and `prepareIndicatorData`
- All 84 test files (991 tests) pass with zero regressions

### File List

- `src/app/features/indicator-models/indicator-model.facade.ts` (modified)
- `src/app/features/indicator-models/indicator-model.facade.spec.ts` (modified)
- `src/app/features/indicator-models/ui/indicator-model-form.component.ts` (modified)
- `src/app/features/indicator-models/ui/indicator-model-form.component.html` (modified)
