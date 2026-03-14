# Story 14.2: IndicatorModel Status Workflow

Status: done

## Story

As an operator,
I want to transition Indicator Models through draft/published/disabled states,
So that I can control which indicators are available for configuration.

## Acceptance Criteria

1. Indicator Model detail displays current status via StatusBadge component
2. Indicator Model list displays status column with StatusBadge in each row
3. Status transition buttons on detail view, conditional on current status:
   - draft → "Publier" button
   - published → "Desactiver" button
   - disabled → "Reactiver" button
4. Clicking "Publier" calls `PUT /indicator-models/{id}/publish` with success toast + detail refresh
5. Clicking "Desactiver" calls `PUT /indicator-models/{id}/disable` with success toast + detail refresh
6. Clicking "Reactiver" calls `PUT /indicator-models/{id}/activate` with success toast + detail refresh
7. Mutations use `exhaustOp` to prevent double-click
8. Per-mutation pending signals: `publishIsPending`, `disableIsPending`, `activateIsPending`
9. Facade exposes `publish(id)`, `disable(id)`, `activate(id)` methods
10. StatusBadge color coding: draft (gray), published (green), disabled (red/muted)
11. Status filter on indicator-models list connected to server-side `status` param
12. All existing tests pass; status mutation tests added

## Tasks / Subtasks

- [x] Task 1: Add status mutation requests to API file (AC: #4, #5, #6)
  - [x] Update `src/app/domains/indicator-models/indicator-model.api.ts`
  - [x] Add `publishIndicatorModelRequest(id)`, `disableIndicatorModelRequest(id)`, `activateIndicatorModelRequest(id)`
  - [x] Follow exact pattern from action-theme.api.ts
- [x] Task 2: Add status mutations to domain store (AC: #7, #8)
  - [x] Update `src/app/domains/indicator-models/indicator-model.store.ts`
  - [x] Add `publishMutation`, `disableMutation`, `activateMutation` with `exhaustOp`
- [x] Task 3: Extend facade with status methods (AC: #8, #9)
  - [x] Update `src/app/features/indicator-models/indicator-model.facade.ts`
  - [x] Add pending signals, mutation methods, error handling
- [x] Task 4: Add StatusBadge to list and detail (AC: #1, #2, #3, #10)
  - [x] Update indicator-model-list and indicator-model-detail components
- [x] Task 5: Tests (AC: #12)
  - [x] Run `npx ng test --no-watch` — zero regressions

## Dev Notes

### Same pattern as Story 14.1 (ActionModel) and existing ActionTheme

### API Endpoints (confirmed in live spec)

- `PUT /indicator-models/{id}/publish`
- `PUT /indicator-models/{id}/disable`
- `PUT /indicator-models/{id}/activate`

### IndicatorModelStatus Enum

`draft | published | disabled | deleted`

### References

- [Source: src/app/domains/action-themes/action-theme.api.ts — canonical status pattern]
- [Source: _bmad-output/implementation-artifacts/v1/14-1-action-model-status-workflow.md — parallel story]
- [Source: _bmad-output/implementation-artifacts/v1/3-3-indicator-model-status-workflow-usage-visibility.md — original story (was partially blocked)]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References

### Completion Notes List
- Implemented full IndicatorModel status workflow following ActionTheme canonical pattern
- API: Added publishIndicatorModelRequest, disableIndicatorModelRequest, activateIndicatorModelRequest
- Store: Added publishMutation, disableMutation, activateMutation with exhaustOp
- Facade: Added publish/disable/activate methods with toast + detail refresh, plus pending signals
- List: Status column with StatusBadge was already present (pre-existing)
- Detail: Added StatusBadge in header + conditional status transition buttons
- Tests: Added 3 store mutation tests + 3 facade tests for publish/disable/activate
- All 912 tests pass, zero regressions

### Change Log
- 2026-03-14: Implemented IndicatorModel status workflow (publish/disable/activate)

### File List
- src/app/domains/indicator-models/indicator-model.api.ts (modified)
- src/app/domains/indicator-models/indicator-model.store.ts (modified)
- src/app/domains/indicator-models/indicator-model.store.spec.ts (modified)
- src/app/features/indicator-models/indicator-model.facade.ts (modified)
- src/app/features/indicator-models/indicator-model.facade.spec.ts (modified)
- src/app/features/indicator-models/ui/indicator-model-detail.component.ts (modified)
