# Prose Editor — Implementation Brief

> Synthesized from party-mode discussion (2026-03-06).
> UX reference: `_bmad-output/planning-artifacts/v1.1/ux-prose-editor-variations.html`

---

## 1. Feature Overview

A **dual-mode rule editor** for indicator parameter configuration. Admins can author JSONLogic rules via:

- **Texte mode** — type constrained French prose with syntax highlighting, autocomplete, and real-time validation. The prose is parsed into JSONLogic for storage.
- **JSON mode** — edit raw JSONLogic directly, with a read-only prose translation shown above.

Both modes read and write the same underlying JSONLogic value. The segmented toggle (`Texte | JSON`) switches the editing interface, not the data format.

---

## 2. State Machine (4 States)

| # | State | Entry Condition | Behavior |
|---|-------|----------------|----------|
| 1 | **Texte Read** | Page load, rule non-empty | Prose displayed with syntax colors + bullet branches for top-level OR. Click anywhere → state 2 |
| 2 | **Texte Edit** | Click in read mode, or page load with empty rule | CodeMirror active, cursor blinking, same syntax colors, autocomplete available |
| 3 | **JSON Read** | Toggle to JSON, rule non-empty | Prose mirror (read-only) above, JSON displayed below. Click → state 4 |
| 4 | **JSON Edit** | Click in JSON read mode, or toggle to JSON with empty rule | Prose mirror (read-only) + JSON CodeMirror active |

**Transitions:**
- Read → Edit: click anywhere in content zone (or "Modifier" button on hover)
- Edit → Read: blur. If valid → save to form model, show read mode. If invalid → stay in edit mode, show errors
- Texte ↔ JSON: segmented toggle, both directions allowed anytime

**No collapse/expand mechanic.** No border change on focus. No blue glow. Cursor + validation badge are the edit-mode signals.

---

## 3. Existing Code Assets

### 3.1 JSONLogic → Prose (`jsonlogic-prose.ts`)

- **Location:** `src/app/shared/utils/jsonlogic-prose.ts`
- **357 lines**, fully implemented, 40+ test cases
- Handles all JSONLogic operators: comparisons, logic (`and`/`or`/`!`), arithmetic, array operations (`some`/`all`/`none`), `if/then/else`, `in`, `missing`, `min`/`max`, `cat`
- Natural French negation (`!(x == y)` → `x ≠ y`)
- Top-level OR → bullet format (`• branch`), nested OR → parentheses (`(x ou y)`)
- `ProseMode`: `'condition'` | `'value'` for different prefix styles
- **This file is effectively the formal specification for the prose DSL.** Every `translateNode` branch defines a production rule that the reverse parser must recognize.

### 3.2 JSONLogic Validator (`jsonlogic-validate.ts`)

- **Location:** `src/app/shared/utils/jsonlogic-validate.ts`
- **92 lines**, validates JSONLogic structure (operators, nesting)
- Returns `ValidationError[]` with French messages
- **Serves as safety net:** parse prose → JSONLogic → validate with this → catch parser bugs

### 3.3 Rule Field Component (`rule-field.component.ts`)

- **Location:** `src/app/shared/components/rule-field/rule-field.component.ts`
- **342 lines**, currently JSON-only CodeMirror editor with prose preview below
- Already has: CodeMirror 6 integration, bracket matching, lint gutter, custom theme, prose translation display with prefix logic and bullet branches
- **Needs restructuring:** currently built around a single JSON CodeMirror instance; needs to support dual editors + read mode + state machine

### 3.4 CodeMirror Dependencies (already installed)

```
@codemirror/lang-json, @codemirror/lint, @codemirror/state, @codemirror/view, codemirror
```

### 3.5 Integration Point

- `src/app/shared/components/indicator-card/indicator-card.component.ts` uses `<app-rule-field>` for 4 rule types: `required_rule`, `editable_rule`, `visibility_rule`, `default_value_rule`

---

## 4. Prose DSL — Grammar (derived from `jsonlogic-prose.ts` output)

The prose language is constrained — not free-text NLP. The grammar mirrors the existing translation output:

```
rule        → or_expr
or_expr     → and_expr ( BLANK_LINE and_expr )*       // top-level OR (blank-line separated in edit mode)
and_expr    → condition ( 'et' condition )*
condition   → comparison | grouped_or | quantifier | negation | missing
comparison  → operand operator operand
grouped_or  → '(' and_expr ( 'ou' and_expr )* ')'
quantifier  → QUANT_PHRASE variable 'satisfait :' and_expr
negation    → 'non (' rule ')'
missing     → 'champs manquants parmi' array
            | 'aucun champ manquant parmi' array

operand     → variable | value | arithmetic_expr
variable    → IDENTIFIER ( '.' IDENTIFIER )*
value       → NUMBER | QUOTED_STRING | ARRAY
arithmetic_expr → operand ('+' | '-' | '×' | '÷' | 'modulo') operand

operator    → '=' | '≠' | '>' | '<' | '≥' | '≤'
            | 'fait partie de' | 'contient' | 'ne contient pas'

QUANT_PHRASE → 'au moins un élément de' ... 'satisfait :'
            | 'tous les éléments de' ... 'satisfont :'
            | 'aucun élément de' ... 'ne satisfait :'
```

### Operator Reverse Map (from `OPERATOR_NAMES`)

| Prose | JSONLogic |
|-------|-----------|
| `=` | `===` |
| `≠` | `!==` |
| `>` | `>` |
| `<` | `<` |
| `≥` | `>=` |
| `≤` | `<=` |
| `contient` | `==` |
| `ne contient pas` | `!=` |
| `fait partie de` | `in` |
| `et` | `and` |
| `ou` | `or` |
| `×` | `*` |
| `÷` | `/` |
| `modulo` | `%` |

---

## 5. Variable Dictionary

### 5.1 Variable Sources

Variables come from two sources, applied at **every entity level**:

| Source | Example | Discovery |
|--------|---------|-----------|
| **Indicators** | Any indicator `technical_label` from the full indicator list | API: list all indicators |
| **Entity properties** | Intrinsic fields from the API entity response | API: inspect entity response schema |

### 5.2 Entity Resolution

**Hardcoded mapping (model → root instance):**
- `Action_model` → root entity is `action`
- `Folder_model` → root entity is `folder`

**API-driven associations:**
- Fetch root entity (action/folder) → response reveals associated entity types (communities, buildings, users, etc.)
- Each association type becomes a prefix namespace

### 5.3 Variable Namespace

| Reference | Meaning |
|-----------|---------|
| `statut` | Indicator `statut` on root entity (no prefix) |
| `montant` | Indicator `montant` on root entity |
| `action.status` | **Property** `status` on action entity |
| `action.statut` | **Indicator** `statut` scoped to action entity |
| `community.siret` | **Property** `siret` on community entity |
| `community.montant` | **Indicator** `montant` scoped to community entity |
| `building.surface` | **Property** `surface` on building entity |

**Key rule:** `entity.X` can be either a property OR an indicator. Both resolve to `{"var": "entity.X"}` in JSONLogic. The distinction only matters for autocomplete grouping.

### 5.4 Variable Dictionary Data Model

```typescript
interface ProseVariable {
  path: string;           // 'montant' or 'community.siret'
  type: 'nombre' | 'texte' | 'liste' | 'booleen' | 'date';
  group: string;          // '' (root) | 'action' | 'community' | 'building'
  source: 'indicator' | 'property';  // for optional visual hint in autocomplete
}
```

### 5.5 Dictionary Assembly

For each entity (root + each associated entity):
```
variables = entity_properties ∪ all_indicators (prefixed with entity name)
```
For root entity: indicators are unprefixed, properties use root entity prefix.

**Caching:** Same dictionary applies to all 4 rule fields on an indicator card. Compute once per model, share everywhere.

---

## 6. Autocomplete Specification

### 6.1 Context-Aware Triggers

| Cursor Position | Suggestion Group | Content |
|----------------|-----------------|---------|
| After connector (`et`, start of line) | Indicateurs + Expressions | Variable names (grouped by entity) + quantifier phrases |
| After variable | Opérateurs pour {type} | Type-filtered operators (nombre → `=`, `≠`, `>`, `<`, `≥`, `≤`; texte → `contient`, `fait partie de`, etc.) |
| After complete condition | Connecteurs | `et`, `ou` |

### 6.2 Autocomplete Grouping

```
── Indicateurs (directs) ──
  statut                        texte
  montant                       nombre
── action ──
  action.status                 texte     prop
  action.statut                 texte     ind
── community ──
  community.siret               texte     prop
  community.montant             nombre    ind
── Expressions ──
  au moins un élément de …      some
  tous les éléments de …        all
  aucun élément de …            none
```

### 6.3 Filtering

As the admin types, the autocomplete filters by prefix matching. CodeMirror's built-in autocomplete handles this natively.

---

## 7. Read Mode Rendering

### 7.1 Prefix Logic (from existing `rule-field.component.ts`)

| Condition | Prefix |
|-----------|--------|
| Single condition (no OR) | "Le paramètre est activé si :" |
| Multiple OR branches | "Le paramètre est activé si au moins une de ces conditions est vraie :" |
| Value mode, single | "La valeur par défaut est :" |
| Value mode, multiple if/else | "La valeur par défaut correspond à la première condition vérifiée :" |

### 7.2 OR Branch Display

- Top-level OR branches render as **bullet points** (`•`) with indentation (`bullet-branch` CSS class)
- Nested OR within a branch uses inline parentheses `(x ou y)`
- This matches `jsonlogic-prose.ts` output exactly

### 7.3 Token Colors (shared between read and edit mode)

| Token | CSS Class | Color | Hex |
|-------|-----------|-------|-----|
| Variable | `tk-var` | Purple | `#7c3aed` |
| Keyword/Operator | `tk-kw` | Gray | `#555555` |
| Value | `tk-val` | Green | `#059669` |
| Prefix | `tk-pfx` | Light gray, italic | `#888888` |
| Error | `tk-err` | Red | `#b32020` |

---

## 8. Validation UX

- **Badge** (inline, Style B): appears in validation row below editor content
  - Valid: green badge "Valide" (+ branch count for multi-OR: "Valide — 3 branches OR")
  - Error: red badge with message
  - Warning: amber badge
- **Inline error marks**: wavy underline on the error token + tooltip on hover
- **No badge shown** until the admin types something (empty rule = no badge)
- **Blur behavior**: valid → save + return to read mode. Invalid → stay in edit mode, show errors.

---

## 9. Implementation Plan — Deliverables

| # | Deliverable | Effort | Dependencies |
|---|------------|--------|-------------|
| 1 | Reverse operator map + prose tokenizer | Small | `jsonlogic-prose.ts` operator maps |
| 2 | Recursive descent parser (prose → JSONLogic) | Medium | Tokenizer, grammar from `jsonlogic-prose.ts` |
| 3 | Round-trip test suite | Small | Parser + existing `translateJsonLogicToProse` + `validateJsonLogic` |
| 4 | CodeMirror StreamLanguage tokenizer (syntax highlighting) | Medium | Token type definitions |
| 5 | Read mode component (prose display + click-to-edit) | Small | Existing `translateJsonLogicToProse()` |
| 6 | Edit mode component (prose CodeMirror) | Medium | Parser + tokenizer + autocomplete |
| 7 | Variable dictionary service | Medium | API endpoints for entity schemas + indicator list |
| 8 | Autocomplete provider (context-aware, type-filtered) | Medium | Variable dictionary + grammar context |
| 9 | State machine + segmented toggle (4 states) | Small | Read + Edit components |
| 10 | JSON mode with prose mirror | Small | Existing JSON editor + `translateJsonLogicToProse()` |
| 11 | Validation UX (badge + inline errors) | Medium | Parser error positions → CodeMirror diagnostics |

### Key Insight: Parser Complexity Reduction

The parser is **not** "translate arbitrary French into JSONLogic." It recognizes the **exact patterns that `jsonlogic-prose.ts` produces**. This is a round-trip problem with both sides controlled, making it significantly simpler than a general NLP parser. Estimated ~25 operator patterns to recognize in reverse.

### Recommended Parser Approach

- **Hand-written recursive descent** parser for prose → JSONLogic (simple, fast, good error messages)
- **Separate CodeMirror StreamLanguage** tokenizer for syntax highlighting (lightweight, line-based)
- **Round-trip validation**: parse prose → JSONLogic → `validateJsonLogic()` → `translateJsonLogicToProse()` → compare. Powerful correctness invariant.

---

## 10. Open Questions for Story Creation

1. **Variable dictionary API**: Do we need a new endpoint, or can we assemble from existing endpoints?
2. **Story granularity**: One story per deliverable, or group related deliverables?
3. **Phase boundaries**: Ship incrementally (read mode first, then edit, then autocomplete) or as a single release?
4. **`if/then/else` in prose edit mode**: The read mode handles it — should edit mode support typing `Si X alors Y sinon Z`? Or is `if/then/else` JSON-only for now?
