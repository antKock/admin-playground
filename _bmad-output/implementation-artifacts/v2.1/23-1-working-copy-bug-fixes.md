# Story 23.1: Working Copy Bug Fixes — Occurrence Rule Toggle & New Indicator Params

Status: done

## Story

As a user configuring objet models, I want the occurrence rule toggle to properly turn OFF after being turned ON, and I want newly associated indicators to have immediately editable parameters, so that I can configure models without needing to save and reload as a workaround.

## Acceptance Criteria

1. Given an objet model with an occurrence rule toggled ON on any section, when I toggle it OFF, then the toggle visually switches to OFF and the working copy reflects `{ min: 'false', max: 'false' }`
2. Given an occurrence rule toggled ON with custom JSONLogic values, when I toggle it OFF, then the custom values are preserved in memory so toggling back ON restores them
3. Given an objet model with an occurrence rule toggled ON on any indicator, when I toggle it OFF, then the toggle visually switches to OFF and the working copy reflects `{ min: 'false', max: 'false' }` (same canonical OFF representation as sections)
4. Given any section in an objet model, when I associate a new indicator via the picker, then I can immediately expand and edit its parameters without saving or reloading
5. Given a newly associated indicator, when I toggle any of its parameter rules (hidden, required, disabled, occurrence, constrained, default value), then the working copy updates correctly and the UI reflects the change
6. Given a newly associated child indicator (via parent indicator), when it appears in the section, then its parameters are also immediately editable
7. All existing unit tests continue to pass; new tests cover both bug scenarios

## Tasks / Subtasks

- [x] Task 1: Fix occurrence rule toggle OFF on sections (AC: #1, #2)
  - [x] 1.1 Investigate `section-params-editor.component.ts` `onOccurrenceToggle(false)` — verify the emitted params propagate through the working copy signal chain
  - [x] 1.2 Verify `isOccurrenceOverridden()` correctly returns `false` after toggle OFF with `{ min: 'false', max: 'false' }`
  - [x] 1.3 Check that the working copy `updateSectionParams` handler properly applies the OFF state
  - [x] 1.4 Add unit test: toggle occurrence ON → toggle OFF → verify working copy state and `isOccurrenceOverridden` returns false

- [x] Task 2: Fix occurrence rule toggle OFF on indicators (AC: #3)
  - [x] 2.1 Investigate `indicator-card.component.ts` `onOccurrenceToggle(false)` — it emits `occurrence_rule: null`, verify this propagates correctly
  - [x] 2.2 Check consistency between indicator OFF representation (`null`) and section OFF representation (`{ min: 'false', max: 'false' }`) — align if needed in the working copy layer
  - [x] 2.3 Add unit test: toggle indicator occurrence ON → toggle OFF → verify state

- [x] Task 3: Fix new indicator params not editable until save+reload (AC: #4, #5, #6)
  - [x] 3.1 Investigate `section-facade.helpers.ts` `sectionIndicatorToParams` — the `occurrence_rule` conversion on line 26 nullifies `{ min: 'false', max: 'false' }` which may cause downstream issues
  - [x] 3.2 Trace signal chain: working copy `addIndicator` → facade helper → indicator-card component — identify where newly added indicator params are dropped or not reactive
  - [x] 3.3 Ensure newly added indicators (and their children) are fully hydrated in the working copy with editable param structures
  - [x] 3.4 Add unit test: add indicator via picker → verify params are immediately accessible and editable

- [x] Task 4: Verify fixes across all model types (AC: #7)
  - [x] 4.1 Verify fixes work on action models (association sections)
  - [x] 4.2 Verify fixes work on folder models (fixed sections)
  - [x] 4.3 Verify fixes work on entity models (fixed sections)
  - [x] 4.4 Run full test suite, fix any regressions

## Dev Notes

### Root Cause Analysis

**Bug #2 (Occurrence rule stuck ON):**
- `section-params-editor.component.ts` `onOccurrenceToggle(false)` emits `{ min: 'false', max: 'false' }` — verify this actually reaches the working copy and triggers a signal update
- `indicator-card.component.ts` `onOccurrenceToggle(false)` emits `occurrence_rule: null` — different OFF representation than sections
- Possible inconsistency: the working copy or facade helper may not handle both OFF representations consistently
- Check `isOccurrenceOverridden()` in both components — section version checks string values, indicator version checks for `null`

**Bug #1 (New indicator params not editable):**
- `section-working-copy.ts` `addIndicator` initializes with `...SECTION_RULE_DEFAULTS` including `occurrence_rule: { min: 'false', max: 'false' }`
- `section-facade.helpers.ts` `sectionIndicatorToParams` (line 26) converts `{ min: 'false', max: 'false' }` to `null` — this conversion may cause the component to not render editable params
- After save+reload the API returns full indicator data, bypassing the conversion issue

### Key Files

| File | Relevance |
|------|-----------|
| `src/app/shared/components/section-card/section-params-editor.component.ts` | Section occurrence toggle handler + `isOccurrenceOverridden` |
| `src/app/shared/components/indicator-card/indicator-card.component.ts` | Indicator occurrence toggle handler + `isOccurrenceOverridden` |
| `src/app/features/shared/section-indicators/section-facade.helpers.ts` | `sectionIndicatorToParams` conversion (line 26) |
| `src/app/features/shared/section-indicators/section-working-copy.ts` | `addIndicator`, `updateSectionParams`, `updateIndicatorParams` |
| `src/app/features/shared/section-indicators/section-working-copy.models.ts` | `SECTION_RULE_DEFAULTS` |

### Critical Guardrails

- DO NOT change the `SectionParams` or `IndicatorParams` interfaces without verifying all consumers
- DO NOT change how the working copy stores data — fix the conversion/display layer instead
- Canonical OFF representation for occurrence rule: `{ min: 'false', max: 'false' }` everywhere — fix indicator card to use this instead of `null`
- ALL fixes must be in shared components/helpers (`section-facade.helpers.ts`, `section-working-copy.ts`, shared components) — no model-specific patches
- The `savedRules` pattern in section-params-editor (preserving custom JSONLogic on toggle OFF) must be preserved
- All three model types (action, folder, entity) share these components — test all three

### Dependencies

- Depends on: Epic 22 (working copy pattern must be in place)
- Story 21.1 (occurrence rule consolidation) is `ready-for-dev` — coordinate if both touch occurrence logic

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (1M context)

### Completion Notes List
- **Task 1:** Section occurrence toggle OFF was already correct — investigated and confirmed the full signal chain works. Added integration test for the working copy layer.
- **Task 2:** Fixed indicator occurrence toggle OFF bug. Root cause: `indicator-card.component.ts` emitted `occurrence_rule: null` on toggle OFF, but `applyIndicatorParams` in `section-working-copy.ts` treated `null` as "keep old value" (falsy fallback). Fix: (1) Changed indicator card to emit `{ min: 'false', max: 'false' }` (canonical OFF), matching sections; (2) Added `savedRules` pattern for custom JSONLogic preservation on indicators (parity with sections); (3) Fixed `applyIndicatorParams` and `applyChildParams` to default `null` occurrence_rule to `{ min: 'false', max: 'false' }` defensively. Same fix applied to child indicator occurrence toggles.
- **Task 3:** Fixed new indicator params not being editable. Root cause: `addIndicator` in working copy created indicators with `children: []`, so group-type indicators lost their children until save+reload. Fix: (1) Extended `IndicatorOption` to include optional `children`; (2) Updated `addIndicator` to hydrate children with default rule values; (3) Updated all three detail components to pass children data from `availableIndicators()`.
- **Task 4:** All fixes are in shared components/helpers — no model-specific patches. Verified: build passes, all 1300 tests pass (8 new tests added), no regressions.

### Change Log
- Fixed indicator occurrence rule toggle OFF: emit canonical `{ min: 'false', max: 'false' }` instead of `null` (2026-03-31)
- Added custom JSONLogic rule preservation on indicator occurrence toggle (parity with sections) (2026-03-31)
- Fixed `applyIndicatorParams`/`applyChildParams` null occurrence_rule handling (2026-03-31)
- Added children hydration when adding indicators via picker (2026-03-31)

### File List
- `src/app/shared/components/indicator-card/indicator-card.component.ts` — Fixed `onOccurrenceToggle`/`onChildOccurrenceToggle` to emit canonical OFF + savedRules
- `src/app/shared/components/indicator-card/indicator-card.component.spec.ts` — Updated/added occurrence toggle tests
- `src/app/shared/components/indicator-picker/indicator-picker.component.ts` — Added optional `children` to `IndicatorOption`
- `src/app/features/shared/section-indicators/section-working-copy.ts` — Fixed `applyIndicatorParams`/`applyChildParams` null handling; `addIndicator` children hydration
- `src/app/features/shared/section-indicators/section-working-copy.spec.ts` — Added tests for occurrence null handling, children hydration, new indicator editability
- `src/app/features/shared/section-indicators/section-facade.helpers.ts` — Updated `addIndicatorToSection` signature
- `src/app/features/action-models/ui/action-model-detail.component.ts` — Pass children in pickerOptions
- `src/app/features/folder-models/ui/folder-model-detail.component.ts` — Pass children in pickerOptions
- `src/app/features/entity-models/ui/entity-model-detail.component.ts` — Pass children in pickerOptions
