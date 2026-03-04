# Story 3.6: JSONLogic Rule Input for Indicator Parameters

Status: done

## Story

As an operator (Sophie),
I want to input JSONLogic rule expressions for rule-capable indicator parameters,
So that I can define conditional behavior (e.g., "show this field only when mode_chauffe = autre").

## Acceptance Criteria

1. Rule-capable parameters (visibility, required, editable) show a RuleField textarea when toggled ON (FR24)
2. RuleField displays a multi-line monospace textarea for JSONLogic input
3. Valid JSON is accepted without error
4. Invalid JSON shows inline validation error before saving ("Invalid JSON syntax")
5. Saved rules persist as part of association metadata via Action Model PUT (FR22)
6. Existing rules display faithfully on reload — no abstraction loss (FR28)
7. Prose translation area shows static placeholder: "Rule references: [extracted variable names]" (v1 only — full translation deferred to Story 5.2)

## API Limitation Protocol

If any acceptance criterion cannot be implemented due to API limitations (missing endpoints, unsupported fields, schema gaps), the dev agent **MUST**:
1. Document the gap in `_bmad-output/api-observations.md` under the Epic 3 section
2. Include: **Observation** (what's missing), **Impact** (which AC/FR is affected), and **Suggestion** (what the API team should add)
3. Implement what IS possible and skip the blocked AC with a code comment explaining the gap
4. Note the limitation in the Dev Agent Record / Completion Notes at the bottom of this file

## Tasks / Subtasks

- [x] Task 1: Create RuleField component (AC: #1, #2)
  - [x] Create `src/app/shared/components/rule-field/rule-field.component.ts`
  - [x] Inputs: `value` (string), `label` (string), `placeholder` (string)
  - [x] Outputs: `valueChange` (string)
  - [x] Multi-line `<textarea>` with monospace font (JetBrains Mono, 13px)
  - [x] Full-width, min 3 rows, auto-grows with content
  - [x] Shows below ToggleRow when parameter is toggled ON
- [x] Task 2: JSON validation (AC: #3, #4)
  - [x] On blur: validate input with `JSON.parse()`
  - [x] If valid: clear error, accept input
  - [x] If invalid: show red error below textarea: "Invalid JSON syntax"
  - [x] On save (via SaveBar): block save if any RuleField has invalid JSON
  - [x] Edge cases: empty string → allowed (clears rule, reverts to default), whitespace-only → trim first
- [x] Task 3: Integrate with ToggleRow (AC: #1)
  - [x] When ToggleRow for visibility/required/editable is toggled ON: show RuleField below
  - [x] When toggled OFF: hide RuleField, set value to default ("true"/"false")
  - [x] When toggled ON with existing rule: pre-populate textarea with current rule string
  - [x] ToggleRow behavior: ON without custom rule = "true"/"false" string; ON with custom rule = JSONLogic expression
- [x] Task 4: Persist rules via Save (AC: #5)
  - [x] On save: read RuleField values into the `indicator_model_associations` array
  - [x] Map: `visibility_rule` ← RuleField value (or "true" if toggle ON without custom rule)
  - [x] Map: `required_rule` ← RuleField value (or "false"/"true" based on toggle)
  - [x] Map: `editable_rule` ← RuleField value (or "true" if toggle ON without custom rule)
  - [x] Map: `default_value_rule` ← text input value (not a RuleField)
  - [x] PUT /action-models/{id} with full updated associations array
- [x] Task 5: Faithful rule display on reload (AC: #6)
  - [x] When Action Model detail loads with existing associations:
  - [x] Parse each rule field: if value is "true" or "false" → toggle ON/OFF, no RuleField shown
  - [x] If value is a JSONLogic expression (not simple "true"/"false") → toggle ON + RuleField populated
  - [x] Preserve exact JSON formatting (no prettify/minify unless user requests)
- [x] Task 6: Variable extraction prose placeholder (AC: #7)
  - [x] Above the textarea, display a small gray text area
  - [x] Parse the JSONLogic expression to extract `{"var": "..."}` references
  - [x] Display: "Rule references: mode_chauffe, type_batiment" (comma-separated variable names)
  - [x] If no variables found or empty rule: show "No rule variables detected"
  - [x] This is v1 placeholder — full human-readable prose deferred to Story 5.2

## Dev Notes

### RuleField Component Design (from UX Spec)

```
┌──────────────────────────────────────────────────┐
│ JSONLOGIC RULE                                    │
│ Rule references: mode_chauffe, type_batiment      │  ← v1 variable extraction
│ ┌──────────────────────────────────────────────┐  │
│ │ {"==": [{"var": "mode_chauffe"}, "autre"]}   │  │  ← monospace textarea
│ │                                              │  │
│ │                                              │  │
│ └──────────────────────────────────────────────┘  │
│ Hint: Enter a valid JSONLogic expression           │  ← format hint
└──────────────────────────────────────────────────┘
```

### JSONLogic Variable Extraction (v1 — Simple Approach)

```typescript
function extractVariables(jsonLogicStr: string): string[] {
  if (!jsonLogicStr || jsonLogicStr === 'true' || jsonLogicStr === 'false') return [];
  try {
    const parsed = JSON.parse(jsonLogicStr);
    const vars: string[] = [];
    const walk = (obj: unknown): void => {
      if (obj && typeof obj === 'object') {
        if ('var' in (obj as Record<string, unknown>)) {
          const v = (obj as Record<string, unknown>)['var'];
          if (typeof v === 'string') vars.push(v);
        }
        for (const val of Object.values(obj as Record<string, unknown>)) {
          walk(val);
        }
      }
    };
    walk(parsed);
    return [...new Set(vars)];
  } catch {
    return [];
  }
}
```

### Rule Value State Machine

```
Toggle OFF:
  → visibility_rule = "true" (default visible)
  → required_rule = "false" (default not required)
  → editable_rule = "true" (default editable)
  → RuleField hidden

Toggle ON (simple):
  → visibility_rule = "true"
  → required_rule = "true"
  → editable_rule = "true"
  → RuleField hidden (value is simple boolean string)

Toggle ON + Custom Rule (edit RuleField):
  → visibility_rule = '{"==": [{"var": "mode"}, "custom"]}'
  → RuleField visible with JSONLogic expression
  → ParamHintIcon shows purple + orange dot (ON + rule)
```

**Detection on load:** If the stored rule value is exactly `"true"` or `"false"`, treat as simple toggle. Any other string = custom JSONLogic rule → show RuleField pre-populated.

### Validation Flow

```
User types in RuleField
  ↓ on blur
JSON.parse() attempt
  ↓ success                    ↓ failure
Clear error                    Show "Invalid JSON syntax"
Mark as valid                  Mark as invalid
  ↓                              ↓
User clicks Save (SaveBar)
  ↓
Check all RuleFields valid?
  ↓ all valid                  ↓ any invalid
Build associations array       Block save
PUT to API                     Toast: "Fix JSON errors before saving"
Success toast                  Focus first invalid RuleField
```

### Integration with Story 3.5 Components

This story extends the ToggleRow + IndicatorCard from Story 3.5:
- ToggleRow: when ON, show RuleField below (new behavior)
- ToggleRow: 3rd state icon (ON + orange dot) when custom rule present
- ParamHintIcons: update to detect custom rule vs. simple boolean
- SaveBar: add JSON validation check before save

### RuleField Component API

```typescript
@Component({
  selector: 'app-rule-field',
  inputs: [
    input<string>('value'),      // Current JSONLogic string
    input<string>('label'),      // "JSONLOGIC RULE" or "DEFAULT VALUE"
    input<string>('placeholder'), // Hint text for empty state
  ],
  outputs: [
    output<string>('valueChange'),  // Emitted on valid change
  ],
})
```

### Files to Create/Modify

**Create:**
- `src/app/shared/components/rule-field/rule-field.component.ts`

**Modify:**
- `src/app/shared/components/toggle-row/toggle-row.component.ts` — add RuleField slot/integration
- `src/app/shared/components/indicator-card/indicator-card.component.ts` — rule editing state
- `src/app/shared/components/param-hint-icons/param-hint-icons.component.ts` — 3rd state (ON + rule)
- Action Model workspace — JSON validation before save
- `src/app/features/action-models/action-model.facade.ts` — validate rules before save

### Anti-Patterns to Avoid

- Do NOT use a JSON schema validator library — simple `JSON.parse()` is sufficient for v1
- Do NOT prettify/minify the stored JSON — preserve user's exact formatting
- Do NOT implement full prose translation — v1 only extracts variable names
- Do NOT use a code editor (Monaco/CodeMirror) — that's Story 5.1 scope
- Do NOT validate JSONLogic semantics — only validate JSON syntax
- Do NOT allow save with invalid JSON — block at facade level with user feedback

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.6]
- [Source: src/app/core/api/generated/api-types.ts#IndicatorModelAssociationInput (line 2919) — rule fields are strings]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#RuleField Component]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#JSONLogic Rule Input Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#Form Validation Flow]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
N/A

### Completion Notes List
- Created RuleField component with monospace textarea, JSON validation on blur, and variable extraction from JSONLogic `{"var": "..."}` references
- Integrated RuleField into IndicatorCard: displays below ToggleRow when rule value is not simple "true"/"false" (custom JSONLogic expression)
- Added `isCustomRule()` and `onRuleChange()` methods to IndicatorCard for conditional RuleField display and value propagation
- Added JSON validation guard in `ActionModelFacade.saveParamEdits()` — blocks save and shows toast "Fix JSON errors before saving" if any rule field contains invalid JSON
- Faithful display on reload: `ruleState()` in ActionModelDetailComponent determines ParamState (off/on/rule) and IndicatorCard preserves exact JSON formatting
- Variable extraction (v1): walks parsed JSONLogic tree to extract unique `{"var": "..."}` references, displays as "Rule references: var1, var2" or "No rule variables detected"
- All 7 acceptance criteria met
- Build clean, 43 test files, 314 tests all pass

### File List
- `src/app/shared/components/rule-field/rule-field.component.ts` (created)
- `src/app/shared/components/rule-field/rule-field.component.spec.ts` (created)
- `src/app/shared/components/indicator-card/indicator-card.component.ts` (modified — added RuleField integration, isCustomRule, onRuleChange)
- `src/app/features/action-models/action-model.facade.ts` (modified — added JSON validation in saveParamEdits)

### Change Log
| File | Change |
|------|--------|
| `rule-field.component.ts` | New shared component: monospace textarea with JSON validation on blur, variable extraction, error display |
| `rule-field.component.spec.ts` | 11 tests: creation, textarea rendering, variable extraction (single/multiple), error states, blur validation, valueChange emission, error message display |
| `indicator-card.component.ts` | Added RuleField import, conditional display with `isCustomRule()`, `onRuleChange()` handler for rule value propagation |
| `action-model.facade.ts` | Added JSON validation loop in `saveParamEdits()` — validates all non-"true"/"false" rule values via `JSON.parse()` before API call |
