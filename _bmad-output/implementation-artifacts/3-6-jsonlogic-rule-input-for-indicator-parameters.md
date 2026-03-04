# Story 3.6: JSONLogic Rule Input for Indicator Parameters

Status: ready-for-dev

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

## Tasks / Subtasks

- [ ] Task 1: Create RuleField component (AC: #1, #2)
  - [ ] Create `src/app/shared/components/rule-field/rule-field.component.ts`
  - [ ] Inputs: `value` (string), `label` (string), `placeholder` (string)
  - [ ] Outputs: `valueChange` (string)
  - [ ] Multi-line `<textarea>` with monospace font (JetBrains Mono, 13px)
  - [ ] Full-width, min 3 rows, auto-grows with content
  - [ ] Shows below ToggleRow when parameter is toggled ON
- [ ] Task 2: JSON validation (AC: #3, #4)
  - [ ] On blur: validate input with `JSON.parse()`
  - [ ] If valid: clear error, accept input
  - [ ] If invalid: show red error below textarea: "Invalid JSON syntax"
  - [ ] On save (via SaveBar): block save if any RuleField has invalid JSON
  - [ ] Edge cases: empty string → allowed (clears rule, reverts to default), whitespace-only → trim first
- [ ] Task 3: Integrate with ToggleRow (AC: #1)
  - [ ] When ToggleRow for visibility/required/editable is toggled ON: show RuleField below
  - [ ] When toggled OFF: hide RuleField, set value to default ("true"/"false")
  - [ ] When toggled ON with existing rule: pre-populate textarea with current rule string
  - [ ] ToggleRow behavior: ON without custom rule = "true"/"false" string; ON with custom rule = JSONLogic expression
- [ ] Task 4: Persist rules via Save (AC: #5)
  - [ ] On save: read RuleField values into the `indicator_model_associations` array
  - [ ] Map: `visibility_rule` ← RuleField value (or "true" if toggle ON without custom rule)
  - [ ] Map: `required_rule` ← RuleField value (or "false"/"true" based on toggle)
  - [ ] Map: `editable_rule` ← RuleField value (or "true" if toggle ON without custom rule)
  - [ ] Map: `default_value_rule` ← text input value (not a RuleField)
  - [ ] PUT /action-models/{id} with full updated associations array
- [ ] Task 5: Faithful rule display on reload (AC: #6)
  - [ ] When Action Model detail loads with existing associations:
  - [ ] Parse each rule field: if value is "true" or "false" → toggle ON/OFF, no RuleField shown
  - [ ] If value is a JSONLogic expression (not simple "true"/"false") → toggle ON + RuleField populated
  - [ ] Preserve exact JSON formatting (no prettify/minify unless user requests)
- [ ] Task 6: Variable extraction prose placeholder (AC: #7)
  - [ ] Above the textarea, display a small gray text area
  - [ ] Parse the JSONLogic expression to extract `{"var": "..."}` references
  - [ ] Display: "Rule references: mode_chauffe, type_batiment" (comma-separated variable names)
  - [ ] If no variables found or empty rule: show "No rule variables detected"
  - [ ] This is v1 placeholder — full human-readable prose deferred to Story 5.2

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

### Debug Log References

### Completion Notes List

### File List
