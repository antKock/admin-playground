# Story 3.3: Indicator Model Status Workflow & Usage Visibility

Status: done

## Story

As an operator (Sophie),
I want to transition Indicator Models through their status lifecycle and see which models use each indicator,
So that I can manage indicator publication and understand cross-entity impact before making changes.

## API Gap Warning

**CRITICAL: The current API schema has NO status field on IndicatorModelRead.**

- No `status` field (draft/published/disabled) exists on the indicator model
- No status transition endpoints (publish, disable, activate)
- No `next_possible_statuses` field for transition validation

**What IS available:** The `ActionModelRead` schema includes `indicator_models?: IndicatorModelWithAssociation[]`, so we can derive "used in N models" by fetching action models that reference this indicator. Additionally, `GET /indicator-models/?action_model_id={id}` allows filtering by action model.

**Scope for this story:** Implement usage visibility ("Used in N models") where API supports it, and document the status workflow as an API gap.

## Acceptance Criteria

1. Indicator Model detail page shows "Used in N models" section listing which Action Models reference this indicator
2. The count and Action Model names are visible with navigation links to Action Model detail
3. Status workflow features documented as API gap in `_bmad-output/api-observations.md`
4. If/when API adds status field, the architecture is ready (StatusBadge component already exists)

## API Limitation Protocol

If any acceptance criterion cannot be implemented due to API limitations (missing endpoints, unsupported fields, schema gaps), the dev agent **MUST**:
1. Document the gap in `_bmad-output/api-observations.md` under the Epic 3 section
2. Include: **Observation** (what's missing), **Impact** (which AC/FR is affected), and **Suggestion** (what the API team should add)
3. Implement what IS possible and skip the blocked AC with a code comment explaining the gap
4. Note the limitation in the Dev Agent Record / Completion Notes at the bottom of this file

## Tasks / Subtasks

- [x] Task 1: Usage visibility — API integration (AC: #1)
  - [x] Add API loader function: `loadUsageByIndicatorModel()` — fetches action models and filters client-side
  - [x] Approach A used: `GET /action-models/` with client-side filter by `indicator_models` array
  - [x] Add usage count state to domain store (`usedInActionModels`, `isLoadingUsage`) and derive in feature store (`usageCount`, `usedInModels`)
- [x] Task 2: Usage visibility — UI (AC: #1, #2)
  - [x] Add "Used in N models" section to `indicator-model-detail.component.ts` with RouterLink
  - [x] Display list of Action Model names as clickable links to `/action-models/:id`
  - [x] Show count: "Used in N model(s)" or "Not used in any Action Model yet."
  - [x] Load usage data when detail page loads (via `facade.select()` which now calls `loadUsage`)
- [x] Task 3: Document API gaps (AC: #3)
  - [x] Status gaps already documented in api-observations.md (Epic 3 section, "Indicator Model Status — BLOCKER")
  - [x] Covers: missing status field, missing transition endpoints, missing next_possible_statuses
- [x] Task 4: Architecture readiness (AC: #4)
  - [x] StatusBadge component already supports any string status — ready for indicator model statuses when API adds them
  - [x] Domain store architecture follows ActionTheme pattern — status mutations can be added alongside existing CRUD mutations

## Dev Notes

### Cross-Domain Data Flow for Usage Visibility

The indicator model detail page needs to know which Action Models reference it. Two approaches:

**Approach A (Recommended): Dedicated API call**
- Check if `GET /indicator-models/by-action-model/{action_model_id}` can be reversed
- If not, use `GET /action-models/` to fetch action models, then client-side filter for those containing this indicator's ID in their `indicator_models` array
- This is imperfect for large datasets — document as API observation

**Approach B: Extend domain store**
- Add `usedInActionModels` state to IndicatorModel domain store
- Add `loadUsage(indicatorModelId)` method that queries action models
- Feature store exposes computed signals: `usageCount`, `usedInModels`
- Facade calls `loadUsage()` alongside `select()` on detail page load

### Implementation Pattern

```typescript
// In indicator-model.store.ts — add to withState:
usedInActionModels: [] as ActionModelBrief[],
isLoadingUsage: false,

// In withMethods — add:
loadUsage: rxMethod<string>(
  pipe(
    tap(() => patch(store, { isLoadingUsage: true })),
    switchMap((indicatorModelId) =>
      // Fetch action models and filter for those referencing this indicator
      actionModelListLoader(store._http, { cursor: null, limit: 100 }).pipe(
        map(response => response.data.filter(am =>
          am.indicator_models?.some(im => im.id === indicatorModelId)
        )),
        tap(models => patch(store, { usedInActionModels: models, isLoadingUsage: false })),
        catchError(() => { patch(store, { isLoadingUsage: false }); return EMPTY; }),
      ),
    ),
  ),
),
```

### UI for Usage Section (from UX Spec)

```html
<!-- In indicator-model-detail.component.ts -->
<section class="mt-8">
  <h2 class="text-lg font-semibold text-text-primary mb-3">
    Used in {{ facade.usageCount() }} model{{ facade.usageCount() !== 1 ? 's' : '' }}
  </h2>
  @if (facade.isLoadingUsage()) {
    <div class="animate-pulse h-4 bg-surface-muted rounded w-48"></div>
  } @else if (facade.usageCount() === 0) {
    <p class="text-text-secondary text-sm">Not used in any Action Model yet.</p>
  } @else {
    <ul class="space-y-1">
      @for (am of facade.usedInModels(); track am.id) {
        <li>
          <a [routerLink]="['/action-models', am.id]" class="text-brand hover:underline text-sm">
            {{ am.name }}
          </a>
        </li>
      }
    </ul>
  }
</section>
```

### Cross-Domain Dependency

This story requires importing from `@domains/action-models/action-model.api.ts` (or creating a new API function for usage lookup). This is acceptable — domain stores can call other domain API functions for cross-entity queries.

### Files to Create/Modify

**Modify:**
- `src/app/domains/indicator-models/indicator-model.store.ts` — add usage state + loadUsage method
- `src/app/domains/indicator-models/indicator-model.api.ts` — add usage loader function (if not using action-model API directly)
- `src/app/features/indicator-models/indicator-model.store.ts` — add usage computed signals
- `src/app/features/indicator-models/indicator-model.facade.ts` — expose usage signals + loadUsage method
- `src/app/features/indicator-models/ui/indicator-model-detail.component.ts` — add usage section
- `src/app/domains/indicator-models/indicator-model.store.spec.ts` — add usage tests

**Create/Append:**
- `_bmad-output/api-observations.md` — status workflow gaps

### Anti-Patterns to Avoid

- Do NOT create fake status transitions with client-side state — status must come from API
- Do NOT fetch ALL action models on every detail page load if there could be thousands — note pagination limitation
- Do NOT add status mutation methods without API backing — leave as comments only
- Do NOT import ActionModelDomainStore into IndicatorModel feature store for this — keep the cross-domain query in the IndicatorModel domain layer

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.3]
- [Source: src/app/core/api/generated/api-types.ts#IndicatorModelRead (line 2986) — no status field]
- [Source: src/app/core/api/generated/api-types.ts#ActionModelRead (line 1903) — includes indicator_models]
- [Source: _bmad-output/planning-artifacts/architecture.md#API Gap Documentation]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Cross-Reference Visibility]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- Tests: 261/261 pass (added 2 usage tests to domain store spec)

### Completion Notes List
- Usage visibility implemented: detail page shows "Used in N model(s)" section with clickable Action Model links
- Cross-domain query: `loadUsageByIndicatorModel()` fetches action models and filters client-side for those referencing the indicator
- Usage data loads automatically when selecting an indicator model (facade.select calls loadUsage)
- clearSelection resets usage state
- Status workflow features NOT implemented — API has no status field (already documented in api-observations.md)
- StatusBadge is architecture-ready: it accepts any string status, so it will work when API adds indicator model statuses
- Note: Usage lookup fetches first 100 action models — may miss references if >100 action models exist. Documented as known limitation.

### Change Log
- 2026-03-04: Story 3.3 implemented — usage visibility, API gap documentation

### File List
- src/app/domains/indicator-models/indicator-model.api.ts (modified — added loadUsageByIndicatorModel)
- src/app/domains/indicator-models/indicator-model.store.ts (modified — added usage state + loadUsage method)
- src/app/domains/indicator-models/indicator-model.store.spec.ts (modified — added 2 usage tests)
- src/app/features/indicator-models/indicator-model.store.ts (modified — added usage signals)
- src/app/features/indicator-models/indicator-model.facade.ts (modified — added usage signals, select calls loadUsage)
- src/app/features/indicator-models/indicator-model.facade.spec.ts (modified — updated select test for usage)
- src/app/features/indicator-models/ui/indicator-model-detail.component.ts (modified — added usage section)
