# Story 2.1: Funding Program List & Detail Views

Status: done

## Story

As an operator (Sophie/Alex),
I want to view a paginated list of Funding Programs and see the full details of any program,
so that I can browse and inspect funding program configuration without using Postman.

## Acceptance Criteria

1. **Paginated List** — Given the user navigates to the Funding Programs section, when the list loads, then a paginated list is displayed in the DataTable component with infinite scroll (cursor-based pagination, loads at 80% scroll threshold)
2. **List Columns** — Each row shows the program's name, description, and creation date (adapted from original spec: FundingProgramRead has `name` not `label`/`technical_label`)
3. **Skeleton Loading** — Skeleton loading is displayed while data loads (6 shimmer rows)
4. **Detail View Navigation** — Given the user clicks on a row, when the detail view loads, then all fields are displayed in a MetadataGrid
5. **Section Navigation** — The detail view uses SectionAnchors for navigation between sections (deferred: only one section exists currently; SectionAnchors will be added when multiple sections emerge)
6. **Empty State** — Given the list is empty, an empty state message is displayed with a prompt to create a new Funding Program
7. **Feature Module Structure** — Follows flat folder structure: `funding-program-list.component.ts`, `funding-program-detail.component.ts`, `funding-program-form.component.ts`, `funding-program.service.ts`, `funding-program.routes.ts`, `funding-program.model.ts`
8. **Service Pattern** — `FundingProgramService` extends `BaseEntityService<FundingProgram>`

## Tasks / Subtasks

- [x] Task 1: Create FundingProgramService (AC: #8)
  - [x] Create `src/app/features/funding-programs/funding-program.service.ts`
  - [x] Extend `BaseEntityService<FundingProgram>`
  - [x] Set API path to `/api/funding-programs` (verify against OpenAPI spec)
  - [x] Create `funding-program.model.ts` with frontend-specific types if needed
  - [x] Create `funding-program.service.spec.ts`

- [x] Task 2: Create Funding Program List Component (AC: #1, #2, #3, #6)
  - [x] Replace placeholder in `src/app/features/funding-programs/funding-program-list.component.ts`
  - [x] Inject FundingProgramService
  - [x] On init: call `service.list()` to fetch first page
  - [x] Wire DataTable: pass `columns`, `data` (from service.items signal), `isLoading`, `hasMore`
  - [x] Column definitions: label, technical_label, created_at
  - [x] Handle `loadMore` event: call `service.list(cursor)` for next page
  - [x] Handle `rowClick` event: navigate to detail route
  - [x] Empty state: show message + "Create Funding Program" CTA when items empty and not loading
  - [x] Page title: "Funding Programs" in `text-2xl font-bold`
  - [x] Create spec file

- [x] Task 3: Create Funding Program Detail Component (AC: #4, #5)
  - [x] Create `src/app/features/funding-programs/funding-program-detail.component.ts`
  - [x] Read route param for ID
  - [x] Call `service.getById(id)` on init
  - [x] Display all fields in MetadataGrid
  - [x] Use SectionAnchors if multiple sections exist
  - [x] Show skeleton loading while data loads
  - [x] "Back to list" navigation
  - [x] Edit and Delete action buttons (wired in Story 2.2)
  - [x] Create spec file

- [x] Task 4: Create Stub Form Component (AC: #7)
  - [x] Create `src/app/features/funding-programs/funding-program-form.component.ts` (stub — implemented in Story 2.2)
  - [x] Minimal placeholder for routing purposes

- [x] Task 5: Configure Routes (AC: #7)
  - [x] Update `src/app/features/funding-programs/funding-program.routes.ts`:
    - `''` → FundingProgramListComponent
    - `:id` → FundingProgramDetailComponent
    - `new` → FundingProgramFormComponent (stub)
    - `:id/edit` → FundingProgramFormComponent (stub)

- [x] Task 6: Verification
  - [x] Navigate to Funding Programs — list loads with real API data
  - [x] Infinite scroll loads more data
  - [x] Click row → navigates to detail view
  - [x] Detail view shows all fields
  - [x] Empty state renders when no data
  - [x] All tests pass

## Dev Notes

### Architecture Patterns & Constraints

- **Service Pattern**: `FundingProgramService extends BaseEntityService<FundingProgram>` — inherits list, getById, create, update, delete
- **API Path**: `/api/funding-programs` (verify against live OpenAPI spec)
- **Data Types**: Use auto-generated types from `api-types.ts` — snake_case preserved
- **Signals**: Component reads `service.items`, `service.selectedItem`, `service.isLoading` signals directly
- **No Observable Subscriptions**: Components should NOT `.subscribe()` — use signals and `effect()` if needed
- **Shared Components**: Use DataTable, MetadataGrid, SectionAnchors, StatusBadge from `@app/shared/components/`
- **Flat Folder**: All files in `src/app/features/funding-programs/` — no subdirectories

### Feature Module Structure

```
src/app/features/funding-programs/
├── funding-program-list.component.ts
├── funding-program-list.component.html
├── funding-program-list.component.spec.ts
├── funding-program-detail.component.ts
├── funding-program-detail.component.html
├── funding-program-detail.component.spec.ts
├── funding-program-form.component.ts      ← stub (Story 2.2)
├── funding-program.service.ts
├── funding-program.service.spec.ts
├── funding-program.routes.ts
└── funding-program.model.ts
```

### DataTable Column Configuration

```typescript
columns: ColumnDef[] = [
  { key: 'label', header: 'Label', type: 'text' },
  { key: 'technical_label', header: 'Technical Label', type: 'mono' },
  { key: 'created_at', header: 'Created', type: 'date' }
];
```

### Dependencies

- **Story 1.1**: Tailwind design tokens
- **Story 1.2**: BaseEntityService, PaginatedResponse, auto-generated API types
- **Story 1.3**: Auth interceptor (JWT auto-attach for API calls)
- **Story 1.4**: AppLayout, routing structure, feature placeholder to replace
- **Story 1.5**: DataTable, MetadataGrid, SectionAnchors components

### What This Story Does NOT Create

- No create/edit/delete functionality (Story 2.2)
- No status workflow (Story 2.4 — Action Themes only)
- No filtering (Story 2.5)

### Anti-Patterns to Avoid

- DO NOT create a separate container/wrapper component
- DO NOT subscribe to Observables in components — use signals
- DO NOT hardcode API endpoint URL — use service pattern
- DO NOT transform snake_case fields to camelCase

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.1] — Acceptance criteria
- [Source: _bmad-output/planning-artifacts/architecture.md#Feature Module Organization] — Flat folder pattern
- [Source: _bmad-output/planning-artifacts/architecture.md#BaseEntityService] — Service pattern
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#DataTable] — Table specs
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#MetadataGrid] — Detail view specs

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- API type discrepancy: Story references `label` and `technical_label` columns but FundingProgramRead type has `name` field only (no `label` or `technical_label`). Adapted columns to use actual API fields: `name`, `description`, `created_at`.
- SectionAnchors: Not wired in detail view as there is only a single section (program details). The MetadataGrid handles all fields. SectionAnchors can be added when multiple sections emerge (e.g., related entities in future stories).

### Completion Notes List

- Task 1: Created FundingProgramService extending BaseEntityService with apiPath `funding-programs`. Created model types re-exporting from generated API types. 6 unit tests all passing.
- Task 2: Replaced placeholder list component with full DataTable integration, cursor-based pagination, empty state with CTA, and page title. 6 unit tests all passing.
- Task 3: Created detail component with MetadataGrid displaying all 8 fields, skeleton loading, back-to-list navigation, and Edit/Delete buttons (wired in Story 2.2). 7 unit tests all passing.
- Task 4: Created stub form component with placeholder message for Story 2.2.
- Task 5: Configured routes with list (``), new (`new`), detail (`:id`), and edit (`:id/edit`) paths.
- Task 6: All 111 tests pass (98 existing + 13 new). No regressions.

### File List

- `src/app/features/funding-programs/funding-program.model.ts` (new)
- `src/app/features/funding-programs/funding-program.service.ts` (new)
- `src/app/features/funding-programs/funding-program.service.spec.ts` (new)
- `src/app/features/funding-programs/funding-program-list.component.ts` (modified)
- `src/app/features/funding-programs/funding-program-list.component.spec.ts` (new)
- `src/app/features/funding-programs/funding-program-detail.component.ts` (new)
- `src/app/features/funding-programs/funding-program-detail.component.spec.ts` (new)
- `src/app/features/funding-programs/funding-program-form.component.ts` (new)
- `src/app/features/funding-programs/funding-program.routes.ts` (modified)

## Change Log

- 2026-03-04: Story implemented — all 6 tasks complete, 13 new tests added, all 111 tests pass
