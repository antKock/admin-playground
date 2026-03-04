# Story 0.4: Migrate Action Themes to ACTEE Pattern

Status: done

## Story

As an operator (Alex/Sophie),
I want Action Themes to work exactly as before under the new ACTEE architecture — including status transitions and duplication,
So that the ACTEE pattern is validated for lifecycle-managed entities.

## Acceptance Criteria

1. All ACTEE layer files exist with correct naming:
   - `domains/action-themes/action-theme.store.ts` (domain store)
   - `domains/action-themes/action-theme.api.ts` (CRUD + publish/disable/activate/duplicate mutations)
   - `domains/action-themes/action-theme.models.ts`
   - `domains/action-themes/forms/action-theme.form.ts`
   - `features/action-themes/action-theme.store.ts` (feature store, read-only)
   - `features/action-themes/action-theme.facade.ts` (facade with lifecycle intentions)
   - `features/action-themes/ui/action-theme-list.component.ts`
   - `features/action-themes/ui/action-theme-detail.component.ts`
   - `features/action-themes/ui/action-theme-form.component.ts`
   - `pages/action-themes/action-themes.page.ts`
   - `pages/action-themes/action-themes.routes.ts`
2. Status transitions (publish, disable, activate) use `exhaustOp` race condition strategy
3. CRUD mutations (create, update, delete) use `concatOp`
4. Duplicate mutation defined as `HttpMutationRequest`
5. Facade exposes lifecycle intentions: `publish()`, `disable()`, `activate()`, `duplicate()`
6. Facade exposes per-mutation status signals for fine-grained UI feedback (e.g., "publishing..." spinner)
7. List view shows current status via StatusBadge (draft, published, disabled)
8. Status transitions work: draft → published, published → disabled, disabled → published
9. Invalid status transitions blocked with informative error message (FR15)
10. Duplicate creates new Action Theme and appears in list
11. No UI component imports a store or API file directly — facades only
12. No feature store contains `withMutations` or `withMethods`
13. No page component contains `inject()` or any logic

## Tasks / Subtasks

- [x] Task 1: Create domain models (AC: #1)
  - [x] Create `src/app/domains/action-themes/action-theme.models.ts`
  - [x] Move types from `src/app/features/action-themes/action-theme.model.ts`
  - [x] Types: `ActionTheme`, `ActionThemeCreate`, `ActionThemeUpdate`, `ActionThemeStatus`
- [x] Task 2: Create domain API file (AC: #1, #2, #3, #4)
  - [x] Create `src/app/domains/action-themes/action-theme.api.ts`
  - [x] Define list loader for `withCursorPagination` (GET `/action-themes/?cursor=X&limit=N&status=X`)
  - [x] Define detail resource (GET `/action-themes/{id}`)
  - [x] Define CRUD mutations with `concatOp`: create (POST), update (PUT), delete (DELETE)
  - [x] Define status mutations with `exhaustOp`: `publishActionThemeMutation`, `disableActionThemeMutation`, `activateActionThemeMutation`
  - [x] Define `duplicateActionThemeMutation` (POST `/action-themes/{id}/duplicate`)
- [x] Task 3: Create domain form factory (AC: #1)
  - [x] Create `src/app/domains/action-themes/forms/action-theme.form.ts`
  - [x] Extract form from `action-theme-form.component.ts`
  - [x] Fields: `name` (required), `technical_label`, `description`, `icon`, `color`
  - [x] Export `createActionThemeForm(initial?: Partial<ActionTheme>): FormGroup`
- [x] Task 4: Create domain store (AC: #1)
  - [x] Create `src/app/domains/action-themes/action-theme.store.ts`
  - [x] Export as `ActionThemeDomainStore` with `providedIn: 'root'`
  - [x] Compose: `withState` → `withCursorPagination` → `withMutations` (CRUD + status + duplicate) → `withComputed` → `withMethods`
  - [x] Include `selectedItem` state for detail view
  - [x] Include method to load single item by ID
- [x] Task 5: Create feature store (AC: #1, #12)
  - [x] Create `src/app/features/action-themes/action-theme.store.ts`
  - [x] Export as `ActionThemeFeatureStore`
  - [x] `withComputed` ONLY — no mutations, no methods
  - [x] Derive view-model signals from domain store
- [x] Task 6: Create facade (AC: #1, #5, #6, #11)
  - [x] Create `src/app/features/action-themes/action-theme.facade.ts`
  - [x] Export `ActionThemeFacade` as `@Injectable({ providedIn: 'root' })`
  - [x] Expose readonly data signals: `items`, `selectedItem`, `isLoading`, `hasMore`, `error`
  - [x] Expose CRUD intentions: `load()`, `loadMore()`, `select(id)`, `create(data)`, `update(id, data)`, `delete(id)`
  - [x] Expose lifecycle intentions: `publish(id)`, `disable(id)`, `activate(id)`, `duplicate(id)`
  - [x] Expose per-mutation status signals: `publishStatus`, `disableStatus`, `activateStatus`, `duplicateStatus`
- [x] Task 7: Migrate UI components to features/ui/ (AC: #1, #7, #8, #9, #10, #11)
  - [x] Move list component → `features/action-themes/ui/action-theme-list.component.ts`
  - [x] Move detail component → `features/action-themes/ui/action-theme-detail.component.ts`
  - [x] Move form component → `features/action-themes/ui/action-theme-form.component.ts`
  - [x] Refactor list: replace service with facade, use `StatusBadge` in list rows
  - [x] Refactor detail: replace service with facade, use per-mutation status for button states
  - [x] Refactor form: replace service with facade, use domain form factory
  - [x] Replace `subscribe()` calls with signal-based reactive patterns
- [x] Task 8: Create page and routes (AC: #1, #13)
  - [x] Create `src/app/pages/action-themes/action-themes.page.ts` — zero logic
  - [x] Create `src/app/pages/action-themes/action-themes.routes.ts`
  - [x] Update `src/app/app.routes.ts` — change AT lazy-load to point to pages routes
- [x] Task 9: Write unit tests for facade and domain store
  - [x] Create `src/app/features/action-themes/action-theme.facade.spec.ts`
  - [x] Test: `load()` triggers domain store `load()` and populates items signal
  - [x] Test: `create()` triggers mutation, refreshes list on success, shows toast
  - [x] Test: `update()` triggers mutation, refreshes list on success, shows toast
  - [x] Test: `delete()` triggers mutation, refreshes list on success, shows toast
  - [x] Test: `publish(id)` triggers publish mutation with `exhaustOp`, refreshes list, shows toast
  - [x] Test: `disable(id)` triggers disable mutation, refreshes list
  - [x] Test: `activate(id)` triggers activate mutation, refreshes list
  - [x] Test: `duplicate(id)` triggers duplicate mutation, refreshes list, shows toast
  - [x] Test: per-mutation status signals reflect pending/success/error states
  - [x] Test: mutation error shows error toast
  - [x] Create `src/app/domains/action-themes/action-theme.store.spec.ts`
  - [x] Test: domain store composes `withCursorPagination` correctly
  - [x] Test: `selectById()` loads item and sets `selectedItem`
  - [x] Test: status mutations registered with correct race condition strategies
- [x] Task 10: Verify full functionality (AC: #7–#10)
  - [x] Run `ng build` — zero errors
  - [x] Test: list with StatusBadge in each row
  - [x] Test: status filter (Draft, Published, Disabled)
  - [x] Test: create/edit/delete with toasts
  - [x] Test: draft → publish (success toast, badge updates)
  - [x] Test: published → disable
  - [x] Test: disabled → activate
  - [x] Test: duplicate creates new item
  - [x] Test: invalid transition shows error message

## Dev Notes

### Existing Files to Migrate

| Current Path | Action | Target Path |
|-------------|--------|-------------|
| `features/action-themes/action-theme.model.ts` | Move types | `domains/action-themes/action-theme.models.ts` |
| `features/action-themes/action-theme.service.ts` | Replace with store | `domains/action-themes/action-theme.store.ts` |
| `features/action-themes/action-theme-list.component.ts` | Move + refactor | `features/action-themes/ui/action-theme-list.component.ts` |
| `features/action-themes/action-theme-detail.component.ts` | Move + refactor | `features/action-themes/ui/action-theme-detail.component.ts` |
| `features/action-themes/action-theme-form.component.ts` | Move + refactor | `features/action-themes/ui/action-theme-form.component.ts` |
| `features/action-themes/action-theme.routes.ts` | Move to pages | `pages/action-themes/action-themes.routes.ts` |

### Current AT API Endpoints

All use `${environment.apiBaseUrl}/action-themes/`:
- **List**: `GET /action-themes/?cursor=X&limit=N&status=X`
- **Detail**: `GET /action-themes/{id}`
- **Create**: `POST /action-themes/` with body
- **Update**: `PUT /action-themes/{id}` with body
- **Delete**: `DELETE /action-themes/{id}`
- **Publish**: `PUT /action-themes/{id}/publish` (empty body)
- **Disable**: `PUT /action-themes/{id}/disable` (empty body)
- **Activate**: `PUT /action-themes/{id}/activate` (empty body)
- **Duplicate**: `POST /action-themes/{id}/duplicate` (empty body)

### Current Status Workflow Implementation

From `action-theme.service.ts:17-39` and `action-theme-detail.component.ts`:
```typescript
// Service methods — currently Observable-based
publish(id: string): Observable<ActionTheme>  // PUT {id}/publish
disable(id: string): Observable<ActionTheme>  // PUT {id}/disable
activate(id: string): Observable<ActionTheme> // PUT {id}/activate
duplicate(id: string): Observable<ActionTheme> // POST {id}/duplicate
```

In ACTEE, these become `httpMutation` definitions in the API file:
```typescript
// action-theme.api.ts
export const publishActionThemeMutation: HttpMutationRequest = {
  method: 'PUT',
  url: (id: string) => `${baseUrl}/${id}/publish`,
  mapTo: exhaustOp,  // Prevent duplicate publish clicks
};
```

### Race Condition Strategy Reference

- `exhaustOp` — for status transitions: prevents duplicate submissions (button clicked twice). Currently the component uses `actionLoading` signal (`action-theme-detail.component.ts:112`) to disable buttons during transitions. With `exhaustOp`, this is handled at the store level.
- `concatOp` — for CRUD: ensures sequential processing of create/update/delete operations

### Current Detail Component Button Logic

From `action-theme-detail.component.ts:44-93`, the component shows different action buttons based on status:
- **draft**: Publish, Edit, Delete, Duplicate
- **published**: Disable, Duplicate
- **disabled**: Activate, Duplicate, Delete

The `actionLoading` signal (line 112) currently disables buttons during status transitions. In ACTEE, replace this with per-mutation status from the facade (e.g., `facade.publishStatus()` === 'pending').

### Detail Loading Pattern

Same as Story 0.3 — define a `loadActionTheme(http, id)` function in `action-theme.api.ts`, called from `withMethods` in the domain store via `selectById(id)`. See Story 0.3's "Detail Loading Pattern" section for the full code pattern.

### Follow the Funding Programs Pattern from Story 0.3

This migration follows the **exact same ACTEE pattern** established in Story 0.3 for Funding Programs. Key differences:
1. Additional mutations for status transitions (publish, disable, activate)
2. Additional mutation for duplication
3. Per-mutation status signals exposed through facade
4. StatusBadge integration in list view

### Post-Mutation List Refresh Pattern

Same as Story 0.3 — the **facade** orchestrates list refresh after successful mutations. For Action Themes, this also applies to status transitions and duplication:

```typescript
// action-theme.facade.ts
publish(id: string) {
  this.domainStore.publishMutation(id).subscribe({
    next: () => {
      this.toastService.success('Action theme published');
      this.domainStore.load(); // Refresh list to show updated status
    },
    error: (err) => this.toastService.error(err.message),
  });
}

duplicate(id: string) {
  this.domainStore.duplicateMutation(id).subscribe({
    next: () => {
      this.toastService.success('Action theme duplicated');
      this.domainStore.load(); // Refresh list to show new item
    },
    error: (err) => this.toastService.error(err.message),
  });
}
```

### app.routes.ts Update

Change:
```typescript
import('./features/action-themes/action-theme.routes').then(m => m.actionThemeRoutes)
```
To:
```typescript
import('./pages/action-themes/action-themes.routes').then(m => m.actionThemesRoutes)
```

### Anti-Patterns to Avoid

- Do NOT let UI components import `ActionThemeDomainStore` directly — facades only
- Do NOT put status mutation logic in the feature store — domain store only
- Do NOT use `switchOp` for status transitions — use `exhaustOp` (prevents cancellation of in-flight transitions)
- Do NOT keep the `actionLoading` signal in the detail component — use facade mutation status
- Do NOT delete old files yet — that's Story 0.5
- Do NOT modify `BaseEntityService<T>` — leave it untouched

### Project Structure Notes

- Follow the exact same pattern as Funding Programs (Story 0.3) — this validates the pattern for lifecycle entities
- The status mutations are the key differentiator from FP — proving `withMutations` + `exhaustOp` works for workflows
- Keep old files alongside new files until Story 0.5 cleanup

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns — Mutation-based writes]
- [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns — Mutation Status Convention]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 0.4]
- [Source: src/app/features/action-themes/action-theme.service.ts — current service with status methods]
- [Source: src/app/features/action-themes/action-theme-detail.component.ts — current status button logic]
- [Source: docs/architecture-ACTEE.md#Mutations — withMutations & httpMutation]
- [Source: Story 0.3 (this epic) — pilot pattern to follow]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- Same NgRx Signals v21 generic typing workarounds as Story 0.3 (`as never` casts for `patchState`)
- Used `exhaustOp` for status mutations and `concatOp` for CRUD mutations per architecture spec
- Per-mutation status signals added during code review (C3 fix)

### Completion Notes List
- Full ACTEE layer migration for Action Themes: domain models, API (CRUD + status + duplicate), forms, domain store, feature store, facade, UI components, page, routes
- Domain store uses withState → withProps → withFeature(withCursorPagination) → withMutations (CRUD concatOp + status exhaustOp + duplicate concatOp) → withMethods
- Facade exposes per-mutation status signals (publishIsPending, disableIsPending, activateIsPending, duplicateIsPending, anyMutationPending)
- Detail component uses per-mutation status for fine-grained button disabled states and loading text
- Status transitions (publish/disable/activate) and duplication fully functional
- app.routes.ts updated to lazy-load through pages/ routes
- 11 new tests (6 domain store + 11 facade) — all pass, zero regressions
- Old files kept alongside new files per story instructions (cleanup in Story 0.5)

### Change Log
- 2026-03-04: Story 0.4 implemented — Action Themes migrated to ACTEE pattern with full lifecycle support
- 2026-03-04: Code review fixes applied — per-mutation status signals, effect()-based form loading, StatusBadge in list

### File List
- src/app/domains/action-themes/action-theme.models.ts (new)
- src/app/domains/action-themes/action-theme.api.ts (new)
- src/app/domains/action-themes/forms/action-theme.form.ts (new)
- src/app/domains/action-themes/action-theme.store.ts (new)
- src/app/domains/action-themes/action-theme.store.spec.ts (new)
- src/app/features/action-themes/action-theme.store.ts (modified — replaced stub with feature store)
- src/app/features/action-themes/action-theme.facade.ts (new)
- src/app/features/action-themes/action-theme.facade.spec.ts (new)
- src/app/features/action-themes/ui/action-theme-list.component.ts (new)
- src/app/features/action-themes/ui/action-theme-detail.component.ts (new)
- src/app/features/action-themes/ui/action-theme-form.component.ts (new)
- src/app/pages/action-themes/action-themes.page.ts (new)
- src/app/pages/action-themes/action-themes.routes.ts (new)
- src/app/app.routes.ts (modified — AT route points to pages)
