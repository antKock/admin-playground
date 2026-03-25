# Story 19.2: Indicator Management Within Folder Model Sections

Status: blocked-by-backend

**Blocker:** Depends on Story 19.1 which is blocked — see backend-requests.md #13.

## Story

As an admin,
I want to add, edit, and remove indicators within folder-model sections,
So that I can define which data points are collected for each section of a folder model.

## Acceptance Criteria

1. **Add indicator to folder-model section**
   - Given a folder-model section is expanded
   - When the admin clicks "[+ Ajouter un indicateur]"
   - Then an indicator selection flow allows choosing from available indicator models
   - And the selected indicator is added to that section with default parameters

2. **Save indicators via PUT replace-all**
   - Given indicators are assigned within a folder-model section
   - When the assignment is saved
   - Then a `PUT /folder-models/{id}/sections/{section_id}/indicators` request sends the full indicator list (replace-all pattern)

3. **Edit and remove indicators**
   - Given an indicator exists within a folder-model section
   - When the admin edits its parameters or removes it
   - Then changes are saved via the same PUT replace-all endpoint
   - And the `indicator-card` and `indicator-param-editor` components behave identically to action-model sections

## Tasks / Subtasks

- [ ] Task 1: Add section indicator mutation to folder-model domain store (AC: #2)
  - [ ] 1.1 Add API function `updateFolderSectionIndicatorsRequest(folderModelId, sectionId, data: SectionIndicatorAssociationInput[])` in `folder-model.api.ts`
  - [ ] 1.2 Add `updateSectionIndicatorsMutation` httpMutation — `concatOp`, PUT to `/folder-models/{id}/sections/{section_id}/indicators`

- [ ] Task 2: Add section indicator management to facade (AC: #1, #2, #3)
  - [ ] 2.1 Create section-level indicator param editor in facade (same pattern as action-model from Story 18.5)
  - [ ] 2.2 Add `addIndicatorToSection(sectionId, indicatorModelId)` — ensure section exists → build full list → PUT replace-all
  - [ ] 2.3 Add `removeIndicatorFromSection(sectionId, indicatorModelId)` — filter out → PUT replace-all
  - [ ] 2.4 Add `saveSectionIndicatorParams(sectionId)` — build inputs from current + edits → PUT replace-all
  - [ ] 2.5 On success: toast in French + re-select folder model
  - [ ] 2.6 On error: handleMutationError
  - [ ] 2.7 Load indicator models via `IndicatorModelDomainStore.loadAll()` on detail page init

- [ ] Task 3: Update folder-model detail component (AC: #1, #3)
  - [ ] 3.1 Add `indicator-picker` inside each section card
  - [ ] 3.2 Filter available indicators per section (exclude already attached)
  - [ ] 3.3 Wire indicator-card remove → facade.removeIndicatorFromSection
  - [ ] 3.4 Wire indicator-card params change → section param editor
  - [ ] 3.5 Add save-bar per section for unsaved indicator param changes
  - [ ] 3.6 Add `loadIndicators()` call in `ngOnInit`

- [ ] Task 4: Ensure cross-domain signals in feature store (AC: #1)
  - [ ] 4.1 Add `indicatorModels` projection to `FolderModelFeatureStore` from `IndicatorModelDomainStore`
  - [ ] 4.2 Add `availableIndicators` and `indicatorsLoading` computed signals
  - [ ] 4.3 Add section-level `attachedIndicatorIds(sectionId)` computed for picker filtering

- [ ] Task 5: Write tests (AC: #1, #2, #3)
  - [ ] 5.1 Test addIndicatorToSection builds correct replace-all payload
  - [ ] 5.2 Test removeIndicatorFromSection filters correctly
  - [ ] 5.3 Test section indicator param editor tracks edits per section
  - [ ] 5.4 Test auto-create flow for stub sections

## Dev Notes

### Architecture & Patterns

- **Identical to action-model Story 18.5** in structure — same replace-all pattern, same section-level param editing, same auto-create flow. The only difference is the API base path (`/folder-models/` instead of `/action-models/`).
- **Consider extracting shared utilities**: if the section indicator param editor and build-section-association-inputs from Story 18.5 are generic enough, reuse them directly. If they reference action-model-specific types, create thin wrappers.
- **Cross-domain signals**: folder-model feature store needs to project `IndicatorModelDomainStore` — same pattern as action-model feature store.

### API Endpoints

```
PUT /folder-models/{id}/sections/{section_id}/indicators
  Body: SectionIndicatorAssociationInput[]
  Response: SectionModelWithIndicators
```

### Project Structure Notes

- Modified: `src/app/domains/folder-models/folder-model.api.ts` (section indicators endpoint)
- Modified: `src/app/domains/folder-models/folder-model.store.ts` (updateSectionIndicatorsMutation)
- Modified: `src/app/features/folder-models/folder-model.store.ts` (indicator model projections)
- Modified: `src/app/features/folder-models/folder-model.facade.ts` (section indicator methods)
- Modified: `src/app/features/folder-models/ui/folder-model-detail.component.ts` + `.html`
- Reuses: `indicator-picker`, `indicator-card`, `save-bar` from `@shared/components/`
- Reuses: `section-indicator-param-editor` from `@shared/use-cases/` (created in Story 18.5)

### Critical Guardrails

- **DO NOT** duplicate the section indicator param editor — import from `@shared/use-cases/section-indicator-param-editor.ts` (created in Story 18.5)
- **DO NOT** modify shared components — indicator-card, indicator-picker work as-is
- **SectionIndicatorAssociationInput is the same type** for both action-model and folder-model sections
- **An indicator can appear in multiple sections** — picker filters per-section only
- **Position field**: maintain explicit position values in replace-all payload

### Dependencies

- Story 19.1 (folder-model section mutations + display)
- Epic 18 (section-card, indicator management patterns)

### References

- [Source: temp/sections-feature-plan.md#Phase 2 — Architecture]
- [Source: _bmad-output/planning-artifacts/v2.1/epics.md#Story 19.2]
- [Source: src/app/features/action-models/use-cases/build-section-association-inputs.ts — reuse pattern]
- [Source: src/app/shared/use-cases/section-indicator-param-editor.ts — shared param editor from Story 18.5]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
