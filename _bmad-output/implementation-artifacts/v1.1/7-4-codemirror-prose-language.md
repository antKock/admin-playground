# Story 7.4: CodeMirror Prose Language (Syntax Highlighting)

Status: ready-for-dev
Depends-on: 7.3 (keyword lists from `prose-tokenizer.ts`)

## Story

As an admin,
I want the prose editor to show syntax highlighting with the same colors as read mode,
so that the editing experience is visually consistent and I can easily identify variables, operators, and values.

## Acceptance Criteria

1. **Given** text typed in the prose editor **When** it contains recognized tokens **Then** variables are colored purple (`#7c3aed`, `tk-var`)
2. Keywords and operators colored gray (`#555555`, `tk-kw`) — includes ALL keywords from the grammar:
   - Connectors: `et`, `ou`
   - Operators: `=`, `≠`, `>`, `<`, `≥`, `≤`, `×`, `÷`, `+`, `-`, `modulo`
   - Multi-word: `fait partie de`, `contient`, `ne contient pas`
   - Quantifiers: `au moins un élément de`, `tous les éléments de`, `aucun élément de`
   - Control: `Si`, `alors`, `sinon`, `non`
   - Quantifier endings: `satisfait`, `satisfont`, `ne satisfait`
   - Functions: `booléen`, `minimum de`, `maximum de`
   - Existence: `est absent`
   - Missing: `champs manquants parmi`, `aucun champ manquant parmi`, `champ(s) manquant(s) parmi`
   - Array: `transformer chaque élément de`, `filtrer`, `où`
   - Value mode: `⇒`, `Sinon`
3. Values colored green (`#059669`, `tk-val`) — numbers, quoted strings `'...'`, arrays `[...]`
4. Unrecognized tokens styled as errors (`#b32020`, `tk-err`)
5. **Given** nested parentheses **When** cursor is near a parenthesis **Then** CodeMirror's bracket matching highlights the paired parenthesis
6. Font: `'JetBrains Mono', 'Fira Code', Consolas, monospace` at 13px, line-height 1.6 — matching the existing `ruleFieldTheme` font stack (use `Consolas` not `SF Mono` for consistency)

## Tasks / Subtasks

- [ ] Task 0: Add `@codemirror/language` as a direct dependency (AC: prerequisite)
  - [ ] Run `npm install @codemirror/language` (or verify it's already in `package.json`)
  - [ ] It exists as a transitive dependency but must be a direct dependency for stability
- [ ] Task 1: Create StreamLanguage tokenizer (AC: #1, #2, #3, #4)
  - [ ] Create `src/app/shared/utils/prose-codemirror-language.ts`
  - [ ] **Import keyword lists from `prose-tokenizer.ts`** (story 7.3): `SINGLE_KEYWORDS`, `MULTI_WORD_KEYWORDS`, `OPERATORS` — do NOT duplicate keyword definitions
  - [ ] Implement `StreamLanguage.define()` with a `StreamParser<ProseHighlightState>`:
    - Variables (identifiers, dotted identifiers): return `'variableName'` tag
    - Single-word keywords (`et`, `ou`, `non`, `Si`, `alors`, `sinon`, `booléen`, `minimum`, `maximum`, `satisfait`, `satisfont`, `modulo`, `Sinon`): return `'keyword'` tag
    - Multi-word keywords (`fait partie de`, `ne contient pas`, `au moins un élément de`, `tous les éléments de`, `aucun élément de`, `champs manquants parmi`, `aucun champ manquant parmi`, `au moins ... champ(s) manquant(s) parmi`, `transformer chaque élément de`, `est absent`): look-ahead to match full phrase → return `'keyword'` tag
    - Operators (`=`, `≠`, `>`, `<`, `≥`, `≤`, `×`, `÷`, `+`, `-`, `⇒`): return `'operator'` tag
    - Quoted strings (`'...'`): return `'string'` tag
    - Numbers (int, float, negative): return `'number'` tag
    - Arrays (`[...]`): consume entire bracket content → return `'list'` tag
    - Parentheses `(`, `)`: return `'paren'` tag
    - Whitespace: `stream.eatSpace()` → return `null`
    - Unrecognized: `stream.next()` → return `'invalid'` tag
  - [ ] Export `proseLanguage` (the `StreamLanguage` instance)
- [ ] Task 2: Create syntax highlighting theme (AC: #1, #2, #3, #4, #6)
  - [ ] Create `proseHighlightStyle` using `HighlightStyle.define()`:
    ```typescript
    { tag: tags.variableName, color: '#7c3aed' },     // purple — variables
    { tag: tags.keyword, color: '#555555' },            // gray — keywords
    { tag: tags.operator, color: '#555555' },           // gray — operators
    { tag: tags.string, color: '#059669' },             // green — quoted strings
    { tag: tags.number, color: '#059669' },             // green — numbers
    { tag: tags.list, color: '#059669' },               // green — arrays
    { tag: tags.invalid, color: '#b32020' },            // red — errors
    ```
  - [ ] Export combined extension: `proseLanguageExtension` = `[proseLanguage, syntaxHighlighting(proseHighlightStyle)]`
  - [ ] Font in theme: `'JetBrains Mono', 'Fira Code', Consolas, monospace`, 13px, line-height 1.6
- [ ] Task 3: Handle multi-word keyword matching (AC: #2)
  - [ ] The `StreamParser.token()` method reads character-by-character. For multi-word keywords:
    1. Read an identifier (e.g., `fait`)
    2. Save stream position
    3. Look ahead for ` partie de` — if matches, consume all as one keyword token
    4. If look-ahead fails, restore position, treat first word as variable or check against single-word keywords
  - [ ] Same pattern for: `ne contient pas`, `au moins un élément de`, `tous les éléments de`, `aucun élément de`, `champs manquants parmi`, `aucun champ manquant parmi`, `est absent`, `transformer chaque élément de`
  - [ ] Handle `au moins N champ(s) manquant(s) parmi` where N is a number — match `au moins`, skip number, match `champ(s) manquant(s) parmi`
- [ ] Task 4: Handle negative numbers and unary minus (AC: #3)
  - [ ] If `-` is followed immediately by a digit (no space), treat as negative number → `number` tag
  - [ ] If `-` is followed by a space, treat as operator → `operator` tag
- [ ] Task 5: Enable bracket matching (AC: #5)
  - [ ] Ensure `bracketMatching()` extension is included in the prose editor's extension set
  - [ ] Parentheses `()` and brackets `[]` should be matched
- [ ] Task 6: Write tests (AC: all)
  - [ ] Create `src/app/shared/utils/prose-codemirror-language.spec.ts`
  - [ ] Test tokenizer classifies: `statut = 'actif'` → variable, operator, string
  - [ ] Test multi-word operator: `fait partie de` → single keyword token
  - [ ] Test all listed keywords produce `keyword` tag
  - [ ] Test number recognition: `1000`, `3.14`, `-5`
  - [ ] Test array recognition: `['a', 'b', 'c']`
  - [ ] Test `+` and `-` as operators
  - [ ] Test `⇒` as operator
  - [ ] Test `booléen(x)` → keyword + paren + variable + paren
  - [ ] Test `est absent` → keyword (not two separate words)
  - [ ] Test `minimum de` → keyword
  - [ ] Test unrecognized tokens get `invalid` tag
  - [ ] Run tests: `npx ng test --no-watch`

## Dev Notes

### Architecture & Patterns

- **New file:** `src/app/shared/utils/prose-codemirror-language.ts`
- **Test file:** `src/app/shared/utils/prose-codemirror-language.spec.ts`
- This tokenizer is **separate from** the parser tokenizer (story 7.3). The CodeMirror `StreamLanguage` tokenizer:
  - Works character-by-character (CodeMirror streaming API)
  - Only classifies token types (no AST building)
  - Runs on every keystroke for highlighting
  - Is simpler than the parser tokenizer
- **Share keyword lists** with story 7.3: import `SINGLE_KEYWORDS`, `MULTI_WORD_KEYWORDS`, `OPERATORS` from `prose-tokenizer.ts`. Do NOT maintain a separate keyword list — that creates a DRY violation and bugs when lists diverge.

### CodeMirror StreamLanguage API

```typescript
import { StreamLanguage, StreamParser } from '@codemirror/language';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';

interface ProseHighlightState {
  // Minimal state — mostly stateless line-based tokenization
}

const proseParser: StreamParser<ProseHighlightState> = {
  startState(): ProseHighlightState { return {}; },
  token(stream, state): string | null {
    if (stream.eatSpace()) return null;
    // ... match patterns
    // stream.match(/regex/) — try to match at current position
    // stream.next() — consume one character
    // Return tag name string or null for whitespace
  },
};

export const proseLanguage = StreamLanguage.define(proseParser);
```

### Existing CodeMirror Setup to Reference

The existing `ruleFieldTheme` in `rule-field.component.ts` (lines 73-125) uses:
- Font: `'JetBrains Mono', 'Fira Code', Consolas, monospace` — use the same stack (NOT `SF Mono`)
- Border, padding, and general styling — reuse where applicable

### What NOT to Do

- Do not create a full Lezer grammar — `StreamLanguage` is simpler and sufficient
- Do not duplicate keyword lists from story 7.3 — import them
- Do not add autocomplete — that's story 7.7
- Do not add lint/error marks — that's story 7.8
- Do not use `SF Mono` in font stack — use `Consolas` to match existing theme

### Project Structure Notes

- New: `src/app/shared/utils/prose-codemirror-language.ts`
- New: `src/app/shared/utils/prose-codemirror-language.spec.ts`
- Import from: `src/app/shared/utils/prose-tokenizer.ts` (keyword lists from story 7.3)
- Reference: `src/app/shared/components/rule-field/rule-field.component.ts` (existing CM6 theme)
- Run tests: `npx ng test --no-watch`

### References

- [Source: _bmad-output/planning-artifacts/v1.1/epics.md#Story 7.4]
- [Source: _bmad-output/planning-artifacts/v1.1/prose-editor-implementation-brief.md#Section 7.3, 9]
- [Source: src/app/shared/components/rule-field/rule-field.component.ts:73-125 — existing CM6 theme, font stack]
- [Source: src/app/shared/utils/jsonlogic-prose.ts — all operator/keyword patterns to recognize]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
