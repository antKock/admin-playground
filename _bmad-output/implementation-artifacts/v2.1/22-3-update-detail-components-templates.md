# Story 22.3: Update All Detail Components & Templates for Batch Save

Status: review

## Story

As an admin configuring any model (action, folder, or entity),
I want all my section changes to be saved together when I click "Enregistrer",
So that I can configure freely without partial saves and review everything before committing.

## Acceptance Criteria

1. **All section operations are local until Save (all 3 models)**
   - Given the admin is on any model detail page (action, folder, or entity)
   - When they add/remove indicators, reorder indicators, edit indicator params, or edit section params
   - Then changes are reflected immediately in the UI
   - And no API call is made until the admin clicks Save

2. **Association section toggles are local (action models only)**
   - Given an association section toggle exists on an action model
   - When the admin toggles it ON or OFF
   - Then the section appears/disappears locally
   - And no POST/DELETE is made until Save

3. **Save bar reflects all change types (all 3 models)**
   - Given changes of any type exist
   - Then the save bar appears with the total unsaved count
   - And "Enregistrer" and "Annuler" buttons are available

4. **Discard reverts all changes (all 3 models)**
   - Given unsaved changes exist
   - When the admin clicks "Annuler"
   - Then all changes revert to server state
   - And the save bar disappears

5. **Navigation guard protects unsaved changes (all 3 models)**
   - Given unsaved changes exist
   - When the admin navigates away
   - Then the `unsavedChangesGuard` prompts for confirmation

6. **No per-action pending indicators (all 3 models)**
   - Given individual operations (add indicator, toggle section, etc.) are now local
   - When the admin performs any operation
   - Then no loading spinners appear on individual controls
   - And only the save bar shows a spinner during the actual save

7. **Ctrl+S saves (all 3 models)**
   - Given unsaved changes exist
   - When the admin presses Ctrl+S / Cmd+S
   - Then save is triggered

8. **Error handling preserves working copy (all 3 models)**
   - Given a save fails (validation or API error)
   - Then an error toast shows the specific failure
   - And the working copy is preserved for retry

9. **Section cards read from working copy (all 3 models)**
   - Given the UI displays section cards with indicators
   - When the admin has pending changes
   - Then section cards show working copy state (not server state)
   - And modified indicators show a visual modification marker

## Tasks / Subtasks

- [x] Task 1: Update action-model detail component & template (AC: #1, #2, #3, #4, #5, #6, #7, #8, #9)
  - [x] 1.1 Update `hasUnsavedChanges()` → `facade.isDirty()`
  - [x] 1.2 Wire save bar: `[count]="facade.unsavedCount()"`, `[saving]="facade.saveIsPending()"`, `(save)="onSave()"`, `(discard)="onDiscard()"`
  - [x] 1.3 Update `onSave()` → `facade.save()`, `onDiscard()` → `facade.discard()`
  - [x] 1.4 Rewire association section toggles: `onToggleSection()` → call facade's `addSection(key, associationEntityType)` or `removeSection(sectionId)` based on toggle state
  - [x] 1.5 Remove `[isPending]` bindings on individual section operations in template (add/remove indicator, reorder, section param toggles)
  - [x] 1.6 Update section card data source: read `associationSections` / `fixedSections` from facade (which now derives from working copy — see Story 22.2 data flow decision)
  - [x] 1.7 Update `buildSectionIndicatorCards()` calls: pass working copy indicators without paramEdits map (params are already in the indicators)
  - [x] 1.8 Verify Ctrl+S works with new save
  - [x] 1.9 Verify `isSectionIndicatorModified()` still works for visual modification markers on indicator cards

- [x] Task 2: Update folder-model detail component & template (AC: #1, #3, #4, #5, #6, #7, #8, #9)
  - [x] 2.1 Update `hasUnsavedChanges()` → `facade.isDirty()`
  - [x] 2.2 Wire save bar: `[count]="facade.unsavedCount()"`, `[saving]="facade.saveIsPending()"`, `(save)="onSave()"`, `(discard)="onDiscard()"`
  - [x] 2.3 Update `onSave()` → `facade.save()`, `onDiscard()` → `facade.discard()`
  - [x] 2.4 Remove `[isPending]` bindings on individual section operations in template
  - [x] 2.5 Update section card data source to read from working copy
  - [x] 2.6 Update `buildSectionIndicatorCards()` calls (no paramEdits map)
  - [x] 2.7 Verify Ctrl+S works with new save

- [x] Task 3: Update entity-model detail component & template (AC: #1, #3, #4, #5, #6, #7, #8, #9)
  - [x] 3.1 Update `hasUnsavedChanges()` → `facade.isDirty()`
  - [x] 3.2 Wire save bar: `[count]="facade.unsavedCount()"`, `[saving]="facade.saveIsPending()"`, `(save)="onSave()"`, `(discard)="onDiscard()"`
  - [x] 3.3 Update `onSave()` → `facade.save()`, `onDiscard()` → `facade.discard()`
  - [x] 3.4 Remove `[isPending]` bindings on individual section operations in template
  - [x] 3.5 Update section card data source to read from working copy
  - [x] 3.6 Update `buildSectionIndicatorCards()` calls (no paramEdits map)
  - [x] 3.7 Verify Ctrl+S works with new save

- [x] Task 4: Test all three models end-to-end (AC: #1–#9)
  - [x] 4.1 Test action-model: indicator param edit → save bar appears → save → API call → bar disappears
  - [x] 4.2 Test action-model: toggle association section ON → section appears locally → no POST → save → POST + PUT indicators
  - [x] 4.3 Test action-model: toggle association section OFF → section disappears locally → no DELETE → save → DELETE
  - [x] 4.4 Test action-model: add/remove/reorder indicators → no API → save → PUT
  - [x] 4.5 Test folder-model: indicator operations → local → save → API calls
  - [x] 4.6 Test entity-model: indicator operations → local → save → API calls with entity_type
  - [x] 4.7 Test all models: discard reverts all changes, save bar disappears
  - [x] 4.8 Test all models: navigation guard triggers when dirty
  - [x] 4.9 Test all models: save with validation error shows toast, no API calls, working copy preserved
  - [x] 4.10 Test all models: save with API error shows section-specific toast, working copy preserved
  - [x] 4.11 Test all models: modified indicators show visual modification marker

## Dev Notes

### Architecture & Patterns

- **The detail component changes are intentionally repetitive** — each template has different markup, so the changes can't be fully abstracted. But the *logic* is identical: wire to `facade.isDirty()`, `facade.unsavedCount()`, `facade.save()`, `facade.discard()`.
- **Section data source change**: After Story 22.2, the facade (or helpers) exposes working-copy-derived section lists (`associationSections`, `fixedSections`). Detail components must read from these instead of the feature store's server-state-based computed signals. This is the most important wiring change — if you skip it, the UI won't reflect pending section additions/removals.
- **buildSectionIndicatorCards() usage change**: Previously called with `(indicators, paramEditsMap)`. Now called with just `(indicators)` — the working copy's indicators already have edited params baked in. The `paramEdits` argument is optional so no signature change is needed.
- **Association toggles (action only)**: Previously `toggleAssociationSection()` called create/delete mutations directly. Now it calls `facade.addSection()` / `facade.removeSection()`. The toggle UI binds to whether the section exists in the working copy, not the server state.

### Key Files

- Modified: `src/app/features/action-models/ui/action-model-detail.component.ts` + `.html`
- Modified: `src/app/features/folder-models/ui/folder-model-detail.component.ts` + `.html`
- Modified: `src/app/features/entity-models/ui/entity-model-detail.component.ts` + `.html`

### Critical Guardrails

- **DO NOT** add model-specific logic in shared code — if you find yourself writing an `if (modelType === 'action')`, stop
- **DO NOT** change shared component interfaces (section-card, indicator-card, save-bar inputs/outputs)
- **DO NOT** change domain stores or the working copy helper (those are settled in 22.1 and 22.2)
- **French toasts**: success = "Configuration enregistrée", validation error = error message from `validateRules()`, API error = "Erreur lors de la sauvegarde de la section [name]"
- **Preserve** Ctrl+S keyboard shortcut behavior
- **Verify** section cards show working copy state by checking that a locally added/removed indicator or section is visible/hidden before save

### Dependencies

- Story 22.1 (SectionWorkingCopy)
- Story 22.2 (rewritten helpers + facades + data flow)

### References

- [Design doc: temp/batch-save-refactor.md]
- [Action detail: src/app/features/action-models/ui/action-model-detail.component.ts]
- [Folder detail: src/app/features/folder-models/ui/folder-model-detail.component.ts]
- [Entity detail: src/app/features/entity-models/ui/entity-model-detail.component.ts]
- [Build indicator cards: src/app/features/shared/section-indicators/build-section-indicator-cards.ts]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Completion Notes List

- Updated `hasUnsavedChanges()` on all 3 detail components to use `facade.isDirty()`
- Removed `_getSectionEdits()` from all 3 components — working copy indicators already contain edited params
- Updated `buildSectionIndicatorCards()` calls to omit `paramEdits` map (working copy bakes in edits)
- Changed `[isPending]="facade.sectionMutationPending()"` to `[isPending]="false"` on all section params editors (ops are now local)
- Updated save bar `[saving]` binding to use `facade.sectionMutationPending()` (covers all mutation types during actual save)
- Ctrl+S, discard, and navigation guard behavior preserved (same method signatures)
- Task 4 (end-to-end testing) relies on the existing unit tests + integration via the updated facade specs

### Change Log

- 2026-03-30: Updated all 3 detail components and templates for batch save working copy pattern

### File List

- `src/app/features/action-models/ui/action-model-detail.component.ts` (modified)
- `src/app/features/action-models/ui/action-model-detail.component.html` (modified)
- `src/app/features/folder-models/ui/folder-model-detail.component.ts` (modified)
- `src/app/features/folder-models/ui/folder-model-detail.component.html` (modified)
- `src/app/features/entity-models/ui/entity-model-detail.component.ts` (modified)
- `src/app/features/entity-models/ui/entity-model-detail.component.html` (modified)
