# Story 21.1: Section Occurrence Rule Schema Consolidation

Status: done

## Story

As a developer,
I want to align the frontend section code with the API schema change that consolidates `occurrence_min_rule` + `occurrence_max_rule` into `occurrence_rule: OccurrenceRule`,
so that the codebase matches the current API contract and removes the unnecessary conversion layer.

## Context

API Changeset 2026-03-30 10:15 (Pending) restructures all section-related schemas: `occurrence_min_rule` (string) + `occurrence_max_rule` (string) are replaced by `occurrence_rule: { min: string, max: string }` (a `$ref OccurrenceRule`). This affects Section models, association inputs, and indicator read schemas.

The indicator-level code was already migrated to `occurrence_rule` in changeset 2026-03-25. The section-level code still uses the split fields with a conversion layer (`toOccurrenceRule`/`paramsToSectionRules`). This story removes that indirection — the API now matches our UI model directly.

**This is primarily a code-removal refactor.** The UI model (`IndicatorParams`) already uses `occurrence_rule: { min, max }`. We are removing the split/merge conversion that bridged the old API shape.

## Acceptance Criteria

1. **Given** the API returns `occurrence_rule: { min, max }` on section models **When** the frontend reads section data **Then** no conversion is needed — the field is used directly.
2. **Given** the frontend sends section association inputs **When** building the payload **Then** `occurrence_rule` is sent as `{ min, max }` instead of separate `occurrence_min_rule`/`occurrence_max_rule` fields.
3. **Given** the section-params-editor component **When** editing occurrence rules **Then** it uses `occurrence_rule: { min, max }` in its `SectionParams` interface.
4. **Given** the codebase **When** searching for `occurrence_min_rule` or `occurrence_max_rule` **Then** zero results in `src/` (only in generated api-types if baseline hasn't been reset yet, and in changelog docs).
5. **Given** the `toOccurrenceRule` and `paramsToSectionRules` functions **When** the refactor is complete **Then** they are removed — the API now matches the UI model.
6. **Given** the generated `OccurrenceRule` type in `api-types.ts` **When** it is properly typed as `{ min: string, max: string }` **Then** use it instead of local re-declarations where appropriate.
7. **Given** all test fixtures **When** they reference section occurrence fields **Then** they use `occurrence_rule: { min, max }` instead of `occurrence_min_rule`/`occurrence_max_rule`.
8. **Given** `npx ng build`, `npx ng test --no-watch`, and `npx ng lint` **When** the refactor is complete **Then** all pass clean.

## Tasks / Subtasks

- [x] Task 1: Regenerate API types (AC: #1, #6)
  - [x] Fetch updated OpenAPI spec and regenerate `src/app/core/api/generated/api-types.ts`
  - [x] Verify `OccurrenceRule` is typed as `{ min: string; max: string }` (not `additionalProperties: true`)
  - [x] Verify `SectionModelCreate/Read/Update/WithIndicators` use `occurrence_rule` instead of split fields
  - [x] Verify `SectionIndicatorAssociationInput` uses `occurrence_rule` instead of split fields
  - [x] Verify `SectionIndicatorModelRead` / `SectionChildIndicatorModelRead` use `occurrence_rule` instead of split fields

- [x] Task 2: Update `SECTION_RULE_DEFAULTS` and `DisplaySection` (AC: #1, #4)
  - [x] `src/app/features/shared/section-indicators/display-section.model.ts`: Replace `occurrence_min_rule: 'false'` + `occurrence_max_rule: 'false'` with `occurrence_rule: { min: 'false', max: 'false' }` in `SECTION_RULE_DEFAULTS`
  - [x] Verify `DisplaySection` type (derived from `SectionModelWithIndicators`) automatically picks up the new shape

- [x] Task 3: Update `SectionParams` interface and `SectionParamsEditorComponent` (AC: #3, #4)
  - [x] `src/app/shared/components/section-card/section-params-editor.component.ts`: Change `SectionParams` interface from `occurrence_min_rule: string` + `occurrence_max_rule: string` to `occurrence_rule: { min: string; max: string }`
  - [x] Update `isOccurrenceOverridden()` to read `params().occurrence_rule.min` / `params().occurrence_rule.max`
  - [x] Update `onOccurrenceToggle()` to emit `occurrence_rule: { min, max }` instead of split fields
  - [x] Update `onOccurrenceMinChange()` / `onOccurrenceMaxChange()` to emit updated `occurrence_rule` object
  - [x] Update template bindings: `params().occurrence_min_rule` → `params().occurrence_rule.min`, same for max
  - [x] Update `savedRules` keys from `occurrence_min_rule`/`occurrence_max_rule` to `occurrence_rule_min`/`occurrence_rule_max` (or use a saved object)

- [x] Task 4: Update `SectionFacadeContext` interface (AC: #2, #4)
  - [x] `src/app/features/shared/section-indicators/section-facade.helpers.ts`: Update `createSectionMutation` signature — replace `occurrence_min_rule: string; occurrence_max_rule: string` with `occurrence_rule: { min: string; max: string }`
  - [x] Update `addIndicatorToSection` — the spread of `SECTION_RULE_DEFAULTS` will automatically use the new shape after Task 2

- [x] Task 5: Remove conversion layer in `section-indicator-param-editor.ts` (AC: #5)
  - [x] `src/app/features/shared/section-indicators/section-indicator-param-editor.ts`: Delete `toOccurrenceRule()` function — API now returns `occurrence_rule` directly
  - [x] Update `sectionIndicatorToParams()`: read `ind.occurrence_rule` directly instead of calling `toOccurrenceRule(ind)`. Map: if `ind.occurrence_rule` has both min/max as `'false'`, set to `null`; otherwise pass through
  - [x] Delete `paramsToSectionRules()` function entirely — no longer needed

- [x] Task 6: Update `build-section-association-inputs.ts` (AC: #2, #4)
  - [x] `src/app/features/shared/section-indicators/build-section-association-inputs.ts`: Remove import of `paramsToSectionRules`
  - [x] For edited indicators: build input directly from `IndicatorParams` instead of calling `paramsToSectionRules`. Map `occurrence_rule` from `IndicatorParams` to API shape (they now match: `{ min, max }`)
  - [x] For unedited indicators: replace `occurrence_min_rule: ruleForApi(ind.occurrence_min_rule)` + `occurrence_max_rule: ruleForApi(ind.occurrence_max_rule)` with `occurrence_rule: { min: ruleForApi(ind.occurrence_rule?.min), max: ruleForApi(ind.occurrence_rule?.max) }`

- [x] Task 7: Update `build-section-indicator-cards.ts` (AC: #4)
  - [x] `src/app/features/shared/section-indicators/build-section-indicator-cards.ts`: Update `buildParamHints` source type — replace `occurrence_min_rule?: string; occurrence_max_rule?: string` with access to `occurrence_rule?.min` / `occurrence_rule?.max`
  - [x] Update `occurrenceState()` calls to pass `source.occurrence_rule?.min`, `source.occurrence_rule?.max`

- [x] Task 8: Update detail component `getSectionParams()` methods (AC: #3, #4)
  - [x] `src/app/features/action-models/ui/action-model-detail.component.ts` (line ~221): Change `occurrence_min_rule: section.occurrence_min_rule` + `occurrence_max_rule: section.occurrence_max_rule` to `occurrence_rule: section.occurrence_rule ?? { min: 'false', max: 'false' }`
  - [x] `src/app/features/folder-models/ui/folder-model-detail.component.ts` (line ~113): Same change
  - [x] `src/app/features/entity-models/ui/entity-model-detail.component.ts` (line ~130): Same change

- [x] Task 9: Update `action-model.facade.ts` default section data (AC: #4)
  - [x] `src/app/features/action-models/action-model.facade.ts` (line ~253): Replace `occurrence_min_rule: 'false'` + `occurrence_max_rule: 'false'` with `occurrence_rule: { min: 'false', max: 'false' }`

- [x] Task 10: Evaluate generated `OccurrenceRule` type usage (AC: #6)
  - [x] Check if `components['schemas']['OccurrenceRule']` in `api-types.ts` can replace the local `OccurrenceRule` interface in `indicator-card.component.ts`
  - [x] If shapes match, re-export from a shared location or import from api-types directly
  - [x] Update imports in files that reference the local `OccurrenceRule`

- [x] Task 11: Update all test fixtures (AC: #7)
  - [x] `src/app/features/shared/section-indicators/build-section-association-inputs.spec.ts`
  - [x] `src/app/features/shared/section-indicators/build-section-indicator-cards.spec.ts`
  - [x] `src/app/features/action-models/action-model.facade.spec.ts`
  - [x] `src/app/features/folder-models/folder-model.facade.spec.ts`
  - [x] `src/app/features/entity-models/entity-model.facade.spec.ts`
  - [x] `src/app/features/entity-models/ui/entity-model-detail.component.spec.ts`
  - [x] `src/app/features/entity-models/ui/entity-model-list.component.spec.ts`
  - [x] `src/app/shared/components/section-card/section-params-editor.component.spec.ts`
  - [x] Replace all `occurrence_min_rule` / `occurrence_max_rule` with `occurrence_rule: { min: '...', max: '...' }`

- [x] Task 12: Verify — build, test, lint (AC: #8)
  - [x] Run `npx ng build` — zero errors
  - [x] Run `npx ng test --no-watch` — all tests pass (1256/1256)
  - [x] Run `npx ng lint` — clean (0 errors, 1 pre-existing unrelated warning)
  - [x] Grep `src/` for `occurrence_min_rule` and `occurrence_max_rule` — zero matches outside generated files (only `openapi-baseline.json`)

## Dev Notes

### Execution Order

Tasks should be executed in dependency order. The recommended flow:

1. **Task 1** (regenerate types) — foundation, everything else depends on this
2. **Task 2** (defaults) — other files import `SECTION_RULE_DEFAULTS`
3. **Tasks 3-9** (can be done in any order) — TypeScript compiler will guide you to all call sites once types change
4. **Task 10** (type consolidation) — evaluate after main refactor
5. **Task 11** (tests) — update fixtures to match new shapes
6. **Task 12** (verify) — final check

### Key Insight: Code Removal

The core of this story is **deleting** the conversion layer:
- `toOccurrenceRule()` in `section-indicator-param-editor.ts` — DELETE (API now returns `occurrence_rule` directly)
- `paramsToSectionRules()` in `section-indicator-param-editor.ts` — DELETE (no need to split back into two fields)
- Mapping logic in `build-section-association-inputs.ts` lines 51-52 — SIMPLIFY (pass `occurrence_rule` through)

### Files to Modify

```
src/app/core/api/generated/api-types.ts                                    (regenerate)
src/app/features/shared/section-indicators/display-section.model.ts        (SECTION_RULE_DEFAULTS)
src/app/features/shared/section-indicators/section-indicator-param-editor.ts (delete toOccurrenceRule, paramsToSectionRules)
src/app/features/shared/section-indicators/build-section-association-inputs.ts (simplify mapping)
src/app/features/shared/section-indicators/build-section-indicator-cards.ts (update source type)
src/app/features/shared/section-indicators/section-facade.helpers.ts       (SectionFacadeContext interface)
src/app/shared/components/section-card/section-params-editor.component.ts  (SectionParams interface + logic)
src/app/features/action-models/ui/action-model-detail.component.ts         (getSectionParams)
src/app/features/folder-models/ui/folder-model-detail.component.ts         (getSectionParams)
src/app/features/entity-models/ui/entity-model-detail.component.ts         (getSectionParams)
src/app/features/action-models/action-model.facade.ts                      (default section data)
src/app/shared/components/indicator-card/indicator-card.component.ts        (OccurrenceRule type — evaluate)
```

**Test files (fixture updates):**
```
src/app/features/shared/section-indicators/build-section-association-inputs.spec.ts
src/app/features/shared/section-indicators/build-section-indicator-cards.spec.ts
src/app/features/action-models/action-model.facade.spec.ts
src/app/features/folder-models/folder-model.facade.spec.ts
src/app/features/entity-models/entity-model.facade.spec.ts
src/app/features/entity-models/ui/entity-model-detail.component.spec.ts
src/app/features/entity-models/ui/entity-model-list.component.spec.ts
src/app/shared/components/section-card/section-params-editor.component.spec.ts
```

### References

- [API Changelog: Changeset 2026-03-30 10:15](_bmad-output/api-changelog.md)
- [Prior migration: Changeset 2026-03-25 — `duplicable_rule` → `occurrence_rule` on indicator schemas](_bmad-output/api-changelog.md)
- [Source: src/app/features/shared/section-indicators/section-indicator-param-editor.ts — conversion layer to remove]
- [Source: src/app/features/shared/section-indicators/build-section-association-inputs.ts — mapping to simplify]
- [Source: src/app/shared/components/section-card/section-params-editor.component.ts — SectionParams interface]
- [Source: src/app/features/shared/section-indicators/display-section.model.ts — SECTION_RULE_DEFAULTS]
- [Source: src/app/features/shared/section-indicators/section-facade.helpers.ts — SectionFacadeContext]

## Dev Agent Record

### Implementation Plan

Code-removal refactor: consolidate `occurrence_min_rule` + `occurrence_max_rule` → `occurrence_rule: { min, max }` across all section-related code to match the updated API schema.

### Completion Notes

- Regenerated `api-types.ts` from latest OpenAPI spec — all section schemas now use `occurrence_rule: OccurrenceRule`
- Deleted `toOccurrenceRule()` and `paramsToSectionRules()` conversion functions from `section-indicator-param-editor.ts`
- Updated `SECTION_RULE_DEFAULTS` to use nested object shape
- Updated `SectionParams` interface and all `SectionParamsEditorComponent` methods (toggle, min/max change, template bindings)
- Updated `SectionFacadeContext.createSectionMutation` signature
- Simplified `build-section-association-inputs.ts` to pass `occurrence_rule` directly instead of splitting/merging
- Updated `buildParamHints` source type in `build-section-indicator-cards.ts`
- Updated all 3 detail components' `getSectionParams()` methods (action-model, folder-model, entity-model)
- Updated `action-model.facade.ts` default section data
- Evaluated OccurrenceRule type consolidation — local interface in `indicator-card.component.ts` matches generated type; kept local to avoid coupling UI component to generated API types
- Updated all 8 test fixture files
- All 1256 tests pass, build clean, lint clean (0 errors)
- Zero `occurrence_min_rule`/`occurrence_max_rule` references in `src/` (only in `openapi-baseline.json`)

## File List

- `src/app/core/api/generated/api-types.ts` (regenerated)
- `src/app/core/api/generated/openapi-spec.json` (regenerated)
- `src/app/features/shared/section-indicators/display-section.model.ts` (modified)
- `src/app/features/shared/section-indicators/section-indicator-param-editor.ts` (modified — deleted toOccurrenceRule, paramsToSectionRules)
- `src/app/features/shared/section-indicators/build-section-association-inputs.ts` (modified)
- `src/app/features/shared/section-indicators/build-section-indicator-cards.ts` (modified)
- `src/app/features/shared/section-indicators/section-facade.helpers.ts` (modified)
- `src/app/shared/components/section-card/section-params-editor.component.ts` (modified)
- `src/app/features/action-models/ui/action-model-detail.component.ts` (modified)
- `src/app/features/folder-models/ui/folder-model-detail.component.ts` (modified)
- `src/app/features/entity-models/ui/entity-model-detail.component.ts` (modified)
- `src/app/features/action-models/action-model.facade.ts` (modified)
- `src/app/features/shared/section-indicators/build-section-association-inputs.spec.ts` (modified)
- `src/app/features/shared/section-indicators/build-section-indicator-cards.spec.ts` (modified)
- `src/app/features/action-models/action-model.facade.spec.ts` (modified)
- `src/app/features/folder-models/folder-model.facade.spec.ts` (modified)
- `src/app/features/entity-models/entity-model.facade.spec.ts` (modified)
- `src/app/features/entity-models/ui/entity-model-detail.component.spec.ts` (modified)
- `src/app/features/entity-models/ui/entity-model-list.component.spec.ts` (modified)
- `src/app/shared/components/section-card/section-params-editor.component.spec.ts` (modified)
- `nginx.conf.erb` (modified — unrelated: adds Cache-Control no-cache for index.html)

## Change Log

- 2026-03-30: Consolidated `occurrence_min_rule` + `occurrence_max_rule` into `occurrence_rule: { min, max }` across all section-related source code, tests, and generated API types. Removed `toOccurrenceRule()` and `paramsToSectionRules()` conversion layer.
- 2026-03-30: Code review fixes — added 9 occurrence_rule toggle tests to section-params-editor spec, simplified redundant null check in occurrenceRuleEquals, deduplicated edited/non-edited branches in buildSectionAssociationInputs, documented nginx.conf.erb in File List.
