# Backend Issues — UAT Epics 12-15

Generated: 2026-03-16

Issues discovered during UAT testing that require backend changes.

---

## 1. [BLOCKER] Sites API returns 500 Internal Server Error

**Severity:** P0 — Blocks entire Epic 15.1 (Sites CRUD)

**Reproduction:**
- Navigate to `/sites` in the admin UI
- Any `GET /sites/` call returns HTTP 500

**Expected:** Returns paginated list of sites.

**Impact:** All Sites CRUD operations are blocked — list, detail, create, edit, delete, and the buildings sub-list on site detail. Cross-navigation between Sites and Buildings is also broken.

**Frontend endpoints that depend on this:**
- `GET /sites/` — list sites (with cursor/limit/filters)
- `POST /sites/` — create site
- `GET /sites/{id}` — get site by ID
- `PUT /sites/{id}` — update site
- `DELETE /sites/{id}` — delete site
- `GET /sites/{siteId}/buildings` — list buildings for a site

---

## 2. [BUG] Multi-select comma-separated filters behave as AND instead of OR

**Severity:** P1 — Core filtering workflow broken

**Affected endpoints:** All list endpoints that accept comma-separated filter values, including:
- `GET /action-models/` (`status`, and any other filterable columns)
- `GET /agents/` (`status`, `community_id`)
- `GET /indicator-models/` (`status`, `type`, `action_model_id`)
- Any other list endpoint supporting multi-value filters

**Reproduction:**
1. Go to Action Models list
2. Open the Status column filter
3. Select both "Brouillon" (draft) and "Publié" (published)
4. Frontend sends: `GET /action-models/?status=draft,published`
5. API returns only items matching ALL values (AND) — effectively empty results

**Expected:** When a filter parameter contains comma-separated values (e.g. `status=draft,published`), the API should return items matching ANY of the values (OR behavior within a single filter).

**Design consideration:** The backend may want to support both AND and OR semantics. A common pattern is:
- Comma-separated values within a single parameter = OR (e.g. `status=draft,published` → draft OR published)
- Multiple different filter parameters = AND (e.g. `status=draft&type=number` → draft AND number type)

This gives users the ability to say "show me all items that are draft OR published" while still combining different filter dimensions with AND logic.

**Note:** The frontend sends comma-separated values in a single parameter (e.g. `status=draft,published`). This applies to all filterable columns, not just status.

---

## 3. [BUG] Activity history API rejects IndicatorModel, Building, Site entity types

**Severity:** P2 — Non-blocking but causes 400 errors on detail pages

**Affected endpoint:** `GET /history/{entity_type}/{entity_id}/activities`

**Reproduction:**
- Open any Indicator Model detail page → activity list triggers:
  `GET /history/IndicatorModel/{id}/activities?limit=20` → **400 Bad Request**
- Open any Building detail page → activity list triggers:
  `GET /history/Building/{id}/activities?limit=20` → **400 Bad Request**
- Sites would also be affected once the 500 is fixed:
  `GET /history/Site/{id}/activities?limit=20`

**Error response:**
```json
{
  "detail": "Invalid entity_type. Must be one of: Action, ActionModel, ActionTheme, Agent, Community, Folder, FolderModel, FundingProgram, Role, User"
}
```

**Request:** Add `IndicatorModel`, `Building`, and `Site` to the allowed `entity_type` values in the activity history endpoint.

---

## 4. [QUESTION] JWT role claim for frontend authorization

**Severity:** P1 — Security concern

**Context:** "Collectivité" users should NOT be able to access the admin UI. We've added a frontend guard that checks for a `role` claim in the JWT access token.

**Request:** Please confirm:
1. Does the JWT access token include a `role` claim? (e.g., `{ "role": "admin" }`)
2. If not, what claim name is used, or should one be added?
3. Should the backend also enforce a role check on admin API endpoints to reject "collectivité" users entirely?

---

## 5. [INFO] Token refresh — httpOnly cookie behavior

**Context:** During UAT, the tester noted they couldn't see the refresh token in the login API response. This is expected behavior — the refresh token is stored as an httpOnly cookie (not visible to JavaScript or in response body).

**No action needed** — documenting for clarity. The token refresh flow (`POST /auth/refresh` with `withCredentials: true`) works correctly by design.
