# Story 12.1: Funding Program / Folder Model Cross-Navigation

Status: merged-into-9.2-and-9.4

> **Merged (2026-03-11 party-mode review):** The FP → FM navigation is now covered by Story 9.2 (AC #3: folder model as clickable linked field). The FM → FP navigation is already covered by Story 9.4 (clickable links to each funding program). This story is redundant — both detail components are already being modified in Epic 9.

## Story

As an admin,
I want to see linked folder models on a funding program's detail page and linked funding programs on a folder model's detail page as clickable navigation links,
so that I can navigate the relationship from either direction.

## Acceptance Criteria

1. **Given** a funding program with a non-null `folder_model_id` **When** I view the FP detail page **Then** the "Modèle de dossier" field displays the folder model's name as a clickable link that navigates to `/folder-models/{folder_model_id}`
2. **Given** a funding program with a null `folder_model_id` **When** I view the FP detail page **Then** the "Modèle de dossier" field displays "—"
3. **Given** a folder model with associated funding programs **When** I view the FM detail page **Then** each funding program name is a clickable link navigating to `/funding-programs/{fp.id}`
4. **Given** a folder model with no associated funding programs **When** I view the FM detail page **Then** the "Programmes de financement" field displays "Aucun"

## Tasks / Subtasks

- [ ] Task 1: Resolve folder model name on FP detail page (AC: #1, #2)
  - [ ] Edit `src/app/features/funding-programs/funding-program.facade.ts` — inject `FolderModelDomainStore`, add method `loadFolderModel(id: string)` to fetch a single folder model by ID
  - [ ] Edit `src/app/features/funding-programs/funding-program.store.ts` — add computed signal `linkedFolderModel` that reads the selected FP's `folder_model_id` and looks it up in the FolderModelDomainStore items, or returns null
  - [ ] Expose `linkedFolderModel` signal through facade
- [ ] Task 2: Update FP detail component MetadataGrid for folder model link (AC: #1, #2)
  - [ ] Edit `src/app/features/funding-programs/ui/funding-program-detail.component.ts`
  - [ ] In `ngOnInit()`, after `facade.select(id)`, use an `effect()` to watch `program()` and call `facade.loadFolderModel(program().folder_model_id)` when non-null
  - [ ] In the `fields` computed, add a MetadataField for "Modèle de dossier":
    - If `folder_model_id` is null: `{ label: 'Modèle de dossier', value: '—', type: 'text' }`
    - If `linkedFolderModel()` is resolved: `{ label: 'Modèle de dossier', value: fm.name, type: 'linked', linkedRoute: '/folder-models/' + fm.id }`
    - While loading / not yet resolved: `{ label: 'Modèle de dossier', value: folder_model_id, type: 'text' }` (fallback to raw ID)
- [ ] Task 3: Update FM detail component MetadataGrid for FP navigation links (AC: #3, #4)
  - [ ] Edit `src/app/features/folder-models/ui/folder-model-detail.component.ts`
  - [ ] Replace the current single "Programmes de financement" text field with one MetadataField per funding program, each with `type: 'linked'` and `linkedRoute: '/funding-programs/' + fp.id`
  - [ ] If `funding_programs` is empty or undefined, show single field with value "Aucun"
- [ ] Task 4: Write tests (AC: #1, #2, #3, #4)
  - [ ] Test FP detail: fields include folder model as linked type when `folder_model_id` is set
  - [ ] Test FP detail: fields show "—" when `folder_model_id` is null
  - [ ] Test FM detail: fields include linked FP entries when `funding_programs` is populated
  - [ ] Test FM detail: fields show "Aucun" when `funding_programs` is empty
  - [ ] Run `npx ng test --no-watch` — all tests pass

## Dev Notes

### Project Structure Notes

This story's scope is narrow — it converts already-displayed IDs/names into clickable navigation links using the existing `MetadataField` `type: 'linked'` mechanism.

### Current State Analysis

**FP detail** (`src/app/features/funding-programs/ui/funding-program-detail.component.ts`):
- Currently does NOT show `folder_model_id` at all in the `fields` computed (lines 84-97). Story 9.2 was supposed to add it, but the current code has no folder model field.
- `FundingProgramRead` has `folder_model_id?: string | null` — it is just a UUID string, NOT an embedded object. There is no `folder_model_name` on the FP response.
- To display the folder model's NAME (not just the UUID), you must load the folder model by ID from the FolderModelDomainStore.

**FM detail** (`src/app/features/folder-models/ui/folder-model-detail.component.ts`):
- Currently shows `funding_programs` as a comma-joined name string with `type: 'text'` (line 91): `{ label: 'Programmes de financement', value: fpNames, type: 'text' as const }`.
- `FolderModelRead.funding_programs` is an embedded array of full `FundingProgramRead` objects — so `fp.id` and `fp.name` are available without extra API calls.
- Needs conversion to `type: 'linked'` with `linkedRoute`.

### MetadataField Linked Type

From `src/app/shared/components/metadata-grid/metadata-grid.component.ts`:
```typescript
export interface MetadataField {
  label: string;
  value: string;
  type?: 'text' | 'mono' | 'linked' | 'date';
  linkedRoute?: string;
}
```

Usage: `{ label: 'Modèle de dossier', value: 'Nom du modèle', type: 'linked', linkedRoute: '/folder-models/uuid-here' }`

### Resolving Folder Model Name on FP Detail

The `FundingProgramRead` type only has `folder_model_id` (a UUID), not an embedded folder model object. To display the name:

**Option A (recommended):** Use `FolderModelDomainStore.selectById()` to fetch the folder model, then read its name from the store's `selectedItem` or `items`. Since the FP facade already has cross-domain access patterns (see Story 9.1 where `FolderModelDomainStore` is injected for the form), extend this:

```typescript
// In funding-program.facade.ts
private readonly fmDomainStore = inject(FolderModelDomainStore);

loadFolderModel(id: string): void {
  this.fmDomainStore.selectById(id);
}

readonly linkedFolderModel = computed(() => {
  // Read from the FM domain store's selectedItem or items
});
```

**Important caveat:** Using `selectById` on the FolderModelDomainStore would conflict if the user also has a FM detail page open. A safer approach is to look through `fmDomainStore.items()` after calling `fmDomainStore.load(undefined)`, then find by ID:

```typescript
loadFolderModelForLink(): void {
  this.fmDomainStore.load(undefined); // loads all folder models (first page)
}

readonly linkedFolderModel = computed(() => {
  const fp = this.selectedItem();
  if (!fp?.folder_model_id) return null;
  return this.featureStore.fmItems().find(fm => fm.id === fp.folder_model_id) ?? null;
});
```

This reuses the same pattern from Story 9.1's `loadAssociationData()`.

### FM Detail — Multiple Linked Fields Pattern

MetadataGrid renders each field as a separate row. For multiple FPs, generate one MetadataField per FP:

```typescript
const fpFields: MetadataField[] = (m.funding_programs?.length)
  ? m.funding_programs.map((fp, i) => ({
      label: i === 0 ? 'Programmes de financement' : '',
      value: fp.name,
      type: 'linked' as const,
      linkedRoute: '/funding-programs/' + fp.id,
    }))
  : [{ label: 'Programmes de financement', value: 'Aucun', type: 'text' as const }];
```

Alternatively, if MetadataGrid doesn't support multiple rows with the same label well, keep a single field and make only the first FP a link (simpler but less useful). Check MetadataGrid rendering to decide.

### Route Mapping

| Entity Type | Route Pattern |
|-------------|--------------|
| FundingProgram | `/funding-programs/{id}` |
| FolderModel | `/folder-models/{id}` |

### Exact Files to Modify

| File | Action | What |
|------|--------|------|
| `src/app/features/funding-programs/funding-program.facade.ts` | Modify | Inject FolderModelDomainStore, add `loadFolderModelForLink()`, expose `linkedFolderModel` |
| `src/app/features/funding-programs/funding-program.store.ts` | Modify | Add `fmItems` computed from FolderModelDomainStore, add `linkedFolderModel` computed |
| `src/app/features/funding-programs/ui/funding-program-detail.component.ts` | Modify | Add folder model MetadataField with `type: 'linked'`, trigger FM load in effect |
| `src/app/features/folder-models/ui/folder-model-detail.component.ts` | Modify | Convert FP names from `type: 'text'` to `type: 'linked'` with `linkedRoute` |

### Anti-Patterns to Avoid

- Do NOT make direct API calls from detail components — use the facade
- Do NOT use `selectById` on FolderModelDomainStore from the FP detail — it would conflict with FM detail page state. Use `load()` + find-by-id from `items()` instead
- Do NOT forget the null/undefined guard for `folder_model_id` — it is optional on FundingProgramRead
- Do NOT hardcode folder model names — always resolve from the store
- Do NOT import domain stores in UI components — facade only
- Do NOT forget the "—" fallback for null `folder_model_id` and "Aucun" for empty `funding_programs`

### Dependencies

- Story 9.1 (FP form enrichment with `folder_model_id`) should be complete so the facade already has FolderModelDomainStore cross-domain patterns
- Story 9.2 (FP detail shows `folder_model_id`) — this story supersedes the simple ID display with a navigable link
- Story 9.4 (FM detail shows `funding_programs`) — this story upgrades the text display to navigable links

### References

- [Source: `src/app/features/funding-programs/ui/funding-program-detail.component.ts` — FP detail, fields computed]
- [Source: `src/app/features/folder-models/ui/folder-model-detail.component.ts` — FM detail, fields computed with FP names]
- [Source: `src/app/shared/components/metadata-grid/metadata-grid.component.ts` — MetadataField interface with `type: 'linked'`]
- [Source: `src/app/features/folder-models/folder-model.facade.ts` — cross-domain pattern with `loadAssociationData()`]
- [Source: `src/app/core/api/generated/api-types.ts:2856-2889` — FundingProgramRead with `folder_model_id`]
- [Source: `src/app/core/api/generated/api-types.ts:2694-2716` — FolderModelRead with embedded `funding_programs: FundingProgramRead[]`]

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
