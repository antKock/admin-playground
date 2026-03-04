# Story 3.3: Indicator Model Status Workflow & Usage Visibility

Status: ready-for-dev

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

## Tasks / Subtasks

- [ ] Task 1: Usage visibility — API integration (AC: #1)
  - [ ] Add API loader function: fetch action models that include this indicator model
  - [ ] Approach A: Use `GET /action-models/` and filter client-side by checking `indicator_models` array
  - [ ] Approach B: If API supports it, use a query param or dedicated endpoint
  - [ ] Add usage count state to domain store or derive in feature store
- [ ] Task 2: Usage visibility — UI (AC: #1, #2)
  - [ ] Add "Used in N models" section to `indicator-model-detail.component.ts`
  - [ ] Display list of Action Model names as clickable links to `/action-models/:id`
  - [ ] Show count badge: "Used in 3 models" or "Not used in any model"
  - [ ] Load usage data when detail page loads (via facade)
- [ ] Task 3: Document API gaps (AC: #3)
  - [ ] Append to `_bmad-output/api-observations.md`:
    - Missing: `status` field on IndicatorModelRead (no draft/published/disabled lifecycle)
    - Missing: Status transition endpoints (POST /indicator-models/{id}/publish, etc.)
    - Missing: `next_possible_statuses` field for transition validation
    - Impact: Cannot implement FR13 (status transitions), FR15 (invalid transition blocking), FR16 (StatusBadge)
    - Suggestion: Add `status` enum field + transition endpoints to Indicator Model API
- [ ] Task 4: Architecture readiness (AC: #4)
  - [ ] Ensure StatusBadge component can render indicator model statuses when API supports them
  - [ ] Leave placeholder comments in domain store for future status mutation methods

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

### Debug Log References

### Completion Notes List

### File List
