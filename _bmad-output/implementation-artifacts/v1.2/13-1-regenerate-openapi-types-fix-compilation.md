# Story 13.1: Regenerate OpenAPI Types & Fix Compilation Errors

Status: done

## Story

As an operator,
I want the admin interface to reflect the latest API schema,
So that all entity types, fields, and endpoints are correctly mapped.

## Acceptance Criteria

1. **Given** the live OpenAPI spec has changed **When** types are regenerated **Then** `api-types.ts` reflects all current schemas including ActionModelStatus, IndicatorModelStatus, new fields
2. **Given** association rule fields were renamed **When** the build runs **Then** all references use new field names: `hidden_rule`, `disabled_rule`, `required_rule`, `default_value_rule`, `duplicable_rule`, `constrained_rule` — zero compilation errors
3. **Given** the association parameter UI uses FR labels **When** displayed **Then** labels map directly: Obligatoire → `required_rule`, Non editable → `disabled_rule`, Masque → `hidden_rule`, Valeur par defaut → `default_value_rule`, Duplicable → `duplicable_rule`, Valeurs contraintes → `constrained_rule`
4. **Given** `updated_at` was renamed to `last_updated_at` on all entities **When** metadata grids and stores reference timestamps **Then** they use `last_updated_at`
5. **Given** all changes are applied **When** `npx ng build` and `npx ng test --no-watch` run **Then** zero compilation errors and zero test regressions

## Tasks / Subtasks

- [x] Task 1: Regenerate API types (AC: #1)
  - [x] Run `npx openapi-typescript https://laureatv2-api-staging.osc-fr1.scalingo.io/openapi.json -o src/app/core/api/generated/api-types.ts`
  - [x] Verify ActionModelRead now has `status`, `last_updated_by_id`, `funding_program`, `action_theme`, `indicator_models`
  - [x] Verify IndicatorModelRead now has `status`, `technical_label`, `children`, `last_updated_by_id`
  - [x] Verify IndicatorModelType includes `group`
  - [x] Verify IndicatorModelWithAssociation has renamed fields
  - [x] Verify PaginationMeta has `total_count`, `has_next_page`, `has_previous_page`, `cursors`, `_links`
- [x] Task 2: Fix association rule field renames (AC: #2, #3)
  - [x] Find all references to `visibility_rule` → rename to `hidden_rule`
  - [x] Find all references to `editable_rule` → rename to `disabled_rule`
  - [x] Find all references to `duplicable.enabled`, `duplicable.min_count`, `duplicable.max_count` → replace with `duplicable_rule` (single string)
  - [x] Find all references to `constrained_values.enabled`, `constrained_values.min_value`, `constrained_values.max_value` → replace with `constrained_rule` (single string)
  - [x] Update association parameter labels to FR: Obligatoire, Non editable, Masque, Valeur par defaut, Duplicable, Valeurs contraintes
  - [x] No semantic inversion needed — API field names now match UI intent directly (all "off by default, toggle on to activate")
- [x] Task 3: Fix timestamp field renames (AC: #4)
  - [x] Find all references to `updated_at` → rename to `last_updated_at` across all entities
  - [x] Update MetadataGrid configs, store mappings, formatDateFr calls
- [x] Task 4: Fix any other type mismatches surfaced by compilation (AC: #5)
  - [x] Run `npx ng build` and fix all errors
  - [x] Run `npx ng test --no-watch` and fix all failures
  - [x] Verify domain model re-exports in `*.models.ts` files still work

## Dev Notes

### Regeneration Command

```bash
npx openapi-typescript https://laureatv2-api-staging.osc-fr1.scalingo.io/openapi.json -o src/app/core/api/generated/api-types.ts
```

### Association Rule Field Mapping (Old → New)

| Old Field | New Field | Default | Semantics |
|---|---|---|---|
| `visibility_rule` | `hidden_rule` | `"false"` | Off = visible, On = hidden |
| `editable_rule` | `disabled_rule` | `"false"` | Off = editable, On = disabled |
| `required_rule` | `required_rule` | `"false"` | Unchanged |
| `default_value_rule` | `default_value_rule` | `"false"` | Unchanged |
| `duplicable: { enabled, min_count, max_count }` | `duplicable_rule` | `"false"` | Collapsed to single rule string |
| `constrained_values: { enabled, min_value, max_value }` | `constrained_rule` | `"false"` | Collapsed to single rule string |

All six are "off by default" toggles. The UI labels are:
- Obligatoire (`required_rule`)
- Non editable (`disabled_rule`)
- Masque (`hidden_rule`)
- Valeur par defaut (`default_value_rule`)
- Duplicable (`duplicable_rule`)
- Valeurs contraintes (`constrained_rule`)

### Key Schema Changes to Watch For

- `ActionModelRead.funding_program_id` (UUID) still exists alongside `funding_program` (embedded FundingProgramRead)
- `ActionModelRead.action_theme_id` (UUID) still exists alongside `action_theme` (embedded ActionThemeRead)
- `ActionModelRead.indicator_models` is `IndicatorModelWithAssociation[]` (embedded)
- `AgentRead` fields: `first_name`, `last_name`, `email`, `phone`, `position`, `public_comment`, `internal_comment`, `agent_type`, `community` (embedded), `next_possible_statuses`
- `FundingProgramRead` new fields: `budget`, `start_date`, `end_date`, `folder_model_id`
- `ActionThemeRead` new fields: `technical_label`, `icon`, `color`
- `RoleType` enum: `collectivite`, `cdm`, `admin`

### References

- [Source: src/app/core/api/generated/api-types.ts — regeneration target]
- [Source: src/app/domains/action-models/ — action model domain files]
- [Source: src/app/domains/indicator-models/ — indicator model domain files]
- [Source: src/app/features/action-models/ — action model feature files]
- [Source: src/app/features/indicator-models/ — indicator model feature files]
- [Source: _bmad-output/implementation-artifacts/v1/3-5-indicator-parameter-configuration-6-parameters.md — original association parameter implementation]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References

### Completion Notes List
- Regenerated api-types.ts from live staging OpenAPI spec (openapi-typescript 7.13.0)
- Rewrote IndicatorParams interface: all 6 fields are now simple `string | null` (hidden_rule, required_rule, disabled_rule, default_value_rule, duplicable_rule, constrained_rule)
- Simplified IndicatorCardComponent toggle handlers — duplicable/constrained now use simple string rules instead of complex objects
- Simplified ActionModelFacade association mapping — all rules now follow uniform `ruleForApi(value, 'false')` pattern
- Renamed updated_at → last_updated_at across all 8 detail components, 8 list components, 19 spec files
- Added required `status: 'draft'` to ActionModelCreate and IndicatorModelCreate payloads (now required by API schema)
- All RULE_DEFAULTS now uniformly `'false'` — simplified from mixed `'true'`/`'false'` defaults
- 75 test files pass, 893 tests pass, zero regressions

### Change Log
- 2026-03-13: Regenerated OpenAPI types, fixed all association rule renames, timestamp renames, and new required fields. Zero build errors, zero test failures.

### File List
- src/app/core/api/generated/api-types.ts (regenerated)
- src/app/shared/components/indicator-card/indicator-card.component.ts (rewritten IndicatorParams, RuleField, toggle handlers)
- src/app/shared/components/indicator-card/indicator-card.component.spec.ts (updated for new field names)
- src/app/features/action-models/action-model.facade.ts (rewritten association mapping)
- src/app/features/action-models/action-model.facade.spec.ts (updated mocks)
- src/app/features/action-models/ui/action-model-detail.component.ts (updated_at → last_updated_at, serverCards computed)
- src/app/features/action-models/ui/action-model-detail.component.spec.ts (updated params mock)
- src/app/features/action-models/ui/action-model-form.component.ts (added status: 'draft')
- src/app/features/action-models/ui/action-model-list.component.ts (updated_at column key)
- src/app/features/indicator-models/ui/indicator-model-detail.component.ts (updated_at → last_updated_at)
- src/app/features/indicator-models/ui/indicator-model-list.component.ts (updated_at column key)
- src/app/features/indicator-models/ui/indicator-model-form.component.ts (added status: 'draft')
- src/app/features/indicator-models/indicator-model.facade.spec.ts (added status, updated_at rename)
- src/app/features/indicator-models/ui/indicator-model-list.component.spec.ts (updated_at rename)
- src/app/features/agents/ui/agent-detail.component.ts (updated_at → last_updated_at)
- src/app/features/agents/ui/agent-list.component.ts (updated_at column key)
- src/app/features/agents/agent.facade.spec.ts (updated_at rename)
- src/app/features/agents/ui/agent-list.component.spec.ts (updated_at rename)
- src/app/features/communities/ui/community-detail.component.ts (updated_at → last_updated_at)
- src/app/features/communities/ui/community-list.component.ts (updated_at column key)
- src/app/features/communities/community.facade.spec.ts (updated_at rename)
- src/app/features/communities/ui/community-list.component.spec.ts (updated_at rename)
- src/app/features/folder-models/ui/folder-model-detail.component.ts (updated_at → last_updated_at)
- src/app/features/folder-models/ui/folder-model-list.component.ts (updated_at column key)
- src/app/features/folder-models/folder-model.facade.spec.ts (updated_at rename)
- src/app/features/folder-models/ui/folder-model-list.component.spec.ts (updated_at rename)
- src/app/features/funding-programs/ui/funding-program-detail.component.ts (updated_at → last_updated_at)
- src/app/features/funding-programs/ui/funding-program-list.component.ts (updated_at column key)
- src/app/features/funding-programs/funding-program.facade.spec.ts (updated_at rename)
- src/app/features/users/ui/user-detail.component.ts (updated_at → last_updated_at)
- src/app/features/users/ui/user-list.component.ts (updated_at column key)
- src/app/features/users/user.facade.spec.ts (updated_at rename)
- src/app/features/action-themes/ui/action-theme-detail.component.ts (updated_at → last_updated_at)
- src/app/features/action-themes/ui/action-theme-list.component.ts (updated_at column key)
- src/app/features/action-themes/action-theme.facade.spec.ts (updated_at rename)
- src/app/shared/services/variable-dictionary.service.ts (SKIP_PROPERTIES updated)
- src/app/shared/services/variable-dictionary.service.spec.ts (updated_at rename, field renames)
- src/app/domains/action-models/action-model.store.spec.ts (added status, updated_at rename)
- src/app/domains/indicator-models/indicator-model.store.spec.ts (added status, updated_at rename)
- src/app/domains/communities/community.store.spec.ts (updated_at rename)
- src/app/domains/agents/agent.store.spec.ts (updated_at rename)
- src/app/domains/funding-programs/funding-program.store.spec.ts (updated_at rename)
- src/app/domains/action-themes/action-theme.store.spec.ts (updated_at rename)
- src/app/domains/folder-models/folder-model.store.spec.ts (updated_at rename)
