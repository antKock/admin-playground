# JSON Logic & Prose Editor — Technical Architecture

> **Audience**: Developers working on rule editing, prose translation, or the CodeMirror integration.
> **Status**: Living document — update when the subsystem changes.

## Overview

This subsystem lets users author and read JSONLogic rules in natural French prose. It provides:

- **JSON → Prose translation** (read-only display with syntax coloring)
- **Prose → JSON parsing** (editable prose that compiles back to JSONLogic)
- **Syntax highlighting** and **context-aware autocomplete** in a CodeMirror 6 editor
- **Structural validation** of JSONLogic rules
- **Variable dictionary** providing context-aware variable lists from the API

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    rule-field.component.ts                       │
│              (thin orchestrator — 4-state machine)               │
│   texte-read ←→ texte-edit ←→ json-read ←→ json-edit           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────────────────┐  ┌───────────────────────────┐  │
│  │  prose-editor-setup        │  │  json-editor-setup        │  │
│  │  (EditorState factory +    │  │  (EditorState factory +   │  │
│  │   parse/lint/autocomplete) │  │   JSON lint + blur logic) │  │
│  └─────────────┬──────────────┘  └──────────┬────────────────┘  │
│                │                             │                  │
│       ┌────────┴────────────────┐   ┌───────┴───────────┐      │
│       │                         │   │                   │      │
│  ┌────▼─────────┐  ┌───────────▼───▼──────────────────┐ │      │
│  │jsonlogic-prose│  │codemirror-themes                 │ │      │
│  │JSON → HTML    │  │(shared base + json/prose themes) │ │      │
│  └────┬─────────┘  └──────────────────────────────────┘ │      │
│       │                                                  │      │
│  ┌────▼───────────────────┐  ┌───────────────────────┐   │      │
│  │prose-tokenizer +       │  │prose-autocomplete     │   │      │
│  │prose-parser             │  │context-aware          │   │      │
│  │(text → Token[] → JSON) │  │completions            │   │      │
│  └────────┬───────────────┘  └───────────┬───────────┘   │      │
│           │                              │               │      │
│  ┌────────▼────────────┐   ┌─────────────▼───────────┐   │      │
│  │prose-codemirror-     │   │variable-dictionary      │   │      │
│  │language (StreamParser│   │.service                 │   │      │
│  │for highlighting)     │   │API → ProseVariable[]    │   │      │
│  └─────────────────────┘   └─────────────────────────┘   │      │
│                                                          │      │
│  ┌──────────────────┐                                    │      │
│  │jsonlogic-validate│────────────────────────────────────┘      │
│  │structural linter │                                           │
│  └──────────────────┘                                           │
└─────────────────────────────────────────────────────────────────┘
```

## File Reference

| File | Role |
|------|------|
| `shared/components/rule-field/rule-field.component.ts` | Thin orchestrator — 4-state machine, template, callbacks. Delegates editor setup to factories |
| `shared/utils/prose-editor-setup.ts` | Factory: creates prose `EditorState` with language, linting, autocomplete, debounced parsing, blur-to-save |
| `shared/utils/json-editor-setup.ts` | Factory: creates JSON `EditorState` with JSON language, JSONLogic linter, blur-to-read |
| `shared/utils/codemirror-themes.ts` | Shared CM6 theme definitions (base styles + json/prose variants) |
| `shared/utils/jsonlogic-prose.ts` | Translates JSONLogic JSON → French HTML prose with semantic `<span>` tokens |
| `shared/utils/jsonlogic-validate.ts` | Validates JSONLogic structure (operators, shape) — not JSON syntax |
| `shared/utils/prose-tokenizer.ts` | Tokenizes plain-text prose into `Token[]` for the parser. Also exports keyword/operator constants shared by the CodeMirror highlighter |
| `shared/utils/prose-parser.ts` | Recursive descent parser: plain-text prose → JSONLogic JSON. Also exports `extractVarPaths()` for variable extraction from JSONLogic AST |
| `shared/utils/prose-codemirror-language.ts` | CodeMirror `StreamParser` for syntax highlighting in the prose editor |
| `shared/utils/prose-autocomplete.ts` | CodeMirror `CompletionSource` — token-based context detection, suggests variables, operators, connectors |
| `shared/services/variable-dictionary.service.ts` | Fetches indicator models + entity properties from API, builds `ProseVariable[]` |

## Key Design Decisions

### 1. Two translation directions, decoupled

`jsonlogic-prose.ts` (JSON→prose) and `prose-parser.ts` (prose→JSON) are independent modules. They share the same French vocabulary but have no code dependency on each other. This is intentional: the prose output format uses HTML spans for coloring, while the parser consumes plain text.

### 2. Shared vocabulary constants

`prose-tokenizer.ts` exports `MULTI_WORD_KEYWORDS`, `SINGLE_KEYWORDS`, and `OPERATORS`. These are imported by `prose-codemirror-language.ts` for syntax highlighting. This single source of truth prevents keyword drift between the parser and the highlighter.

### 3. Two tokenizers, by necessity

There are two tokenization implementations:
- `prose-tokenizer.ts` — produces a complete `Token[]` array for the recursive descent parser
- `prose-codemirror-language.ts` — implements CodeMirror's `StreamParser` interface (character-by-character, stateful, line-oriented)

These exist because CodeMirror requires the `StreamParser` contract and cannot consume pre-built token arrays. The shared keyword constants mitigate divergence risk.

### 4. `reduce` is intentionally not translated

The `reduce` operator is accepted by `jsonlogic-validate.ts` but has no prose translation in `jsonlogic-prose.ts`. Expressing reduce in natural French prose would be confusing and error-prone. Users can still write reduce rules in JSON mode.

### 5. XSS prevention

`jsonlogic-prose.ts` escapes all user-provided values through `escapeHtml()` before embedding them in HTML spans. The component uses `[innerHTML]` for the prose display, so this escaping is security-critical.

### 6. Depth guard

`MAX_DEPTH = 8` in `jsonlogic-prose.ts` prevents stack overflow on pathological or circular-like deeply nested rules. The translator returns `null` (untranslatable) rather than crashing.

### 7. Extracted editor factories (separation of concerns)

CodeMirror editor configuration is extracted into two factory modules (`prose-editor-setup.ts`, `json-editor-setup.ts`) and a shared theme file (`codemirror-themes.ts`). The component provides thin callback wrappers — all CM extension wiring, linting, autocomplete, and blur logic lives in the factories. This keeps the component focused on state machine orchestration and template rendering.

### 8. Token-based autocomplete context detection

`prose-autocomplete.ts` uses `extractTokens()` + `Set` lookups (O(1) per check) to determine the cursor context phase (variable / operator / connector). Multi-word operators like `fait partie de` are preserved as single tokens during extraction.

## State Machine (RuleFieldComponent)

```
         ┌──────────────────────────────────────────────┐
         │                                              │
    ┌────▼─────┐  click    ┌────────────┐  blur+valid  │
    │texte-read├──────────►│ texte-edit  ├─────────────►│
    └────┬─────┘           └─────┬──────┘              │
         │                       │                      │
    JSON │                  JSON │                      │
   toggle│                 toggle│                      │
         │                       │                      │
    ┌────▼─────┐  click    ┌─────▼──────┐  blur+valid  │
    │ json-read├──────────►│  json-edit  ├─────────────►│
    └──────────┘           └────────────┘              │
         │                                              │
         └──────────────────────────────────────────────┘
```

- **texte-read**: Prose display with semantic coloring (click → texte-edit)
- **texte-edit**: CodeMirror prose editor with autocomplete, linting, validation badge
- **json-read**: Prose mirror (read-only) + formatted JSON `<pre>` (click → json-edit)
- **json-edit**: CodeMirror JSON editor with JSON + JSONLogic linting, live prose mirror above

Empty value → starts in `texte-edit` directly.
On blur in `texte-edit`: if parse succeeds → save JSON + transition to `texte-read`; if errors → stay in `texte-edit`.
On blur in `json-edit`: if valid JSON → transition to `json-read`; if invalid → stay in `json-edit`.

## Prose Syntax Reference

The prose language is a subset of French designed for readability:

### Comparisons
| Prose | JSONLogic | Notes |
|-------|-----------|-------|
| `x contient 'val'` | `{"==": [{"var":"x"}, "val"]}` | Loose equality |
| `x = 1` | `{"===": [{"var":"x"}, 1]}` | Strict equality |
| `x ne contient pas 'val'` | `{"!=": [{"var":"x"}, "val"]}` | Loose inequality |
| `x ≠ 'val'` | `{"!==": [{"var":"x"}, "val"]}` | Strict inequality |
| `x > 5` | `{">": [{"var":"x"}, 5]}` | Greater than |
| `0 < x < 100` | `{"<": [0, {"var":"x"}, 100]}` | Between |
| `x fait partie de ['a','b']` | `{"in": [{"var":"x"}, ["a","b"]]}` | Membership |

### Logic
| Prose | JSONLogic |
|-------|-----------|
| `A et B` | `{"and": [A, B]}` |
| `• A` / `• B` (bullet lines) | `{"or": [A, B]}` (top-level) |
| `(A ou B)` | `{"or": [A, B]}` (nested) |
| `non (A)` | `{"!": [A]}` |
| `x est absent` | `{"!": [{"var":"x"}]}` |

### Quantifiers
| Prose | JSONLogic |
|-------|-----------|
| `au moins un élément de arr satisfait : cond` | `{"some": [arr, cond]}` |
| `tous les éléments de arr satisfont : cond` | `{"all": [arr, cond]}` |
| `aucun élément de arr ne satisfait : cond` | `{"none": [arr, cond]}` |

### Arithmetic
| Prose | JSONLogic |
|-------|-----------|
| `a + b` | `{"+": [a, b]}` |
| `a - b` | `{"-": [a, b]}` |
| `a × b` | `{"*": [a, b]}` |
| `a ÷ b` | `{"/": [a, b]}` |
| `a modulo b` | `{"%": [a, b]}` |
| `minimum de (a, b)` | `{"min": [a, b]}` |
| `maximum de (a, b)` | `{"max": [a, b]}` |

### Conditionals

**Condition mode** (default):
```
Si x contient 1 alors 'yes' sinon 'no'
```

**Value mode** (bullet format for default value rules):
```
• Si type contient 'logement' ⇒ 5000
• Si type contient 'vehicule' ⇒ 3000
• Sinon ⇒ 1000
```

## Semantic Token Classes (CSS)

The prose HTML output uses these span classes for syntax coloring:

| Class | Color | Used for |
|-------|-------|----------|
| `tk-var` | Purple `#7c3aed` | Variable names |
| `tk-kw` | Gray `#555555` | Keywords and operators |
| `tk-val` | Green `#059669` | String literals, numbers, arrays |
| `tk-pfx` | Gray italic `#888888` | Prefix text ("Le paramètre est activé si :") |

## Variable Dictionary

`VariableDictionaryService` provides context-aware variables for autocomplete and unknown-variable warnings:

- **Indicator variables**: Fetched from `/indicator-models/` API — uses `technical_label` as path
- **Entity property variables**: Fetched from the parent entity (action/folder model) — prefixed with `action.` or `folder.`
- **Caching**: Results are cached per `modelType:modelId` key as Angular Signals
- **Type mapping**: `IndicatorModelType` → `ProseVariable.type` (e.g., `'number'` → `'nombre'`)

## Testing Strategy

- **`jsonlogic-prose.spec.ts`** (46 tests): Every operator, edge case, and mode
- **`prose-parser.spec.ts`** (72 tests): Direct parsing + **27 round-trip tests** (JSON → prose → JSON)
- **`jsonlogic-validate.spec.ts`** (13 tests): All operators, rejection cases
- **`prose-codemirror-language.spec.ts`** (44 tests): Stream parser token output
- **`prose-autocomplete.spec.ts`** (27 tests): Token-based context detection + completion source
- **`prose-tokenizer.spec.ts`** (81 tests): Tokenizer coverage for all token types and edge cases
- **`variable-dictionary.service.spec.ts`** (16 tests): HTTP integration, caching, error handling
- **`rule-field.component.spec.ts`** (46 tests): State machine, template rendering, mode switching
