# Story 3.1: Indicator Models CRUD with ACTEE Pattern

Status: ready-for-dev

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

## Tasks / Subtasks

- [ ] Task 1: Domain layer (AC: #1)
  - [ ] Create `domains/indicator-models/indicator-model.models.ts` — type aliases from generated API types
  - [ ] Create `domains/indicator-models/indicator-model.api.ts` — list loader, detail loader, CRUD mutation functions
  - [ ] Create `domains/indicator-models/indicator-model.store.ts` — signalStore with ACTEE composition order
  - [ ] Create `domains/indicator-models/indicator-model.store.spec.ts` — pagination, selectById, clearSelection tests
  - [ ] Create `domains/indicator-models/forms/indicator-model.form.ts` — FormGroup factory function
- [ ] Task 2: Feature layer (AC: #1)
  - [ ] Create `features/indicator-models/indicator-model.store.ts` — withComputed only, project domain signals
  - [ ] Create `features/indicator-models/indicator-model.facade.ts` — signals + intention methods + toast/nav orchestration
  - [ ] Create `features/indicator-models/indicator-model.facade.spec.ts` — load, select, create, update, delete tests
- [ ] Task 3: UI components (AC: #2, #3, #4, #5, #6)
  - [ ] Create `features/indicator-models/ui/indicator-model-list.component.ts` — DataTable with columns, empty state, infinite scroll
  - [ ] Create `features/indicator-models/ui/indicator-model-detail.component.ts` — MetadataGrid, skeleton loading, error state, delete button
  - [ ] Create `features/indicator-models/ui/indicator-model-form.component.ts` — create/edit mode, type selector, effect-based form patching
- [ ] Task 4: Page & routing (AC: #2)
  - [ ] Create `pages/indicator-models/indicator-models.page.ts` — RouterOutlet wrapper
  - [ ] Create `pages/indicator-models/indicator-models.routes.ts` — child routes: '', 'new', ':id', ':id/edit'
  - [ ] Register lazy-loaded route in `app.routes.ts` for `/indicator-models`
  - [ ] Add "Indicator Models" nav item to sidebar
- [ ] Task 5: Tests & verification (AC: #7, #8)
  - [ ] Run full test suite — zero regressions
  - [ ] Verify all CRUD operations work against the API

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

### Debug Log References

### Completion Notes List

### File List
