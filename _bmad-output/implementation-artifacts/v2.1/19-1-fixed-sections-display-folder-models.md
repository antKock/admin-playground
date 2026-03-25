# Story 19.1: Fixed Sections Display on Folder Models

Status: blocked-by-backend

**Blocker:** `FolderModelRead` does not include a `sections` field — see backend-requests.md #13. Verified against live staging API on 2026-03-25.

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

- [ ] Task 1: Extend folder-model API with section endpoints (AC: #1, #3)
  - [ ] 1.1 Add to `folder-model.api.ts`: `createFolderSectionRequest(folderModelId, data: SectionModelCreate)`
  - [ ] 1.2 Add: `updateFolderSectionRequest(folderModelId, sectionId, data: SectionModelUpdate)`
  - [ ] 1.3 Add: `deleteFolderSectionRequest(folderModelId, sectionId)`

- [ ] Task 2: Add section mutations to folder-model domain store (AC: #1, #3)
  - [ ] 2.1 Add `createSectionMutation` httpMutation — `concatOp`, POST to `/folder-models/{id}/sections`
  - [ ] 2.2 Add `updateSectionMutation` httpMutation — `concatOp`, PUT to `/folder-models/{id}/sections/{section_id}`
  - [ ] 2.3 Add `deleteSectionMutation` httpMutation — `concatOp`, DELETE to `/folder-models/{id}/sections/{section_id}`
  - [ ] 2.4 Re-export `SectionModelCreate`, `SectionModelUpdate` in `folder-model.models.ts`

- [ ] Task 3: Extend folder-model feature store and facade (AC: #1, #2, #3)
  - [ ] 3.1 Add `sections` computed signal to `FolderModelFeatureStore` — projects `selectedItem()?.sections`
  - [ ] 3.2 Add `mergedFixedSections` computed to facade — same pattern as action-model (merge API response with stubs)
  - [ ] 3.3 Add `ensureSectionExists(sectionType)` method to facade — same pattern as action-model
  - [ ] 3.4 Add `updateSection(sectionId, params)` method to facade — with auto-create for stubs
  - [ ] 3.5 Expose section mutation status signals
  - [ ] 3.6 Toast messages in French: "Paramètres de section enregistrés"

- [ ] Task 4: Update folder-model detail component (AC: #1, #2, #3)
  - [ ] 4.1 Add "Sections" zone below Properties in folder-model detail template
  - [ ] 4.2 Render `mergedFixedSections()` using section-card components (application + progress only)
  - [ ] 4.3 Include `section-params-editor` (from Epic 18) inside each section card
  - [ ] 4.4 No association section toggles — folder models only have fixed sections
  - [ ] 4.5 Update `sectionDefs` for section anchors

- [ ] Task 5: Re-generate API types after backend adds `sections` to `FolderModelRead` (AC: #1)
  - [ ] 5.1 **PREREQUISITE**: Backend must resolve request #13 (add `sections: SectionModelWithIndicators[]` to `FolderModelRead`). Verified missing against live staging API on 2026-03-25.
  - [ ] 5.2 Once backend deploys the change: fetch updated OpenAPI spec, re-generate `api-types.ts`, verify `FolderModelRead.sections` is typed as `SectionModelWithIndicators[]`

- [ ] Task 6: Write tests (AC: #1, #2, #3)
  - [ ] 6.1 Test merged fixed sections computed — stubs for missing sections
  - [ ] 6.2 Test ensureSectionExists — creates section via API when needed
  - [ ] 6.3 Test updateSection flow with auto-create
  - [ ] 6.4 Test detail component renders two section cards

## Dev Notes

### Architecture & Patterns

- **Mirror action-model pattern exactly**: the facade methods for sections should be identical in structure to what was built for action-models in Epic 18. This ensures consistency and makes it easy to refactor into shared utilities later.
- **No association sections**: folder models only have `application` and `progress` section types. No toggle component needed.
- **FolderModelRead sections field**: the codebase exploration found that `FolderModelRead` currently does NOT have a `sections` field — only `FolderRead` (instance) does. Check if the v2.1 API update added `sections` to `FolderModelRead`. If not, sections may need to be loaded from the section endpoints directly.
- **Reuse all shared components**: `section-card`, `section-params-editor` from Epic 18 — no changes needed

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
- **CHECK the API types** for `FolderModelRead.sections` before assuming it exists — this is a potential blocker
- **Reuse `section-card`** and `section-params-editor` from Epic 18 without modification
- **Same French labels**: "Candidature" (application), "Suivi" (progress)

### Dependencies

- Epic 18 completed (section-card, section-params-editor, patterns established)

### References

- [Source: temp/sections-feature-plan.md#Phase 2 — Sections on Folder Models]
- [Source: _bmad-output/planning-artifacts/v2.1/epics.md#Story 19.1]
- [Source: src/app/domains/folder-models/folder-model.store.ts]
- [Source: src/app/features/folder-models/folder-model.facade.ts]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
