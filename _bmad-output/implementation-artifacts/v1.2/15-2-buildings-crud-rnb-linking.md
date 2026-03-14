# Story 15.2: Buildings Module — CRUD with RNB Linking

Status: done

## Story

As an operator,
I want to manage Buildings and their RNB identifiers,
So that I can track building assets and link them to the national registry.

## Acceptance Criteria

1. Full ACTEE module structure: `domains/building/` (store, API, models), `features/buildings/` (facade, detail, form)
2. Paginated list at `/buildings` with `site_id` filter (or accessed from site detail)
3. Detail view at `/buildings/:id` showing: name, usage, external_id, site (linked to site detail), rnb_ids[], unique_id, created_at, last_updated_at, last_updated_by
4. Create form with: name (required), usage (optional), external_id (optional), site_id (required, select)
5. Edit form pre-filled with current values
6. Delete with confirmation dialog
7. RNB management on detail view: chip-list display of rnb_ids, add via `POST /buildings/{id}/rnbs?rnb_id=X`, remove via `DELETE /buildings/{id}/rnbs/{rnb_id}`
8. Building detail accessible from site detail buildings sub-list (Story 15.1)
9. All CRUD + RNB operations show success/error toasts
10. Unit tests for store, facade, and components

## Tasks / Subtasks

- [x] Task 1: Create domain layer (AC: #1)
  - [x] Create `src/app/domains/building/building.models.ts`
  - [x] Create `src/app/domains/building/building.api.ts` — include RNB add/remove requests
  - [x] Create `src/app/domains/building/building.store.ts`
  - [x] Create `src/app/domains/building/index.ts`
- [x] Task 2: Create feature layer (AC: #1)
  - [x] Create `src/app/features/buildings/building.facade.ts` — include addRnb, removeRnb methods
  - [x] Create `src/app/pages/buildings/buildings.routes.ts`
  - [x] Create `src/app/features/buildings/ui/building-list.component.ts`
  - [x] Create `src/app/features/buildings/ui/building-detail.component.ts`
  - [x] Create `src/app/features/buildings/ui/building-form.component.ts`
- [x] Task 3: Implement list view (AC: #2)
  - [x] DataTable columns: name, usage, created_at
  - [x] site_id filter support
  - [x] Cursor-based pagination
- [x] Task 4: Implement detail view with RNB management (AC: #3, #7)
  - [x] MetadataGrid with all fields
  - [x] Site field as linked to site detail
  - [x] RNB section: chip-list display with X buttons
  - [x] Add RNB: text input + "Ajouter" button → POST /buildings/{id}/rnbs?rnb_id=X
  - [x] Remove RNB: chip delete button → DELETE /buildings/{id}/rnbs/{rnb_id} with confirmation
  - [x] Refresh building detail after RNB add/remove (re-selects by id)
- [x] Task 5: Implement create/edit form (AC: #4, #5)
  - [x] Reactive form with validation
  - [x] Site select: populated from sites loadAll
  - [x] Pre-fill site_id from query param when creating from site detail
- [x] Task 6: Wire up from site detail (AC: #8)
  - [x] Buildings in site detail sub-list link to building detail (row click navigates to /buildings/:id)
  - [x] "Ajouter un bâtiment" button on site detail navigates to /buildings/new?site_id=X
- [x] Task 7: Tests (AC: #10)
  - [x] Store tests (7 tests), facade tests (8 tests), component tests (5 tests)
  - [x] RNB add/remove tests in facade spec
  - [x] Run `npx ng test --no-watch` — 963 tests pass, zero regressions

## Dev Notes

### API Endpoints

- `POST /buildings/` — create
- `GET /buildings/` — list (paginated, filter: `site_id`)
- `GET /buildings/{building_id}` — get by ID
- `PUT /buildings/{building_id}` — update
- `DELETE /buildings/{building_id}` — delete
- `POST /buildings/{building_id}/rnbs` — add RNB (query param: `rnb_id`)
- `DELETE /buildings/{building_id}/rnbs/{rnb_id_str}` — remove RNB

### BuildingRead Schema

```typescript
{
  id: string;           // UUID
  name: string;         // max 255
  usage: string | null; // max 500
  external_id: string | null; // max 255
  site_id: string;      // UUID
  unique_id: string;
  rnb_ids: string[];    // list of RNB identifiers
  created_at: string;
  last_updated_at: string;
  last_updated_by_id: string | null;
}
```

### RNB (Referentiel National des Batiments)

RNB IDs are national building registry identifiers. They are opaque string codes. The UX pattern:
- Display as a chip-list (tags)
- Add: text input for the RNB ID + button
- Remove: X button on each chip with confirmation
- No validation on format (backend validates)

### References

- [Source: src/app/domains/site/ — site domain (parent entity, created in 15.1)]
- [Source: src/app/domains/action-themes/ — canonical ACTEE pattern reference]
- [Source: src/app/features/communities/ui/ — community-user assignment pattern (similar add/remove UX)]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- Fixed MetadataField type: use 'linked' (not 'link') with linkedRoute property
- Building2 icon from lucide-angular for sidebar

### Completion Notes List
- Full ACTEE pattern: domain (models, API, store, form), feature (facade, feature store, list, detail, form)
- RNB management: chip-list display, add via text input, remove with confirmation dialog
- Site select populated via SiteDomainStore.loadAll
- Building form pre-fills site_id from query param when navigating from site detail
- Site detail has "Ajouter un bâtiment" button linking to /buildings/new?site_id=X
- All CRUD + RNB operations with toast feedback

### Change Log
- 2026-03-14: Story 15.2 implemented — full Buildings CRUD module with RNB linking
- 2026-03-14: Code review fixes — site field now shows resolved name, external_id/unique_id use mono type, RNB store tests added, loadMore facade test added

### File List
- src/app/domains/building/building.models.ts (new)
- src/app/domains/building/building.api.ts (new)
- src/app/domains/building/building.store.ts (new)
- src/app/domains/building/building.store.spec.ts (new)
- src/app/domains/building/index.ts (new)
- src/app/domains/building/forms/building.form.ts (new)
- src/app/features/buildings/building.store.ts (new)
- src/app/features/buildings/building.facade.ts (new)
- src/app/features/buildings/building.facade.spec.ts (new)
- src/app/features/buildings/ui/building-list.component.ts (new)
- src/app/features/buildings/ui/building-list.component.spec.ts (new)
- src/app/features/buildings/ui/building-detail.component.ts (new)
- src/app/features/buildings/ui/building-form.component.ts (new)
- src/app/pages/buildings/buildings.page.ts (new)
- src/app/pages/buildings/buildings.routes.ts (new)
- src/app/app.routes.ts (modified)
- src/app/core/layout/app-layout.component.ts (modified)
- src/app/core/layout/app-layout.component.spec.ts (modified)
- src/app/features/sites/ui/site-detail.component.ts (modified — added "Ajouter un bâtiment" button)
