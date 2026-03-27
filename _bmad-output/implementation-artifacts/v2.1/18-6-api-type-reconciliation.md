# Story 18.6: API Type Reconciliation (SectionType → SectionKey)

Status: done

## Story

As a developer,
I want the Epic 18 section code to align with the current API types (changeset 2026-03-27),
So that the app builds successfully against the regenerated `api-types.ts` and Epics 19/20 can proceed.

## Context

Epic 18 (stories 18.1–18.5) was implemented against the 2026-03-25 API spec. The backend evolved between 03-25 and 03-27 — the 03-25 changeset was superseded. The code still compiles against the old generated types, but the regenerated `api-types.ts` (currently unstaged in git) reflects the new API shapes. This story reconciles the frontend code.

### API changes to reconcile

| Old (in code) | New (current API) | Impact |
|---|---|---|
| `SectionType` enum | `SectionKey` enum | Type alias rename |
| `section_type` field on SectionModelCreate/Read | `key` field | Field rename in create payloads, computed signals, type references |
| `association_sites` / `association_agents` / `association_communities` (section keys) | `buildings` / `agents` / `communities` + `association_entity_type: AssociationEntityType` field | Association sections now identified by `association_entity_type` field, not key prefix. Keys are flat. |
| `SectionOwnerType` enum, `owner_type`/`owner_id` fields | Removed | Delete any references |
| `duplicable_rule` on `SectionIndicatorAssociationInput` | `occurrence_min_rule` + `occurrence_max_rule` (strings) | Field rename in build-section-association-inputs |
| `financial` section key not in SECTION_TYPE_MAP | `SectionKey` includes `financial` | Add to type map (label: "Financier", icon: "💰") |

### NOT in scope (pending backend alignment)

- `occurrence_min_rule` / `occurrence_max_rule` → `occurrence_rule: { min, max }` on section schemas — backend will align this in a future update. Keep current flat strings for now.

## Acceptance Criteria

1. **Build passes with regenerated types**
   - Given `api-types.ts` has been regenerated from the 03-27 spec
   - When `npx ng build` is run
   - Then the build succeeds with zero errors

2. **All existing tests pass**
   - Given the type reconciliation changes are applied
   - When `npx ng test --no-watch` is run
   - Then all tests pass (including all Epic 18 test files)

3. **Section type mapping updated**
   - Given the `SECTION_TYPE_MAP` in `section-card.models.ts`
   - When the map is updated
   - Then keys use `SectionKey` values: `buildings`, `agents`, `communities`, `application`, `progress`, `financial`, `additional_info`
   - And the `SectionType` alias is renamed to `SectionKey`

4. **Association section logic uses `association_entity_type`**
   - Given association sections are identified in the code
   - When filtering/grouping sections by association vs fixed
   - Then the logic uses the `association_entity_type` field (non-null = association section) instead of key prefix matching

5. **Section creation uses `key` field**
   - Given a section is created via POST
   - When the payload is built
   - Then it uses `key: SectionKey` (not `section_type`)

## Tasks / Subtasks

- [x] Task 1: Update section-card models
  - [x] 1.1 Rename `SectionType` → `SectionKey` alias (points to `components['schemas']['SectionKey']`)
  - [x] 1.2 Update `SECTION_TYPE_MAP` keys: `association_sites` → `buildings`, `association_agents` → `agents`, `association_communities` → `communities`
  - [x] 1.3 Add `financial` entry: `{ label: 'Financier', icon: '💰' }`
  - [x] 1.4 Update `ASSOCIATION_SECTION_TYPES` array to use new keys: `['buildings', 'agents', 'communities']`
  - [x] 1.5 Update `FIXED_SECTION_TYPES` — kept `application`, `progress` (financial not a fixed section)
  - [x] 1.6 Update any `isAssociationSection()` helper to use `association_entity_type` field instead of key prefix

- [x] Task 2: Update action-model facade
  - [x] 2.1 Replace `section_type` → `key` in section create payloads (`ensureSectionExists`, `toggleAssociationSection`)
  - [x] 2.2 Update section grouping logic (`associationSections`, `fixedSections` computed) to use `association_entity_type` field
  - [x] 2.3 Update `DisplaySection` type — now uses `key` field from `SectionModelWithIndicators`
  - [x] 2.4 Update any `SectionType` type annotations → `SectionKey`

- [x] Task 3: Update action-model feature store
  - [x] 3.1 Update section grouping computed signals to use `association_entity_type` via `isAssociationSection()`

- [x] Task 4: Update build utilities
  - [x] 4.1 `build-section-indicator-cards.ts` — no `section_type` references found (already clean)
  - [x] 4.2 `build-section-association-inputs.ts` — replaced `duplicable_rule` with `occurrence_min_rule` + `occurrence_max_rule`

- [x] Task 5: Update detail component
  - [x] 5.1 Update template references from `section_type` to `key`
  - [x] 5.2 Update type annotations (`SectionType` → `SectionKey`)

- [x] Task 6: Update tests
  - [x] 6.1 Update test fixtures: section objects use `key` instead of `section_type`, new key values
  - [x] 6.2 Remove `owner_type` / `owner_id` from test fixtures
  - [x] 6.3 Replace `duplicable_rule` with `occurrence_min_rule` / `occurrence_max_rule` in indicator fixtures
  - [x] 6.4 All tests pass: 111 files, 1221 tests

- [x] Task 7: Verify build
  - [x] 7.1 `npx ng build` — succeeds
  - [x] 7.2 `npx ng lint` — passes (0 errors, 1 pre-existing warning)

## Dev Agent Record

### Implementation Plan
Type reconciliation — renamed SectionType→SectionKey, updated field names (section_type→key), replaced duplicable_rule with occurrence_min/max_rule, changed association section identification to use association_entity_type field, removed owner_type/owner_id references, added financial section key.

### Completion Notes
- All 7 tasks completed successfully
- Build passes, all 1221 tests pass, lint clean
- No behavior changes — strictly type/field alignment

## File List
- `src/app/shared/components/section-card/section-card.models.ts` — SectionType→SectionKey, new map keys, isAssociationSection uses association_entity_type
- `src/app/shared/components/section-card/section-card.component.ts` — SectionType→SectionKey
- `src/app/shared/components/section-card/section-card.component.spec.ts` — SectionType→SectionKey
- `src/app/features/action-models/action-model.facade.ts` — section_type→key, SectionType→SectionKey, duplicable_rule→occurrence rules, removed owner_type/owner_id
- `src/app/features/action-models/action-model.store.ts` — isAssociationSection(s) uses object form
- `src/app/features/action-models/use-cases/build-section-association-inputs.ts` — duplicable_rule→occurrence_min/max_rule
- `src/app/features/action-models/use-cases/build-section-association-inputs.spec.ts` — fixture updates
- `src/app/features/action-models/use-cases/build-section-indicator-cards.spec.ts` — fixture updates
- `src/app/features/action-models/action-model.facade.spec.ts` — fixture updates (key, no owner, new section keys, occurrence rules)
- `src/app/features/action-models/ui/action-model-detail.component.ts` — SectionType→SectionKey, section_type→key
- `src/app/features/action-models/ui/action-model-detail.component.html` — section_type→key

## Change Log
- 2026-03-27: Reconciled Epic 18 code with 2026-03-27 API types (SectionType→SectionKey, key field, association_entity_type, occurrence rules)

## Dev Notes

### Architecture & Patterns

- This is a **reconciliation story**, not new functionality. The goal is aligning existing code with the regenerated API types.
- **Do not change behavior** — only update type references, field names, and test fixtures.
- **Association section identification**: the key change is that association sections are no longer identified by a key prefix (`association_*`). Instead, the `association_entity_type` field is non-null for association sections and null for fixed sections. This is a cleaner pattern.

### Key File Locations

- `src/app/shared/components/section-card/section-card.models.ts` — SECTION_TYPE_MAP, helpers
- `src/app/shared/components/section-card/section-params-editor.component.ts` — SectionParams interface
- `src/app/features/action-models/action-model.facade.ts` — section methods, DisplaySection
- `src/app/features/action-models/action-model.store.ts` (feature store) — section computed signals
- `src/app/features/action-models/use-cases/build-section-indicator-cards.ts` — indicator mapping
- `src/app/features/action-models/use-cases/build-section-association-inputs.ts` — API input mapping
- `src/app/features/action-models/ui/action-model-detail.component.ts` + `.html`
- `src/app/domains/action-models/action-model.models.ts` — type re-exports

### Critical Guardrails

- **DO NOT** change occurrence rule handling on sections — keep `occurrence_min_rule` / `occurrence_max_rule` as flat strings. Backend will align to `OccurrenceRule { min, max }` in a future update.
- **DO NOT** add new features — this is strictly a type alignment story
- **DO NOT** modify the section-params-editor SectionParams interface — it already uses the correct field names
- **Verify** the regenerated `api-types.ts` is committed before starting this work

### Testing Standards

- Run `npx ng test --no-watch` (never `npx vitest run`)
- All existing tests must pass after reconciliation
- Update fixtures, not assertions — the behavior hasn't changed
