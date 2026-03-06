# Story 1.3: Action Model Status Workflow

Status: blocked

## Story

As an operator (Alex/Sophie),
I want to transition Action Models through their status lifecycle,
So that I can control which models are active and ready for use.

## API Gap Alert

**The current API does NOT include status fields or status transition endpoints for Action Models.** The generated `ActionModelRead` type has no `status` property, and there are no `/action-models/{id}/publish` or similar endpoints in the OpenAPI spec.

**Before implementing this story, verify one of the following:**
1. The API team has added status endpoints (re-generate api-types.ts with `npx openapi-typescript`)
2. Status is managed differently for Action Models (check with product owner)
3. This story should be deferred until the API supports it

**If the API has been updated**, follow the Action Theme status pattern below. The Action Theme entity has a proven status workflow implementation that this story should mirror exactly.

## Acceptance Criteria

1. Action Model detail view displays current status via StatusBadge component
2. Action Model list view displays status via StatusBadge in each row
3. Status transition buttons are available on the detail view, conditional on current status
4. Clicking "Publish" transitions draft → published with success toast and immediate badge update
5. Clicking "Disable" transitions published → disabled with success toast and immediate badge update
6. Invalid transitions are blocked with informative error message via toast
7. Status mutations use `exhaustOp` race condition strategy to prevent duplicate submissions
8. Per-mutation status signals exposed: `publishIsPending`, `disableIsPending`
9. Facade exposes `publish(id)` and `disable(id)` methods
10. StatusBadge color coding: draft (gray), published (green), disabled (red/gray)
11. All existing tests pass; status mutation tests added

## Tasks / Subtasks

- [ ] Task 0: Verify API status support (AC: prerequisite)
  - [ ] Regenerate API types: `npx openapi-typescript https://laureatv2-api-staging.osc-fr1.scalingo.io/openapi.json -o src/app/core/api/generated/api-types.ts`
  - [ ] Check if `ActionModelRead` now includes `status` field
  - [ ] Check if status transition endpoints exist (e.g., `/action-models/{id}/publish`)
  - [ ] If NO status support → HALT and report to product owner
  - [ ] If YES → document the exact endpoint patterns and status enum values
- [ ] Task 1: Add status types to domain models (AC: prerequisite)
  - [ ] Update `src/app/domains/action-models/action-model.models.ts`
  - [ ] Add `ActionModelStatus` type from generated api-types (if available)
  - [ ] Verify status enum values match expected: `draft`, `published`, `disabled`
- [ ] Task 2: Add status mutation requests to API file (AC: #7)
  - [ ] Update `src/app/domains/action-models/action-model.api.ts`
  - [ ] Add `publishActionModelRequest(id)` → `{ url: \`${BASE_URL}${id}/publish\`, method: 'PUT', body: {} }`
  - [ ] Add `disableActionModelRequest(id)` → `{ url: \`${BASE_URL}${id}/disable\`, method: 'PUT', body: {} }`
  - [ ] Follow exact pattern from `action-theme.api.ts` status mutations
- [ ] Task 3: Add status mutations to domain store (AC: #7, #8)
  - [ ] Update `src/app/domains/action-models/action-model.store.ts`
  - [ ] Add `publishMutation: httpMutation({ request: (id: string) => publishActionModelRequest(id), operator: exhaustOp })`
  - [ ] Add `disableMutation: httpMutation({ request: (id: string) => disableActionModelRequest(id), operator: exhaustOp })`
  - [ ] These auto-generate `publishMutationIsPending` and `disableMutationIsPending` signals
- [ ] Task 4: Extend facade with status methods (AC: #8, #9)
  - [ ] Update `src/app/features/action-models/action-model.facade.ts`
  - [ ] Add per-mutation signals: `publishIsPending`, `disableIsPending`
  - [ ] Update `anyMutationPending` to include status mutation signals
  - [ ] Add `async publish(id)`: result handling → toast success + `selectById(id)` to refresh detail
  - [ ] Add `async disable(id)`: same pattern as publish
  - [ ] Error handling: `handleMutationError(error, 'Cannot publish Action Model')` pattern
- [ ] Task 5: Add StatusBadge to list component (AC: #2, #10)
  - [ ] Update `src/app/features/action-models/ui/action-model-list.component.ts`
  - [ ] Import `StatusBadgeComponent` from `@app/shared/components/status-badge/`
  - [ ] Add `status` column to `ColumnDef[]` with custom rendering via StatusBadge
  - [ ] Badge color mapping: draft → gray, published → green, disabled → gray/red
- [ ] Task 6: Add status actions to detail component (AC: #1, #3, #4, #5, #6, #10)
  - [ ] Update `src/app/features/action-models/ui/action-model-detail.component.ts`
  - [ ] Import `StatusBadgeComponent`
  - [ ] Display StatusBadge in header area with current status
  - [ ] Conditional action buttons based on status:
    - draft: show "Publish" button
    - published: show "Disable" button
    - disabled: no transition buttons (or "Reactivate" if API supports)
  - [ ] Button click → `facade.publish(id)` or `facade.disable(id)`
  - [ ] Disable buttons while `facade.publishIsPending()` or `facade.disableIsPending()`
- [ ] Task 7: Write status mutation tests (AC: #11)
  - [ ] Update domain store tests: `publishMutation` sends correct request, `disableMutation` sends correct request
  - [ ] Update facade tests: `publish()` success → toast + selectById refresh, error → error toast
  - [ ] Run `npx vitest run` — zero regressions

## Dev Notes

### Canonical Status Pattern — Action Theme Reference

The Action Theme entity has a fully implemented status workflow. Copy its pattern exactly:

**API file** (`action-theme.api.ts`):
```typescript
export function publishActionModelRequest(id: string) {
  return { url: `${BASE_URL}${id}/publish`, method: 'PUT', body: {} };
}
export function disableActionModelRequest(id: string) {
  return { url: `${BASE_URL}${id}/disable`, method: 'PUT', body: {} };
}
```

**Domain store** (`action-theme.store.ts`):
```typescript
publishMutation: httpMutation({
  request: (id: string) => publishActionModelRequest(id),
  operator: exhaustOp,  // prevents double-click duplicate submissions
}),
disableMutation: httpMutation({
  request: (id: string) => disableActionModelRequest(id),
  operator: exhaustOp,
}),
```

**Facade** (`action-theme.facade.ts`):
```typescript
async publish(id: string): Promise<void> {
  const result = await this.domainStore.publishMutation(id);
  if (result.status === 'success') {
    this.toast.success('Action Model published');
    this.domainStore.selectById(id);  // refresh detail view
  } else if (result.status === 'error') {
    this.handleMutationError(result.error, 'Cannot publish Action Model');
  }
}
```

### StatusBadge Component

Already exists at `src/app/shared/components/status-badge/`. Import and use:
```typescript
import { StatusBadgeComponent } from '@app/shared/components/status-badge/status-badge.component';
```

### `exhaustOp` vs `concatOp`

- **`exhaustOp`** for status transitions: ignores new calls while one is in-flight (prevents double-click)
- **`concatOp`** for CRUD: queues requests sequentially

### Per-Mutation Status Signals (Epic 0 Retro)

`httpMutation` auto-generates `*IsPending` signals. The facade exposes them so UI can disable buttons during in-flight mutations. This was caught in code review during Epic 0 — include from the start.

### Known Workarounds

Same as Story 1.1 — `as never` casts, `withProps` for injection context, Vitest sync patterns.

### Dependencies

- **Requires Story 1.1 complete** — base CRUD implementation
- **Requires API status support** — verify before starting (Task 0)
- **Optional after Story 1.2** — can be done in parallel if API is ready

### References

- [Source: src/app/domains/action-themes/action-theme.store.ts — status mutation pattern with exhaustOp]
- [Source: src/app/domains/action-themes/action-theme.api.ts — status endpoint pattern]
- [Source: src/app/features/action-themes/action-theme.facade.ts — status method pattern in facade]
- [Source: src/app/shared/components/status-badge/ — StatusBadge component]
- [Source: src/app/core/api/generated/api-types.ts — check for ActionModelStatus type]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.3]
- [Source: _bmad-output/implementation-artifacts/epic-0-retro-2026-03-04.md — per-mutation status signals, exhaustOp pattern]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- HALT: Task 0 verified — ActionModelRead has no `status` field in api-types.ts
- HALT: No `/action-models/{id}/publish` or `/action-models/{id}/disable` endpoints in OpenAPI spec
- Story blocked pending API team adding status support

### Completion Notes List

- Task 0 executed: regeneration check skipped (api-types.ts already up to date), type inspection confirmed no status field
- Story HALTED per API Gap Alert instructions — cannot proceed without backend support

### Change Log

- 2026-03-04: Story blocked — API does not support Action Model status workflow

### File List
