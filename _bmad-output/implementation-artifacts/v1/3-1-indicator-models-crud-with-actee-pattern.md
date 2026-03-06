# Story 3.1: Indicator Models CRUD with ACTEE Pattern

Status: done

## Story

As an operator (Sophie),
I want to create, view, edit, and delete Indicator Models through the admin interface,
So that I can manage the indicator definitions that drive the entire configuration system.

## Acceptance Criteria

1. Full ACTEE module structure exists for indicator-models (domain, feature, page layers)
2. Paginated list view at `/indicator-models` with cursor-based infinite scroll via DataTable
3. Create form at `/indicator-models/new` with fields: name (required), technical_label (required), description, type (required, select: "text"|"number"), unit
4. Detail view at `/indicator-models/:id` showing all metadata fields
5. Edit form at `/indicator-models/:id/edit` pre-populated with existing values
6. Delete with ConfirmDialog confirmation and success/error toast feedback
7. All mutations show toast feedback (success + error with HTTP status mapping)
8. Domain store spec and facade spec pass with standard test coverage

## API Limitation Protocol

If any acceptance criterion cannot be implemented due to API limitations (missing endpoints, unsupported fields, schema gaps), the dev agent **MUST**:
1. Document the gap in `_bmad-output/api-observations.md` under the Epic 3 section
2. Include: **Observation** (what's missing), **Impact** (which AC/FR is affected), and **Suggestion** (what the API team should add)
3. Implement what IS possible and skip the blocked AC with a code comment explaining the gap
4. Note the limitation in the Dev Agent Record / Completion Notes at the bottom of this file

## Tasks / Subtasks

- [x] Task 1: Domain layer (AC: #1)
  - [x] Create `domains/indicator-models/indicator-model.models.ts` — type aliases from generated API types
  - [x] Create `domains/indicator-models/indicator-model.api.ts` — list loader, detail loader, CRUD mutation functions
  - [x] Create `domains/indicator-models/indicator-model.store.ts` — signalStore with ACTEE composition order
  - [x] Create `domains/indicator-models/indicator-model.store.spec.ts` — pagination, selectById, clearSelection tests
  - [x] Create `domains/indicator-models/forms/indicator-model.form.ts` — FormGroup factory function
- [x] Task 2: Feature layer (AC: #1)
  - [x] Create `features/indicator-models/indicator-model.store.ts` — withComputed only, project domain signals
  - [x] Create `features/indicator-models/indicator-model.facade.ts` — signals + intention methods + toast/nav orchestration
  - [x] Create `features/indicator-models/indicator-model.facade.spec.ts` — load, select, create, update, delete tests
- [x] Task 3: UI components (AC: #2, #3, #4, #5, #6)
  - [x] Create `features/indicator-models/ui/indicator-model-list.component.ts` — DataTable with columns, empty state, infinite scroll
  - [x] Create `features/indicator-models/ui/indicator-model-detail.component.ts` — MetadataGrid, skeleton loading, error state, delete button
  - [x] Create `features/indicator-models/ui/indicator-model-form.component.ts` — create/edit mode, type selector, effect-based form patching
- [x] Task 4: Page & routing (AC: #2)
  - [x] Create `pages/indicator-models/indicator-models.page.ts` — RouterOutlet wrapper (pre-existing)
  - [x] Create `pages/indicator-models/indicator-models.routes.ts` — child routes: '', 'new', ':id', ':id/edit'
  - [x] Register lazy-loaded route in `app.routes.ts` for `/indicator-models` (pre-existing)
  - [x] Add "Indicator Models" nav item to sidebar (pre-existing)
- [x] Task 5: Tests & verification (AC: #7, #8)
  - [x] Run full test suite — zero regressions (259/259 pass)
  - [x] Verify all CRUD operations work against the API

## Dev Notes

### API Schema (from `core/api/generated/api-types.ts`)

```typescript
// IndicatorModelRead — GET response
{ id: string; name: string; technical_label: string; description?: string | null;
  type: "text" | "number"; unit?: string | null; created_at: string; updated_at: string; }

// IndicatorModelCreate — POST body
{ name: string; technical_label: string; description?: string | null;
  type: "text" | "number"; unit?: string | null;
  action_model_ids?: string[] | null; action_model_associations?: ActionModelAssociationInput[] | null; }

// IndicatorModelUpdate — PUT body (all optional)
{ name?: string | null; technical_label?: string | null; description?: string | null;
  type?: "text" | "number" | null; unit?: string | null;
  action_model_ids?: string[] | null; action_model_associations?: ActionModelAssociationInput[] | null; }
```

**API Endpoints:**
- `GET /indicator-models/` — list (query: cursor, limit, action_model_id, type)
- `POST /indicator-models/` — create (returns 201)
- `GET /indicator-models/{indicator_model_id}` — detail
- `PUT /indicator-models/{indicator_model_id}` — update
- `DELETE /indicator-models/{indicator_model_id}` — delete (returns 204)

**API filter params for list:** `action_model_id` (uuid), `type` ("text"|"number")

### Architecture — ACTEE Mandatory Patterns

**Domain store composition order (CRITICAL — any deviation breaks signal initialization):**
1. `withState` — selectedItem, isLoadingDetail, detailError
2. `withProps` — inject HttpClient
3. `withFeature(withCursorPagination)` — items, cursor, hasMore, isLoading, error, load/loadMore/refresh/reset
4. `withMutations` — createMutation, updateMutation, deleteMutation (all `concatOp`)
5. `withMethods` — selectById (rxMethod with switchMap), clearSelection

**Feature store:** `withComputed` ONLY — project typed signals from domain store. No mutations, no methods.

**Facade pattern:**
- Readonly signals from feature store
- Per-mutation status signals: `createIsPending`, `updateIsPending`, `deleteIsPending`, `anyMutationPending`
- Intention methods delegate to domain store
- CRUD methods are `async` — await mutation result, check status, toast + navigate
- Error handling: 409→conflict, 422→validation, else→error.detail/message

**Component rules:**
- Inject facade only (never domain store)
- Template binds to facade signals
- No `subscribe()`, no `async` pipe
- Form patching via `effect()` with `formPatched` guard flag

### Key Patterns to Follow (from Epic 0-2)

**Models file** — 3-5 lines, type aliases only:
```typescript
import { components } from '@app/core/api/generated/api-types';
export type IndicatorModel = components['schemas']['IndicatorModelRead'];
export type IndicatorModelCreate = components['schemas']['IndicatorModelCreate'];
export type IndicatorModelUpdate = components['schemas']['IndicatorModelUpdate'];
export type IndicatorModelType = components['schemas']['IndicatorModelType'];
```

**API file** — pure functions, no `inject()`:
- Loaders return `Observable<PaginatedResponse<T>>`
- Mutations return config objects: `{ url, method, body }`
- `const BASE_URL = \`${environment.apiBaseUrl}/indicator-models/\``

**Form factory** — pure function with `FormBuilder` + optional initial:
- Fields: name (required), technical_label (required), description (optional), type (required), unit (optional)
- Action model associations NOT included in basic CRUD form (deferred to Story 3.4)

**DataTable columns for list:**
- name, technical_label, type (with badge), unit, created_at

**Detail MetadataGrid fields:**
- name, technical_label, description, type, unit, created_at, updated_at

**Delete returns 204** — handle empty response body in mutation handler.

### Project Structure Notes

Files to create:
```
src/app/domains/indicator-models/
├── indicator-model.models.ts
├── indicator-model.api.ts
├── indicator-model.store.ts
├── indicator-model.store.spec.ts
└── forms/
    └── indicator-model.form.ts

src/app/features/indicator-models/
├── indicator-model.store.ts
├── indicator-model.facade.ts
├── indicator-model.facade.spec.ts
└── ui/
    ├── indicator-model-list.component.ts
    ├── indicator-model-detail.component.ts
    └── indicator-model-form.component.ts

src/app/pages/indicator-models/
├── indicator-models.page.ts
└── indicator-models.routes.ts
```

Files to modify:
- `src/app/app.routes.ts` — add lazy-loaded indicator-models route
- `src/app/shared/components/sidebar/` (or equivalent) — add nav item

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.1]
- [Source: _bmad-output/planning-artifacts/architecture.md#ACTEE Pattern]
- [Source: src/app/core/api/generated/api-types.ts#IndicatorModelRead (line 2986)]
- [Source: src/app/domains/shared/with-cursor-pagination.ts]
- [Source: src/app/domains/action-models/ — reference ACTEE implementation]
- [Source: src/app/features/communities/ — reference CRUD component patterns]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- Tests run via `ng test --no-watch`: 259/259 pass, 0 regressions

### Completion Notes List
- Full ACTEE stack implemented following action-models reference pattern
- Domain layer: models (4 type aliases), API (5 pure functions), store (signalStore with correct composition order), spec (10 tests), form factory
- Feature layer: store (withComputed projections, per-mutation status signals), facade (CRUD with toast/nav orchestration, error mapping), spec (7 tests)
- UI layer: list (DataTable with columns: name, technical_label, type, unit, created_at), detail (MetadataGrid with 7 fields, skeleton loading, delete with ConfirmDialog), form (create/edit with type selector, effect-based form patching)
- Page wrapper and lazy-loaded route were pre-existing stubs; routes updated to include new/detail/edit children
- Sidebar nav item was pre-existing
- Removed old stub list component from wrong path (features/indicator-models/indicator-model-list.component.ts)
- No API limitations encountered — all endpoints and schemas match story requirements

### Change Log
- 2026-03-04: Story 3.1 implemented — full Indicator Models CRUD with ACTEE pattern

### File List
- src/app/domains/indicator-models/indicator-model.models.ts (new)
- src/app/domains/indicator-models/indicator-model.api.ts (new)
- src/app/domains/indicator-models/indicator-model.store.ts (new)
- src/app/domains/indicator-models/indicator-model.store.spec.ts (new)
- src/app/domains/indicator-models/forms/indicator-model.form.ts (new)
- src/app/features/indicator-models/indicator-model.store.ts (new)
- src/app/features/indicator-models/indicator-model.facade.ts (new)
- src/app/features/indicator-models/indicator-model.facade.spec.ts (new)
- src/app/features/indicator-models/ui/indicator-model-list.component.ts (new, replaces old stub)
- src/app/features/indicator-models/ui/indicator-model-detail.component.ts (new)
- src/app/features/indicator-models/ui/indicator-model-form.component.ts (new)
- src/app/pages/indicator-models/indicator-models.routes.ts (modified — added child routes)
- src/app/features/indicator-models/indicator-model-list.component.ts (deleted — old stub)
