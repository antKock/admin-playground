# Known Limitations & Recommendations

Documented during v2 implementation (Epic 15–17). Each entry includes what, why, and recommended resolution.

## Frontend Limitations

### Double API call for filter dropdowns

**Category:** Frontend / Backend dependency
**Severity:** Medium — UX works but wastes bandwidth

**What:** List components make two API calls on init: one paginated call for table data, and one `loadAll()` call to populate filter dropdown options (e.g., community names for the agent list filter).

**Why:** The backend does not expose a dedicated `/options` or `/filters` endpoint. The only way to get all possible filter values is to fetch all records via the paginated endpoint.

**Current workaround:** Facades call `loadAll()` on cross-domain stores (e.g., `communityDomainStore.loadAll(undefined)`) to populate dropdown options. This fetches every record for the filter source.

**Affected:** All 10 list components that use filterable columns.

**Recommended resolution:** Backend should provide lightweight `/options` or `/filters` endpoints per resource that return `{ id, label }[]` without full record data.

---

### No request deduplication or cancellation

**Category:** Frontend architectural trade-off
**Severity:** Low — rarely causes visible issues

**What:** If a user navigates rapidly between list views, multiple `load()` calls can overlap. While `switchMap` cancels the HTTP request, the store state may briefly flicker.

**Why:** Not implemented in v2 scope. The `rxMethod` + `switchMap` pattern handles most cases, but there's no explicit request deduplication layer.

**Recommended resolution:** For most cases, the current `switchMap` behavior is sufficient. If flicker becomes noticeable, consider adding a debounce on filter changes or a request ID check in the store.

---

### No optimistic updates on mutations

**Category:** Frontend architectural trade-off
**Severity:** Low — acceptable for admin tool

**What:** All mutations (create, update, delete, status transitions) wait for server response before updating the UI. The user sees a loading state until the server confirms.

**Why:** Deliberate choice for an admin tool where data integrity matters more than perceived speed. Optimistic updates add rollback complexity.

**Recommended resolution:** Keep as-is for the admin tool. Only consider optimistic updates for high-frequency user actions if UX feedback indicates latency is a problem.

---

### Domain folder naming inconsistency

**Category:** Frontend code organization
**Severity:** Low — cosmetic, no runtime impact

**What:** Two domain folders use singular names (`src/app/domains/building/`, `src/app/domains/site/`) while all others use plural (`agents/`, `communities/`, `action-models/`, etc.). Feature folders are consistently plural (`features/buildings/`, `features/sites/`).

**Why:** These were likely the first two domains created before the plural convention was established.

**Recommended resolution:** Rename `building/` → `buildings/` and `site/` → `sites/` in a future cleanup story. Update all import paths. Low effort, improves consistency.

---

### Rule parameter defaults use string `'false'` instead of `null`

**Category:** Frontend / Backend dependency
**Severity:** Low — handled by workaround

**What:** The backend expects rule parameters (`hidden_rule`, `required_rule`, etc.) to be the string `'false'` rather than `null` for their default "off" state. The frontend has a `ruleForApi()` conversion function to map `null → 'false'`.

**Why:** Backend API design uses string defaults for JSON rule fields.

**Current workaround:** `ruleForApi()` in `action-model.facade.ts` converts `null` to the backend's expected default.

**Recommended resolution:** Backend should migrate to accept `null` as the default. Frontend `ruleForApi()` function and the `TODO` comment in the facade can then be removed.

---

### FormFieldComponent uses ViewEncapsulation.None

**Category:** Frontend architectural trade-off
**Severity:** Low — scoped by class name

**What:** `FormFieldComponent` uses `ViewEncapsulation.None` to style projected `<input>`, `<select>`, and `<textarea>` elements with error borders. This means its CSS rules are global.

**Why:** Angular's `::ng-deep` was deprecated. `ViewEncapsulation.None` was chosen as the replacement. The `.border-error-wrapper` class name is specific enough to avoid collisions.

**Recommended resolution:** Monitor for style leaks. If collisions occur, consider a more specific class name prefix or CSS custom properties approach.

---

### History/activity feed has no pagination limit strategy

**Category:** Frontend performance concern
**Severity:** Low — not yet a problem at current scale

**What:** The activity feed loads history entries without a cap on total loaded items. At scale (thousands of activity entries), this could cause memory pressure.

**Why:** Current data volumes are small enough that this isn't an issue.

**Recommended resolution:** Add virtual scrolling or a hard cap on loaded items if the dataset grows significantly.

## Backend Dependencies

These items require backend changes and are outside the frontend scope:

| Item | Description | Priority |
|------|-------------|----------|
| Filter/options endpoints | Dedicated lightweight endpoints for dropdown population | Medium |
| Null rule defaults | Accept `null` instead of `'false'` for rule parameter defaults | Low |
| OpenAPI spec completeness | Some response types may lack full schema definitions | Low |

## Future Recommendations

Improvements deferred from v2 scope:

| Recommendation | Effort | Priority | Rationale |
|----------------|--------|----------|-----------|
| Backend filter endpoints | Backend | Medium | Eliminates double API call on every list page |
| E2E test coverage | Medium | Medium | No E2E tests exist; critical flows (auth, CRUD) should be covered |
| Storybook for shared components | Medium | Low | Would aid component development and visual regression testing |
| Request caching layer | Medium | Low | Could reduce redundant API calls for slowly-changing data |
| Domain folder naming normalization | Small | Low | Rename `building/` → `buildings/`, `site/` → `sites/` |
| FormFieldComponent migration completion | Small | Low | Some form fields still use raw HTML instead of `<app-form-field>` — optional fields without validation |
| Tooltip position recalculation on scroll | Small | Low | Tooltip currently positions once on show; could drift on scroll-heavy pages |
