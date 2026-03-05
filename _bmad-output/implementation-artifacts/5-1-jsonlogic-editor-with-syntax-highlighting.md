# Story 5.1: JSONLogic Editor with Syntax Highlighting

Status: review

## Story

As an operator (Sophie),
I want a proper code editor for JSONLogic rules with syntax highlighting and inline validation,
so that writing and editing complex rules is faster and less error-prone.

## Acceptance Criteria

1. **Given** an operator opens a JSONLogic rule field **When** the editor renders **Then** it uses CodeMirror 6 with JSON syntax highlighting **And** it replaces the plain multi-line textarea from v1
2. **Given** an operator types a JSONLogic rule **When** the JSON is syntactically invalid **Then** inline validation highlights the error with a clear message (line number, expected token) **And** the error is caught before save — no need to submit to discover the issue
3. **Given** an operator types valid JSON **When** the editor validates it **Then** no error indicators are shown **And** the editor provides bracket matching and auto-indentation

## Tasks / Subtasks

- [x] Task 1: Install and configure CodeMirror 6 (AC: #1)
  - [x] Install `codemirror`, `@codemirror/lang-json`, `@codemirror/view`, `@codemirror/state`, `@codemirror/lint` packages
  - [x] Verify Angular 21 compatibility — CodeMirror 6 is framework-agnostic, wraps in Angular component via `EditorView`
  - [x] No need for `ngx-codemirror` — use direct CM6 API for lighter integration

- [x] Task 2: Replace RuleFieldComponent textarea with CodeMirror (AC: #1, #3)
  - [x] Modify `src/app/shared/components/rule-field/rule-field.component.ts` in-place
  - [x] Create `EditorView` instance in `ngAfterViewInit`, destroy in `ngOnDestroy`
  - [x] Configure extensions: `json()` language, `bracketMatching()`, `autocompletion()`, `indentOnInput()`
  - [x] Preserve existing component API: `value` input, `valueChange` output, `validChange` output, `label` input, `placeholder` input
  - [x] Style the editor to match existing `.rule-field` container (brand border, monospace, 8px radius)
  - [x] Keep `extractVariables()` utility function and `variablesLabel` computed — these remain unchanged
  - [x] Set editor min-height ~60px (matching current textarea), allow vertical resize

- [x] Task 3: Add inline JSON linting (AC: #2)
  - [x] Use `@codemirror/lint` with `linter()` extension
  - [x] Write a custom JSON linter that calls `JSON.parse()` and converts `SyntaxError` message/position to CM6 `Diagnostic`
  - [x] Show error marker in gutter + underline in editor at error position
  - [x] Display error message below editor (replacing current "Invalid JSON syntax" hint) with line/column info
  - [x] Lint on every keystroke with debounce (~300ms) to avoid jank
  - [x] Emit `validChange(false)` when lint errors exist, `validChange(true)` when clean

- [x] Task 4: Theme integration (AC: #1)
  - [x] Create a custom CM6 theme matching the app's design tokens:
    - Background: `var(--color-surface-base)`
    - Text: `var(--color-text-primary)`
    - Selection: `rgba(20, 0, 204, 0.08)` (matching focus ring)
    - Gutter: `var(--color-surface-muted)`
    - Strings: brand accent color
    - Error underline: `var(--color-text-error, #dc2626)`
  - [x] Match existing `.rule-field` border and focus states

- [x] Task 5: Tests (AC: #1-3)
  - [x] Update `rule-field.component.spec.ts`:
    - Renders CodeMirror editor (not textarea)
    - Emits `valueChange` on content change
    - Emits `validChange(false)` for invalid JSON
    - Emits `validChange(true)` for valid JSON
    - Shows error diagnostic for malformed JSON
    - `extractVariables` still works (unit test the function)
  - [x] Note: CM6 in tests may need `document` — Vitest with jsdom should work

## Dev Notes

### What Exists Today (DO NOT Reinvent)

- **RuleFieldComponent** at `src/app/shared/components/rule-field/rule-field.component.ts` — the component to modify in-place
- **`extractVariables()` function** — already extracts `{"var": "..."}` references from JSONLogic; keep as-is
- **`variablesLabel` computed** — displays "Rule references: field1, field2" above the editor; keep as-is
- **IndicatorCardComponent** at `src/app/shared/components/indicator-card/indicator-card.component.ts` — the parent that renders `<app-rule-field>`. Do NOT modify this component — the API contract must stay identical

### Why CodeMirror 6 (Not Monaco)

- Monaco is ~5MB+ bundle, overkill for JSON-only editing
- CodeMirror 6 is tree-shakeable, ~50-80KB for JSON mode + lint
- CM6 is framework-agnostic, no wrapper needed — just `new EditorView()`
- CM6 has first-class JSON language support and lint infrastructure

### Architecture Compliance

- **File location:** Modify in-place at `src/app/shared/components/rule-field/rule-field.component.ts` — no new files needed except possibly a theme file
- **Component API:** Must be 100% backward-compatible. `IndicatorCardComponent` uses: `[value]`, `[label]`, `[placeholder]`, `(valueChange)`, `(validChange)` — all must remain
- **No new services or stores** — this is a pure UI component change
- **Test co-location:** spec file stays next to component

### Critical Implementation Details

- CM6 uses `EditorState` + `EditorView` — state is immutable, view manages DOM
- To set value programmatically (when `value()` input changes): use `view.dispatch({ changes: { from: 0, to: doc.length, insert: newValue } })`
- To read value: `view.state.doc.toString()`
- Use `EditorView.updateListener` extension to emit `valueChange` on doc changes
- **Avoid circular updates:** When setting value from input signal, don't re-emit `valueChange`

### Project Structure Notes

- No new domain/feature/page files needed — this is a shared component modification
- `package.json` will gain CM6 dependencies
- Alignment with ACTEE: shared components remain presentation-only, no store injection

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.1]
- [Source: _bmad-output/planning-artifacts/architecture.md#Shared Components]
- [Source: src/app/shared/components/rule-field/rule-field.component.ts — current implementation]
- [Source: src/app/shared/components/indicator-card/indicator-card.component.ts — parent consumer]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Fixed fakeAsync test issue — Vitest with jsdom doesn't support zone.js fakeAsync; used synchronous CM6 dispatch instead
- Fixed validation not running on external input changes — added validateJson call in the effect that syncs external value

### Completion Notes List

- Installed 5 CM6 packages: codemirror, @codemirror/lang-json, @codemirror/view, @codemirror/state, @codemirror/lint
- Replaced textarea with CodeMirror 6 EditorView in RuleFieldComponent — backward-compatible API preserved
- Implemented custom JSON linter with 300ms debounce, gutter markers, error underlines, and error message display
- Created custom CM6 theme matching app design tokens (brand colors, surface vars, focus rings)
- Updated spec file with 13 tests covering: CM editor rendering, value changes, validation, error messages, extractVariables
- All 354 tests pass, zero regressions, build succeeds

### File List

- `package.json` — added CM6 dependencies
- `package-lock.json` — updated lockfile
- `src/app/shared/components/rule-field/rule-field.component.ts` — replaced textarea with CodeMirror 6 editor
- `src/app/shared/components/rule-field/rule-field.component.spec.ts` — updated tests for CM6 editor

## Change Log

- 2026-03-05: Replaced plain textarea with CodeMirror 6 JSON editor with syntax highlighting, inline linting, bracket matching, and custom theme
