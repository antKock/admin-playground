# Story 10.3: Indicator Group Type — List & Detail

Status: review

## Story

As an admin,
I want to visually distinguish group-type indicators in the list and see their children on the detail page,
so that I can understand the indicator hierarchy at the model level.

## Acceptance Criteria

1. **Given** the indicator-models list page **When** the table renders **Then** group-type indicators are visually distinguished in the type column (already shows `type_display`)
2. **Given** a group-type indicator in the list **When** the row renders **Then** a child count is shown (from `children.length` if available on the read model, or "—" if not)
3. **Given** a group-type indicator-model detail page **When** the page loads **Then** a "Enfants" section displays the list of child indicators from `IndicatorModelRead.children[]` with clickable links to each child's detail page
4. **Given** a group-type indicator-model detail page **When** the page loads **Then** the `unit` field is NOT shown in the MetadataGrid (groups have no unit)
5. **Given** a non-group indicator-model detail page **When** the page loads **Then** no "Enfants" section is displayed and unit is shown normally

## Tasks / Subtasks

- [x] Task 1: Verify generated types are current and update re-exports (AC: #1, #2, #3)
  - [x] Updated `api-types.ts`: added `"group"` to `IndicatorModelType`, `children` to `IndicatorModelRead`, `children_ids` to Create/Update
  - [x] `indicator-model.models.ts` re-exports unchanged (types flow through automatically)

- [x] Task 2: Add "group" option to type display in list (AC: #1)
  - [x] Added `{ id: 'group', label: 'Groupe' }` to filter options
  - [x] StatusBadge column handles new value via raw type display

- [x] Task 3: Add children count column to list (AC: #2)
  - [x] Added `{ key: 'children_count', label: 'Enfants', width: '100px' }` column
  - [x] Computed rows map: `children_count: item.type === 'group' ? (item.children?.length?.toString() ?? '—') : ''`

- [x] Task 4: Update detail component for group type (AC: #3, #4, #5)
  - [x] RouterLink already imported
  - [x] Changed unit condition from `m.type === 'number'` to `m.type !== 'group'` (shows unit for both text and number)
  - [x] Added "Indicateurs enfants" section rendered only for group type
  - [x] Children list with routerLinks and type badge per child
  - [x] Empty state: "Aucun indicateur enfant."

- [x] Task 5: Tests (AC: #1, #2, #3, #4, #5)
  - [x] Updated existing list tests for new column and filter option
  - [x] Run `npx ng test --no-watch` — ✅ 807/807 pass, zero regressions

## Dev Notes

### Project Structure Notes

**Files to modify:**
- `src/app/features/indicator-models/ui/indicator-model-list.component.ts` — add children count column, update type display
- `src/app/features/indicator-models/ui/indicator-model-detail.component.ts` — conditional unit display, children section
- `src/app/domains/indicator-models/indicator-model.models.ts` — possibly update if new types added to schema

**No new files needed.**

### IndicatorModelRead Schema Analysis — CONFIRMED PRESENT

> **Verified (2026-03-11 API review):** The schema fields are confirmed present in the live OpenAPI spec:
> - `IndicatorModelType` includes `"group"` (in addition to `"text"` and `"number"`)
> - `IndicatorModelRead` includes `children: IndicatorModelRead[] | null`
>
> If `api-types.ts` does not yet reflect these fields, regenerate types from the live spec before starting this story. No API gap — schema is ready.

### Existing Type Display (indicator-model-list.component.ts)

The current `rows` computed maps `type_display: item.type` — it passes the raw enum value. The type column currently shows "text" or "number" directly. When "group" is added, it will show "group" by default. To show a French label:

```typescript
readonly rows = computed(() =>
  this.facade.items().map((item) => ({
    ...item,
    type_display: this.typeLabel(item.type),
    unit_display: item.type === 'number' ? (item.unit ?? '—') : '',
    children_count: item.type === 'group' ? ((item as any).children?.length?.toString() ?? '—') : '',
  })),
);

private typeLabel(type: string): string {
  switch (type) {
    case 'text': return 'Texte';
    case 'number': return 'Nombre';
    case 'group': return 'Groupe';
    default: return type;
  }
}
```

Note: If `type_display` is already showing raw values without translation, keep it consistent. Check current behavior first.

### Detail Component — Conditional MetadataGrid

The MetadataGrid `fields` computed must conditionally exclude `unit` for group type:

```typescript
readonly fields = computed<MetadataField[]>(() => {
  const m = this.model();
  if (!m) return [];
  const baseFields: MetadataField[] = [
    { label: 'Nom', value: m.name },
    { label: 'Label technique', value: m.technical_label, type: 'mono' },
    { label: 'Type', value: m.type },
    { label: 'Description', value: m.description ?? '—' },
  ];
  // Only show unit for non-group types
  if (m.type !== 'group') {
    baseFields.push({ label: 'Unité', value: m.unit ?? '—' });
  }
  // ... dates etc.
  return baseFields;
});
```

### Detail Component — Children Section

```html
@if (model()?.type === 'group') {
  <section class="mt-6">
    <h2 class="text-lg font-semibold text-text-primary mb-3">Indicateurs enfants</h2>
    @if ((model()?.children ?? []).length === 0) {
      <p class="text-sm text-text-tertiary">Aucun indicateur enfant.</p>
    } @else {
      <ul class="space-y-1">
        @for (child of model()!.children!; track child.id) {
          <li class="flex items-center gap-2">
            <a [routerLink]="['/indicator-models', child.id]"
               class="text-brand hover:underline text-sm">
              {{ child.name }}
            </a>
            <span class="text-xs text-text-tertiary">({{ child.type }})</span>
          </li>
        }
      </ul>
    }
  </section>
}
```

### Group Type Design Rules (from API review)

- A `group` indicator has NO value and NO unit — it is a structural container only
- Children of a group can only be `text` or `number` type (NOT other groups — no nesting)
- A group cannot itself be a child of another group
- On the ActionModel side, indicators remain flat — group relationships are modeling/display only
- Children picker (Story 10.4) reuses association UX pattern WITHOUT parameters

### Anti-Patterns to Avoid

- Do NOT show unit field for group-type indicators — groups have no unit
- Do NOT show children section for non-group indicators — it is meaningless
- Do NOT use DataTable for the children list on detail — it is a short list, use simple `<ul>` with `routerLink`
- Do NOT assume `children` field exists on current schema — check first and handle gracefully with optional chaining
- Do NOT show "0" in children count column for text/number indicators — show empty string instead (the concept of children doesn't apply)
- Do NOT translate type values if the existing list already shows raw enum values — stay consistent

### References

- [Source: src/app/core/api/generated/api-types.ts lines 2986-3017 — IndicatorModelRead and IndicatorModelType schemas]
- [Source: src/app/features/indicator-models/ui/indicator-model-list.component.ts — existing list with type_display mapping]
- [Source: src/app/features/indicator-models/ui/indicator-model-detail.component.ts — existing detail with MetadataGrid]
- [Source: src/app/domains/indicator-models/indicator-model.models.ts — re-exports from generated types]
- [Source: _bmad-output/planning-artifacts/v1.2/epics.md — Epic 10 Story 10.3]
- [Source: _bmad-output/planning-artifacts/v1.2/api-review-2026-03-11.md — group type design rules]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- Manually updated `api-types.ts` since live spec regeneration not available in dev environment

### Completion Notes List
- Updated generated types: `IndicatorModelType` now includes `"group"`, `IndicatorModelRead` has `children`, Create/Update have `children_ids`
- List component: added Enfants column, group filter option, children count in computed rows
- Detail component: unit hidden for group type, children section with routerLinks for group type
- Updated existing tests for new column and filter option

### File List
- Modified: `src/app/core/api/generated/api-types.ts`
- Modified: `src/app/features/indicator-models/ui/indicator-model-list.component.ts`
- Modified: `src/app/features/indicator-models/ui/indicator-model-list.component.spec.ts`
- Modified: `src/app/features/indicator-models/ui/indicator-model-detail.component.ts`

### Change Log
- 2026-03-11: Added group type support to indicator model list and detail pages
