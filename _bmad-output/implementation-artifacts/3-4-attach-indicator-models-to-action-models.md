# Story 3.4: Attach Indicator Models to Action Models

Status: ready-for-dev

## Story

As an operator (Sophie),
I want to attach Indicator Models to an Action Model from the Action Model workspace,
So that I can define which indicators are part of each model's configuration.

## Acceptance Criteria

1. Action Model detail/workspace page shows a list of currently attached Indicator Models (FR20)
2. IndicatorPicker component allows searching and selecting available Indicator Models for attachment
3. Attaching an indicator updates the Action Model via the API with success toast
4. Removing an indicator association shows ConfirmDialog, then updates API with success toast
5. Drag-to-reorder indicators via Angular CDK DragDrop with order persisted via API
6. Action Model feature store aggregates data from both action-model and indicator-model domain stores
7. Facade orchestrates cross-domain interactions between Action Model and Indicator Model

## Tasks / Subtasks

- [ ] Task 1: Extend Action Model domain for indicator associations (AC: #6)
  - [ ] Verify `ActionModelRead.indicator_models` field is typed as `IndicatorModelWithAssociation[]`
  - [ ] Add mutation for updating indicator associations: `updateActionModelMutation` (if not existing) with `indicator_model_associations` payload
  - [ ] Ensure the action-model API file handles the association data in update requests
- [ ] Task 2: Create IndicatorPicker component (AC: #2)
  - [ ] Create `src/app/shared/components/indicator-picker/indicator-picker.component.ts`
  - [ ] Dashed border CTA: "Attach indicator" button
  - [ ] Click opens inline searchable panel (CDK Overlay or inline expand)
  - [ ] Search field: auto-focused, debounced 300ms, searches name + technical_label
  - [ ] Results show type badge, already-attached items dimmed with "Already attached" tag
  - [ ] Click "+ Attach" fires output event with selected indicator model
  - [ ] Esc or click outside closes picker
- [ ] Task 3: Indicator attachment list UI (AC: #1)
  - [ ] Create or extend Action Model workspace component to show "Indicators" section
  - [ ] Display attached indicators as cards: name, technical_label, type badge
  - [ ] Each card has drag handle (left) and remove button (right, hover-revealed)
  - [ ] Empty state: "No indicators attached yet" with the picker CTA
- [ ] Task 4: Attach/detach operations (AC: #3, #4)
  - [ ] On attach: build updated `indicator_model_associations` array, call Action Model update mutation
  - [ ] On detach: show ConfirmDialog, remove from array, call update mutation
  - [ ] Toast feedback for both operations
  - [ ] Refresh action model data after mutation success
- [ ] Task 5: Drag-to-reorder (AC: #5)
  - [ ] Import `CdkDragDrop` from `@angular/cdk/drag-drop`
  - [ ] Wrap indicator list in `cdkDropList` container
  - [ ] Each card is a `cdkDrag` item with drag handle
  - [ ] On drop: reorder the `indicator_model_associations` array, call update mutation to persist
  - [ ] Optimistic UI: reorder immediately, revert on error
- [ ] Task 6: Cross-domain feature store (AC: #6, #7)
  - [ ] Update `features/action-models/action-model.store.ts` — add computed signals from indicator-model domain
  - [ ] Update `features/action-models/action-model.facade.ts` — expose indicator signals + attachment methods
  - [ ] Add facade methods: `attachIndicator()`, `detachIndicator()`, `reorderIndicators()`
  - [ ] Facade loads indicator model list for picker via `IndicatorModelDomainStore.load()`

## Dev Notes

### API Mechanism for Indicator Associations

Indicator associations are managed **through the Action Model** endpoints, NOT through Indicator Model endpoints:

```typescript
// ActionModelCreate/Update includes:
{
  indicator_model_ids?: string[] | null;           // Simple ID list
  indicator_model_associations?: IndicatorModelAssociationInput[] | null;  // With metadata
}

// IndicatorModelAssociationInput — full association with 6 parameters:
{
  indicator_model_id: string;         // Required
  visibility_rule: string;            // Default: "true" (JSONLogic)
  required_rule: string;              // Default: "false" (JSONLogic)
  editable_rule: string;              // Default: "true" (JSONLogic)
  default_value_rule?: string | null; // Optional JSONLogic
  duplicable?: DuplicableConfig | null;      // {enabled, min_count, max_count}
  constrained_values?: ConstrainedValuesConfig | null;  // {enabled, min_value, max_value}
}
```

**For this story:** When attaching, use `indicator_model_associations` with default parameter values. Stories 3.5 and 3.6 will add parameter editing.

**Default association when attaching:**
```typescript
{
  indicator_model_id: selectedIndicator.id,
  visibility_rule: "true",
  required_rule: "false",
  editable_rule: "true",
  default_value_rule: null,
  duplicable: null,
  constrained_values: null,
}
```

### ActionModelRead Response Includes Association Data

```typescript
// ActionModelRead.indicator_models: IndicatorModelWithAssociation[]
{
  id: string; name: string; description?: string | null;
  type: "text" | "number"; unit?: string | null;
  created_at: string; updated_at: string;
  // Association metadata:
  visibility_rule: string; required_rule: string; editable_rule: string;
  default_value_rule?: string | null;
  duplicable?: DuplicableConfig | null;
  constrained_values?: ConstrainedValuesConfig | null;
}
```

### Cross-Domain Architecture

```
ActionModel Workspace Page
  ↓ composes
ActionModel Feature UI (detail/workspace component)
  ↓ injects
ActionModelFacade
  ↙ reads                    ↘ delegates
ActionModelFeatureStore      ActionModelDomainStore
  ↓ reads both domains         ↓ owns mutations
ActionModelDomainStore +     API (PUT /action-models/{id})
IndicatorModelDomainStore
```

**Key rule:** The ActionModel facade orchestrates loading of BOTH domains. The IndicatorPicker gets its data from IndicatorModel domain store (loaded via ActionModel facade).

### IndicatorPicker Component Design (from UX Spec)

```
┌─────────────────────────────────────┐
│  ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐  │
│  │  + Attach indicator           │  │  ← dashed border CTA
│  └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘  │
│                                     │
│  [Search indicators...         🔍]  │  ← auto-focused, debounced
│  ┌─────────────────────────────┐    │
│  │ Indicator A     [text] [+]  │    │  ← type badge + attach button
│  │ Indicator B     [num]  dim  │    │  ← already attached = dimmed
│  │ Indicator C     [text] [+]  │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

### Attached Indicator Card (Collapsed)

```
┌────────────────────────────────────────────┐
│ ≡  Indicator Name  tech_label  [text]   ✕  │
│    ○○○○○○  ← ParamHintIcons (6 circles)    │
└────────────────────────────────────────────┘
  ↑ drag    ↑ name/label/badge              ↑ remove
```

ParamHintIcons show all-gray for default parameters (this story). Stories 3.5/3.6 activate them.

### Reorder Persistence

On drag-drop, rebuild the `indicator_model_associations` array in new order and `PUT /action-models/{id}` with the full associations array. The API treats the array order as the display order.

### Files to Create/Modify

**Create:**
- `src/app/shared/components/indicator-picker/indicator-picker.component.ts`
- `src/app/shared/components/indicator-card/indicator-card.component.ts` (collapsed view)
- `src/app/shared/components/param-hint-icons/param-hint-icons.component.ts` (6 status circles)

**Modify:**
- `src/app/domains/action-models/action-model.api.ts` — ensure association update mutation
- `src/app/features/action-models/action-model.store.ts` — add indicator-model cross-domain signals
- `src/app/features/action-models/action-model.facade.ts` — attach/detach/reorder methods + indicator data signals
- Action Model workspace/detail component — add indicators section with picker + card list
- `src/app/domains/action-models/action-model.models.ts` — export IndicatorModelWithAssociation type

### Shared Component Placement

IndicatorPicker, IndicatorCard, and ParamHintIcons go in `shared/components/` because:
- IndicatorPicker may be reused on multiple workspace views
- IndicatorCard is used in Stories 3.4, 3.5, 3.6
- ParamHintIcons is purely presentational

### Anti-Patterns to Avoid

- Do NOT create indicator association endpoints on the Indicator Model API — associations are managed through Action Model
- Do NOT store association state in the Indicator Model domain store — it belongs to Action Model
- Do NOT implement parameter editing in this story — defer to Stories 3.5/3.6
- Do NOT use `indicator_model_ids` (simple ID array) — use `indicator_model_associations` (with metadata) to preserve parameter defaults
- Do NOT forget to include ALL existing associations when updating (PUT replaces the full array)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.4]
- [Source: src/app/core/api/generated/api-types.ts#IndicatorModelAssociationInput (line 2919)]
- [Source: src/app/core/api/generated/api-types.ts#ActionModelRead (line 1903) — indicator_models field]
- [Source: src/app/core/api/generated/api-types.ts#IndicatorModelWithAssociation (line 3041)]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#IndicatorPicker + IndicatorCard]
- [Source: _bmad-output/planning-artifacts/architecture.md#Cross-Domain Patterns]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
