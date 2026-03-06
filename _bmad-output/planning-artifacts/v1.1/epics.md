# v1.1 Epic Breakdown — Prose Editor

> Reference: `prose-editor-implementation-brief.md`, `ux-prose-editor-variations.html`

---

## Overview

Epic v1.1 introduces a **dual-mode rule editor** for indicator parameter configuration. Admins can author JSONLogic rules via constrained French prose (Texte mode) or raw JSON (JSON mode), with a segmented toggle to switch between them. Both modes operate on the same underlying JSONLogic data.

This epic transforms the rule editing experience from JSON-only to a prose-first approach where non-technical program managers can read and write rules in natural French.

---

## Epic 7: Prose Editor — Dual-Mode Rule Field

**Description:** Replace the current JSON-only rule field with a dual-mode editor supporting French prose (Texte) and raw JSON editing, with a 4-state machine (Texte Read, Texte Edit, JSON Read, JSON Edit), context-aware autocomplete, real-time validation, and a variable dictionary assembled from indicators and entity properties.

**Depends on:** Epics 0–3 (existing rule-field component, indicator models, action models)

---

### Story 7.1: Texte Read Mode Component

As an admin,
I want to see JSONLogic rules displayed as readable French prose with syntax colors on page load,
So that I can understand rule logic without reading raw JSON.

**Acceptance Criteria:**

**Given** a rule field with a non-empty JSONLogic value
**When** the page loads
**Then** the prose translation is displayed using existing `translateJsonLogicToProse()` with syntax-colored tokens (`tk-var`, `tk-kw`, `tk-val`, `tk-pfx`)
**And** top-level OR branches render as bullet points (`•`) with the `bullet-branch` CSS class
**And** the prefix reads "Le paramètre est activé si :" for single conditions
**And** the prefix reads "Le paramètre est activé si au moins une de ces conditions est vraie :" for multiple OR branches
**And** hovering the prose zone shows a subtle background change and a "Modifier" button overlay (top-right)
**And** clicking anywhere in the prose zone (or the "Modifier" button) transitions to Texte Edit mode (story 7.6)

**Given** a rule field with an empty/null JSONLogic value
**When** the page loads
**Then** the field opens directly in Texte Edit mode (story 7.6) with placeholder and cursor

**Technical notes:**
- Prose rendering uses existing `jsonlogic-prose.ts` — no new translation logic needed
- The component must support `ProseMode` (`'condition'` | `'value'`) for different prefix styles
- Token colors are identical in read and edit mode (same CSS classes)
- No border change between read and edit states — cursor + validation badge are the signals

---

### Story 7.2: JSON Mode with Prose Mirror

As an admin,
I want to edit raw JSONLogic with a read-only prose translation shown above the editor,
So that I can use JSON directly while still seeing the human-readable interpretation.

**Acceptance Criteria:**

**Given** a rule field in JSON mode with a non-empty value
**When** the page loads
**Then** the prose translation is displayed as a read-only mirror above the JSON content (syntax-colored, same rendering as Texte Read mode but without click-to-edit)
**And** the JSON content is shown below in read mode (click to edit)

**Given** a rule field in JSON edit mode
**When** the admin edits JSON
**Then** the prose mirror updates in real-time as the JSON changes
**And** if the JSON is invalid or un-translatable, the prose mirror shows nothing (graceful degradation)

**Given** the segmented toggle
**When** the admin clicks "JSON"
**Then** the view switches to JSON mode (read or edit depending on prior state)
**When** the admin clicks "Texte"
**Then** the view switches to Texte mode (read or edit depending on prior state)

**Technical notes:**
- Restructure existing `rule-field.component.ts` which already has JSON CodeMirror + prose preview
- The prose mirror in JSON mode is always read-only (no click-to-edit on the prose section)
- The segmented toggle (`Texte | JSON`) is a visual control in the `field-label-row`, right-aligned next to the field label

---

### Story 7.3: Prose Tokenizer and Parser (Prose → JSONLogic)

As a developer,
I want a parser that converts constrained French prose into valid JSONLogic,
So that the Texte edit mode can store rules in the same format as the JSON editor.

**Acceptance Criteria:**

**Given** a prose string following the grammar defined in `jsonlogic-prose.ts` output patterns
**When** the parser processes it
**Then** it produces a valid JSONLogic object

**Supported patterns (all must parse correctly):**

| Prose Input | Expected JSONLogic |
|------------|-------------------|
| `statut = 'actif'` | `{"===": [{"var": "statut"}, "actif"]}` |
| `montant > 1000` | `{">": [{"var": "montant"}, 1000]}` |
| `statut fait partie de ['actif', 'en attente']` | `{"in": [{"var": "statut"}, ["actif", "en attente"]]}` |
| `age ≥ 18 et age ≤ 65` | `{"and": [{">=": [{"var": "age"}, 18]}, {"<=": [{"var": "age"}, 65]}]}` |
| `(x = 'a' ou y = 'b')` | `{"or": [{"===": [{"var": "x"}, "a"]}, {"===": [{"var": "y"}, "b"]}]}` |
| `au moins un élément de arr satisfait : x = 'a'` | `{"some": [{"var": "arr"}, {"===": [{"var": "x"}, "a"]}]}` |
| Blank-line-separated blocks | Top-level `{"or": [...]}` |
| `nombre_unite × cout_unitaire > 1000` | `{">": [{"*": [{"var": "nombre_unite"}, {"var": "cout_unitaire"}]}, 1000]}` |
| `community.siret = '123'` | `{"===": [{"var": "community.siret"}, "123"]}` |

**Round-trip invariant:**
**Given** any JSONLogic rule from the existing `jsonlogic-prose.spec.ts` test suite
**When** translated to prose via `translateJsonLogicToProse()` (stripping HTML tags) then parsed back via the new parser
**Then** the resulting JSONLogic is semantically equivalent to the original

**Error handling:**
**Given** malformed prose input
**When** the parser encounters an unrecognized token or structure
**Then** it returns a structured error with position information (line, column) and a French error message
**And** partial results are preserved where possible (parse what you can, mark the rest as error)

**Technical notes:**
- Implementation: hand-written recursive descent parser (not a parser generator)
- Create reverse operator map by inverting `OPERATOR_NAMES` from `jsonlogic-prose.ts`
- The tokenizer splits input into: variables (identifiers with dots), keywords, operators, values (numbers, quoted strings, arrays), parentheses
- Top-level OR detection: blank lines between independent AND-chains in edit mode
- File location: `src/app/shared/utils/prose-parser.ts` + `src/app/shared/utils/prose-tokenizer.ts`
- Test file: `src/app/shared/utils/prose-parser.spec.ts`
- Use `validateJsonLogic()` from existing `jsonlogic-validate.ts` as a safety net on parser output

---

### Story 7.4: CodeMirror Prose Language (Syntax Highlighting)

As an admin,
I want the prose editor to show syntax highlighting with the same colors as read mode,
So that the editing experience is visually consistent and I can easily identify variables, operators, and values.

**Acceptance Criteria:**

**Given** text typed in the prose editor
**When** it contains recognized tokens
**Then** variables are colored purple (`#7c3aed`, `tk-var`)
**And** keywords and operators are colored gray (`#555555`, `tk-kw`) — this includes `et`, `ou`, `fait partie de`, `contient`, `=`, `≠`, `>`, `<`, `≥`, `≤`, `×`, `÷`, quantifier phrases
**And** values are colored green (`#059669`, `tk-val`) — numbers, quoted strings `'...'`, arrays `[...]`
**And** unrecognized tokens are styled as errors (`#b32020`, `tk-err`)

**Given** nested parentheses in the prose
**When** the cursor is near a parenthesis
**Then** CodeMirror's bracket matching highlights the paired parenthesis

**Technical notes:**
- Use CodeMirror `StreamLanguage` (simpler than a full Lezer grammar) for line-based token recognition
- The tokenizer recognizes the same keywords as the parser (story 7.3) but only needs to classify token types, not build an AST
- File location: `src/app/shared/utils/prose-codemirror-language.ts`
- Monospace font: `'JetBrains Mono', 'Fira Code', 'SF Mono', monospace` at 13px, line-height 1.6

---

### Story 7.5: Variable Dictionary Service

As a developer,
I want a service that assembles the list of available variables for a given model,
So that the autocomplete and validation can reference the correct variable names and types.

**Acceptance Criteria:**

**Given** an action model being edited
**When** the variable dictionary is requested
**Then** it returns a `ProseVariable[]` containing:
- All indicators (by `technical_label`) as root-level variables (no prefix)
- Root entity properties from the action API response schema (prefixed with `action.`)
- For each associated entity type (community, building, user, etc.):
  - Entity properties (prefixed with `entity.`, e.g., `community.siret`)
  - All indicators (prefixed with `entity.`, e.g., `community.montant`)

**Given** a folder model being edited
**When** the variable dictionary is requested
**Then** the same logic applies with `folder` as the root entity prefix

**Data model:**
```typescript
interface ProseVariable {
  path: string;           // 'montant' or 'community.siret'
  type: 'nombre' | 'texte' | 'liste' | 'booleen' | 'date';
  group: string;          // '' (root) | 'action' | 'community' | 'building'
  source: 'indicator' | 'property';
}
```

**Caching:**
**Given** multiple rule fields on the same indicator card
**When** each requests the variable dictionary
**Then** the dictionary is computed once and shared (not re-fetched per field)

**Entity resolution:**
- Hardcoded: `Action_model` → `action`, `Folder_model` → `folder`
- API-driven: fetch root entity response → discover associated entity types from response structure
- For each entity type: fetch entity response → extract property names and types

**Technical notes:**
- File location: `src/app/shared/services/variable-dictionary.service.ts`
- The service sits at the shared level, injected where needed
- Variable types are inferred from API response values (string → `texte`, number → `nombre`, array → `liste`, boolean → `booleen`)

---

### Story 7.6: Texte Edit Mode Component

As an admin,
I want to type French prose rules with real-time syntax highlighting and validation feedback,
So that I can author rules without knowing JSONLogic syntax.

**Acceptance Criteria:**

**Given** the rule field transitions to Texte Edit mode (from read mode click, or empty rule on page load)
**When** the editor activates
**Then** CodeMirror initializes with the prose language (story 7.4)
**And** existing rule content is loaded as prose (translated from stored JSONLogic via `translateJsonLogicToProse()`, HTML tags stripped)
**And** the cursor is positioned at the end of the content
**And** for empty rules, a placeholder is shown: "Saisir une règle… ex : statut fait partie de ['actif']"

**Given** the admin types valid prose
**When** the prose changes
**Then** the parser (story 7.3) converts it to JSONLogic in real-time
**And** a validation badge appears: green "Valide" (with branch count for multi-OR)

**Given** the admin types invalid prose
**When** the parser returns errors
**Then** a validation badge appears: red with error message
**And** the editor remains usable (errors don't block typing)

**Given** the editor is in focus and the admin clicks outside (blur)
**When** the current prose is valid
**Then** the JSONLogic value is saved to the form model
**And** the field transitions back to Texte Read mode

**When** the current prose is invalid
**Then** the field stays in Texte Edit mode
**And** errors remain visible

**Technical notes:**
- The validation badge sits in a `validation-row` below the editor content
- No border change on focus/blur — the border stays `stroke-standard`
- Line breaks in the editor are whitespace for readability — they don't affect parsing except blank lines which denote top-level OR branch separation
- The prefix line ("Le paramètre est activé si :") is NOT shown in edit mode — only in read mode

---

### Story 7.7: Context-Aware Autocomplete

As an admin,
I want the editor to suggest variables, operators, and connectors based on what I've typed,
So that I can discover available options and type rules faster without memorizing syntax.

**Acceptance Criteria:**

**Given** the cursor is after a connector (`et`) or at the start of input
**When** autocomplete triggers
**Then** it shows two groups:
- **Indicateurs** — variable names grouped by entity (root indicators unprefixed, then entity-prefixed, each entity as a sub-group)
- **Expressions** — quantifier phrases (`au moins un élément de …`, `tous les éléments de …`, `aucun élément de …`)

**Given** the cursor is after a variable name
**When** autocomplete triggers
**Then** it shows **type-filtered operators** (header: "Opérateurs pour {type}"):
- `nombre`: `=`, `≠`, `>`, `<`, `≥`, `≤`
- `texte`: `=`, `≠`, `contient`, `ne contient pas`, `fait partie de`
- `liste`: `fait partie de`

**Given** the cursor is after a complete condition (variable + operator + value)
**When** autocomplete triggers
**Then** it shows **connectors**: `et` (toutes les conditions), `ou` (au moins une condition)

**Given** the admin types partial text
**When** it matches variable names
**Then** the autocomplete filters to show matching entries (CodeMirror built-in prefix filtering)

**Autocomplete visual grouping:**
```
── Indicateurs (directs) ──
  statut                        texte
  montant                       nombre
── action ──
  action.status                 texte     prop
  action.montant                nombre    ind
── community ──
  community.siret               texte     prop
  community.montant             nombre    ind
── Expressions ──
  au moins un élément de …      some
  tous les éléments de …        all
  aucun élément de …            none
```

**Technical notes:**
- Uses CodeMirror's `autocompletion()` extension with a custom `CompletionSource`
- The completion source receives the variable dictionary (story 7.5) and grammar context (story 7.3's tokenizer state)
- Keyboard: Arrow keys navigate, Enter/Tab selects, Escape dismisses
- Dropdown min-width: 260px, positioned below cursor

---

### Story 7.8: Validation Polish — Inline Error Marks and Edge Cases

As an admin,
I want to see exactly where errors are in my prose rule with visual highlights and tooltips,
So that I can quickly find and fix mistakes.

**Acceptance Criteria:**

**Given** a prose rule with a syntax error at a specific position
**When** the editor displays the rule
**Then** the error token has a wavy red underline (`text-decoration: wavy underline; color: #b32020`)
**And** hovering the underlined token shows a dark tooltip with the error message (positioned above the token)

**Given** a prose rule referencing an unknown variable (not in the variable dictionary)
**When** the editor validates
**Then** the unknown variable has a wavy amber underline (warning, not error)
**And** the validation badge shows amber "Avertissement" (warnings don't block save)

**Given** the rule field border
**When** there are blocking errors
**Then** the border turns red (`border-color: #b32020`) with a subtle red shadow

**Edge cases to handle:**
- Empty rule → no badge, no errors
- Rule becomes empty after editing → transition to empty state (placeholder shown)
- Very long rules → line wrapping in both read and edit modes
- Rapid typing → debounce parser execution (avoid parsing on every keystroke, ~300ms debounce)
- Pasting prose → full parse triggered after paste
- Undo/redo → CodeMirror native history, parser re-runs on change

**Technical notes:**
- Use CodeMirror's `lintGutter()` and diagnostic API to show inline errors
- Error positions from the parser (story 7.3) map to CodeMirror `Diagnostic` objects with `from`/`to` positions
- The `has-error` CSS class on `.rule-field` adds the red border + shadow

---

## Story Dependency & Parallelization Map

```
Sprint 1 (parallel tracks):
  Track A: Story 7.1 (Read Mode) → Story 7.2 (JSON Mode Polish)
  Track B: Story 7.3 (Tokenizer + Parser)
  Track C: Story 7.5 (Variable Dictionary)

Sprint 2 (convergence):
  Story 7.4 (CM Language) — depends on 7.3
  Story 7.6 (Texte Edit Mode) — depends on 7.1, 7.3, 7.4

Sprint 3 (polish):
  Story 7.7 (Autocomplete) — depends on 7.4, 7.5, 7.6
  Story 7.8 (Validation Polish) — depends on 7.6
```

---

## Non-Functional Requirements

- **Performance:** Parser must complete in <50ms for rules up to 20 conditions. Debounce parsing at 300ms during typing.
- **Accessibility:** CodeMirror ARIA attributes, keyboard-navigable autocomplete, sufficient color contrast for all token types.
- **Testing:** Round-trip test suite (prose → JSONLogic → prose) covering all 40+ patterns from `jsonlogic-prose.spec.ts`.
- **Browser support:** Same as existing application (modern evergreen browsers).
