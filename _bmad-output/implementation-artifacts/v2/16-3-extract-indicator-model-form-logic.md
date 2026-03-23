# Story 16.3: Extract Indicator-Model Form Logic

Status: ready-for-dev

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

- [ ] Task 1: Extract `filteredAvailable` filtering logic to IndicatorModelFacade (AC: #1)
  - [ ] 1.1 Analyze `filteredAvailable` computed in `indicator-model-form.component.ts` (~line 172-180): filters non-group indicators, excludes current edit item, excludes already-attached children, applies search term filter
  - [ ] 1.2 Add `getAvailableChildIndicators(searchTerm: Signal<string>)` method or computed to `IndicatorModelFacade`
  - [ ] 1.3 The facade needs access to: all indicator models list, current edit item ID, currently attached children IDs
  - [ ] 1.4 Ensure the facade exposes a `setChildSearchTerm(term: string)` method if using internal state, or accepts a signal parameter

- [ ] Task 2: Extract submit data preparation to IndicatorModelFacade (AC: #2)
  - [ ] 2.1 Analyze submit data preparation in `indicator-model-form.component.ts` (~line 269-294): builds payload with type-conditional `children_ids`
  - [ ] 2.2 Add `prepareIndicatorData(formValue: IndicatorModelFormValue, attachedChildren: IndicatorModel[])` method to `IndicatorModelFacade`
  - [ ] 2.3 The method returns the API-ready payload object
  - [ ] 2.4 Update the facade's create/update methods to use `prepareIndicatorData` internally if appropriate

- [ ] Task 3: Update form component to use facade methods (AC: #3)
  - [ ] 3.1 Remove `filteredAvailable` computed from `indicator-model-form.component.ts`
  - [ ] 3.2 Replace with facade signal: `readonly filteredAvailable = this.facade.availableChildIndicators`
  - [ ] 3.3 Remove inline submit preparation logic
  - [ ] 3.4 Update `onSubmit()` to call `this.facade.prepareIndicatorData(...)` or pass raw form data to facade create/update

- [ ] Task 4: Adapt existing tests (AC: #4)
  - [ ] 4.1 Update `indicator-model-form.component.spec.ts` to mock facade signals/methods
  - [ ] 4.2 Add tests to `indicator-model.facade.spec.ts` (or create one) for `getAvailableChildIndicators` and `prepareIndicatorData`
  - [ ] 4.3 Test edge cases: empty children list, group vs non-group types, search term filtering

- [ ] Task 5: Run `npx ng test --no-watch` and verify zero regressions (AC: #4)

## Dev Notes

- **Filtering logic** in `filteredAvailable` has 4 filter conditions that must all be preserved:
  1. Only non-group indicator types
  2. Exclude the current edit item (prevents self-reference)
  3. Exclude already-attached children (prevents duplicates)
  4. Name search term match (case-insensitive)
- **Submit preparation** conditionally includes `children_ids` based on indicator type — this is business logic that belongs in the facade.
- The facade may need new internal state for the search term, or it can accept a signal parameter. Prefer the `setChildSearchTerm()` pattern to keep the facade as the single owner of state.
- Existing domain models: `src/app/domains/indicator-models/indicator-model.models.ts`
- Existing form definition: `src/app/domains/indicator-models/forms/indicator-model.form.ts`

### Project Structure Notes

- **Modify**: `src/app/features/indicator-models/indicator-model.facade.ts` — add `availableChildIndicators` computed, `setChildSearchTerm()`, `prepareIndicatorData()`
- **Modify**: `src/app/features/indicator-models/ui/indicator-model-form.component.ts` — remove local filtering and data prep logic
- **Modify/Create**: `src/app/features/indicator-models/indicator-model.facade.spec.ts` — add tests for new facade methods

### References

- [Source: docs/architecture-ACTEE.md]
- [Source: _bmad-output/planning-artifacts/v2/epics.md#Story 16.3]
- [Source: _bmad-output/implementation-artifacts/v2/v2-technical-analysis.md]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
