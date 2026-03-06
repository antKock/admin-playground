# Story 7.7: Context-Aware Autocomplete

Status: ready-for-dev
Depends-on: 7.4 (prose CM language), 7.5 (variable dictionary), 7.6 (texte edit mode)

## Story

As an admin,
I want the editor to suggest variables, operators, and connectors based on what I've typed,
so that I can discover available options and type rules faster without memorizing syntax.

## Acceptance Criteria

1. **Given** the cursor is after a connector (`et` or `ou`) or at the start of input **When** autocomplete triggers **Then** it shows two groups:
   - **Indicateurs** — variable names grouped by entity (root indicators unprefixed, then entity-prefixed, each entity as a sub-group)
   - **Expressions** — quantifier phrases (`au moins un élément de …`, `tous les éléments de …`, `aucun élément de …`)
2. **Given** the cursor is after a variable name **When** autocomplete triggers **Then** it shows type-filtered operators (header: "Opérateurs pour {type}"):
   - `nombre`: `=`, `≠`, `>`, `<`, `≥`, `≤`
   - `texte`: `=`, `≠`, `contient`, `ne contient pas`, `fait partie de`
   - `liste`: `fait partie de`
   - `booleen`: `=`, `≠`
   - `date`: `=`, `≠`, `>`, `<`, `≥`, `≤`
3. **Given** the cursor is after a complete condition (variable + operator + value) **When** autocomplete triggers **Then** it shows connectors: `et` (toutes les conditions), `ou` (au moins une condition)
4. **Given** the admin types partial text **When** it matches variable names **Then** the autocomplete filters to show matching entries (CodeMirror built-in prefix filtering)
5. Autocomplete visual grouping shows entity groups, variable types, and source indicators (prop/ind):
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
6. Keyboard: Arrow keys navigate, Enter/Tab selects, Escape dismisses (CodeMirror default)
7. Dropdown min-width: 260px, positioned below cursor
8. Autocomplete activates on typing (not just Ctrl+Space) — set `activateOnTyping: true`

## Tasks / Subtasks

- [ ] Task 0: Add `@codemirror/autocomplete` as a direct dependency (prerequisite)
  - [ ] Run `npm install @codemirror/autocomplete` (or verify it's already in `package.json`)
  - [ ] Currently exists as transitive dependency — must be direct for stability
- [ ] Task 1: Create custom CompletionSource (AC: #1, #2, #3, #4)
  - [ ] Create `src/app/shared/utils/prose-autocomplete.ts`
  - [ ] Implement `CompletionSource` function:
    ```typescript
    import { CompletionContext, CompletionResult, Completion } from '@codemirror/autocomplete';
    import type { ProseVariable } from '@shared/services/variable-dictionary.service';
    import type { Signal } from '@angular/core';

    export function createProseCompletionSource(
      variables: Signal<ProseVariable[]>
    ): (context: CompletionContext) => CompletionResult | null
    ```
  - [ ] Determine cursor context by analyzing text before cursor:
    - Use `context.matchBefore()` to check what's immediately before cursor
    - Tokenize the text before cursor using the tokenizer from story 7.3 (import `tokenize` from `@shared/utils/prose-tokenizer`)
    - Look at last few tokens to determine context:
      - No tokens / last token is `et` / last token is `ou` / start of line → **variable context**
      - Last token is a variable → look up variable in dictionary for type → **operator context**
      - Last tokens are variable + operator + value → **connector context**
- [ ] Task 2: Build variable completions with grouping (AC: #1, #5)
  - [ ] Group variables by `group` field using CM's `section` property:
    ```typescript
    const completion: Completion = {
      label: variable.path,       // 'statut' or 'community.siret'
      type: 'variable',
      detail: `${variable.type}${variable.source === 'property' ? '  prop' : variable.group ? '  ind' : ''}`,
      section: { name: variable.group || 'Indicateurs (directs)', rank: groupRank },
    };
    ```
  - [ ] Add expression completions:
    ```typescript
    { label: 'au moins un élément de …', type: 'keyword', detail: 'some', section: { name: 'Expressions', rank: 99 } },
    { label: 'tous les éléments de …', type: 'keyword', detail: 'all', section: { name: 'Expressions', rank: 99 } },
    { label: 'aucun élément de …', type: 'keyword', detail: 'none', section: { name: 'Expressions', rank: 99 } },
    ```
- [ ] Task 3: Build operator completions (AC: #2)
  - [ ] Type-filtered operator map:
    ```typescript
    const TYPE_OPERATORS: Record<string, string[]> = {
      nombre: ['=', '≠', '>', '<', '≥', '≤'],
      texte: ['=', '≠', 'contient', 'ne contient pas', 'fait partie de'],
      liste: ['fait partie de'],
      booleen: ['=', '≠'],
      date: ['=', '≠', '>', '<', '≥', '≤'],
    };
    ```
  - [ ] Section header: `{ name: 'Opérateurs pour ${typeName}', rank: 0 }`
- [ ] Task 4: Build connector completions (AC: #3)
  - [ ] After complete condition: suggest `et` and `ou`
  - [ ] Display:
    ```typescript
    { label: 'et', type: 'keyword', detail: 'toutes les conditions', section: { name: 'Connecteurs', rank: 0 } },
    { label: 'ou', type: 'keyword', detail: 'au moins une condition', section: { name: 'Connecteurs', rank: 0 } },
    ```
- [ ] Task 5: Integrate with CodeMirror (AC: #6, #7, #8)
  - [ ] Add to prose editor extensions in `rule-field.component.ts`:
    ```typescript
    import { autocompletion } from '@codemirror/autocomplete';
    import { createProseCompletionSource } from '@shared/utils/prose-autocomplete';

    // In texte-edit CM extensions:
    autocompletion({
      override: [createProseCompletionSource(this.variables)],
      activateOnTyping: true,
    })
    ```
  - [ ] Style dropdown min-width via CM theme: `.cm-tooltip-autocomplete { min-width: 260px; }`
- [ ] Task 6: Wire variable dictionary (AC: #1, #4)
  - [ ] Inject `VariableDictionaryService` in `RuleFieldComponent`
  - [ ] Add `modelType` and `modelId` inputs to `RuleFieldComponent` (or pass via a context input)
  - [ ] Call `variableDictionary.getVariables(modelType, modelId)` → pass signal to completion source
  - [ ] If dictionary not available yet (loading) → return `null` from completion source (no suggestions)
- [ ] Task 7: Write tests (AC: all)
  - [ ] Create `src/app/shared/utils/prose-autocomplete.spec.ts`
  - [ ] Test: start of input → shows variables and expressions
  - [ ] Test: after `et` → shows variables and expressions
  - [ ] Test: after `ou` → shows variables and expressions
  - [ ] Test: after variable name → shows type-filtered operators
  - [ ] Test: operator filtering by type (nombre shows 6 ops, texte shows 5 ops, liste shows 1 op)
  - [ ] Test: after complete condition → shows connectors
  - [ ] Test: partial typing filters variables by prefix
  - [ ] Test: empty/loading dictionary → null result
  - [ ] Run tests: `npx ng test --no-watch`

## Dev Notes

### Architecture & Patterns

- **New file:** `src/app/shared/utils/prose-autocomplete.ts`
- **Test file:** `src/app/shared/utils/prose-autocomplete.spec.ts`
- **Integration point:** `src/app/shared/components/rule-field/rule-field.component.ts` — add autocomplete extension to prose CodeMirror
- The completion source is a pure function that takes the variable dictionary signal. No Angular dependencies in the autocomplete file itself.

### Prerequisites (must be completed first)

- **Story 7.4** — `proseLanguageExtension` (the prose CM must exist to add autocomplete to)
- **Story 7.5** — `VariableDictionaryService` and `ProseVariable` type
- **Story 7.6** — Texte Edit Mode (the prose CodeMirror instance to add autocomplete to)
- **Story 7.3** — `tokenize()` function for context detection

### CodeMirror Autocompletion API

```typescript
import { autocompletion, CompletionContext, CompletionResult, Completion } from '@codemirror/autocomplete';

function myCompletionSource(context: CompletionContext): CompletionResult | null {
  const word = context.matchBefore(/[\w.]+/);
  if (!word && !context.explicit) return null;
  return {
    from: word ? word.from : context.pos,
    options: [
      { label: 'statut', type: 'variable', detail: 'texte', section: { name: 'Indicateurs (directs)' } },
    ],
  };
}
```

### What NOT to Do

- Do not build a complex NLP context analyzer — simple token-based lookback is sufficient
- Do not fetch API data in the autocomplete — the variable dictionary service handles all data fetching
- Do not add inline error marks — that's story 7.8
- Do not create Angular components for the dropdown — use CodeMirror's built-in autocomplete UI

### Project Structure Notes

- New: `src/app/shared/utils/prose-autocomplete.ts`
- New: `src/app/shared/utils/prose-autocomplete.spec.ts`
- Integration: `src/app/shared/components/rule-field/rule-field.component.ts`
- Import: `src/app/shared/services/variable-dictionary.service.ts` (story 7.5)
- Import: `src/app/shared/utils/prose-tokenizer.ts` (story 7.3) for context detection
- Run tests: `npx ng test --no-watch`

### References

- [Source: _bmad-output/planning-artifacts/v1.1/epics.md#Story 7.7]
- [Source: _bmad-output/planning-artifacts/v1.1/prose-editor-implementation-brief.md#Section 6]
- [Source: src/app/shared/components/rule-field/rule-field.component.ts — CM extension setup]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
