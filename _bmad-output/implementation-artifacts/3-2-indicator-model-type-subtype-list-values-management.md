# Story 3.2: Indicator Model Type, Subtype & List Values Management

Status: done

## Story

As an operator (Sophie),
I want to configure the type and subtype of an Indicator Model and manage list values for list-type indicators,
So that each indicator's data structure is correctly defined before it is used in models.

## API Gap Warning

**CRITICAL: The current API schema does NOT support subtype or list values.**

The API (`IndicatorModelRead`, `IndicatorModelCreate`, `IndicatorModelUpdate`) only has:
- `type: "text" | "number"` — a simple enum, no subtype field
- No `subtype` field exists
- No list values management endpoints or fields exist
- No `status` field exists, so "type change blocked on published" cannot be enforced

**Scope for this story:** Implement what the API supports (type selection on create/edit) and document remaining gaps in `_bmad-output/api-observations.md`.

## Acceptance Criteria

1. Type selector on create/edit form displays "text" and "number" options (FR25)
2. Type selection is required — form invalid without it
3. Type displayed as a badge in list view and detail view
4. Unit field contextually relevant (more common with "number" type but available for both)
5. API observations documented for missing subtype and list values features

## API Limitation Protocol

If any acceptance criterion cannot be implemented due to API limitations (missing endpoints, unsupported fields, schema gaps), the dev agent **MUST**:
1. Document the gap in `_bmad-output/api-observations.md` under the Epic 3 section
2. Include: **Observation** (what's missing), **Impact** (which AC/FR is affected), and **Suggestion** (what the API team should add)
3. Implement what IS possible and skip the blocked AC with a code comment explaining the gap
4. Note the limitation in the Dev Agent Record / Completion Notes at the bottom of this file

## Tasks / Subtasks

- [x] Task 1: Enhance form with type selector (AC: #1, #2)
  - [x] Update `indicator-model.form.ts` — add type field as required FormControl with validator (done in Story 3.1)
  - [x] Update `indicator-model-form.component.ts` — add `<select>` for type with "text"/"number" options (done in Story 3.1)
  - [x] Ensure type field patches correctly in edit mode (done in Story 3.1)
- [x] Task 2: Type display in list and detail (AC: #3)
  - [x] Update `indicator-model-list.component.ts` — add type column with StatusBadge via DataTable `type: 'status-badge'`
  - [x] Update `indicator-model-detail.component.ts` — show type in MetadataGrid (done in Story 3.1)
- [x] Task 3: Unit field context (AC: #4)
  - [x] Ensure unit field is available on form for both types (done in Story 3.1)
  - [x] Display unit in detail view alongside type (done in Story 3.1)
- [x] Task 4: Document API gaps (AC: #5)
  - [x] Append to `_bmad-output/api-observations.md`:
    - Missing: `subtype` field on IndicatorModel (FR25 partial)
    - Missing: List values management endpoints and fields (FR26)
    - Missing: `status` field to enforce type-change constraints on published models (FR27)
    - Missing: Type-change constraint enforcement ("Type cannot be changed once instances exist")

## Dev Notes

### What the API Supports vs. What Epics Describe

| Feature | Epic Requirement | API Reality | Action |
|---------|-----------------|-------------|--------|
| Type selector | FR25 | `type: "text" \| "number"` | Implement |
| Subtype selector | FR25 | No subtype field | Document gap |
| List values CRUD | FR26 | No list values endpoints/fields | Document gap |
| Type-change block on published | FR27 | No status field on IndicatorModel | Document gap |
| Subtype change on draft | FR25 | No subtype field | Document gap |

### Implementation Approach

This story enhances the CRUD created in Story 3.1 by ensuring the **type** field is properly handled in the form, list, and detail views. Since the API only supports "text" | "number", the implementation is focused on:

1. **Form:** Required `<select>` dropdown for type with two options
2. **List:** Type column rendered as a purple badge (matching UX spec for type badges)
3. **Detail:** Type shown prominently in MetadataGrid

### Type Badge Styling (from UX Spec)

```
Type "text": purple badge with text icon
Type "number": purple badge with hash icon
Badge class: bg-brand-secondary text-brand-primary text-xs px-2 py-0.5 rounded-full
```

### Form Field Order

Per UX spec (single-column, API payload order):
1. Name * (text input)
2. Technical Label * (text input)
3. Type * (select dropdown: text | number)
4. Unit (text input)
5. Description (textarea)

### Files to Modify

- `src/app/domains/indicator-models/forms/indicator-model.form.ts` — ensure type field with required validator
- `src/app/features/indicator-models/ui/indicator-model-form.component.ts` — type selector UI
- `src/app/features/indicator-models/ui/indicator-model-list.component.ts` — type badge column
- `src/app/features/indicator-models/ui/indicator-model-detail.component.ts` — type in metadata
- Create/append: `_bmad-output/api-observations.md` — gap documentation

### Anti-Patterns to Avoid

- Do NOT implement subtype or list values UI with no API backing — document as gap only
- Do NOT add a fake `status` field to enable type-change blocking — wait for API support
- Do NOT over-engineer the type selector for future types — use the exact enum from the API

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.2]
- [Source: src/app/core/api/generated/api-types.ts#IndicatorModelType (line 3017)]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Type Badge Styling]
- [Source: _bmad-output/planning-artifacts/architecture.md#API Gap Documentation]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- Tests: 259/259 pass, 0 regressions

### Completion Notes List
- Form field order reordered to match UX spec: Name, Technical Label, Type, Unit, Description
- Type column in list view now uses DataTable's `type: 'status-badge'` for badge rendering
- Type display in detail view was already implemented in Story 3.1
- Unit field available on form for both types (no conditional visibility needed per story)
- API gaps documented in api-observations.md: subtype field, list values, type-change constraints
- Most of Story 3.2's functional requirements were already satisfied by Story 3.1's implementation

### Change Log
- 2026-03-04: Story 3.2 implemented — type badge in list, form reorder, API gap docs

### File List
- src/app/features/indicator-models/ui/indicator-model-form.component.ts (modified — field reorder)
- src/app/features/indicator-models/ui/indicator-model-list.component.ts (modified — type badge column)
- _bmad-output/api-observations.md (modified — added 3 new gap entries)
