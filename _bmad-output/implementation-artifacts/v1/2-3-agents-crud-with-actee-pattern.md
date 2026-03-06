# Story 2.3: Agents CRUD with ACTEE Pattern

Status: done

## Story

As an operator (Alex/Sophie),
I want to create, view, edit, and delete Agents through the admin interface,
So that I can manage agent configurations without using Postman.

## Acceptance Criteria

1. Domain layer files exist: `domains/agents/agent.store.ts`, `agent.api.ts`, `agent.models.ts`, `forms/agent.form.ts`
2. Feature layer files exist: `features/agents/agent.store.ts`, `agent.facade.ts`
3. UI layer files exist: `features/agents/ui/agent-list.component.ts`, `agent-detail.component.ts`, `agent-form.component.ts`
4. Page route files updated: `pages/agents/agents.routes.ts` (list, new, :id, :id/edit routes)
5. Agents list at `/agents` displays paginated data with cursor-based infinite scroll
6. List columns: Name (first_name + last_name), Email, Agent Type, Status (StatusBadge), Community, Created
7. Row click navigates to `/agents/:id` detail view
8. Create form at `/agents/new` with fields: first_name, last_name, email, phone, position, agent_type (required, select), community_id (required, select), public_comment, internal_comment
9. Edit form at `/agents/:id/edit` pre-populates from API data via `effect()` pattern
10. Delete uses **soft-delete** semantics — API call with success toast and navigation back to list
11. Delete via ConfirmDialog with danger confirmation
12. Domain store uses `withCursorPagination`, `withMutations` (concatOp for CRUD), `withMethods` (selectById with rxMethod)
13. Feature store is `withComputed` ONLY — projects domain store signals + cross-domain community signals
14. Facade exposes readonly data signals + intention methods (load, loadMore, select, create, update, delete)
15. Facade exposes per-mutation status signals: `createIsPending`, `updateIsPending`, `deleteIsPending`, `anyMutationPending`
16. Facade handles mutation results with toast feedback and navigation
17. Facade maps HTTP errors: 409 (conflict), 422 (validation), generic fallback
18. All API errors display human-readable messages via toast
19. Status displayed via StatusBadge in both list and detail views
20. Form includes community_id selector populated from CommunityDomainStore
21. Form includes agent_type selector with enum values from API
22. All existing tests pass; new domain store + facade + component tests added
23. Stub `agent-list.component.ts` replaced with full implementation

## Tasks / Subtasks

- [x] Task 1: Create domain models (AC: #1)
  - [x] Create `src/app/domains/agents/agent.models.ts`
  - [x] Export types from `components['schemas']`: `AgentRead`, `AgentCreate`, `AgentUpdate`, `AgentType`, `AgentStatus`, `AgentNextStatusInfo`
  - [x] Import from `@app/core/api/generated/api-types`

- [x] Task 2: Create domain API file (AC: #1)
  - [x] Create `src/app/domains/agents/agent.api.ts`
  - [x] `BASE_URL = ${environment.apiBaseUrl}/agents/`
  - [x] `agentListLoader(http, params)` — GET with cursor/limit/filters
  - [x] `loadAgent(http, id)` — GET single agent
  - [x] `createAgentRequest(data)` — POST body
  - [x] `updateAgentRequest({id, data})` — PUT body
  - [x] `deleteAgentRequest(id)` — DELETE (soft-delete semantics)
  - [x] All functions are pure (no inject()), take HttpClient as parameter

- [x] Task 3: Create domain store (AC: #1, #12)
  - [x] Create `src/app/domains/agents/agent.store.ts`
  - [x] Composition order: `withState` -> `withProps` (inject HttpClient) -> `withFeature(withCursorPagination)` -> `withMutations` -> `withMethods`
  - [x] State: `selectedItem: null`, `isLoadingDetail: false`, `detailError: null`
  - [x] Mutations: `createMutation` (concatOp), `updateMutation` (concatOp), `deleteMutation` (concatOp)
  - [x] Methods: `selectById` (rxMethod with switchMap), `clearSelection`
  - [x] Use `patch()` helper for `patchState(store, state as never)` workaround

- [x] Task 4: Create form factory (AC: #1, #8, #21)
  - [x] Create `src/app/domains/agents/forms/agent.form.ts`
  - [x] `createAgentForm()` returns FormGroup with:
    - `first_name`: optional
    - `last_name`: optional
    - `email`: optional, email validator
    - `phone`: optional
    - `position`: optional
    - `agent_type`: required (enum: "energy_performance_advisor", "other")
    - `community_id`: required
    - `public_comment`: optional
    - `internal_comment`: optional
  - [x] Pure function, no inject()

- [x] Task 5: Create feature store (AC: #2, #13, #20)
  - [x] Create `src/app/features/agents/agent.store.ts`
  - [x] `AgentFeatureStore = signalStore({ providedIn: 'root' }, withComputed(...))`
  - [x] Inject `AgentDomainStore` AND `CommunityDomainStore`
  - [x] Project: items, selectedItem, isLoading, isLoadingDetail, hasMore, error, detailError, isEmpty, totalLoaded
  - [x] Cross-domain: `communityOptions: computed(() => communityStore.items().map(c => ({ id: c.id, label: c.name })))`
  - [x] Cross-domain: `communityLoading: computed(() => communityStore.isLoading())`

- [x] Task 6: Create facade (AC: #2, #14, #15, #16, #17, #18, #20)
  - [x] Create `src/app/features/agents/agent.facade.ts`
  - [x] Inject: `AgentDomainStore`, `AgentFeatureStore`, `CommunityDomainStore`, `ToastService`, `Router`
  - [x] Readonly signals: items, selectedItem, isLoading, isLoadingDetail, hasMore, error, detailError, isEmpty
  - [x] Cross-domain signals: `communityOptions`, `communityLoading`
  - [x] Mutation status signals: `createIsPending`, `updateIsPending`, `deleteIsPending`, `anyMutationPending`
  - [x] Methods: `load(filters?)`, `loadMore()`, `select(id)`, `clearSelection()`, `create(data)`, `update(id, data)`, `delete(id)`
  - [x] `loadAssociationData()` — loads CommunityDomainStore for form selectors
  - [x] Mutation result handlers: success toast + navigate, error toast with HTTP status mapping

- [x] Task 7: Replace list component stub (AC: #3, #5, #6, #7, #19, #23)
  - [x] Replace `src/app/features/agents/ui/agent-list.component.ts` (move from features/agents/ to features/agents/ui/)
  - [x] Inject `AgentFacade`, `Router`
  - [x] Columns: computed display name (first_name + last_name), email, agent_type, status (StatusBadge), community name, created_at
  - [x] Computed `rows` to flatten: `displayName = first_name + ' ' + last_name`, `community_name = agent.community?.name`
  - [x] Status column uses StatusBadge component
  - [x] Call `facade.load()` in `ngOnInit()`
  - [x] Row click: `router.navigate(['/agents', row.id])`
  - [x] Load more: `facade.loadMore()`
  - [x] "Create Agent" button navigates to `/agents/new`
  - [x] Use `DataTableComponent` from shared

- [x] Task 8: Create detail component (AC: #3, #10, #11, #19)
  - [x] Create `src/app/features/agents/ui/agent-detail.component.ts`
  - [x] Inject `AgentFacade`, `ActivatedRoute`, `Router`, `ConfirmDialogService`
  - [x] Call `facade.select(id)` in `ngOnInit()`
  - [x] Display MetadataGrid: Name, Email, Phone, Position, Agent Type, Community (linked), Status (StatusBadge), Public Comment, Internal Comment, Created, Updated
  - [x] StatusBadge for current status prominently displayed
  - [x] Edit button navigates to `/agents/:id/edit`
  - [x] Delete button with ConfirmDialog: title "Delete Agent?", message with name, danger confirm
  - [x] Note: Delete is **soft-delete** — agent is marked as deleted, not permanently removed
  - [x] Loading skeleton while `isLoadingDetail` is true
  - [x] Error state when `detailError` exists

- [x] Task 9: Create form component (AC: #3, #8, #9, #20, #21)
  - [x] Create `src/app/features/agents/ui/agent-form.component.ts`
  - [x] Inject `AgentFacade`, `ActivatedRoute`, `Router`, `ElementRef`
  - [x] `isEditMode` from route param `:id`
  - [x] Call `facade.loadAssociationData()` in `ngOnInit()` to pre-load community selector
  - [x] `effect()` patches form when `selectedItem` loads (with `formPatched` guard)
  - [x] `submitting = computed(() => facade.createIsPending() || facade.updateIsPending())`
  - [x] Form uses `createAgentForm()` factory
  - [x] `agent_type` field: `<select>` with options from AgentType enum
  - [x] `community_id` field: `<select>` populated from `facade.communityOptions()`
  - [x] Show loading state for community selector while `facade.communityLoading()`
  - [x] Submit: validate -> `facade.create(data)` or `facade.update(id, data)`
  - [x] Invalid form: markAllAsTouched + focus first invalid field
  - [x] Cancel navigates back to list or detail

- [x] Task 10: Update routes (AC: #4)
  - [x] Update `src/app/pages/agents/agents.routes.ts`
  - [x] Routes: `''` (list), `'new'` (form), `':id'` (detail), `':id/edit'` (form)
  - [x] Verify `agents.page.ts` has RouterOutlet

- [x] Task 11: Write tests (AC: #22)
  - [x] `src/app/domains/agents/agent.store.spec.ts` — domain store tests (6 tests)
  - [x] `src/app/features/agents/agent.facade.spec.ts` — facade tests (8 tests including loadAssociationData)
  - [x] Run full test suite — 206/206 tests pass, zero regressions

## Dev Notes

### API Types (from api-types.ts)

```typescript
// AgentRead — what you GET from the API
{
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  position?: string | null;
  public_comment?: string | null;
  internal_comment?: string | null;
  id: string;                            // UUID
  unique_id: string;
  agent_type: AgentType;                 // "energy_performance_advisor" | "other"
  status: AgentStatus;                   // "draft" | "completed" | "deleted"
  community_id: string;                  // UUID — links agent to community
  community?: CommunityBrief | null;     // Nested community brief
  next_possible_statuses?: AgentNextStatusInfo[];  // Valid status transitions
}

// AgentCreate — what you POST
{
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  position?: string | null;
  public_comment?: string | null;
  internal_comment?: string | null;
  agent_type: AgentType;                 // required
  community_id: string;                  // required
}

// AgentUpdate — what you PUT
{
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  position?: string | null;
  agent_type?: AgentType | null;
  public_comment?: string | null;
  internal_comment?: string | null;
  community_id?: string | null;
  status?: AgentStatus | null;           // Status can be updated via PUT
}

// AgentType enum
type AgentType = "energy_performance_advisor" | "other";

// AgentStatus enum
type AgentStatus = "draft" | "completed" | "deleted";

// AgentNextStatusInfo
{
  status: AgentStatus;
  label: string;
}
```

### Soft-Delete Semantics

Agent deletion uses soft-delete. The `DELETE /agents/{id}` endpoint marks the agent's status as "deleted" rather than physically removing the record. The API may return the updated agent with `status: "deleted"` or return 204. Handle both response shapes.

### Cross-Domain Pattern (Agent → Community)

Agents belong to a Community (`community_id` is required). The form needs a community selector:

```typescript
// Feature store: cross-domain computed
export const AgentFeatureStore = signalStore(
  { providedIn: 'root' },
  withComputed(() => {
    const domainStore = inject(AgentDomainStore);
    const communityStore = inject(CommunityDomainStore);
    return {
      // Agent signals...
      items: computed(() => domainStore.items() as AgentRead[]),
      // Cross-domain
      communityOptions: computed(() =>
        communityStore.items().map(c => ({ id: c.id, label: c.name }))
      ),
      communityLoading: computed(() => communityStore.isLoading()),
    };
  }),
);
```

```typescript
// Facade: loadAssociationData
loadAssociationData(): void {
  this.communityDomainStore.load(undefined);
}
```

Same pattern as Story 1.2 (Action Model → FP/AT) and Story 1.5 (Folder Model → FP).

### Status Display

AgentRead includes `status` field with values: "draft", "completed", "deleted". Use `StatusBadge` component:
- `draft` → gray/neutral badge
- `completed` → green badge
- `deleted` → gray/dimmed badge

The `next_possible_statuses` field on AgentRead provides valid transitions — this is used in Story 2.4 (status management), NOT in this story. This story only displays status; transitions are deferred.

### List Component: Computed Rows for Display

Agents have split name fields. Use computed `rows` signal to flatten for DataTable:

```typescript
readonly rows = computed(() =>
  this.facade.items().map(agent => ({
    ...agent,
    displayName: [agent.first_name, agent.last_name].filter(Boolean).join(' ') || '—',
    community_name: agent.community?.name ?? '—',
  }))
);
```

### Existing Stub Files to Replace/Update

- `src/app/features/agents/agent-list.component.ts` — stub with empty template, move to `ui/` subfolder
- `src/app/pages/agents/agents.page.ts` — RouterOutlet wrapper (keep as-is)
- `src/app/pages/agents/agents.routes.ts` — only lists list component (add detail/form routes)
- `src/app/domains/agents/forms/` — empty directory (add form factory)

### Dependencies

- **Requires Story 2-1 complete** — CommunityDomainStore needed for community selector
- `withCursorPagination` from `src/app/domains/shared/with-cursor-pagination.ts`
- `DataTableComponent` from `src/app/shared/components/data-table/`
- `MetadataGridComponent` from `src/app/shared/components/metadata-grid/`
- `StatusBadgeComponent` from `src/app/shared/components/status-badge/`
- `ConfirmDialogService` from `src/app/shared/services/confirm-dialog.service.ts`
- `ToastService` from `src/app/shared/services/toast.service.ts`

### Known Workarounds (from Epic 0/1)

1. **`as never` casts**: Use `patch()` helper: `patchState(store, state as never)`
2. **`withProps` for HttpClient**: Must inject via `withProps` BEFORE `withCursorPagination`
3. **Vitest sync**: No `fakeAsync`/`tick` — use synchronous `of()` observables

### Anti-Patterns to Avoid

- Do NOT let UI components import `AgentDomainStore` or `CommunityDomainStore` directly — facade only
- Do NOT put `withMutations` or `withMethods` in the feature store — `withComputed` only
- Do NOT define forms inline in components — use domain form factory
- Do NOT use `subscribe()` in components — signals and `effect()` only
- Do NOT forget per-mutation status signals in facade — required from day 1
- Do NOT implement status transitions in this story — defer to Story 2.4
- Do NOT confuse `community` (nested read object) with `community_id` (write ID) — same pattern as FP associations

### Project Structure Notes

- Domain: `src/app/domains/agents/` (store, api, models, forms)
- Feature: `src/app/features/agents/` (store, facade, ui/)
- Pages: `src/app/pages/agents/` (page, routes)
- All files use singular entity name: `agent.*.ts`
- Folder uses plural: `agents/`
- Store exports: `AgentDomainStore`, `AgentFeatureStore`
- API base URL: `${environment.apiBaseUrl}/agents/`

### References

- [Source: src/app/domains/funding-programs/funding-program.store.ts — canonical domain store pattern]
- [Source: src/app/features/action-models/action-model.store.ts — cross-domain feature store pattern]
- [Source: src/app/features/action-models/action-model.facade.ts — cross-domain facade pattern (loadAssociationData)]
- [Source: src/app/shared/components/status-badge/status-badge.component.ts — status display]
- [Source: src/app/core/api/generated/api-types.ts — AgentRead, AgentCreate, AgentUpdate, AgentType, AgentStatus schemas]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.3]
- [Source: _bmad-output/planning-artifacts/architecture.md — ACTEE layer structure, soft-delete semantics]
- [Source: _bmad-output/implementation-artifacts/1-1-action-models-crud-with-actee-pattern.md — closest prior CRUD story]
- [Source: _bmad-output/implementation-artifacts/1-2-action-model-funding-program-action-theme-association.md — cross-domain association pattern]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Fixed TS18046 `'c' is of type 'unknown'` in agent feature store by casting `communityStore.items() as CommunityRead[]`

### Completion Notes List

- Full ACTEE pattern: domain (models, api, store, form) + feature (store, facade) + UI (list, detail, form) + routes
- Cross-domain pattern: AgentFeatureStore injects CommunityDomainStore for community selector options
- Facade loadAssociationData() pre-loads communities for form selectors
- Computed rows in list for displayName and community_name flattening
- StatusBadge column type in list, StatusBadge display in detail
- Soft-delete messaging in ConfirmDialog
- Old stub agent-list.component.ts deleted, replaced with ui/ subfolder structure
- 206/206 tests pass across 27 test files

### Change Log

- 2026-03-04: All 11 tasks implemented, tests passing
- 2026-03-04: Code review fixes — agent_type now displayed as human-readable label in list and detail, added component specs (list, detail, form); 242/242 tests pass

### File List

- `src/app/domains/agents/agent.models.ts` (new)
- `src/app/domains/agents/agent.api.ts` (new)
- `src/app/domains/agents/agent.store.ts` (new)
- `src/app/domains/agents/agent.store.spec.ts` (new)
- `src/app/domains/agents/forms/agent.form.ts` (new)
- `src/app/features/agents/agent.store.ts` (new)
- `src/app/features/agents/agent.facade.ts` (new)
- `src/app/features/agents/agent.facade.spec.ts` (new)
- `src/app/features/agents/ui/agent-list.component.ts` (new, replaces stub)
- `src/app/features/agents/ui/agent-list.component.spec.ts` (new — review fix)
- `src/app/features/agents/ui/agent-detail.component.ts` (new)
- `src/app/features/agents/ui/agent-detail.component.spec.ts` (new — review fix)
- `src/app/features/agents/ui/agent-form.component.ts` (new)
- `src/app/features/agents/ui/agent-form.component.spec.ts` (new — review fix)
- `src/app/pages/agents/agents.routes.ts` (modified)
- `src/app/features/agents/agent-list.component.ts` (deleted)
