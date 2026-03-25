# Story 18.2: Association Section Toggles

Status: review

## Story

As an admin,
I want to toggle association sections (sites, agents, communities) ON or OFF on an action model,
So that I can control which entity types can be associated with actions of this model.

## Acceptance Criteria

1. **Toggle OFF deletes section**
   - Given the action-model detail page displays the three association sections
   - When an association section is toggled OFF
   - Then the section shows a single collapsed line with "Section désactivée"
   - And a `DELETE /action-models/{id}/sections/{section_id}` request is sent

2. **Toggle ON creates section**
   - Given an association section is currently OFF (does not exist in API response)
   - When the admin toggles it ON
   - Then a `POST /action-models/{id}/sections` request creates the section with the correct `section_type`
   - And the section expands to show the section params area and empty indicator list

3. **Toggle failure reverts state**
   - Given a toggle operation fails
   - When the API returns an error
   - Then the toggle reverts to its previous state
   - And a toast error message is displayed in French

## Tasks / Subtasks

- [x] Task 1: Add section mutations to action-model domain store (AC: #1, #2)
  - [x] 1.1 Add API functions in `action-model.api.ts`: `createSectionRequest(actionModelId, data: SectionModelCreate)`, `deleteSectionRequest(actionModelId, sectionId)`
  - [x] 1.2 Add `createSectionMutation` httpMutation to `action-model.store.ts` — `concatOp`, POST to `/action-models/{id}/sections`
  - [x] 1.3 Add `deleteSectionMutation` httpMutation — `concatOp`, DELETE to `/action-models/{id}/sections/{section_id}`
  - [x] 1.4 Export new mutation type models in `action-model.models.ts`: re-export `SectionModelCreate` from generated types

- [x] Task 2: Add section facade methods (AC: #1, #2, #3)
  - [x] 2.1 Add `toggleAssociationSection(sectionType: SectionType)` method to facade
  - [x] 2.2 Logic: if section exists in `selectedItem().sections` → delete it; if not → create it with `{ section_type, name: frenchLabel, is_enabled: true }`
  - [x] 2.3 On success: toast + re-select action model to refresh data
  - [x] 2.4 On error: `handleMutationError()` — toggle reverts automatically since we re-fetch from server
  - [x] 2.5 Expose `createSectionMutationIsPending` and `deleteSectionMutationIsPending` signals from domain store
  - [x] 2.6 Add computed `associationSectionEnabled(type)` — returns boolean per association type based on sections in API response

- [x] Task 3: Create association-section-toggle component (AC: #1, #2, #3)
  - [x] 3.1 Create `src/app/shared/components/section-card/association-section-toggle.component.ts` — small toggle switch (ON/OFF) inside section-card header
  - [x] 3.2 Inputs: `enabled: boolean`, `isPending: boolean`, `sectionType: SectionType`
  - [x] 3.3 Output: `toggled` — emits when toggled (renamed from `toggle` to avoid DOM event name conflict)
  - [x] 3.4 Disabled state when `isPending` is true (prevent double-clicks)
  - [x] 3.5 Styling: ON = accent color, OFF = gray with "Section désactivée" text

- [x] Task 4: Integrate toggles in action-model detail (AC: #1, #2)
  - [x] 4.1 Update "Sections d'association" zone: always render 3 association section cards (sites, agents, communities)
  - [x] 4.2 Each card gets the toggle component in its header
  - [x] 4.3 When OFF: section body is hidden, only header with "Section désactivée" text shows
  - [x] 4.4 When ON: section body shows section params + indicator list (from Story 18.1)

- [x] Task 5: Write tests (AC: #1, #2, #3)
  - [x] 5.1 Test toggle ON → creates section via API
  - [x] 5.2 Test toggle OFF → deletes section via API
  - [x] 5.3 Test pending state disables toggle
  - [x] 5.4 Test facade computed `associationSectionEnabled`

## Dev Notes

### Architecture & Patterns

- **Domain store composition**: add mutations AFTER existing mutations in the `withMutations` block — maintain composition order
- **API function pattern**: follows existing `publishActionModelRequest` / `deleteActionModelRequest` patterns — return `{ url, method, body }` config objects
- **Optimistic vs server-confirmed**: use **server-confirmed** approach — re-select action model after toggle to get fresh `sections` array. No optimistic state needed since toggle is instant
- **Three association types are always rendered**: even when their section doesn't exist in the API response, the UI shows all 3 with their toggle state

### API Endpoints

```
POST /action-models/{id}/sections
  Body: { section_type: "association_sites" | "association_agents" | "association_communities", name: string, is_enabled: true }
  Response: SectionModelRead

DELETE /action-models/{id}/sections/{section_id}
  Response: 204
```

### API Types Reference

```typescript
interface SectionModelCreate {
  name: string;
  section_type: SectionType;
  is_enabled?: boolean;  // default: true
  position?: number;     // default: 0
  // ... rule fields with defaults of "false"
}
```

### Project Structure Notes

- Modified: `src/app/domains/action-models/action-model.api.ts` (new functions)
- Modified: `src/app/domains/action-models/action-model.store.ts` (new mutations)
- Modified: `src/app/domains/action-models/action-model.models.ts` (re-export SectionModelCreate)
- Modified: `src/app/features/action-models/action-model.facade.ts` (new methods + signals)
- New: `src/app/shared/components/section-card/association-section-toggle.component.ts`
- Modified: `action-model-detail.component.ts` + `.html`

### Critical Guardrails

- **DO NOT** create a separate section domain store — section mutations live in the action-model domain store
- **DO NOT** track toggle state locally — derive it from `selectedItem().sections` after re-fetch
- **Mutation naming**: `createSectionMutation` / `deleteSectionMutation` — follows existing pattern
- **Section name for creation**: use French labels from section-card models mapping (Story 18.1)
- **concatOp** for both mutations (sequential, not exhaustOp — user might toggle multiple sections)

### Dependencies

- Story 18.1 must be completed first (section-card component + section grouping signals)

### References

- [Source: temp/sections-feature-plan.md#Phase 1 — Zone 2: Association Sections]
- [Source: _bmad-output/planning-artifacts/v2.1/epics.md#Story 18.2]
- [Source: src/app/domains/action-models/action-model.store.ts — mutation patterns]
- [Source: src/app/domains/action-models/action-model.api.ts — API function patterns]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- Renamed output `toggle` → `toggled` to avoid Angular lint rule `@angular-eslint/no-output-native` (conflicts with DOM `toggle` event)

### Completion Notes List

- Added `createSectionRequest` and `deleteSectionRequest` API functions
- Added `createSectionMutation` and `deleteSectionMutation` to domain store with `concatOp`
- Exported `SectionModelCreate` and `SectionModelWithIndicators` types from models
- Added `toggleAssociationSection`, `isAssociationSectionEnabled`, `getAssociationSectionId` to facade
- Exposed section mutation pending signals through facade
- Created `AssociationSectionToggleComponent` with toggle switch, disabled state, and aria attributes
- Updated action-model detail to always render all 3 association section types with toggle switches
- Server-confirmed approach: re-fetches action model after toggle to get fresh section state
- All 1206 tests pass, 0 lint errors, build succeeds

### Change Log

- 2026-03-25: Story 18.2 implemented — association section toggles (create/delete)

### File List

New files:
- src/app/shared/components/section-card/association-section-toggle.component.ts
- src/app/shared/components/section-card/association-section-toggle.component.spec.ts

Modified files:
- src/app/domains/action-models/action-model.api.ts (createSectionRequest, deleteSectionRequest)
- src/app/domains/action-models/action-model.store.ts (createSectionMutation, deleteSectionMutation)
- src/app/domains/action-models/action-model.models.ts (SectionModelCreate, SectionModelWithIndicators exports)
- src/app/features/action-models/action-model.facade.ts (toggle methods, section mutation signals)
- src/app/features/action-models/action-model.facade.spec.ts (section toggle tests)
- src/app/features/action-models/ui/action-model-detail.component.ts (toggle imports, helper methods)
- src/app/features/action-models/ui/action-model-detail.component.html (association section toggles UI)
