# API Spec Review — Architect Assessment (2026-03-06)

*Party-mode briefing document. Captures the full architect analysis of the staging OpenAPI spec vs. current api-observations.md.*

---

## Context

The staging API (`laureatv2-api-staging.osc-fr1.scalingo.io/openapi.json`) was reviewed on 2026-03-06 against the living `api-observations.md` document (last backend review: 2026-03-05). The API has evolved significantly since the original observations were written.

## What Got Resolved (Good News)

### 1. Pagination `total_count` — RESOLVED
`PaginatedResponse_T_` now includes `total_count (integer|null)`. We can implement "Showing X of Y" in all table footers. Previously OPEN.

### 2. Indicator Reverse-Lookup (#12) — RESOLVED
`IndicatorModelRead` now embeds `action_models: ActionModelRead[]` directly. The reverse-lookup is built into the model response — no separate endpoint needed. Previously DECISION REQUIRED, Anthony wanted this. **Frontend can remove the client-side filtering workaround.**

### 3. Multi-Program Support — Schema Improved
`ActionModelRead` and `FolderModelRead` now use `funding_programs: FundingProgramRead[]` (array of full objects) instead of single `funding_program_id`. This is a breaking schema change for our frontend interfaces.

### 4. Indicator Type Filter — New
`GET /indicator-models/` now accepts `type: IndicatorModelType` filter. Ready for use.

## What's Still Blocked (No Change)

| Item | Status | Anthony's Decision |
|---|---|---|
| ActionModel status (P0) | Still no `status` field | Option A decided (independent status + transitions) |
| IndicatorModel status (P0) | Still no `status` field | draft/published/disabled needed |
| Token refresh (P1) | Still no `/auth/refresh` | 15-day session, ProConnect SSO future |
| Multi-select OR filters (P1) | Still single-value only | No-brainer, backend ticket pending |
| `action_theme_id` filter (P2) | Still missing on action-models | No-brainer, backend ticket pending |
| `community_id` filter (P2) | Still missing on agents | No-brainer, backend ticket pending |
| `GET /communities/{id}/users` | Still missing | No-brainer, backend ticket pending |
| `updated_by` field (P2) | Still missing on all entities | Backend dev decides approach |
| Full-text search (P3) | Still missing | Deferred |

## Items Needing Verification (Potential Regressions)

1. **`technical_label` on `IndicatorModelRead`** — not visible in latest spec. Previously confirmed present. Could be spec generation artifact or actual removal. Critical for indicator UX.
2. **`communities` on `UserRead`** — not visible in latest spec. Previously optional. Frontend relies on it for community-user views.

## Major New API Capabilities (Opportunities)

### Tier 1: High Value, Ready Now

| Capability | Endpoints | Admin-Playground Impact |
|---|---|---|
| **History & Activity Log** | 10+ endpoints under `/history/` | Activity feed, entity history tabs, version comparison, notification bell. Partially solves `updated_by` gap via `ActivityResponse.user_name`. |
| **ActionTheme Duplication** | `POST /action-themes/{id}/duplicate` | "Duplicate" button on theme list/detail. Low effort, high UX value. |
| **FundingProgram `is_active`** | Field + `active_only` filter | Active/inactive toggle in funding programs list. |
| **`total_count` in pagination** | All list endpoints | "Showing X of Y" table footers. |
| **`type` filter on indicators** | `GET /indicator-models/?type=` | Filter dropdown in indicator list. |

### Tier 2: New Domains (Need Product Decision)

| Capability | Endpoints | Question |
|---|---|---|
| **OAuth2 Client Management** | CRUD under `/oauth/clients` | Is API integration management in admin scope? |
| **Admin Role Management** | `/admin/roles/` + user role assignment | Is user role management in admin scope? |
| **Sites & Buildings** | Full CRUD, community-scoped | Are these admin-managed or collectivité-only? |

### Tier 3: Instance Management (Likely Out of Scope)

| Capability | Note |
|---|---|
| Actions CRUD + beneficiaries | Collectivité-facing, not admin |
| Folders CRUD + status workflow | Collectivité-facing. `next_possible_statuses` pattern is noteworthy. |
| Indicators CRUD + duplication | Collectivité-facing. Duplication uses `duplicable_enabled` link metadata. |

## Frontend Schema Updates Required

These changes must be reflected in our Angular interfaces regardless of new feature decisions:

1. `ActionModelRead.funding_program_id` → `funding_programs: FundingProgramRead[]`
2. `FolderModelRead.funding_program_id` → `funding_programs: FundingProgramRead[]`
3. `IndicatorModelRead` — add `action_models: ActionModelRead[]`
4. `PaginatedResponse<T>` — add `total_count: number | null`
5. Verify `technical_label` and `communities` field status

## Recommended v1.2 Scope (Architect Opinion)

**Quick wins (can be done now, no backend dependency):**
1. Update frontend schemas for `funding_programs[]`, `action_models[]`, `total_count`
2. Add "Duplicate" action to ActionTheme feature
3. Add `total_count` display to all table footers
4. Add `type` filter to indicator-models list
5. Add `active_only` filter to funding-programs list

**Medium-term (v1.2 epic candidates):**
1. History/Activity tab on entity detail views
2. Notification panel in shell (activity feed)
3. Admin role management UI (if in scope)

**Blocked (still waiting on backend):**
- ActionModel status workflow
- IndicatorModel status workflow
- Multi-select OR filters
- Missing filter params (action_theme_id, community_id)

---

*This document is designed to be consumed by all BMAD agents in party mode for v1.2 planning.*
