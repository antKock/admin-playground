# Story 2.3: Action Theme List, Detail, Create, Edit & Delete

Status: ready-for-dev

## Story

As an operator (Sophie/Alex),
I want full CRUD operations on Action Themes with the same patterns as Funding Programs,
so that I can manage action theme configuration consistently.

## Acceptance Criteria

1. **Paginated List** — Given the user navigates to the Action Themes section, when the list loads, then Action Themes are displayed in a paginated DataTable with infinite scroll
2. **List Columns** — Each row shows label, technical label, status badge (via StatusBadge component), and creation date
3. **Status Display** — The StatusBadge component shows the current status: draft (neutral), published (green), disabled (gray)
4. **Detail View** — Given the user views an Action Theme detail, all fields are displayed in a MetadataGrid with the current status prominently displayed via StatusBadge
5. **CRUD Operations** — Given the user creates, edits, or deletes an Action Theme, the same form, validation, error handling, and toast patterns from Funding Programs are followed
6. **Service Pattern** — `ActionThemeService` extends `BaseEntityService<ActionTheme>`
7. **Module Structure** — The feature module follows the identical flat folder structure as Funding Programs

## Tasks / Subtasks

- [ ] Task 1: Create ActionThemeService (AC: #6)
  - [ ] Create `src/app/features/action-themes/action-theme.service.ts`
  - [ ] Extend `BaseEntityService<ActionTheme>`
  - [ ] Set API path to `/api/action-themes` (verify against OpenAPI spec)
  - [ ] Add status workflow methods (used in Story 2.4): `publish(id)`, `disable(id)`, `activate(id)`, `duplicate(id)` — calling respective endpoints
  - [ ] Create `action-theme.model.ts` for frontend-specific types if needed
  - [ ] Create spec file

- [ ] Task 2: Create Action Theme List Component (AC: #1, #2, #3)
  - [ ] Replace placeholder in `src/app/features/action-themes/action-theme-list.component.ts`
  - [ ] Wire DataTable with columns: label, technical_label, status (using StatusBadge), created_at
  - [ ] StatusBadge renders in the status column for each row
  - [ ] Infinite scroll pagination, skeleton loading
  - [ ] "Create Action Theme" button (top-right)
  - [ ] Row click navigates to detail view
  - [ ] Empty state message
  - [ ] Create spec file

- [ ] Task 3: Create Action Theme Detail Component (AC: #4)
  - [ ] Create `src/app/features/action-themes/action-theme-detail.component.ts`
  - [ ] Display all fields in MetadataGrid
  - [ ] Prominent StatusBadge showing current status
  - [ ] SectionAnchors for navigation
  - [ ] Edit, Delete buttons (same patterns as Funding Programs)
  - [ ] Placeholder area for status workflow actions (Story 2.4)
  - [ ] Create spec file

- [ ] Task 4: Create Action Theme Form Component (AC: #5)
  - [ ] Create `src/app/features/action-themes/action-theme-form.component.ts`
  - [ ] Same Reactive Forms patterns as Funding Program form
  - [ ] Mode: create | edit (from route)
  - [ ] Validation on blur + submit, 422 error mapping
  - [ ] Success/error toast patterns identical to Funding Programs
  - [ ] Create spec file

- [ ] Task 5: Configure Routes (AC: #7)
  - [ ] Update `src/app/features/action-themes/action-theme.routes.ts`:
    - `''` → ActionThemeListComponent
    - `new` → ActionThemeFormComponent
    - `:id` → ActionThemeDetailComponent
    - `:id/edit` → ActionThemeFormComponent

- [ ] Task 6: Verification
  - [ ] List, detail, create, edit, delete all work
  - [ ] StatusBadge displays correctly for all statuses
  - [ ] Patterns are consistent with Funding Programs
  - [ ] All tests pass

## Dev Notes

### Architecture Patterns & Constraints

- **IDENTICAL PATTERNS to Funding Programs** — Same service extension, same form patterns, same error handling, same toast messages. Consistency across entities is a first-class requirement.
- **StatusBadge Integration** — Status column in list + prominent display in detail
- **ActionThemeService extras** — Has additional methods for status workflow (publish, disable, activate, duplicate) used in Story 2.4
- **API Types**: Use auto-generated types from `api-types.ts` — snake_case preserved

### ActionThemeService Additional Methods (for Story 2.4)

```typescript
// These are added now but wired to UI in Story 2.4
publish(id: string): Observable<ActionTheme>   // POST /api/action-themes/:id/publish
disable(id: string): Observable<ActionTheme>   // POST /api/action-themes/:id/disable
activate(id: string): Observable<ActionTheme>  // POST /api/action-themes/:id/activate
duplicate(id: string): Observable<ActionTheme> // POST /api/action-themes/:id/duplicate
```

### Status Color Mapping

| Status | StatusBadge Color | Hex |
|--------|------------------|-----|
| draft | Neutral/white | default |
| published | Green | #2e8b7a |
| disabled | Gray | #c8c8c8 |

### Files Created by This Story

```
src/app/features/action-themes/
├── action-theme-list.component.ts     ← replace placeholder
├── action-theme-list.component.html
├── action-theme-list.component.spec.ts
├── action-theme-detail.component.ts
├── action-theme-detail.component.html
├── action-theme-detail.component.spec.ts
├── action-theme-form.component.ts
├── action-theme-form.component.html
├── action-theme-form.component.spec.ts
├── action-theme.service.ts
├── action-theme.service.spec.ts
├── action-theme.routes.ts             ← update from placeholder
└── action-theme.model.ts
```

### Dependencies

- **Story 1.2**: BaseEntityService, API types
- **Story 1.3**: Auth interceptor
- **Story 1.5**: DataTable, StatusBadge, MetadataGrid, SectionAnchors, Toast, ConfirmDialog
- **Story 2.1/2.2**: Patterns established for Funding Programs (follow same approach)

### What This Story Does NOT Create

- No status workflow UI (Story 2.4)
- No duplication UI (Story 2.4)
- No list filtering (Story 2.5)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.3] — Acceptance criteria
- [Source: _bmad-output/planning-artifacts/architecture.md#Entity-Specific Services] — ActionThemeService extensions
- [Source: _bmad-output/planning-artifacts/architecture.md#Feature Module Organization] — Flat folder pattern
- [Source: _bmad-output/api-observations.md] — Status workflow endpoints for Action Themes

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
