# Backend Requests

Open requests from frontend to backend. Verified at each API changelog review — items are closed when resolved by API changes.

---

## P1 — High priority

### 3. JWT role claim for frontend authorization
**Reported:** 2026-03-16 (UAT Epic 14)
**Impact:** Cannot reliably guard admin UI against "Collectivité" users.
**Questions:**
1. Does the JWT include a `role` claim?
2. If not, what claim name is used, or should one be added?
3. Should backend also enforce role checks on admin API endpoints?

---

## P2 — Medium priority

### 4. Activity history rejects IndicatorModel, Building, Site entity types
**Reported:** 2026-03-16 (UAT Epic 14-15)
**Impact:** 400 errors on detail pages for these entity types.
**Details:** `GET /history/{entity_type}/{entity_id}/activities` returns `"Invalid entity_type"`. Allowed list is missing `IndicatorModel`, `Building`, `Site`.

### 5. Indicator association parameter defaults — null convention
**Reported:** 2026-03-05
**Impact:** Frontend toggles can't distinguish "default" from "explicitly set" on indicator parameters.
**Details:** `visibility_rule`, `required_rule`, `editable_rule` on `IndicatorModelActionModelLink` should default to `null` instead of `'true'`/`'false'` strings. Convention: `null` = no override, string = explicit setting.

### 6. `GET /communities/{id}/users` — missing GET endpoint
**Reported:** 2026-03-05
**Impact:** Cannot list users in a community. POST (assign) and DELETE (remove) exist, but no GET (list).

### 7. `technical_label` on `IndicatorModelWithAssociation`
**Reported:** 2026-03-05
**Impact:** Indicator cards in action-model association view don't show technical label.
**Note:** As of 2026-03-06, `technical_label` appeared missing from `IndicatorModelRead` itself — needs verification (possible spec generation bug).

### 8. Deprecate `GET /auth/users` in favor of `GET /users/`
**Reported:** 2026-03-05
**Impact:** Two endpoints for the same resource creates confusion. `/auth/users` returns flat array, `/users/` returns paginated response.
**Request:** Deprecate `/auth/users`, add `community_id` filter to `GET /users/`.

---

## P3 — Low priority / Deferred

### 9. Type-change constraint on indicator models (backend-only)
**Reported:** 2026-03-05
**Details:** Reject type changes when indicator is published or has instances (FR27). Data integrity constraint, no frontend work needed.

### 10. Full-text search on list endpoints
**Reported:** 2026-03-05
**Details:** No `q` or `search` param on list endpoints. Deferred — filters cover current needs.
**Decision:** To be decided later.

### 11. `active_only` filter on funding programs — verify runtime behavior
**Reported:** 2026-03-11 (UAT Epic 8-12)
**Details:** Filter param exists in spec but may not be filtering correctly at runtime.

---

## Closed

| Item | Closed | Resolution |
|------|--------|------------|
| ActionModel status field & lifecycle | 2026-03-16 | Implemented — status + transition endpoints available |
| IndicatorModel status field & lifecycle | 2026-03-16 | Implemented — status + transition endpoints available |
| Token refresh mechanism | 2026-03-16 | Implemented — `POST /auth/refresh` with httpOnly cookie |
| `action_theme_id` filter on action-models | 2026-03-16 | Implemented |
| `community_id` filter on agents | 2026-03-16 | Implemented |
| Indicator reverse-lookup | 2026-03-06 | `IndicatorModelRead` now embeds `action_models[]` |
| Association metadata round-trip | 2026-03-05 | All 6 fields exist, confirmed working |
| Pagination `total_count` | 2026-03-06 | Added to `PaginatedResponse` |
| `updated_by` field on entities | 2026-03-16 | Implemented as `last_updated_by_id` |
| Token refresh httpOnly cookie (info) | 2026-03-16 | Expected behavior — documented for clarity |
| Sites API 500 Internal Server Error | 2026-03-23 | Fixed by backend |
| Multi-select filters AND vs OR (#2) | 2026-03-23 | Resolved — API switched from comma-separated string params to proper array params across all list endpoints |
