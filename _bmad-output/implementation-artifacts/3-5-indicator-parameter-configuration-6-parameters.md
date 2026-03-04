# Story 3.5: Indicator Parameter Configuration (6 Parameters)

Status: ready-for-dev

## Story

As an operator (Sophie),
I want to configure the 6 behavior parameters for each indicator within a specific model context,
So that indicator behavior (required, visible, editable, default value, constraint, duplicable) is correctly defined per model.

## Acceptance Criteria

1. Expanding an indicator card in the Action Model workspace reveals 6 parameter configuration fields (FR23)
2. Boolean-like parameters (visibility, required, editable) show ToggleRow components that toggle between the default string value ("true"/"false") and a custom JSONLogic rule input (deferred to Story 3.6)
3. Duplicable parameter shows ToggleRow + min_count/max_count fields when enabled
4. Constrained values parameter shows ToggleRow + min_value/max_value fields when enabled
5. Default value parameter shows a text input for entering the default value rule
6. Changes tracked as unsaved — orange left-border on modified cards + SaveBar with count
7. Save persists all parameter values via Action Model PUT with updated `indicator_model_associations` (FR22)
8. ParamHintIcons in collapsed card header reflect current parameter states (on/off/rule)

## Tasks / Subtasks

- [ ] Task 1: Expand indicator card for parameter editing (AC: #1)
  - [ ] Extend `indicator-card.component.ts` to support collapsed/expanded states
  - [ ] Click card body (not drag handle or remove) toggles expansion
  - [ ] Chevron icon: right when collapsed, down when expanded
  - [ ] Expanded body shows 6 parameter rows
- [ ] Task 2: ToggleRow component (AC: #2, #3, #4)
  - [ ] Create `src/app/shared/components/toggle-row/toggle-row.component.ts`
  - [ ] Inputs: label, icon, value (string), enabled (boolean)
  - [ ] Toggle switch: maps to "true"/"false" string for rule-based params
  - [ ] When ON: show additional fields (JSONLogic textarea deferred to Story 3.6)
  - [ ] 3-state icon: OFF (gray), ON (purple), ON+rule (purple + orange dot)
- [ ] Task 3: Duplicable parameter UI (AC: #3)
  - [ ] ToggleRow for `duplicable.enabled`
  - [ ] When enabled: show min_count (number input) and max_count (number input)
  - [ ] Values map to `DuplicableConfig: { enabled: boolean, min_count?: number | null, max_count?: number | null }`
- [ ] Task 4: Constrained values parameter UI (AC: #4)
  - [ ] ToggleRow for `constrained_values.enabled`
  - [ ] When enabled: show min_value (number input) and max_value (number input)
  - [ ] Values map to `ConstrainedValuesConfig: { enabled: boolean, min_value?: number | null, max_value?: number | null }`
- [ ] Task 5: Default value rule input (AC: #5)
  - [ ] Text input for `default_value_rule` string
  - [ ] null when empty, string when filled
- [ ] Task 6: Unsaved state tracking + SaveBar (AC: #6, #7)
  - [ ] Track modified indicator associations in Action Model feature layer
  - [ ] Compare current parameter values with last-saved values
  - [ ] Orange left-border (`border-l-4 border-orange-400`) on modified indicator cards
  - [ ] SaveBar shows: "N unsaved changes" + "Discard" + "Save" buttons
  - [ ] Save: rebuild full `indicator_model_associations` array, PUT to Action Model endpoint
  - [ ] Discard: reset to last-saved values, clear unsaved state
  - [ ] Cmd/Ctrl+S keyboard shortcut triggers save
- [ ] Task 7: ParamHintIcons update (AC: #8)
  - [ ] Update `param-hint-icons.component.ts` to reflect actual parameter states
  - [ ] 6 icons from Lucide: Asterisk (required), Eye (visible), Pen-off (editable), Clipboard (default), Copy (duplicable), Brackets (constraints)
  - [ ] 3 states per icon: OFF (gray border), ON (purple bg), ON+rule (purple + orange dot)

## Dev Notes

### The 6 Parameters — API Schema Mapping

| # | Parameter | API Field | Type | Default | UI Component |
|---|-----------|-----------|------|---------|-------------|
| 1 | Visibility | `visibility_rule` | string (JSONLogic) | `"true"` | ToggleRow + RuleField (3.6) |
| 2 | Required | `required_rule` | string (JSONLogic) | `"false"` | ToggleRow + RuleField (3.6) |
| 3 | Editable | `editable_rule` | string (JSONLogic) | `"true"` | ToggleRow + RuleField (3.6) |
| 4 | Default Value | `default_value_rule` | string \| null | `null` | Text input |
| 5 | Duplicable | `duplicable` | `DuplicableConfig \| null` | `null` | ToggleRow + min/max count |
| 6 | Constraints | `constrained_values` | `ConstrainedValuesConfig \| null` | `null` | ToggleRow + min/max value |

**CRITICAL:** Parameters 1-3 are NOT simple booleans — they are JSONLogic expression strings. The string `"true"` means "always visible", `"false"` means "never required". Custom JSONLogic (e.g., `{"==": [{"var": "mode_chauffe"}, "autre"]}`) is handled in Story 3.6.

### ToggleRow Behavior for Rule Parameters (visibility, required, editable)

```
Toggle OFF → set value to parameter's OFF default ("false" for required, etc.)
Toggle ON  → set value to parameter's ON default ("true" for visibility/editable, "true" for required)
Toggle ON + edit rule → custom JSONLogic string (Story 3.6)
```

**For this story:** Toggle maps to "true"/"false" strings only. Story 3.6 adds the JSONLogic textarea.

### DuplicableConfig Schema

```typescript
interface DuplicableConfig {
  enabled: boolean;   // @default false
  min_count?: number | null;
  max_count?: number | null;
}
```

Toggle OFF → `duplicable: null` (or `{ enabled: false }`)
Toggle ON → `duplicable: { enabled: true, min_count: null, max_count: null }`
With values → `duplicable: { enabled: true, min_count: 1, max_count: 5 }`

### ConstrainedValuesConfig Schema

```typescript
interface ConstrainedValuesConfig {
  enabled: boolean;   // @default false
  min_value?: number | null;
  max_value?: number | null;
}
```

Same toggle pattern as DuplicableConfig.

### Unsaved State Architecture

```
User modifies parameter
  ↓
Local state updated (signal in Action Model feature layer or facade)
  ↓
Diff computed: current associations vs. last-saved associations
  ↓
Modified cards identified → orange border applied
  ↓
SaveBar shows count of modified cards
  ↓
On Save: build full indicator_model_associations array → PUT /action-models/{id}
  ↓
On success: update last-saved snapshot, clear unsaved state
```

**Key design decision:** Unsaved state should be tracked in the Action Model facade/feature layer, NOT in the indicator-model domain. The parameters belong to the Action Model's association data.

### Expanded Indicator Card Layout

```
┌──────────────────────────────────────────────────┐
│ ≡  Indicator Name  tech_label  [text]    ▼    ✕  │
│    ●●●●●●  ← ParamHintIcons                     │
│──────────────────────────────────────────────────│
│  [👁] Visibility        ──────────── [ON/OFF]    │
│  [*]  Required          ──────────── [ON/OFF]    │
│  [✏] Editable           ──────────── [ON/OFF]    │
│  [📋] Default Value     [________________]       │
│  [📑] Duplicable        ──────────── [ON/OFF]    │
│       Min count [___]   Max count [___]          │
│  [{}] Constraints       ──────────── [ON/OFF]    │
│       Min value [___]   Max value [___]          │
└──────────────────────────────────────────────────┘
```

### SaveBar Pattern (from UX Spec)

```html
<!-- Sticky bottom bar, visible only when unsaved changes exist -->
<div class="fixed bottom-0 left-60 right-0 bg-white border-t border-border px-6 py-3 flex items-center justify-between shadow-lg z-40">
  <div class="flex items-center gap-2 text-amber-600">
    <lucide-icon name="alert-triangle" [size]="16" />
    <span class="text-sm font-medium">{{ unsavedCount() }} unsaved changes</span>
  </div>
  <div class="flex gap-3">
    <button class="px-4 py-2 text-sm border border-border rounded-lg hover:bg-surface-muted" (click)="onDiscard()">
      Discard
    </button>
    <button class="px-4 py-2 text-sm bg-brand text-white rounded-lg hover:bg-brand-hover" (click)="onSave()">
      Save
    </button>
  </div>
</div>
```

### Files to Create/Modify

**Create:**
- `src/app/shared/components/toggle-row/toggle-row.component.ts`
- `src/app/shared/components/save-bar/save-bar.component.ts` (if not already exists)

**Modify:**
- `src/app/shared/components/indicator-card/indicator-card.component.ts` — expand/collapse + parameter editing
- `src/app/shared/components/param-hint-icons/param-hint-icons.component.ts` — 3-state rendering
- `src/app/features/action-models/action-model.facade.ts` — unsaved state tracking + save/discard methods
- `src/app/features/action-models/action-model.store.ts` — parameter state signals
- Action Model workspace component — integrate SaveBar

### Anti-Patterns to Avoid

- Do NOT treat visibility_rule/required_rule/editable_rule as booleans — they are STRINGS
- Do NOT store parameter edit state in Indicator Model domain — it belongs to Action Model association
- Do NOT save parameters individually — batch save all modified associations in one PUT
- Do NOT implement JSONLogic textarea in this story — defer to Story 3.6; just use toggle ON/OFF mapping to "true"/"false" strings
- Do NOT forget to include unmodified associations in the PUT request (API replaces full array)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.5]
- [Source: src/app/core/api/generated/api-types.ts#IndicatorModelAssociationInput (line 2919)]
- [Source: src/app/core/api/generated/api-types.ts#DuplicableConfig (line 2578)]
- [Source: src/app/core/api/generated/api-types.ts#ConstrainedValuesConfig (line 2555)]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#ToggleRow + ParamHintIcons + SaveBar]
- [Source: _bmad-output/planning-artifacts/architecture.md#Unsaved State Management]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
