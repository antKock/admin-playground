# API Observations & Backend Feedback

_Living document tracking API gaps, limitations, and suggestions discovered during admin-playground architecture and development. Transfer to backend dev as needed._

**Source:** Architecture workflow + OpenAPI spec analysis (`/openapi.json`)
**Date started:** 2026-03-03

---

## Missing Endpoints / Features

### Token Refresh
- **Observation:** No dedicated refresh token endpoint in the API. Only `/auth/login` and `/auth/logout` exist.
- **Impact:** Frontend must redirect to login on token expiry. No silent re-auth possible.
- **Suggestion:** Add a `/auth/refresh` endpoint that accepts an expired JWT and returns a fresh one (or implement a refresh token flow).

### Indicator-Model Association CRUD
- **Observation:** The OpenAPI spec shows `indicator_models.action_model_ids` on create/update, but no dedicated endpoints for managing individual indicator-model associations with their metadata (visibility_rule, required_rule, editable, default_value, duplicable, constrained_values).
- **Impact:** Need to clarify: are association metadata fields managed via the IndicatorModel update endpoint, or is there a separate association endpoint not in the spec?
- **Suggestion:** Confirm the exact API contract for per-association metadata CRUD.

## Schema / Response Shape Notes

### Pagination Contract
- **Observation:** All list endpoints use cursor-based pagination (`cursor` + `limit` params, response: `{ items, cursor, limit }`). Confirmed working.
- **Question:** Is `total_count` available on any paginated response? The UX wants "Showing X of Y" in table footers. If not available, the admin will show item count only.

### Status Workflow
- **Observation:** ActionThemes have dedicated status transition endpoints (`/publish`, `/disable`, `/activate`). Other entities (FolderModels, ActionModels) don't have explicit transition endpoints.
- **Answer (confirmed 2026-03-04):** ActionModels and FolderModels have NO `status` field at all in the API schema. ActionModels are blocked (see Epic 1 section below). FolderModels don't need status per PRD. Agents use `PUT /agents/{id}` with `{ status }` body instead of dedicated endpoints.

### Agent Soft Delete
- **Observation:** Agents use soft-delete (status → DELETED). The `DELETE /agents/{agent_id}` endpoint performs soft delete, not hard delete.
- **Note:** Frontend will show "Delete" action but the API soft-deletes. UX messaging should reflect this.

## Type / Validation Gaps

### Indicator Types
- **Observation:** The API currently supports `TEXT` and `NUMBER` indicator types. The domain spec documents additional types: Choix par liste, Oui/Non, Date, Upload, Grouping.
- **Impact:** Frontend will only show TEXT/NUMBER in type selectors for v1. Architecture is extensible for new types when the API adds them.

## Epic 2 Observations (Communities & Agents)

### Community-User Assignment Endpoints Confirmed
- **Observation:** Dedicated endpoints exist: `POST /communities/{id}/users/{userId}` and `DELETE /communities/{id}/users/{userId}`.
- **Status:** Working as expected. No issues.

### User List Endpoint Shape (`GET /auth/users`)
- **Observation:** `GET /auth/users` returns a flat `UserRead[]` array (not wrapped in `PaginatedResponse`), despite accepting `cursor` and `limit` query params. There is also a separate `GET /users/` endpoint that returns `PaginatedResponse_UserRead_`.
- **Impact:** Frontend currently loads ALL users via `/auth/users` to display community membership. This works at small scale but may become a performance concern with many users.
- **Suggestion:** Consider adding a dedicated `GET /communities/{id}/users` endpoint that returns only users assigned to a specific community, avoiding the need to load all users and filter client-side.

### `UserRead.communities` Field
- **Observation:** `UserRead.communities` is typed as `UserCommunityBrief[]` but is **optional** (`communities?: ...`). The frontend relies on this field to determine community membership.
- **Impact:** If the `/auth/users` endpoint doesn't always populate this field, the community-users picker will show all users as unassigned.
- **Question:** Is `communities` always populated on `UserRead` from the `/auth/users` endpoint, or only on certain endpoints?

### Agent Status Transitions via PUT
- **Observation:** Agent status changes are performed via `PUT /agents/{id}` with `{ status: newStatus }` body. `AgentRead.next_possible_statuses` provides valid transitions with `is_allowed: boolean` and `reason_code` fields.
- **Note:** `AgentNextStatusInfo` does NOT have a `label` field — frontend derives labels from the status value. Consider adding a `label` field for i18n support.

### `AgentCreate.community_id` Defaults
- **Observation:** `AgentCreate.community_id` is optional in the API schema (`community_id?: string | null`) with description "defaults to user's main community". Frontend form makes it required via form validation.
- **Note:** Frontend is stricter than the API. This is intentional — operators should always explicitly select a community.

## Epic 1 Observations (Action Models & Folder Models)

### Action Model Status — BLOCKER (Story 1-3 blocked)
- **Observation:** `ActionModelRead` has NO `status` field. No status enum, no `next_possible_statuses`, and no status transition endpoints (`/action-models/{id}/publish`, `/action-models/{id}/disable`).
- **Confirmed:** Verified in `api-types.ts` — `ActionModelRead` contains only: `name`, `description`, `id`, `created_at`, `updated_at`, `funding_program_id`, `action_theme_id`.
- **Impact:** Story 1-3 (Action Model Status Workflow) is **blocked**. Cannot implement StatusBadge display, publish/disable mutations, or exhaustOp race-condition protection. Epic 1 cannot be closed.
- **Suggestion — Option A:** Add `status` field (enum: `draft`/`published`/`disabled`) + dedicated transition endpoints (`POST /action-models/{id}/publish`, `POST /action-models/{id}/disable`) following the existing `ActionTheme` pattern which already works.
- **Suggestion — Option B:** If ActionModels intentionally inherit lifecycle from their parent ActionTheme and don't need independent status, confirm this so the frontend can close Story 1-3 as "not applicable" and update the PRD accordingly.
- **Priority:** CRITICAL — blocks Epic 1 completion.

### Folder Model Status — Not Applicable (confirmed)
- **Observation:** `FolderModelRead` has no `status` field. No story was created for folder model status workflow.
- **Note:** This is consistent — the PRD does not require status management for Folder Models.

## Epic 3 Observations (Indicator Models)

### Indicator Model Status — BLOCKER (Story 3-3 partially blocked)
- **Observation:** `IndicatorModelRead` has NO `status` field. No `draft`/`published`/`disabled` lifecycle, no transition endpoints, no `next_possible_statuses` field.
- **Confirmed:** Verified in `api-types.ts` — `IndicatorModelRead` contains only: `name`, `technical_label`, `description`, `type`, `unit`, `id`, `created_at`, `updated_at`.
- **Impact:** The status workflow portion of Story 3-3 cannot be implemented. The "usage visibility" portion (showing which Action Models reference an indicator) CAN be implemented using `ActionModelRead.indicator_models` cross-referencing.
- **Suggestion:** Add `status` enum field (draft/published/disabled) + transition endpoints to the Indicator Model API, mirroring the ActionTheme pattern.
- **Priority:** HIGH — partially blocks Story 3-3.

### Indicator Model Subtype — NOT SUPPORTED (Story 3-2 partial)
- **Observation:** `IndicatorModelRead`/`Create`/`Update` has NO `subtype` field. The PRD describes subtypes (e.g., list-type indicators, yes/no, date, upload), but the API only supports `type: "text" | "number"`.
- **Impact:** FR25 (subtype selection) cannot be implemented. Frontend only shows the two API-supported types.
- **Suggestion:** Add a `subtype` enum field to IndicatorModel (e.g., `"plain_text" | "list" | "yes_no" | "date" | "upload" | "integer" | "decimal" | "percentage" | "currency"`).
- **Priority:** MEDIUM — blocks full indicator type taxonomy.

### Indicator Model List Values — NOT SUPPORTED (Story 3-2 partial)
- **Observation:** No list values management endpoints or fields exist. The PRD describes CRUD for list values on list-type indicators (FR26), but the API has no `list_values` field or dedicated endpoints.
- **Impact:** FR26 (List values management) cannot be implemented at all.
- **Suggestion:** Add `list_values: string[]` field to IndicatorModel (or a dedicated `/indicator-models/{id}/list-values` endpoint) for managing enumerated values on list-type indicators.
- **Priority:** MEDIUM — blocks list-type indicator configuration.

### Indicator Model Type-Change Constraint — NOT ENFORCEABLE (Story 3-2 partial)
- **Observation:** The PRD requires that indicator type cannot be changed once instances exist or once published (FR27). Without a `status` field and without knowledge of whether instances exist, this constraint cannot be enforced on the frontend.
- **Impact:** FR27 cannot be implemented. Users can currently change type freely on edit.
- **Suggestion:** Either add a `status` field + backend validation that rejects type changes on published indicators, or add an `instance_count` field so the frontend can disable the type selector when instances exist.
- **Priority:** LOW — backend should enforce this constraint regardless of frontend.

### Indicator-Model Association Metadata — Unverified (Stories 3-4, 3-5, 3-6 at risk)
- **Observation:** `IndicatorModelAssociationInput` exists in the API schema with 6 parameters: `visibility_rule`, `required_rule`, `editable_rule`, `default_value_rule`, `duplicable` (DuplicableConfig), `constrained_values` (ConstrainedValuesConfig). These are sent via `PUT /action-models/{id}` in the `indicator_model_associations` array.
- **Risk:** It is unverified whether the API actually persists and returns these 6 parameters correctly. If the backend silently ignores association metadata fields, Stories 3-4 (attach indicators), 3-5 (parameter configuration), and 3-6 (JSONLogic rules) will all fail at runtime.
- **Action Required:** Before starting Epic 3 development, run a manual API test: `PUT /action-models/{id}` with `indicator_model_associations` containing all 6 parameters, then `GET` it back and verify the parameters round-trip correctly.
- **Priority:** HIGH — de-risks 3 stories with a 5-minute manual test.

### IndicatorModelWithAssociation Missing `technical_label` (Story 3-4)
- **Observation:** `IndicatorModelWithAssociation` (the embedded indicator data in `ActionModelRead.indicator_models`) does NOT include `technical_label`. The field exists on `IndicatorModelRead` but is omitted from the association schema.
- **Impact:** The indicator card UI in the Action Model workspace cannot show the technical_label for attached indicators. Users see name + type badge but not the technical identifier.
- **Suggestion:** Add `technical_label: string` to the `IndicatorModelWithAssociation` schema so attached indicator cards display the same info as the picker.
- **Priority:** LOW — cosmetic gap, name + type badge still provides sufficient identification.

### Indicator Model Usage Lookup — No Reverse-Lookup Endpoint (Story 3-3)
- **Observation:** To determine which Action Models reference a given Indicator Model, the frontend fetches the first 100 action models via `GET /action-models/?limit=100` and filters client-side by `indicator_models` array. There is no dedicated reverse-lookup endpoint like `GET /indicator-models/{id}/action-models`.
- **Impact:** If more than 100 action models exist, the "Used in N models" count on the Indicator Model detail page will be silently inaccurate (truncated). The frontend cannot detect or warn about this.
- **Suggestion:** Add a `GET /indicator-models/{id}/action-models` endpoint that returns all Action Models referencing a given Indicator Model, or add an `indicator_model_id` filter to `GET /action-models/` that the backend evaluates against the associations.
- **Priority:** MEDIUM — usage count accuracy degrades at scale.

## UX Gap Analysis Observations (2026-03-04)

### Missing `updated_by` Field on All Entities
- **Observation:** No entity read schema (`ActionModelRead`, `IndicatorModelRead`, `ActionThemeRead`, `FolderModelRead`, `CommunityRead`, `AgentRead`) includes an `updated_by` field. The API returns `updated_at` timestamps but provides no attribution of who performed the last update.
- **Impact:** UX design spec calls for "Updated by [user name]" in both list view columns (GAP-EL6) and detail page meta lines (GAP-MW3, GAP-ID7). Frontend cannot display this information.
- **Suggestion:** Add `updated_by: { id: string, name: string }` (or `updated_by_id: string` + resolve via user endpoint) to all entity read schemas.
- **Priority:** MEDIUM — audit trail visibility gap, not a blocker for core functionality.

### No Full-Text Search Endpoint
- **Observation:** No entity list endpoint supports a `search` or `q` query parameter for full-text search across entity fields. Filtering is limited to specific field filters (e.g., `status`, `funding_program_id`).
- **Impact:** UX design spec includes a SearchBar component (GAP-SC2, GAP-EL9) for free-text search across entity lists. Client-side filtering on cursor-paginated data would only search the current page, which is misleading.
- **Suggestion:** Add a `q` or `search` query parameter to list endpoints that performs server-side full-text search across entity name/description fields.
- **Priority:** LOW — filter dropdowns (Story 4-2) cover the primary filtering use case. Full-text search is a nice-to-have.

## Epic 6 Observations (In-Column Filters & Table Polish)

### Multi-Select Filters — No OR Support
- **Observation:** The frontend sends comma-separated values for multi-select filters (e.g., `?status=draft,published`), but the API only accepts single values per filter parameter. Multi-value selection triggers a server error.
- **Impact:** In-column multi-select filters (Story 6-1) effectively only work with single selection. Selecting multiple values causes the API to return an error.
- **Suggestion:** Add OR support for filter parameters. Accept comma-separated values (e.g., `status=draft,published`) and return items matching ANY of the specified values.
- **Priority:** HIGH — multi-select filtering is a core table UX feature.

### Action Theme Filter on Action Models — Missing Parameter
- **Observation:** `GET /action-models/` only accepts `funding_program_id` as a filter parameter. There is no `action_theme_id` filter, despite action models being associated with action themes via `action_theme_id`.
- **Impact:** The action model table cannot filter by action theme, even though the column and filter UI exist. Frontend sends `action_theme_id=<value>` but the API ignores it.
- **Suggestion:** Add `action_theme_id` query parameter to `GET /action-models/` for server-side filtering by action theme.
- **Priority:** MEDIUM — limits table usability for operators managing models by theme.

### Community Filter on Agents — Missing Parameter
- **Observation:** `GET /agents/` only accepts `status` and `include_deleted` as filter parameters. There is no `community_id` filter, despite agents being associated with communities via `community_id`.
- **Impact:** The agent table cannot filter by community. Operators managing agents across communities have no server-side filtering option.
- **Suggestion:** Add `community_id` query parameter to `GET /agents/` for server-side filtering by community.
- **Priority:** MEDIUM — limits table usability for multi-community operator workflows.

---

_Add new observations below as they arise during development._
