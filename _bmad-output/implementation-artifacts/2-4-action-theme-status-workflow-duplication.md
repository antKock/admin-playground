# Story 2.4: Action Theme Status Workflow & Duplication

Status: ready-for-dev

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

- [ ] Task 1: Add Status Workflow Actions to Detail View (AC: #1, #2, #3, #6)
  - [ ] Add action buttons section to `action-theme-detail.component.ts`
  - [ ] Conditionally show actions based on current status:
    - Draft → show "Publish" button (brand-primary)
    - Published → show "Disable" button (warning/neutral)
    - Disabled → show "Activate" button (brand-primary)
  - [ ] On "Publish" click: call `actionThemeService.publish(id)`, update StatusBadge, show toast
  - [ ] On "Disable" click: call `actionThemeService.disable(id)`, update StatusBadge, show toast
  - [ ] On "Activate" click: call `actionThemeService.activate(id)`, update StatusBadge, show toast
  - [ ] Show loading state on action button while request is in flight
  - [ ] On success: refresh the detail data to get server-confirmed state

- [ ] Task 2: Handle Status Transition Errors (AC: #4)
  - [ ] On API error from publish/disable/activate:
    - Display clear error message via toast explaining why transition failed
    - Do NOT update the StatusBadge — keep current server-confirmed status
    - Re-enable the action button
  - [ ] Error message pattern: **"Cannot publish Action Theme"** · {API reason}

- [ ] Task 3: Implement Duplicate Flow (AC: #5)
  - [ ] Add "Duplicate" button to detail view action area
  - [ ] On click: call `actionThemeService.duplicate(id)`
  - [ ] On success: `toast.success("Action Theme duplicated")`, navigate to `/action-themes/:newId`
  - [ ] On error: `toast.error("Duplication failed")` with API error context

- [ ] Task 4: Update List View Status Actions (Optional Enhancement)
  - [ ] Consider adding quick status actions in list row (inline publish/disable)
  - [ ] Or keep actions detail-view-only for v1 (simpler)

- [ ] Task 5: Verification & Tests
  - [ ] Update `action-theme-detail.component.spec.ts` with workflow tests
  - [ ] Test: draft → publish → published badge
  - [ ] Test: published → disable → disabled badge
  - [ ] Test: disabled → activate → published badge
  - [ ] Test: error preserves current status
  - [ ] Test: duplicate navigates to new theme
  - [ ] All tests pass

## Dev Notes

### Architecture Patterns & Constraints

- **Status Workflow via Dedicated Endpoints** — Action Themes use POST endpoints for transitions (NOT PATCH on status field)
- **Optimistic vs Server-Confirmed**: Do NOT optimistically update status. Wait for API success, then refresh data from server to get confirmed state
- **Action Button Visibility**: Conditional based on current status signal — only show valid transitions
- **Signal Updates**: After successful transition, reload entity data from server to update all signals

### API Endpoints

```
POST /api/action-themes/:id/publish   → Returns updated ActionTheme with status: "published"
POST /api/action-themes/:id/disable   → Returns updated ActionTheme with status: "disabled"
POST /api/action-themes/:id/activate  → Returns updated ActionTheme with status: "published"
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

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
