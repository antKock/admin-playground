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

## Changeset: 2026-03-25 11:30 — Pending

### Schema changes

**New schemas (20):**
- `SectionModelCreate`, `SectionModelRead`, `SectionModelUpdate`, `SectionModelWithIndicators` — Section model CRUD for action/folder models
- `SectionType` enum: `application`, `progress`, `association_sites`, `association_agents`, `association_communities`, `additional_info`
- `SectionOwnerType` enum: `action_model`, `folder_model`, `community_model`, `agent_model`, `site_model`
- `SectionIndicatorModelRead`, `SectionChildIndicatorModelRead` — Indicator model data within sections (includes association rules)
- `SectionIndicatorAssociationInput` — Input for setting indicators on a section
- `ActionSectionRead`, `ActionSectionIndicator` — Section data on action instances (with indicator values)
- `FolderSectionRead`, `FolderSectionIndicator` — Section data on folder instances
- `ActionObjectAssociationCreate`, `ActionObjectAssociationRead` — Object associations on actions (sites, agents, communities)
- `ActionAssociationObjectBrief` — Brief associated object with indicators
- `AssociatedObjectType` enum: `site`, `agent`, `community`
- `EntityModelRead`, `EntityModelUpdate`, `EntityModelType` — Generic entity model configuration (community/agent/site models)

**Modified schemas:**
- `ActionModelRead`: added optional `sections: SectionModelWithIndicators[]`
- `ActionRead`: added optional `sections: ActionSectionRead[]`
- `FolderRead`: added optional `sections: FolderSectionRead[]`
- `IndicatorRead`: `action_id` now nullable; added `context_object_id`, `context_object_type`, `folder_id`, `section_model_id` (all nullable)

### Actions
| Change | Action | Status |
|--------|--------|--------|
| (none — all schema changes add optional fields to existing types; no existing frontend code references these fields) | No immediate frontend adaptation required | n/a |

### Opportunities
| Capability | Description | Recommendation | Status |
|------------|-------------|----------------|--------|
| Section model CRUD on action-models (`POST/PUT/DELETE /action-models/{id}/sections`, `PUT .../indicators`) | Admin can create/edit/delete sections on action models, and assign indicator models to sections with association rules | Major feature: add section management UI to action-model detail page. Could use a tab or collapsible panel pattern similar to existing indicator-association management. Sections group indicators by type (application, progress, associations, etc.) | `to evaluate` |
| Section model CRUD on folder-models (`POST/PUT/DELETE /folder-models/{id}/sections`, `PUT .../indicators`) | Same section management capability for folder models | Mirror the action-model section UI for folder-model detail. Same pattern, different owner type | `to evaluate` |
| `ActionModelRead.sections` — sections embedded in action model reads | Action model detail now includes its sections with nested indicator models | Display sections with their indicators in action-model detail view (read-only summary or inline editing) | `to evaluate` |
| `ActionRead.sections` / `FolderRead.sections` — structured section data on instances | Action and folder instances now carry section-grouped indicators with values | Collectivité-facing; could be useful if admin ever needs a read-only view of instance data | `declined` — collectivité-facing instance data, not admin scope for v1 |
| Action object associations (`POST/GET/DELETE /actions/{id}/associations`) | Associate sites, agents, communities to action instances | Collectivité-facing instance feature | `declined` — not admin scope |
| Entity models CRUD (`GET /entity-models/`, `GET/PUT /entity-models/{entity_type}`) | Configure entity models (community, agent, site) with name, description, and sections | New admin capability: manage entity model definitions. Lightweight — just name/description editing per entity type. Could be a simple settings page | `to evaluate` |
| `IndicatorRead` — new `folder_id`, `context_object_id`, `context_object_type`, `section_model_id` fields | Indicators now carry context about which folder/section/object they belong to | No admin action needed — enriches instance-level indicator reads | `declined` — collectivité-facing context fields |

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
