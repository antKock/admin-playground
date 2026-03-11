# Backend Work Summary — Admin Playground

*Generated from API observations review (2026-03-05). Decisions confirmed by Anthony.*

---

## P0 — Blockers (blocks frontend epic completion)

### 1. ActionModel status field & lifecycle endpoints
Add `status` field (enum: `draft`, `published`, `disabled`) to `ActionModelRead` / `ActionModelCreate` / `ActionModelUpdate`.
Add transition endpoints following the existing ActionTheme pattern: `POST /action-models/{id}/publish`, `/disable`, `/activate`.
No transition constraints for now — just the field and endpoints.

### 2. IndicatorModel status field & lifecycle endpoints
Same as above for indicator models: `status` field (enum: `draft`, `published`, `disabled`) + transition endpoints.
No transition constraints for now.

---

## P1 — High priority

### 3. Token refresh mechanism
- Add `POST /auth/refresh` endpoint
- Access token TTL: 30 min
- Refresh token TTL: 15 days, with rotation (each refresh invalidates the previous token)
- Refresh token delivered as httpOnly cookie
- Note: login will eventually move to ProConnect SSO — keep the refresh mechanism decoupled from the auth provider

### 4. Multi-select OR filters on list endpoints
Accept comma-separated values on filter params across all list endpoints (e.g. `status=draft,published`). Currently the API errors on multiple values.

---

### 5. Indicator association parameter defaults — null convention
The `IndicatorModelActionModelLink` table has 3 rule fields: `visibility_rule`, `required_rule`, `editable_rule`.
Currently they default to `'true'`/`'false'` strings. Change all 3 column defaults to `null`.

**Convention:**
- `null` = no override, use system default (visible, editable, not required)
- `'true'` / `'false'` = explicit setting
- JSONLogic string = conditional rule

Field names stay positive and unchanged (no renaming). Only the default value changes. One migration.

**Why:** Frontend toggles show "ON" when an admin has actively configured a parameter. `null` = untouched = toggle OFF. Eliminates ambiguity about which string value is the "default" for each field.

---

## Quick wins (bundle into one ticket)

| # | What | Endpoint |
|---|------|----------|
| 6 | Add `action_theme_id` filter | `GET /action-models/` |
| 7 | Add `community_id` filter | `GET /agents/` |
| 8 | Add GET endpoint for community users | `GET /communities/{id}/users` (POST and DELETE already exist) |
| 9 | Add `technical_label` to `IndicatorModelWithAssociation` | Embedded schema field addition |
| 10 | Deprecate `GET /auth/users` | Migrate to `GET /users/` with pagination + `community_id` filter |

---

## Medium priority

### 11. `updated_by_id` field on all entities
Add `updated_by_id: UUID` to all entity read schemas. Frontend will resolve user names separately. Apply consistently to all entities.

### 12. Indicator reverse-lookup filter
Add `indicator_model_id` filter param to `GET /action-models/` so the frontend can show which action models use a given indicator.

### 13. Type-change constraint (backend-only)
Reject type changes on indicator models when they are published or have existing instances (FR27). This is a data integrity constraint — no frontend work needed.

---

## Deferred (no action now)

- **Indicator subtypes & list_values** — will be handled by human dev later
- **Full-text search** — backlog, filters cover current needs

---

## Epic 8-12 UAT — OpenAPI Verification (2026-03-11)

After UAT testing of Epics 8-12, several issues were suspected to be backend/API problems. We verified each against the live OpenAPI spec (`/openapi.json`). **All endpoints exist in the spec** — no new backend endpoints are needed for Epics 8-12.

### Findings

| UAT Issue | API Endpoint | In Spec? | Verdict |
|-----------|-------------|----------|---------|
| `total_count` missing from paginated responses | `PaginationMeta.total_count` | Yes (integer, min 0) | **Runtime issue** — field exists in schema but may not be populated. Backend should confirm it returns a value. |
| Community hierarchy (parents/children) not showing | `GET /communities/{id}/parents`, `GET /communities/{id}/children` | Yes | **Runtime/data issue** — endpoints exist. May be empty in test environment or API errors being swallowed by frontend. |
| Activity history not loading (entity-scoped) | `GET /history/activities`, `GET /history/{entity_type}/{entity_id}/activities` | Yes | **Runtime issue** — endpoints exist. Check if history records are being created. |
| Global activity feed empty | `GET /history/activities` with filters (`entity_type`, `action`, `since`) | Yes | Same as above — check if history is being recorded. |
| Users list not loading | `GET /users/` | Yes | **Runtime issue** — endpoint exists. Frontend correctly uses `/auth/register` for create. |
| Folder model detail missing funding programs | `FolderModelRead.funding_programs` (array of `FundingProgramRead`) | Yes | **Runtime/data issue** — field exists in schema. May be empty for test data. |
| FP `active_only` filter not working | `GET /funding-programs/` with `active_only` param | Yes | **Needs backend investigation** — param exists in spec but may not be filtering correctly. |
| Indicator "group" type not available | `IndicatorModelType` enum includes `"group"` | Yes | **Runtime issue** — value exists in enum. Check if UI is reading the correct field. |
| Indicator children not showing | `IndicatorModelRead.children` (array or null) | Yes | **Runtime/data issue** — field exists. May require group-type indicators to exist in test data. |

### Summary

**No new backend work is required for Epics 8-12.** All APIs are correctly specified. The UAT failures are likely caused by:

1. **Missing test data** — hierarchy, history records, and associations may not exist in the test environment
2. **Runtime errors being swallowed** — frontend may not be surfacing API errors (check browser console Network tab)
3. **`active_only` filter** — the only item worth a backend check; the filter parameter exists but may not be implemented correctly

### Recommended Next Steps

1. Test each failing endpoint directly via Swagger UI or curl to isolate frontend vs backend
2. Check browser console for HTTP errors on each failing page
3. Seed test data (community hierarchies, history records, indicator groups) and retest
4. If `total_count` is consistently 0 or missing, open a backend ticket
