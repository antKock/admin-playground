# Story 20.3: Entity Model Detail Page

Status: partially-blocked

**Blocker (section management only):** No section sub-endpoints exist for entity models, and `EntityModelRead.sections` is untyped (`unknown[]`) — see backend-requests.md #14. Verified against live staging API on 2026-03-25. Properties editing (name, description) and read-only section display can proceed; section param editing and indicator management within sections are blocked.

## Story

As an admin,
I want to view and edit an entity model's properties and manage its additional_info section,
So that I can configure what additional information is collected for communities, agents, or sites.

## Acceptance Criteria

1. **Detail page displays properties and metadata**
   - Given the admin navigates to `/entity-models/:entityType`
   - When the entity model is loaded via `GET /entity-models/{entity_type}`
   - Then the page displays a back button ("← Retour"), the entity type name in the header, properties (name, description), and metadata

2. **Properties editing saves via PUT**
   - Given the admin edits the entity model name or description
   - When the changes are saved
   - Then a `PUT /entity-models/{entity_type}` request updates the entity model
   - And a success toast is displayed in French

3. **Additional_info section renders with section-card**
   - Given the entity model detail page is displayed
   - When the additional_info section is rendered
   - Then it uses the shared `section-card` component from Epic 18
   - And section parameters are editable with the same ⚙ icon / dotted separator pattern

4. **Indicator management within additional_info section**
   - Given the additional_info section is displayed
   - When the admin adds, edits, or removes indicators
   - Then indicator management works identically to action-model sections (PUT replace-all pattern)
   - And `indicator-card` and `indicator-param-editor` are reused

5. **clearSelection on destroy**
   - Given the admin navigates away from the detail page
   - When `ngOnDestroy` fires
   - Then `facade.clearSelection()` is called

## Tasks / Subtasks

- [ ] Task 1: Add section mutations to entity-model domain store (AC: #3, #4)
  - [ ] 1.1 Add API functions in `entity-model.api.ts`:
    - `createEntitySectionRequest(entityType, data: SectionModelCreate)` — POST `/entity-models/{entity_type}/sections` (if endpoint exists)
    - `updateEntitySectionRequest(entityType, sectionId, data: SectionModelUpdate)` — PUT `/entity-models/{entity_type}/sections/{section_id}` (if endpoint exists)
    - `updateEntitySectionIndicatorsRequest(entityType, sectionId, data: SectionIndicatorAssociationInput[])` — PUT `/entity-models/{entity_type}/sections/{section_id}/indicators`
  - [ ] 1.2 **IMPORTANT**: Verify the section endpoints exist for entity models — the feature plan only shows `GET/PUT /entity-models/{entity_type}`, not section sub-endpoints. The `additional_info` section may be managed through the entity model update endpoint instead.
  - [ ] 1.3 Add corresponding httpMutations to domain store

- [ ] Task 2: Create entity model form component (AC: #2)
  - [ ] 2.1 Create `src/app/features/entity-models/ui/entity-model-form-section.component.ts` — inline form for name + description (not a separate page)
  - [ ] 2.2 Use reactive form with `FormBuilder`: `name` (required), `description` (optional)
  - [ ] 2.3 Implement `HasUnsavedChanges` interface for `unsavedChangesGuard`
  - [ ] 2.4 Save button calls facade.update(entityType, formValue)
  - [ ] 2.5 Patch form values from `facade.selectedItem()` via `effect()`

- [ ] Task 3: Implement entity-model detail component (AC: #1, #2, #3, #4, #5)
  - [ ] 3.1 Implement `src/app/features/entity-models/ui/entity-model-detail.component.ts` (replace placeholder from Story 20.1)
  - [ ] 3.2 Use `detail-page-layout` with breadcrumbs: [{ label: "Modèles d'entités", route: '/entity-models' }, { label: entityName }]
  - [ ] 3.3 Back button: "← Retour" navigating to `/entity-models`
  - [ ] 3.4 Header: entity type French name
  - [ ] 3.5 Properties zone: MetadataGrid for read-only fields (created_at, last_updated_at, last_updated_by) + inline form for editable fields (name, description)
  - [ ] 3.6 Section zone: "Informations complémentaires" — single `section-card` for `additional_info` section
  - [ ] 3.7 Section card: section-params-editor + indicator-picker + indicator-cards with param editing
  - [ ] 3.8 `ngOnInit`: read `entityType` from route param → `facade.selectByType(entityType)` + `facade.loadIndicators()`
  - [ ] 3.9 `ngOnDestroy`: `facade.clearSelection()`

- [ ] Task 4: Add section and indicator management to facade (AC: #3, #4)
  - [ ] 4.1 Add `additionalInfoSection` computed signal — extracts the `additional_info` section from selectedItem
  - [ ] 4.2 Add section methods (if section endpoints exist): `updateSection`, `ensureSectionExists`
  - [ ] 4.3 Add indicator methods: `addIndicatorToSection`, `removeIndicatorFromSection`, `saveSectionIndicatorParams`
  - [ ] 4.4 Create section-level indicator param editor instance
  - [ ] 4.5 Expose indicator management signals: availableIndicators, indicatorsLoading, attachedIndicators per section
  - [ ] 4.6 Add `loadIndicators()` method — triggers IndicatorModelDomainStore.loadAll()

- [ ] Task 5: Add route guard for unsaved changes (AC: #2)
  - [ ] 5.1 Add `canDeactivate: [unsavedChangesGuard]` to entity-model detail route (if properties form supports it)
  - [ ] 5.2 The guard checks `HasUnsavedChanges` interface on the component

- [ ] Task 6: Write tests (AC: #1, #2, #3, #4, #5)
  - [ ] 6.1 Test detail page renders with entity type name, properties, metadata
  - [ ] 6.2 Test form save calls facade.update with correct entityType
  - [ ] 6.3 Test additional_info section renders with section-card
  - [ ] 6.4 Test indicator add/remove/edit within section
  - [ ] 6.5 Test clearSelection called on ngOnDestroy
  - [ ] 6.6 Test route param is `entityType` (string), not UUID

## Dev Notes

### Architecture & Patterns

- **Route param is `entityType` (string enum)**, not UUID — use `route.snapshot.paramMap.get('entityType')` instead of `get('id')`
- **Single section**: entity models have exactly one section type (`additional_info`). No need for multiple section cards or section grouping logic.
- **Properties form is inline** on the detail page (not a separate /edit route) — simpler than action-models which have a dedicated form page
- **Section endpoints DO NOT EXIST** (verified against live staging API on 2026-03-25): no `/entity-models/{entity_type}/sections/...` sub-endpoints. See backend-requests.md #14. Properties editing + read-only section display can proceed; section param editing and indicator management are blocked until backend deploys the new endpoints.
  - `EntityModelRead.sections` is also untyped (`unknown[]` / `items: {}`) — will need re-generation after backend types the field as `SectionModelWithIndicators[]`

### French Labels

| EntityModelType | Header Label | Back Button |
|-----------------|-------------|-------------|
| `community` | "Modèle d'entité: Communautés" | "← Retour" |
| `agent` | "Modèle d'entité: Agents" | "← Retour" |
| `site` | "Modèle d'entité: Sites" | "← Retour" |

### API Types Reference

```typescript
interface EntityModelRead {
  entity_type: EntityModelType;
  name: string;
  description?: string | null;
  id: string;
  created_at: string;
  last_updated_at: string;
  last_updated_by_id?: string | null;
  sections?: unknown[]; // SectionModelWithIndicators[]
}

interface EntityModelUpdate {
  name?: string | null;
  description?: string | null;
}
```

### Project Structure Notes

- Modified: `src/app/features/entity-models/ui/entity-model-detail.component.ts` (full implementation)
- New: `src/app/features/entity-models/ui/entity-model-form-section.component.ts` (inline form)
- Modified: `src/app/features/entity-models/entity-model.facade.ts` (section + indicator methods)
- Modified: `src/app/domains/entity-models/entity-model.api.ts` (section endpoints if they exist)
- Modified: `src/app/domains/entity-models/entity-model.store.ts` (section mutations if needed)
- Modified: `src/app/pages/entity-models/entity-models.routes.ts` (add canDeactivate guard)
- Reuses: `section-card`, `section-params-editor`, `indicator-card`, `indicator-picker`, `save-bar`, `metadata-grid`, `detail-page-layout`, `breadcrumb`

### Critical Guardrails

- **DO NOT** use `:id` route param — use `:entityType` (string enum)
- **DO NOT** add create/delete for entity models — only GET and PUT exist
- **DO NOT** duplicate section management code — reuse patterns from Epic 18
- **clearSelection in ngOnDestroy** is mandatory per CLAUDE.md conventions
- **HasUnsavedChanges** interface is mandatory per CLAUDE.md conventions for form components
- **Section sub-endpoints DO NOT EXIST** — backend request #14 must be resolved before implementing section/indicator management tasks
- **MetadataGrid with `type: 'date'`** for created_at and last_updated_at

### Dependencies

- Story 20.1 (domain store, routing, navbar)
- Story 20.2 (list page for navigation back)
- Epic 18 (section-card, section-params-editor, indicator management patterns)

### References

- [Source: temp/sections-feature-plan.md#Phase 3 — Detail page — standard layout]
- [Source: _bmad-output/planning-artifacts/v2.1/epics.md#Story 20.3]
- [Source: src/app/features/action-models/ui/action-model-detail.component.ts — detail page pattern]
- [Source: src/app/shared/components/layouts/detail-page-layout.component.ts]
- [Source: src/app/core/api/generated/api-types.ts — EntityModelRead, EntityModelUpdate]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
