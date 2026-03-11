# API Spec Review — Architect Assessment (Updated 2026-03-11)

*Party-mode briefing document. Captures the full architect analysis of the staging OpenAPI spec vs. current admin-playground implementation. Originally created 2026-03-06, updated 2026-03-11 with corrections and new findings.*

---

## Context

The staging API (`laureatv2-api-staging.osc-fr1.scalingo.io/openapi.json`) was reviewed on 2026-03-11 against:
- The previous assessment (2026-03-06)
- The live Angular admin-playground codebase on `staging` branch
- Generated OpenAPI types (already up-to-date with live spec)

## Corrections to 2026-03-06 Review

### 1. `ActionModelRead.funding_programs[]` — INCORRECT
The March 6th review stated ActionModelRead switched from `funding_program_id` to `funding_programs: FundingProgramRead[]`. **This was wrong.** The live spec still uses `funding_program_id` (singular UUID) + `funding_program` (single embedded object). No schema change needed on ActionModel.

> `FolderModelRead` DID change to `funding_programs: FundingProgramRead[]` — and our generated types already reflect this correctly.

### 2. `IndicatorModelRead.action_models[]` — INCORRECT
The March 6th review stated IndicatorModelRead now embeds `action_models: ActionModelRead[]` for reverse-lookup. **This was wrong.** The live spec shows no such field. Instead, the API provides:
- `GET /indicator-models/?action_model_id={id}` — server-side filter (new!)
- `GET /indicator-models/by-action-model/{action_model_id}` — dedicated lookup endpoint

The client-side 100-item workaround can be replaced, but via server-side filtering, not embedded data.

### 3. Verification Items — RESOLVED (Both Positive)
- **`technical_label` on `IndicatorModelRead`** — CONFIRMED PRESENT. Required field in current spec. The March 6th concern was a false alarm.
- **`communities` on `UserRead`** — CONFIRMED PRESENT. Still there with `UserCommunityBrief[]` type.

---

## What Got Resolved Since Original Observations

### 1. Pagination `total_count` — RESOLVED
`PaginationMeta` includes `total_count: number`. Our `PaginatedResponse<T>` model already has it. **Not yet displayed in UI.**

### 2. Indicator Reverse-Lookup — RESOLVED (differently than expected)
Server-side filter `GET /indicator-models/?action_model_id=` replaces the client-side 100-item hack. **Not yet wired in UI** — still using the old approach.

### 3. Indicator Type Filter — RESOLVED
`GET /indicator-models/?type=IndicatorModelType` filter available. **Not yet wired in UI.**

### 4. FundingProgram Enriched — RESOLVED
`FundingProgramRead` now includes `budget`, `start_date`, `end_date`, `is_active`, `folder_model_id`. Generated types are current. **Not yet exposed in UI forms/detail.**

### 5. FolderModel Multi-Program — RESOLVED
`FolderModelRead` uses `funding_programs: FundingProgramRead[]`. `FolderModelCreate/Update` uses `funding_program_ids: string[]`. Generated types current. **Not yet exposed in UI form.**

### 6. ActionTheme Duplication — RESOLVED & IMPLEMENTED
`POST /action-themes/{id}/duplicate` is live and fully integrated in UI with button + navigation.

### 7. ActionTheme Status Workflow — IMPLEMENTED
Publish/disable/activate lifecycle fully working in UI.

---

## What's Still Blocked (Backend Needed)

| Item | Priority | Status | Notes |
|---|---|---|---|
| ActionModel status workflow | P0 | No `status` field on ActionModelRead | Option A decided (independent status + transitions) |
| IndicatorModel status workflow | P0 | No `status` field on IndicatorModelRead | draft/published/disabled needed |
| Token refresh | P1 | No `/auth/refresh` endpoint | 15-day session, ProConnect SSO future |
| Multi-select OR filters | P1 | Still single-value only | Backend ticket pending |
| `community_id` filter on agents | P2 | Still missing as query param | Backend ticket pending |
| `updated_by` field | P2 | Still missing on all entities | Partially mitigated by History API (`ActivityResponse.user_name`) |
| Full-text search | P3 | Still missing | Deferred |

### Previously Blocked, Now Resolved

| Item | Resolution |
|---|---|
| `action_theme_id` filter on action-models | `GET /action-themes/{id}/action-models` endpoint achieves the same |
| Indicator reverse-lookup | `GET /indicator-models/?action_model_id=` server-side filter |
| `total_count` in pagination | Available on all endpoints |

---

## New API Capabilities Discovered (2026-03-11)

### New Endpoints (not in March 6th review)

| Endpoint | Method | Purpose |
|---|---|---|
| `/action-models/by-funding-program/{fp_id}` | GET | Scoped AM lookup by funding program |
| `/action-themes/{id}/action-models` | GET | Get action models for a theme |
| `/action-themes/by-unique-id/{unique_id}` | GET | Lookup by unique_id |
| `/agents/by-unique-id/{unique_id}` | GET | Lookup by unique_id |
| `/communities/by-unique-id/{unique_id}` | GET | Lookup by unique_id |
| `/communities/{id}/children` | GET | Community hierarchy — children |
| `/communities/{id}/parents` | GET | Community hierarchy — parents |
| `/communities/{id}/parents/{parent_id}` | POST/DELETE | Manage parent relationships |
| `/folder-models/by-funding-program/{fp_id}` | GET | Scoped FM lookup by funding program |
| `/folders/by-funding-program/{fp_id}` | GET | Scoped folder lookup |
| `/folders/by-status/{status}` | GET | Folder status filter |
| `/folders/by-unique-id/{unique_id}` | GET | Lookup by unique_id |
| `/indicator-models/by-action-model/{am_id}` | GET | Reverse indicator lookup |
| `/indicator-models/?action_model_id=` | GET (filter) | Server-side indicator-to-AM filter |
| `/indicators/{id}/duplicate` | POST | Indicator duplication (collectivité) |
| `/users/` | GET | Full user listing (separate from `/auth/users`) |
| `/users/me` | GET | Current user |
| `/users/{id}` | GET/PUT/DELETE | User CRUD |
| `/admin/roles/` | GET | List available roles |
| `/admin/roles/user/{user_id}` | GET/PUT | Get/set user role |

### New Schema Fields

| Schema | New Fields | Notes |
|---|---|---|
| `FundingProgramRead` | `budget`, `start_date`, `end_date`, `is_active`, `folder_model_id` | Fully enriched, bidirectional with FolderModel |
| `FundingProgramCreate/Update` | Same + `folder_model_id` | |
| `FolderModelRead` | `funding_programs: FundingProgramRead[]` | Multi-program support |
| `FolderModelCreate/Update` | `funding_program_ids: string[]` | |
| `IndicatorModelRead` | `children: IndicatorModelRead[] \| null` | Nested indicator groups |
| `IndicatorModelCreate/Update` | `children_ids: string[]` | |
| `CommunityCreate/Update` | `parent_ids: string[]` | Hierarchy support |
| `ActionModelRead` | `funding_program: FundingProgramRead` (embedded object) | Was always `funding_program_id`, now also embeds full object |

### New Filter Parameters

| Endpoint | Parameter | Type |
|---|---|---|
| `GET /indicator-models/` | `action_model_id` | UUID — server-side reverse lookup |
| `GET /indicator-models/` | `type` | IndicatorModelType enum |
| `GET /funding-programs/` | `active_only` | boolean (default false) |
| `GET /action-models/` | `funding_program_id` | UUID |
| `GET /agents/` | `include_deleted` | boolean (default false) |

---

## Product Decisions Made (2026-03-11 Party Mode)

| Item | Decision |
|---|---|
| Users management (CRUD + role + communities) | **IN SCOPE** — dedicated page with table, detail, form |
| Community hierarchy | **IN SCOPE** — read-only display in detail + counts in table |
| OAuth2 client management | **OUT OF SCOPE** — not needed |
| Indicator group type | **IN SCOPE** — new "group" type reuses association UX pattern |
| Sites & Buildings | Not yet decided |

### Indicator Group Type — Design Notes

The `group` indicator type is a single-level organizational container:

| Type | Has Value | Has Children | Can Be Child |
|---|---|---|---|
| `text` | Yes (string) | No | Yes |
| `number` | Yes (numeric) | No | Yes |
| `group` | No | Yes (`text`/`number` only) | No |

**UX decision:** The children picker on a group indicator reuses the same attach/detach pattern from action-model indicator associations, but **without parameters** (no visibility_rule, required_rule, etc.). Just a list of attached children with add/remove.

On the ActionModel side, indicators remain flat — each indicator (group or child) gets attached independently with its own association params. The group relationship is a modeling/display concern only.

### Users Management — Design Notes

- Full CRUD via `/users/` endpoints: `email`, `first_name`, `last_name`, `is_active`, `role`
- Role assignment via `/admin/roles/user/{user_id}` (GET to read, PUT to set)
- Community assignment managed from user detail page using **existing community endpoints**: `POST /communities/{id}/users/{user_id}` and `DELETE /communities/{id}/users/{user_id}` — same pattern as `CommunityUsersComponent` but inverted
- `UserRead.communities[]` provides current memberships for display
- `UserUpdate` does NOT accept `community_ids` — relationship is managed via community endpoints only

---

## Current Implementation Status

### Fully Implemented Features

| Domain | List | Detail | Create | Edit | Delete | Status Workflow | Duplicate | Filters |
|---|---|---|---|---|---|---|---|---|
| ActionModel | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | Generic |
| ActionTheme | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ (publish/disable/activate) | ✓ | Status |
| IndicatorModel | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | Generic |
| FundingProgram | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | Generic |
| FolderModel | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | Generic |
| Community | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | — |
| Agent | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ (draft/completed/deleted) | — | Status |

### Cross-Domain Features Implemented

- ActionModel ↔ IndicatorModel: attach/detach with 6-field association params, reorder
- ActionModel ↔ FundingProgram: dropdown selector in form
- ActionModel ↔ ActionTheme: dropdown selector in form
- Agent ↔ Community: dropdown selector in form, name link in list
- Community ↔ User: user assignment panel with search, add, remove

### Known Limitations

1. **Dropdown pagination ceiling**: ActionModel form loads first page (~20) of FundingPrograms and ActionThemes. If >20 exist, dropdown is incomplete.
2. **Indicator usage hack**: IndicatorModel detail loads first 100 ActionModels client-side to find usage. Should use `?action_model_id=` server filter instead.
3. **`total_count` not displayed**: Pagination model has the field, UI doesn't show it.

---

## Implementation Plan — v1.2

### Phase 1: Quick Wins (1 sprint, ~4 points)

| # | Story | Points | Details |
|---|---|---|---|
| 1 | Wire `total_count` to DataTable footer | 1 | Add "Showing X of Y" text to shared DataTable component. `PaginationMeta.total_count` already available in all stores. |
| 2 | Replace indicator usage hack with `?action_model_id=` filter | 1 | In indicator-model detail, replace client-side 100-item fetch with `GET /indicator-models/by-action-model/{am_id}` or the `?action_model_id=` filter. Removes ceiling bug. |
| 3 | Add `type` filter to indicator-models list | 1 | Add IndicatorModelType filter dropdown to indicator-models list. API accepts `?type=` param. Same pattern as ActionTheme status filter. |
| 4 | Add `active_only` filter to funding-programs list | 1 | Add toggle/filter for `?active_only=true` on funding-programs list. |

### Phase 2: Schema & Form Enrichment (1 sprint, ~7 points)

| # | Story | Points | Details |
|---|---|---|---|
| 5 | Enrich FundingProgram form & detail | 3 | **Form**: add `budget` (number input), `start_date` (date picker), `end_date` (date picker), `is_active` (toggle), `folder_model_id` (dropdown). **Detail**: show all new fields in MetadataGrid. Generated types already have these fields. |
| 6 | Enrich FolderModel form with funding programs | 2 | **Form**: add `funding_program_ids` multi-select picker. **Detail**: show linked funding programs list. Reuse attach/detach pattern or simple multi-select. |
| 7 | Community hierarchy display | 2 | **Detail view**: add "Parents" and "Children" sections showing linked communities as clickable links (using `/communities/{id}/parents` and `/communities/{id}/children` endpoints). **List view**: add two numeric columns "Parents" and "Children" showing counts. Read-only for now. |

### Phase 3: New Features (2 sprints, ~12 points)

| # | Story | Points | Details |
|---|---|---|---|
| 8 | Indicator group type support | 2 | **List**: distinguish group indicators visually (icon or badge), show child count. **Detail**: if type=group, show "Children" section with attached indicators. **Form**: if type=group, hide `unit` field, show children picker (reuse association UX, no params). Filter children picker to exclude type=group. `children_ids` sent on create/update. |
| 9 | Users management — CRUD + role | 5 | New domain module (`domains/users/`) + feature module (`features/users/`). **List**: table with columns (name, email, role, is_active, community count, updated_at), filterable by role and active status. **Detail**: user info + MetadataGrid + role display + communities section. **Form**: email, first_name, last_name, is_active, role (dropdown from `/admin/roles/`), password (create only). Same ACTEE pattern as other domains. |
| 9b | Users management — community assignment | 2 | **User detail**: add community assignment panel (mirror of `CommunityUsersComponent`). Show user's `communities[]` list. Picker to add communities via `POST /communities/{id}/users/{user_id}`. Remove via `DELETE`. Search/filter community picker. |
| 10 | History/Activity tab on detail views | 5 | New shared domain module (`domains/history/`). **API**: `GET /history/{entity_type}/{entity_id}/activities` for entity-scoped feed, `GET /history/{entity_type}/{entity_id}/versions` for version list. **Shared component**: `ActivityTabComponent` showing timestamped activity list with user_name, action, changes_summary. Add as a tab/section to all entity detail views. Partially fills `updated_by` gap via `ActivityResponse.user_name`. |

### Phase 4: Nice-to-Have (future)

| # | Story | Points | Details |
|---|---|---|---|
| 11 | FundingProgram ↔ FolderModel bidirectional navigation | 1 | On FP detail, show linked FolderModels. On FM detail, show linked FundingPrograms. Clickable cross-navigation. |
| 12 | Community hierarchy management | 2 | Edit `parent_ids` in community form. Add/remove parent relationships via `/communities/{id}/parents/{parent_id}`. |
| 13 | Global activity feed | 3 | Shell-level notification bell or activity panel using `GET /history/activities` with filters. |
| 14 | Version comparison | 3 | On entity detail, compare two historical versions using `GET /history/{entity_type}/{entity_id}/compare?date1=&date2=`. Side-by-side diff view. |

### Still Blocked (waiting on backend)

| Item | What's Needed | Impact |
|---|---|---|
| ActionModel status workflow | `status` field + transition endpoints on ActionModelRead | Status badges, workflow buttons, status filter in list |
| IndicatorModel status workflow | `status` field + transition endpoints on IndicatorModelRead | Same pattern as ActionTheme lifecycle |
| Multi-select OR filters | Backend support for comma-separated filter values | Better filtering UX across all lists |
| `community_id` filter on agents | Query param on `GET /agents/` | Filter agents by community in list |
| Full-text search | Search param on list endpoints | Search bar in all lists |

---

## API Capabilities — Scope Classification

### In Scope (Admin-Playground)

| Domain | Status |
|---|---|
| Action Models (CRUD) | Implemented |
| Action Themes (CRUD + lifecycle + duplicate) | Implemented |
| Indicator Models (CRUD + group type) | Implemented, group type pending |
| Funding Programs (CRUD + enriched fields) | Implemented, enrichment pending |
| Folder Models (CRUD + multi-program) | Implemented, multi-program pending |
| Communities (CRUD + hierarchy + users) | Implemented, hierarchy pending |
| Agents (CRUD + status) | Implemented |
| Users (CRUD + role + communities) | Pending — Phase 3 |
| History/Activity | Pending — Phase 3 |

### Out of Scope

| Domain | Reason |
|---|---|
| OAuth2 Client Management | Not needed for admin workflow |
| Actions CRUD + beneficiaries | Collectivité-facing |
| Folders CRUD + status workflow | Collectivité-facing |
| Indicators CRUD + duplication | Collectivité-facing |
| Sites & Buildings | TBD — not yet decided |
| Seed endpoint | Dev-only |

---

*This document is designed to be consumed by all BMAD agents in party mode for v1.2 planning.*
