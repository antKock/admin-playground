# Story 1.5: Folder Model — Funding Program Association

Status: review

## Story

As an operator (Sophie),
I want to associate a Folder Model with one or more Funding Programs,
So that folder structures are correctly linked to their parent programs.

## Acceptance Criteria

1. Folder Model create/edit form renders a Funding Program multi-selector populated from the FP domain store
2. Multi-selector allows selecting multiple Funding Programs (checkboxes or multi-dropdown)
3. Selected Funding Programs display as removable chips/tags below the selector
4. Multi-selector shows loading state while FP data is being fetched
5. Multi-selector shows empty state ("No Funding Programs available") when no data exists
6. Validation: at least one Funding Program must be selected (form invalid if empty)
7. On edit, currently associated Funding Programs are pre-selected
8. Saving persists the `funding_program_ids` array via the API
9. Removing a Funding Program and saving updates the association via the API
10. Detail view displays all associated Funding Programs as a list with names
11. Feature store aggregates FP domain store data for selector options
12. Facade exposes `fpOptions` signal and `loadAssociationData()` method
13. Feature store remains `withComputed` only — no mutations
14. All existing tests pass; new cross-domain and multi-select tests added
15. Evaluate multi-selector for `shared/components/` placement if reuse is likely in Epics 2–3

## Tasks / Subtasks

- [x] Task 1: Evaluate multi-selector as shared component (AC: #15)
  - [x] Check if Communities (Epic 2) or Indicator Models (Epic 3) need multi-select for associations
  - [x] If reuse is likely: create `src/app/shared/components/multi-selector/multi-selector.component.ts`
  - [x] If single-use: build inline in the form component
  - [x] Decision criteria: if 2+ entities need multi-select → shared component; if only Folder Models → inline
  - [x] **Decision:** Stories 2.2 and 3.4 both need multi-select → built as shared component
- [x] Task 2: Create multi-selector shared component (AC: #2, #3, #4, #5, if shared)
  - [x] Create `src/app/shared/components/multi-selector/multi-selector.component.ts`
  - [x] Inputs: `options` (SelectorOption[]), `selectedIds` (string[]), `placeholder` (string), `loading` (boolean), `hasError` (boolean)
  - [x] Output: `selectionChange` (string[])
  - [x] Renders: dropdown toggle → checkbox list → selected chips below
  - [x] Chip removal: click X on chip → removes from selection → emits change
  - [x] Loading state: disabled with "Loading..." text
  - [x] Empty state: "No options available" message
  - [x] Click-outside-to-close via document:click host listener
- [x] Task 3: Extend feature store with FP aggregation (AC: #11, #13)
  - [x] Edit `src/app/features/folder-models/folder-model.store.ts`
  - [x] Inject `FundingProgramDomainStore`
  - [x] Add computed: `fpOptions: computed(() => fpStore.items().map(fp => ({ id: fp.id, label: fp.name })))`
- [x] Task 4: Extend facade with FP loading (AC: #12)
  - [x] Edit `src/app/features/folder-models/folder-model.facade.ts`
  - [x] Inject `FundingProgramDomainStore`
  - [x] Expose: `readonly fpOptions = this.featureStore.fpOptions`
  - [x] Add `loadAssociationData()`: calls `fpDomainStore.load(undefined)` to pre-load selector options
  - [x] Expose: `readonly fpLoading` signal
- [x] Task 5: Update form component with multi-selector (AC: #1, #2, #3, #6, #7, #8, #9)
  - [x] Edit `src/app/features/folder-models/ui/folder-model-form.component.ts`
  - [x] Call `facade.loadAssociationData()` in `ngOnInit()`
  - [x] Integrated shared multi-selector component:
    - Pass `facade.fpOptions()` as options
    - Bind via `fpIds` getter to `funding_program_ids` form control
    - On `selectionChange` → update form control value + markAsDirty
  - [x] Validation display: "At least one Funding Program is required" when empty and touched
  - [x] Edit mode: `effect()` patches `funding_program_ids` from `selectedItem().funding_programs.map(fp => fp.id)`
- [x] Task 6: Update detail component with FP list display (AC: #10)
  - [x] Already implemented in Story 1.4 — shows comma-separated FP names with "None" empty state
- [x] Task 7: Update list component with FP column (AC: #11)
  - [x] Edit `src/app/features/folder-models/ui/folder-model-list.component.ts`
  - [x] Added `funding_programs_display` column with computed `rows` flattening nested FP names
- [x] Task 8: Write tests (AC: #14)
  - [x] Created `src/app/shared/components/multi-selector/multi-selector.component.spec.ts` (9 tests)
  - [x] Updated `src/app/features/folder-models/folder-model.facade.spec.ts` (2 cross-domain tests)
  - [x] Test: `loadAssociationData()` triggers FP domain store load
  - [x] Test: `fpOptions` signal projects correctly with id/label shape
  - [x] Run `npx ng test --watch=false` — 167 tests pass, zero regressions

## Dev Notes

### Multi-Selector Component Decision (Epic 0 Retro Action Item)

The Epic 0 retro explicitly called out: "Multi-selector component is evaluated for `shared/` placement before building feature-local." After reviewing upcoming stories:

- **Story 2.2** (Community user assignment): needs user multi-select
- **Story 3.4** (Attach Indicator Models to Action Models): needs indicator model multi-select

**Recommendation: Build as shared component.** The pattern is identical across all three: dropdown with checkboxes, selected chips, loading/empty states. Building shared now prevents wheel reinvention.

### Multi-Selector Component Pattern

```typescript
@Component({
  selector: 'app-multi-selector',
  template: `
    <div class="relative">
      <button type="button" (click)="toggleOpen()" class="w-full px-3 py-2 border ...">
        {{ selectedCount() ? selectedCount() + ' selected' : placeholder }}
      </button>
      @if (isOpen()) {
        <div class="absolute z-10 mt-1 w-full bg-surface-base border ...">
          @for (option of options(); track option.id) {
            <label class="flex items-center px-3 py-2 hover:bg-surface-muted cursor-pointer">
              <input type="checkbox"
                [checked]="isSelected(option.id)"
                (change)="toggleOption(option.id)"
              />
              <span class="ml-2">{{ option.label }}</span>
            </label>
          }
        </div>
      }
      <div class="flex flex-wrap gap-1 mt-1">
        @for (id of selectedIds(); track id) {
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-brand-light text-brand">
            {{ getLabel(id) }}
            <button type="button" (click)="removeOption(id)" class="ml-1">&times;</button>
          </span>
        }
      </div>
    </div>
  `,
})
export class MultiSelectorComponent {
  options = input.required<{ id: string; label: string }[]>();
  selectedIds = model<string[]>([]);
  placeholder = input('Select...');
  // ...
}
```

### API Read vs Write Shape Difference

```
// READ (from API): nested objects
FolderModelRead.funding_programs: FundingProgramRead[]

// WRITE (to API): ID array
FolderModelCreate.funding_program_ids: string[]
FolderModelUpdate.funding_program_ids: string[]
```

The form binds to `funding_program_ids` (string array). On edit, extract IDs from nested objects:
```typescript
effect(() => {
  const item = this.facade.selectedItem();
  if (this.isEditMode && item && !this.formPatched) {
    this.formPatched = true;
    this.form.patchValue({
      name: item.name,
      description: item.description ?? null,
      funding_program_ids: item.funding_programs?.map(fp => fp.id) ?? [],
    });
  }
});
```

### Cross-Domain Store Pattern

Same pattern as Story 1.2 but with only FP (no AT):

```typescript
// features/folder-models/folder-model.store.ts
export const FolderModelFeatureStore = signalStore(
  { providedIn: 'root' },
  withComputed(() => {
    const domainStore = inject(FolderModelDomainStore);
    const fpStore = inject(FundingProgramDomainStore);
    return {
      // All existing signals...
      fpOptions: computed(() => fpStore.items().map(fp => ({ id: fp.id, label: fp.name }))),
    };
  }),
);
```

### Known Workarounds (from Epic 0 Retro)

Same as all other Epic 1 stories — `as never` casts, `withProps` for injection, Vitest sync.

### Dependencies

- **Requires Story 1.4 complete** — base CRUD implementation for Folder Models
- **Uses existing FP domain store** from Epic 0

### Anti-Patterns to Avoid

- Do NOT make separate API calls from the form to load FP data — use facade
- Do NOT confuse `funding_programs` (read objects) with `funding_program_ids` (write IDs)
- Do NOT build the multi-selector inline if it will be reused — evaluate shared placement first
- Do NOT import FP domain store in UI components — facade only

### Project Structure Notes

- This story modifies files created in Story 1.4
- If multi-selector is shared: new file at `src/app/shared/components/multi-selector/`
- Feature store gets FP aggregation computed signal
- Facade gets FP loading method

### References

- [Source: src/app/features/action-models/action-model.store.ts — cross-domain feature store pattern (if Story 1.2 done)]
- [Source: src/app/core/api/generated/api-types.ts:2679-2728 — FolderModel types with funding_programs array]
- [Source: _bmad-output/implementation-artifacts/epic-0-retro-2026-03-04.md — multi-selector shared component evaluation]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.5]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Build: `npx ng build` — zero errors
- Tests: `npx ng test --watch=false` — 167 tests pass across 23 files, zero regressions

### Completion Notes List

- Built `MultiSelectorComponent` as shared component in `shared/components/multi-selector/` — reusable for Stories 2.2 and 3.4
- Used Angular `input()` signal inputs and `output()` for the component API
- Feature store maps FP items to `{ id, label }` shape for the multi-selector
- Fixed TS4111 index signature access by using `form.get('funding_program_ids')` instead of `form.controls.funding_program_ids`
- Detail component already had FP display from Story 1.4 — no changes needed
- List component uses computed `rows` to flatten nested FP names (same pattern as Action Models 1.2)

### File List

- `src/app/shared/components/multi-selector/multi-selector.component.ts` — Created (shared component)
- `src/app/shared/components/multi-selector/multi-selector.component.spec.ts` — Created (9 tests)
- `src/app/features/folder-models/folder-model.store.ts` — Modified (added FP cross-domain computed)
- `src/app/features/folder-models/folder-model.facade.ts` — Modified (added FP injection, fpOptions, fpLoading, loadAssociationData)
- `src/app/features/folder-models/folder-model.facade.spec.ts` — Modified (added 2 cross-domain tests)
- `src/app/features/folder-models/ui/folder-model-form.component.ts` — Modified (integrated multi-selector, loadAssociationData)
- `src/app/features/folder-models/ui/folder-model-list.component.ts` — Modified (added FP column with computed rows)
