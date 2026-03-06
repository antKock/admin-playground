# Story 7.1: Texte Read Mode Component

Status: ready-for-dev
Depends-on: none (first story in epic, can run in parallel with 7.3 and 7.5)

## Story

As an admin,
I want to see JSONLogic rules displayed as readable French prose with syntax colors on page load,
so that I can understand rule logic without reading raw JSON.

## Acceptance Criteria

1. **Given** a rule field with a non-empty JSONLogic value **When** the page loads **Then** the prose translation is displayed using existing `translateJsonLogicToProse()` with syntax-colored tokens (`tk-var`, `tk-kw`, `tk-val`, `tk-pfx`)
2. Top-level OR branches render as bullet points (`•`) using the existing `rule-or-list` `<ul>/<li>` pattern (keep the current CSS class names)
3. Prefix reads "Le paramètre est activé si :" for single conditions (prefix separate from condition text)
4. Prefix reads "Le paramètre est activé si au moins une de ces conditions est vraie :" for multiple OR branches
5. Hovering the prose zone shows a subtle background change and a "Modifier" button overlay (top-right)
6. Clicking anywhere in the prose zone (or the "Modifier" button) transitions to Texte Edit mode (story 7.6)
7. **Given** a rule field with an empty/null JSONLogic value **When** the page loads **Then** the field opens directly in Texte Edit mode with placeholder and cursor
8. Component supports `ProseMode` (`'condition'` | `'value'`) for different prefix styles (value mode: "La valeur par défaut est :", "La valeur par défaut correspond à la première condition vérifiée :")
9. Token colors are identical in read and edit mode (same CSS classes)
10. No border change between read and edit states — cursor + validation badge are the signals. Neutralize the existing `.cm-focused` border/shadow styles for the prose editor.

## Tasks / Subtasks

- [ ] Task 1: Introduce 4-state machine type and signal (AC: #1, #6, #7)
  - [ ] Define `RuleEditorState` type: `'texte-read' | 'texte-edit' | 'json-read' | 'json-edit'` — **IMPORTANT:** do NOT name this `EditorState` because `EditorState` is already imported from `@codemirror/state` (line 31)
  - [ ] Add `editorState` signal of type `RuleEditorState`, initialized based on whether value is empty/null (`texte-edit` if empty, `texte-read` otherwise)
  - [ ] Add `activeMode` computed: `computed(() => this.editorState().startsWith('texte') ? 'texte' : 'json')`
- [ ] Task 2: Refactor `jsonlogic-prose.ts` to emit semantic token spans (AC: #1, #9)
  - [ ] **Non-trivial refactor (~20+ call sites).** The current `bold()` helper wraps ALL tokens uniformly in `<strong>`. It does NOT distinguish variables from values. You must:
    1. Replace `bold()` with three helpers: `wrapVar(s)` → `<span class="tk-var">${s}</span>`, `wrapVal(s)` → `<span class="tk-val">${s}</span>`, `wrapKw(s)` → `<span class="tk-kw">${s}</span>`
    2. Update `resolveVar()` (line 40) to use `wrapVar()` instead of `bold()`
    3. Update `formatValue()` (line 33) and literal value wrapping in `resolveOperand()` to use `wrapVal()`
    4. Wrap operators/keywords (currently plain text) with `wrapKw()`: "fait partie de", "et", "ou", "contient", "ne contient pas", comparison operators, arithmetic operators, quantifier phrases, "Si", "alors", "sinon", "non", "satisfait", "satisfont", "minimum de", "maximum de", etc.
  - [ ] **Update `jsonlogic-prose.spec.ts`** — all ~40 test expectations that check for `<strong>` must be updated to check for the new `<span class="tk-*">` classes. This is mandatory — tests will break otherwise.
- [ ] Task 3: Refactor prose display for read mode (AC: #2, #3, #4, #8)
  - [ ] Keep the existing `rule-or-list` CSS class and `<ul>/<li>` pattern for OR branches — do NOT create a new `bullet-branch` class
  - [ ] Restructure `proseParts` to always separate prefix from condition text (currently single conditions embed prose inline: `Le paramètre est activé si ${prose}` — change to separate prefix string + condition HTML)
  - [ ] Render: `<em class="tk-pfx">[prefix]</em>` followed by the condition/branch HTML
  - [ ] Show prefix based on mode and branch count (existing `proseParts` logic, adapted)
- [ ] Task 4: Add hover-to-edit interaction (AC: #5, #6)
  - [ ] Wrap prose display in a `.prose-read-zone` container with hover state CSS (subtle background: `background: var(--color-surface-muted)` on hover)
  - [ ] Add "Modifier" button overlay positioned top-right, visible on hover only
  - [ ] On click anywhere in prose zone → set `editorState` to `'texte-edit'`
- [ ] Task 5: Handle empty rule state (AC: #7)
  - [ ] On init, if value is empty/null → set `editorState` to `'texte-edit'` immediately
- [ ] Task 6: Neutralize focus border for prose editor (AC: #10)
  - [ ] Create a `proseEditorTheme` that overrides `&.cm-focused` to remove `borderColor` change and `boxShadow` — or apply `outline: none; border-color: inherit; box-shadow: none` on `.cm-focused`
- [ ] Task 7: Add CSS token classes (AC: #9)
  - [ ] Define using CSS custom properties for consistency with existing design tokens:
    ```css
    .tk-var { color: var(--color-tk-var, #7c3aed); }
    .tk-kw  { color: var(--color-tk-kw, #555555); }
    .tk-val { color: var(--color-tk-val, #059669); }
    .tk-pfx { color: var(--color-tk-pfx, #888888); font-style: italic; }
    .tk-err { color: var(--color-tk-err, #b32020); }
    ```
- [ ] Task 8: Write tests (AC: all)
  - [ ] Test prose rendering with single condition shows separate prefix + condition
  - [ ] Test prose rendering with multi-OR shows bullet branches and correct prefix
  - [ ] Test click on prose zone transitions `editorState` to `'texte-edit'`
  - [ ] Test empty rule initializes `editorState` as `'texte-edit'`
  - [ ] Test `ProseMode` 'value' uses different prefix strings
  - [ ] Test `RuleEditorState` type does not collide with CM's `EditorState`

## Dev Notes

### Architecture & Patterns

- **Component to modify:** `src/app/shared/components/rule-field/rule-field.component.ts` (342 lines currently)
- **Utility to modify:** `src/app/shared/utils/jsonlogic-prose.ts` (357 lines — semantic token refactor)
- **Tests to update:** `src/app/shared/utils/jsonlogic-prose.spec.ts` (40+ test cases — `<strong>` → `<span class="tk-*">`)
- **DO NOT create a new component.** This is a refactor of the existing `RuleFieldComponent`. Selector stays `app-rule-field`.
- Do not change the `valueChange` or `validChange` output contracts.

### Token Color Specification

| Token | CSS Class | CSS Variable | Fallback |
|-------|-----------|-------------|----------|
| Variable | `tk-var` | `--color-tk-var` | `#7c3aed` |
| Keyword/Operator | `tk-kw` | `--color-tk-kw` | `#555555` |
| Value | `tk-val` | `--color-tk-val` | `#059669` |
| Prefix | `tk-pfx` | `--color-tk-pfx` | `#888888` |
| Error | `tk-err` | `--color-tk-err` | `#b32020` |

### What NOT to Do

- Do not remove the JSON CodeMirror editor — it stays for JSON mode (story 7.2)
- Do not implement the Texte Edit mode CodeMirror — that's story 7.6
- Do not add the segmented toggle UI — that's story 7.2
- Do not change the `valueChange` or `validChange` output contracts
- For now, clicking the prose zone sets the state signal only. The actual edit mode rendering is wired in story 7.6.

### Project Structure Notes

- File: `src/app/shared/components/rule-field/rule-field.component.ts`
- Test: `src/app/shared/components/rule-field/rule-field.component.spec.ts`
- Utility: `src/app/shared/utils/jsonlogic-prose.ts` (semantic token refactor)
- Utility test: `src/app/shared/utils/jsonlogic-prose.spec.ts` (must update all `<strong>` expectations)
- Run tests: `npx ng test --no-watch`

### References

- [Source: _bmad-output/planning-artifacts/v1.1/epics.md#Story 7.1]
- [Source: _bmad-output/planning-artifacts/v1.1/prose-editor-implementation-brief.md#Section 7]
- [Source: src/app/shared/utils/jsonlogic-prose.ts — translation engine, bold() helper at line 29]
- [Source: src/app/shared/components/rule-field/rule-field.component.ts — current component, EditorState import at line 31]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
