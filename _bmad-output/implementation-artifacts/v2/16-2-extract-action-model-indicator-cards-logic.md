# Story 16.2: Extract Action-Model Indicator Cards Logic

Status: done

## Story

As a developer,
I want the complex `serverCards` computed moved out of the detail component,
so that action-model detail contains only display logic.

## Acceptance Criteria

1. The ~40-line `serverCards` computed is extracted to a use-case file or the `ActionModelFacade`
2. The action-model-detail component consumes a facade signal for indicator card data instead of computing locally
3. All existing tests pass with zero regressions

## Tasks / Subtasks

- [x] Task 1: Analyze `serverCards` computed dependencies and data flow (AC: #1)
  - [x] 1.1 Map all inputs consumed by `serverCards` in `action-model-detail.component.ts` (~lines 236-275): selected action model, attached indicators, indicator metadata, rule fields
  - [x] 1.2 Identify the output type: `IndicatorCardData[]`
  - [x] 1.3 Document the transformation logic: attached indicators with parameter edits, child indicator card data, rule state hints (hidden_rule, required_rule, disabled_rule), parameter overrides, paramHints from rule fields

- [x] Task 2: Create use-case or add to facade (AC: #1)
  - [x] 2.1 Decide on location: dedicated `src/app/features/action-models/use-cases/build-indicator-cards.ts` (preferred for complex logic) OR directly in `ActionModelFacade`
  - [x] 2.2 Create a pure function `buildIndicatorCards(...)` that accepts the required inputs and returns `IndicatorCardData[]`
  - [x] 2.3 Create `src/app/features/action-models/use-cases/build-indicator-cards.spec.ts` with unit tests covering: basic card mapping, child indicator nesting, rule state hints, parameter overrides, empty/null cases
  - [x] 2.4 Wire into `ActionModelFacade` as a computed signal: `readonly indicatorCards = computed(() => buildIndicatorCards(...))`

- [x] Task 3: Update component to consume facade signal (AC: #2)
  - [x] 3.1 Remove the `serverCards` computed from `action-model-detail.component.ts`
  - [x] 3.2 Replace with `readonly indicatorCards = computed(() => this._localCardOrder() ?? this.facade.indicatorCards())`
  - [x] 3.3 Update effect to track `this.facade.indicatorCards()` instead of `this.serverCards()`

- [x] Task 4: Adapt existing tests (AC: #3)
  - [x] 4.1 Update `action-model-detail.component.spec.ts` to mock facade's `indicatorCards` signal
  - [x] 4.2 Remove any test logic that was testing the local `serverCards` computation
  - [x] 4.3 Ensure use-case spec covers all previously tested scenarios

- [x] Task 5: Run `npx ng test --no-watch` and verify zero regressions (AC: #3)

## Dev Notes

- This is the most complex extraction in Epic 16 — ~40 lines of nested mapping logic handling:
  - Attached indicators with parameter edits
  - Child indicator card data (hierarchical indicator associations)
  - Rule state hints (`hidden_rule`, `required_rule`, `disabled_rule`)
  - Parameter overrides from rule fields
  - `paramHints` derived from rule field configurations
- **Prefer a dedicated use-case file** over putting all this in the facade, since the logic is complex enough to warrant isolation and independent testing.
- The use-case function should be **pure** (no injected dependencies) — it takes data in, returns cards out.
- The facade then composes this pure function with its store signals via `computed()`.
- **ACTEE compliance**: Components must not contain business logic. The detail component should only bind to facade signals.

### Project Structure Notes

- **Create**: `src/app/features/action-models/use-cases/build-indicator-cards.ts`
- **Create**: `src/app/features/action-models/use-cases/build-indicator-cards.spec.ts`
- **Modify**: `src/app/features/action-models/action-model.facade.ts` — add `indicatorCards` computed
- **Modify**: `src/app/features/action-models/ui/action-model-detail.component.ts` — remove `serverCards`, use facade signal

### References

- [Source: docs/architecture-ACTEE.md]
- [Source: _bmad-output/planning-artifacts/v2/epics.md#Story 16.2]
- [Source: _bmad-output/implementation-artifacts/v2/v2-technical-analysis.md]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

### Completion Notes List

- Created pure function `buildIndicatorCards()` in dedicated use-case file with `ruleState()` and `buildParamHints()` helpers
- Created comprehensive unit tests (8 tests) covering: basic mapping, default hints, boolean rules, JSON rules, param edits, children, empty input, empty children
- Wired into `ActionModelFacade` as `indicatorCards` computed signal
- Removed `serverCards` computed and `ruleState` private method from detail component
- Updated effect to track facade signal instead of local computed
- All 84 test files (988 tests) pass with zero regressions

### File List

- `src/app/features/action-models/use-cases/build-indicator-cards.ts` (new)
- `src/app/features/action-models/use-cases/build-indicator-cards.spec.ts` (new)
- `src/app/features/action-models/action-model.facade.ts` (modified)
- `src/app/features/action-models/ui/action-model-detail.component.ts` (modified)
