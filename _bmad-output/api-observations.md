# api-observations

# API Observations & Backend Feedback

*Living document tracking API gaps, limitations, and suggestions discovered during admin-playground architecture and development.*

**Source:** Architecture workflow + OpenAPI spec analysis (`/openapi.json`)
**Date started:** 2026-03-03
**Backend review:** 2026-03-05 (branch LV2-162) — 13/14 observations confirmed, 1 resolved

---

## Decision Summary (2026-03-05)

*Cross-referencing frontend observations with backend code review. Ready for human triage.*

### No-Brainer Decisions (just do it)

These items are confirmed by both sides, have clear solutions, and need no product discussion.

| # | Item | Effort | Action |
| --- | --- | --- | --- |
| 14 | **Association metadata round-trip** | None | **RESOLVED** — all 6 fields exist in backend model. Do manual round-trip test before Epic 3 to confirm.

Anthony Comment : So it works in our playground ? |
| 8 | **Multi-select OR filters** | Low | Accept comma-separated values on filter params (e.g., `status=draft,published`). Standard admin pattern. |
| 9 | **`action_theme_id` filter on action-models** | Low | Add Query param + WHERE clause to `GET /action-models/`. |
| 10 | **`community_id` filter on agents** | Low | Add Query param + WHERE clause to `GET /agents/`. Agents already filtered internally by user communities — just expose it. |
| 11 | **`GET /communities/{id}/users`** | Low | Add GET endpoint. POST (assign) and DELETE (remove) already exist; GET (list) is missing. |
| 13 | **`technical_label` on IndicatorModelWithAssociation** | Low | Add one field to embedded schema. Cosmetic but improves indicator card UX. |
| — | **`GET /auth/users` vs `GET /users/` consolidation** | Low-Med | Deprecate `/auth/users` in favor of `/users/` with pagination + `community_id` filter. Backend flagged this as an architecture problem. |
| — | **FR27 type-change constraint** | Low | Backend-only enforcement. Reject type changes on published indicators or when instances exist. Both sides agree this is a data integrity constraint, not a UI rule. |

> **Recommendation:** Bundle items 8, 9, 10, 11, 13 into a single backend ticket (“Admin filter & schema gaps”). Low effort, high frontend impact.
> 

### Human-Required Decisions (need product/architecture call)

These items require discussion before implementation can proceed.

| # | Item | Priority | Decision Needed | Anthony’s Decision |
| --- | --- | --- | --- | --- |
| 2 | **ActionModel status** | **P0 CRITICAL** | **Option A** (independent status + transition endpoints like ActionTheme) vs **Option B** (lifecycle inherited from parent ActionTheme, Story 1-3 becomes N/A). Blocks Epic 1 completion. | Option A. Constraints on status transition to be added in the future. |
| 3 | **IndicatorModel status** | **P0 HIGH** | Does the indicator lifecycle need draft/published/disabled? Or are indicators always available once created? Blocks Story 3-3. | Needs “draft / published / disabled” status indeed.
Constraints on status transition to be added in the future. |
| 1 | **Token refresh** | **P1** | What mechanism? Silent JWT refresh? Rotating refresh tokens? Sliding session? Architecture decision on the flow, not just the endpoint. | What’s recommended ? the right simplicity/security balance. In the future, login will be externalised, relying on “ProConnect” as SSO.
Ideally, session remains active 15 days (if that makes sense) |
| 4+5 | **Indicator subtypes + list_values** | **P1** | Which subtypes are v1 scope? (list, yes/no, date, upload, etc.) This drives backend schema design AND frontend form complexity. Points 4 and 5 are linked — subtype determines if list_values is needed. | This will be handled by human dev later on. No action on this for now |
| 6 | **`updated_by` field** | **P2** | Architecture choice: `updated_by_id` (resolve via user endpoint) vs embedded `{ id, name }` (denormalized)? Apply to all entities or subset? | Up to backend dev to decide. The simpliest and more consistent solution is the right one.; to be applie to all entities |
| 7 | **Full-text search** | **P3** | Is this v1 scope? Backend says backlog. Filter dropdowns cover primary use case. Product call on priority. | To be decided later on, no decision for now |
| 12 | **Indicator reverse-lookup** | **P2** | Endpoint (`GET /indicator-models/{id}/action-models`) vs filter param (`GET /action-models/?indicator_model_id=X`)? Backend notes the inverse already exists (`GET /indicator-models/by-action-model/{id}`). | Showing models attached to indicators model, in the indicator model view is important. 
Up to you to find an agreement with backend dev. |

---

## Detailed Observations

### Missing Endpoints / Features

### Token Refresh

- **Observation:** No dedicated refresh token endpoint. Available auth endpoints: `POST /auth/register`, `POST /auth/login`, `POST /auth/token`, `GET /auth/me`, `POST /auth/logout`, `GET /auth/users`, `GET /auth/protected`.
- **Impact:** Frontend must redirect to login on token expiry. No silent re-auth possible.
- **Suggestion:** Add a `/auth/refresh` endpoint (mechanism TBD — see decision summary).
- **Backend review (2026-03-05):** Confirmed not resolved. Marked P1.
- **Status:** DECISION REQUIRED

### Indicator-Model Association CRUD

- **Observation:** The OpenAPI spec shows `indicator_models.action_model_ids` on create/update, but no dedicated endpoints for managing individual indicator-model associations with their metadata.
- **Backend review (2026-03-05):** RESOLVED. The `IndicatorModelActionModelLink` table contains all 6 metadata fields (`visibility_rule`, `required_rule`, `editable_rule`, `default_value_rule`, `duplicable_*`, `constrained_values_*`) with sensible defaults. Risk is lower than anticipated.
- **Remaining action:** Run manual round-trip test before Epic 3 development.
- **Status:** RESOLVED

### Schema / Response Shape Notes

### Pagination Contract

- **Observation:** All list endpoints use cursor-based pagination (`cursor` + `limit` params, response: `{ items, cursor, limit }`). Confirmed working.
- **Question:** Is `total_count` available? UX wants “Showing X of Y” in table footers.
- **Status:** OPEN (not addressed in backend review)

### Status Workflow

- **Observation:** ActionThemes have dedicated status transition endpoints (`/publish`, `/disable`, `/activate`). Other entities don’t.
- **Answer (confirmed 2026-03-04):** ActionModels and FolderModels have NO `status` field. Agents use `PUT /agents/{id}` with `{ status }` body.
- **Backend review (2026-03-05):** Confirmed. ActionModel status is the critical blocker.
- **Status:** See ActionModel Status (DECISION REQUIRED)

### Agent Soft Delete

- **Observation:** `DELETE /agents/{agent_id}` performs soft delete (status -> DELETED), not hard delete.
- **Note:** Frontend shows “Delete” action but the API soft-deletes. UX messaging reflects this.
- **Status:** ACKNOWLEDGED — no action needed

### User List Endpoint Architecture Problem

- **Observation:** `GET /auth/users` returns flat `UserRead[]` array (not paginated). `GET /users/` returns `PaginatedResponse_UserRead_`. Two endpoints for the same resource.
- **Backend review (2026-03-05):** Backend flagged this as a source of confusion. Recommends deprecating `/auth/users` in favor of `/users/` with a `community_id` filter.
- **Status:** NO-BRAINER — deprecate `/auth/users`

### `UserRead.communities` Field

- **Observation:** `communities` is optional on `UserRead`. Frontend relies on it for community membership.
- **Question:** Always populated from `/auth/users`?
- **Status:** OPEN (not addressed in backend review)

### Agent Status Transitions via PUT

- **Observation:** `PUT /agents/{id}` with `{ status }` body. `AgentNextStatusInfo` has no `label` field.
- **Note:** Frontend derives labels from status value. i18n label field would be nice-to-have.
- **Status:** ACKNOWLEDGED — minor enhancement

### `AgentCreate.community_id` Defaults

- **Observation:** Optional in API, required in frontend form validation. Intentional — operators should always explicitly select.
- **Status:** ACKNOWLEDGED — no action needed

### Type / Validation Gaps

### Indicator Types

- **Observation:** API supports `TEXT` and `NUMBER` only. PRD describes additional types.
- **Backend review (2026-03-05):** Confirmed. `IndicatorModelType` enum has only two values.
- **Impact:** Frontend shows TEXT/NUMBER only for v1. Extensible when API adds more.
- **Status:** See Indicator Subtypes (DECISION REQUIRED)

## Epic 1 Observations (Action Models & Folder Models)

### Action Model Status — BLOCKER (Story 1-3 blocked)

- **Observation:** `ActionModelRead` has NO `status` field, no status enum, no transition endpoints.
- **Confirmed (both sides):** Only fields: `name`, `description`, `id`, `created_at`, `updated_at`, `funding_program_id`, `action_theme_id`.
- **Impact:** Story 1-3 blocked. Epic 1 cannot be closed.
- **Options:**
    - **Option A:** Add `status` field (draft/published/disabled) + transition endpoints, following ActionTheme pattern.
    - **Option B:** Confirm lifecycle is inherited from parent ActionTheme. Story 1-3 becomes “not applicable”, PRD updated.
- **Backend review (2026-03-05):** Both options acknowledged as valid. “Option B deserves product decision before coding.”
- **Priority:** P0 CRITICAL
- **Status:** DECISION REQUIRED

### Folder Model Status — Not Applicable

- **Observation:** No `status` field. Consistent with PRD.
- **Status:** CLOSED — no action needed

## Epic 2 Observations (Communities & Agents)

### Community-User Assignment Endpoints — Working

- **Status:** CLOSED — no issues

### `GET /communities/{id}/users` — Missing

- **Observation:** POST (assign) and DELETE (remove) exist. No GET to list community users.
- **Backend review (2026-03-05):** Confirmed not resolved.
- **Status:** NO-BRAINER — add GET endpoint

### Community Filter on Agents — Missing

- **Observation:** `GET /agents/` only accepts `status` and `include_deleted`. No `community_id` filter despite agents having `community_id`.
- **Backend review (2026-03-05):** Confirmed. Internal filtering by user communities exists but no explicit filter exposed. “Easy to implement.”
- **Status:** NO-BRAINER — add filter param

## Epic 3 Observations (Indicator Models)

### Indicator Model Status — BLOCKER (Story 3-3 partially blocked)

- **Observation:** `IndicatorModelRead` has NO `status` field.
- **Confirmed (both sides):** Only fields: `name`, `technical_label`, `description`, `type`, `unit`, `id`, `created_at`, `updated_at`.
- **Impact:** Status workflow portion of Story 3-3 blocked. Usage visibility portion CAN be implemented.
- **Backend review (2026-03-05):** Confirmed not resolved. “Without status, no publication workflow.”
- **Priority:** P0 HIGH
- **Status:** DECISION REQUIRED

### Indicator Model Subtype — NOT SUPPORTED (Story 3-2 partial)

- **Observation:** No `subtype` field. API only supports `type: "text" | "number"`.
- **Backend review (2026-03-05):** Confirmed. Linked with list_values — should be treated together.
- **Priority:** P1
- **Status:** DECISION REQUIRED (v1 scope of subtypes)

### Indicator Model List Values — NOT SUPPORTED (Story 3-2 partial)

- **Observation:** No `list_values` field or endpoints. PRD describes CRUD for list values (FR26).
- **Backend review (2026-03-05):** Confirmed. “Points 4 and 5 are linked — subtype determines if list_values is needed.”
- **Priority:** P1
- **Status:** DECISION REQUIRED (linked with subtypes)

### Indicator Model Type-Change Constraint — NOT ENFORCEABLE (Story 3-2 partial)

- **Observation:** PRD requires type cannot change once published/instances exist (FR27). Cannot enforce on frontend.
- **Backend review (2026-03-05):** “100% correct. It’s an integrity constraint, not a UI rule. Implement backend-side independently of frontend.”
- **Priority:** P2
- **Status:** NO-BRAINER — backend enforcement only

### Indicator-Model Association Metadata — RESOLVED

- **Observation:** 6 association metadata parameters exist in API schema.
- **Backend review (2026-03-05):** **RESOLVED.** `IndicatorModelActionModelLink` table contains all 6 fields with defaults:
    - `visibility_rule` (default: `"true"`)
    - `required_rule` (default: `"false"`)
    - `editable_rule` (default: `"true"`)
    - `default_value_rule` (nullable)
    - `duplicable_enabled`, `duplicable_min`, `duplicable_max`
    - `constrained_values_enabled`, `constrained_min`, `constrained_max`
- **Remaining action:** Manual round-trip test recommended before Epic 3 dev.
- **Status:** RESOLVED (risk lowered)

### IndicatorModelWithAssociation Missing `technical_label`

- **Observation:** Embedded schema omits `technical_label` present on `IndicatorModelRead`.
- **Backend review (2026-03-05):** Confirmed missing.
- **Priority:** P2 LOW
- **Status:** NO-BRAINER — add field to schema

### Indicator Model Usage Reverse-Lookup — No Endpoint

- **Observation:** No `GET /indicator-models/{id}/action-models`. Frontend fetches first 100 action models and filters client-side.
- **Backend review (2026-03-05):** Inverse exists (`GET /indicator-models/by-action-model/{action_model_id}`), but not the needed direction.
- **Priority:** P2 MEDIUM
- **Status:** DECISION REQUIRED (endpoint vs filter param approach)

## UX Gap Analysis Observations (2026-03-04)

### Missing `updated_by` Field on All Entities

- **Observation:** No `updated_by` on any entity read schema. Only `updated_at` timestamps.
- **Backend review (2026-03-05):** Confirmed not resolved.
- **Priority:** P2 MEDIUM
- **Status:** DECISION REQUIRED (schema design choice)

### No Full-Text Search Endpoint

- **Observation:** No `q` or `search` parameter on list endpoints.
- **Backend review (2026-03-05):** Confirmed not resolved. Marked P3 (backlog).
- **Priority:** P3 LOW
- **Status:** DECISION REQUIRED (v1 scope question)

## Epic 6 Observations (In-Column Filters & Table Polish)

### Multi-Select Filters — No OR Support

- **Observation:** API errors on comma-separated filter values. Only single values accepted.
- **Backend review (2026-03-05):** Confirmed. “Marked HIGH — standard pattern for admin tables.”
- **Priority:** P1 HIGH
- **Status:** NO-BRAINER — add OR support for filter params

### Action Theme Filter on Action Models — Missing

- **Observation:** `GET /action-models/` only accepts `funding_program_id`. No `action_theme_id` filter.
- **Backend review (2026-03-05):** Confirmed. “Easy to implement.”
- **Priority:** P2 MEDIUM
- **Status:** NO-BRAINER — add filter param

## Epic 7 Observations (Prose Editor)

### Linked Entity Schemas Hardcoded in Variable Dictionary

- **Observation:** `VariableDictionaryService` (lines 83-131) hardcodes linked entity schemas (community, beneficiaries, folder, community_creator, community_holder) with their property names and types. No API endpoint provides this metadata dynamically.
- **Impact:** When a new linked entity type or property is added to the backend, the frontend variable dictionary will silently miss it — no autocomplete, no linting, no prose variable suggestions for the new fields.
- **Suggestion:** Either (a) expose a metadata/schema endpoint (`GET /models/{type}/schema` or similar) that returns available properties per entity type, or (b) accept the hardcoded approach and document the sync requirement clearly (current choice).
- **Priority:** P3 LOW — current hardcoded approach works for v1, entity schemas are stable
- **Status:** ACKNOWLEDGED — revisit if entity schemas start changing frequently

---

*Add new observations below as they arise during development.*