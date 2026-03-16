# Story 15.1: Sites Module — Full CRUD

Status: done

## Story

As an operator,
I want to manage Sites through the admin interface,
So that I can track physical locations associated with communities.

## Acceptance Criteria

1. Full ACTEE module structure: `domains/site/` (store, API, models), `features/sites/` (facade, list, detail, form)
2. Paginated list view at `/sites` with `community_id` filter and cursor-based pagination
3. Detail view at `/sites/:id` showing: name, siren, usage, external_id, community (linked), unique_id, created_at, last_updated_at, last_updated_by
4. Create form at `/sites/new` with: name (required), siren (required, 9-digit validation), usage (optional), external_id (optional), community_id (required, select)
5. Edit form at `/sites/:id/edit` pre-filled with current values
6. Delete with confirmation dialog
7. Buildings sub-list on site detail showing associated buildings (via `GET /sites/{id}/buildings`)
8. Navigation: sidebar entry under appropriate section, breadcrumbs
9. All CRUD operations show success/error toasts
10. Unit tests for store, facade, and components

## Tasks / Subtasks

- [x] Task 1: Create domain layer (AC: #1)
  - [x] Create `src/app/domains/site/site.models.ts` — re-export from api-types
  - [x] Create `src/app/domains/site/site.api.ts` — loaders + request configs
  - [x] Create `src/app/domains/site/site.store.ts` — signalStore with ACTEE pattern
  - [x] Create `src/app/domains/site/index.ts` — barrel export
- [x] Task 2: Create feature layer (AC: #1)
  - [x] Create `src/app/features/sites/site.facade.ts` — facade with CRUD methods
  - [x] Create `src/app/pages/sites/sites.routes.ts` — route config
  - [x] Create `src/app/features/sites/ui/site-list.component.ts` — list with DataTable
  - [x] Create `src/app/features/sites/ui/site-detail.component.ts` — detail with MetadataGrid
  - [x] Create `src/app/features/sites/ui/site-form.component.ts` — create/edit form
- [x] Task 3: Implement list view (AC: #2)
  - [x] DataTable columns: name, siren, usage, created_at
  - [x] community_id filter support
  - [x] Cursor-based pagination
- [x] Task 4: Implement detail view (AC: #3, #7)
  - [x] MetadataGrid with all fields
  - [x] Buildings sub-list section using `GET /sites/{id}/buildings`
  - [x] Edit/Delete action buttons in header
- [x] Task 5: Implement create/edit form (AC: #4, #5)
  - [x] Reactive form with validation
  - [x] Siren: 9-digit numeric validation (pattern ^[0-9]{9}$)
  - [x] Community select: populated from communities loadAll
- [x] Task 6: Navigation (AC: #8)
  - [x] Add sidebar entry (MapPin icon under Administration)
  - [x] Register routes in app routing
  - [x] Breadcrumb configuration
- [x] Task 7: Tests (AC: #10)
  - [x] Store tests, facade tests, component tests
  - [x] Run `npx ng test --no-watch` — 944 tests pass, zero regressions

## Dev Notes

### API Endpoints

- `POST /sites/` — create
- `GET /sites/` — list (paginated, filter: `community_id`)
- `GET /sites/{site_id}` — get by ID
- `PUT /sites/{site_id}` — update
- `DELETE /sites/{site_id}` — delete
- `GET /sites/{site_id}/buildings` — list buildings for site (paginated)

### SiteRead Schema

```typescript
{
  id: string;           // UUID
  name: string;         // max 255
  siren: string;        // exactly 9 digits
  usage: string | null; // max 500
  external_id: string | null; // max 255
  community_id: string; // UUID
  unique_id: string;
  created_at: string;
  last_updated_at: string;
  last_updated_by_id: string | null;
}
```

### ACTEE Pattern Reference

Follow the exact pattern from any existing domain. Best references:
- `src/app/domains/action-themes/` — complete domain with status workflow
- `src/app/features/action-themes/` — complete feature with list, detail, form

### SIREN Validation

SIREN is a 9-digit French business identifier. Validation: `^[0-9]{9}$`. Display as-is (no formatting needed).

### References

- [Source: src/app/domains/action-themes/ — canonical ACTEE domain pattern]
- [Source: src/app/features/action-themes/ — canonical ACTEE feature pattern]
- [Source: src/app/domains/shared/with-cursor-pagination.ts — pagination store feature]
- [Source: src/app/shared/components/data-table/ — DataTable component]
- [Source: src/app/shared/components/metadata-grid/ — MetadataGrid component]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- Fixed `export type` for barrel re-exports (isolatedModules)
- Fixed DataTable column type (no 'mono' type, removed)
- Fixed layout spec nav item count (9→10 after adding Sites)

### Completion Notes List
- Full ACTEE pattern: domain (models, API, store, form), feature (facade, feature store, list, detail, form)
- Buildings sub-list on site detail with table view
- SIREN 9-digit validation on form
- Community select via loadAll from CommunityDomainStore
- All CRUD operations with toast feedback and navigation

### Change Log
- 2026-03-14: Story 15.1 implemented — full Sites CRUD module
- 2026-03-14: Code review fixes — community field now linked with resolved name, buildings sub-list count indicator, loadBuildings facade test added

### File List
- src/app/domains/site/site.models.ts (new)
- src/app/domains/site/site.api.ts (new)
- src/app/domains/site/site.store.ts (new)
- src/app/domains/site/site.store.spec.ts (new)
- src/app/domains/site/index.ts (new)
- src/app/domains/site/forms/site.form.ts (new)
- src/app/features/sites/site.store.ts (new)
- src/app/features/sites/site.facade.ts (new)
- src/app/features/sites/site.facade.spec.ts (new)
- src/app/features/sites/ui/site-list.component.ts (new)
- src/app/features/sites/ui/site-list.component.spec.ts (new)
- src/app/features/sites/ui/site-detail.component.ts (new)
- src/app/features/sites/ui/site-form.component.ts (new)
- src/app/pages/sites/sites.page.ts (new)
- src/app/pages/sites/sites.routes.ts (new)
- src/app/app.routes.ts (modified)
- src/app/core/layout/app-layout.component.ts (modified)
- src/app/core/layout/app-layout.component.spec.ts (modified)
