# Story 20.1: Entity Models Domain, Routing & Navbar

Status: ready-for-dev

## Story

As an admin,
I want a "Modèles d'entités" entry in the navigation bar,
So that I can access entity model configuration from anywhere in the app.

## Acceptance Criteria

1. **Domain store provides list and update**
   - Given the entity-model domain store is created
   - When the app loads
   - Then it provides a list loader (`GET /entity-models/`) and a select-by-type method
   - And an update mutation (`PUT /entity-models/{entity_type}`)

2. **Navbar shows new item**
   - Given the navbar is rendered
   - When the admin views the sidebar
   - Then a "Modèles d'entités" item is visible in the configuration section
   - And clicking it navigates to `/entity-models`

3. **Routing resolves correctly**
   - Given the entity-models feature module is configured
   - When the admin navigates to `/entity-models`
   - Then the route resolves to the entity-model list component
   - And `/entity-models/:entityType` resolves to the entity-model detail component

## Tasks / Subtasks

- [ ] Task 1: Create entity-model API service (AC: #1)
  - [ ] 1.1 Create `src/app/domains/entity-models/entity-model.api.ts`
  - [ ] 1.2 Functions: `entityModelListLoader(http)` — GET `/entity-models/`, returns `Observable<EntityModelRead[]>` (no pagination — only 3 items)
  - [ ] 1.3 Function: `loadEntityModel(http, entityType)` — GET `/entity-models/{entity_type}`, returns `Observable<EntityModelRead>`
  - [ ] 1.4 Function: `updateEntityModelRequest(params: { entityType: string; data: EntityModelUpdate })` — returns `{ url, method: 'PUT', body }`

- [ ] Task 2: Create entity-model models file (AC: #1)
  - [ ] 2.1 Create `src/app/domains/entity-models/entity-model.models.ts`
  - [ ] 2.2 Re-export from generated types: `EntityModelRead`, `EntityModelUpdate`, `EntityModelType`

- [ ] Task 3: Create entity-model domain store (AC: #1)
  - [ ] 3.1 Create `src/app/domains/entity-models/entity-model.store.ts`
  - [ ] 3.2 State: `items: EntityModelRead[]`, `selectedItem: EntityModelRead | null`, `isLoading: boolean`, `isLoadingDetail: boolean`, `error: string | null`, `detailError: string | null`
  - [ ] 3.3 **NO pagination** — entity models are a fixed set of 3 items, loaded in one call
  - [ ] 3.4 `withProps()` — inject HttpClient
  - [ ] 3.5 `withMutations()` — `updateMutation` httpMutation (`exhaustOp`)
  - [ ] 3.6 `withMethods()`:
    - `loadAll()` — rxMethod, calls `entityModelListLoader`, sets items
    - `selectByType(entityType: string)` — rxMethod, calls `loadEntityModel`, sets selectedItem
    - `clearSelection()` — resets selectedItem to null

- [ ] Task 4: Create entity-model feature store (AC: #1)
  - [ ] 4.1 Create `src/app/features/entity-models/entity-model.store.ts`
  - [ ] 4.2 Read-only `withComputed()` — projects domain store signals
  - [ ] 4.3 Cross-domain: project `IndicatorModelDomainStore` for indicator picker (needed in Story 20.3)
  - [ ] 4.4 Computed: `entityModelCards` — maps items to card display data (type, French label, indicator count)

- [ ] Task 5: Create entity-model facade (AC: #1)
  - [ ] 5.1 Create `src/app/features/entity-models/entity-model.facade.ts`
  - [ ] 5.2 Injectable, providedIn: 'root'
  - [ ] 5.3 Data signals: items, selectedItem, isLoading, isLoadingDetail, error, detailError
  - [ ] 5.4 Mutation status: updateIsPending
  - [ ] 5.5 Intention methods: loadAll, selectByType, clearSelection, update
  - [ ] 5.6 Update method: calls updateMutation → toast success "Modèle d'entité mis à jour" → re-select
  - [ ] 5.7 Error handling: handleMutationError

- [ ] Task 6: Create routing and page wrapper (AC: #3)
  - [ ] 6.1 Create `src/app/pages/entity-models/entity-models.page.ts` — simple page component with `<router-outlet />`
  - [ ] 6.2 Create `src/app/pages/entity-models/entity-models.routes.ts`:
    - `{ path: '', component: EntityModelListComponent }`
    - `{ path: ':entityType', component: EntityModelDetailComponent }`
  - [ ] 6.3 Add lazy-loaded route in `src/app/app.routes.ts`: `{ path: 'entity-models', loadChildren: () => ... }`
  - [ ] 6.4 Create placeholder list and detail components (empty, to be implemented in Stories 20.2/20.3)

- [ ] Task 7: Add navbar item (AC: #2)
  - [ ] 7.1 In `src/app/core/layout/app-layout.component.ts`, add to `configItems` array:
    `{ label: 'Modèles d\'entités', route: '/entity-models', icon: 'people' }` (or appropriate icon)
  - [ ] 7.2 Position: after "Modèles d'indicateur" in the config section

- [ ] Task 8: Write tests (AC: #1, #2, #3)
  - [ ] 8.1 Test domain store loadAll populates items with 3 entity models
  - [ ] 8.2 Test domain store selectByType sets selectedItem
  - [ ] 8.3 Test facade update → mutation → toast → re-select
  - [ ] 8.4 Test routing: `/entity-models` resolves to list, `/entity-models/community` resolves to detail

## Dev Notes

### Architecture & Patterns

- **New domain store**: this is one of the few stories that creates a NEW domain store (most stories extend existing ones). Follow the exact composition pattern from `action-model.store.ts`.
- **No pagination**: unlike action models / folder models which use cursor pagination, entity models are a fixed set of 3 items. Use a simple `loadAll` rxMethod instead of `withCursorPagination`.
- **Route param is `entityType` (string enum), not UUID**: this is different from all other features. The route is `/entity-models/:entityType` where `entityType` is `community`, `agent`, or `site`.
- **Navbar**: static `configItems` array in `app-layout.component.ts` — just add a new entry.

### API Endpoints

```
GET /entity-models/
  Response: EntityModelRead[] (array of 3 items)

GET /entity-models/{entity_type}
  entity_type: "community" | "agent" | "site"
  Response: EntityModelRead

PUT /entity-models/{entity_type}
  Body: EntityModelUpdate { name?, description? }
  Response: EntityModelRead
```

### API Types Reference

```typescript
interface EntityModelRead {
  entity_type: EntityModelType; // "community" | "agent" | "site"
  name: string;
  description?: string | null;
  id: string;
  created_at: string;
  last_updated_at: string;
  last_updated_by_id?: string | null;
  sections?: unknown[]; // Will contain SectionModelWithIndicators once loaded
}

interface EntityModelUpdate {
  name?: string | null;
  description?: string | null;
}

type EntityModelType = "community" | "agent" | "site";
```

### Project Structure Notes

- New: `src/app/domains/entity-models/entity-model.api.ts`
- New: `src/app/domains/entity-models/entity-model.models.ts`
- New: `src/app/domains/entity-models/entity-model.store.ts`
- New: `src/app/features/entity-models/entity-model.store.ts`
- New: `src/app/features/entity-models/entity-model.facade.ts`
- New: `src/app/pages/entity-models/entity-models.page.ts`
- New: `src/app/pages/entity-models/entity-models.routes.ts`
- New: `src/app/features/entity-models/ui/entity-model-list.component.ts` (placeholder)
- New: `src/app/features/entity-models/ui/entity-model-detail.component.ts` (placeholder)
- Modified: `src/app/app.routes.ts` (add entity-models route)
- Modified: `src/app/core/layout/app-layout.component.ts` (add navbar item)

### Critical Guardrails

- **DO NOT** use `withCursorPagination` — entity models have no pagination (always 3 items)
- **Route param is `entityType`** (string), NOT `:id` (UUID) — this is a key difference from all other features
- **Entity models are not creatable or deletable** — only `GET` (list/detail) and `PUT` (update) exist
- **Domain store composition order**: `withState → withProps → withMutations → withMethods` (no pagination feature)
- **Placeholder components**: create empty list/detail components that just render "TODO" — they'll be implemented in Stories 20.2 and 20.3

### References

- [Source: temp/sections-feature-plan.md#Phase 3 — Entity Models — Navigation + Architecture]
- [Source: _bmad-output/planning-artifacts/v2.1/epics.md#Story 20.1]
- [Source: src/app/domains/action-models/action-model.store.ts — domain store pattern]
- [Source: src/app/core/layout/app-layout.component.ts — navbar configItems]
- [Source: src/app/app.routes.ts — lazy-loaded route pattern]
- [Source: src/app/pages/action-models/action-models.page.ts — page wrapper pattern]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
