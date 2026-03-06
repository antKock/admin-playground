# Story 1.4: Folder Models CRUD with ACTEE Pattern

Status: done

## Story

As an operator (Alex/Sophie),
I want to create, view, edit, and delete Folder Models through the admin interface,
So that I can manage folder-level configuration for funding programs.

## Acceptance Criteria

1. All ACTEE layer files exist with correct naming:
   - `domains/folder-models/folder-model.store.ts` (domain store with `signalStore`)
   - `domains/folder-models/folder-model.api.ts` (resources + `HttpMutationRequest`)
   - `domains/folder-models/folder-model.models.ts` (types from generated API types)
   - `domains/folder-models/forms/folder-model.form.ts` (FormGroup factory)
   - `features/folder-models/folder-model.store.ts` (feature store, `withComputed` only)
   - `features/folder-models/folder-model.facade.ts` (facade)
   - `features/folder-models/ui/folder-model-list.component.ts`
   - `features/folder-models/ui/folder-model-detail.component.ts`
   - `features/folder-models/ui/folder-model-form.component.ts`
   - `pages/folder-models/folder-models.page.ts` (layout only, zero logic)
   - `pages/folder-models/folder-models.routes.ts`
2. Domain store composition follows mandatory order: `withState` → `withProps` → `withFeature(withCursorPagination)` → `withMutations` → `withMethods`
3. Feature store contains ONLY `withComputed` — no mutations, no methods, no API calls
4. Facade exposes readonly data signals and intention methods; UI components inject only the facade
5. Per-mutation status signals exposed through facade (`createIsPending`, `updateIsPending`, `deleteIsPending`, `anyMutationPending`)
6. `app.routes.ts` updated: `/folder-models` lazy-loads through `pages/folder-models/folder-models.routes.ts`
7. Paginated list displays correctly with cursor-based infinite scroll
8. Create form displays with fields: `name` (required), `description` (optional)
9. Edit form pre-populates current values using `effect()` pattern
10. Delete shows confirmation dialog, deletes with success toast
11. API errors display human-readable error messages via toast
12. No status workflow — Folder Models have no status field
13. Domain store tests + facade tests written, all existing tests pass with zero regressions

## Tasks / Subtasks

- [x] Task 1: Create domain models (AC: #1)
  - [x] Create `src/app/domains/folder-models/folder-model.models.ts`
  - [x] Types: `FolderModel` = `FolderModelRead`, `FolderModelCreate`, `FolderModelUpdate` from `@app/core/api/generated/api-types`
  - [x] Note: `FolderModelRead` includes nested `funding_programs?: FundingProgramRead[]` (array, not single FK)
- [x] Task 2: Create domain API file (AC: #1)
  - [x] Create `src/app/domains/folder-models/folder-model.api.ts`
  - [x] List loader: `folderModelListLoader(http, params)` → `GET /folder-models/` with cursor, limit, filters
  - [x] Detail loader: `loadFolderModel(http, id)` → `GET /folder-models/{id}`
  - [x] Mutation requests: `createFolderModelRequest`, `updateFolderModelRequest`, `deleteFolderModelRequest`
  - [x] API uses `PUT` for updates
  - [x] Filters: `funding_program_id` supported
- [x] Task 3: Create domain form factory (AC: #1, #8)
  - [x] Create `src/app/domains/folder-models/forms/folder-model.form.ts`
  - [x] `createFolderModelForm(fb: FormBuilder, initial?): FormGroup` with fields: `name` (required), `description` (optional), `funding_program_ids` (FormControl<string[]>, required — at least one)
  - [x] Note: `funding_program_ids` is an array FormControl — Story 1.5 adds the multi-select UI to populate it
- [x] Task 4: Create domain store (AC: #1, #2, #5)
  - [x] Create `src/app/domains/folder-models/folder-model.store.ts`
  - [x] Export as `FolderModelDomainStore`
  - [x] Compose: `withState` → `withProps(() => ({ _http: inject(HttpClient) }))` → `withFeature((store) => withCursorPagination({ loader: ... }))` → `withMutations` → `withMethods`
  - [x] `providedIn: 'root'`
  - [x] Include `selectedItem` state + `isLoadingDetail` boolean
  - [x] CRUD mutations only: `createMutation` (concatOp), `updateMutation` (concatOp), `deleteMutation` (concatOp)
  - [x] No status mutations (AC: #12)
  - [x] `selectById`: `rxMethod<string>` with switchMap
  - [x] Use `patch()` helper for `patchState` with `as never` cast
- [x] Task 5: Create feature store (AC: #1, #3)
  - [x] Create `src/app/features/folder-models/folder-model.store.ts`
  - [x] Export as `FolderModelFeatureStore`
  - [x] `withComputed` ONLY — inject `FolderModelDomainStore`, project all signals
  - [x] Signals: `items`, `selectedItem`, `isLoading`, `isLoadingDetail`, `hasMore`, `error`, `isEmpty`, `totalLoaded`
- [x] Task 6: Create facade (AC: #1, #4, #5)
  - [x] Create `src/app/features/folder-models/folder-model.facade.ts`
  - [x] Export `FolderModelFacade` as `@Injectable({ providedIn: 'root' })`
  - [x] Inject `FolderModelDomainStore` + `FolderModelFeatureStore` + `ToastService` + `Router`
  - [x] Readonly data signals from feature store
  - [x] Per-mutation status signals: `createIsPending`, `updateIsPending`, `deleteIsPending`, `anyMutationPending`
  - [x] Intention methods: `load()`, `loadMore()`, `select(id)`, `clearSelection()`, `create(data)`, `update(id, data)`, `delete(id)`
  - [x] No `publish()` or `disable()` — no status workflow
  - [x] Mutation result handling + `handleMutationError()` pattern
- [x] Task 7: Migrate UI list component (AC: #1, #7)
  - [x] Replace stub `features/folder-models/folder-model-list.component.ts` → move to `features/folder-models/ui/folder-model-list.component.ts`
  - [x] Inject `FolderModelFacade`
  - [x] DataTable columns: `name`, `description`, `created_at`
  - [x] No status column (Folder Models have no status)
  - [x] `ngOnInit()` calls `facade.load()`
  - [x] Row click → `/folder-models/:id`
  - [x] Load more → `facade.loadMore()`
  - [x] "Create Folder Model" button
- [x] Task 8: Create detail component (AC: #1)
  - [x] Create `src/app/features/folder-models/ui/folder-model-detail.component.ts`
  - [x] MetadataGrid fields: `name`, `description`, `created_at`, `updated_at`
  - [x] Funding Programs: display comma-separated list of names from `selectedItem().funding_programs` nested array
  - [x] Edit + Delete buttons (same pattern as FP detail)
  - [x] No status badge or status actions
- [x] Task 9: Create form component (AC: #1, #8, #9)
  - [x] Create `src/app/features/folder-models/ui/folder-model-form.component.ts`
  - [x] Use `createFolderModelForm(fb)` from domain forms
  - [x] Fields: `name`, `description`
  - [x] `funding_program_ids` field exists but multi-select UI is Story 1.5's scope — for now, leave as hidden or placeholder
  - [x] Edit mode: `effect()` patches form when `selectedItem` loads
  - [x] Submit: `facade.create(data)` or `facade.update(id, data)`
  - [x] `submitting` computed, `showError()`, `markAllAsTouched()` patterns
- [x] Task 10: Create page + routes and update app.routes.ts (AC: #1, #6)
  - [x] Create `src/app/pages/folder-models/folder-models.page.ts` — `<router-outlet />` only
  - [x] Create `src/app/pages/folder-models/folder-models.routes.ts` — 4 routes: list, new, :id, :id/edit
  - [x] Update `src/app/app.routes.ts`: change folder-models from `features/folder-models/folder-model.routes` to `pages/folder-models/folder-models.routes`
  - [x] Delete old stubs: `features/folder-models/folder-model-list.component.ts`, `features/folder-models/folder-model.routes.ts`
- [x] Task 11: Write unit tests (AC: #13)
  - [x] Create `src/app/domains/folder-models/folder-model.store.spec.ts`
  - [x] Create `src/app/features/folder-models/folder-model.facade.spec.ts`
  - [x] Same test patterns as Story 1.1 domain store + facade tests
  - [x] Run `npx ng test --watch=false` — 156 tests pass, zero regressions
- [x] Task 12: Verify full functionality (AC: #7–#11)
  - [x] Run `ng build` — zero errors
  - [x] Verify list, create, edit, delete workflows

## Dev Notes

### Pilot-Then-Replicate Pattern (Epic 0 Retro Insight #1)

Story 1.1 (Action Models) is the pilot for Epic 1. This story replicates the exact same pattern for Folder Models. Epic 0 proved this acceleration pattern: Story 0.3 (FP pilot) was heaviest, Story 0.4 (AT replication) was significantly faster. Expect the same velocity gain here.

### Key Differences from Action Models

| Aspect | Action Models (1.1) | Folder Models (1.4) |
|--------|-------------------|-------------------|
| Status workflow | Yes (Story 1.3) | **No** |
| FP association | Single FK (`funding_program_id`) | **Array** (`funding_program_ids`) |
| AT association | Single FK (`action_theme_id`) | **None** |
| Nested read objects | `funding_program`, `action_theme` | `funding_programs[]` |

### API Types (Generated)

From `src/app/core/api/generated/api-types.ts`:

```typescript
// FolderModelRead — full model with nested FP array
{
  id: string;              // uuid
  name: string;
  description?: string | null;
  created_at: string;      // date-time
  updated_at: string;      // date-time
  funding_programs?: FundingProgramRead[];  // nested array (read-only)
}

// FolderModelCreate
{ name: string; description?: string | null; funding_program_ids?: string[] | null; }

// FolderModelUpdate
{ name: string; description?: string | null; funding_program_ids?: string[] | null; }
// Note: FolderModelUpdate.name is REQUIRED (unlike ActionModelUpdate where all are optional)
```

### API Endpoints

- `GET /folder-models/` — list with `?cursor=X&limit=N&funding_program_id=Y`
- `GET /folder-models/{folder_model_id}` — detail
- `POST /folder-models/` — create
- `PUT /folder-models/{folder_model_id}` — update
- `DELETE /folder-models/{folder_model_id}` — delete

### Existing Files to Handle

| Current Path | Action |
|-------------|--------|
| `features/folder-models/folder-model-list.component.ts` | Delete (stub) |
| `features/folder-models/folder-model.routes.ts` | Delete (stub) |
| `features/folder-models/ui/.gitkeep` | Delete (replaced by real files) |
| `domains/folder-models/forms/.gitkeep` | Delete (replaced by form factory) |
| `pages/folder-models/.gitkeep` | Delete (replaced by page + routes) |

### Known Workarounds (from Epic 0 Retro)

1. **`as never` casts for patchState** — same `patch()` helper pattern
2. **`withProps` for injection context** — same `_http` eagerly captured pattern
3. **Vitest sync test pattern** — same `of()` + `HttpTestingController` approach

### Form — funding_program_ids Placeholder

The form factory includes `funding_program_ids` as a `FormControl<string[]>`. For this story, it may be a hidden field or placeholder. Story 1.5 adds the multi-select UI. The form factory is ready — only the UI rendering changes in 1.5.

### Anti-Patterns to Avoid

- Same as Story 1.1 — facade-only imports, computed-only feature store, no inline forms
- Do NOT add status-related code — Folder Models have no status workflow
- Do NOT confuse `funding_program_ids` (write array) with `funding_programs` (read nested objects)

### Project Structure Notes

- Identical structure to `domains/action-models/` and `features/action-models/`
- Sidebar navigation already wired (`/folder-models` route in `app-layout.component.ts`)

### References

- [Source: src/app/domains/funding-programs/ — canonical domain pattern]
- [Source: src/app/features/funding-programs/ — canonical feature + facade pattern]
- [Source: src/app/core/api/generated/api-types.ts:2679-2728 — FolderModel types]
- [Source: _bmad-output/implementation-artifacts/1-1-action-models-crud-with-actee-pattern.md — pilot story for replication]
- [Source: _bmad-output/implementation-artifacts/epic-0-retro-2026-03-04.md — pilot-then-replicate insight]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.4]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Build: `npx ng build` — zero errors, only CSS warning (pre-existing)
- Tests: `npx ng test --watch=false` — 156 tests pass across 22 files, zero regressions

### Senior Developer Review (AI)

**Reviewer:** Anthony (via adversarial code review workflow)
**Date:** 2026-03-04
**Outcome:** Approved with fixes applied

**Issues found and fixed:**
- [H1] Domain store `error` state collision — added `detailError` to `withState`
- [H2] No mutation tests — added 4 mutation tests to domain store spec
- [H4] `facade.delete()` not awaited — added `await`
- [H5] `facade.create()`/`facade.update()` not awaited — added `await`, async `onSubmit`
- [M1] Facade bypassed feature store — added mutation/loading signal projections
- [M2] `handleMutationError` 409 message — made generic
- [M7] Empty state flash — added `hasLoaded` tracking
- [M9] `update()` discarded filters — changed to `refresh()`
- [M11] Error test assertion — added `detailError` check

### Completion Notes List

- Replicated Action Models ACTEE pattern exactly, with key differences: no status workflow, array FP association (`funding_programs[]`) instead of single FK
- `FolderModelUpdate.name` is required (unlike `ActionModelUpdate` where all fields are optional)
- Form includes `funding_program_ids` FormControl but no multi-select UI yet — Story 1.5 scope
- Detail component shows comma-separated FP names from nested array
- Deleted stubs: `folder-model-list.component.ts`, `folder-model.routes.ts`, 3x `.gitkeep` files
- Pilot-then-replicate pattern confirmed again — significantly faster than pilot story

### File List

- `src/app/domains/folder-models/folder-model.models.ts` — Created (type aliases)
- `src/app/domains/folder-models/folder-model.api.ts` — Created (API functions)
- `src/app/domains/folder-models/forms/folder-model.form.ts` — Created (form factory)
- `src/app/domains/folder-models/folder-model.store.ts` — Created (domain store)
- `src/app/domains/folder-models/folder-model.store.spec.ts` — Created (6 tests)
- `src/app/features/folder-models/folder-model.store.ts` — Created (feature store)
- `src/app/features/folder-models/folder-model.facade.ts` — Created (facade)
- `src/app/features/folder-models/folder-model.facade.spec.ts` — Created (7 tests)
- `src/app/features/folder-models/ui/folder-model-list.component.ts` — Created
- `src/app/features/folder-models/ui/folder-model-detail.component.ts` — Created
- `src/app/features/folder-models/ui/folder-model-form.component.ts` — Created
- `src/app/pages/folder-models/folder-models.page.ts` — Created
- `src/app/pages/folder-models/folder-models.routes.ts` — Created
- `src/app/app.routes.ts` — Modified (lazy-load path updated)
- `src/app/features/folder-models/folder-model-list.component.ts` — Deleted (stub)
- `src/app/features/folder-models/folder-model.routes.ts` — Deleted (stub)
- `src/app/features/folder-models/ui/.gitkeep` — Deleted
- `src/app/domains/folder-models/forms/.gitkeep` — Deleted
- `src/app/pages/folder-models/.gitkeep` — Deleted
