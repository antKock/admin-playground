# Story 7.6: Texte Edit Mode Component

Status: ready-for-dev
Depends-on: 7.1 (state machine, `RuleEditorState` signal), 7.3 (`parseProse()`, `ParseResult`), 7.4 (`proseLanguageExtension`)

## Story

As an admin,
I want to type French prose rules with real-time syntax highlighting and validation feedback,
so that I can author rules without knowing JSONLogic syntax.

## Acceptance Criteria

1. **Given** the rule field transitions to Texte Edit mode (from read mode click, or empty rule on page load) **When** the editor activates **Then** CodeMirror initializes with the prose language extension (story 7.4)
2. Existing rule content is loaded as prose (translated from stored JSONLogic via `translateJsonLogicToProse()`, HTML tags stripped, entities decoded)
3. Cursor is positioned at the end of the content
4. For empty rules, a placeholder is shown: "Saisir une règle… ex : statut fait partie de ['actif']"
5. **Given** the admin types valid prose **When** the prose changes **Then** the parser (story 7.3) converts it to JSONLogic in real-time (debounced ~300ms)
6. A validation badge appears: green "Valide" (with branch count for multi-OR: "Valide — {n} branches OR")
7. **Given** the admin types invalid prose **When** the parser returns errors **Then** a validation badge appears: red with first error message
8. The editor remains usable (errors don't block typing)
9. **Given** the editor is in focus and the admin clicks outside (blur) **When** the current prose is valid **Then** the JSONLogic value is saved to the form model via `valueChange.emit()` **And** the field transitions back to Texte Read mode
10. **When** the current prose is invalid **Then** the field stays in Texte Edit mode **And** errors remain visible
11. The validation badge sits in a `validation-row` div below the editor content
12. No border change on focus/blur — the border stays `stroke-standard` (use the `proseEditorTheme` from story 7.1 that neutralizes `.cm-focused` styles)
13. Line breaks are whitespace for readability — blank lines denote top-level OR branch separation
14. The prefix line ("Le paramètre est activé si :") is NOT shown in edit mode — only in read mode
15. **ProseMode** (`'condition'` | `'value'`) is respected: value mode may use bullet `if/then` patterns. The mode is passed through when loading prose and when parsing.

## Tasks / Subtasks

- [ ] Task 1: Create prose CodeMirror editor instance (AC: #1, #3, #4, #12)
  - [ ] When `editorState === 'texte-edit'`, create a CodeMirror instance with:
    ```typescript
    import { proseLanguageExtension } from '@shared/utils/prose-codemirror-language';
    import { history } from '@codemirror/commands';

    extensions: [
      proseLanguageExtension,       // story 7.4: syntax highlighting
      bracketMatching(),             // bracket matching
      EditorView.lineWrapping,       // line wrapping
      history(),                     // undo/redo support
      cmPlaceholder("Saisir une règle… ex : statut fait partie de ['actif']"),
      proseEditorTheme,              // story 7.1: no focus border change
      updateListener,                // change detection (see Task 3)
    ]
    ```
  - [ ] Position cursor at end after init: `view.dispatch({ selection: { anchor: doc.length } })`
  - [ ] Use a dedicated `prose-cm-host` div (separate from the JSON CM host)
  - [ ] Destroy the prose CodeMirror instance when leaving `texte-edit` state
- [ ] Task 2: Load existing rule as prose (AC: #2)
  - [ ] On entering `texte-edit`: take current JSONLogic value → `translateJsonLogicToProse(value(), mode())` → strip HTML → decode entities → set as editor content
  - [ ] HTML stripping + entity decoding (complete list):
    ```typescript
    function proseToPlainText(html: string): string {
      return html
        .replace(/<[^>]+>/g, '')       // strip all HTML tags
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"');
    }
    ```
  - [ ] Bullet branch conversion for OR branches:
    1. Split on `\n`
    2. Strip leading `• ` from each line
    3. Join with `\n\n` (blank line between branches — parser interprets blank lines as top-level OR)
  - [ ] If translation returns null (invalid JSON or empty), start with empty editor content
- [ ] Task 3: Real-time parsing with debounce (AC: #5, #8, #13)
  - [ ] Add `EditorView.updateListener` that on `docChanged`:
    ```typescript
    // Debounce pattern
    private parseTimeout: ReturnType<typeof setTimeout> | null = null;

    // In updateListener:
    if (update.docChanged) {
      if (this.parseTimeout) clearTimeout(this.parseTimeout);
      this.parseTimeout = setTimeout(() => {
        const text = update.state.doc.toString();
        this.parseResult.set(parseProse(text));
      }, 300);
    }
    ```
  - [ ] Store result in `parseResult` signal of type `Signal<ParseResult | null>`
  - [ ] Import `parseProse` from `@shared/utils/prose-parser`:
    ```typescript
    import { parseProse, type ParseResult, type ParseError } from '@shared/utils/prose-parser';
    ```
  - [ ] `ParseResult` type (defined in story 7.3):
    ```typescript
    type ParseResult =
      | { success: true; jsonLogic: unknown }
      | { success: false; errors: ParseError[]; partialResult?: unknown }
    ```
- [ ] Task 4: Validation badge (AC: #6, #7, #11)
  - [ ] Add `validation-row` div below the editor CM host:
    ```html
    @if (parseResult(); as result) {
      <div class="validation-row">
        @if (result.success) {
          <span class="validation-badge valid">Valide{{ orBranchCount() > 1 ? ' — ' + orBranchCount() + ' branches OR' : '' }}</span>
        } @else {
          <span class="validation-badge error">{{ result.errors[0]?.message }}</span>
        }
      </div>
    }
    ```
  - [ ] Badge styles:
    - Valid: `background: #059669; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px;`
    - Error: `background: #b32020; color: white; ...same...`
    - (Amber/warning state is added in story 7.8)
  - [ ] `orBranchCount` computed: count top-level OR branches in `parseResult().jsonLogic` (check if root is `{"or": [...]}` → `.length`)
  - [ ] When editor is empty: `parseResult` is null → no badge shown
- [ ] Task 5: Blur behavior — save or stay (AC: #9, #10)
  - [ ] Detect blur via `EditorView.updateListener`: `if (update.focusChanged && !update.view.hasFocus)`
  - [ ] On blur, if `parseResult()?.success === true`:
    1. Convert JSONLogic result to JSON string: `JSON.stringify(parseResult().jsonLogic)`
    2. Emit via `valueChange.emit(jsonString)`
    3. Set `editorState` to `'texte-read'`
    4. Destroy prose CodeMirror instance
  - [ ] On blur, if parse failed or `parseResult` is null (empty):
    1. If empty → allow transition to read mode (empty is valid)
    2. If errors → stay in `texte-edit`, keep error badge visible, do NOT emit value change
- [ ] Task 6: Write tests (AC: all)
  - [ ] Test entering edit mode loads prose from JSONLogic (verify `translateJsonLogicToProse` is called)
  - [ ] Test bullet branches converted to blank-line-separated blocks
  - [ ] Test typing valid prose shows green badge with "Valide"
  - [ ] Test multi-OR valid prose shows branch count
  - [ ] Test typing invalid prose shows red badge with error message
  - [ ] Test blur with valid prose: `valueChange` emitted, state → `texte-read`
  - [ ] Test blur with invalid prose: stays `texte-edit`, no `valueChange`
  - [ ] Test empty rule shows placeholder, no badge
  - [ ] Test prefix line is NOT shown in edit mode
  - [ ] Test debounce: parser not called on every keystroke

## Dev Notes

### Architecture & Patterns

- **Component to modify:** `src/app/shared/components/rule-field/rule-field.component.ts`
- **Prerequisites:** After stories 7.1, 7.3, 7.4 are completed, the component will have:
  - `editorState` signal of type `RuleEditorState` (from 7.1)
  - `proseEditorTheme` that neutralizes `.cm-focused` styles (from 7.1)
  - `parseProse()` function available (from 7.3)
  - `proseLanguageExtension` available (from 7.4)
- The component manages **two** CodeMirror instances:
  1. JSON editor (existing) — for `json-edit` state
  2. Prose editor (new) — for `texte-edit` state
- Only one is active at a time. Create on state entry, destroy on state exit.

### Prose ↔ JSONLogic Data Flow

```
[JSONLogic stored value]
    ↓ translateJsonLogicToProse(value(), mode()) + proseToPlainText()
[Prose text in CodeMirror]
    ↓ parseProse() on change (debounced 300ms)
[ParseResult: { success, jsonLogic } or { success: false, errors }]
    ↓ on blur if success
[JSON.stringify(jsonLogic) → valueChange.emit()]
```

### Bullet ↔ Blank Line Conversion

Stored JSONLogic `{"or": [branch1, branch2]}` → `translateJsonLogicToProse()` → prose with bullets:
```
• condition1 et condition2
• condition3
```
In edit mode, bullets are NOT shown. Convert to blank-line-separated:
```
condition1 et condition2

condition3
```
When loading: strip `• ` prefix, convert `\n` → `\n\n` between branches.
When parsing: blank lines → top-level OR (parser handles this natively).

### Existing CodeMirror Patterns to Follow

Reference the `ngAfterViewInit()` method in `rule-field.component.ts`:
- `EditorState.create({ doc, extensions })` for state creation
- `new EditorView({ state, parent })` for view creation
- `editorView.destroy()` for cleanup
- `EditorView.updateListener.of()` for change + blur detection

### What NOT to Do

- Do not add inline error marks (wavy underlines) — that's story 7.8
- Do not add autocomplete — that's story 7.7
- Do not show the prefix line in edit mode — it's read-mode only
- Do not change the data model — prose is an editing interface, not a storage format
- Do not change `valueChange` or `validChange` output contracts

### Project Structure Notes

- File: `src/app/shared/components/rule-field/rule-field.component.ts`
- Test: `src/app/shared/components/rule-field/rule-field.component.spec.ts`
- Import: `src/app/shared/utils/prose-parser.ts` → `parseProse`, `ParseResult`, `ParseError`
- Import: `src/app/shared/utils/prose-codemirror-language.ts` → `proseLanguageExtension`
- Import: `src/app/shared/utils/jsonlogic-prose.ts` → `translateJsonLogicToProse` (already imported)
- Run tests: `npx ng test --no-watch`

### References

- [Source: _bmad-output/planning-artifacts/v1.1/epics.md#Story 7.6]
- [Source: _bmad-output/planning-artifacts/v1.1/prose-editor-implementation-brief.md#Section 2, 8, 9]
- [Source: src/app/shared/components/rule-field/rule-field.component.ts — existing CM setup in ngAfterViewInit]
- [Source: src/app/shared/utils/jsonlogic-prose.ts — translateJsonLogicToProse for loading]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
