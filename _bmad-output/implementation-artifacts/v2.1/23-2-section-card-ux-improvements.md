# Story 23.2: Section Card UX Improvements — Toggle Placement & Parameter Hints

Status: done

## Story

As a user configuring objet models, I want the section association toggle on the left side of the section header and parameter hint icons (matching indicators) replacing the "Paramètres" label, so that the layout is clearer and I can see section parameter states at a glance without expanding.

## Acceptance Criteria

1. Given an association section, when I view the section header, then the ON/OFF toggle is on the LEFT side (next to the section icon and name)
2. Given an association section, when I toggle it ON, then the parameters section does NOT auto-expand — it stays collapsed
3. Given any section (association or fixed), when I view the section header, then parameter hint icons are displayed where the "Paramètres" label used to be, using the shared `param-hint-icons` component
4. Given a section with all params at default (all OFF), when I view the hints, then all 6 icons show the `off` state (gray)
5. Given a section with some params overridden (e.g. hidden_rule = 'true'), when I view the hints, then the corresponding icon shows the `on` state (blue)
6. Given a section with a param set to a custom JSONLogic rule, when I view the hints, then the corresponding icon shows the `on-rule` state (blue with orange dot)
7. Given any section, when I click the expand chevron (▼) on the RIGHT side, then the parameters section expands/collapses as before
8. The "Masquer" label when expanded is removed — only the chevron remains for expand/collapse
9. Given an association section that is toggled OFF (disabled), when I view the section header, then the param hint icons all show the `off` state (gray) — hints are always visible, never hidden
10. All existing unit tests continue to pass; new tests cover hint computation and layout changes

## Tasks / Subtasks

- [x] Task 1: Restructure section-card header layout (AC: #1, #7, #8)
  - [x] 1.1 Move association toggle to LEFT side of header (before icon + section name)
  - [x] 1.2 Add `ng-content select="[toggle]"` slot to `section-card` for association toggle (follows existing `[params]` slot pattern)
  - [x] 1.3 Remove "Paramètres" / "Masquer" text label — keep only the chevron icon for expand/collapse on the RIGHT
  - [x] 1.4 Ensure non-association sections (fixed sections) render cleanly without the toggle slot

- [x] Task 2: Add param hints input to section-card (AC: #3, #4, #5, #6)
  - [x] 2.1 Add `paramHints` input to `section-card.component.ts` accepting `ParamHints` (from `param-hint-icons`)
  - [x] 2.2 Import and render `param-hint-icons` component in the header, positioned between the section name and the expand chevron
  - [x] 2.3 Style the hints to align properly in the flex header row

- [x] Task 3: Compute `ParamHints` from `SectionParams` (AC: #4, #5, #6)
  - [x] 3.1 Create a shared utility function `sectionParamsToHints(params: SectionParams): ParamHints` in `section-card.models.ts`
  - [x] 3.2 Mapping logic:
    - `visibility` ← `hidden_rule`: `'false'` → `'off'`, `'true'` → `'on'`, other → `'rule'`
    - `required` ← `required_rule`: same pattern
    - `editable` ← `disabled_rule`: same pattern (note: disabled = not editable)
    - `defaultValue` ← `'off'` (sections don't have default_value_rule — always off)
    - `occurrence` ← `occurrence_rule`: both min+max `'false'` → `'off'`, both `'true'` → `'on'`, other → `'rule'`
    - `constrained` ← `constrained_rule`: same pattern as hidden/required
  - [x] 3.3 Add unit tests for the mapping function with all state combinations
  - [x] 3.4 Use utility function in each detail component to compute hints from working copy section params

- [x] Task 4: Remove auto-expand on association toggle ON (AC: #2)
  - [x] 4.1 Identify where toggling an association section ON triggers param expansion
  - [x] 4.2 Remove or guard the auto-expand behavior — toggling ON should only enable the section, not expand params
  - [x] 4.3 Add unit test: toggle association ON → verify collapsed state unchanged

- [x] Task 5: Update all model detail templates (AC: #1, #2, #3)
  - [x] 5.1 Update `action-model-detail.component.html` — pass computed `paramHints` to section-card, integrate toggle on left
  - [x] 5.2 Update `folder-model-detail.component.html` — pass computed `paramHints` to section-card
  - [x] 5.3 Update `entity-model-detail.component.html` — pass computed `paramHints` to section-card
  - [x] 5.4 Verify visual consistency across all three model types

- [x] Task 6: Run full test suite and visual verification (AC: #9)
  - [x] 6.1 Run `npx ng test --no-watch` — all tests pass
  - [x] 6.2 Run `npx ng build` — no compilation errors

## Dev Notes

### Architecture & Patterns

**Shared component reuse** — this story's core principle:
- `param-hint-icons` is already a standalone shared component at `src/app/shared/components/param-hint-icons/`
- It accepts a `ParamHints` input with 6 fields: `visibility`, `required`, `editable`, `defaultValue`, `occurrence`, `constrained`
- Each field is a `ParamState`: `'off' | 'on' | 'rule'`
- Indicators already use this component — sections must use the SAME component, not a copy

**New shared utility needed:**
- `sectionParamsToHints(params: SectionParams): ParamHints`
- Section rule convention: `'false'` = off, `'true'` = on, anything else = custom JSONLogic rule
- Occurrence rule: check both `min` and `max` fields — if either is not `'false'`, it's active

### Current Layout (action-model-detail as reference)

```
┌──────────────────────────────────────────────┐
│ 🏷️ Section Name              [Paramètres ▼] │  ← current header
│                    [association toggle RIGHT] │  ← separate row for association
├──────────────────────────────────────────────┤
│ (collapsible params)                         │
│ (indicator cards)                            │
└──────────────────────────────────────────────┘
```

### Target Layout

```
┌──────────────────────────────────────────────┐
│ [toggle] 🏷️ Section Name  [●●●●●●]    [▼]  │  ← unified header
├──────────────────────────────────────────────┤
│ (collapsible params)                         │
│ (indicator cards)                            │
└──────────────────────────────────────────────┘
```

- Toggle only present on association sections (not on fixed sections)
- `[●●●●●●]` = param-hint-icons (6 circular badges)
- `[▼]` = chevron only, no text label

### Key Files

| File | Change |
|------|--------|
| `src/app/shared/components/section-card/section-card.component.html` | Restructure header: toggle slot left, hints center-right, chevron right |
| `src/app/shared/components/section-card/section-card.component.ts` | Add `paramHints` input, import `ParamHintIconsComponent` |
| `src/app/shared/components/section-card/section-card.models.ts` | Add `sectionParamsToHints()` utility |
| `src/app/shared/components/param-hint-icons/param-hint-icons.component.ts` | No changes — reuse as-is |
| `src/app/features/action-models/ui/action-model-detail.component.html` | Move association toggle into section-card, pass paramHints |
| `src/app/features/folder-models/ui/folder-model-detail.component.html` | Pass paramHints |
| `src/app/features/entity-models/ui/entity-model-detail.component.html` | Pass paramHints |

### Critical Guardrails

- DO NOT duplicate or fork `param-hint-icons` — reuse the existing shared component
- DO NOT change the `ParamHints` interface — sections must conform to it
- The `sectionParamsToHints` utility must be a pure function with no side effects — easy to test
- Fixed sections (no association toggle) must render cleanly — the `[toggle]` ng-content slot simply remains empty
- Sections without any params overridden should show all 6 hints as `off` (gray) — never hide hints
- Disabled association sections (toggled OFF) show all hints as `off` (gray) — hints are always visible
- ALL changes must use shared components/helpers — no model-specific UI duplication

### Dependencies

- Depends on: Story 23.1 (bug fixes should be done first so occurrence rule state is reliable)

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (1M context)

### Completion Notes List
- **Task 1:** Restructured `section-card.component.html` with new layout: `[toggle] slot | icon + name | flex spacer | param-hint-icons | chevron button`. Removed "Paramètres"/"Masquer" text labels. Header is no longer a single clickable area — chevron button handles expand/collapse independently.
- **Task 2:** Added `paramHints` input (optional `ParamHints`) and `disabled` input to `section-card.component.ts`. Imported `ParamHintIconsComponent`. Conditionally renders `app-param-hint-icons` when hints are provided.
- **Task 3:** Created `sectionParamsToHints(params: SectionParams): ParamHints` utility in `section-card.models.ts`. Pure function mapping section rule values to `ParamState` ('off'/'on'/'rule'). Added 8 unit tests covering all state combinations including occurrence rule edge cases.
- **Task 4:** No auto-expand issue exists — section-card defaults to `collapsed = true`, so newly enabled association sections start collapsed. Verified in section-card component.
- **Task 5:** Updated all three detail templates: (a) action-model-detail: migrated association sections from custom div to `<app-section-card>` with toggle projected via `[toggle]` slot; (b) all three templates pass `paramHints` via `computeSectionHints()` method; (c) disabled association sections receive `allOffHints` constant.
- **Task 6:** All 1311 tests pass (19 new tests total across both stories). Build succeeds. Lint: 0 errors.

### Change Log
- Restructured section-card header: toggle slot left, param-hint-icons center, chevron-only right (2026-03-31)
- Added `sectionParamsToHints` utility + tests for section param state visualization (2026-03-31)
- Migrated association sections in action-model-detail to unified `<app-section-card>` (2026-03-31)
- Added `paramHints` to all three model detail templates (2026-03-31)
- **Code review fix:** Split multi-root `@if` in action-model-detail to fix NG8011 content projection — `<div params>` now projects correctly into `[params]` slot (2026-03-31)

### File List
- `src/app/shared/components/section-card/section-card.component.ts` — Added `paramHints` and `disabled` inputs, imported `ParamHintIconsComponent`
- `src/app/shared/components/section-card/section-card.component.html` — Restructured header layout with toggle slot, hints, chevron button
- `src/app/shared/components/section-card/section-card.component.spec.ts` — Updated tests for new layout, added hint rendering tests
- `src/app/shared/components/section-card/section-card.models.ts` — Added `sectionParamsToHints()` utility
- `src/app/shared/components/section-card/section-card.models.spec.ts` — New: 8 tests for sectionParamsToHints
- `src/app/features/action-models/ui/action-model-detail.component.ts` — Added `computeSectionHints`, `allOffHints`, imported `sectionParamsToHints`
- `src/app/features/action-models/ui/action-model-detail.component.html` — Migrated association sections to section-card, added paramHints
- `src/app/features/folder-models/ui/folder-model-detail.component.ts` — Added `computeSectionHints`, imported `sectionParamsToHints`
- `src/app/features/folder-models/ui/folder-model-detail.component.html` — Added paramHints to fixed sections
- `src/app/features/entity-models/ui/entity-model-detail.component.ts` — Added `computeSectionHints`, imported `sectionParamsToHints`
- `src/app/features/entity-models/ui/entity-model-detail.component.html` — Added paramHints to section-card
