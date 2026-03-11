# Story 9.1: FundingProgram Form Enrichment

Status: review

## Story

As an admin,
I want to set budget, start/end dates, active status, and linked folder model when creating or editing a funding program,
so that I can capture the full financial and programmatic context.

## Acceptance Criteria

1. **Given** the funding-program create or edit form **When** the form renders **Then** it includes the following fields in addition to existing ones: `budget` (number input, optional, min 0), `start_date` (date picker, optional), `end_date` (date picker, optional), `is_active` (toggle/checkbox, defaults to true on create), `folder_model_id` (dropdown selector populated from `GET /folder-models/`, optional)
2. **Given** the admin fills in the enriched fields and submits **When** the form is valid **Then** all fields (including `folder_model_id`) are sent in the `POST` or `PUT` payload **And** the admin is navigated to the detail page on success
3. **Given** the admin edits an existing funding program **When** the form loads **Then** all enriched fields are pre-populated with current values, including the `folder_model_id` dropdown showing the currently linked folder model

## Tasks / Subtasks

- [x] Task 1: Add `folder_model_id` to `createFundingProgramForm()` (AC: #1)
  - [ ] Edit `src/app/domains/funding-programs/forms/funding-program.form.ts`
  - [ ] Add `folder_model_id: [initial?.folder_model_id ?? null as string | null]` to the form group
  - [ ] No validator needed — field is optional
- [x] Task 2: Add cross-domain folder-model loading to FundingProgram facade (AC: #1)
  - [ ] Edit `src/app/features/funding-programs/funding-program.facade.ts`
  - [ ] Inject `FolderModelDomainStore` from `@domains/folder-models/folder-model.store`
  - [ ] Add `loadAssociationData()` method that calls `fmDomainStore.load(undefined)`
  - [ ] Expose `fmOptions` and `fmLoading` signals (projected from feature store)
- [x] Task 3: Add folder-model cross-domain signals to FundingProgram feature store (AC: #1)
  - [ ] Edit `src/app/features/funding-programs/funding-program.store.ts`
  - [ ] Inject `FolderModelDomainStore`
  - [ ] Add computed `fmOptions: computed(() => fmStore.items().map(fm => ({ id: fm.id, label: fm.name })))`
  - [ ] Add computed `fmLoading: computed(() => fmStore.isLoading())`
- [x] Task 4: Add `folder_model_id` dropdown to form component template (AC: #1, #2)
  - [ ] Edit `src/app/features/funding-programs/ui/funding-program-form.component.ts`
  - [ ] Call `facade.loadAssociationData()` in `ngOnInit()`
  - [ ] Add `<select formControlName="folder_model_id">` with empty option "Aucun" and `@for` over `facade.fmOptions()`
  - [ ] Style consistently with existing form fields (same border, padding, rounded classes)
- [x] Task 5: Update edit-mode `effect()` to patch `folder_model_id` (AC: #3)
  - [ ] Edit `src/app/features/funding-programs/ui/funding-program-form.component.ts`
  - [ ] Add `folder_model_id: item.folder_model_id ?? null` to the `patchValue()` call in the existing `effect()`
- [x] Task 6: Update `onSubmit()` to include `folder_model_id` in payload (AC: #2)
  - [ ] The existing `getRawValue()` spread already captures all form controls, so `folder_model_id` is included automatically
  - [ ] Verify the `data` object shape matches `FundingProgramCreate`/`FundingProgramUpdate` types
- [x] Task 7: Write tests (AC: #1, #2, #3)
  - [ ] Test: form creates with `folder_model_id` field present
  - [ ] Test: facade `loadAssociationData()` triggers folder-model domain store load
  - [ ] Test: feature store `fmOptions` signal projects correctly with `{ id, label }` shape
  - [ ] Run `npx ng test --no-watch` — all tests pass

## Dev Notes

### Current State of the Codebase

The funding-program form (`funding-program-form.component.ts`) **already has** `budget`, `start_date`, `end_date`, and `is_active` fields fully implemented in both the form builder and the template. The `createFundingProgramForm()` in `funding-program.form.ts` already includes these four controls. The edit-mode `effect()` already patches all four fields. **The only missing field is `folder_model_id`.**

This story's primary implementation work is adding the `folder_model_id` dropdown, which requires:
1. A new form control in the form builder
2. Cross-domain loading of folder models (same pattern as FolderModel loading FundingPrograms)
3. A `<select>` dropdown in the template
4. Patching the field on edit

### Exact Files to Touch

| File | Action | What |
|------|--------|------|
| `src/app/domains/funding-programs/forms/funding-program.form.ts` | Modify | Add `folder_model_id` control |
| `src/app/features/funding-programs/funding-program.store.ts` | Modify | Add `fmOptions`, `fmLoading` computed signals from FolderModelDomainStore |
| `src/app/features/funding-programs/funding-program.facade.ts` | Modify | Inject FolderModelDomainStore, add `loadAssociationData()`, expose `fmOptions`/`fmLoading` |
| `src/app/features/funding-programs/ui/funding-program-form.component.ts` | Modify | Add `<select>` for folder_model_id, call `loadAssociationData()` in ngOnInit, patch in effect |

### Cross-Domain Pattern — Follow FolderModel Precedent Exactly

The FolderModel feature already loads FundingPrograms for its multi-selector. The FundingProgram feature must do the **reverse** — load FolderModels for a single-select dropdown. Follow the identical pattern:

**Feature store** (`folder-model.store.ts` is the reference):
```typescript
// In funding-program.store.ts — add FolderModel cross-domain signals
const fmStore = inject(FolderModelDomainStore);
// ...
fmOptions: computed(() => (fmStore.items() as FolderModel[]).map(fm => ({ id: fm.id, label: fm.name }))),
fmLoading: computed(() => fmStore.isLoading()),
```

**Facade** (`folder-model.facade.ts` is the reference):
```typescript
// In funding-program.facade.ts
private readonly fmDomainStore = inject(FolderModelDomainStore);
readonly fmOptions = this.featureStore.fmOptions;
readonly fmLoading = this.featureStore.fmLoading;
loadAssociationData(): void { this.fmDomainStore.load(undefined); }
```

### Dropdown Pattern (Single-Select, Not Multi-Select)

Unlike the FolderModel form which uses `MultiSelectorComponent` for `funding_program_ids[]`, this form needs a simple `<select>` for a single `folder_model_id`. Use a native HTML select element:

```html
<div>
  <label for="folder_model_id" class="block text-sm font-medium text-text-primary mb-1">Modèle de dossier</label>
  <select
    id="folder_model_id"
    formControlName="folder_model_id"
    class="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand"
  >
    <option [ngValue]="null">Aucun</option>
    @for (option of facade.fmOptions(); track option.id) {
      <option [value]="option.id">{{ option.label }}</option>
    }
  </select>
</div>
```

Note: Import `NgFor` is NOT needed — the `@for` block syntax is used. However, `[ngValue]` requires importing nothing extra in standalone components using Angular 21.

### API Types Confirmation

From `src/app/core/api/generated/api-types.ts`:
- `FundingProgramCreate.folder_model_id?: string | null` — optional
- `FundingProgramUpdate.folder_model_id?: string | null` — optional
- `FundingProgramRead.folder_model_id?: string | null` — optional

### Anti-Patterns to Avoid

- Do NOT build `budget`, `start_date`, `end_date`, or `is_active` — they are already implemented
- Do NOT make API calls from the form component directly — use the facade
- Do NOT import FolderModelDomainStore in UI components — facade only
- Do NOT use `MultiSelectorComponent` for `folder_model_id` — it is a single-select field, use a native `<select>`
- Do NOT forget to call `loadAssociationData()` in `ngOnInit()` — the dropdown will be empty otherwise
- Do NOT forget the "Aucun" (None) empty option — `folder_model_id` is optional

### Project Structure Notes

- Feature store stays `withComputed` only — no mutations added
- Facade is the single entry point for cross-domain data loading
- Form builder stays in domain layer (`domains/funding-programs/forms/`)

### References

- [Source: `src/app/features/folder-models/folder-model.store.ts` — cross-domain feature store pattern]
- [Source: `src/app/features/folder-models/folder-model.facade.ts` — cross-domain facade pattern with `loadAssociationData()`]
- [Source: `src/app/features/folder-models/ui/folder-model-form.component.ts` — form component with cross-domain loading]
- [Source: `src/app/core/api/generated/api-types.ts:2835-2909` — FundingProgramCreate/Read/Update types with folder_model_id]
- [Source: `_bmad-output/planning-artifacts/v1.2/epics.md` — Epic 9 story definitions]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- None

### Completion Notes List
- Added `folder_model_id` form control to `createFundingProgramForm()`
- Added `fmOptions` and `fmLoading` cross-domain signals to feature store (from FolderModelDomainStore)
- Added `loadAssociationData()`, `fmOptions`, `fmLoading` to facade
- Added `<select>` dropdown for folder_model_id with "Aucun" empty option
- Called `loadAssociationData()` in form component ngOnInit
- Added `folder_model_id` to edit-mode `patchValue()` call
- Added 4 unit tests for form builder
- All 806 tests pass

### File List
- `src/app/domains/funding-programs/forms/funding-program.form.ts` (modified)
- `src/app/features/funding-programs/funding-program.store.ts` (modified)
- `src/app/features/funding-programs/funding-program.facade.ts` (modified)
- `src/app/features/funding-programs/ui/funding-program-form.component.ts` (modified)
- `src/app/domains/funding-programs/forms/funding-program.form.spec.ts` (new)
