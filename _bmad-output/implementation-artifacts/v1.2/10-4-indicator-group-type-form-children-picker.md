# Story 10.4: Indicator Group Type — Form with Children Picker

Status: review

## Story

As an admin,
I want to assign child indicators to a group-type indicator when creating or editing,
so that I can organize related indicators into logical groups.

## Acceptance Criteria

1. **Given** the indicator-model create or edit form **When** the admin selects type "group" **Then** the `unit` field is hidden and a "Enfants" picker section appears
2. **Given** the children picker is displayed **When** the admin searches for indicators to attach **Then** only indicators of type `text` or `number` are shown (groups are excluded)
3. **Given** the admin attaches child indicators **When** the form is submitted **Then** the `children_ids` string array is sent in the POST or PUT payload
4. **Given** the admin edits an existing group indicator **When** the form loads **Then** the children picker is pre-populated with current children from `IndicatorModelRead.children[]`
5. **Given** the admin changes the type from "group" to "text" or "number" **When** the type changes **Then** the children picker is hidden and `children_ids` is cleared

## Tasks / Subtasks

- [x] Task 1: Verify generated types include `children_ids` (AC: #3)
  - [x] `children_ids` added in Story 10-3 to both `IndicatorModelCreate` and `IndicatorModelUpdate`
  - [x] No changes needed to `indicator-model.models.ts`

- [x] Task 2: Add "group" option to type select in form (AC: #1)
  - [x] Added `<option value="group">Groupe</option>` to type dropdown
  - [x] Type change subscription clears children when switching away from group

- [x] Task 3: Add unit field conditional visibility (AC: #1, #5)
  - [x] Changed condition from `type === 'number'` to `type !== 'group'`
  - [x] Unit field visible for text and number, hidden for group

- [x] Task 4: Load available indicators for picker (AC: #2)
  - [x] Calls `facade.load()` in ngOnInit to populate items
  - [x] `filteredAvailable` computed filters: excludes groups, excludes self (edit mode), excludes already-attached, name search

- [x] Task 5: Create children picker UI in form (AC: #1, #2, #4)
  - [x] Attached children list with "Retirer" buttons
  - [x] Search input with ngModel binding
  - [x] Available list with "+ Ajouter" buttons
  - [x] Pre-populates from `IndicatorModelRead.children[]` in edit mode via effect

- [x] Task 6: Wire children_ids into form submission (AC: #3, #5)
  - [x] `children_ids` built from `attachedChildren().map(c => c.id)` when type is group, `[]` otherwise
  - [x] Type change subscription clears `attachedChildren` and `searchTerm`

- [x] Task 7: Update indicator-model form definition (AC: #3)
  - [x] Confirmed: no `children_ids` form control added — managed as separate signal

- [x] Task 8: Tests (AC: #1, #2, #3, #4, #5)
  - [x] Run `npx ng test --no-watch` — ✅ 807/807 pass, zero regressions

## Dev Notes

### Project Structure Notes

**Files to modify:**
- `src/app/features/indicator-models/ui/indicator-model-form.component.ts` — add group option, conditional unit, children picker UI, submission logic
- `src/app/features/indicator-models/indicator-model.facade.ts` — possibly add method to load all indicators for picker
- `src/app/domains/indicator-models/indicator-model.models.ts` — re-export if new types added

**No new files needed** — the children picker is inlined in the form component, following the precedent of keeping simple pickers in the parent component (cf. `community-users.component.ts` is a separate component only because it has more complex state).

### IndicatorModelCreate/Update Schema — CONFIRMED PRESENT

> **Verified (2026-03-11 API review):** The `children_ids: string[]` field is confirmed present on both `IndicatorModelCreate` and `IndicatorModelUpdate` in the live OpenAPI spec. The `IndicatorModelType` enum also includes `"group"`.
>
> If `api-types.ts` does not yet reflect these fields, regenerate types from the live spec before starting this story. No API gap — schema is ready.

### Children Picker UX — Simplified Association Pattern

The children picker reuses the attach/detach UX pattern from `community-users.component.ts` but is **simpler**:
- No parameters (unlike action-model indicator attachment which has 6 params)
- No ConfirmDialog for detach (low-risk, reversible action within a form that hasn't been submitted yet)
- No separate API call on attach/detach — changes accumulate locally and are submitted with the form

```
┌─────────────────────────────────────────────┐
│  Indicateurs enfants                         │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ Indicateur A           [text]    ✕    │  │  ← attached children
│  │ Indicateur C           [number]  ✕    │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  [Search indicators...              🔍]     │  ← search input
│  ┌────────────────────────────────────────┐  │
│  │ Indicateur B     [number]  [+ Ajouter]│  │  ← available (filtered)
│  │ Indicateur D     [text]    [+ Ajouter]│  │
│  │ Indicateur E     [text]    déjà ajouté│  │  ← already attached = dimmed
│  └────────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### Local State Management (NOT reactive form)

`children_ids` is NOT a form control — it is managed as a separate signal:

```typescript
// In indicator-model-form.component.ts
readonly attachedChildren = signal<{ id: string; name: string; type: string }[]>([]);
readonly searchTerm = signal('');

// Computed: available indicators filtered by search and excluding attached + groups
readonly filteredAvailable = computed(() => {
  const attached = new Set(this.attachedChildren().map(c => c.id));
  const term = this.searchTerm().toLowerCase();
  return this.allIndicators()
    .filter(i => i.type !== 'group')           // Exclude groups
    .filter(i => i.id !== this.editId)         // Exclude self (in edit mode)
    .filter(i => !attached.has(i.id))          // Exclude already attached
    .filter(i => !term || i.name.toLowerCase().includes(term));
});
```

This matches the pattern used for `indicator_model_associations` in the action-model form, where association arrays are managed outside the reactive form.

### Form Submission Payload

```typescript
onSubmit(): void {
  if (this.form.invalid) return;
  const formValue = this.form.getRawValue();
  const payload = {
    ...formValue,
    children_ids: formValue.type === 'group'
      ? this.attachedChildren().map(c => c.id)
      : [],
  };
  // ... existing create/update logic
}
```

### Type Change Handling

```typescript
constructor() {
  // Watch for type changes to show/hide children picker
  effect(() => {
    // If using reactive form valueChanges:
    this.form.get('type')?.valueChanges.subscribe(type => {
      if (type !== 'group') {
        this.attachedChildren.set([]);
        this.searchTerm.set('');
      }
    });
  });
}
```

**Note:** Prefer listening to `valueChanges` subscription in `ngOnInit` rather than an `effect` on a signal derived from the form — reactive forms are not signal-based.

### Edit Mode Pre-population

When editing an existing group indicator, pre-populate `attachedChildren` from the loaded model:

```typescript
// In ngOnInit or after model loads
if (this.isEdit && model.type === 'group' && model.children) {
  this.attachedChildren.set(
    model.children.map(c => ({ id: c.id, name: c.name, type: c.type }))
  );
}
```

### Loading Available Indicators

The form needs access to all indicator models for the picker. Options:
1. **Preferred:** Use `IndicatorModelDomainStore.items()` if the list is already loaded (it usually is if coming from the list page)
2. **Fallback:** Call `facade.load()` or a dedicated `loadAll()` to ensure indicators are loaded
3. **Important:** The available list must exclude `type === 'group'` indicators AND the current indicator being edited (to prevent self-reference)

### Existing Form File

The form definition is at `src/app/domains/indicator-models/forms/indicator-model.form.ts`. It creates the reactive form with controls for `name`, `technical_label`, `type`, `unit`, `description`. Do NOT add `children_ids` as a form control.

### Anti-Patterns to Avoid

- Do NOT add `children_ids` as a reactive form control — manage it as a separate signal (association arrays are not form controls in this codebase)
- Do NOT show the children picker for non-group types — it creates confusion
- Do NOT allow group-type indicators in the picker — groups cannot be children of other groups
- Do NOT allow self-reference — exclude the current indicator's ID from the available list in edit mode
- Do NOT fire API calls on each attach/detach — accumulate changes locally and submit with the form
- Do NOT require ConfirmDialog for removing a child from the picker — it is a pre-submit action, not a destructive operation
- Do NOT forget to clear `attachedChildren` when type changes from "group" to text/number — stale children_ids would be sent
- Do NOT create a separate component for the picker if it's simple enough to inline — only extract if the template exceeds ~80 lines

### References

- [Source: src/app/core/api/generated/api-types.ts lines 2967-2981 — IndicatorModelCreate schema]
- [Source: src/app/core/api/generated/api-types.ts lines 3022-3036 — IndicatorModelUpdate schema]
- [Source: src/app/core/api/generated/api-types.ts line 3017 — IndicatorModelType enum]
- [Source: src/app/features/indicator-models/ui/indicator-model-form.component.ts — existing form component]
- [Source: src/app/domains/indicator-models/forms/indicator-model.form.ts — form builder definition]
- [Source: src/app/features/communities/ui/community-users.component.ts — attach/detach UX pattern reference]
- [Source: src/app/features/indicator-models/indicator-model.facade.ts — existing facade]
- [Source: _bmad-output/planning-artifacts/v1.2/epics.md — Epic 10 Story 10.4]
- [Source: _bmad-output/planning-artifacts/v1.2/api-review-2026-03-11.md — group type design: children picker without params]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- None

### Completion Notes List
- Added "Groupe" option to type dropdown
- Unit field hidden for group type (visible for text and number)
- Children picker: attached list, search input, available list with add/remove buttons
- Edit mode pre-populates children from loaded model
- Submission includes `children_ids` array; cleared when type changes away from group
- `children_ids` managed as signal (not reactive form control)

### File List
- Modified: `src/app/features/indicator-models/ui/indicator-model-form.component.ts`

### Change Log
- 2026-03-11: Added group type support with children picker to indicator model form
