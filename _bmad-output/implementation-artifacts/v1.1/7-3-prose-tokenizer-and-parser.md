# Story 7.3: Prose Tokenizer and Parser (Prose → JSONLogic)

Status: ready-for-dev
Depends-on: none (can run in parallel with 7.1 and 7.5)

## Story

As a developer,
I want a parser that converts constrained French prose into valid JSONLogic,
so that the Texte edit mode can store rules in the same format as the JSON editor.

## Acceptance Criteria

1. **Given** a prose string following the grammar defined in `jsonlogic-prose.ts` output patterns **When** the parser processes it **Then** it produces a valid JSONLogic object
2. All patterns parse correctly:

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
| `10 ≤ montant ≤ 100` | `{"<=": [10, {"var": "montant"}, 100]}` |
| `montant contient 'EUR'` | `{"==": [{"var": "montant"}, "EUR"]}` |
| `montant ne contient pas 'USD'` | `{"!=": [{"var": "montant"}, "USD"]}` |
| `champs manquants parmi ['a', 'b']` | `{"missing": ["a", "b"]}` |
| `aucun champ manquant parmi ['a', 'b']` | `{"!": {"missing": ["a", "b"]}}` |
| `au moins 1 champ(s) manquant(s) parmi ['a', 'b']` | `{"missing_some": [1, ["a", "b"]]}` |
| `minimum de (a, b)` | `{"min": [{"var": "a"}, {"var": "b"}]}` |
| `maximum de (a, b)` | `{"max": [{"var": "a"}, {"var": "b"}]}` |
| `booléen(x)` | `{"!!": [{"var": "x"}]}` |
| `x est absent` | `{"!": {"var": "x"}}` |
| `non (x = 'a')` | `{"!": [{"===": [{"var": "x"}, "a"]}]}` |
| `Si x = 'a' alors 'b' sinon 'c'` | `{"if": [{"===": [{"var": "x"}, "a"]}, "b", "c"]}` |
| `Si x = 'a' alors 'b' sinon si y > 1 alors 'c' sinon 'd'` | `{"if": [{"===": [{"var": "x"}, "a"]}, "b", {">": [{"var": "y"}, 1]}, "c", "d"]}` |
| `tous les éléments de arr satisfont : x > 0` | `{"all": [{"var": "arr"}, {">": [{"var": "x"}, 0]}]}` |
| `aucun élément de arr ne satisfait : x = 'a'` | `{"none": [{"var": "arr"}, {"===": [{"var": "x"}, "a"]}]}` |

3. **Round-trip invariant:** Given any JSONLogic rule from the existing `jsonlogic-prose.spec.ts` test suite → translated to prose via `translateJsonLogicToProse()` (stripping HTML tags + decoding entities) → parsed back via the new parser → the resulting JSONLogic is **semantically equivalent** (deep-equal after `JSON.parse(JSON.stringify(...))`, ignoring object key order) to the original
4. **Given** malformed prose input **When** the parser encounters an unrecognized token or structure **Then** it returns a structured error with position information (line, column, absolute start/end offsets) and a French error message
5. Partial results are preserved where possible (parse what you can, mark the rest as error)

## Tasks / Subtasks

- [ ] Task 1: Create prose tokenizer (AC: #1, #2)
  - [ ] Create `src/app/shared/utils/prose-tokenizer.ts`
  - [ ] Define `Token` type: `{ type: TokenType; value: string; line: number; col: number; start: number; end: number }`
  - [ ] Token types: `variable`, `number`, `string` (quoted `'...'`), `array` (`[...]`), `operator`, `keyword`, `paren_open`, `paren_close`, `colon`, `newline`, `blank_line`, `error`
  - [ ] Tokenizer recognizes:
    - Identifiers with dots: `community.siret` → `variable`
    - Numbers (int/float, including negative): `1000`, `3.14`, `-5` → `number`
    - Quoted strings `'...'` → `string`
    - Arrays `[...]` (with nested strings/numbers) → `array`
    - Single-char operators: `=`, `≠`, `>`, `<`, `≥`, `≤`, `×`, `÷`, `+`, `-` → `operator`
    - Multi-word keywords: `fait partie de`, `ne contient pas`, `au moins un élément de`, `tous les éléments de`, `aucun élément de`, `champs manquants parmi`, `aucun champ manquant parmi`, `au moins N champ(s) manquant(s) parmi` → `keyword`
    - Single-word keywords: `et`, `ou`, `non`, `satisfait`, `satisfont`, `modulo`, `Si`, `sinon`, `alors`, `booléen`, `minimum`, `maximum`, `de`, `transformer`, `chaque`, `élément`, `filtrer`, `où` → `keyword`
    - Special: `est absent` → `keyword`
    - Parentheses, colons → respective types
    - Blank lines (double newline) → `blank_line`
  - [ ] Track position (line, column, absolute offset) for each token
  - [ ] Export `tokenize(input: string): Token[]`
  - [ ] Export keyword constant lists for reuse by story 7.4 (CodeMirror syntax highlighting): `SINGLE_KEYWORDS`, `MULTI_WORD_KEYWORDS`, `OPERATORS`
- [ ] Task 2: Build reverse operator map (AC: #1, #2)
  - [ ] Create reverse map from `OPERATOR_NAMES` in `jsonlogic-prose.ts`:
    ```typescript
    const PROSE_TO_JSONLOGIC_OP: Record<string, string> = {
      '=': '===', '≠': '!==', '>': '>', '<': '<', '≥': '>=', '≤': '<=',
      'contient': '==', 'ne contient pas': '!=', 'fait partie de': 'in',
      '+': '+', '-': '-', '×': '*', '÷': '/', 'modulo': '%',
    };
    ```
  - [ ] Note: `OPERATOR_NAMES` uses HTML entities for `<` and `>` (`&lt;`, `&gt;`). The parser works with plain text characters.
  - [ ] Export as `PROSE_TO_JSONLOGIC_OP`
- [ ] Task 3: Create recursive descent parser (AC: #1, #2, #3)
  - [ ] Create `src/app/shared/utils/prose-parser.ts`
  - [ ] Define and export `ParseResult` and `ParseError` types:
    ```typescript
    export interface ParseResult {
      success: true; jsonLogic: unknown;
    } | {
      success: false; errors: ParseError[]; partialResult?: unknown;
    }
    export interface ParseError {
      message: string; line: number; col: number; start: number; end: number;
    }
    ```
  - [ ] Implement **complete grammar** covering ALL `translateNode()` branches:
    ```
    rule            → or_expr | if_expr
    or_expr         → and_expr ( BLANK_LINE and_expr )*
    and_expr        → condition ( 'et' condition )*
    condition       → comparison | between | grouped_or | quantifier
                     | negation | boolean_cast | absent | missing
                     | missing_some | min_max | if_expr
    comparison      → operand operator operand
    between         → operand operator operand operator operand
    grouped_or      → '(' and_expr ( 'ou' and_expr )* ')'
    quantifier      → QUANT_PHRASE variable ('satisfait :' | 'satisfont :' | 'ne satisfait :') and_expr
    negation        → 'non (' rule ')'
    boolean_cast    → 'booléen(' operand ')'
    absent          → variable 'est absent'
    missing         → 'champs manquants parmi' array
                     | 'aucun champ manquant parmi' array
    missing_some    → 'au moins' NUMBER 'champ(s) manquant(s) parmi' array
    min_max         → ('minimum' | 'maximum') 'de' '(' operand_list ')'
    if_expr         → 'Si' condition 'alors' operand
                      ('sinon si' condition 'alors' operand)*
                      'sinon' operand
    if_value_expr   → bullet_if_block+
    bullet_if_block → '•' 'Si' condition '⇒' operand
                     | '•' 'Sinon' '⇒' operand

    operand         → variable | value | arithmetic_expr | min_max | boolean_cast
    variable        → IDENTIFIER ( '.' IDENTIFIER )*
    value           → NUMBER | QUOTED_STRING | ARRAY | 'null' | 'true' | 'false'
    arithmetic_expr → operand ('+' | '-' | '×' | '÷' | 'modulo') operand
    operand_list    → operand (',' operand)*

    operator        → '=' | '≠' | '>' | '<' | '≥' | '≤'
                     | 'fait partie de' | 'contient' | 'ne contient pas'

    QUANT_PHRASE    → 'au moins un élément de'
                     | 'tous les éléments de'
                     | 'aucun élément de'
    ```
  - [ ] Export `parseProse(input: string): ParseResult`
- [ ] Task 4: Handle `cat` vs `+` ambiguity (AC: #1)
  - [ ] `cat` (string concatenation) and `+` (arithmetic) both produce `a + b` in prose
  - [ ] Resolution: **always parse `+` as arithmetic `+`** — this is correct for round-trip since `translateNode` for both `cat` and `+` produces identical prose. The round-trip will normalize `cat` → `+` which is acceptable (both are semantically valid for the use case)
- [ ] Task 5: Handle edge cases (AC: #4, #5)
  - [ ] Multi-word operator matching: `fait partie de` must be matched as a unit, not 3 separate tokens
  - [ ] Blank lines between blocks → top-level `or` wrapping
  - [ ] Dotted variable names: `community.siret` → `{"var": "community.siret"}`
  - [ ] Arithmetic in operand position: `nombre_unite × cout_unitaire > 1000`
  - [ ] Nested parentheses: `((a = 'x' ou b = 'y') et c > 10)`
  - [ ] Error recovery: when an unrecognized token is found, skip to next line/block and continue parsing
  - [ ] French error messages: "Token non reconnu", "Opérateur attendu", "Valeur attendue après l'opérateur", etc.
  - [ ] Negative numbers: `-5` as a number literal vs `-` as subtraction operator (context-dependent)
- [ ] Task 6: Add `validateJsonLogic()` safety net (AC: #1)
  - [ ] After successful parse, run output through `validateJsonLogic()` from `jsonlogic-validate.ts`
  - [ ] If validation fails, return as warning (not blocking error)
- [ ] Task 7: Write comprehensive tests (AC: all)
  - [ ] Create `src/app/shared/utils/prose-parser.spec.ts`
  - [ ] Test ALL patterns from AC #2 table (25+ patterns)
  - [ ] Test round-trip: for each test case in `jsonlogic-prose.spec.ts`:
    1. Translate to prose via `translateJsonLogicToProse()`
    2. Strip HTML tags: `prose.replace(/<[^>]+>/g, '')`
    3. Decode HTML entities: `&lt;` → `<`, `&gt;` → `>`, `&amp;` → `&`, `&quot;` → `"`
    4. Parse via `parseProse()`
    5. Compare JSONLogic: `JSON.parse(JSON.stringify(result))` deep-equal
  - [ ] Test error cases: malformed input, missing operands, unknown operators
  - [ ] Test position tracking in errors (line, col, start, end)
  - [ ] Test partial parse results
  - [ ] Run tests with: `npx ng test --no-watch`

## Dev Notes

### Architecture & Patterns

- **New files:** `src/app/shared/utils/prose-tokenizer.ts` + `src/app/shared/utils/prose-parser.ts`
- **Test file:** `src/app/shared/utils/prose-parser.spec.ts`
- Pure utility — no Angular dependencies, no injection. Pure functions only.
- **Hand-written recursive descent parser** — not a parser generator. Best error messages and easier to debug.

### Critical: This Is a Round-Trip Problem, Not NLP

The parser recognizes **exactly the patterns that `jsonlogic-prose.ts` produces**. Both sides are controlled. Every `translateNode()` branch defines a production rule the parser must recognize. Complete branch mapping:

| `translateNode()` branch | Lines | Prose Pattern | Parser Production |
|--------------------------|-------|---------------|-------------------|
| Variable ref | 134-135 | `x` | `variable` |
| Comparison (2-arg) | 139-143 | `x = y` | `comparison` |
| Between (3-arg `<`/`<=`) | 147-153 | `a ≤ x ≤ b` | `between` |
| and | 157-169 | `x et y` | `and_expr` |
| or (top-level) | 171-173 | `• x\n• y` | `or_expr` (blank-line) |
| or (nested) | 176 | `(x ou y)` | `grouped_or` |
| Negation `!` | 180-193 | `non (x)` or natural inversion | `negation` |
| `!` + comparison → invert | 94-96 | `x ≠ y` (natural) | handled by `comparison` |
| `!` + `missing` | 99-100 | `aucun champ manquant parmi [...]` | `missing` variant |
| `!` + `some` → none | 104-110 | `aucun élément de...` | `quantifier` |
| `!` + `var` | 114-117 | `x est absent` | `absent` |
| `!!` | 196-201 | `booléen(x)` | `boolean_cast` |
| `if` (condition mode) | 204-227 | `Si x alors y sinon z` | `if_expr` |
| `if` (value mode) | 212-213 | `• Si x ⇒ y` | `if_value_expr` |
| `in` | 230-235 | `x fait partie de [...]` | `comparison` with `fait partie de` |
| `missing` | 238-239 | `champs manquants parmi [...]` | `missing` |
| `missing_some` | 243-248 | `au moins N champ(s)...` | `missing_some` |
| `+` (arithmetic) | 252-257 | `a + b` | `arithmetic_expr` |
| `-` (unary) | 258-261 | `-x` | operand with unary minus |
| `-` (binary) | 263-268 | `a - b` | `arithmetic_expr` |
| `*` | 269-272 | `a × b` | `arithmetic_expr` |
| `/` | 273-278 | `a ÷ b` | `arithmetic_expr` |
| `%` | 279-285 | `a modulo b` | `arithmetic_expr` |
| `min` | 288-292 | `minimum de (a, b)` | `min_max` |
| `max` | 293-297 | `maximum de (a, b)` | `min_max` |
| `cat` | 300-305 | `a + b` (same as `+`) | `arithmetic_expr` (normalized to `+`) |
| `map` | 308-311 | `transformer chaque élément de x` | `quantifier` variant |
| `filter` | 312-317 | `filtrer x où y` | `quantifier` variant |
| `all` | 319-325 | `tous les éléments de x satisfont : y` | `quantifier` |
| `some` | 327-333 | `au moins un élément de x satisfait : y` | `quantifier` |
| `none` | 335-342 | `aucun élément de x ne satisfait : y` | `quantifier` |

### `cat` vs `+` Ambiguity Resolution

Both `{"cat": ["a", "b"]}` and `{"+": ["a", "b"]}` translate to `a + b`. The parser cannot distinguish them. Decision: **always emit `+`**. This normalizes `cat` to `+` on round-trip, which is acceptable — both operators are valid in JSONLogic. Document this as a known limitation.

### HTML Stripping for Round-Trip

`translateJsonLogicToProse()` returns HTML. Before feeding to parser:
1. Strip all HTML tags: `prose.replace(/<[^>]+>/g, '')`
2. Decode all HTML entities: `&lt;` → `<`, `&gt;` → `>`, `&amp;` → `&`, `&quot;` → `"`
3. The parser works with the plain text result

### What NOT to Do

- Do not import Angular modules — pure TypeScript utility
- Do not use a parser generator library (PEG.js, nearley, etc.) — hand-written recursive descent
- Do not try to handle `reduce` — `translateNode()` has no `reduce` handler (falls through to `return null`), so no prose is produced for `reduce` operations. Not parseable by design.
- Do not create separate test file for the tokenizer — test it through the parser tests

### Project Structure Notes

- New: `src/app/shared/utils/prose-tokenizer.ts`
- New: `src/app/shared/utils/prose-parser.ts`
- New: `src/app/shared/utils/prose-parser.spec.ts`
- Reference: `src/app/shared/utils/jsonlogic-prose.ts` (the spec — every `translateNode` branch)
- Reference: `src/app/shared/utils/jsonlogic-prose.spec.ts` (test cases for round-trip)
- Reference: `src/app/shared/utils/jsonlogic-validate.ts` (safety net)
- Run tests: `npx ng test --no-watch`

### References

- [Source: _bmad-output/planning-artifacts/v1.1/epics.md#Story 7.3]
- [Source: _bmad-output/planning-artifacts/v1.1/prose-editor-implementation-brief.md#Section 4, 9]
- [Source: src/app/shared/utils/jsonlogic-prose.ts — formal spec, every translateNode branch]
- [Source: src/app/shared/utils/jsonlogic-validate.ts — validation safety net]
- [Source: src/app/shared/utils/jsonlogic-prose.spec.ts — round-trip test data]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
