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
- **Observation:** ActionThemes have dedicated status transition endpoints (`/publish`, `/disable`, `/activate`). Other entities (FolderModels, ActionModels) don't seem to have explicit transition endpoints.
- **Question:** How are status transitions handled for ActionModels and FolderModels? Direct PATCH on status field?

### Agent Soft Delete
- **Observation:** Agents use soft-delete (status → DELETED). The `DELETE /agents/{agent_id}` endpoint performs soft delete, not hard delete.
- **Note:** Frontend will show "Delete" action but the API soft-deletes. UX messaging should reflect this.

## Type / Validation Gaps

### Indicator Types
- **Observation:** The API currently supports `TEXT` and `NUMBER` indicator types. The domain spec documents additional types: Choix par liste, Oui/Non, Date, Upload, Grouping.
- **Impact:** Frontend will only show TEXT/NUMBER in type selectors for v1. Architecture is extensible for new types when the API adds them.

---

_Add new observations below as they arise during development._
