# Story 1.1: Action Models CRUD with ACTEE Pattern

Status: review

## Story

As an operator (Alex/Sophie),
I want to create, view, edit, and delete Action Models through the admin interface,
So that I can manage the model-level configuration layer without using Postman.

## Acceptance Criteria

1. All ACTEE layer files exist with correct naming:
   - `domains/action-models/action-model.store.ts` (domain store with `signalStore`)
   - `domains/action-models/action-model.api.ts` (resources + `HttpMutationRequest`)
   - `domains/action-models/action-model.models.ts` (types from generated API types)
   - `domains/action-models/forms/action-model.form.ts` (FormGroup factory)
   - `features/action-models/action-model.store.ts` (feature store, `withComputed` only)
   - `features/action-models/action-model.facade.ts` (facade)
   - `features/action-models/ui/action-model-list.component.ts`
   - `features/action-models/ui/action-model-detail.component.ts`
   - `features/action-models/ui/action-model-form.component.ts`
   - `pages/action-models/action-models.page.ts` (layout only, zero logic)
   - `pages/action-models/action-models.routes.ts`
2. Domain store composition follows mandatory order: `withState` → `withProps` → `withFeature(withCursorPagination)` → `withMutations` → `withMethods`
3. Feature store contains ONLY `withComputed` — no mutations, no methods, no API calls
4. Facade exposes readonly data signals and intention methods; UI components inject only the facade
5. Per-mutation status signals exposed through facade (e.g., `createIsPending`, `updateIsPending`, `deleteIsPending`, `anyMutationPending`)
6. `app.routes.ts` updated: `/action-models` lazy-loads through `pages/action-models/action-models.routes.ts`
7. Paginated list displays correctly with cursor-based infinite scroll using `withCursorPagination`
8. Create form displays with fields: `name` (required), `description` (optional)
9. Edit form pre-populates current values using `effect()` pattern, validates, saves successfully
10. Delete shows confirmation dialog, deletes with success toast
11. API errors display human-readable error messages via toast (409 conflict, 422 validation, generic)
12. Domain store tests + facade tests written, all existing tests pass with zero regressions

## Tasks / Subtasks

- [x] Task 1: Create domain models (AC: #1)
  - [x] Create `src/app/domains/action-models/action-model.models.ts`
  - [x] Types: `ActionModel` = `ActionModelRead`, `ActionModelCreate`, `ActionModelUpdate` from `@app/core/api/generated/api-types`
  - [x] Note: `ActionModelRead` includes nested `funding_program: FundingProgramRead` and `action_theme: ActionThemeRead` — these are read-only relationships, not used in create/update
- [x] Task 2: Create domain API file (AC: #1)
  - [x] Create `src/app/domains/action-models/action-model.api.ts`
  - [x] List loader: `actionModelListLoader(http, params)` → `GET /action-models/` with cursor, limit, filters
  - [x] Detail loader: `loadActionModel(http, id)` → `GET /action-models/{id}`
  - [x] Mutation requests: `createActionModelRequest`, `updateActionModelRequest`, `deleteActionModelRequest`
  - [x] Note: API uses `PUT` for updates (not PATCH), matching FP/AT pattern
  - [x] Filters: `funding_program_id` is the only supported API filter
- [x] Task 3: Create domain form factory (AC: #1, #8)
  - [x] Create `src/app/domains/action-models/forms/action-model.form.ts`
  - [x] `createActionModelForm(fb: FormBuilder, initial?): FormGroup` with fields: `name` (required), `description` (optional), `funding_program_id` (required), `action_theme_id` (required)
  - [x] Note: `funding_program_id` and `action_theme_id` will be needed by Story 1.2 — include them now as required form controls but the dropdowns to populate them are Story 1.2's scope
- [x] Task 4: Create domain store (AC: #1, #2, #5)
  - [x] Create `src/app/domains/action-models/action-model.store.ts`
  - [x] Export as `ActionModelDomainStore`
  - [x] Compose: `withState` → `withProps(() => ({ _http: inject(HttpClient) }))` → `withFeature((store) => withCursorPagination({ loader: ... }))` → `withMutations` → `withMethods`
  - [x] `providedIn: 'root'`
  - [x] Include `selectedItem` state + `isLoadingDetail` boolean
  - [x] CRUD mutations: `createMutation` (concatOp), `updateMutation` (concatOp), `deleteMutation` (concatOp)
  - [x] `selectById`: `rxMethod<string>` with switchMap pattern (cancel previous)
  - [x] Use `patch()` helper for `patchState` with `as never` cast (NgRx Signals generic typing workaround)
- [x] Task 5: Create feature store (AC: #1, #3)
  - [x] Create `src/app/features/action-models/action-model.store.ts`
  - [x] Export as `ActionModelFeatureStore`
  - [x] `withComputed` ONLY — inject `ActionModelDomainStore`, project all signals
  - [x] Signals: `items`, `selectedItem`, `isLoading`, `isLoadingDetail`, `hasMore`, `error`, `isEmpty`, `totalLoaded`
- [x] Task 6: Create facade (AC: #1, #4, #5)
  - [x] Create `src/app/features/action-models/action-model.facade.ts`
  - [x] Export `ActionModelFacade` as `@Injectable({ providedIn: 'root' })`
  - [x] Inject `ActionModelDomainStore` + `ActionModelFeatureStore` + `ToastService` + `Router`
  - [x] Readonly data signals from feature store
  - [x] Per-mutation status signals: `createIsPending`, `updateIsPending`, `deleteIsPending`, `anyMutationPending`
  - [x] Intention methods: `load()`, `loadMore()`, `select(id)`, `clearSelection()`, `create(data)`, `update(id, data)`, `delete(id)`
  - [x] Mutation result handling: `result.status === 'success'` → toast + navigate, `'error'` → `handleMutationError()`
  - [x] `handleMutationError()`: handle 409 (conflict), 422 (validation), generic errors
- [x] Task 7: Migrate UI list component to features/ui/ (AC: #1, #7)
  - [x] Replace stub `features/action-models/action-model-list.component.ts` → move to `features/action-models/ui/action-model-list.component.ts`
  - [x] Inject `ActionModelFacade` (not domain store)
  - [x] Use `DataTableComponent` with columns: `name`, `description`, `created_at`
  - [x] `ngOnInit()` calls `facade.load()`
  - [x] `onRowClick()` navigates to `/action-models/:id`
  - [x] `onLoadMore()` calls `facade.loadMore()`
  - [x] Optional: `funding_program_id` filter dropdown (API supports it)
  - [x] "Create Action Model" button navigates to `/action-models/new`
- [x] Task 8: Create detail component (AC: #1)
  - [x] Create `src/app/features/action-models/ui/action-model-detail.component.ts`
  - [x] Inject `ActionModelFacade`, `ActivatedRoute`, `Router`, `ConfirmDialogService`
  - [x] `ngOnInit()` extracts `:id` param, calls `facade.select(id)`
  - [x] MetadataGrid fields: `name`, `description`, `funding_program` (display nested name), `action_theme` (display nested name), `created_at`, `updated_at`
  - [x] Edit button navigates to `/action-models/:id/edit`
  - [x] Delete button with confirmation dialog → `facade.delete(id)`
  - [x] Loading skeleton while `isLoadingDetail()`
  - [x] Back to list link
- [x] Task 9: Create form component (AC: #1, #8, #9)
  - [x] Create `src/app/features/action-models/ui/action-model-form.component.ts`
  - [x] Inject `ActionModelFacade`, `FormBuilder`, `ActivatedRoute`, `Router`, `ElementRef`
  - [x] Use `createActionModelForm(fb)` from domain forms
  - [x] Edit mode: `effect()` patches form when `selectedItem` loads (with `formPatched` guard)
  - [x] Submit: `facade.create(data)` or `facade.update(id, data)`
  - [x] `submitting` computed from `facade.createIsPending() || facade.updateIsPending()`
  - [x] `showError(field)` validation display on blur/touched
  - [x] `markAllAsTouched()` + focus first invalid on submit
  - [x] Note: FP/AT dropdowns are plain `<select>` elements for now — Story 1.2 will populate them with real data
- [x] Task 10: Create page + routes and update app.routes.ts (AC: #1, #6)
  - [x] Create `src/app/pages/action-models/action-models.page.ts` — `<router-outlet />` only
  - [x] Create `src/app/pages/action-models/action-models.routes.ts` — 4 routes: list, new, :id, :id/edit
  - [x] Update `src/app/app.routes.ts`: change action-models from `features/action-models/action-model.routes` to `pages/action-models/action-models.routes`
  - [x] Delete old stub: `features/action-models/action-model-list.component.ts` and `features/action-models/action-model.routes.ts`
- [x] Task 11: Write unit tests (AC: #12)
  - [x] Create `src/app/domains/action-models/action-model.store.spec.ts`
  - [x] Create `src/app/features/action-models/action-model.facade.spec.ts`
  - [x] Domain store tests: initial state, load(), loadMore(), selectById(), clearSelection(), cursor pagination
  - [x] Facade tests: load(), create() with success/error, update() with success/error, delete() with success/error, toast calls, navigation
  - [x] Use `HttpTestingController` + `provideHttpClientTesting()` pattern
  - [x] Mock `PaginatedResponse<ActionModel>` with `{ data: [...], pagination: { ... } }` structure
  - [x] Run `npx vitest run` — zero regressions
- [x] Task 12: Verify full functionality (AC: #7–#11)
  - [x] Run `ng build` — zero errors
  - [x] Verify list with infinite scroll
  - [x] Verify create form with validation
  - [x] Verify edit form pre-population
  - [x] Verify delete confirmation
  - [x] Verify API error toast display

## Dev Notes

### Canonical Template

Follow Story 0.3 (Funding Programs migration) as the canonical ACTEE template. Every file in this story mirrors the FP pattern with Action Model-specific names and types.

### Known Workarounds (from Epic 0 Retro)

1. **`as never` casts for patchState:** NgRx Signals v21 generic typing requires `patchState(store, state as never)` workaround. Use the `patch()` helper:
```typescript
function patch(store: WritableStateSource<object>, state: Record<string, unknown>): void {
  patchState(store, state as never);
}
```

2. **`withProps` for injection context:** `inject(HttpClient)` inside `withCursorPagination` loader fails when running inside rxMethod's switchMap (outside injection context). Must use:
```typescript
withProps(() => ({ _http: inject(HttpClient) })),
withFeature((store) => withCursorPagination<ActionModel>({
  loader: (params) => actionModelListLoader(store._http, params),
})),
```

3. **Vitest/zone.js sync test pattern:** `fakeAsync`/`tick` don't work in Vitest. Use synchronous `of()` observables and `HttpTestingController` instead.

### API Types (Generated)

From `src/app/core/api/generated/api-types.ts`:

```typescript
// ActionModelRead — full model with nested relationships
{
  id: string;              // uuid
  name: string;
  description?: string | null;
  created_at: string;      // date-time
  updated_at: string;      // date-time
  funding_program_id: string;  // uuid FK
  action_theme_id: string;     // uuid FK
  funding_program: FundingProgramRead;  // nested object (read-only)
  action_theme: ActionThemeRead;        // nested object (read-only)
  indicator_models?: IndicatorModelWithAssociation[];  // Epic 3 scope — ignore for now
}

// ActionModelCreate
{ name: string; description?: string | null; funding_program_id: string; action_theme_id: string; }

// ActionModelUpdate — all optional
{ name?: string | null; description?: string | null; funding_program_id?: string | null; action_theme_id?: string | null; }
```

**API note:** `ActionModelCreate` also accepts `indicator_model_ids` and `indicator_model_associations` — these are Epic 3 scope. Do NOT include them in the form.

### API Endpoints

- `GET /action-models/` — list with `?cursor=X&limit=N&funding_program_id=Y`
- `GET /action-models/{action_model_id}` — detail
- `POST /action-models/` — create
- `PUT /action-models/{action_model_id}` — update
- `DELETE /action-models/{action_model_id}` — delete

### Pagination Response Structure

The API returns `{ data: T[], pagination: PaginationMeta }` where:
```typescript
interface PaginationMeta {
  total_count: number;
  page_size: number;
  has_next_page: boolean;
  has_previous_page: boolean;
  cursors: { start_cursor: string | null; end_cursor: string | null };
  _links: { self: string; next: string | null; prev: string | null; first: string };
}
```

The `withCursorPagination` feature maps this: `cursor` = `pagination.cursors.end_cursor`, `hasMore` = `pagination.has_next_page`.

### Existing Files to Handle

| Current Path | Action |
|-------------|--------|
| `features/action-models/action-model-list.component.ts` | Delete (stub) |
| `features/action-models/action-model.routes.ts` | Delete (stub) |
| `features/action-models/ui/.gitkeep` | Delete (replaced by real files) |
| `domains/action-models/forms/.gitkeep` | Delete (replaced by form factory) |
| `pages/action-models/.gitkeep` | Delete (replaced by page + routes) |

### Form — FP/AT Selector Fields

The form factory includes `funding_program_id` and `action_theme_id` as required `FormControl`s. For this story, they render as plain `<select>` or `<input>` fields. Story 1.2 will populate them with real dropdown options from the FP/AT domain stores. The form factory is ready — only the UI rendering changes in 1.2.

### Import Path Aliases

Use these configured TypeScript path aliases:
- `@app/` → `src/app/`
- `@domains/` → `src/app/domains/`

### Anti-Patterns to Avoid

- Do NOT let UI components import `ActionModelDomainStore` directly — facade only
- Do NOT put `withMutations` or `withMethods` in the feature store — computed only
- Do NOT define forms inline in the component — use domain form factory
- Do NOT keep `subscribe()` in components — use signals
- Do NOT include `indicator_model_ids` or `indicator_model_associations` in the form — that's Epic 3

### Project Structure Notes

- Follows identical ACTEE structure as `domains/funding-programs/` and `features/funding-programs/`
- Route change in `app.routes.ts` switches from `features/` to `pages/` lazy-load
- Sidebar navigation already wired (`/action-models` route in `app-layout.component.ts`)

### References

- [Source: src/app/domains/funding-programs/ — canonical domain pattern]
- [Source: src/app/features/funding-programs/ — canonical feature + facade pattern]
- [Source: src/app/features/funding-programs/ui/ — canonical UI component pattern]
- [Source: src/app/pages/funding-programs/ — canonical page + routes pattern]
- [Source: src/app/core/api/generated/api-types.ts:1879-1955 — ActionModel types]
- [Source: src/app/domains/shared/with-cursor-pagination.ts — pagination feature]
- [Source: _bmad-output/implementation-artifacts/0-3-migrate-funding-programs-to-actee-pattern-pilot.md — Story 0.3 template]
- [Source: _bmad-output/implementation-artifacts/epic-0-retro-2026-03-04.md — workarounds & learnings]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Fixed mock data: ActionThemeRead requires `unique_id` field (discovered during test compilation)

### Completion Notes List

- All 12 ACTEE layer files created following canonical FP pattern
- Domain: models, API, form factory, store with cursor pagination + CRUD mutations
- Feature: store (withComputed only), facade (readonly signals + intention methods + error handling)
- UI: list (DataTable + FP filter), detail (MetadataGrid + delete confirmation), form (reactive forms + effect() edit patching)
- Page + routes: lazy-loaded through pages/ directory
- Old stubs and .gitkeep files deleted
- app.routes.ts updated to pages/ lazy-load
- 20 test files pass, 141 tests, zero regressions
- ng build passes with zero errors

### Change Log

- 2026-03-04: Story 1.1 implemented — full ACTEE CRUD for Action Models

### File List

- src/app/domains/action-models/action-model.models.ts (new)
- src/app/domains/action-models/action-model.api.ts (new)
- src/app/domains/action-models/action-model.store.ts (new)
- src/app/domains/action-models/action-model.store.spec.ts (new)
- src/app/domains/action-models/forms/action-model.form.ts (new)
- src/app/features/action-models/action-model.store.ts (new)
- src/app/features/action-models/action-model.facade.ts (new)
- src/app/features/action-models/action-model.facade.spec.ts (new)
- src/app/features/action-models/ui/action-model-list.component.ts (new)
- src/app/features/action-models/ui/action-model-detail.component.ts (new)
- src/app/features/action-models/ui/action-model-form.component.ts (new)
- src/app/pages/action-models/action-models.page.ts (new)
- src/app/pages/action-models/action-models.routes.ts (new)
- src/app/app.routes.ts (modified)
- src/app/features/action-models/action-model-list.component.ts (deleted)
- src/app/features/action-models/action-model.routes.ts (deleted)
- src/app/features/action-models/ui/.gitkeep (deleted)
- src/app/domains/action-models/forms/.gitkeep (deleted)
- src/app/pages/action-models/.gitkeep (deleted)
