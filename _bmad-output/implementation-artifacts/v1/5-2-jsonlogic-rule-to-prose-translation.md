# Story 5.2: JSONLogic Rule-to-Prose Translation

Status: done

## Story

As an operator (Sophie),
I want JSONLogic rules rendered as human-readable text alongside the raw JSON,
so that I can quickly understand what a rule does without mentally parsing JSON syntax.

## Acceptance Criteria

1. **Given** a stored JSONLogic rule (e.g., `{"==": [{"var": "mode_chauffe"}, "autre"]}`) **When** the parameter panel displays the rule **Then** a human-readable translation is shown alongside: e.g., "When mode_chauffe equals 'autre'"
2. **Given** a complex nested JSONLogic rule **When** the translation renders **Then** it produces a best-effort readable description **And** if the rule is too complex for translation, the raw JSON is shown without error
3. **Given** an operator edits the rule in the code editor **When** the JSON changes and is valid **Then** the prose translation updates in real-time

## Tasks / Subtasks

- [x] Task 1: Create JSONLogic-to-prose translator utility (AC: #1, #2)
  - [x] Create `src/app/shared/utils/jsonlogic-prose.ts` — pure function, no Angular dependencies
  - [x] Implement `translateJsonLogicToProse(jsonString: string): string | null`
  - [x] Return `null` for invalid JSON or un-translatable rules (caller shows raw JSON)
  - [x] Support core operators:
    - Comparison: `==`, `===`, `!=`, `!==`, `<`, `<=`, `>`, `>=` → "field equals/is not/is less than value"
    - Logic: `and`, `or`, `!` → "A and B", "A or B", "not A"
    - `var` → extract variable name as-is
    - `if` / `?:` → "If condition then A else B"
    - `in` → "field is one of [values]"
  - [x] Handle nesting recursively (up to ~3 levels, then fall back to raw JSON)
  - [x] Wrap string values in quotes, leave numbers/booleans unquoted
  - [x] Return French-friendly operator names if possible (this is a French admin tool), but English fallback is fine

- [x] Task 2: Integrate prose display into RuleFieldComponent (AC: #1, #3)
  - [x] Modify `src/app/shared/components/rule-field/rule-field.component.ts`
  - [x] Add a `proseTranslation` computed signal: calls `translateJsonLogicToProse(value())`
  - [x] Display prose below the `variablesLabel` and above the editor, in a styled box:
    - Background: `var(--color-surface-subtle)`
    - Left border accent (similar to existing `.rule-reference`)
    - Italic text, secondary color
  - [x] If `proseTranslation()` is null, hide the prose block (show nothing — raw JSON is already visible in editor)
  - [x] Prose updates reactively when `value()` input changes (real-time via computed)

- [x] Task 3: Tests (AC: #1-3)
  - [x] Create `src/app/shared/utils/jsonlogic-prose.spec.ts`:
    - `{"==": [{"var": "x"}, "y"]}` → "x equals 'y'"
    - `{"and": [...]}` → joined with "and"
    - `{"or": [...]}` → joined with "or"
    - `{"!": [...]}` → "not ..."
    - `{"in": [{"var": "x"}, ["a", "b"]]}` → "x is one of ['a', 'b']"
    - `{"if": [cond, then, else]}` → "If ... then ... else ..."
    - Deeply nested (>3 levels) → returns null
    - Invalid JSON string → returns null
    - Empty string → returns null
    - `"true"` / `"false"` → returns null (not JSONLogic)
  - [x] Update `rule-field.component.spec.ts`:
    - Prose block appears when valid JSONLogic rule has translation
    - Prose block hidden when rule is un-translatable
    - Prose updates when value input changes

## Dev Notes

### What Exists Today (DO NOT Reinvent)

- **`extractVariables()` in RuleFieldComponent** — already walks the JSONLogic AST to find `{"var": ...}` nodes. The prose translator will do similar walking but produce human text instead of variable names
- **`.rule-reference` CSS class** in RuleFieldComponent — already styled for the variables display. Reuse same visual pattern for prose
- **RuleFieldComponent** — modify in-place, do NOT create a new component

### Architecture Compliance

- **New file:** `src/app/shared/utils/jsonlogic-prose.ts` — pure utility, no Angular deps, easily testable
- **Modified file:** `src/app/shared/components/rule-field/rule-field.component.ts` — add computed + template block
- **No services, no stores** — this is pure presentation logic
- **Test co-location:** spec next to utility file

### Critical Implementation Details

- The prose translator is a **best-effort** tool — it must NEVER throw. Wrap everything in try/catch, return null on failure
- JSONLogic rules in this app are stored as **JSON strings** (not parsed objects) — the translator receives a string and must `JSON.parse()` internally
- Operator names mapping: `{"==": "equals", "!=": "does not equal", "<": "is less than", "<=": "is at most", ">": "is greater than", ">=": "is at least", "in": "is one of", "and": "and", "or": "or", "!": "not"}`
- Variable references (`{"var": "field_name"}`) should render as the field name in backtick-style or bold, e.g., `mode_chauffe`
- This story depends on Story 5.1 (CodeMirror editor) being done first, since the prose sits alongside the editor. However, the prose utility and display can be built independently — they work with the `value()` signal regardless of textarea vs CodeMirror

### Dependency Note

- Story 5.1 replaces textarea with CodeMirror — if 5.1 is done first, prose integrates below CM6 editor. If built in parallel, prose integrates into the existing textarea version and will survive the 5.1 refactor since both use the same `value()` signal

### Project Structure Notes

- `src/app/shared/utils/` — may need to be created if it doesn't exist
- No impact on domain/feature/page layers

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.2]
- [Source: src/app/shared/components/rule-field/rule-field.component.ts — current extractVariables() pattern]
- [Source: src/app/shared/components/indicator-card/indicator-card.component.ts — consumer of rule-field]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- Created `jsonlogic-prose.ts` pure utility with recursive JSONLogic-to-prose translation supporting ==, ===, !=, !==, <, <=, >, >=, and, or, !, if, in, var operators
- Max depth of 3 levels — returns null for deeper nesting (graceful fallback)
- Integrated `proseTranslation` computed signal into RuleFieldComponent with styled display block
- 18 unit tests for the prose translator + 4 integration tests in rule-field spec
- All 376 tests pass, zero regressions, build succeeds

### File List

- `src/app/shared/utils/jsonlogic-prose.ts` — new: JSONLogic-to-prose translator utility
- `src/app/shared/utils/jsonlogic-prose.spec.ts` — new: 18 unit tests for prose translator
- `src/app/shared/components/rule-field/rule-field.component.ts` — modified: added prose display
- `src/app/shared/components/rule-field/rule-field.component.spec.ts` — modified: added 4 prose integration tests

## Change Log

- 2026-03-05: Added JSONLogic-to-prose translation with real-time display alongside the code editor
