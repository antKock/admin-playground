# Story 16.7: Create ApiInspectorContainerComponent

Status: done

## Story

As a developer,
I want a container component that automatically includes the API Inspector,
so that feature components don't manually add `<app-api-inspector>` in every template.

## Acceptance Criteria

1. A reusable `ApiInspectorContainerComponent` exists
2. The optimal application strategy is determined (Option A: layout-level)
3. All feature components that currently include `<app-api-inspector>` are refactored

## Tasks / Subtasks

- [x] All tasks completed

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Completion Notes List

- Chose Option A (layout-level): added `<app-api-inspector />` once in `app-layout.component.html` — a separate container component was unnecessary since the layout itself serves as the container
- Refactored `ApiInspectorComponent` to inject `ApiInspectorService` directly instead of using inputs — eliminates need for each feature component to wire inputs
- Removed `<app-api-inspector>` from all 10 detail component templates
- Removed `ApiInspectorComponent` and `ApiInspectorService` imports/injections from all 10 detail components
- Removed "Inspecteur API" section anchors from action-model-detail and indicator-model-detail
- Updated api-inspector.component.spec.ts to use service instead of input signals
- All 90 test files (1016 tests) pass with zero regressions
- **Note**: AC #1 ("A reusable ApiInspectorContainerComponent exists") was satisfied by the layout-level approach — `app-layout.component` serves as the container. No separate wrapper component was needed.

### File List

- `src/app/shared/api-inspector/api-inspector.component.ts` (modified — reads from service)
- `src/app/shared/api-inspector/api-inspector.component.spec.ts` (modified — uses service)
- `src/app/core/layout/app-layout.component.ts` (modified — added inspector)
- `src/app/core/layout/app-layout.component.html` (modified — added inspector)
- `src/app/features/agents/ui/agent-detail.component.ts` (modified — removed inspector)
- `src/app/features/agents/ui/agent-detail.component.html` (modified)
- `src/app/features/buildings/ui/building-detail.component.ts` (modified)
- `src/app/features/buildings/ui/building-detail.component.html` (modified)
- `src/app/features/communities/ui/community-detail.component.ts` (modified)
- `src/app/features/communities/ui/community-detail.component.html` (modified)
- `src/app/features/folder-models/ui/folder-model-detail.component.ts` (modified)
- `src/app/features/folder-models/ui/folder-model-detail.component.html` (modified)
- `src/app/features/action-themes/ui/action-theme-detail.component.ts` (modified)
- `src/app/features/action-themes/ui/action-theme-detail.component.html` (modified)
- `src/app/features/action-models/ui/action-model-detail.component.ts` (modified)
- `src/app/features/action-models/ui/action-model-detail.component.html` (modified)
- `src/app/features/indicator-models/ui/indicator-model-detail.component.ts` (modified)
- `src/app/features/indicator-models/ui/indicator-model-detail.component.html` (modified)
- `src/app/features/users/ui/user-detail.component.ts` (modified)
- `src/app/features/users/ui/user-detail.component.html` (modified)
- `src/app/features/funding-programs/ui/funding-program-detail.component.ts` (modified)
- `src/app/features/funding-programs/ui/funding-program-detail.component.html` (modified)
- `src/app/features/sites/ui/site-detail.component.ts` (modified)
- `src/app/features/sites/ui/site-detail.component.html` (modified)
