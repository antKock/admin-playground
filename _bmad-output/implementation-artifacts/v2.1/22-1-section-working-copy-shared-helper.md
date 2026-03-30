# Story 22.1: Section Working Copy Shared Helper

Status: review

## Story

As a developer,
I want a reusable `SectionWorkingCopy` helper that tracks all section-level changes locally,
So that all three model types (action, folder, entity) can implement unified batch save with a single shared infrastructure.

## Acceptance Criteria

1. **Working copy initializes from server state**
   - Given a model with sections and indicators is loaded
   - When the working copy is initialized
   - Then `workingSections()` is a deep clone of the original `DisplaySection[]`
   - And `isDirty()` is `false`
   - And `unsavedCount()` is `0`

2. **Local section mutations do not trigger API calls**
   - Given the working copy is initialized
   - When the admin adds a section, removes a section, or updates section params locally
   - Then `workingSections()` reflects the change immediately
   - And `isDirty()` is `true`
   - And no HTTP request is made

3. **Local indicator mutations do not trigger API calls**
   - Given the working copy is initialized
   - When the admin adds, removes, or reorders indicators within a section, or updates indicator params
   - Then `workingSections()` reflects the change immediately
   - And `isDirty()` is `true`
   - And no HTTP request is made

4. **Changeset computation produces minimal API calls**
   - Given the working copy has been modified
   - When `computeChangeset()` is called
   - Then it returns only sections that were added (`id === null`), deleted (absent from working copy), or updated (params or indicators differ)
   - And unchanged sections are not included

5. **Reset discards all local changes**
   - Given the working copy has unsaved changes
   - When `reset()` is called
   - Then `workingSections()` reverts to a fresh clone of the original
   - And `isDirty()` is `false`

6. **Save orchestrates API calls in dependency order**
   - Given the working copy has a mix of section creates, deletes, updates, and indicator changes
   - When `save()` is called with the appropriate mutation callbacks
   - Then sections are created first (POST), deletions run (DELETE), then section param updates (PUT) and indicator updates (PUT)
   - And newly created sections receive their server ID before indicator updates are applied to them

7. **Unsaved count reflects all change types**
   - Given the working copy tracks sections and indicators
   - When changes of different types are made (section add, indicator param edit, indicator remove, etc.)
   - Then `unsavedCount()` reflects the total number of discrete changes across all types

8. **Rule validation prevents saving invalid JSON**
   - Given the working copy contains indicator or section params with rule fields
   - When `validateRules()` is called
   - Then all rule fields (hidden_rule, required_rule, disabled_rule, default_value_rule, constrained_rule, occurrence_rule.min, occurrence_rule.max) across all sections and indicators are checked for valid JSON
   - And if any rule contains invalid JSON, an error message is returned identifying the invalid field
   - And if all rules are valid, `null` is returned

9. **Stub sections (id: null) are handled correctly**
   - Given fixed sections may exist as stubs (`id: null`, created by `buildMergedFixedSections()`)
   - When the admin adds an indicator to a stub section
   - Then the working copy holds the indicator locally on the stub
   - And on save, the stub is treated as a new section to create (POST), then its indicators are attached

## Tasks / Subtasks

- [x] Task 1: Create `section-working-copy.ts` with core state management (AC: #1, #2, #3, #5, #9)
  - [x] 1.1 Create file `src/app/features/shared/section-indicators/section-working-copy.ts`
  - [x] 1.2 Implement `createSectionWorkingCopy(sectionsFn: () => DisplaySection[])` factory function — uses `DisplaySection` (which is `Omit<SectionModelWithIndicators, 'id'> & { id: string | null }`) as the working type, matching what the feature stores produce
  - [x] 1.3 `originalSections` — stores the snapshot from server (updated on init/refresh), deep cloned from `sectionsFn()`
  - [x] 1.4 `workingSections` — `signal<DisplaySection[]>` initialized via `structuredClone(originalSections())`
  - [x] 1.5 `isDirty` — `computed(() => !deepEqual(workingSections(), originalSections()))`
  - [x] 1.6 `unsavedCount` — `computed()` that counts discrete changes (added sections, deleted sections, modified section params, modified indicator lists)
  - [x] 1.7 `reset()` — re-clones `originalSections()` into `workingSections`
  - [x] 1.8 `refresh(sections: DisplaySection[])` — updates `originalSections` and resets working copy (called after successful save)
  - [x] 1.9 Handle stub sections: sections with `id === null` are valid in the working copy; they represent fixed sections that haven't been persisted. Indicators can be added to them locally. On save, they appear in `sectionsToCreate`.

- [x] Task 2: Implement local section mutation methods (AC: #2, #9)
  - [x] 2.1 `addSection(key: SectionKey, associationEntityType?: AssociationEntityType)` — appends a new section object with `id: null` to `workingSections`, using `SECTION_RULE_DEFAULTS` for initial rules, `default_value_rule: 'false'`, empty indicators list
  - [x] 2.2 `removeSection(sectionId: string)` — filters section out of `workingSections` by ID (only works on sections with `id !== null`)
  - [x] 2.3 `updateSectionParams(sectionId: string | null, sectionKey: SectionKey, params: SectionParams)` — updates section-level rules on the matching section; matches by ID if non-null, by key if null (stub)

- [x] Task 3: Implement local indicator mutation methods (AC: #3)
  - [x] 3.1 `addIndicator(sectionId: string | null, sectionKey: SectionKey, indicator: { id: string; name: string; technical_label: string; type: string })` — appends indicator to the matching section's indicator list with `SECTION_RULE_DEFAULTS` + `default_value_rule: 'false'` as params and `position` = next index. Section matched by ID if non-null, by key if null (stub).
  - [x] 3.2 `removeIndicator(sectionId: string | null, sectionKey: SectionKey, indicatorId: string)` — filters indicator out of the section's indicator list; also removes child indicators if it's a parent
  - [x] 3.3 `reorderIndicators(sectionId: string | null, sectionKey: SectionKey, orderedIds: string[])` — reorders the section's indicator list to match the given ID order, updating `position` values
  - [x] 3.4 `updateIndicatorParams(sectionId: string | null, sectionKey: SectionKey, indicatorId: string, params: IndicatorParams)` — updates the indicator's association params within the section
  - [x] 3.5 `updateChildIndicatorParams(sectionId: string | null, sectionKey: SectionKey, parentId: string, childId: string, params: IndicatorParams)` — updates child indicator params within a parent indicator

- [x] Task 4: Implement rule validation (AC: #8)
  - [x] 4.1 `validateRules(): string | null` — iterates all sections and indicators in the working copy, validates every rule field that is not `'false'` or `null` as valid JSON (using `JSON.parse`). Returns a descriptive error message on first invalid field, or `null` if all valid.
  - [x] 4.2 Port the validation logic from the existing `validateRules()` in `section-indicator-param-editor.ts` — match the same fields checked and the same error message format

- [x] Task 5: Implement changeset computation (AC: #4, #9)
  - [x] 5.1 `computeChangeset()` — compares `workingSections()` vs `originalSections()`
  - [x] 5.2 Detect added sections: sections in working copy with `id === null` that have indicators (stub sections without indicators are skipped — nothing to create)
  - [x] 5.3 Detect deleted sections: sections present in original (by ID) but absent from working copy
  - [x] 5.4 Detect updated section params: present in both (matched by ID), but section-level rules differ
  - [x] 5.5 Detect updated indicators: present in both (matched by ID), but indicator list or indicator params differ
  - [x] 5.6 Return typed `Changeset` object (see types below)

- [x] Task 6: Implement save orchestration (AC: #6, #8)
  - [x] 6.1 `save(callbacks: SaveCallbacks): Promise<SaveResult>` — accepts mutation callbacks as parameters, not hardcoded to a specific domain store
  - [x] 6.2 First: call `validateRules()` — if invalid, return error result immediately without calling any API
  - [x] 6.3 Then: call `computeChangeset()` — if empty, return success (nothing to save)
  - [x] 6.4 Step 1: POST new sections via `callbacks.createSection()`, capture returned server IDs
  - [x] 6.5 Step 2: DELETE removed sections via `callbacks.deleteSection()` (parallel with step 1 where possible)
  - [x] 6.6 Step 3: PUT updated section params via `callbacks.updateSection()`
  - [x] 6.7 Step 4: PUT indicator updates via `callbacks.updateSectionIndicators()` — includes newly created sections (using server IDs from step 1)
  - [x] 6.8 Build indicator inputs using existing `buildSectionAssociationInputs()` utility from the working copy's indicator data
  - [x] 6.9 Return `SaveResult` with success/failure and details on which operations failed

- [x] Task 7: Implement deep equality and helper utilities (AC: #1, #4)
  - [x] 7.1 Create a `deepEqual` function suitable for comparing section trees (consider `JSON.stringify` for simplicity given the data is serializable)
  - [x] 7.2 Create `sectionParamsChanged(a: DisplaySection, b: DisplaySection): boolean` — compares section-level rule fields (hidden_rule, required_rule, disabled_rule, occurrence_rule, constrained_rule)
  - [x] 7.3 Create `indicatorsChanged(a: DisplaySection, b: DisplaySection): boolean` — compares indicator lists (order, count, and all param fields per indicator including children)
  - [x] 7.4 Ensure null/undefined/`'false'` equivalence is handled correctly — port the logic from `isParamModified()` in the existing param editor: `null`, `undefined`, and `'false'` are treated as equivalent (no change)

- [x] Task 8: Write unit tests (AC: #1–#9)
  - [x] 8.1 Test initialization: clone is independent of original, isDirty false, unsavedCount 0
  - [x] 8.2 Test local section mutations: add/remove/update reflected in workingSections, isDirty true
  - [x] 8.3 Test local indicator mutations: add/remove/reorder/params reflected, isDirty true
  - [x] 8.4 Test reset: working copy reverts to original, isDirty false
  - [x] 8.5 Test computeChangeset: added/deleted/updated sections correctly detected
  - [x] 8.6 Test computeChangeset: indicator changes correctly detected per section
  - [x] 8.7 Test computeChangeset: unchanged sections excluded
  - [x] 8.8 Test computeChangeset: stub sections with indicators appear in sectionsToCreate with their indicator list
  - [x] 8.9 Test computeChangeset: stub sections without indicators are NOT included in sectionsToCreate
  - [x] 8.10 Test unsavedCount: reflects all change types accurately
  - [x] 8.11 Test save orchestration: callbacks called in correct order with correct payloads
  - [x] 8.12 Test save: newly created section IDs propagated to indicator updates
  - [x] 8.13 Test save: validation failure prevents any API call
  - [x] 8.14 Test validateRules: detects invalid JSON in rule fields, returns error message
  - [x] 8.15 Test validateRules: returns null when all rules are valid or 'false'
  - [x] 8.16 Test null/'false' equivalence in dirty comparison

## Dev Notes

### Architecture & Patterns

- This is a **shared helper** consumed by all three model facades (action, folder, entity). It must be model-agnostic — no references to specific model IDs or API paths.
- The factory function `createSectionWorkingCopy()` takes a reactive getter `sectionsFn: () => DisplaySection[]` that reads from the feature store's merged section list. This follows the same pattern as `createSectionIndicatorParamEditor()`.
- Save callbacks are injected, not hardcoded — the facade provides its model-specific domain store mutations when calling `save()`.
- **This helper replaces `section-indicator-param-editor.ts`** — do not import or reference the old editor. All param tracking is absorbed into the working copy.

### Key Types Reference

```typescript
// From display-section.model.ts — THIS is the working copy type
// It extends SectionModelWithIndicators but allows id: null (for stub sections)
type DisplaySection = Omit<SectionModelWithIndicators, 'id'> & { id: string | null };

// SectionModelWithIndicators (from generated API types)
interface SectionModelWithIndicators {
  id: string;
  name: string;
  key: SectionKey;  // 'financial' | 'application' | 'progress' | 'additional_info' | ...
  association_entity_type?: AssociationEntityType | null;
  is_enabled: boolean;
  position: number;
  hidden_rule: string;
  disabled_rule: string;
  required_rule: string;
  occurrence_rule?: OccurrenceRule;
  constrained_rule: string;
  created_at: string;
  last_updated_at: string;
  last_updated_by_id?: string | null;
  indicators?: SectionIndicatorModelRead[];
}

// SectionIndicatorModelRead (from generated API types)
interface SectionIndicatorModelRead {
  id: string;
  name: string;
  technical_label: string;
  description?: string | null;
  type: string;
  unit?: string | null;
  created_at: string;
  last_updated_at: string;
  hidden_rule: string;
  required_rule: string;
  disabled_rule: string;
  default_value_rule: string;
  occurrence_rule?: OccurrenceRule;
  constrained_rule: string;
  position: number;
  children?: SectionChildIndicatorModelRead[] | null;
}

// Default rule values (from display-section.model.ts)
const SECTION_RULE_DEFAULTS = {
  hidden_rule: 'false',
  disabled_rule: 'false',
  required_rule: 'false',
  occurrence_rule: { min: 'false', max: 'false' },
  constrained_rule: 'false',
} as const;

// Changeset output — note sectionsToCreate carries indicators for the new section
interface Changeset {
  sectionsToCreate: {
    key: SectionKey;
    associationEntityType?: AssociationEntityType | null;
    params: SectionParams;
    indicators: SectionIndicatorAssociationInput[];  // indicators to attach after creation
  }[];
  sectionsToDelete: string[];  // section IDs
  sectionsToUpdate: {
    sectionId: string;
    key: SectionKey;
    params: SectionParams;
  }[];
  indicatorUpdates: {
    sectionId: string;
    indicators: SectionIndicatorAssociationInput[];
  }[];
}

// Save callbacks (injected by facade) — returns Promise (mutations already return Promise<MutationResult>)
interface SaveCallbacks {
  createSection(key: SectionKey, associationEntityType?: AssociationEntityType | null): Promise<{ id: string } | { error: string }>;
  deleteSection(sectionId: string): Promise<void | { error: string }>;
  updateSection(sectionId: string, key: SectionKey, params: SectionParams): Promise<void | { error: string }>;
  updateSectionIndicators(sectionId: string, indicators: SectionIndicatorAssociationInput[]): Promise<void | { error: string }>;
}

// Save result
interface SaveResult {
  success: boolean;
  validationError?: string;  // from validateRules()
  failedOperations?: { type: string; sectionKey: SectionKey; error: string }[];
}

// From section-params-editor.component.ts
interface SectionParams {
  hidden_rule: string;
  required_rule: string;
  disabled_rule: string;
  occurrence_rule: { min: string; max: string };
  constrained_rule: string;
}

// From indicator-card.component.ts
interface IndicatorParams {
  hidden_rule: string | null;
  required_rule: string | null;
  disabled_rule: string | null;
  default_value_rule: string | null;
  occurrence_rule: OccurrenceRule | null;
  constrained_rule: string | null;
}
```

### Stub Section Pattern

Fixed sections (application, progress, financial) may not yet exist on the server. `buildMergedFixedSections()` creates stubs with `id: null` for missing ones:

```typescript
// Stub section (from buildMergedFixedSections)
{ id: null, name: 'Application', key: 'application', is_enabled: true, position: 0,
  ...SECTION_RULE_DEFAULTS, indicators: [] }
```

The working copy treats these naturally:
- Indicators can be added to stubs locally (pushed to `indicators[]`)
- `computeChangeset()` detects stubs with indicators as `sectionsToCreate`
- Stubs with no indicators (unchanged) are skipped
- After save, the server returns the real section with an ID, and `refresh()` replaces the stub

### httpMutation → SaveCallbacks Bridging

Domain store mutations (via `httpMutation`) already return `Promise<MutationResult<T>>`. The facade wraps them into `SaveCallbacks`:

```typescript
// In the facade, wrapping domain store mutation into SaveCallbacks:
const callbacks: SaveCallbacks = {
  createSection: async (key, assocType) => {
    const result = await domainStore.createSectionMutation(modelId, { key, association_entity_type: assocType });
    return result.status === 'success' ? { id: result.data.id } : { error: formatError(result.error) };
  },
  // ... same pattern for other callbacks
};
```

This bridging happens in Story 22.2 (in the facade), not in the working copy itself.

### Project Structure Notes

- New: `src/app/features/shared/section-indicators/section-working-copy.ts`
- New: `src/app/features/shared/section-indicators/section-working-copy.spec.ts`
- Reuse: `build-section-association-inputs.ts` — adapt if needed to build inputs from working copy indicator data (currently takes `SectionIndicatorModelRead[]` + optional param edits map)
- Reference: `section-indicator-param-editor.ts` — study its `isParamModified()` and `validateRules()` logic, then replace

### Critical Guardrails

- **DO NOT** import from any specific model domain (action-models, folder-models, entity-models) — this is shared code
- **DO NOT** make HTTP calls directly — all API calls go through injected callbacks
- **DO NOT** use Observables — signals only (`signal`, `computed`)
- **DO NOT** delete `section-indicator-param-editor.ts` yet — Story 22.4 handles cleanup
- **Reuse** `buildSectionAssociationInputs()` for building PUT payloads from working copy indicators
- **Reuse** `SECTION_RULE_DEFAULTS` from `display-section.model.ts` for new section/indicator defaults
- **Match** the null/'false' equivalence behavior from `isParamModified()` in the existing param editor

### Dependencies

- None — this is the foundation story

### References

- [Design doc: temp/batch-save-refactor.md]
- [Existing param editor: src/app/features/shared/section-indicators/section-indicator-param-editor.ts]
- [Build inputs utility: src/app/features/shared/section-indicators/build-section-association-inputs.ts]
- [Display section model: src/app/features/shared/section-indicators/display-section.model.ts]
- [Merged fixed sections: src/app/features/shared/section-indicators/build-merged-fixed-sections.ts]
- [Section rule defaults: src/app/features/shared/section-indicators/display-section.model.ts — SECTION_RULE_DEFAULTS]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Completion Notes List

- Implemented `createSectionWorkingCopy()` factory function with full working copy pattern: deep-cloned state, `isDirty`/`unsavedCount` computed signals, `reset()`/`refresh()` lifecycle methods
- Section mutations: `addSection`, `removeSection`, `updateSectionParams` — all operate locally on the working copy signal, no HTTP calls
- Indicator mutations: `addIndicator`, `removeIndicator`, `reorderIndicators`, `updateIndicatorParams`, `updateChildIndicatorParams` — section matching by ID or by key for stubs
- Rule validation: ported from existing `section-indicator-param-editor.ts`, validates all rule fields across sections, indicators, and child indicators
- Changeset computation: detects added stubs (with indicators), deleted sections, updated section params, and indicator changes — uses `sectionParamsChanged` and `indicatorsChanged` helpers with null/'false' equivalence
- Save orchestration: validates rules first, computes changeset, executes callbacks in dependency order (create+delete parallel, then param updates, then indicator updates including newly created sections)
- Helper utilities: `deepEqual` (JSON.stringify), `sectionParamsChanged`, `indicatorsChanged` with proper null/undefined/'false' normalization
- 30 unit tests covering all 9 acceptance criteria — all pass
- No imports from specific model domains — fully model-agnostic shared code
- Did not use `buildSectionAssociationInputs` — implemented `buildIndicatorInputs` locally to avoid coupling to the param-edits-map pattern; the working copy already holds the final indicator state

### Change Log

- 2026-03-30: Initial implementation of `SectionWorkingCopy` shared helper — all 8 tasks complete, 30 tests, all ACs satisfied

### File List

- `src/app/features/shared/section-indicators/section-working-copy.ts` (new)
- `src/app/features/shared/section-indicators/section-working-copy.spec.ts` (new)
