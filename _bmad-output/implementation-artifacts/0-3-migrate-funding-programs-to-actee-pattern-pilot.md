# Story 0.3: Migrate Funding Programs to ACTEE Pattern (Pilot)

Status: done

## Story

As an operator (Alex/Sophie),
I want Funding Programs to work exactly as before under the new ACTEE architecture,
So that the migration proves the pattern works without disrupting my daily configuration workflow.

## Acceptance Criteria

1. All ACTEE layer files exist with correct naming:
   - `domains/funding-programs/funding-program.store.ts` (domain store with `signalStore`)
   - `domains/funding-programs/funding-program.api.ts` (resources + `HttpMutationRequest`)
   - `domains/funding-programs/funding-program.models.ts` (types extending generated API types)
   - `domains/funding-programs/forms/funding-program.form.ts` (FormGroup factory)
   - `features/funding-programs/funding-program.store.ts` (feature store, `withComputed` only)
   - `features/funding-programs/funding-program.facade.ts` (`@Injectable`, single UI entry point)
   - `features/funding-programs/ui/funding-program-list.component.ts`
   - `features/funding-programs/ui/funding-program-detail.component.ts`
   - `features/funding-programs/ui/funding-program-form.component.ts`
   - `pages/funding-programs/funding-programs.page.ts` (layout only, zero logic)
   - `pages/funding-programs/funding-programs.routes.ts`
2. Domain store composition follows mandatory order: `withState` → `withCursorPagination` → `withMutations` → `withComputed` → `withMethods`
3. Feature store contains only `withComputed` — no mutations, no methods, no API calls
4. Facade exposes readonly data signals and intention methods; UI components inject only the facade
5. `app.routes.ts` updated: `/funding-programs` lazy-loads through `pages/funding-programs/funding-programs.routes.ts`
6. Paginated list displays correctly with cursor-based infinite scroll
7. Create form displays, validates, saves with success toast
8. Edit form pre-populates, validates, saves successfully
9. Delete shows confirmation dialog, deletes with success toast
10. API errors display human-readable error messages via toast

## Tasks / Subtasks

- [x] Task 1: Create domain models (AC: #1)
  - [x] Create `src/app/domains/funding-programs/funding-program.models.ts`
  - [x] Move type definitions from `src/app/features/funding-programs/funding-program.model.ts`
  - [x] Types: `FundingProgram`, `FundingProgramCreate`, `FundingProgramUpdate` (same as current)
- [x] Task 2: Create domain API file (AC: #1)
  - [x] Create `src/app/domains/funding-programs/funding-program.api.ts`
  - [x] Define list loader function for `withCursorPagination` (GET `/funding-programs/`)
  - [x] Define detail resource (GET `/funding-programs/:id`)
  - [x] Define `HttpMutationRequest` for create (POST), update (PUT), delete (DELETE)
  - [x] Use `concatOp` race condition strategy for all CRUD mutations
- [x] Task 3: Create domain form factory (AC: #1)
  - [x] Create `src/app/domains/funding-programs/forms/funding-program.form.ts`
  - [x] Extract form definition from `funding-program-form.component.ts` (currently inline)
  - [x] Export `createFundingProgramForm(initial?: Partial<FundingProgram>): FormGroup`
  - [x] Preserve all existing validators (name required, etc.)
- [x] Task 4: Create domain store (AC: #1, #2)
  - [x] Create `src/app/domains/funding-programs/funding-program.store.ts`
  - [x] Export as `FundingProgramDomainStore`
  - [x] Compose: `withState` → `withProps` → `withFeature(withCursorPagination)` → `withMutations` → `withMethods`
  - [x] `providedIn: 'root'`
  - [x] Include `selectedItem` state for detail view
  - [x] Include method to load single item by ID
- [x] Task 5: Create feature store (AC: #1, #3)
  - [x] Create `src/app/features/funding-programs/funding-program.store.ts` (overwrite stub if exists)
  - [x] Export as `FundingProgramFeatureStore`
  - [x] `withComputed` ONLY — read domain store signals, expose view-model
  - [x] No mutations, no methods, no API calls
- [x] Task 6: Create facade (AC: #1, #4)
  - [x] Create `src/app/features/funding-programs/funding-program.facade.ts`
  - [x] Export `FundingProgramFacade` as `@Injectable({ providedIn: 'root' })`
  - [x] Inject `FundingProgramDomainStore` and `FundingProgramFeatureStore`
  - [x] Expose readonly data signals: `items`, `selectedItem`, `isLoading`, `hasMore`, `error`
  - [x] Expose intention methods: `load()`, `loadMore()`, `select(id)`, `create(data)`, `update(id, data)`, `delete(id)`
- [x] Task 7: Migrate UI components to features/ui/ (AC: #1)
  - [x] Move `funding-program-list.component.ts` → `features/funding-programs/ui/`
  - [x] Move `funding-program-detail.component.ts` → `features/funding-programs/ui/`
  - [x] Move `funding-program-form.component.ts` → `features/funding-programs/ui/`
  - [x] Refactor each component: replace `inject(FundingProgramService)` with `inject(FundingProgramFacade)`
  - [x] Remove all `subscribe()` calls — use facade signals directly
  - [x] Remove local pagination state (`hasMore`, `endCursor`) — read from facade
  - [x] Remove `OnInit` service calls — facade manages loading
  - [x] Use form factory from domain forms instead of inline form definition
- [x] Task 8: Create page and routes (AC: #1, #5)
  - [x] Create `src/app/pages/funding-programs/funding-programs.page.ts` — layout only, imports list component
  - [x] Create `src/app/pages/funding-programs/funding-programs.routes.ts` — define child routes
  - [x] Update `src/app/app.routes.ts` — change FP lazy-load to point to pages routes
- [x] Task 9: Write unit tests for facade and domain store
  - [x] Create `src/app/features/funding-programs/funding-program.facade.spec.ts`
  - [x] Test: `load()` triggers domain store `load()` and populates items signal
  - [x] Test: `loadMore()` triggers domain store `loadMore()`
  - [x] Test: `create()` triggers mutation, refreshes list on success, shows toast
  - [x] Test: `update()` triggers mutation, refreshes list on success, shows toast
  - [x] Test: `delete()` triggers mutation, refreshes list on success, shows toast
  - [x] Test: `select(id)` triggers `selectById()` and populates `selectedItem`
  - [x] Test: mutation error sets error state and shows error toast
  - [x] Create `src/app/domains/funding-programs/funding-program.store.spec.ts`
  - [x] Test: domain store composes `withCursorPagination` correctly (items, hasMore signals)
  - [x] Test: `selectById()` loads item and sets `selectedItem`
- [x] Task 10: Verify full functionality (AC: #6–#10)
  - [x] Run `ng build` — zero errors
  - [x] Test: list view with infinite scroll pagination
  - [x] Test: create form with validation and success toast
  - [x] Test: edit form with pre-populated values
  - [x] Test: delete with confirmation dialog
  - [x] Test: API error displays toast message
  - [x] Test: filter dropdown (is_active) still works

## Dev Notes

### Existing Files to Migrate

| Current Path | Action | Target Path |
|-------------|--------|-------------|
| `features/funding-programs/funding-program.model.ts` | Move types | `domains/funding-programs/funding-program.models.ts` |
| `features/funding-programs/funding-program.service.ts` | Replace with store | `domains/funding-programs/funding-program.store.ts` |
| `features/funding-programs/funding-program-list.component.ts` | Move + refactor | `features/funding-programs/ui/funding-program-list.component.ts` |
| `features/funding-programs/funding-program-detail.component.ts` | Move + refactor | `features/funding-programs/ui/funding-program-detail.component.ts` |
| `features/funding-programs/funding-program-form.component.ts` | Move + refactor | `features/funding-programs/ui/funding-program-form.component.ts` |
| `features/funding-programs/funding-program.routes.ts` | Move to pages | `pages/funding-programs/funding-programs.routes.ts` |

### Current FP API Endpoints

All use `${environment.apiBaseUrl}/funding-programs/`:
- **List**: `GET /funding-programs/?cursor=X&limit=N&is_active=true|false`
- **Detail**: `GET /funding-programs/{id}`
- **Create**: `POST /funding-programs/` with body
- **Update**: `PUT /funding-programs/{id}` with body
- **Delete**: `DELETE /funding-programs/{id}`

### Current Form Fields (from funding-program-form.component.ts)

The form currently has: `name` (required), `description`, `budget`, `is_active`, `start_date`, `end_date`. Extract this exact structure into the form factory.

### Detail Loading Pattern

The ACTEE architecture uses `withEntityResources` for data retrieval, but this project replaces it with `withCursorPagination` for paginated lists. For **single-item detail loading**, use a plain API function defined in the API file, called from `withMethods` in the domain store:

```typescript
// funding-program.api.ts — detail loader
export function loadFundingProgram(http: HttpClient, id: string): Observable<FundingProgram> {
  return http.get<FundingProgram>(`${environment.apiBaseUrl}/funding-programs/${id}`);
}
```

```typescript
// funding-program.store.ts — withMethods
withMethods((store, http = inject(HttpClient)) => ({
  selectById(id: string) {
    patchState(store, { isLoadingDetail: true });
    loadFundingProgram(http, id).subscribe({
      next: (item) => patchState(store, { selectedItem: item, isLoadingDetail: false }),
      error: (err) => patchState(store, { error: err.message, isLoadingDetail: false }),
    });
  },
  clearSelection() {
    patchState(store, { selectedItem: null });
  },
})),
```

This keeps HTTP I/O definitions in the API file while the store manages state — consistent with ACTEE's principle that the domain store never calls HTTP directly (the API file provides the functions). Future entities follow this same pattern.

### Domain Store Composition Pattern

```typescript
export const FundingProgramDomainStore = signalStore(
  { providedIn: 'root' },
  withState({ selectedItem: null as FundingProgram | null, isLoadingDetail: false }),
  withCursorPagination<FundingProgram>({ loader: fundingProgramListLoader }),
  withMutations({
    create: createFundingProgramMutation,
    update: updateFundingProgramMutation,
    delete: deleteFundingProgramMutation,
  }),
  withComputed(/* derived signals */),
  withMethods(/* selectById, clearSelection — see Detail Loading Pattern above */),
);
```

### Facade Pattern

```typescript
@Injectable({ providedIn: 'root' })
export class FundingProgramFacade {
  private domainStore = inject(FundingProgramDomainStore);
  private featureStore = inject(FundingProgramFeatureStore);

  // Data signals — readonly
  readonly items = this.featureStore.items;       // or domainStore.items
  readonly selectedItem = this.domainStore.selectedItem;
  readonly isLoading = this.domainStore.isLoading;
  readonly hasMore = this.domainStore.hasMore;

  // Intention methods
  load(filters?: Record<string, string>) { this.domainStore.load(filters); }
  loadMore() { this.domainStore.loadMore(); }
  select(id: string) { /* load by id */ }
  create(data: FundingProgramCreate) { /* trigger mutation */ }
  update(id: string, data: FundingProgramUpdate) { /* trigger mutation */ }
  delete(id: string) { /* trigger mutation */ }
}
```

### Post-Mutation List Refresh Pattern

After a successful create, update, or delete, the list must refresh to reflect the change. The **facade** orchestrates this — consistent with ACTEE's "facade orchestrates scenarios" principle:

```typescript
// funding-program.facade.ts
create(data: FundingProgramCreate) {
  this.domainStore.createMutation(data).subscribe({
    next: () => {
      this.toastService.success('Funding program created');
      this.domainStore.load(); // Refresh the list
      this.router.navigate(['/funding-programs']);
    },
    error: (err) => this.toastService.error(err.message),
  });
}

delete(id: string) {
  this.domainStore.deleteMutation(id).subscribe({
    next: () => {
      this.toastService.success('Funding program deleted');
      this.domainStore.load(); // Refresh the list
      this.router.navigate(['/funding-programs']);
    },
    error: (err) => this.toastService.error(err.message),
  });
}
```

**Key rule**: UI components never call `load()` after mutations — the facade handles the full success/error/refresh/navigate flow. This keeps components purely presentational.

### Page Component Pattern

```typescript
@Component({
  selector: 'app-funding-programs-page',
  template: `<router-outlet />`,
  imports: [RouterOutlet],
})
export class FundingProgramsPage {}
```

### Routes Pattern

```typescript
// pages/funding-programs/funding-programs.routes.ts
export const fundingProgramsRoutes: Routes = [
  { path: '', component: FundingProgramListComponent },
  { path: 'new', component: FundingProgramFormComponent },
  { path: ':id', component: FundingProgramDetailComponent },
  { path: ':id/edit', component: FundingProgramFormComponent },
];
```

### app.routes.ts Update

Change:
```typescript
import('./features/funding-programs/funding-program.routes').then(m => m.fundingProgramRoutes)
```
To:
```typescript
import('./pages/funding-programs/funding-programs.routes').then(m => m.fundingProgramsRoutes)
```

### Component Refactoring — Key Changes

**List component** (`funding-program-list.component.ts:76-134`):
- Replace `inject(FundingProgramService)` → `inject(FundingProgramFacade)`
- Remove `hasMore` and `endCursor` local state → use `facade.hasMore()`
- Remove `loadData()` method with manual subscribe → use `facade.load(filters)` and `facade.loadMore()`
- Remove `ngOnInit()` that calls `loadData()` → facade handles initial load or trigger from component

**Detail component**:
- Replace `inject(ActionThemeService)` → `inject(FundingProgramFacade)` (it's FP, check actual service)
- Replace `this.service.getById()` → `facade.select(id)`
- Replace `this.service.delete()` → `facade.delete(id)`

**Form component**:
- Replace inline form definition → use `createFundingProgramForm()` from domain forms
- Replace `inject(FundingProgramService)` → `inject(FundingProgramFacade)`
- Replace `this.service.create()` / `this.service.update()` → `facade.create()` / `facade.update()`

### Import Ordering (7 tiers)

```typescript
// 1. Angular core
import { Component, inject } from '@angular/core';
// 2. Angular CDK
// 3. Third-party (NgRx, Lucide)
// 4. App domains
import { FundingProgramFacade } from '@app/features/funding-programs/funding-program.facade';
// 5. App features
// 6. App shared
import { DataTableComponent } from '@app/shared/components/data-table/data-table.component';
// 7. Feature-local (relative)
```

### Anti-Patterns to Avoid

- Do NOT let UI components import `FundingProgramDomainStore` directly — facades only
- Do NOT put `withMutations` or `withMethods` in the feature store — computed only
- Do NOT define forms inline in the component — use domain form factory
- Do NOT keep `subscribe()` in components — use signals
- Do NOT delete old files yet — that's Story 0.5. Keep them alongside new files temporarily.
- Do NOT modify `BaseEntityService<T>` — leave it untouched

### API Gap Documentation

If you encounter any API behavior that differs from what the OpenAPI spec or current implementation suggests, append an entry to `_bmad-output/api-observations.md` with: **Observation** → **Impact** → **Suggestion/Workaround**.

### Project Structure Notes

- This is the **pilot migration** — the pattern established here will be replicated for Action Themes (0.4) and all future entities
- `features/funding-programs/` currently contains flat files. After migration, old files can coexist with new `ui/` folder structure until Story 0.5 cleanup
- Keep the existing spec files — they'll need updating or replacement to test the new facade/store pattern

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules]
- [Source: _bmad-output/planning-artifacts/architecture.md#Communication Patterns — Facade-to-UI Contract]
- [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions — Data Architecture]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 0.3]
- [Source: src/app/features/funding-programs/funding-program.service.ts — current service to replace]
- [Source: src/app/features/funding-programs/funding-program-list.component.ts — current list component]
- [Source: src/app/core/api/base-entity.service.ts — current base pattern]
- [Source: docs/architecture-ACTEE.md — ACTEE golden rules]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- Fixed inject() context issue: `inject(HttpClient)` inside `withCursorPagination` loader fails because loader runs inside rxMethod's switchMap (outside injection context). Fixed by using `withProps(() => ({ _http: inject(HttpClient) }))` + `withFeature((store) => withCursorPagination({ loader: ... }))` to eagerly capture HttpClient.
- Used `as never` cast for patchState with generic types in NgRx Signals v21 due to index signature constraints.
- Facade mutation methods use async/await with httpMutation's Promise-based API (returns MutationResult).

### Completion Notes List
- Full ACTEE layer migration for Funding Programs: domain models, API, forms, domain store, feature store, facade, UI components, page, routes
- Domain store uses withState → withProps → withFeature(withCursorPagination) → withMutations → withMethods composition
- Feature store is withComputed-only, facade is the single UI entry point
- UI components refactored: replaced FundingProgramService with FundingProgramFacade, removed subscribe() calls, removed local pagination state
- app.routes.ts updated to lazy-load through pages/ routes
- 13 new tests (6 domain store + 7 facade) — all 183 total tests pass, zero regressions
- Old files kept alongside new files per story instructions (cleanup in Story 0.5)

### Change Log
- 2026-03-04: Story 0.3 implemented — Funding Programs migrated to ACTEE pattern with full test coverage

### File List
- src/app/domains/funding-programs/funding-program.models.ts (new)
- src/app/domains/funding-programs/funding-program.api.ts (new)
- src/app/domains/funding-programs/forms/funding-program.form.ts (new)
- src/app/domains/funding-programs/funding-program.store.ts (new)
- src/app/domains/funding-programs/funding-program.store.spec.ts (new)
- src/app/features/funding-programs/funding-program.store.ts (modified — replaced stub with feature store)
- src/app/features/funding-programs/funding-program.facade.ts (new)
- src/app/features/funding-programs/funding-program.facade.spec.ts (new)
- src/app/features/funding-programs/ui/funding-program-list.component.ts (new)
- src/app/features/funding-programs/ui/funding-program-detail.component.ts (new)
- src/app/features/funding-programs/ui/funding-program-form.component.ts (new)
- src/app/pages/funding-programs/funding-programs.page.ts (new)
- src/app/pages/funding-programs/funding-programs.routes.ts (new)
- src/app/app.routes.ts (modified — FP route points to pages)
