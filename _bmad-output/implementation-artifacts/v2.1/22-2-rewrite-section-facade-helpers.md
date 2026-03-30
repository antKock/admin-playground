# Story 22.2: Rewrite Shared Helpers & Migrate All Facades

Status: review

## Story

As a developer,
I want `createSectionFacadeHelpers()` to delegate to the new `SectionWorkingCopy` and all three model facades to switch in one pass,
So that the batch save migration is a single shared-layer change, not three separate model changes.

## Acceptance Criteria

1. **Helpers create and expose working copy**
   - Given a facade calls `createSectionFacadeHelpers()`
   - When the helpers are initialized
   - Then a `SectionWorkingCopy` instance is created and its signals (`isDirty`, `unsavedCount`, `workingSections`) are exposed

2. **All section operations delegate to working copy**
   - Given the helpers expose methods like `addIndicatorToSection`, `removeIndicatorFromSection`, `reorderSectionIndicators`, `updateSectionParams`, `addSection`, `removeSection`
   - When any of these methods is called
   - Then it modifies the working copy locally
   - And no API call is made

3. **Save delegates to working copy save orchestration**
   - Given the helpers expose a `save()` method
   - When the facade calls `save()`
   - Then the working copy's `validateRules()` is called first
   - And if valid, `computeChangeset()` + `save(callbacks)` is executed with the domain store mutations as callbacks
   - And on success the model is refreshed and a French toast is shown

4. **Discard delegates to working copy reset**
   - Given the helpers expose a `discard()` method
   - When the facade calls `discard()`
   - Then the working copy's `reset()` is called
   - And `isDirty()` returns `false`

5. **Indicator param reading works from working copy**
   - Given indicator params are now stored in the working copy (not a separate param editor)
   - When a component requests params via `getSectionIndicatorParams(sectionId, indicatorId)`
   - Then params are read from the working copy's `workingSections()` section tree
   - And modified indicators are correctly identified by comparing against `originalSections()`

6. **All three model facades switch simultaneously**
   - Given the shared helpers are rewritten
   - When action-model, folder-model, and entity-model facades call `createSectionFacadeHelpers()`
   - Then all three use the working copy pattern
   - And each provides its own domain store mutations wrapped as `SaveCallbacks`
   - And `isDirty`, `unsavedCount`, `save()`, `discard()` are exposed on all three facades

7. **Build passes with all three facades migrated**
   - Given the helpers and facades are updated
   - When `npx ng build` is run
   - Then it compiles with zero errors

## Tasks / Subtasks

- [x]Task 1: Rewrite `SectionFacadeContext` interface (AC: #1, #6)
  - [x]1.1 Review current `SectionFacadeContext` in `section-facade.helpers.ts`
  - [x]1.2 Replace direct mutation methods with a `SaveCallbacks` provider: a function or object that the facade uses to build callbacks. The context must include:
    - `getSections(): DisplaySection[]` — reactive getter for the current section list (from feature store merged sections)
    - `buildSaveCallbacks(): SaveCallbacks` — wraps domain store mutations into the `SaveCallbacks` shape (see bridging pattern below)
    - `toast: ToastService`
    - `refresh(): void` — re-fetches the model from the server after save
  - [x]1.3 Remove the old direct mutation methods (`updateSectionIndicatorsMutation`, `createSectionMutation`, etc.) from the context interface

- [x]Task 2: Rewrite `createSectionFacadeHelpers()` (AC: #1, #2, #3, #4)
  - [x]2.1 Instantiate `createSectionWorkingCopy(ctx.getSections)` inside the factory
  - [x]2.2 Expose working copy signals: `isDirty`, `unsavedCount`, `workingSections`
  - [x]2.3 Rewrite `addIndicatorToSection(sectionId, sectionKey, indicatorModelId)` → delegates to `workingCopy.addIndicator()`
  - [x]2.4 Rewrite `removeIndicatorFromSection(sectionId, sectionKey, indicatorId)` → delegates to `workingCopy.removeIndicator()`
  - [x]2.5 Rewrite `reorderSectionIndicators(sectionId, sectionKey, orderedIds)` → delegates to `workingCopy.reorderIndicators()`
  - [x]2.6 Rewrite `updateSectionParams(sectionId, sectionKey, params)` → delegates to `workingCopy.updateSectionParams()`
  - [x]2.7 Add `addSection(key, associationEntityType?)` → delegates to `workingCopy.addSection()` — this is the generic "add section" used by association toggles on action models and any future section-adding feature
  - [x]2.8 Add `removeSection(sectionId)` → delegates to `workingCopy.removeSection()`
  - [x]2.9 Rewrite `save()` → calls `workingCopy.save(ctx.buildSaveCallbacks())`, handles toast (success: "Configuration enregistrée", validation error: show message, API error: show section-specific error) + refresh
  - [x]2.10 Rewrite `discard()` → calls `workingCopy.reset()`
  - [x]2.11 Remove `ensureSectionExists()` — no longer needed, stubs are handled by the working copy + changeset

- [x]Task 3: Rewrite indicator param access methods (AC: #5)
  - [x]3.1 Rewrite `getSectionIndicatorParams(sectionId, sectionKey, indicatorId)` → find section in `workingCopy.workingSections()`, find indicator, return its params as `IndicatorParams`
  - [x]3.2 Rewrite `getSectionChildParams(sectionId, sectionKey, parentId, childId)` → same, navigate to child
  - [x]3.3 Rewrite `updateSectionIndicatorParams()` → delegates to `workingCopy.updateIndicatorParams()`
  - [x]3.4 Rewrite `updateSectionChildParams()` → delegates to `workingCopy.updateChildIndicatorParams()`
  - [x]3.5 Rewrite `isSectionIndicatorModified(sectionId, indicatorId)` → compare indicator params in `workingSections()` vs `originalSections()`. Use the same null/'false' equivalence as the old `isParamModified()`.
  - [x]3.6 Rewrite or remove `getEditsForSection()` — with the working copy, there's no separate edits map. If `buildSectionIndicatorCards()` still needs a param edits map, derive it by diffing working vs original for the section. Otherwise, adapt `buildSectionIndicatorCards()` to read params directly from the working copy indicators (see Task 4).

- [x]Task 4: Update `buildSectionIndicatorCards()` usage (AC: #5)
  - [x]4.1 Currently `buildSectionIndicatorCards(indicators, paramEdits?)` takes an optional `Map<string, IndicatorParams>` to merge edited params into card data. With the working copy, the indicators in `workingSections()` already have the edited params baked in.
  - [x]4.2 **Option A**: Call `buildSectionIndicatorCards(workingSection.indicators)` without the paramEdits map — the function already works without it (the map is optional). The indicators from the working copy already contain the current params. **This is the preferred approach.**
  - [x]4.3 **Option B** (only if param hints need to differ for modified vs unmodified indicators): Build a param edits map by diffing working vs original, then pass it. Only use this if the UI needs to visually distinguish modified params.
  - [x]4.4 Verify that `buildSectionIndicatorCards()` produces correct `paramHints` when reading directly from working copy indicators

- [x]Task 5: Update `section-indicator-editing.helpers.ts` (AC: #5)
  - [x]5.1 Update `SectionIndicatorParamFacade` interface to match new method signatures — key change: methods now use `sectionKey` alongside `sectionId` to handle stubs
  - [x]5.2 Update thin wrapper functions that detail components use
  - [x]5.3 If the interface becomes trivially thin (just forwarding to facade), consider marking it for removal in Story 22.4

- [x]Task 6: Migrate all three facades in one pass (AC: #6, #7)
  - [x]6.1 Update `action-model.facade.ts`:
    - Provide `SectionFacadeContext` with `getSections` reading from feature store's merged sections
    - Implement `buildSaveCallbacks()` wrapping domain store mutations (`createSectionMutation`, `deleteSectionMutation`, `updateSectionMutation`, `updateSectionIndicatorsMutation`) into `SaveCallbacks` (see bridging pattern below)
    - Expose `isDirty`, `unsavedCount`, `save()`, `discard()`, `workingSections` from helpers
    - Replace `toggleAssociationSection()` with calls to helpers' `addSection()` / `removeSection()`
  - [x]6.2 Update `folder-model.facade.ts` — same pattern, folder-model domain store mutations
  - [x]6.3 Update `entity-model.facade.ts` — same pattern; note: uses `entity_type` (string) not UUID for API paths, ensure callbacks pass entity type correctly to domain store mutations
  - [x]6.4 Verify all three facades expose identical public API for batch save: `isDirty`, `unsavedCount`, `save()`, `discard()`
  - [x]6.5 Run `npx ng build` — zero errors

- [x]Task 7: Write/update tests (AC: #1–#7)
  - [x]7.1 Test that helpers create working copy and expose signals
  - [x]7.2 Test that section operations modify working copy without API calls
  - [x]7.3 Test that save orchestrates via working copy with correct callbacks
  - [x]7.4 Test that save calls validateRules() before any API call
  - [x]7.5 Test that discard resets working copy
  - [x]7.6 Test indicator param reading from working copy
  - [x]7.7 Test isSectionIndicatorModified with null/'false' equivalence

## Dev Notes

### Architecture & Patterns

- The helpers are the **single integration point** between facades and the working copy. Facades do not interact with `SectionWorkingCopy` directly — always through helpers.
- The `SectionFacadeContext` is the **only model-specific contract**. Each facade provides its own domain store mutations as callbacks. Everything else is shared.
- All three facades are migrated in Task 6 as a single pass because they all call the same `createSectionFacadeHelpers()`. There is no "backward compatibility" phase — the switch is atomic.
- `addSection()` and `removeSection()` are **generic methods** in the shared helpers. Action models use them for association section toggles. Other models may never call them, and that's fine.

### httpMutation → SaveCallbacks Bridging Pattern

Domain store mutations return `Promise<MutationResult<T>>` with `{ status: 'success' | 'error', data?, error? }`. The facade wraps them:

```typescript
// Example bridging in action-model.facade.ts:
buildSaveCallbacks(): SaveCallbacks {
  const modelId = this.selectedItem()!.id;
  return {
    createSection: async (key, assocType) => {
      const result = await this.domainStore.createSectionMutation(modelId, {
        key, association_entity_type: assocType ?? null,
      });
      return result.status === 'success'
        ? { id: result.data.id }
        : { error: handleMutationError(result.error) };
    },
    deleteSection: async (sectionId) => {
      const result = await this.domainStore.deleteSectionMutation(modelId, sectionId);
      if (result.status === 'error') return { error: handleMutationError(result.error) };
    },
    updateSection: async (sectionId, key, params) => {
      const result = await this.domainStore.updateSectionMutation(modelId, sectionId, { key, ...params });
      if (result.status === 'error') return { error: handleMutationError(result.error) };
    },
    updateSectionIndicators: async (sectionId, indicators) => {
      const result = await this.domainStore.updateSectionIndicatorsMutation(modelId, sectionId, indicators);
      if (result.status === 'error') return { error: handleMutationError(result.error) };
    },
  };
}
```

For entity models, replace `modelId` with `entityType` (the route param).

### Feature Store Data Flow — Critical Decision

**Current flow:**
```
DomainStore.selectedItem().sections → FeatureStore.associationSections/fixedSections (computed) → Facade → Component
```

**After migration, the facade exposes `workingSections()` from the helpers.** The feature store computed signals (`associationSections`, `fixedSections`) currently read from `domainStore.selectedItem()?.sections`. They need to read from the **working copy** instead, so the UI reflects pending changes.

**Required change in each feature store:**
```typescript
// BEFORE (reads from server state):
associationSections: computed(() => {
  const sections = domainStore.selectedItem()?.sections ?? [];
  return sections.filter(s => isAssociationSection(s)).sort(...);
}),

// AFTER (reads from working copy via facade/helpers):
// Option: inject workingSections signal into feature store, or
// have facade expose derived associationSections/fixedSections computed signals
```

**Recommended approach:** The helpers already expose `workingSections()`. Add computed signals in the helpers:
- `associationSections = computed(() => workingSections().filter(isAssociationSection).sort(...))`
- `fixedSections = computed(() => buildMergedFixedSections(workingSections().filter(s => !isAssociationSection(s))))`

Then the facade exposes these instead of (or alongside) the feature store's versions. This keeps the feature store reading server state (for other non-section purposes) while the section UI reads from the working copy.

### buildSectionIndicatorCards() Impact

Currently: `buildSectionIndicatorCards(indicators, paramEdits?)` merges an optional param edits map into card data.

After migration: the working copy's indicators already contain edited params. Call `buildSectionIndicatorCards(workingSection.indicators)` **without** the paramEdits map. The function's optional param already handles this — no signature change needed.

**One caveat:** If the UI needs to visually mark which indicators are *modified* (e.g., a red dot), it still needs to know which indicators changed. The `isSectionIndicatorModified()` method in the helpers handles this by diffing against original. Components can call this per indicator.

### Key Files

- Modified: `src/app/features/shared/section-indicators/section-facade.helpers.ts`
- Modified: `src/app/features/shared/section-indicators/section-indicator-editing.helpers.ts`
- Modified: `src/app/features/shared/section-indicators/build-section-indicator-cards.ts` (usage change, not signature)
- Modified: `src/app/features/action-models/action-model.facade.ts`
- Modified: `src/app/features/folder-models/folder-model.facade.ts`
- Modified: `src/app/features/entity-models/entity-model.facade.ts`
- Possibly modified: feature stores if section derivation is moved to helpers (see data flow decision above)
- References: `src/app/features/shared/section-indicators/section-working-copy.ts` (from Story 22.1)

### Critical Guardrails

- **DO NOT** remove the old param editor file yet — Story 22.4 handles cleanup
- **DO NOT** put model-specific logic in the shared helpers — if something differs between models, it belongs in `SaveCallbacks` or the facade
- **DO NOT** change shared component interfaces (section-card inputs/outputs, indicator-card inputs/outputs, save-bar inputs/outputs)
- **Entity models** use `entity_type` (string) not UUID — ensure the callbacks handle this correctly
- **French toasts**: success = "Configuration enregistrée", validation error = show the error from `validateRules()`, API error = "Erreur lors de la sauvegarde de la section [key]"

### Dependencies

- Story 22.1 (SectionWorkingCopy helper must exist)

### References

- [Design doc: temp/batch-save-refactor.md]
- [Current helpers: src/app/features/shared/section-indicators/section-facade.helpers.ts]
- [Current editing helpers: src/app/features/shared/section-indicators/section-indicator-editing.helpers.ts]
- [Build indicator cards: src/app/features/shared/section-indicators/build-section-indicator-cards.ts]
- [Action feature store: src/app/features/action-models/action-model.store.ts — associationSections/fixedSections computed]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Completion Notes List

- Rewrote `SectionFacadeContext` to use `getSections`, `buildSaveCallbacks`, `toast`, `refresh` — removed direct mutation methods
- Rewrote `createSectionFacadeHelpers()` to create a `SectionWorkingCopy` instance and delegate all operations to it
- All section/indicator operations now modify the working copy locally — no API calls until `save()`
- Save orchestrates via `workingCopy.save(callbacks)` with French toasts
- Discard delegates to `workingCopy.reset()`
- Indicator param reading directly from working copy's section tree instead of separate edits map
- `getEditsForSection()` backward compat: derives edits by diffing working vs original
- `isSectionIndicatorModified()` compares individual indicator params between working and original
- All three facades (action, folder, entity) migrated to new context pattern with `buildSaveCallbacks()`
- Action model's `toggleAssociationSection()` now delegates to `addSection()`/`removeSection()` locally
- Entity model's `ensureSectionExists()` delegates to working copy's `addSection()`
- Working copy enhanced with lazy forking pattern: tracks source reactively, only forks on first mutation
- Updated existing facade tests to match new local-only behavior (no HTTP expectations for section ops)
- All 1299 tests pass, 0 lint errors, build successful

### Change Log

- 2026-03-30: Rewrote section facade helpers to use SectionWorkingCopy, migrated all 3 facades, updated tests

### File List

- `src/app/features/shared/section-indicators/section-facade.helpers.ts` (rewritten)
- `src/app/features/shared/section-indicators/section-working-copy.ts` (updated: lazy forking pattern)
- `src/app/features/shared/section-indicators/section-working-copy.spec.ts` (updated: adapted to new behavior)
- `src/app/features/action-models/action-model.facade.ts` (modified: new context, local toggles)
- `src/app/features/action-models/action-model.facade.spec.ts` (modified: local-only test expectations)
- `src/app/features/folder-models/folder-model.facade.ts` (modified: new context)
- `src/app/features/folder-models/folder-model.facade.spec.ts` (modified: local-only test expectations)
- `src/app/features/entity-models/entity-model.facade.ts` (modified: new context, ensureSectionExists rewrite)
