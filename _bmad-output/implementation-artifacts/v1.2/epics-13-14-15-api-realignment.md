# Epics 13–15: API Realignment & New Capabilities

## Overview

Following a comprehensive review of the live OpenAPI spec on 2026-03-13, the backend team has delivered massive changes that resolve both P0 blockers, all P1 items, all quick-win filters, and several new features. These 3 epics align the frontend with the evolved API, unblock status workflows, and add new feature modules.

**Key API changes driving this work:**
- ActionModel & IndicatorModel now have `status` (draft/published/disabled/deleted) + transition endpoints
- `POST /auth/refresh` exists (cookie-based token refresh)
- `last_updated_by_id` on all entities
- New filters: `action_theme_id`, `indicator_model_id`, `status` on action-models; `community_id` on agents; `type`+`status` on indicator-models
- Association rule fields renamed: `visibility_rule` → `hidden_rule`, `editable_rule` → `disabled_rule`, `duplicable`/`constrained` collapsed to single rule strings
- `IndicatorModelType` enum now includes `group` with `children[]` support
- `FundingProgramRead` enriched: `budget`, `start_date`, `end_date`, `folder_model_id`
- `RoleType` enum: `collectivite`, `cdm`, `admin` (3 roles, not 2)
- Sites & Buildings: full CRUD with community/site filters and RNB linking
- `PaginationMeta` enriched: `has_next_page`, `has_previous_page`, `cursors`, `_links`

**Dependency chain:** Epic 13 → Epic 14 → Epic 15

---

## Epic 13: API Alignment & Schema Sync

**Goal:** Get the frontend in sync with the massively evolved backend. No new user-visible features, but everything after depends on it.

### Story 13.1: Regenerate OpenAPI Types & Fix Compilation Errors

As an operator,
I want the admin interface to reflect the latest API schema,
So that all entity types, fields, and endpoints are correctly mapped.

**Acceptance Criteria:**
1. **Given** the live OpenAPI spec has changed **When** types are regenerated **Then** `api-types.ts` reflects all current schemas
2. **Given** association rule fields were renamed (hidden_rule, disabled_rule, duplicable_rule, constrained_rule) **When** the build runs **Then** all references use the new field names with zero compilation errors
3. **Given** the association parameter UI uses labels Obligatoire, Non editable, Masque, Valeur par defaut, Duplicable, Valeurs contraintes **When** displayed **Then** labels map directly to `required_rule`, `disabled_rule`, `hidden_rule`, `default_value_rule`, `duplicable_rule`, `constrained_rule`
4. **Given** `updated_at` was renamed to `last_updated_at` on all entities **When** metadata grids render **Then** they use the correct field name
5. **Given** the build and all tests pass **Then** the codebase compiles cleanly with the new types

### Story 13.2: Add last_updated_by_id to Metadata Grids

As an operator,
I want to see who last modified an entity,
So that I can track accountability and audit changes.

**Acceptance Criteria:**
1. **Given** all entities now expose `last_updated_by_id: UUID|null` **When** viewing any entity detail **Then** the metadata grid shows a "Derniere modification par" row
2. **Given** the value is a UUID **When** displayed **Then** it resolves to a user name (via user cache/lookup) or shows the UUID as fallback
3. **Given** the value is null **When** displayed **Then** the row shows "—" or is hidden

### Story 13.3: Wire Server-Side Filters & Remove Client-Side Hacks

As an operator,
I want list views to use server-side filtering,
So that filtering is fast and accurate regardless of dataset size.

**Acceptance Criteria:**
1. **Given** `/action-models/` accepts `action_theme_id`, `indicator_model_id`, `status` filters **When** filtering in the action-models list **Then** filter params are sent to the API
2. **Given** `/agents/` accepts `community_id` and `status` filters **When** filtering in the agents list **Then** filter params are sent to the API
3. **Given** `/indicator-models/` accepts `action_model_id`, `type`, `status` filters **When** filtering in the indicator-models list **Then** filter params are sent to the API
4. **Given** the status filter description says "comma-separated" **When** multiple statuses selected **Then** values are sent as `status=draft,published`
5. **Given** `indicator-model.api.ts` has a client-side usage filtering hack (loadAll + filter) **When** replaced **Then** it uses the `indicator_model_id` param on `/action-models/` instead

### Story 13.4: Pagination Upgrade

As an operator,
I want reliable pagination with accurate page state,
So that I know my exact position in result sets.

**Acceptance Criteria:**
1. **Given** `PaginationMeta` now provides `has_next_page` and `has_previous_page` **When** the pagination store evaluates "has more" **Then** it uses `has_next_page` instead of cursor null-checks
2. **Given** `PaginationMeta` provides `cursors.start_cursor` and `cursors.end_cursor` **When** paginating **Then** the store uses the structured cursor object
3. **Given** `PaginationMeta` provides `_links.next`, `_links.prev`, `_links.first` **When** available **Then** the store can use link-based navigation as a fallback

---

## Epic 14: Status Workflows & New Capabilities

**Goal:** Unblock the two longest-standing blockers (ActionModel + IndicatorModel status), secure sessions with token refresh, and wire up newly available capabilities.

**Depends on:** Epic 13 (types must be aligned first)

### Story 14.1: ActionModel Status Workflow

As an operator,
I want to transition Action Models through draft/published/disabled states,
So that I can control which models are active and available for use.

**Acceptance Criteria:**
1. Action Model detail displays current status via StatusBadge
2. Action Model list displays status column with StatusBadge
3. Status transition buttons on detail: draft → "Publier", published → "Desactiver", disabled → "Reactiver"
4. Transitions call `/action-models/{id}/publish`, `/disable`, `/activate`
5. Success toast + detail refresh on transition
6. Mutations use `exhaustOp` to prevent double-click
7. Per-mutation pending signals: `publishIsPending`, `disableIsPending`, `activateIsPending`
8. Status filter on list view connected to server-side `status` param
9. All existing tests pass; status mutation tests added

*Note: This is Story 1-3 unblocked. The existing story file has the full implementation plan — update status from blocked to ready-for-dev.*

### Story 14.2: IndicatorModel Status Workflow

As an operator,
I want to transition Indicator Models through draft/published/disabled states,
So that I can control which indicators are available for configuration.

**Acceptance Criteria:**
1–9: Same pattern as Story 14.1 but for Indicator Models
10. Status filter on indicator-models list connected to server-side `status` param (already available from 13.3)

### Story 14.3: Token Refresh

As an operator,
I want my session to stay active without manual re-login,
So that I can work without interruption.

**Acceptance Criteria:**
1. **Given** `POST /auth/refresh` exists (cookie-based) **When** an API call returns 401 **Then** the interceptor attempts a refresh before logging out
2. **Given** the refresh succeeds **When** the original request is retried **Then** it completes transparently
3. **Given** the refresh fails (expired refresh token) **When** handling the error **Then** the user is redirected to login with returnUrl
4. **Given** concurrent 401s occur **When** refresh is in-flight **Then** other requests queue and retry after refresh completes (no race conditions)
5. Logout explicitly calls `/auth/logout` to invalidate the refresh token

### ~~Story 14.4: Group Indicator Type & Children~~ — ALREADY IMPLEMENTED (Epics 10.3/10.4)

### ~~Story 14.5: FundingProgram Enriched Fields~~ — ALREADY IMPLEMENTED (Epics 9.1/9.2)

### Story 14.4: CDM Role & Soft-Delete Handling

As an operator,
I want the admin interface to handle all three roles and soft-deleted entities,
So that access control and data visibility are correct.

**Acceptance Criteria:**
1. **Given** `RoleType` is `collectivite | cdm | admin` **When** role-based guards evaluate **Then** `cdm` is handled (not rejected as unknown)
2. **Given** `ActionModelStatus` and `IndicatorModelStatus` include `deleted` **When** listing entities **Then** deleted entities are excluded by default
3. **Given** an admin wants to see deleted entities **When** an "include deleted" toggle exists **Then** deleted entities appear with a distinct visual treatment

---

## Epic 15: Sites & Buildings

**Goal:** New feature modules for the physical asset domain, following the proven ACTEE pattern.

**Depends on:** Epic 13 (types must be aligned)

### Story 15.1: Sites Module — Full CRUD

As an operator,
I want to manage Sites through the admin interface,
So that I can track physical locations associated with communities.

**Acceptance Criteria:**
1. Full ACTEE module: `domains/site/`, `features/sites/` with store, API, facade, list, detail, form
2. Paginated list at `/sites` with `community_id` filter
3. Detail view showing: name, siren (9-digit format), usage, external_id, community, unique_id, timestamps, last_updated_by
4. Create/edit form with: name (required), siren (required, 9-digit validation), usage, external_id, community_id (required, select)
5. Buildings sub-list on site detail (read-only link to building detail)
6. Navigation: sidebar entry, breadcrumbs

**Schema:** `SiteRead { id, name, siren, usage, external_id, community_id, unique_id, created_at, last_updated_at, last_updated_by_id }`

### Story 15.2: Buildings Module — CRUD with RNB Linking

As an operator,
I want to manage Buildings and their RNB identifiers,
So that I can track building assets and link them to the national registry.

**Acceptance Criteria:**
1. Full ACTEE module: `domains/building/`, `features/buildings/`
2. Paginated list at `/buildings` with `site_id` filter (or accessed from site detail)
3. Detail view showing: name, usage, external_id, site (link), rnb_ids[], unique_id, timestamps, last_updated_by
4. Create/edit form with: name (required), usage, external_id, site_id (required, select)
5. RNB management: chip-list display, add via `POST /buildings/{id}/rnbs?rnb_id=X`, remove via `DELETE /buildings/{id}/rnbs/{rnb_id}`
6. Building accessible from site detail buildings sub-list

**Schema:** `BuildingRead { id, name, usage, external_id, site_id, unique_id, rnb_ids[], created_at, last_updated_at, last_updated_by_id }`

---

## FR Coverage Map

| Requirement | Story |
|---|---|
| ActionModel status lifecycle | 14.1 |
| IndicatorModel status lifecycle | 14.2 |
| Token refresh / session persistence | 14.3 |
| Group indicator type with children | ~~14.4~~ Already done (10.3/10.4) |
| FundingProgram budget/dates | ~~14.5~~ Already done (9.1/9.2) |
| CDM role support | 14.4 |
| Soft-delete visibility | 14.4 |
| Association rule field alignment | 13.1 |
| Audit trail (last_updated_by) | 13.2 |
| Server-side filters | 13.3 |
| Pagination upgrade | 13.4 |
| Sites CRUD | 15.1 |
| Buildings CRUD + RNB | 15.2 |
