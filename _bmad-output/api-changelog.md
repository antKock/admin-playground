# API Changelog

Tracks API spec changes and frontend actions required. Each changeset lists detected changes with actions to take.

**Rules:**
- Every action must be resolved (`done` / `declined`) before the changeset can be marked **Applied** and the baseline JSON reset.
- `declined` requires a brief justification.

**Process:**
1. Fetch new OpenAPI spec, diff against baseline
2. Log changes below with frontend actions
3. Resolve all actions
4. Mark changeset as Applied, reset baseline

---

## Changeset: 2026-03-06 — Applied (baseline reset 2026-03-16)

*First major API review. All actions resolved through Epics 12-15.*

### Schema changes

| Change | Action | Status |
|--------|--------|--------|
| `ActionModelRead`: added `status` field + transition endpoints (`/publish`, `/disable`, `/activate`) | Implement status workflow in action-model detail & list | `done` (Epic 14.1) |
| `IndicatorModelRead`: added `status` field + transition endpoints | Implement status workflow in indicator-model detail & list | `done` (Epic 14.2) |
| `ActionModelRead`: `funding_program_id` → `funding_programs: FundingProgramRead[]` | Update frontend schemas & forms for multi-program | `done` (Epic 13.1) |
| `FolderModelRead`: same `funding_programs` change | Update frontend schemas & forms | `done` (Epic 13.1) |
| `IndicatorModelRead`: now embeds `action_models: ActionModelRead[]` | Remove client-side reverse-lookup filtering | `done` (Epic 13.1) |
| `PaginatedResponse`: added `total_count: integer\|null` | Implement "X sur Y" in table footers | `done` (Epic 13.4) |
| `FundingProgramRead`: added `is_active: boolean` | Add active/inactive badge & filter | `done` (Epic 13) |
| All entities: added `last_updated_at`, `last_updated_by_id` | Show in metadata grids, resolve user name | `done` (Epic 13.2) |
| `GET /indicator-models/`: added `type` filter param | Add type filter in indicator list | `done` (Epic 13.3) |
| `GET /action-models/`: added `action_theme_id` filter param | Add action theme filter in list | `done` (Epic 13.3) |
| `GET /agents/`: added `community_id` filter param | Add community filter in list | `done` (Epic 13.3) |

### New endpoints

| Endpoint | Action | Status |
|----------|--------|--------|
| History & Activity system (`GET /history/activities`, per-entity activities, versions, compare) | Implement activity feed page + detail page activity sections | `done` (Epic 12) |
| Token refresh (`POST /auth/refresh`, httpOnly cookie) | Implement silent token refresh with 401 interceptor | `done` (Epic 14.3) |
| Sites CRUD (`/sites/`) | Implement Sites feature module | `done` (Epic 15.1) |
| Buildings CRUD (`/buildings/`) + RNB linking | Implement Buildings feature module | `done` (Epic 15.2) |
| Admin role management (`/admin/roles/`) | Implement role badges & guards | `done` (Epic 14.4) |
| `GET /funding-programs/` `active_only` filter | Add active filter on funding programs list | `done` (Epic 13) |
| `POST /action-themes/{id}/duplicate` | Add "Dupliquer" action on action-theme detail | `declined` — not prioritized for v1, can be added later as a quick win |
| OAuth2 Client Credentials (`/oauth/`) | Build OAuth client management UI | `declined` — not admin scope for v1, revisit if needed |
| Actions & Folders instance management (`/actions/`, `/folders/`, `/indicators/`) | Build instance CRUD | `declined` — collectivité-facing, not admin scope |

---

## Changeset: 2026-03-23 — Pending

### Actions
| Change | Action | Status |
|--------|--------|--------|
| All list endpoint filter params changed from single `string\|uuid` to `array` type (affects 10 endpoints: action-models, action-themes, actions, agents, buildings, folder-models, folders, indicator-models, sites, users) | Adapted filter serialization: `FilterParams` type alias, `applyFilters()` helper, `buildFilters()` returns arrays, API loaders use `append()` for repeated params | `done` |

### Opportunities
| Capability | Description | Recommendation | Status |
|------------|-------------|----------------|--------|
| Hierarchical indicator associations — `IndicatorModelAssociationInput` gains `children_associations: ChildIndicatorModelAssociationInput[]`, `IndicatorModelWithAssociation` gains `children: ChildIndicatorModelWithAssociation[]` | Group indicators can now carry child indicator associations with their own rule parameters (hidden, required, disabled, default_value, duplicable, constrained) | Implemented: facade preserves children in all operations, indicator cards display nested children with param hints | `done` |

---

*Next changeset will be added here when a new API spec is detected.*
