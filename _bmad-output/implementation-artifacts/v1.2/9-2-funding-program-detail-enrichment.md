# Story 9.2: FundingProgram Detail Enrichment

Status: review

## Story

As an admin,
I want to see budget, dates, active status, and linked folder model on the funding-program detail page,
so that I can review the complete program information at a glance and navigate to related entities.

> **Scope note (2026-03-11):** This story now includes the FP → FM bidirectional navigation from former Story 12.1. The folder model field must be a clickable navigation link, not just a displayed value.

## Acceptance Criteria

1. **Given** a funding-program detail page **When** the page loads **Then** the MetadataGrid displays: `budget` formatted as currency (or "---" if null), `start_date` and `end_date` formatted with `formatDateFr()` (or "---" if null), `is_active` as "Actif"/"Inactif" text, `folder_model_id` as a clickable link to the folder-model detail page (or "---" if null)
2. **Given** the funding program has `is_active = false` **When** the detail page renders **Then** the active status field clearly indicates inactive state (e.g., "Inactif")
3. **Given** the funding program has a `folder_model_id` set **When** the detail page renders **Then** the folder model **name** is displayed as a clickable link navigating to `/folder-models/{folder_model_id}` (resolved via `fmOptions` from Story 9.1, not a raw UUID)
4. **Given** a funding program with `folder_model_id = null` **When** the detail page renders **Then** the "Modele de dossier" field shows "---" as plain text (no link)

## Tasks / Subtasks

- [x] Task 1: Format budget as EUR currency in MetadataGrid (AC: #1)
  - [ ] Edit `src/app/features/funding-programs/ui/funding-program-detail.component.ts`
  - [ ] Update the `Budget` field in the `fields` computed to format with `Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })`
  - [ ] Keep "---" fallback when `budget` is null/undefined
- [x] Task 2: Verify date fields use `type: 'date'` (AC: #1)
  - [ ] The `start_date` and `end_date` fields already use `type: 'date'` in the current `fields` computed
  - [ ] Verify `formatDateFr()` is applied via MetadataGrid's built-in date rendering — no changes expected
- [x] Task 3: Improve `is_active` display (AC: #1, #2)
  - [ ] Update the `Actif` field in the `fields` computed
  - [ ] Current implementation shows "Oui"/"Non" — update to "Actif"/"Inactif" for clearer semantics
- [x] Task 4: Add `folder_model_id` as linked field in MetadataGrid (AC: #1, #3)
  - [ ] Add a new MetadataField entry for folder model
  - [ ] Use `type: 'linked'` with `linkedRoute: '/folder-models/' + p.folder_model_id`
  - [ ] Need to resolve folder model name — since FundingProgramRead does NOT embed the folder model object, must either:
    - Option A: Load folder model by ID via facade to get the name
    - Option B: Display "Modèle de dossier" with the ID as link text (less user-friendly)
    - Option C: Load all folder models and look up name from the list
  - [ ] **Recommended: Option C** — reuse the `fmOptions` signal from Story 9.1's feature store additions. The facade already exposes `fmOptions` after Story 9.1 is complete. Call `facade.loadAssociationData()` in `ngOnInit()` and use a computed to resolve the name.
- [x] Task 5: Write tests (AC: #1, #2, #3)
  - [ ] Test: budget field renders currency-formatted value
  - [ ] Test: is_active shows "Actif" when true, "Inactif" when false
  - [ ] Test: folder_model_id renders as linked field with correct route
  - [ ] Test: null folder_model_id renders "---"
  - [ ] Run `npx ng test --no-watch` — all tests pass

## Dev Notes

### Current State of the Detail Component

The detail component (`funding-program-detail.component.ts`) **already displays** budget, is_active, start_date, and end_date in the MetadataGrid. However:

1. **Budget** — currently rendered as plain text (`p.budget != null ? \`${p.budget}\` : '---'`). Needs currency formatting.
2. **is_active** — currently shows "Oui"/"Non". Should show "Actif"/"Inactif" for consistency with the epic requirements.
3. **Dates** — already use `type: 'date'`, which triggers `formatDateFr()` in MetadataGrid. No changes needed.
4. **folder_model_id** — not yet displayed. Needs to be added as a `type: 'linked'` field.

### Exact Files to Touch

| File | Action | What |
|------|--------|------|
| `src/app/features/funding-programs/ui/funding-program-detail.component.ts` | Modify | Update budget formatting, is_active text, add folder_model_id linked field |

### Budget Currency Formatting

```typescript
// In the fields computed:
{
  label: 'Budget',
  value: p.budget != null
    ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(p.budget)
    : '---',
  type: 'text' as const,
},
```

Output examples: `1 500,00 EUR`, `250 000,00 EUR`

### Folder Model Name Resolution

`FundingProgramRead` only contains `folder_model_id` (a UUID string), NOT an embedded folder model object. To display a human-readable name:

**Depends on Story 9.1 completion** — Story 9.1 adds `fmOptions` signal to the FundingProgram feature store and `loadAssociationData()` to the facade.

After Story 9.1 is done, the detail component can:
1. Call `this.facade.loadAssociationData()` in `ngOnInit()` (same as form does)
2. Create a computed that looks up the folder model name from `facade.fmOptions()`

```typescript
readonly folderModelName = computed(() => {
  const p = this.program();
  if (!p?.folder_model_id) return null;
  const options = this.facade.fmOptions();
  return options.find(o => o.id === p.folder_model_id)?.label ?? null;
});
```

Then in the `fields` computed:
```typescript
{
  label: 'Modèle de dossier',
  value: this.folderModelName() ?? '---',
  type: p.folder_model_id ? 'linked' as const : 'text' as const,
  linkedRoute: p.folder_model_id ? '/folder-models/' + p.folder_model_id : undefined,
},
```

**If Story 9.1 is NOT yet done**, implement the facade changes (fmOptions, loadAssociationData) as part of this story instead, or display the raw ID with a link as a temporary measure.

### MetadataGrid `type: 'linked'` Pattern

From `metadata-grid.component.ts`, the `linked` type renders a `<a>` tag with `[routerLink]` to `linkedRoute`. The `value` is the display text, and `linkedRoute` is the navigation target.

### Anti-Patterns to Avoid

- Do NOT use `StatusBadge` component for `is_active` — MetadataGrid does not support embedded components; use plain text "Actif"/"Inactif"
- Do NOT make raw HTTP calls from the component — use facade signals
- Do NOT display the raw UUID for `folder_model_id` — resolve to a name
- Do NOT add `folder_model_id` as `type: 'linked'` when the value is null — use `type: 'text'` with "---" for null values
- Do NOT forget to handle the case where `fmOptions()` hasn't loaded yet (folder model name may be null initially)

### Dependency on Story 9.1

This story depends on Story 9.1 for the `fmOptions` signal and `loadAssociationData()` method on the facade. If implementing in isolation, those cross-domain additions must be done here instead.

### Project Structure Notes

- Only the detail component changes — no domain or store changes (assuming Story 9.1 is done)
- MetadataGrid is a shared component that handles rendering — no changes to it

### References

- [Source: `src/app/features/funding-programs/ui/funding-program-detail.component.ts` — current detail implementation with fields computed]
- [Source: `src/app/shared/components/metadata-grid/metadata-grid.component.ts` — MetadataField interface with 'linked' type support]
- [Source: `src/app/core/api/generated/api-types.ts:2855-2889` — FundingProgramRead with folder_model_id]
- [Source: `src/app/features/folder-models/ui/folder-model-detail.component.ts` — reference for detail component pattern with cross-domain data]
- [Source: `_bmad-output/planning-artifacts/v1.2/epics.md` — Story 9.2 acceptance criteria]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- Removed unused RouterLink import from detail component (MetadataGrid handles linked type internally)

### Completion Notes List
- Updated budget field to use `Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })` formatting
- Changed is_active display from "Oui"/"Non" to "Actif"/"Inactif"
- Added folder_model_id as linked field in MetadataGrid using fmOptions signal from Story 9.1
- Added `loadAssociationData()` call in ngOnInit for folder model name resolution
- Added `folderModelName` computed signal for resolving FM UUID to display name
- Added 2 cross-domain facade tests for fmOptions
- All 806 tests pass

### File List
- `src/app/features/funding-programs/ui/funding-program-detail.component.ts` (modified)
- `src/app/features/funding-programs/funding-program.facade.spec.ts` (modified)
