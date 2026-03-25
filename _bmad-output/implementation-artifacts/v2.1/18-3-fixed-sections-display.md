# Story 18.3: Fixed Sections Display

Status: review

## Story

As an admin,
I want application and progress sections to always be visible on the action-model detail page,
So that I can configure them without needing to create them first.

## Acceptance Criteria

1. **Existing fixed sections render with data**
   - Given the action model API response includes application and/or progress sections
   - When the admin views the detail page
   - Then those sections render with their existing data (section params + indicators)

2. **Missing fixed sections render as empty**
   - Given the action model API response does NOT include an application or progress section
   - When the admin views the detail page
   - Then the missing sections are still rendered as empty section cards
   - And each empty section shows "0 indicateurs" when collapsed and an empty indicator list with "[+ Ajouter un indicateur]" when expanded

3. **Auto-create on first interaction**
   - Given a fixed section does not exist in the API yet
   - When the admin first interacts with it (e.g. adds an indicator or edits params)
   - Then the section is created via `POST /action-models/{id}/sections` before the interaction is processed

## Tasks / Subtasks

- [x] Task 1: Compute merged section list in facade (AC: #1, #2)
  - [x] 1.1 Add `mergedFixedSections` computed signal to facade — merges API response sections with stub sections for missing fixed types
  - [x] 1.2 Define `FIXED_SECTION_TYPES: SectionType[] = ['application', 'progress']`
  - [x] 1.3 For each fixed type: if present in API response, use it; if not, create a stub `{ section_type, name: frenchLabel, indicators: [], id: null }`
  - [x] 1.4 Use a local type `DisplaySection` that extends `SectionModelWithIndicators` but allows `id: string | null` for stubs

- [x] Task 2: Add auto-create logic to facade (AC: #3)
  - [x] 2.1 Add `ensureSectionExists(sectionType: SectionType): Promise<string>` method to facade
  - [x] 2.2 Logic: check if section exists in `selectedItem().sections` — if yes, return existing `section_id`; if not, call `createSectionMutation` and return new section ID
  - [x] 2.3 This will be used by Stories 18.4 (params editing) and 18.5 (indicator management) before any write operations
  - [x] 2.4 After creation, re-select action model to refresh sections data

- [x] Task 3: Update detail component for fixed sections (AC: #1, #2)
  - [x] 3.1 Update "Sections" zone in detail template — render `mergedFixedSections()` using section-card components
  - [x] 3.2 Fixed sections never have a toggle — they are always visible
  - [x] 3.3 Collapsed empty section shows "0 indicateurs" badge
  - [x] 3.4 Expanded empty section shows empty state text (placeholder for Story 18.5 indicator management)

- [x] Task 4: Write tests (AC: #1, #2, #3)
  - [x] 4.1 Test `mergedFixedSections` with both sections present in API
  - [x] 4.2 Test `mergedFixedSections` with one or both sections missing — stubs are created
  - [x] 4.3 Test `ensureSectionExists` when section already exists — returns existing ID
  - [x] 4.4 Test `ensureSectionExists` when section doesn't exist — calls create mutation

## Dev Notes

### Architecture & Patterns

- **Merged section list**: the key pattern here is computing a display-ready list that always contains both fixed sections regardless of what the API returns. This is a facade responsibility (computed signal).
- **Stub sections**: use a local `DisplaySection` type — same shape as `SectionModelWithIndicators` but `id` can be `null` to indicate "not yet created on server"
- **Auto-create is lazy**: the section is only created when the user first tries to DO something (edit params, add indicator). Viewing an empty section does NOT trigger creation.
- **createSectionMutation already exists** from Story 18.2 — reuse it here

### Critical Guardrails

- **DO NOT** create fixed sections eagerly on page load — that would create unnecessary API calls
- **DO NOT** modify the domain store — the `createSectionMutation` from Story 18.2 handles creation
- **The `[+ Ajouter un indicateur]` button is a placeholder in this story** — actual indicator management is Story 18.5
- **Section param editing is a placeholder in this story** — actual editing is Story 18.4
- **Keep the `DisplaySection` type simple** — don't over-engineer; it's just `SectionModelWithIndicators & { id: string | null }`

### Project Structure Notes

- Modified: `src/app/features/action-models/action-model.facade.ts` (new computed signals + ensureSectionExists)
- Modified: `action-model-detail.component.ts` + `.html` (fixed sections zone)
- No new files — builds on Story 18.1 section-card and Story 18.2 mutations

### Dependencies

- Story 18.1 (section-card component)
- Story 18.2 (createSectionMutation in domain store)

### References

- [Source: temp/sections-feature-plan.md#Phase 1 — Zone 3: Fixed Sections]
- [Source: _bmad-output/planning-artifacts/v2.1/epics.md#Story 18.3]
- [Source: src/app/features/action-models/action-model.facade.ts]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- Used `Omit<SectionModelWithIndicators, 'id'> & { id: string | null }` for `DisplaySection` type since TypeScript intersection with `{ id: string | null }` doesn't override `{ id: string }`
- httpMutation success result uses `.value` not `.result` for accessing response body

### Completion Notes List

- Added `FIXED_SECTION_TYPES` constant to section-card.models.ts
- Created `DisplaySection` type for mixed real/stub sections
- Added `mergedFixedSections` computed signal to facade — always returns both application + progress sections
- Added `ensureSectionExists` method for lazy auto-creation of sections on first interaction
- Updated detail template to always render fixed sections (no conditional)
- Fixed section navigation anchors always visible
- All 1210 tests pass, 0 lint errors, build succeeds

### Change Log

- 2026-03-25: Story 18.3 implemented — fixed sections always-visible display with stub support

### File List

Modified files:
- src/app/shared/components/section-card/section-card.models.ts (FIXED_SECTION_TYPES)
- src/app/features/action-models/action-model.facade.ts (DisplaySection, mergedFixedSections, ensureSectionExists)
- src/app/features/action-models/action-model.facade.spec.ts (merged sections + ensureSectionExists tests)
- src/app/features/action-models/ui/action-model-detail.component.ts (mergedFixedSections signal, DisplaySection import)
- src/app/features/action-models/ui/action-model-detail.component.html (fixed sections template)
