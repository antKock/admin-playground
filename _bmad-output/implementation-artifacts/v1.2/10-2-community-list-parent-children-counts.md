# Story 10.2: Community List — Parent & Children Count Columns

Status: deferred

> **Deferred (2026-03-11 party-mode review):** `CommunityRead` has no `parents_count` or `children_count` fields. Showing "—" in two columns provides zero user value. Deferred until the API adds count fields to the list response. API gap documented in `_bmad-output/api-observations.md`.

## Story

As an admin,
I want to see how many parents and children each community has in the list table,
so that I can identify hierarchical relationships at a glance.

## Acceptance Criteria

1. **Given** the communities list page **When** the table renders **Then** two additional columns are displayed: "Parents" and "Enfants" showing numeric counts
2. **Given** a community with 3 parents and 0 children **When** the row renders **Then** the "Parents" column shows "3" and the "Enfants" column shows "0"
3. **Given** a community whose counts cannot be determined from the list model **When** the table renders **Then** the columns show "—" as a fallback

## Tasks / Subtasks

- [ ] Task 1: Investigate CommunityRead fields for count availability (AC: #1, #3)
  - [ ] Check `CommunityRead` in `api-types.ts` for `parents_count`, `children_count`, `parent_ids`, or similar fields
  - [ ] If counts/IDs are NOT on the list model: document in Dev Notes and implement the pragmatic fallback approach (see Dev Notes below)
  - [ ] If counts/IDs ARE available: use them directly

- [ ] Task 2: Add parent/children count columns to community list (AC: #1, #2, #3)
  - [ ] Add two `ColumnDef` entries to the `columns` array in `community-list.component.ts`
  - [ ] Column definitions: `{ key: 'parents_count', label: 'Parents', width: '100px' }` and `{ key: 'children_count', label: 'Enfants', width: '100px' }`
  - [ ] If using computed rows (like indicator-model-list), map items to include `parents_count` and `children_count`

- [ ] Task 3: Add API functions to load counts per community (AC: #1, #2) — ONLY IF counts not on list model
  - [ ] Option A (preferred): If the list model gets `parent_ids`/`children` fields in a future API update, use `.length`
  - [ ] Option B (pragmatic): Load counts via `GET /communities/{id}/parents` and `GET /communities/{id}/children` per row (expensive — consider lazy loading or capping)
  - [ ] Option C (recommended fallback): Show "—" for now and add a code comment explaining the API gap. Document in `_bmad-output/api-observations.md`

- [ ] Task 4: Tests (AC: #1, #2, #3)
  - [ ] Test that list component defines Parents and Enfants columns
  - [ ] Test rows display count values when available
  - [ ] Test rows display "—" when counts are unavailable
  - [ ] Run `npx ng test --no-watch` — verify zero regressions

## Dev Notes

### Project Structure Notes

**Files to modify:**
- `src/app/features/communities/ui/community-list.component.ts` — add columns and computed rows

**Possibly modify (depending on approach):**
- `src/app/domains/communities/community.api.ts` — if loading counts per row
- `src/app/features/communities/community.facade.ts` — if exposing count data
- `_bmad-output/api-observations.md` — if documenting API gap

### CommunityRead Schema Analysis (CRITICAL)

The current `CommunityRead` schema (from `api-types.ts` lines 2499-2537) has these fields:

```typescript
CommunityRead: {
  siret: string;
  name: string;
  public_comment?: string | null;
  internal_comment?: string | null;
  id: string;
  unique_id?: string | null;
  created_at: string;
  updated_at: string;
}
```

**There are NO `parent_ids`, `parents_count`, `children_count`, or `children` fields on `CommunityRead`.**

The parent/children data is only available via dedicated endpoints:
- `GET /communities/{id}/parents` → `CommunityRead[]`
- `GET /communities/{id}/children` → `CommunityRead[]`

### Recommended Approach: Show "—" with API Gap Documentation

Loading parents and children for every row in the list would require N*2 API calls (one parents + one children call per community). This is prohibitively expensive for a list that could have hundreds of rows.

**Recommended approach:**
1. Add the columns to the table with "—" as the default value
2. Document the API gap in `_bmad-output/api-observations.md`: suggest adding `parents_count` and `children_count` to `CommunityRead`
3. Add a code comment in the list component explaining why "—" is shown
4. Once the API team adds count fields to `CommunityRead`, update the mapping to use them

**Alternative pragmatic approach (if "—" is unacceptable):**
- Load counts lazily as rows become visible (intersection observer)
- Cache results in the domain store
- This adds significant complexity — only do if explicitly requested

### Column Definitions

```typescript
readonly columns: ColumnDef[] = [
  { key: 'name', label: 'Nom', sortable: true, bold: true, width: '250px' },
  { key: 'siret', label: 'SIRET', width: '140px' },
  { key: 'parents_count', label: 'Parents', width: '100px' },
  { key: 'children_count', label: 'Enfants', width: '100px' },
  { key: 'public_comment', label: 'Commentaire public' },
  { key: 'updated_at', label: 'Mis à jour le', sortable: true, type: 'date', width: '175px' },
];
```

### Computed Rows Pattern (from indicator-model-list.component.ts)

If counts are unavailable, use a computed `rows` signal that maps items:

```typescript
readonly rows = computed(() =>
  this.facade.items().map((item) => ({
    ...item,
    parents_count: '—',
    children_count: '—',
  })),
);
```

Then bind `[data]="rows()"` instead of `[data]="facade.items()"` in the template.

### Anti-Patterns to Avoid

- Do NOT fire N*2 API calls to load parents/children for every row in the list — this does not scale
- Do NOT block list rendering waiting for count data — show "—" and load asynchronously if implementing lazy loading
- Do NOT add `parents`/`children` arrays to `CommunityRead` domain model if they don't exist on the API schema — keep models aligned with the API
- Do NOT change the DataTable's `[data]` binding from `facade.items()` to `rows()` without also updating `(rowClick)` handler to ensure `$event.id` still works

### References

- [Source: src/app/core/api/generated/api-types.ts lines 2499-2537 — CommunityRead schema (no count fields)]
- [Source: src/app/features/communities/ui/community-list.component.ts — existing list component with columns]
- [Source: src/app/features/indicator-models/ui/indicator-model-list.component.ts — computed rows pattern with mapped display fields]
- [Source: _bmad-output/planning-artifacts/v1.2/epics.md — Epic 10 Story 10.2]

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
