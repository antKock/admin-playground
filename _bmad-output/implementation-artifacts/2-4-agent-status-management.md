# Story 2.4: Agent Status Management

Status: review

## Story

As an operator (Alex/Sophie),
I want to manage Agent status through the admin interface,
So that I can control which agents are active and visible in the system.

## Acceptance Criteria

1. Agent list displays current status via StatusBadge for each row (already from Story 2.3)
2. Agent detail view displays StatusBadge prominently near the top of metadata
3. Agent detail view shows available status transition buttons based on `next_possible_statuses` from API
4. Clicking a status transition button opens ConfirmDialog with context about the transition
5. On confirmation, status transitions via the API using a dedicated mutation
6. StatusBadge updates immediately after successful transition
7. Success toast: "Agent status changed to [new status]"
8. Invalid status transitions display an informative error message explaining the constraint (FR15)
9. Status mutations use `exhaustOp` race condition strategy (prevent double-click)
10. Domain store has `changeStatusMutation: httpMutation({ operator: exhaustOp })`
11. Facade exposes `changeStatusIsPending` signal
12. Facade exposes `changeStatus(id, newStatus)` intention method
13. Transition buttons are disabled while `changeStatusIsPending` is true
14. Unavailable transitions are hidden (not shown as disabled) — only show valid next statuses
15. All existing tests pass; new tests for status mutation and transition UI added

## Tasks / Subtasks

- [x] Task 1: Investigate status transition API (AC: #5, #8)
  - [x] Check `api-types.ts` for `AgentNextStatusInfo` structure
  - [x] **API discrepancy**: `AgentNextStatusInfo` has `{ status, is_allowed: boolean, reason_code }`, NOT `label` as story notes suggest
  - [x] Status change is via `PUT /agents/{id}` with `{ status: newStatus }`
  - [x] `AgentRead.next_possible_statuses` provides target statuses with `is_allowed` flag; label is derived from status value

- [x] Task 2: Add status mutation to domain API (AC: #10)
  - [x] Edit `src/app/domains/agents/agent.api.ts`
  - [x] Add `changeAgentStatusRequest(params: { id: string; status: AgentStatus })` — PUT with `{ status }`
  - [x] Import `AgentStatus` type

- [x] Task 3: Add status mutation to domain store (AC: #9, #10)
  - [x] Edit `src/app/domains/agents/agent.store.ts`
  - [x] Add `changeStatusMutation: httpMutation({ request: changeAgentStatusRequest, operator: exhaustOp })`
  - [x] Import `exhaustOp` and `changeAgentStatusRequest`

- [x] Task 4: Extend facade with status methods (AC: #11, #12)
  - [x] Edit `src/app/features/agents/agent.facade.ts`
  - [x] Add `changeStatusIsPending` signal from domain store
  - [x] Add `changeStatus(id, newStatus)` method with toast + detail reload on success
  - [x] Include `changeStatusIsPending` in `anyMutationPending` computation
  - [x] Error handling reuses existing `handleMutationError` (409/422/generic)

- [x] Task 5: Update detail component with status transitions (AC: #2, #3, #4, #6, #13, #14)
  - [x] Edit `src/app/features/agents/ui/agent-detail.component.ts`
  - [x] `allowedTransitions` computed: filters `next_possible_statuses` where `is_allowed === true` (AC #14: hidden, not disabled)
  - [x] Transition buttons rendered with dynamic styling (completed → brand, deleted → danger, draft → secondary)
  - [x] Buttons disabled when `facade.changeStatusIsPending()`
  - [x] ConfirmDialog with context: title, name, target status, variant
  - [x] Label derived from status: capitalize first letter (e.g., "Completed")
  - [x] StatusBadge updates reactively from `facade.selectedItem()` signal

- [x] Task 6: Handle invalid transitions (AC: #8)
  - [x] Only buttons for `is_allowed === true` transitions are shown
  - [x] 409/422 errors mapped via existing `handleMutationError` to user-friendly toast

- [x] Task 7: Write tests (AC: #15)
  - [x] Updated `agent.store.spec.ts` — 2 new tests: successful status change, error on status change
  - [x] Updated `agent.facade.spec.ts` — 2 new tests: success with toast + detail reload, error with toast
  - [x] Run `npx ng test --watch=false` — 210/210 tests pass, zero regressions

## Dev Notes

### Agent Status Model

```typescript
// AgentStatus — API enum values
type AgentStatus = "draft" | "completed" | "deleted";

// AgentNextStatusInfo — returned in AgentRead
{
  status: AgentStatus;  // target status
  label: string;        // human-readable transition label (e.g., "Mark as Completed")
}
```

### Status Transitions (from API)

The `next_possible_statuses` field on `AgentRead` drives the UI. Expected transitions:
- `draft` → can transition to: `completed`
- `completed` → can transition to: `draft` (revert), `deleted` (soft-delete)
- `deleted` → terminal state (no transitions available)

The UI should ONLY render buttons for statuses listed in `next_possible_statuses`. If the array is empty, no transition buttons are shown.

### exhaustOp vs concatOp

Status transitions use `exhaustOp` — this is CRITICAL:
- `concatOp` queues requests sequentially → user double-clicks "Complete" → two API calls queued
- `exhaustOp` ignores subsequent calls while one is in-flight → double-click is safe

This matches the Action Theme status pattern from Epic 0 and the Story 1.3 specification.

### Status Change via PUT

Based on `AgentUpdate` schema including a `status` field, status changes likely go through:
```
PUT /agents/{id}
Body: { "status": "completed" }
```

This is simpler than a dedicated transitions endpoint. The API file should create:
```typescript
export function changeAgentStatusRequest(params: { id: string; status: AgentStatus }) {
  return { url: `${BASE_URL}${params.id}`, method: 'PUT' as const, body: { status: params.status } };
}
```

### StatusBadge Mapping

```typescript
// Status → badge variant mapping
const statusVariants: Record<AgentStatus, string> = {
  draft: 'neutral',      // gray
  completed: 'success',  // green
  deleted: 'disabled',   // dimmed gray
};
```

### Transition Button Styling

```typescript
// Target status → button variant mapping
const buttonVariants: Record<AgentStatus, string> = {
  completed: 'primary',   // green/brand primary action
  draft: 'secondary',     // outlined secondary (revert)
  deleted: 'danger',      // red danger for soft-delete
};
```

### ConfirmDialog for Status Transitions

```typescript
const confirmed = await this.confirmDialog.confirm({
  title: 'Change Agent Status',
  message: `Change status of <strong>${agentName}</strong> to <strong>${transition.label}</strong>?`,
  confirmLabel: transition.label,
  confirmVariant: targetStatus === 'deleted' ? 'danger' : 'primary',
});
```

### Dependencies

- **Requires Story 2-3 complete** — base CRUD implementation for Agents with StatusBadge display
- `StatusBadgeComponent` from `src/app/shared/components/status-badge/`
- `ConfirmDialogService` from `src/app/shared/services/confirm-dialog.service.ts`
- `ToastService` from `src/app/shared/services/toast.service.ts`

### Known Workarounds (from Epic 0/1)

Same as Story 2-3: `as never` casts, `withProps` for injection, Vitest sync patterns.

### Anti-Patterns to Avoid

- Do NOT use `concatOp` for status mutations — use `exhaustOp` to prevent double-click race conditions
- Do NOT show disabled buttons for invalid transitions — only show valid `next_possible_statuses`
- Do NOT implement status transitions for Communities in this story — this is Agent-specific
- Do NOT let the form component handle status changes — status is managed from the detail view
- Do NOT forget to reload the agent detail after status change to get fresh `next_possible_statuses`
- Do NOT hardcode transition options — always derive from API's `next_possible_statuses`

### Project Structure Notes

- Modified: `src/app/domains/agents/agent.api.ts` (add changeAgentStatusRequest)
- Modified: `src/app/domains/agents/agent.store.ts` (add changeStatusMutation)
- Modified: `src/app/features/agents/agent.facade.ts` (add changeStatus method + isPending signal)
- Modified: `src/app/features/agents/ui/agent-detail.component.ts` (add transition buttons)
- No new files — all modifications to existing Story 2.3 files

### References

- [Source: src/app/core/api/generated/api-types.ts — AgentRead.next_possible_statuses, AgentStatus, AgentNextStatusInfo]
- [Source: src/app/domains/action-themes/action-theme.store.ts — status mutation pattern with exhaustOp (if implemented)]
- [Source: _bmad-output/implementation-artifacts/1-3-action-model-status-workflow.md — status workflow pattern reference (blocked but spec is valid)]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.4]
- [Source: _bmad-output/planning-artifacts/architecture.md — mutation operator strategies: exhaustOp for status transitions]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — status transition ConfirmDialog pattern]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- AgentNextStatusInfo API discrepancy: has `is_allowed: boolean` + `reason_code`, NOT `label: string` as story notes suggest
- Label derived from status value: `status.charAt(0).toUpperCase() + status.slice(1)`

### Completion Notes List

- Status transitions via PUT /agents/{id} with { status } body
- changeStatusMutation uses exhaustOp (prevents double-click race conditions)
- Only allowed transitions shown (is_allowed === true), invalid ones hidden per AC #14
- Transition button styling: completed → brand/primary, deleted → danger, draft → secondary/outlined
- ConfirmDialog variant matches target status danger level
- After successful status change, detail is reloaded to get fresh next_possible_statuses
- 210/210 tests pass across 27 test files

### Change Log

- 2026-03-04: All 7 tasks implemented, tests passing

### File List

- `src/app/domains/agents/agent.api.ts` (modified — added changeAgentStatusRequest)
- `src/app/domains/agents/agent.store.ts` (modified — added changeStatusMutation with exhaustOp)
- `src/app/domains/agents/agent.store.spec.ts` (modified — 2 new tests)
- `src/app/features/agents/agent.facade.ts` (modified — added changeStatus method + changeStatusIsPending signal)
- `src/app/features/agents/agent.facade.spec.ts` (modified — 2 new tests)
- `src/app/features/agents/ui/agent-detail.component.ts` (modified — added transition buttons, ConfirmDialog)
