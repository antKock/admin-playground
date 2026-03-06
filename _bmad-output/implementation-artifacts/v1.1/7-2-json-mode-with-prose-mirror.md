# Story 7.2: JSON Mode with Prose Mirror

Status: ready-for-dev
Depends-on: 7.1 (state machine, `RuleEditorState` signal, `tk-*` CSS classes, `activeMode` computed)

## Story

As an admin,
I want to edit raw JSONLogic with a read-only prose translation shown above the editor,
so that I can use JSON directly while still seeing the human-readable interpretation.

## Acceptance Criteria

1. **Given** a rule field in JSON mode with a non-empty value **When** the page loads **Then** the prose translation is displayed as a read-only mirror above the JSON content (syntax-colored with `tk-*` classes, same rendering as Texte Read mode but without click-to-edit)
2. Below the prose mirror, the JSON content is shown in a formatted read-only display (a `<pre class="json-read-zone">` block with indented JSON). Clicking the JSON display transitions to `json-edit`.
3. **Given** a rule field in JSON edit mode **When** the admin edits JSON **Then** the prose mirror updates in real-time as the JSON changes
4. If the JSON is invalid or un-translatable (`translateJsonLogicToProse()` returns `null`), the prose mirror is hidden entirely — no error or placeholder replaces it. Use the existing `@if (proseParts())` conditional pattern.
5. **Given** the segmented toggle **When** the admin clicks "JSON" **Then** the view switches to JSON mode (read or edit depending on prior Texte sub-state)
6. **When** the admin clicks "Texte" **Then** the view switches to Texte mode (read or edit depending on prior JSON sub-state)
7. The segmented toggle (`Texte | JSON`) is a visual control in the `field-label-row`, right-aligned next to the field label
8. The prose mirror in JSON mode is always read-only (no click-to-edit on the prose section, no hover effect)
9. State transitions preserve read/edit sub-state: `texte-read` ↔ `json-read`, `texte-edit` ↔ `json-edit`
10. **Given** an empty/null value + JSON mode toggle **Then** the field opens in `json-edit` state (matching the brief's state 4 entry condition: "toggle to JSON with empty rule")

## Tasks / Subtasks

- [ ] Task 1: Add segmented toggle UI (AC: #5, #6, #7)
  - [ ] Add `Texte | JSON` segmented toggle in the `rule-field-header` row, right-aligned
  - [ ] Style as pill-shaped toggle: `border-radius: 12px`, two segments
  - [ ] Active segment: `background: var(--color-brand, #1400cc); color: white`
  - [ ] Inactive segment: `background: transparent; color: var(--color-brand, #1400cc)`
  - [ ] Size: `font-size: 11px; padding: 4px 12px; font-weight: 600; text-transform: uppercase`
  - [ ] Toggle sets `activeMode` which updates `editorState` accordingly
  - [ ] Default to `'texte'` mode
- [ ] Task 2: Implement JSON read mode display (AC: #1, #2, #8)
  - [ ] When `editorState === 'json-read'`:
    1. Show prose mirror (read-only): reuse `proseParts` computed with `tk-*` token classes. Add `read-only` CSS class (no cursor:pointer, no hover background, no click handler on prose section).
    2. Show JSON read display: `<pre class="json-read-zone">` containing `JSON.stringify(JSON.parse(value()), null, 2)` for formatted indentation. If value is empty/unparseable, show raw value.
    3. Clicking the `json-read-zone` → set `editorState` to `'json-edit'`
  - [ ] Hide prose mirror if `proseParts()` returns null (existing `@if` pattern)
- [ ] Task 3: Implement JSON edit mode with live prose mirror (AC: #3, #4)
  - [ ] When `editorState === 'json-edit'`: show read-only prose mirror above + JSON CodeMirror editor below
  - [ ] Prose mirror updates reactively: create a `jsonEditorValue` signal that tracks the CM editor content, feed into `translateJsonLogicToProse(jsonEditorValue(), mode())`
  - [ ] If translation returns null → hide prose mirror entirely (no error state)
- [ ] Task 4: Implement blur-to-read for JSON editor (AC: #9)
  - [ ] Detect CodeMirror blur via `EditorView.updateListener.of((update) => { if (update.focusChanged && !update.view.hasFocus) { ... } })`
  - [ ] On blur, if JSON is valid → save value, set `editorState` to `'json-read'`
  - [ ] On blur, if JSON is invalid → stay in `json-edit`, show errors
- [ ] Task 5: Wire all state transitions (AC: #5, #6, #9, #10)
  - [ ] Texte Read → JSON toggle → JSON Read
  - [ ] Texte Edit → JSON toggle → JSON Edit
  - [ ] JSON Read → Texte toggle → Texte Read
  - [ ] JSON Edit → Texte toggle → Texte Edit
  - [ ] JSON Read → click json-read-zone → JSON Edit
  - [ ] JSON Edit → blur valid → JSON Read
  - [ ] JSON Edit → blur invalid → stay JSON Edit
  - [ ] Empty value + JSON toggle → JSON Edit (AC #10)
- [ ] Task 6: Write tests (AC: all)
  - [ ] Test segmented toggle switches between texte and json modes
  - [ ] Test toggle default state is 'texte'
  - [ ] Test prose mirror renders in json-read mode (read-only, no click handler)
  - [ ] Test JSON read display shows formatted JSON in `<pre>`
  - [ ] Test clicking json-read-zone transitions to json-edit
  - [ ] Test prose mirror updates live during json-edit
  - [ ] Test invalid JSON hides prose mirror
  - [ ] Test mode toggle preserves read/edit sub-state
  - [ ] Test empty value + JSON toggle → json-edit
  - [ ] Test blur with valid JSON → json-read
  - [ ] Test blur with invalid JSON → stays json-edit

## Dev Notes

### Architecture & Patterns

- **Component to modify:** `src/app/shared/components/rule-field/rule-field.component.ts`
- **Prerequisite:** Story 7.1 must be completed first. After 7.1, the component will have:
  - `editorState` signal of type `RuleEditorState` (`'texte-read' | 'texte-edit' | 'json-read' | 'json-edit'`)
  - `activeMode` computed (`'texte' | 'json'`)
  - `tk-*` CSS classes for token coloring
  - Prose read zone with hover/click-to-edit behavior
- The existing JSON CodeMirror editor stays as the `json-edit` implementation. No new CM instance needed for JSON mode.
- The existing `proseTranslation` and `proseParts` computed signals already do the prose rendering — reuse them for the prose mirror.

### Component Size Note

After stories 7.1 and 7.2, `rule-field.component.ts` will grow significantly (from 342 lines to ~500+). If it exceeds ~600 lines, consider extracting the template into a separate `.html` file. Do NOT split into sub-components unless the template extraction is insufficient.

### Segmented Toggle Layout

```
┌─────────────────────────────────────────────────┐
│  RÈGLE JSONLOGIC           [Texte] [JSON]       │
│                                                 │
│  (prose mirror — read-only in JSON mode)        │
│  ┌─────────────────────────────────────────────┐│
│  │  <pre> formatted JSON (read) or CM (edit)   ││
│  └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

### What NOT to Do

- Do not implement Texte Edit mode — that's story 7.6
- Do not add prose language/syntax highlighting for CodeMirror — that's story 7.4
- Do not add autocomplete — that's story 7.7
- Do not change the data model — both modes read/write the same JSONLogic value
- Do not change `valueChange` or `validChange` output contracts

### Project Structure Notes

- File: `src/app/shared/components/rule-field/rule-field.component.ts`
- Test: `src/app/shared/components/rule-field/rule-field.component.spec.ts`
- Run tests: `npx ng test --no-watch`

### References

- [Source: _bmad-output/planning-artifacts/v1.1/epics.md#Story 7.2]
- [Source: _bmad-output/planning-artifacts/v1.1/prose-editor-implementation-brief.md#Section 2 (state machine table), 3.3]
- [Source: src/app/shared/components/rule-field/rule-field.component.ts — existing JSON CodeMirror, EditorView.updateListener pattern at ngAfterViewInit]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
