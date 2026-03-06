# UX Exploration: Prose → JSONLogic Constrained Language Editor

## 1. Problem Statement

Admins configuring business rules must currently write raw JSONLogic — a nested JSON syntax designed for machines, not humans. Even with the existing read-only prose translation displayed above the editor, the authoring experience remains technical and error-prone.

**The gap:** the system can *display* rules in readable French prose, but admins cannot *write* in that same language.

## 2. Concept

A bidirectional prose editor that lets admins write rules using the same fixed French vocabulary the prose translator already outputs. A recursive descent parser converts prose to JSONLogic in real-time — deterministic, client-side, no LLM dependency.

The prose grammar is not invented from scratch; it is the exact output vocabulary of the existing `translateJsonLogicToProse()` function, reversed into an input grammar.

## 3. Users

Both technical and non-technical admins use the rule editor. Neither audience should be treated as secondary:

- **Non-technical admins** — domain experts who know the business rule they want but struggle with JSON syntax. They benefit most from prose editing.
- **Technical admins** — comfortable with JSON, but use the prose translation as a confidence check ("does my JSON really mean what I think it means?"). They switch between modes freely.

Both modes (Prose and JSON) are **first-class citizens** — always one click apart.

## 4. Complete Operator Grammar

The prose editor must support the full operator set from the existing prose translator:

### Comparison
| Prose | JSONLogic |
|---|---|
| `contient` | `==` |
| `=` | `===` |
| `ne contient pas` | `!=` |
| `≠` | `!==` |
| `<` | `<` |
| `>` | `>` |
| `≤` | `<=` |
| `≥` | `>=` |
| `0 ≤ age ≤ 65` (between) | `{"<=": [0, {"var":"age"}, 65]}` |

### Logic & Grouping
| Prose | JSONLogic |
|---|---|
| `et` | `and` |
| `ou` | `or` |
| `(...)` parenthetical grouping | nested `and`/`or` |
| `non (...)` | `!` |
| `booléen(...)` | `!!` |
| `X est absent` | `!var` |

### Membership & Missing
| Prose | JSONLogic |
|---|---|
| `fait partie de [...]` | `in` |
| `champs manquants parmi [...]` | `missing` |
| `aucun champ manquant parmi [...]` | `!missing` |
| `au moins N champ(s) manquant(s) parmi [...]` | `missing_some` |

### Conditionals
| Prose | JSONLogic |
|---|---|
| `Si ... alors ... sinon si ... sinon` | `if` |
| Value mode: `• Si ... ⇒ ... • Sinon ⇒ ...` | `if` (value mode) |

### Quantifiers (Array Operations)
| Prose | JSONLogic |
|---|---|
| `au moins un élément de X satisfait : ...` | `some` |
| `tous les éléments de X satisfont : ...` | `all` |
| `aucun élément de X ne satisfait : ...` | `none` |
| `filtrer X où ...` | `filter` |
| `transformer chaque élément de X` | `map` |

### Arithmetic
| Prose | JSONLogic |
|---|---|
| `+` | `+` |
| `-` | `-` |
| `×` | `*` |
| `÷` | `/` |
| `modulo` | `%` |
| `minimum de (...)` | `min` |
| `maximum de (...)` | `max` |

### String
| Prose | JSONLogic |
|---|---|
| `+` (concatenation) | `cat` |

## 5. Variable Context (Indicator Dictionary)

Variables are not free-text — they come from a **known dictionary of indicator models** scoped per model type.

Key characteristics:
- **One dictionary per model type** (e.g., all `Candidature` rules share the same variable set)
- **Loaded fresh on page entry** to reflect latest indicator model changes
- **Type-aware**: each indicator carries its type (`text`, `number`, `boolean`, `date`, `array`), enabling type-filtered operator suggestions (e.g., no `>` for text fields)
- **Nested paths**: indicators from linked objects use dot notation (e.g., `formation.type`)
- **Enum values** (future enhancement): when an indicator has known possible values, autocomplete suggests them after an operator

Conceptual shape:
```typescript
interface IndicatorDictionary {
  modelType: string;
  indicators: Indicator[];
}

interface Indicator {
  technicalName: string;       // e.g., 'statut'
  type: 'text' | 'number' | 'boolean' | 'date' | 'array';
  label?: string;              // Human-readable label
  path?: string;               // e.g., 'formation.type'
  enumValues?: string[];       // Future: known possible values
}
```

## 6. Complexity Profile

**90% of rules** are simple: 1-3 conditions joined by `et`/`ou` with basic comparisons and membership checks.

**10% of rules** are complex. Real-world example:

```
Le paramètre est activé si au moins une de ces conditions est vraie :

age ≥ 18 et age ≤ 65 et (departement fait partie de ['75', '92', '93', '94']
ou region = 'IDF') et nombre_unite × cout_unitaire > 1000

au moins un élément de beneficiaries satisfait : departement = '75'
et subvention_locale + subvention_region ≥ 500
et aucun champ manquant parmi ['numero_siret']

presta = 'OK' et (aide_sollicitee < aide_sollicitable
ou (statut = 'prioritaire' et budget_total > 10000))
et type_projet ne contient pas 'refuse'
```

This example involves: inline arithmetic (`×`, `+`), nested quantifiers, nested parenthetical logic, negated missing checks, and implicit OR between top-level blocks. The prose editor should aim to support all of this, with JSON as a fallback for any edge cases.

## 7. UX Variations Explored

### Variation A: Side-by-Side Dual Pane
Both representations (prose + JSON) always visible in horizontal split. Editor on the left, read-only mirror on the right.

- **Rejected.** Requires 2× horizontal space, doesn't fit the existing admin panel width, and overcomplicates the 90% simple case.

### Variation B: Stacked with Collapsible Editor (Selected)
Extends the current vertical layout. Toggle switches which pane is editable. See Section 8 for full details.

- **Selected.** Lowest implementation cost, preserves current proven layout, serves both audiences.

### Variation C: Integrated Mode with Drawer Preview
Single-pane editor with an expandable drawer at the bottom showing the "other" representation on demand.

- **Considered but not selected.** The drawer adds a click to see the mirror, which is a regression from the current always-visible prose panel in JSON mode. Extra UI chrome without clear payoff over B.

### Variation D: JQL-Style Token Pills
Typed tokens become visual pills (variables = blue, values = green, operators = plain text).

- **Rejected.** High implementation cost, complex expressions become visually cluttered, and the pill paradigm doesn't scale to nested conditionals or arithmetic chains. Risk of feeling patronizing to technical admins.

### Comparison Matrix

| Dimension | Weight | A: Side-by-Side | B: Stacked | C: Drawer | D: Pills |
|---|---|---|---|---|---|
| Space efficiency | Medium | Low | High | Highest | Medium |
| Confidence (see both) | High | Always | JSON mode | On demand | N/A |
| Implementation effort | High | Medium | Low | Medium | High |
| Simple rule UX (90%) | Critical | Good | Great | Great | Excellent |
| Complex rule UX (10%) | Medium | Good | Good | Good | Risky |
| Fits current layout | High | No | Yes | Yes | Partial |
| Non-tech admin friendly | Critical | Good | Good | Good | Excellent |
| Technical admin friendly | High | Excellent | Good | Good | Medium |
| **Overall** | | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |

## 8. Preferred Direction: Variation B — Stacked with Collapsible Editor

### Core Principle

The rule-field component has two visual zones stacked vertically:
1. **Prose zone** (top) — always visible, acts as the human-readable truth
2. **Editor zone** (bottom) — collapsible, contains the active CodeMirror editor (JSON or Prose depending on mode)

### Layout: Prose Editing Mode

The prose zone becomes the editable CodeMirror editor. No secondary mirror panel needed — the prose *is* the readable form.

```
┌─ Rule Field ──────────────────────────────────────────────┐
│  Règle de visibilité              [Prose ●] [JSON ○]      │
│                                                           │
│  ┌─ Prose Editor (CodeMirror) ───────────────────────────┐│
│  │                                                        ││
│  │  statut fait partie de ['actif', 'en attente']         ││
│  │  et montant > 1000█                                    ││
│  │       ┌─────────────────────────┐                      ││
│  │       │  montant     nombre     │                      ││
│  │       │  statut      texte      │                      ││
│  │       │  region      texte      │                      ││
│  │       └─────────────────────────┘                      ││
│  │                                                        ││
│  └────────────────────────────────────────────────────────┘│
│  ✓ Règle valide                                           │
└───────────────────────────────────────────────────────────┘
```

### Layout: JSON Editing Mode

The prose zone (top) is read-only, displaying the live translation. Below it, the JSON editor. The JSON editor pane is **collapsible** — clicking the toggle or a chevron collapses it, leaving only the prose visible.

```
┌─ Rule Field ──────────────────────────────────────────────┐
│  Règle de visibilité              [Prose ○] [JSON ●]      │
│                                                           │
│  ┌─ Traduction (read-only) ──────────────────────────────┐│
│  │  Le paramètre est activé si :                          ││
│  │  statut fait partie de ['actif', 'en attente']         ││
│  │  et montant > 1000                                     ││
│  └────────────────────────────────────────────────────────┘│
│                                                           │
│  ┌─ JSON Editor (CodeMirror) ──────────────── [▾ Replier]┐│
│  │  {"and": [{"in": [{"var": "statut"},                   ││
│  │    ["actif", "en attente"]]},                          ││
│  │    {">": [{"var": "montant"}, 1000]}]}                 ││
│  └────────────────────────────────────────────────────────┘│
│  ✓ Règle valide                                           │
└───────────────────────────────────────────────────────────┘
```

### Layout: JSON Mode — Editor Collapsed (Read-Only View)

The primary use case: admin returns to a model 2 weeks later, only needs to *read* the rule, not edit it.

```
┌─ Rule Field ──────────────────────────────────────────────┐
│  Règle de visibilité              [Prose ○] [JSON ●]      │
│                                                           │
│  ┌─ Traduction (read-only) ──────────────────────────────┐│
│  │  Le paramètre est activé si :                          ││
│  │  statut fait partie de ['actif', 'en attente']         ││
│  │  et montant > 1000                                     ││
│  └────────────────────────────────────────────────────────┘│
│                                                           │
│  [▸ Afficher l'éditeur JSON]                              │
└───────────────────────────────────────────────────────────┘
```

This is the most compact state — just the prose, with one click to expand the editor when editing is needed.

### Layout: Prose Mode — Collapsed (Read-Only View)

Same principle applies when the admin's preferred mode is Prose:

```
┌─ Rule Field ──────────────────────────────────────────────┐
│  Règle de visibilité              [Prose ●] [JSON ○]      │
│                                                           │
│  ┌─ Traduction (read-only) ──────────────────────────────┐│
│  │  Le paramètre est activé si :                          ││
│  │  statut fait partie de ['actif', 'en attente']         ││
│  │  et montant > 1000                                     ││
│  └────────────────────────────────────────────────────────┘│
│                                                           │
│  [▸ Modifier en prose]                                    │
└───────────────────────────────────────────────────────────┘
```

### Autocomplete Behavior

Context-aware suggestions powered by the indicator dictionary:

1. **Empty line / start of expression** → suggest variable names from dictionary
2. **After a variable name** → suggest operators filtered by variable type:
   - Text variable: `contient`, `ne contient pas`, `=`, `≠`, `fait partie de`
   - Number variable: `=`, `≠`, `<`, `>`, `≤`, `≥`
   - Array variable: `contient`, `fait partie de`
3. **After an operator** → suggest value types (string literal input, number input, or other variable names)
4. **After a complete condition** → suggest connectors: `et`, `ou`
5. **After `fait partie de`** → suggest `[` to start array
6. **Fuzzy matching** → `contien` suggests `contient`, `fait parti` suggests `fait partie de`

### Live Validation

CodeMirror linter integration (same pattern as existing JSON linter):
- **Syntax errors**: red wavy underline on invalid tokens
- **Type mismatches**: warning underline when operator doesn't match variable type
- **Unknown variables**: underline variable names not in the indicator dictionary
- **Structural errors**: flag dangling `et`/`ou`, unclosed parentheses, incomplete `Si/alors`

### Mode Toggle Behavior

- **Prose → JSON**: parse the prose, generate JSONLogic, populate JSON editor. If prose is invalid, show error and block toggle (or offer partial parse with warning).
- **JSON → Prose**: translate JSON to prose using existing `translateJsonLogicToProse()`. If JSONLogic uses unsupported constructs, show the untranslatable parts with a warning marker.
- **Toggle remembers last mode**: if admin prefers JSON, opening any model defaults to JSON mode with prose above.

### Collapse/Expand Behavior

- **Default state on page load**: collapsed (read-only prose only). This serves the most common use case — reviewing existing rules without editing.
- **Expanding**: click `[▸ Modifier en prose]` or `[▸ Afficher l'éditeur JSON]` to reveal the editor.
- **Collapsing**: click `[▾ Replier]` inside the editor header, or the editor auto-collapses on save/blur after a timeout.
- **State persistence**: collapse/expand state is per-session, not persisted across page reloads.

## 9. Implementation Roadmap (High-Level)

1. **Prose parser + reverse translator** — recursive descent parser mirroring `translateNode` in reverse. Same operators, same structure, reading tokens instead of emitting them. Deterministic: one valid prose → one JSONLogic output.

2. **Prose-mode CodeMirror linter** — validate parsed tokens, underline errors, leverage indicator dictionary for type checking.

3. **Autocomplete + suggestions** — `@codemirror/autocomplete` integration with context-aware suggestion logic and fuzzy matching.

4. **Mode toggle + collapsible editor** — UI changes to rule-field component: toggle control, collapse/expand, state management.

## 10. Open Questions for Later

- Should the editor default to Prose or JSON mode for new rules (empty state)?
- Should collapse/expand state persist per-model or globally?
- What is the exact UX when prose contains a construct the parser cannot handle? (Error inline vs. modal vs. toast)
- Should enum value autocomplete (cherry-on-top) be part of the initial release or a follow-up?
- How should copy-paste behave in prose mode? (Paste JSON → auto-convert to prose? Paste prose → validate?)
