# Story 2.4: Action Theme Status Workflow & Duplication

Status: done

## Story

As an operator (Sophie/Alex),
I want to transition Action Themes through their status lifecycle (draft → published → disabled) and duplicate them,
so that I can manage theme publication and quickly create variations.

## Acceptance Criteria

1. **Publish Action** — Given the user views a draft Action Theme, when they click "Publish", then the status transitions to published, the StatusBadge updates immediately, and a success toast confirms "Action Theme published"
2. **Disable Action** — Given the user views a published Action Theme, when they click "Disable", then the status transitions to disabled and the StatusBadge updates to gray
3. **Activate Action** — Given the user views a disabled Action Theme, when they click "Activate", then the status transitions back to published
4. **Invalid Transition Error** — Given the user attempts an invalid status transition, when the API returns an error, then a clear message explains why the transition is not allowed and the current status remains unchanged
5. **Duplicate Action** — Given the user views an Action Theme, when they click "Duplicate", then a new Action Theme is created as a copy with draft status, a success toast confirms "Action Theme duplicated", and the user is navigated to the duplicate's detail view
6. **Status Visibility** — Given the user views Action Theme list or detail, the current status is visible at a glance via StatusBadge

## Tasks / Subtasks

- [x] Task 1: Add Status Workflow Actions to Detail View (AC: #1, #2, #3, #6)
  - [x] Add action buttons section to `action-theme-detail.component.ts`
  - [x] Conditionally show actions based on current status:
    - Draft → show "Publish" button (brand-primary)
    - Published → show "Disable" button (warning/neutral)
    - Disabled → show "Activate" button (brand-primary)
  - [x] On "Publish" click: call `actionThemeService.publish(id)`, update StatusBadge, show toast
  - [x] On "Disable" click: call `actionThemeService.disable(id)`, update StatusBadge, show toast
  - [x] On "Activate" click: call `actionThemeService.activate(id)`, update StatusBadge, show toast
  - [x] Show loading state on action button while request is in flight
  - [x] On success: refresh the detail data to get server-confirmed state

- [x] Task 2: Handle Status Transition Errors (AC: #4)
  - [x] On API error from publish/disable/activate:
    - Display clear error message via toast explaining why transition failed
    - Do NOT update the StatusBadge — keep current server-confirmed status
    - Re-enable the action button
  - [x] Error message pattern: **"Cannot publish Action Theme"** · {API reason}

- [x] Task 3: Implement Duplicate Flow (AC: #5)
  - [x] Add "Duplicate" button to detail view action area
  - [x] On click: call `actionThemeService.duplicate(id)`
  - [x] On success: `toast.success("Action Theme duplicated")`, navigate to `/action-themes/:newId`
  - [x] On error: `toast.error("Duplication failed")` with API error context

- [x] Task 4: Update List View Status Actions (Optional Enhancement)
  - [x] Consider adding quick status actions in list row (inline publish/disable)
  - [x] Or keep actions detail-view-only for v1 (simpler)

- [x] Task 5: Verification & Tests
  - [x] Update `action-theme-detail.component.spec.ts` with workflow tests
  - [x] Test: draft → publish → published badge
  - [x] Test: published → disable → disabled badge
  - [x] Test: disabled → activate → published badge
  - [x] Test: error preserves current status
  - [x] Test: duplicate navigates to new theme
  - [x] All tests pass

## Dev Notes

### Architecture Patterns & Constraints

- **Status Workflow via Dedicated Endpoints** — Action Themes use POST endpoints for transitions (NOT PATCH on status field)
- **Optimistic vs Server-Confirmed**: Do NOT optimistically update status. Wait for API success, then refresh data from server to get confirmed state
- **Action Button Visibility**: Conditional based on current status signal — only show valid transitions
- **Signal Updates**: After successful transition, reload entity data from server to update all signals

### API Endpoints

```
PUT  /api/action-themes/:id/publish   → Returns updated ActionTheme with status: "published"
PUT  /api/action-themes/:id/disable   → Returns updated ActionTheme with status: "disabled"
PUT  /api/action-themes/:id/activate  → Returns updated ActionTheme with status: "published"
POST /api/action-themes/:id/duplicate → Returns new ActionTheme (copy) with status: "draft"
```

### Status State Machine

```
draft → published (via /publish)
published → disabled (via /disable)
disabled → published (via /activate)
Any status → duplicate creates new draft
```

### Action Button Configuration

| Current Status | Available Actions |
|---------------|------------------|
| draft | Publish, Duplicate, Edit, Delete |
| published | Disable, Duplicate |
| disabled | Activate, Duplicate, Delete |

### Toast Message Patterns

- **"Action Theme published"** — on successful publish
- **"Action Theme disabled"** — on successful disable
- **"Action Theme activated"** — on successful activate
- **"Action Theme duplicated"** — on successful duplicate
- **"Cannot publish Action Theme"** · {reason} — on transition error

### Files Modified by This Story

```
src/app/features/action-themes/
├── action-theme-detail.component.ts    ← add workflow actions + duplicate
├── action-theme-detail.component.html  ← add action buttons
└── action-theme-detail.component.spec.ts ← add workflow tests
```

### Dependencies

- **Story 2.3**: ActionThemeService (with publish/disable/activate/duplicate methods), detail component
- **Story 1.5**: StatusBadge, Toast

### What This Story Does NOT Create

- No list-level quick actions (v1 keeps it simple — detail view only)
- No bulk status transitions
- No confirmation dialogs for publish/disable (these are non-destructive, unlike delete)

### Anti-Patterns to Avoid

- DO NOT optimistically update status badge — wait for server confirmation
- DO NOT allow invalid transition buttons to be visible (hide Publish on non-draft)
- DO NOT use PATCH to change status — use dedicated transition endpoints
- DO NOT swallow transition error messages

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.4] — Acceptance criteria
- [Source: _bmad-output/planning-artifacts/architecture.md#Status Workflow] — Transition endpoints
- [Source: _bmad-output/api-observations.md] — ActionTheme dedicated endpoints confirmed
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#StatusBadge] — Badge specifications

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

Implemented as part of Story 2.3. Detail component shows conditional Publish/Disable/Activate buttons based on current status. Duplicate creates copy and navigates to new theme. Server-confirmed state updates via setSelectedItem() (no extra getById round-trip). Toast messages for all actions and errors. Loading state shown on action buttons during requests. Edit/Delete conditionally visible per status state machine.

### File List

- `src/app/features/action-themes/action-theme-detail.component.ts` (modified — added conditional Publish/Disable/Activate buttons by status, Duplicate button, actionLoading signal, conditional Edit/Delete visibility)
- `src/app/features/action-themes/action-theme-detail.component.spec.ts` (modified — added workflow action tests, button visibility tests, loading state tests)
- `src/app/features/action-themes/action-theme.service.ts` (modified — statusAction() updates selectedItem via setSelectedItem(), removed empty tap from duplicate())
- `src/app/core/api/base-entity.service.ts` (modified — added protected setSelectedItem() method)

### Change Log

- 2026-03-04: Implemented together with Story 2.3
- 2026-03-04: Code review fixes — added actionLoading signal, conditional Edit/Delete per status, fixed statusAction to update selectedItem, removed redundant getById calls, fixed API method docs (PUT not POST), added 4 new tests
