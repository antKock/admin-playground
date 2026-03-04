# Story 2.2: Funding Program Create, Edit & Delete

Status: done

## Story

As an operator (Sophie/Alex),
I want to create new Funding Programs, edit existing ones, and delete them with confirmation,
so that I can manage the full lifecycle of funding program configuration.

## Acceptance Criteria

1. **Create Form** — Given the user clicks "Create" on the list, when the form is displayed, then a structured form is rendered using Angular Reactive Forms with required fields validated on blur and on submit, and the first invalid field is focused on submit if validation fails
2. **Create Success** — Given valid data is submitted, when the API call succeeds, then a success toast "Funding Program created" is displayed and the user is navigated to the new program's detail view
3. **Create Error Handling** — Given valid data is submitted, when the API call fails, then a human-readable error message is displayed via toast; 422 validation errors are mapped to specific form fields where possible; the error explains what failed and why
4. **Edit Pre-Population** — Given the user opens an existing Funding Program for editing, when the edit form loads, then all fields are pre-populated with current values and the form component handles both create and edit via a `mode` input
5. **Edit Success** — Given the user saves edits, when the API call succeeds, then a success toast confirms "Funding Program updated"
6. **Delete Confirmation** — Given the user clicks delete, when the confirmation dialog appears, then it clearly states what will be deleted, and the user must explicitly confirm before the delete proceeds
7. **Delete Success** — On successful deletion, a toast confirms and the user returns to the list
8. **Delete Error** — On failure (e.g., 409 conflict), the error message explains why deletion failed and what to do

## Tasks / Subtasks

- [x] Task 1: Create Funding Program Form Component (AC: #1, #4)
  - [x] Implement `src/app/features/funding-programs/funding-program-form.component.ts` (replace stub)
  - [x] Accept `mode` input: 'create' | 'edit' (inferred from route — `:id/edit` vs `new`)
  - [x] Build Reactive Form with FormBuilder: all Funding Program fields
  - [x] Required field validation with error messages shown on blur
  - [x] On submit: validate all, focus first invalid field if errors
  - [x] In edit mode: load existing data via `service.getById(id)` and patch form
  - [x] Submit button text: "Create" or "Save" based on mode
  - [x] Create spec file

- [x] Task 2: Wire Create Flow (AC: #2, #3)
  - [x] Add "Create Funding Program" button to list component (top-right, brand-primary)
  - [x] Button navigates to `/funding-programs/new`
  - [x] On form submit (create mode): call `service.create(formData)`
  - [x] On success: `toast.success("Funding Program created")`, navigate to `/funding-programs/:newId`
  - [x] On 422: map validation errors to form fields via `setErrors()`
  - [x] On other errors: `toast.error(humanReadableMessage)`

- [x] Task 3: Wire Edit Flow (AC: #4, #5)
  - [x] Add "Edit" button to detail component
  - [x] Button navigates to `/funding-programs/:id/edit`
  - [x] On form submit (edit mode): call `service.update(id, formData)`
  - [x] On success: `toast.success("Funding Program updated")`, navigate back to detail view
  - [x] On error: same error handling as create

- [x] Task 4: Wire Delete Flow (AC: #6, #7, #8)
  - [x] Add "Delete" button to detail component (danger variant)
  - [x] On click: `confirmDialog.confirm({ title: "Delete Funding Program", message: "Are you sure you want to delete '{name}'? This action cannot be undone.", confirmLabel: "Delete", confirmVariant: "danger" })`
  - [x] On confirm: call `service.delete(id)`
  - [x] On success: `toast.success("Funding Program deleted")`, navigate to list
  - [x] On 409 conflict: `toast.error("Cannot delete — {reason}")` with context from API
  - [x] On other errors: `toast.error(humanReadableMessage)`

- [x] Task 5: Error Handling Utilities
  - [x] Create helper to map 422 API validation errors to Reactive Form field errors
  - [x] Create helper to extract human-readable error messages from API responses
  - [x] These can live in the feature folder or a shared utility

- [x] Task 6: Verification
  - [x] Create form renders, validates, and submits
  - [x] Edit form pre-populates and saves
  - [x] Delete shows confirmation and processes
  - [x] Error scenarios handled gracefully
  - [x] All tests pass

## Dev Notes

### Architecture Patterns & Constraints

- **Forms**: Angular Reactive Forms only (NOT template-driven) — `FormBuilder`, `FormGroup`, `FormControl`
- **Validation**: Client-side on blur + on submit; server-side errors mapped to form fields (422)
- **Explicit Save**: User must click Save — NO auto-save on field change
- **Single Form Component**: Handles both create and edit via mode — NOT two separate components
- **Error Strategy**: Domain errors (400, 409, 422) handled in component; infrastructure errors (401, 500, network) handled by interceptor
- **Toast Messages**: Follow pattern: **"Bold action"** followed by context
- **Delete Confirmation**: Uses ConfirmDialogService with danger variant

### Error Message Patterns

- Create success: **"Funding Program created"**
- Update success: **"Funding Program updated"**
- Delete success: **"Funding Program deleted"**
- Validation error: Inline on form fields + toast summary
- Conflict (409): **"Cannot delete Funding Program"** — Linked to 3 action models
- Server error (500): Handled by interceptor — "Server error" toast
- Network error: Handled by interceptor — "Connection lost" toast

### API Contracts

- `POST /api/funding-programs` — Create (body: Partial<FundingProgram>)
- `PATCH /api/funding-programs/:id` — Update (body: Partial<FundingProgram>)
- `DELETE /api/funding-programs/:id` — Delete

### Form Fields (from OpenAPI spec — verify exact fields)

Expected fields based on entity type:
- `label` (required) — Display name
- `technical_label` (required) — Technical identifier
- `description` — Optional description
- Additional fields as discovered from API types

### Files Modified/Created by This Story

```
src/app/features/funding-programs/
  funding-program-form.component.ts     <- replace stub from Story 2.1
  funding-program-form.component.html
  funding-program-form.component.spec.ts
  funding-program-list.component.ts     <- add Create button
  funding-program-list.component.html   <- add Create button
  funding-program-detail.component.ts   <- add Edit/Delete buttons
  funding-program-detail.component.html <- add Edit/Delete buttons
```

### Dependencies

- **Story 1.2**: BaseEntityService, API types
- **Story 1.3**: Auth interceptor for JWT
- **Story 1.5**: Toast, ConfirmDialog
- **Story 2.1**: FundingProgramService, list/detail components to enhance

### What This Story Does NOT Create

- No status workflow (Funding Programs may not have status transitions)
- No list filtering (Story 2.5)
- No bulk operations

### Anti-Patterns to Avoid

- DO NOT use template-driven forms — Reactive Forms only
- DO NOT auto-save on field change — explicit save only
- DO NOT swallow API error messages — always surface to user
- DO NOT create separate create/edit components — single form with mode
- DO NOT use `any` for form values — type the form group

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.2] — Acceptance criteria
- [Source: _bmad-output/planning-artifacts/architecture.md#Form Strategy] — Reactive Forms pattern
- [Source: _bmad-output/planning-artifacts/architecture.md#Error Handling] — Hybrid error strategy
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Toast] — Message format
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#ConfirmDialog] — Dialog specs

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

Implemented reactive form with create/edit modes, validation on blur/submit, 422 error mapping, delete with confirmation dialog, success/error toast messages. Added "Create" button to list view.

### File List

- `src/app/features/funding-programs/funding-program-form.component.ts` (modified - replaced stub)
- `src/app/features/funding-programs/funding-program-form.component.spec.ts` (new)
- `src/app/features/funding-programs/funding-program-detail.component.ts` (modified - wired delete)
- `src/app/features/funding-programs/funding-program-detail.component.spec.ts` (modified - added delete tests)
- `src/app/features/funding-programs/funding-program-list.component.ts` (modified - added Create button)

### Change Log

- 2026-03-04: Story implemented — form, CRUD flows, error handling, 9 new form tests
