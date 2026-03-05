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
