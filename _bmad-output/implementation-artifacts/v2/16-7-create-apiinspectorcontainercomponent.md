# Story 16.7: Create ApiInspectorContainerComponent

Status: ready-for-dev

## Story

As a developer,
I want a container component that automatically includes the API Inspector,
so that feature components don't manually add `<app-api-inspector>` in every template.

## Acceptance Criteria

1. A reusable `ApiInspectorContainerComponent` exists at `src/app/shared/components/api-inspector/api-inspector-container.component.ts` with content projection and auto-rendered inspector
2. The optimal application strategy is determined (page-level layout vs per-component wrapping)
3. All feature components that currently include `<app-api-inspector>` are refactored to use the container or layout-level approach

## Tasks / Subtasks

- [ ] Task 1: Determine best application strategy (AC: #2)
  - [ ] 1.1 Audit which components currently include `<app-api-inspector>`:
    - All 10 detail components (agent-detail, building-detail, community-detail, folder-model-detail, action-theme-detail, action-model-detail, indicator-model-detail, user-detail, funding-program-detail, site-detail)
    - Likely also list and form components
  - [ ] 1.2 Evaluate option A: **Layout-level** — add `<app-api-inspector>` once in `AppLayoutComponent` (`src/app/core/layout/app-layout.component.ts`), remove from all feature components
  - [ ] 1.3 Evaluate option B: **Container component** — create `ApiInspectorContainerComponent` that wraps content + auto-adds inspector, used per-page
  - [ ] 1.4 **Recommended: Option A** — the API inspector is a global dev tool, not page-specific. Adding it once in the layout eliminates ALL per-component includes. Option B is fallback if some pages should NOT show the inspector.
  - [ ] 1.5 Document decision in this story's completion notes

- [ ] Task 2: Create ApiInspectorContainerComponent (AC: #1)
  - [ ] 2.1 Create `src/app/shared/components/api-inspector/api-inspector-container.component.ts`:
    - Standalone component, `changeDetection: OnPush`
    - Template: `<ng-content></ng-content><app-api-inspector />`
    - Imports: `ApiInspectorComponent`
    - Injects `ApiInspectorService` to ensure it's available
  - [ ] 2.2 Create `src/app/shared/components/api-inspector/api-inspector-container.component.spec.ts`:
    - Test: renders projected content
    - Test: renders `<app-api-inspector>` automatically
    - Test: ApiInspectorService is injected

- [ ] Task 3: Apply chosen strategy — refactor feature components (AC: #3)
  - [ ] 3.1 **If Option A (layout-level)**:
    - Add `<app-api-inspector />` to `src/app/core/layout/app-layout.component.ts` template (after `<router-outlet>`)
    - Import `ApiInspectorComponent` in app-layout's imports
    - Remove `<app-api-inspector />` from ALL feature component templates (detail, list, form)
    - Remove `ApiInspectorComponent` from each feature component's imports array
  - [ ] 3.2 **If Option B (container wrapping)**:
    - Wrap each feature component's template content with `<app-api-inspector-container>`
    - Remove manual `<app-api-inspector />` from templates
    - Replace `ApiInspectorComponent` import with `ApiInspectorContainerComponent` in imports
  - [ ] 3.3 Feature components to update (all that currently import ApiInspectorComponent):
    - `src/app/features/agents/ui/agent-detail.component.ts`
    - `src/app/features/buildings/ui/building-detail.component.ts`
    - `src/app/features/communities/ui/community-detail.component.ts`
    - `src/app/features/folder-models/ui/folder-model-detail.component.ts`
    - `src/app/features/action-themes/ui/action-theme-detail.component.ts`
    - `src/app/features/action-models/ui/action-model-detail.component.ts`
    - `src/app/features/indicator-models/ui/indicator-model-detail.component.ts`
    - `src/app/features/users/ui/user-detail.component.ts`
    - `src/app/features/funding-programs/ui/funding-program-detail.component.ts`
    - `src/app/features/sites/ui/site-detail.component.ts`

- [ ] Task 4: Update affected spec files
  - [ ] 4.1 Update all modified component specs to remove `ApiInspectorComponent` from test imports (if using Option A)
  - [ ] 4.2 Update app-layout spec if it exists

- [ ] Task 5: Run `npx ng build` and `npx ng test --no-watch` (AC: #1, #2, #3)

## Dev Notes

- **Strong recommendation for Option A (layout-level)**: The API inspector is a developer debugging tool that should be available on every page. Putting it in the layout means:
  - Zero per-component boilerplate
  - New feature components automatically get it
  - Single place to enable/disable for production
- **If Option A is chosen**, the `ApiInspectorContainerComponent` (Task 2) still gets created as a utility but may not be used directly. It could serve as documentation or for edge cases where inspector needs to be conditionally shown.
- Current API Inspector files are in `src/app/shared/components/api-inspector/`:
  - `api-inspector.component.ts` + spec
  - `ApiInspectorService` at `src/app/shared/services/` (referenced in interceptor spec paths)
- The API inspector interceptor is at `src/app/core/api/api-inspector.interceptor.ts` — this is unaffected by this story.
- **Login page consideration**: The login page likely uses a different layout (no sidebar). Ensure the inspector is only added in the authenticated layout, not the login layout.

### Project Structure Notes

- **Create**: `src/app/shared/components/api-inspector/api-inspector-container.component.ts`
- **Create**: `src/app/shared/components/api-inspector/api-inspector-container.component.spec.ts`
- **Modify**: `src/app/core/layout/app-layout.component.ts` (if Option A)
- **Modify**: All 10 detail components listed above — remove manual `<app-api-inspector>`
- **Modify**: Any list/form components that also include `<app-api-inspector>`

### References

- [Source: docs/architecture-ACTEE.md]
- [Source: _bmad-output/planning-artifacts/v2/epics.md#Story 16.7]
- [Source: _bmad-output/implementation-artifacts/v2/v2-technical-analysis.md]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
