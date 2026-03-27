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

## Changeset: 2026-03-27 14:37 — Applied (baseline reset: 2026-03-27 19:05)

### Schema changes

**New schemas (19):**
- `SectionModelCreate`, `SectionModelRead`, `SectionModelUpdate`, `SectionModelWithIndicators` — Section model CRUD with individual rule strings (`hidden_rule`, `disabled_rule`, `required_rule`, `occurrence_min_rule`, `occurrence_max_rule`, `constrained_rule`)
- `SectionKey` enum: `application`, `progress`, `financial`, `additional_info`, `agents`, `communities`, `buildings`
- `AssociationEntityType` enum: `agents`, `buildings`, `communities`
- `EntityModelType` enum: `community`, `agent`, `site`
- `SectionIndicatorModelRead`, `SectionChildIndicatorModelRead` — Indicator model data within sections (includes rule strings and children)
- `SectionIndicatorAssociationInput` — Input for setting indicators on a section (7 rule strings + position)
- `ActionSectionBrief`, `ActionSectionWithIndicators` — Section data on action instances (brief for list, full with indicators and associations)
- `ActionAssociationWithIndicators` — Associated object with nested indicators
- `ActionObjectAssociationCreate`, `ActionObjectAssociationRead` — Object associations on actions
- `FolderSectionRead`, `FolderSectionIndicator` — Section data on folder instances
- `EntityModelRead`, `EntityModelUpdate` — Entity model configuration (community/agent/site models) with embedded sections

**Modified schemas:**
- `ActionModelRead`: added optional `sections: SectionModelWithIndicators[]`
- `ActionRead`: added optional `sections: ActionSectionBrief[]`, `sections_positions: Record<string, integer>`
- `FolderModelRead`: added optional `sections: SectionModelWithIndicators[]`
- `FolderRead`: added optional `sections: FolderSectionRead[]`
- `IndicatorRead`: `action_id` now nullable and no longer required; added `folder_id`, `section_model_id`, `context_object_id`, `context_object_type` (all nullable)

**Removed endpoints (1):**
- `GET /actions/{action_id}/indicators` — replaced by section-based `GET /actions/{action_id}/sections`

**New endpoints (23):**
- Action model sections: `POST/PUT/DELETE /action-models/{id}/sections/{section_id}`, `PUT .../indicators`
- Folder model sections: `POST/PUT/DELETE /folder-models/{id}/sections/{section_id}`, `PUT .../indicators`
- Entity model CRUD + sections: `GET /entity-models/`, `GET/PUT /entity-models/{entity_type}`, `POST/PUT/DELETE .../sections/{section_id}`, `PUT .../indicators`
- Action instance sections: `GET /actions/{id}/sections`, `GET .../sections/{key}`, associations CRUD on `GET/POST/GET/DELETE .../sections/{key}/associations`

### Actions
| Change | Action | Status |
|--------|--------|--------|
| `GET /actions/{action_id}/indicators` removed | No frontend code calls this endpoint — no adaptation needed | n/a |
| `IndicatorRead.action_id` now nullable / not required | No frontend code reads `IndicatorRead` — no adaptation needed | n/a |

### Opportunities
| Capability | Description | Recommendation | Status |
|------------|-------------|----------------|--------|
| Section model CRUD on action-models | Admin can create/edit/delete sections on action models, assign indicator models to sections with rule strings | Already implemented (Epic 18) — action-model API, store, facade, and section-card components are in place | `done` |
| Section model CRUD on folder-models (`POST/PUT/DELETE /folder-models/{id}/sections`, `PUT .../indicators`) | Same section management for folder models; `FolderModelRead.sections` now embedded (backend request #13 resolved) | Mirror the action-model section UI for folder-model detail — same shared section-card components. Now unblocked. | `done` — Epic 19 (Stories 19.1, 19.2) |
| Entity models CRUD + section management (`GET/PUT /entity-models/{entity_type}`, section sub-endpoints) | Full entity model configuration with sections and indicator assignment (backend request #14 resolved) | New admin capability: manage community/agent/site model definitions with same section management pattern. Reuse section-card components. | `done` — Epic 20 (Stories 20.1, 20.2, 20.3) |
| `ActionRead.sections` / `FolderRead.sections` — structured section data on instances | Action and folder instances carry section-grouped indicators with values | Collectivité-facing instance data | `declined` — not admin scope for v1 |
| Action section associations (`GET/POST/DELETE /actions/{id}/sections/{key}/associations`) | Associate objects (sites, agents, buildings) to action sections | Collectivité-facing instance feature | `declined` — not admin scope |
| `IndicatorRead` — new `folder_id`, `context_object_id`, `context_object_type`, `section_model_id` fields | Indicators carry context about which folder/section/object they belong to | Enriches instance-level indicator reads only | `declined` — collectivité-facing context fields |

---

## Changeset: 2026-03-25 11:30 — Superseded (replaced by 2026-03-27 14:37)

*This changeset was superseded because the API evolved significantly between 2026-03-25 and 2026-03-27 — many schema names and shapes changed (e.g., `SectionType` → `SectionKey`, `SectionOwnerType` removed, `ActionSectionRead` → `ActionSectionBrief`/`ActionSectionWithIndicators`), new endpoints were added, and one endpoint was removed. A fresh changeset was created to accurately reflect the current state.*

---

## Changeset: 2026-03-25 10:00 — Applied (baseline reset: 2026-03-25 10:49)

### Actions
| Change | Action | Status |
|--------|--------|--------|
| `IndicatorModelType` enum: `text` removed, replaced by `text_short`, `text_long`, `text_email`, `text_phone`, `text_iban`; 9 new types added (`list_single`, `list_multiple`, `boolean`, `file_upload`, `file_downloadable`, `date_full`, `date_month`, `date_year`) | **indicator-model-list**: update `filterOptions` — 15 type options with FR labels | `done` |
| (same) | **indicator-model-facade**: type cast updated to `as IndicatorModelType` | `done` |
| (same) | **variable-dictionary**: `mapIndicatorType()` rewritten for all 15 types | `done` |
| (same) | **tests**: all fixtures updated across 5+ spec files | `done` |
| `duplicable_rule` → `occurrence_rule` (flat string → `OccurrenceRule { min, max }`) on 6 association/indicator schemas | **indicator-card component**: migrated to `occurrence_rule` with min/max UI | `done` |
| (same) | **indicator-param-editor**: `IndicatorParams` updated, comparison logic rewritten | `done` |
| (same) | **build-association-inputs**: mapping updated with `occurrenceRuleForApi()` | `done` |
| (same) | **build-indicator-cards**: `occurrenceState()` helper added | `done` |
| (same) | **action-model facade**: default params use `occurrence_rule: { min, max }` | `done` |
| (same) | **tests**: all specs updated | `done` |
| `unit` field changed from freeform `string` to `IndicatorModelUnit` enum | **indicator-model form**: freetext input → `<select>` dropdown with 43 unit options | `done` |
| `ActionModelAssociationInput` / `IndicatorModelAssociationInput`: added `position` field | **build-association-inputs**: `position` included using array index | `done` |

### Opportunities
| Capability | Description | Recommendation | Status |
|------------|-------------|----------------|--------|
| `GET /actions/` — new `sort` query param | Multi-field sorting on actions list | `declined` — no actions feature module exists yet; will implement when actions feature is scaffolded |
| `IndicatorRead` — new `value_boolean`, `value_date`, `selected_choices` fields | Indicators can carry boolean, date, and choice values | `declined` — collectivité-facing indicator instances are not admin scope |
| `IndicatorModelCreate/Read/Update` — new `choices` field | Choices management for `list_single` / `list_multiple` types | Implemented: sub-form with value/label inputs, pre-populated in edit mode, shown in detail view | `done` |
| New schemas: `OccurrenceRule`, `IndicatorModelUnit`, `IndicatorModelChoiceInput/Read`, `SelectedChoiceRead` | Richer type system for indicator configuration | Covered by actions and choices implementation above | `done` |

---

## Changeset: 2026-03-23 — Applied (baseline reset: 2026-03-23)

### Actions
| Change | Action | Status |
|--------|--------|--------|
| All list endpoint filter params changed from single `string\|uuid` to `array` type (affects 10 endpoints: action-models, action-themes, actions, agents, buildings, folder-models, folders, indicator-models, sites, users) | Adapted filter serialization: `FilterParams` type alias, `applyFilters()` helper, `buildFilters()` returns arrays, API loaders use `append()` for repeated params | `done` |

### Opportunities
| Capability | Description | Recommendation | Status |
|------------|-------------|----------------|--------|
| Hierarchical indicator associations — `IndicatorModelAssociationInput` gains `children_associations: ChildIndicatorModelAssociationInput[]`, `IndicatorModelWithAssociation` gains `children: ChildIndicatorModelWithAssociation[]` | Group indicators can now carry child indicator associations with their own rule parameters (hidden, required, disabled, default_value, duplicable, constrained) | Implemented: facade preserves children in all operations, indicator cards display nested children with param hints | `done` |

---

## Changeset: 2026-03-06 — Applied (baseline reset: 2026-03-16)

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
