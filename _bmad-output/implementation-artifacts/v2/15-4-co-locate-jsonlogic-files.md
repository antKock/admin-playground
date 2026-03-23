# Story 15.4: Co-locate JSON-Logic Files

Status: review

## Story

As a developer,
I want all JSON-Logic-related files grouped in a single folder,
so that I can understand and maintain the rule engine as a cohesive module.

## Acceptance Criteria

1. All JSON-Logic and prose-related files are in `src/app/shared/jsonlogic/`
2. The `variable-dictionary.service.ts` is co-located with the JSON-Logic module
3. All import paths across the entire codebase are updated to the new locations
4. No logic changes in any file
5. `npx ng build` passes with zero errors
6. `npx ng test --no-watch` passes with zero regressions

## Tasks / Subtasks

- [x] Task 1: Create target directory (AC: #1)
  - [x] 1.1 Create `src/app/shared/jsonlogic/`

- [x] Task 2: Move JSON-Logic core files (AC: #1, #3, #4)
  - [x] 2.1 Move `src/app/shared/utils/jsonlogic-prose.ts` → `src/app/shared/jsonlogic/jsonlogic-prose.ts`
  - [x] 2.2 Move `src/app/shared/utils/jsonlogic-prose.spec.ts` → `src/app/shared/jsonlogic/jsonlogic-prose.spec.ts`
  - [x] 2.3 Move `src/app/shared/utils/jsonlogic-validate.ts` → `src/app/shared/jsonlogic/jsonlogic-validate.ts`
  - [x] 2.4 Move `src/app/shared/utils/jsonlogic-validate.spec.ts` → `src/app/shared/jsonlogic/jsonlogic-validate.spec.ts`
  - [x] 2.5 Update all imports referencing old paths for these files

- [x] Task 3: Move prose engine files (AC: #1, #3, #4)
  - [x] 3.1 Move `src/app/shared/utils/prose-autocomplete.ts` → `src/app/shared/jsonlogic/prose-autocomplete.ts`
  - [x] 3.2 Move `src/app/shared/utils/prose-autocomplete.spec.ts` → `src/app/shared/jsonlogic/prose-autocomplete.spec.ts`
  - [x] 3.3 Move `src/app/shared/utils/prose-codemirror-language.ts` → `src/app/shared/jsonlogic/prose-codemirror-language.ts`
  - [x] 3.4 Move `src/app/shared/utils/prose-codemirror-language.spec.ts` → `src/app/shared/jsonlogic/prose-codemirror-language.spec.ts`
  - [x] 3.5 Move `src/app/shared/utils/prose-editor-setup.ts` → `src/app/shared/jsonlogic/prose-editor-setup.ts`
  - [x] 3.6 Move `src/app/shared/utils/prose-parser.ts` → `src/app/shared/jsonlogic/prose-parser.ts`
  - [x] 3.7 Move `src/app/shared/utils/prose-parser.spec.ts` → `src/app/shared/jsonlogic/prose-parser.spec.ts`
  - [x] 3.8 Move `src/app/shared/utils/prose-tokenizer.ts` → `src/app/shared/jsonlogic/prose-tokenizer.ts`
  - [x] 3.9 Move `src/app/shared/utils/prose-tokenizer.spec.ts` → `src/app/shared/jsonlogic/prose-tokenizer.spec.ts`
  - [x] 3.10 Update all imports referencing old paths for these files

- [x] Task 4: Move JSON editor setup (AC: #1, #3, #4)
  - [x] 4.1 Move `src/app/shared/utils/json-editor-setup.ts` → `src/app/shared/jsonlogic/json-editor-setup.ts`
  - [x] 4.2 Update all imports referencing `@shared/utils/json-editor-setup`

- [x] Task 5: Move variable dictionary service (AC: #2, #3, #4)
  - [x] 5.1 Move `src/app/shared/services/variable-dictionary.service.ts` → `src/app/shared/jsonlogic/variable-dictionary.service.ts`
  - [x] 5.2 Move `src/app/shared/services/variable-dictionary.service.spec.ts` → `src/app/shared/jsonlogic/variable-dictionary.service.spec.ts`
  - [x] 5.3 Update all imports referencing `@shared/services/variable-dictionary.service`

- [x] Task 6: Update all remaining imports and verify (AC: #3, #5, #6)
  - [x] 6.1 Grep confirms zero remaining references to old paths
  - [x] 6.2 Updated internal cross-references (variable-dictionary imports in prose-autocomplete, prose-editor-setup, prose-autocomplete.spec)
  - [x] 6.3 Run `npx ng build` — zero errors
  - [x] 6.4 Run `npx ng test --no-watch` — zero regressions (82 files, 971 tests)

- [x] Task 7: Clean up (AC: #1)
  - [x] 7.1 No orphaned files at old locations (also moved `codemirror-themes.ts` which was only used by jsonlogic editors)

## Dev Notes

- **Depends on:** No hard dependency on other stories, but coordinate with 15.5 if running in parallel (both touch `shared/services/`)
- **No logic changes** — this is a pure file relocation refactor
- **Barrel files:** Do NOT create `index.ts` barrel/re-export files in the new folder. The project does not use barrel files — all imports reference specific file paths directly.
- **This is the largest co-location task:** ~4,400 lines of code across ~18 files (source + specs)
- **File inventory (current locations and sizes):**

  | File | Location | Lines |
  |------|----------|-------|
  | `jsonlogic-prose.ts` | `shared/utils/` | 392 |
  | `jsonlogic-prose.spec.ts` | `shared/utils/` | — |
  | `jsonlogic-validate.ts` | `shared/utils/` | 93 |
  | `jsonlogic-validate.spec.ts` | `shared/utils/` | — |
  | `prose-autocomplete.ts` | `shared/utils/` | 299 |
  | `prose-autocomplete.spec.ts` | `shared/utils/` | — |
  | `prose-codemirror-language.ts` | `shared/utils/` | 296 |
  | `prose-codemirror-language.spec.ts` | `shared/utils/` | — |
  | `prose-editor-setup.ts` | `shared/utils/` | 198 |
  | `prose-parser.ts` | `shared/utils/` | 751 |
  | `prose-parser.spec.ts` | `shared/utils/` | — |
  | `prose-tokenizer.ts` | `shared/utils/` | 406 |
  | `prose-tokenizer.spec.ts` | `shared/utils/` | — |
  | `json-editor-setup.ts` | `shared/utils/` | — |
  | `variable-dictionary.service.ts` | `shared/services/` | — |
  | `variable-dictionary.service.spec.ts` | `shared/services/` | — |

- **Critical:** These files heavily import each other. After moving, all internal cross-references must be updated. The files use relative imports between themselves (e.g., `prose-parser.ts` imports from `./prose-tokenizer`), so if they all move to the same directory, internal relative imports may remain valid. Verify this.
- **Import search commands:**
  ```bash
  grep -r "jsonlogic-prose" src/ --include="*.ts"
  grep -r "jsonlogic-validate" src/ --include="*.ts"
  grep -r "prose-autocomplete" src/ --include="*.ts"
  grep -r "prose-codemirror-language" src/ --include="*.ts"
  grep -r "prose-editor-setup" src/ --include="*.ts"
  grep -r "prose-parser" src/ --include="*.ts"
  grep -r "prose-tokenizer" src/ --include="*.ts"
  grep -r "json-editor-setup" src/ --include="*.ts"
  grep -r "variable-dictionary" src/ --include="*.ts"
  ```
- **Path alias consideration:** Imports using `@shared/utils/prose-*` and `@shared/utils/jsonlogic-*` must become `@shared/jsonlogic/prose-*` and `@shared/jsonlogic/jsonlogic-*`

### Project Structure Notes

**Before:**
```
src/app/shared/
  utils/
    jsonlogic-prose.ts + spec
    jsonlogic-validate.ts + spec
    prose-autocomplete.ts + spec
    prose-codemirror-language.ts + spec
    prose-editor-setup.ts
    prose-parser.ts + spec
    prose-tokenizer.ts + spec
    json-editor-setup.ts
    ... (other unrelated utils remain)
  services/
    variable-dictionary.service.ts + spec
    ... (other unrelated services remain)
```

**After:**
```
src/app/shared/
  jsonlogic/
    jsonlogic-prose.ts + spec
    jsonlogic-validate.ts + spec
    prose-autocomplete.ts + spec
    prose-codemirror-language.ts + spec
    prose-editor-setup.ts
    prose-parser.ts + spec
    prose-tokenizer.ts + spec
    json-editor-setup.ts
    variable-dictionary.service.ts + spec
  utils/
    ... (other unrelated utils remain)
  services/
    ... (other unrelated services remain)
```

### References

- [Source: _bmad-output/planning-artifacts/v2/epics.md#Story 15.4]
- [Source: _bmad-output/implementation-artifacts/v2/v2-technical-analysis.md#Co-location]
- [Source: docs/architecture-ACTEE.md]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

### Completion Notes List

- Moved 17 files (16 listed + codemirror-themes.ts discovered during build) to `src/app/shared/jsonlogic/`
- Internal relative imports between co-located files remain valid (all in same directory)
- Updated 3 internal cross-references (variable-dictionary imports) and 6 external imports in rule-field component
- `codemirror-themes.ts` also moved as it was only referenced by jsonlogic editor setup files
- Build: zero errors. Tests: 82 files, 971 tests, zero regressions.

### Change Log

- 2026-03-23: Co-located all JSON-Logic and prose-related files into `src/app/shared/jsonlogic/`

### File List

- src/app/shared/jsonlogic/jsonlogic-prose.ts (moved from shared/utils/)
- src/app/shared/jsonlogic/jsonlogic-prose.spec.ts (moved from shared/utils/)
- src/app/shared/jsonlogic/jsonlogic-validate.ts (moved from shared/utils/)
- src/app/shared/jsonlogic/jsonlogic-validate.spec.ts (moved from shared/utils/)
- src/app/shared/jsonlogic/prose-autocomplete.ts (moved from shared/utils/, import updated)
- src/app/shared/jsonlogic/prose-autocomplete.spec.ts (moved from shared/utils/, import updated)
- src/app/shared/jsonlogic/prose-codemirror-language.ts (moved from shared/utils/)
- src/app/shared/jsonlogic/prose-codemirror-language.spec.ts (moved from shared/utils/)
- src/app/shared/jsonlogic/prose-editor-setup.ts (moved from shared/utils/, import updated)
- src/app/shared/jsonlogic/prose-parser.ts (moved from shared/utils/)
- src/app/shared/jsonlogic/prose-parser.spec.ts (moved from shared/utils/)
- src/app/shared/jsonlogic/prose-tokenizer.ts (moved from shared/utils/)
- src/app/shared/jsonlogic/prose-tokenizer.spec.ts (moved from shared/utils/)
- src/app/shared/jsonlogic/json-editor-setup.ts (moved from shared/utils/)
- src/app/shared/jsonlogic/variable-dictionary.service.ts (moved from shared/services/)
- src/app/shared/jsonlogic/variable-dictionary.service.spec.ts (moved from shared/services/)
- src/app/shared/jsonlogic/codemirror-themes.ts (moved from shared/utils/)
- src/app/shared/components/rule-field/rule-field.component.ts (modified imports)
