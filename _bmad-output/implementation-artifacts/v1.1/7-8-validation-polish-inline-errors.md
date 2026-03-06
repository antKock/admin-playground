# Story 7.8: Validation Polish — Inline Error Marks and Edge Cases

Status: ready-for-dev
Depends-on: 7.6 (texte edit mode, validation badge, `parseResult` signal)

## Story

As an admin,
I want to see exactly where errors are in my prose rule with visual highlights and tooltips,
so that I can quickly find and fix mistakes.

## Acceptance Criteria

1. **Given** a prose rule with a syntax error at a specific position **When** the editor displays the rule **Then** the error token has a wavy red underline (uses existing CM lint styling: `var(--color-text-error, #dc2626)`)
2. Hovering the underlined token shows a tooltip with the error message (CodeMirror's built-in lint tooltip — no custom `hoverTooltip()` needed)
3. **Given** a prose rule referencing an unknown variable (not in the variable dictionary) **When** the editor validates **Then** the unknown variable has a wavy amber underline (warning, uses existing CM styling: `var(--color-status-warning, #d97706)`)
4. The validation badge shows amber "Avertissement — {n} variable(s) inconnue(s)" for warnings (warnings don't block save)
5. **Given** the rule field container **When** there are blocking errors **Then** the container gets `.has-error` class: `border-color: var(--color-text-error, #dc2626); box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.08);`
6. Empty rule → no badge, no errors, no diagnostics
7. Rule becomes empty after editing → transition to empty state (placeholder shown, `parseResult` set to null)
8. Very long rules → line wrapping (already handled by `EditorView.lineWrapping`)
9. Rapid typing → debounce parser execution (~300ms) — already handled by story 7.6's debounce
10. Pasting prose → full parse triggered after debounce (CM fires `docChanged` on paste)
11. Undo/redo → CodeMirror native `history()` extension (added in story 7.6), parser re-runs on change

## Tasks / Subtasks

- [ ] Task 1: Create prose linter extension (AC: #1, #2, #9)
  - [ ] Create a linter function for the prose editor:
    ```typescript
    import { linter, type Diagnostic } from '@codemirror/lint';

    function proseLinter(variables: Signal<ProseVariable[]>): Extension {
      return linter((view: EditorView): Diagnostic[] => {
        const text = view.state.doc.toString().trim();
        if (!text) return []; // AC #6: empty → no diagnostics

        const result = parseProse(text);
        const diagnostics: Diagnostic[] = [];

        if (!result.success) {
          for (const error of result.errors) {
            diagnostics.push({
              from: error.start,
              to: error.end,
              severity: 'error',
              message: error.message,
            });
          }
        }

        // Unknown variable warnings (Task 2)
        // ...

        return diagnostics;
      }, { delay: 300 });
    }
    ```
  - [ ] Add `proseLinter(this.variables)` to the prose CodeMirror extensions (alongside `proseLanguageExtension`)
  - [ ] The existing `ruleFieldTheme` already has wavy underline styling for both errors and warnings:
    - `.cm-lintRange-error`: `textDecoration: underline wavy var(--color-text-error, #dc2626)`
    - `.cm-lintRange-warning`: `textDecoration: underline wavy var(--color-status-warning, #d97706)`
  - [ ] **Do NOT add a separate `hoverTooltip()` extension** — CodeMirror's built-in `linter()` already provides hover tooltips for diagnostic ranges. Adding `hoverTooltip()` would produce duplicate tooltips.
- [ ] Task 2: Add unknown variable warnings (AC: #3, #4)
  - [ ] After successful parse, extract all variable references from the JSONLogic result:
    ```typescript
    function extractVarPaths(jsonLogic: unknown): string[] {
      // Recursively walk JSONLogic, collect all {"var": "path"} values
    }
    ```
  - [ ] For each variable path, check if it exists in the `ProseVariable[]` dictionary
  - [ ] To get variable positions in the editor text, use the tokenizer (story 7.3): run `tokenize(text)`, find variable tokens, match paths
  - [ ] Unknown variables → `Diagnostic` with `severity: 'warning'`, message: `Variable inconnue : '${path}'`
  - [ ] Warnings do NOT block save on blur (update story 7.6's blur behavior: valid + warnings → save)
- [ ] Task 3: Error border styling (AC: #5)
  - [ ] Add `[class.has-error]="hasBlockingErrors()"` to the `.rule-field` container in the template
  - [ ] `hasBlockingErrors` computed: `computed(() => { const r = this.parseResult(); return r !== null && !r.success; })`
  - [ ] CSS:
    ```css
    .rule-field.has-error {
      border-color: var(--color-text-error, #dc2626);
      box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.08);
    }
    ```
  - [ ] Remove `.has-error` when errors are resolved (signal-driven, automatic)
- [ ] Task 4: Update validation badge for warning state (AC: #4)
  - [ ] **Extend** the validation badge from story 7.6 (do not replace it):
    - Add `unknownVarCount` computed: count unknown variables from linter diagnostics
    - Badge states:
      - Empty editor → no badge
      - Valid, no warnings → green "Valide" (+ branch count)
      - Valid, with warnings → amber "Avertissement — {n} variable(s) inconnue(s)"
      - Errors → red with first error message
  - [ ] Amber badge style: `background: var(--color-status-warning, #d97706); color: white;`
- [ ] Task 5: Handle edge cases (AC: #6, #7, #8, #10, #11)
  - [ ] Empty rule: linter returns empty array, badge hidden → already handled
  - [ ] Rule becomes empty: detect in `updateListener` → set `parseResult` to null, clear diagnostics
  - [ ] Line wrapping: `EditorView.lineWrapping` → already in extensions from story 7.6
  - [ ] Debounce: linter `{ delay: 300 }` → already configured
  - [ ] Paste: CM fires `docChanged` → linter runs after delay → works automatically
  - [ ] Undo/redo: `history()` already in extensions from story 7.6 → each change triggers linter
  - [ ] No additional work needed for these — just verify in tests
- [ ] Task 6: Update blur behavior for warnings (AC: #4)
  - [ ] Modify the blur handler from story 7.6:
    - Valid + no warnings → save + read mode (unchanged)
    - Valid + warnings → **save + read mode** (warnings don't block)
    - Errors → stay in edit mode (unchanged)
  - [ ] The `hasBlockingErrors` check should exclude warnings
- [ ] Task 7: Write tests (AC: all)
  - [ ] Test error diagnostic appears with wavy underline for syntax error
  - [ ] Test unknown variable shows amber warning diagnostic
  - [ ] Test `.has-error` class applied when errors present
  - [ ] Test `.has-error` removed when errors resolved
  - [ ] Test warnings don't block save (blur with valid + warnings → saves)
  - [ ] Test empty rule shows no diagnostics, no badge
  - [ ] Test rule becomes empty → badge hidden
  - [ ] Test validation badge shows correct state for: valid, valid+warnings, errors
  - [ ] Test debounce: verify linter respects 300ms delay (use `fakeAsync`/`tick`)
  - [ ] Run tests: `npx ng test --no-watch`

## Dev Notes

### Architecture & Patterns

- **Component to modify:** `src/app/shared/components/rule-field/rule-field.component.ts`
- **Prerequisite:** Story 7.6 must be completed. After 7.6, the component will have:
  - Prose CodeMirror instance with `proseLanguageExtension`, `history()`, debounced parsing
  - `parseResult` signal of type `Signal<ParseResult | null>`
  - Validation badge with green/red states
  - Blur handler with save/stay logic
- This story adds the linter extension and extends the badge with amber warning state.

### Existing CM Lint Infrastructure (reuse, don't recreate)

The `ruleFieldTheme` in `rule-field.component.ts` (lines 73-125) already defines lint styling:
```typescript
'.cm-lintRange-error': {
  backgroundImage: 'none',
  textDecoration: 'underline wavy var(--color-text-error, #dc2626)',
},
'.cm-lintRange-warning': {
  backgroundImage: 'none',
  textDecoration: 'underline wavy var(--color-status-warning, #d97706)',
},
```
These styles apply automatically when you use `linter()` — no additional CSS needed for the underlines.

CodeMirror's `linter()` extension also provides:
- Built-in hover tooltips on diagnostic ranges (shows the `message`)
- Gutter markers if `lintGutter()` is added
- Panel display for all diagnostics if `lintKeymap` is enabled

### Error Position Mapping

The parser (story 7.3) returns errors with `{ start, end, line, col, message }`. These map directly to CM `Diagnostic`:
```typescript
{ from: error.start, to: error.end, severity: 'error', message: error.message }
```

### Variable Validation Flow

```
[Prose text] → parseProse() → [JSONLogic result]
                                     ↓
                              extractVarPaths() → ['statut', 'community.siret', ...]
                                     ↓
                              check each against ProseVariable[] dictionary
                                     ↓
                              unknown → find token position in tokenize(text)
                                     ↓
                              Diagnostic { from, to, severity: 'warning', message }
```

### Performance Note

The implementation brief says "Parser must complete in <50ms for rules up to 20 conditions." The 300ms debounce handles typing frequency. If performance is an issue, the linter can share the same `parseProse()` result as the `parseResult` signal (avoid parsing twice).

### What NOT to Do

- Do not add a separate `hoverTooltip()` — CM's `linter()` already provides tooltips
- Do not add a `lintGutter()` for prose mode — the gutter is optional and may clutter the UI
- Do not create custom tooltip components — use CM built-in
- Do not change error colors to `#b32020` — use the existing CSS variables (`var(--color-text-error, #dc2626)`) for consistency

### Project Structure Notes

- File: `src/app/shared/components/rule-field/rule-field.component.ts`
- Test: `src/app/shared/components/rule-field/rule-field.component.spec.ts`
- Import: `src/app/shared/utils/prose-parser.ts` (story 7.3 — `parseProse`, `ParseError`)
- Import: `src/app/shared/utils/prose-tokenizer.ts` (story 7.3 — `tokenize` for variable positions)
- Import: `src/app/shared/services/variable-dictionary.service.ts` (story 7.5 — `ProseVariable`)
- Run tests: `npx ng test --no-watch`

### References

- [Source: _bmad-output/planning-artifacts/v1.1/epics.md#Story 7.8]
- [Source: _bmad-output/planning-artifacts/v1.1/prose-editor-implementation-brief.md#Section 8]
- [Source: src/app/shared/components/rule-field/rule-field.component.ts:73-125 — existing ruleFieldTheme lint styling]
- [Source: _bmad-output/planning-artifacts/v1.1/prose-editor-implementation-brief.md#Non-Functional Requirements — <50ms parser]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
