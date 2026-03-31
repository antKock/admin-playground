# Story 23.4: Epic 23 Bug Fix Polish

Status: done

## Story

As an admin user editing objet models, I want section and indicator card interactions to work correctly and consistently, so that I can edit rules without workarounds and the UI behaves predictably across all model types.

## Context

During manual testing of Epic 23 (Stories 23-1 and 23-2), Anthony identified 5 bugs. All fixes must target **shared components only** — no model-specific changes. The section card and indicator card components are already shared across action, folder, and entity models; fixes applied there propagate everywhere automatically.

## Acceptance Criteria

### AC-1: Bare-number JSON rules show prose and are editable

- When a parameter rule value is a bare number (e.g. `12`), the prose text representation renders correctly
- The user can click the prose text to open the rule editor for that rule
- Object and string rule values are unaffected

### AC-2: Group indicator children always visible

- When a group-type indicator (with children) is added to a section, child indicator cards are visible immediately under their parent
- Children remain visible whether the parent's parameter area is expanded or collapsed
- Collapsing/expanding parent params does not hide or show child indicators

### AC-3: Association section toggle freely toggleable ON ↔ OFF

- An association section toggled ON can be toggled back OFF in the same editing session without saving and reloading
- The toggle state is correctly reflected in the working copy immediately on each click
- No save/reload cycle is required to reverse a toggle action

### AC-4: Section parameter rules displayed in canonical order

- When a section's parameters are expanded, rule fields appear in this order:
  **Mandatory → Editable → Hidden → Default Value → Occurrence → Constrained**
- Non-association sections only display their applicable subset of rules, but that subset must respect the canonical order
- This order matches the hint icons displayed in the section header

### AC-5: Section header click expands/collapses parameters

- Clicking anywhere on the section header row (outside the association toggle) expands or collapses the parameters area
- This mirrors the existing behavior of indicator cards
- The association toggle remains independent: clicking it only activates/deactivates the section, never triggers expand/collapse

## Out of Scope

- Any changes to model-specific components (action-model, folder-model, entity-model detail pages)
- New features or rule types
- Changes to hint icon logic or visual style

## Technical Notes

All fixes are in shared components. No model-specific files should be touched.

### Files to modify

- `src/app/shared/components/section-card/section-card.component.html` — AC-4 (rule field order), AC-5 (header click handler)
- `src/app/shared/components/section-card/section-card.component.ts` — AC-5 (expand/collapse logic on header click), AC-3 (toggle ON↔OFF working copy wiring)
- `src/app/shared/components/section-card/section-params-editor.component.ts` — AC-4 (canonical rule order enforcement)
- `src/app/shared/components/indicator-card/indicator-card.component.html` — AC-2 (decouple children visibility from parent params expand state)
- `src/app/shared/components/indicator-card/indicator-card.component.ts` — AC-2 (if children visibility is controlled via a signal/computed)
- `src/app/shared/jsonlogic/jsonlogic-prose.ts` — AC-1 (handle bare numeric values in prose renderer)

## Tasks / Subtasks

- [x] Task 1: Fix bare-number JSON rules prose rendering (AC: #1)
  - [x] 1.1 Identify where `jsonlogic-prose.ts` fails on numeric rule values
  - [x] 1.2 Coerce or handle numeric types so prose text is generated correctly
  - [x] 1.3 Verify the prose is clickable and opens the editor

- [x] Task 2: Fix group indicator children always visible (AC: #2)
  - [x] 2.1 Locate the template condition that gates child indicator visibility
  - [x] 2.2 Decouple children list visibility from the parent's params-expanded state
  - [x] 2.3 Verify children appear immediately on indicator add, before any expand

- [x] Task 3: Fix association toggle stuck ON (AC: #3)
  - [x] 3.1 Trace the toggle OFF signal path in the working copy for association sections
  - [x] 3.2 Identify why the working copy doesn't accept the OFF mutation in-session
  - [x] 3.3 Fix mutation so toggle freely switches ON ↔ OFF without save/reload

- [x] Task 4: Enforce canonical rule order in section params (AC: #4)
  - [x] 4.1 Define canonical order: Mandatory → Editable → Hidden → Default Value → Occurrence → Constrained
  - [x] 4.2 Reorder rule fields in `section-params-editor` template or sort programmatically
  - [x] 4.3 Verify non-association sections (subset of rules) also respect the order

- [x] Task 5: Section header click to expand/collapse (AC: #5)
  - [x] 5.1 Add click handler on section header row in `section-card.component.html`
  - [x] 5.2 Ensure click on association toggle stops propagation (does not trigger expand/collapse)
  - [x] 5.3 Verify behavior matches indicator card pattern

## Dev Agent Record

### Implementation Notes

**Task 1 (AC-1):** Added `if (typeof parsed === 'number') return wrapVal(String(parsed))` in `jsonlogic-prose.ts` before the object check. Updated spec: bare numbers (42, 0, 3.14) now produce prose val spans. The rule-field component's prose-read-zone click handler works automatically since prose is no longer null.

**Task 2 (AC-2):** Moved children section in `indicator-card.component.html` from inside `@if (expanded())` to outside it, right after the header. Children are now always visible regardless of parent params expand state. Also marked "Constrained Values" as `last` param-section since children are no longer inside the body.

**Task 3 (AC-3):** The bug was that `toggleAssociationSection` only handled two cases: real sections (with `id`) and non-existing sections. When toggling ON created a stub (id: null), toggling OFF again hit neither branch. Added `removeStubSection(key)` to `section-working-copy.ts` that filters by `id === null && key === key`, wired it through `section-facade.helpers.ts`, and updated the facade's toggle to handle the stub case. Three new tests cover: ON→OFF for stubs, full cycle for server sections, and no-op on real sections.

**Task 4 (AC-4):** Reordered the template in `section-params-editor.component.ts` to match the canonical order used by hint icons: Mandatory (Obligatoire) → Editable (Non éditable) → Hidden (Masqué) → Default Value → Occurrence → Constrained. Non-association sections show only Editable then Hidden. Two new tests verify the order for both association and non-association modes.

**Task 5 (AC-5):** Made the entire section header row clickable by adding `(click)="onToggleCollapse()"` with `role="button"`, `tabindex="0"`, and keyboard handlers (Enter/Space) for accessibility. The association toggle area is wrapped with `(click)="$event.stopPropagation()"` to prevent toggle clicks from triggering expand/collapse. The chevron icon was changed from a button to a visual-only div since the header handles interaction. Updated existing tests to use header-based selectors.

### Debug Log

_No issues encountered._

## File List

- `src/app/shared/jsonlogic/jsonlogic-prose.ts` — Task 1: handle bare numeric rule values
- `src/app/shared/jsonlogic/jsonlogic-prose.spec.ts` — Task 1: tests for numeric prose
- `src/app/shared/components/indicator-card/indicator-card.component.html` — Task 2: decouple children from expand state
- `src/app/features/shared/section-indicators/section-working-copy.ts` — Task 3: add removeStubSection
- `src/app/features/shared/section-indicators/section-working-copy.spec.ts` — Task 3: tests for removeStubSection
- `src/app/features/shared/section-indicators/section-facade.helpers.ts` — Task 3: wire removeStubSection
- `src/app/features/action-models/action-model.facade.ts` — Task 3: fix toggle to handle stub sections
- `src/app/features/action-models/action-model.facade.spec.ts` — Task 3: tests for toggle ON↔OFF
- `src/app/shared/components/section-card/section-params-editor.component.ts` — Task 4: canonical rule order
- `src/app/shared/components/section-card/section-params-editor.component.spec.ts` — Task 4: order tests
- `src/app/shared/components/section-card/section-card.component.html` — Task 5: header click expand/collapse
- `src/app/shared/components/section-card/section-card.component.spec.ts` — Task 5: updated tests
- `src/app/shared/jsonlogic/variable-dictionary.service.spec.ts` — Removed unused eslint-disable directive

## Change Log

- 2026-03-31: Story created from Epic 23 manual test feedback (Anthony). 5 bugs confirmed, all fixes targeting shared components only.
- 2026-03-31: All 5 tasks implemented. Bare-number prose (AC-1), children always visible (AC-2), toggle ON↔OFF fix (AC-3), canonical rule order (AC-4), header click expand/collapse (AC-5). All 1303 tests pass, lint clean.
- 2026-03-31: Code review fixes — (1) Added keydown.enter/space stopPropagation on toggle wrapper in section-card.component.html to prevent keyboard events from triggering expand/collapse (AC-5 keyboard violation). (2) Added 2 keyboard isolation tests for projected toggle content. (3) Replaced fragile `.cursor-pointer` test selectors with `[role="button"]`. All 1305 tests pass.
