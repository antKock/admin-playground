# Story 1.2: Action Model — Funding Program & Action Theme Association

Status: done

## Story

As an operator (Sophie),
I want to select a Funding Program and Action Theme when creating or editing an Action Model,
So that each Action Model is correctly linked to its parent program and theme.

## Acceptance Criteria

1. Action Model create/edit form renders a Funding Program dropdown populated from the FP domain store
2. Action Model create/edit form renders an Action Theme dropdown populated from the AT domain store
3. Both dropdowns show loading state while FP/AT data is being fetched
4. Both dropdowns show empty state ("No Funding Programs available") when no data exists
5. On edit, the currently associated Funding Program and Action Theme are pre-selected
6. Saving an Action Model persists the `funding_program_id` and `action_theme_id` via the API
7. The Action Model detail view displays the associated Funding Program name and Action Theme name (from nested API response objects)
8. The feature store aggregates data from `ActionModelDomainStore`, `FundingProgramDomainStore`, and `ActionThemeDomainStore` using `withComputed`
9. The facade exposes `fpOptions` and `atOptions` signals for the UI to consume
10. The facade triggers loading of FP and AT data when the form component initializes
11. Feature store remains `withComputed` only — no mutations, no side effects
12. All existing tests pass with zero regressions; new cross-domain tests added

## Tasks / Subtasks

- [x] Task 1: Extend feature store with cross-domain composition (AC: #8, #11)
  - [x] Edit `src/app/features/action-models/action-model.store.ts`
  - [x] Inject `FundingProgramDomainStore` and `ActionThemeDomainStore` alongside `ActionModelDomainStore`
  - [x] Add computed signals:
    - `fpOptions: computed(() => fundingProgramStore.items())` — all FPs for dropdown
    - `atOptions: computed(() => actionThemeStore.items())` — all ATs for dropdown
    - `rows: computed(() => ...)` — enriched list items with FP/AT labels (for list display)
  - [x] Keep all existing signals (items, selectedItem, isLoading, etc.)
- [x] Task 2: Extend facade with cross-domain data loading (AC: #9, #10)
  - [x] Edit `src/app/features/action-models/action-model.facade.ts`
  - [x] Inject `FundingProgramDomainStore` and `ActionThemeDomainStore`
  - [x] Expose: `readonly fpOptions = this.featureStore.fpOptions`
  - [x] Expose: `readonly atOptions = this.featureStore.atOptions`
  - [x] Add `loadAssociationData()`: calls `fpDomainStore.load()` and `atDomainStore.load()` to pre-load dropdown options
  - [x] Expose: `readonly fpLoading` and `readonly atLoading` signals for dropdown loading state
- [x] Task 3: Update form component with FP/AT dropdowns (AC: #1, #2, #3, #4, #5)
  - [x] Edit `src/app/features/action-models/ui/action-model-form.component.ts`
  - [x] Call `facade.loadAssociationData()` in `ngOnInit()`
  - [x] Render Funding Program `<select>` bound to `formControlName="funding_program_id"`:
    - Options from `facade.fpOptions()` → `<option [value]="fp.id">{{ fp.name }}</option>`
    - Loading state: disabled select with "Loading..." placeholder
    - Empty state: "No Funding Programs available"
  - [x] Render Action Theme `<select>` bound to `formControlName="action_theme_id"`:
    - Same pattern as FP dropdown
  - [x] Both selects show validation error when touched and empty
  - [x] Edit mode: `effect()` patches `funding_program_id` and `action_theme_id` from loaded selectedItem
- [x] Task 4: Update detail component with FP/AT display (AC: #7)
  - [x] Edit `src/app/features/action-models/ui/action-model-detail.component.ts`
  - [x] Display Funding Program name from `selectedItem().funding_program.name`
  - [x] Display Action Theme name from `selectedItem().action_theme.name`
  - [x] Both displayed as MetadataGrid fields with text type
  - [x] No separate API call needed — nested objects come with the ActionModelRead response
- [x] Task 5: Update list component with FP/AT columns (AC: #8)
  - [x] Edit `src/app/features/action-models/ui/action-model-list.component.ts`
  - [x] Add columns: `funding_program` (display nested name) and `action_theme` (display nested name)
  - [x] Since `ActionModelRead` includes nested FP/AT objects, use custom column rendering or computed field
  - [x] Optionally add `funding_program_id` filter dropdown
- [x] Task 6: Write cross-domain tests (AC: #12)
  - [x] Update `src/app/features/action-models/action-model.facade.spec.ts`
  - [x] Test: `loadAssociationData()` triggers FP and AT domain store loads
  - [x] Test: `fpOptions` and `atOptions` signals project correctly
  - [x] Test: creating Action Model with FP/AT IDs sends correct payload
  - [x] Provide all 3 domain stores in test setup: `ActionModelDomainStore`, `FundingProgramDomainStore`, `ActionThemeDomainStore`
  - [x] Run `npx vitest run` — zero regressions

## Dev Notes

### Cross-Domain Store Composition Pattern (Epic 0 Retro Action Item)

This story implements cross-domain feature store composition — explicitly called out as a first-class concern in the Epic 0 retro. The feature store aggregates multiple domain stores.

```typescript
// features/action-models/action-model.store.ts
export const ActionModelFeatureStore = signalStore(
  { providedIn: 'root' },
  withComputed(() => {
    const domainStore = inject(ActionModelDomainStore);
    const fpStore = inject(FundingProgramDomainStore);
    const atStore = inject(ActionThemeDomainStore);
    return {
      // Existing signals
      items: computed(() => domainStore.items() as ActionModel[]),
      selectedItem: computed(() => domainStore.selectedItem()),
      isLoading: computed(() => domainStore.isLoading()),
      // ... all other projections from Story 1.1 ...

      // Cross-domain signals
      fpOptions: computed(() => fpStore.items()),
      atOptions: computed(() => atStore.items()),
    };
  }),
);
```

### Facade Association Loading

```typescript
// features/action-models/action-model.facade.ts
private readonly fpDomainStore = inject(FundingProgramDomainStore);
private readonly atDomainStore = inject(ActionThemeDomainStore);

readonly fpOptions = this.featureStore.fpOptions;
readonly atOptions = this.featureStore.atOptions;

loadAssociationData(): void {
  this.fpDomainStore.load();
  this.atDomainStore.load();
}
```

### Detail View — Nested Objects

`ActionModelRead` includes full nested `funding_program: FundingProgramRead` and `action_theme: ActionThemeRead`. The detail component reads directly from these nested objects — no separate API call or cross-domain store lookup needed for display.

### Form Dropdown Pattern

```html
<select formControlName="funding_program_id" ...>
  <option value="" disabled>Select a Funding Program</option>
  @for (fp of facade.fpOptions(); track fp.id) {
    <option [value]="fp.id">{{ fp.name }}</option>
  }
</select>
```

### Multi-Store Test Setup (Epic 0 Retro Action Item)

Cross-domain tests require all 3 domain stores in the test provider:

```typescript
TestBed.configureTestingModule({
  providers: [
    provideHttpClient(),
    provideHttpClientTesting(),
    ActionModelDomainStore,
    FundingProgramDomainStore,
    ActionThemeDomainStore,
    ActionModelFeatureStore,
    ActionModelFacade,
  ],
});
```

### Known Workarounds (from Epic 0 Retro)

Same as Story 1.1 — `as never` casts, `withProps` for injection context, Vitest sync patterns.

### Dependencies

- **Requires Story 1.1 complete** — needs `ActionModelDomainStore`, `ActionModelFeatureStore`, `ActionModelFacade`, all UI components
- **Uses existing FP/AT domain stores** from Epic 0 — no changes needed to those stores

### Anti-Patterns to Avoid

- Do NOT make separate API calls from the form component to load FP/AT data — use facade
- Do NOT put FP/AT loading logic in the feature store — facade orchestrates loading
- Do NOT import FP/AT domain stores in UI components — facade is the single entry point
- Do NOT duplicate FP/AT type definitions — import from `@domains/funding-programs/` and `@domains/action-themes/`

### Project Structure Notes

- This story modifies files created in Story 1.1, not creating new files
- Feature store gets additional computed signals
- Facade gets additional injection + methods
- UI components get dropdown rendering

### References

- [Source: src/app/features/funding-programs/funding-program.store.ts — single-domain feature store pattern]
- [Source: src/app/features/action-themes/action-theme.facade.ts — facade with lifecycle mutations (reference for multi-store injection)]
- [Source: src/app/core/api/generated/api-types.ts:1879-1937 — ActionModelRead with nested FP/AT]
- [Source: _bmad-output/implementation-artifacts/epic-0-retro-2026-03-04.md — cross-domain as first-class concern]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.2]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Fixed: cursor pagination `items()` returns `unknown[]` — need explicit casts to `FundingProgram[]` and `ActionTheme[]` in feature store
- Fixed: `load()` from withCursorPagination requires argument — pass `undefined`

### Completion Notes List

- Feature store extended with fpOptions/atOptions cross-domain computed signals
- Facade extended with FP/AT domain store injection, loadAssociationData(), loading signals
- Form component: FP/AT dropdowns with loading, empty, and populated states; loadAssociationData() called in ngOnInit
- Detail component: already shows FP/AT names from nested objects (done in Story 1.1)
- List component: added FP/AT columns using computed rows with flattened names
- 2 new cross-domain tests added to facade spec
- 20 test files, 143 tests, zero regressions

### Senior Developer Review (AI)

**Reviewer:** Anthony (via adversarial code review workflow)
**Date:** 2026-03-04
**Outcome:** Approved — all fixes applied in Story 1.1 review cascade to shared files

### Change Log

- 2026-03-04: Story 1.2 implemented — cross-domain FP/AT association for Action Models
- 2026-03-04: Code review approved — fixes applied via Story 1.1 shared file updates

### File List

- src/app/features/action-models/action-model.store.ts (modified — added FP/AT imports and computed signals)
- src/app/features/action-models/action-model.facade.ts (modified — added FP/AT domain stores, loadAssociationData, loading signals)
- src/app/features/action-models/action-model.facade.spec.ts (modified — added cross-domain tests)
- src/app/features/action-models/ui/action-model-form.component.ts (modified — FP/AT dropdowns with options, loading, empty states)
- src/app/features/action-models/ui/action-model-list.component.ts (modified — added FP/AT columns with computed rows)
