# Story 14.1: ActionModel Status Workflow

Status: done

## Story

As an operator,
I want to transition Action Models through draft/published/disabled states,
So that I can control which models are active and available for use.

## Acceptance Criteria

1. Action Model detail displays current status via StatusBadge component
2. Action Model list displays status column with StatusBadge in each row
3. Status transition buttons on detail view, conditional on current status:
   - draft → "Publier" button
   - published → "Desactiver" button
   - disabled → "Reactiver" button
4. Clicking "Publier" calls `PUT /action-models/{id}/publish` with success toast + detail refresh
5. Clicking "Desactiver" calls `PUT /action-models/{id}/disable` with success toast + detail refresh
6. Clicking "Reactiver" calls `PUT /action-models/{id}/activate` with success toast + detail refresh
7. Mutations use `exhaustOp` to prevent double-click duplicate submissions
8. Per-mutation pending signals: `publishIsPending`, `disableIsPending`, `activateIsPending`
9. Facade exposes `publish(id)`, `disable(id)`, `activate(id)` methods
10. StatusBadge color coding: draft (gray), published (green), disabled (red/muted)
11. All existing tests pass; status mutation tests added

## Tasks / Subtasks

- [x] Task 1: Add status mutation requests to API file (AC: #4, #5, #6)
  - [x] Update `src/app/domains/action-models/action-model.api.ts`
  - [x] Add `publishActionModelRequest(id)` → `{ url, method: 'PUT', body: {} }`
  - [x] Add `disableActionModelRequest(id)` → same pattern
  - [x] Add `activateActionModelRequest(id)` → same pattern
  - [x] Follow exact pattern from `action-theme.api.ts`
- [x] Task 2: Add status mutations to domain store (AC: #7, #8)
  - [x] Update `src/app/domains/action-models/action-model.store.ts`
  - [x] Add `publishMutation`, `disableMutation`, `activateMutation` with `exhaustOp`
  - [x] These auto-generate `*IsPending` signals
- [x] Task 3: Extend facade with status methods (AC: #8, #9)
  - [x] Update `src/app/features/action-models/action-model.facade.ts`
  - [x] Add `publishIsPending`, `disableIsPending`, `activateIsPending` computed signals
  - [x] Update `anyMutationPending` to include status mutation signals
  - [x] Add `publish(id)`, `disable(id)`, `activate(id)` methods with toast + refresh
  - [x] Error handling via `handleMutationError`
- [x] Task 4: Add StatusBadge to list component (AC: #2, #10)
  - [x] Update action-model-list component
  - [x] Add `status` column with StatusBadge rendering
- [x] Task 5: Add status actions to detail component (AC: #1, #3, #10)
  - [x] Update action-model-detail component
  - [x] Display StatusBadge in header
  - [x] Conditional transition buttons based on current status
  - [x] Buttons disabled while corresponding mutation is pending
- [x] Task 6: Tests (AC: #11)
  - [x] Store tests: verify mutation requests are correct
  - [x] Facade tests: verify success → toast + refresh, error → error toast
  - [x] Run `npx ng test --no-watch` — zero regressions

## Dev Notes

### Canonical Pattern — Action Theme Reference

Copy the ActionTheme status workflow exactly. Key files:
- `src/app/domains/action-themes/action-theme.api.ts` — status endpoint pattern
- `src/app/domains/action-themes/action-theme.store.ts` — httpMutation with exhaustOp
- `src/app/features/action-themes/action-theme.facade.ts` — publish/disable/activate methods
- Action theme detail component — status badge + transition buttons UI

### API Endpoints (confirmed in live spec)

- `PUT /action-models/{id}/publish`
- `PUT /action-models/{id}/disable`
- `PUT /action-models/{id}/activate`

### ActionModelStatus Enum

`draft | published | disabled | deleted`

### Note on Story 1-3

This story supersedes the blocked Story 1-3. The API now supports all required endpoints. Story 1-3 had a complete implementation plan that remains valid — this story inherits that plan with the addition of the `activate` endpoint (draft→published, published→disabled, disabled→published).

### References

- [Source: src/app/domains/action-themes/action-theme.api.ts — status endpoint pattern]
- [Source: src/app/domains/action-themes/action-theme.store.ts — status mutation pattern with exhaustOp]
- [Source: src/app/features/action-themes/action-theme.facade.ts — status method pattern]
- [Source: src/app/shared/components/status-badge/ — StatusBadge component]
- [Source: _bmad-output/implementation-artifacts/v1/1-3-action-model-status-workflow.md — original blocked story with detailed plan]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References

### Completion Notes List
- Implemented full ActionModel status workflow following ActionTheme canonical pattern
- API: Added publishActionModelRequest, disableActionModelRequest, activateActionModelRequest
- Store: Added publishMutation, disableMutation, activateMutation with exhaustOp
- Facade: Added publish/disable/activate methods with toast + detail refresh, plus pending signals
- List: Status column with StatusBadge was already present (pre-existing)
- Detail: Added StatusBadge in header + conditional status transition buttons
- Tests: Added 3 store mutation tests + 3 facade tests for publish/disable/activate
- All 906 tests pass, zero regressions

### Change Log
- 2026-03-14: Implemented ActionModel status workflow (publish/disable/activate)

### File List
- src/app/domains/action-models/action-model.api.ts (modified)
- src/app/domains/action-models/action-model.store.ts (modified)
- src/app/domains/action-models/action-model.store.spec.ts (modified)
- src/app/features/action-models/action-model.facade.ts (modified)
- src/app/features/action-models/action-model.facade.spec.ts (modified)
- src/app/features/action-models/ui/action-model-detail.component.ts (modified)
