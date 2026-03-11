# Story 9.3: FolderModel Form with Funding Programs

Status: review

## Story

As an admin,
I want to associate multiple funding programs to a folder model when creating or editing,
so that I can define which programs fund this folder type.

## Acceptance Criteria

1. **Given** the folder-model create or edit form **When** the form renders **Then** it includes a `funding_program_ids` multi-select picker populated from `GET /funding-programs/`
2. **Given** the admin selects one or more funding programs and submits **When** the form is valid **Then** the `funding_program_ids` array is sent in the payload **And** the folder model is created/updated with the associations
3. **Given** the admin edits an existing folder model with associated funding programs **When** the form loads **Then** the multi-select is pre-populated from `folderModel.funding_programs[]` on the read model
4. **Given** the admin removes all funding program selections **When** the form is submitted **Then** `funding_program_ids` is sent as an empty array

## Tasks / Subtasks

- [x] Task 1: Verify existing implementation covers all ACs (AC: #1, #2, #3, #4)
  - [ ] Review `src/app/domains/folder-models/forms/folder-model.form.ts` — already has `funding_program_ids` FormControl
  - [ ] Review `src/app/features/folder-models/ui/folder-model-form.component.ts` — already has MultiSelectorComponent integration
  - [ ] Review `src/app/features/folder-models/folder-model.facade.ts` — already has `loadAssociationData()`, `fpOptions`, `fpLoading`
  - [ ] Review `src/app/features/folder-models/folder-model.store.ts` — already has cross-domain FP computed signals
- [x] Task 2: Remove required validation on `funding_program_ids` (AC: #4)
  - [ ] **Decision (2026-03-11 party-mode review): Remove `Validators.required`.** The API schema marks `funding_program_ids` as optional (`string[] | null`), and admins may create folder models before programs are set up. The original Story 1.5 required validator was overly strict.
  - [ ] Update `src/app/domains/folder-models/forms/folder-model.form.ts`: remove `Validators.required` from `funding_program_ids` FormControl
  - [ ] Update `src/app/features/folder-models/ui/folder-model-form.component.ts`: remove the error message "Au moins un programme de financement est obligatoire" from the template
- [x] Task 3: Write/verify tests (AC: #1, #2, #3, #4)
  - [ ] Test: form creates with `funding_program_ids` field present
  - [ ] Test: multi-selector renders with FP options from facade
  - [ ] Test: edit mode patches `funding_program_ids` from `item.funding_programs.map(fp => fp.id)`
  - [ ] Test: empty selection sends empty array (if validator is removed)
  - [ ] Run `npx ng test --no-watch` — all tests pass

## Dev Notes

### Current State — ALREADY IMPLEMENTED

This feature was **substantially built in Story 1.5** (Folder Model — Funding Program Association). The following are already in place:

1. **Form builder** (`src/app/domains/folder-models/forms/folder-model.form.ts`):
   - `funding_program_ids: new FormControl<string[]>([], { validators: Validators.required })`

2. **Form component** (`src/app/features/folder-models/ui/folder-model-form.component.ts`):
   - `MultiSelectorComponent` integrated with `facade.fpOptions()`, `fpIds` getter, `onFpSelectionChange()` handler
   - Edit-mode `effect()` patches `funding_program_ids: item.funding_programs?.map(fp => fp.id) ?? []`
   - `loadAssociationData()` called in `ngOnInit()`

3. **Feature store** (`src/app/features/folder-models/folder-model.store.ts`):
   - Cross-domain `fpOptions` and `fpLoading` computed signals from FundingProgramDomainStore

4. **Facade** (`src/app/features/folder-models/folder-model.facade.ts`):
   - `loadAssociationData()` method, `fpOptions` and `fpLoading` signal projections

5. **Multi-selector shared component** (`src/app/shared/components/multi-selector/multi-selector.component.ts`):
   - Fully implemented with checkbox dropdown, chip display, loading/empty states

### Validation Change: Remove Required Constraint

> **Decision (2026-03-11 party-mode review): Remove `Validators.required` from `funding_program_ids`.**

The current implementation enforces **required validation** (`Validators.required`) on `funding_program_ids`. This is being relaxed because:
1. The API schema marks both `FolderModelCreate.funding_program_ids` and `FolderModelUpdate.funding_program_ids` as **optional** (`?: string[] | null`)
2. Admins may create folder models before funding programs are set up
3. AC #4 explicitly requires submitting an empty array to be valid

### Exact Files to Touch (If Validation Change Needed)

| File | Action | What |
|------|--------|------|
| `src/app/domains/folder-models/forms/folder-model.form.ts` | Modify | Remove `Validators.required` from `funding_program_ids` if relaxing |
| `src/app/features/folder-models/ui/folder-model-form.component.ts` | Modify | Remove error message for empty selection if relaxing |

### API Read vs Write Shape Difference

```
// READ (from API): nested objects
FolderModelRead.funding_programs: FundingProgramRead[]

// WRITE (to API): ID array
FolderModelCreate.funding_program_ids: string[]
FolderModelUpdate.funding_program_ids: string[]
```

The form binds to `funding_program_ids` (string array). On edit, IDs are extracted from nested objects:
```typescript
funding_program_ids: item.funding_programs?.map(fp => fp.id) ?? []
```

### Multi-Selector Component API

```typescript
// Inputs
options: SelectorOption[]    // { id: string; label: string }
selectedIds: string[]
placeholder: string
loading: boolean
hasError: boolean

// Output
selectionChange: string[]
```

### Anti-Patterns to Avoid

- Do NOT rebuild the multi-selector — it already exists as a shared component
- Do NOT add FP loading logic to the form component — use the facade's `loadAssociationData()`
- Do NOT confuse `funding_programs` (read objects) with `funding_program_ids` (write IDs)
- Do NOT import FundingProgramDomainStore in UI components — facade only
- Do NOT add mutations to the feature store — it must remain `withComputed` only

### Project Structure Notes

- This story is primarily a verification/validation story since the core feature exists
- The shared multi-selector component at `src/app/shared/components/multi-selector/` is reused across domains
- Cross-domain store composition follows the established pattern from Story 1.5

### References

- [Source: `src/app/domains/folder-models/forms/folder-model.form.ts` — current form with funding_program_ids control]
- [Source: `src/app/features/folder-models/ui/folder-model-form.component.ts` — current form component with multi-selector integration]
- [Source: `src/app/features/folder-models/folder-model.facade.ts` — facade with fpOptions, fpLoading, loadAssociationData]
- [Source: `src/app/features/folder-models/folder-model.store.ts` — feature store with cross-domain FP computed signals]
- [Source: `src/app/shared/components/multi-selector/multi-selector.component.ts` — shared multi-selector component]
- [Source: `src/app/core/api/generated/api-types.ts:2679-2728` — FolderModelCreate/Read/Update types]
- [Source: `_bmad-output/implementation-artifacts/v1/1-5-folder-model-funding-program-association.md` — original Story 1.5 implementation]
- [Source: `_bmad-output/planning-artifacts/v1.2/epics.md` — Story 9.3 acceptance criteria]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- None

### Completion Notes List
- Removed `Validators.required` from `funding_program_ids` FormControl (API marks it optional)
- Removed error message "Au moins un programme de financement est obligatoire" from template
- Removed asterisk from "Programmes de financement" label
- Changed `[hasError]` binding to `false` since field is no longer validated
- Added 3 unit tests for folder-model form (field presence, no required validation, name required)
- All 806 tests pass

### File List
- `src/app/domains/folder-models/forms/folder-model.form.ts` (modified)
- `src/app/features/folder-models/ui/folder-model-form.component.ts` (modified)
- `src/app/domains/folder-models/forms/folder-model.form.spec.ts` (new)
