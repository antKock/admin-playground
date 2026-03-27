# Story 19.1: Fixed Sections Display on Folder Models

Status: done

**Blocker resolved (2026-03-27):** `FolderModelRead` now includes `sections?: SectionModelWithIndicators[]` — backend request #13 resolved. Confirmed in regenerated api-types.ts.

## Story

As an admin,
I want to see application and progress sections on the folder-model detail page,
So that I can organize folder-level indicators into sections.

## Acceptance Criteria

1. **Fixed sections always displayed**
   - Given the folder-model domain store is extended with section mutations
   - When the admin views a folder-model detail page
   - Then application and progress sections are always displayed using the shared `section-card` component
   - And sections from the `FolderModelRead` response (if present) render with their existing data

2. **Missing sections render as empty**
   - Given a section does not yet exist in the API response
   - When the admin views the detail page
   - Then the section renders as an empty card with "0 indicateurs" when collapsed
   - And an empty indicator list with "[+ Ajouter un indicateur]" when expanded

3. **Section params editing with auto-create**
   - Given a section is displayed
   - When the admin edits section parameters
   - Then the section is created (POST) if it doesn't exist, or updated (PUT) if it does
   - And section params use the same visual pattern as action-model sections (⚙ icon, dotted separator)

## Tasks / Subtasks

- [x] Task 1: Extend folder-model API with section endpoints (AC: #1, #3)
  - [x] 1.1 **PREREQUISITE**: Story 18.6 (API type reconciliation) is complete
  - [x] 1.2 Added `createFolderSectionRequest(folderModelId, data: SectionModelCreate)` to `folder-model.api.ts`
  - [x] 1.3 Added `updateFolderSectionRequest(folderModelId, sectionId, data: SectionModelUpdate)`
  - [x] 1.4 Added `deleteFolderSectionRequest(folderModelId, sectionId)`

- [x] Task 2: Add section mutations to folder-model domain store (AC: #1, #3)
  - [x] 2.1 Added `createSectionMutation` httpMutation — `concatOp`, POST to `/folder-models/{id}/sections`
  - [x] 2.2 Added `updateSectionMutation` httpMutation — `concatOp`, PUT to `/folder-models/{id}/sections/{section_id}`
  - [x] 2.3 Added `deleteSectionMutation` httpMutation — `concatOp`, DELETE to `/folder-models/{id}/sections/{section_id}`
  - [x] 2.4 Re-exported `SectionModelCreate`, `SectionModelUpdate`, `SectionModelWithIndicators` in `folder-model.models.ts`

- [x] Task 3: Extend folder-model feature store and facade (AC: #1, #2, #3)
  - [x] 3.1 Added `sections` computed signal to `FolderModelFeatureStore`
  - [x] 3.2 Added `mergedFixedSections` computed to facade — same pattern as action-model
  - [x] 3.3 Added `ensureSectionExists(sectionKey: SectionKey)` method to facade
  - [x] 3.4 Added `updateSectionParams(sectionId, sectionKey, params)` method with auto-create for stubs
  - [x] 3.5 Exposed section mutation status signals (`createSectionIsPending`, etc.)
  - [x] 3.6 Toast messages in French: "Paramètres de section enregistrés"

- [x] Task 4: Update folder-model detail component (AC: #1, #2, #3)
  - [x] 4.1 Added "Sections" zone below Properties in folder-model detail template
  - [x] 4.2 Renders `mergedFixedSections()` using section-card components (application + progress)
  - [x] 4.3 Includes `section-params-editor` inside each section card
  - [x] 4.4 No association section toggles — folder models only have fixed sections
  - [x] 4.5 Added `sectionDefs` for section anchors

- [x] ~~Task 5: Re-generate API types~~ — RESOLVED

- [x] Task 6: Write tests (AC: #1, #2, #3)
  - [x] 6.1 Test merged fixed sections computed — stubs for missing sections
  - [x] 6.2 Test ensureSectionExists — creates section via API when needed
  - [x] 6.3 Test updateSectionParams flow with existing section
  - [x] 6.4 Test detail component renders two section cards and delegates params

## Dev Notes

### Architecture & Patterns

- **Mirror action-model pattern exactly**: the facade methods for sections should be identical in structure to what was built for action-models in Epic 18. This ensures consistency and makes it easy to refactor into shared utilities later.
- **No association sections**: folder models only have `application` and `progress` section types. No toggle component needed.
- **FolderModelRead sections field**: now confirmed as `sections?: SectionModelWithIndicators[]` (backend request #13 resolved in changeset 2026-03-27).
- **Reuse all shared components**: `section-card`, `section-params-editor` from Epic 18 — no changes needed (after Story 18.6 reconciliation)

### API Endpoints

```
POST /folder-models/{id}/sections
  Body: SectionModelCreate
  Response: SectionModelRead

PUT /folder-models/{id}/sections/{section_id}
  Body: SectionModelUpdate
  Response: SectionModelRead

DELETE /folder-models/{id}/sections/{section_id}
  Response: 204
```

### Project Structure Notes

- Modified: `src/app/domains/folder-models/folder-model.api.ts` (section API functions)
- Modified: `src/app/domains/folder-models/folder-model.store.ts` (section mutations)
- Modified: `src/app/domains/folder-models/folder-model.models.ts` (re-exports)
- Modified: `src/app/features/folder-models/folder-model.store.ts` (sections computed)
- Modified: `src/app/features/folder-models/folder-model.facade.ts` (section methods)
- Modified: `src/app/features/folder-models/ui/folder-model-detail.component.ts` + `.html`
- Reuses: `section-card`, `section-params-editor` from `@shared/components/section-card/`

### Critical Guardrails

- **DO NOT** create a new domain store for folder-model sections — extend the existing folder-model domain store
- **DO NOT** add association section toggles — folder models only have fixed sections
- **`FolderModelRead.sections`** is confirmed as `SectionModelWithIndicators[]` — no longer a blocker
- **Reuse `section-card`** and `section-params-editor` from Epic 18 without modification
- **Same French labels**: "Candidature" (application), "Suivi" (progress)

### API Types Reference (2026-03-27)

```typescript
// SectionModelCreate — used for POST /folder-models/{id}/sections
interface SectionModelCreate {
  name: string;
  key: SectionKey;  // "application" | "progress" | ...
  is_enabled: boolean;
  position: number;
  hidden_rule: string;   // default: "false"
  disabled_rule: string;
  required_rule: string;
  occurrence_min_rule: string;  // NOTE: will become occurrence_rule: { min, max } in future API update
  occurrence_max_rule: string;
  constrained_rule: string;
}

// FolderModelRead.sections contains SectionModelWithIndicators[]
// Section field is `key` (SectionKey), NOT `section_type`
// No `owner_type` / `owner_id` fields — these were removed
```

### Dependencies

- Story 18.6 (API type reconciliation — shared components must use `SectionKey`/`key` first)
- Epic 18 completed (section-card, section-params-editor, patterns established)

### References

- [Source: temp/sections-feature-plan.md#Phase 2 — Sections on Folder Models]
- [Source: _bmad-output/planning-artifacts/v2.1/epics.md#Story 19.1]
- [Source: src/app/domains/folder-models/folder-model.store.ts]
- [Source: src/app/features/folder-models/folder-model.facade.ts]

## Dev Agent Record

### Implementation Plan
Mirror action-model section pattern for folder-models: add API functions, domain store mutations, facade methods with auto-create, and detail component rendering with section-card + section-params-editor.

### Completion Notes
- All 6 tasks completed successfully
- Build passes, 1231 tests pass (10 new), lint clean
- Mirrors action-model pattern exactly for consistency

### File List
- `src/app/domains/folder-models/folder-model.api.ts` — added section CRUD API functions
- `src/app/domains/folder-models/folder-model.store.ts` — added section mutations (create/update/delete)
- `src/app/domains/folder-models/folder-model.models.ts` — re-exported SectionModelCreate, SectionModelUpdate, SectionModelWithIndicators
- `src/app/features/folder-models/folder-model.store.ts` — added sections computed signal
- `src/app/features/folder-models/folder-model.facade.ts` — added mergedFixedSections, ensureSectionExists, updateSectionParams, section mutation status
- `src/app/features/folder-models/folder-model.facade.spec.ts` — added section tests
- `src/app/features/folder-models/ui/folder-model-detail.component.ts` — added section imports, section anchors, section methods
- `src/app/features/folder-models/ui/folder-model-detail.component.html` — added sections zone with section-card + section-params-editor
- `src/app/features/folder-models/ui/folder-model-detail.component.spec.ts` — NEW: detail component tests

## Change Log
- 2026-03-27: Implemented fixed sections display on folder-model detail page with section-card, section-params-editor, and auto-create flow
