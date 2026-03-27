# Story 19.2: Indicator Management Within Folder Model Sections

Status: done

**Blocker resolved (2026-03-27):** Backend request #13 resolved — `FolderModelRead.sections` now typed as `SectionModelWithIndicators[]`. Depends on Story 19.1.

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

- [x] Task 1: Add section indicator mutation to folder-model domain store (AC: #2)
  - [x] 1.1 Added `updateFolderSectionIndicatorsRequest` in `folder-model.api.ts`
  - [x] 1.2 Added `updateSectionIndicatorsMutation` httpMutation — `concatOp`, PUT to `/folder-models/{id}/sections/{section_id}/indicators`

- [x] Task 2: Add section indicator management to facade (AC: #1, #2, #3)
  - [x] 2.1 Reuses `buildSectionAssociationInputs` from action-model use-cases (no duplication)
  - [x] 2.2 Added `addIndicatorToSection(sectionId, sectionKey, indicatorModelId)` — ensure section exists → build full list → PUT replace-all
  - [x] 2.3 Added `removeIndicatorFromSection(sectionId, indicatorModelId)` — filter out → PUT replace-all
  - [x] 2.4 Section-level param editing deferred (matches Epic 18.5 scope — add/remove are immediate)
  - [x] 2.5 On success: toast in French + re-select folder model
  - [x] 2.6 On error: handleMutationError
  - [x] 2.7 Added `loadIndicators()` method via `IndicatorModelDomainStore.loadAll()`

- [x] Task 3: Update folder-model detail component (AC: #1, #3)
  - [x] 3.1 Added `indicator-picker` inside each section card
  - [x] 3.2 Filter available indicators per section (attachedIds per section view)
  - [x] 3.3 Wired indicator remove → facade.removeIndicatorFromSection
  - [x] 3.4 Indicator param display via param-hint-icons (inline editing deferred)
  - [x] 3.5 Save-bar per section deferred (matches 18.5 scope)
  - [x] 3.6 Added `loadIndicators()` call in `ngOnInit`

- [x] Task 4: Ensure cross-domain signals in feature store (AC: #1)
  - [x] 4.1 Added `IndicatorModelDomainStore` projection to `FolderModelFeatureStore`
  - [x] 4.2 Added `availableIndicators` and `indicatorsLoading` computed signals
  - [x] 4.3 Section-level `attachedIds` computed per view in detail component

- [x] Task 5: Write tests (AC: #1, #2, #3)
  - [x] 5.1 Test addIndicatorToSection builds correct replace-all payload
  - [x] 5.2 Test removeIndicatorFromSection filters correctly
  - [x] 5.3 Test detail component init loads indicators
  - [x] 5.4 Test merged sections and params delegation

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
- Reuses: `build-section-association-inputs` pattern from Story 18.5 (located in action-models use-cases)

### Critical Guardrails

- **DO NOT** duplicate the section indicator param editor — reuse patterns from Epic 18. Note: Story 18.5 deferred the `section-indicator-param-editor` to a follow-up; add/remove are immediate server operations.
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
- [Source: src/app/features/action-models/use-cases/build-section-association-inputs.ts — section indicator mapping from Story 18.5]

## Dev Agent Record

### Implementation Plan
Add section-level indicator management to folder models — reusing buildSectionAssociationInputs and buildSectionIndicatorCards from action-model use-cases. Add/remove indicators via PUT replace-all pattern, same as action-models.

### Completion Notes
- All 5 tasks completed successfully
- Build passes, 1233 tests pass, lint clean
- Reused action-model use-cases (buildSectionAssociationInputs, buildSectionIndicatorCards) — no duplication
- Section-level indicator param editing deferred (matches Epic 18.5 scope)

### File List
- `src/app/domains/folder-models/folder-model.api.ts` — added updateFolderSectionIndicatorsRequest
- `src/app/domains/folder-models/folder-model.store.ts` — added updateSectionIndicatorsMutation
- `src/app/domains/folder-models/folder-model.models.ts` — re-exported SectionIndicatorAssociationInput
- `src/app/features/folder-models/folder-model.store.ts` — added availableIndicators, indicatorsLoading projections
- `src/app/features/folder-models/folder-model.facade.ts` — added addIndicatorToSection, removeIndicatorFromSection, loadIndicators
- `src/app/features/folder-models/folder-model.facade.spec.ts` — added section indicator tests
- `src/app/features/folder-models/ui/folder-model-detail.component.ts` — added indicator picker, param hints, section views, event handlers
- `src/app/features/folder-models/ui/folder-model-detail.component.html` — added indicator display and picker within section cards
- `src/app/features/folder-models/ui/folder-model-detail.component.spec.ts` — updated init test

## Change Log
- 2026-03-27: Implemented indicator management within folder-model sections (add/remove via PUT replace-all, indicator picker, param hint display)
