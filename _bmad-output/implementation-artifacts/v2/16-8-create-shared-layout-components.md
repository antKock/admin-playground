# Story 16.8: Create Shared Layout Components

Status: done

## Story

As a developer,
I want reusable layout components for list, detail, and form pages,
so that I don't duplicate structural patterns across 7+ domains.

## Acceptance Criteria

1. A `ListPageLayoutComponent` exists at `src/app/shared/components/layouts/`
2. A `DetailPageLayoutComponent` exists
3. A `FormPageLayoutComponent` exists
4. At least one existing list component is migrated as proof of concept
5. At least one existing detail component is migrated as proof of concept
6. At least one existing form component is migrated as proof of concept
7. `npx ng build` and `npx ng test --no-watch` both pass

## Tasks / Subtasks

- [x] Task 1: Create ListPageLayoutComponent (AC: #1)
- [x] Task 2: Create DetailPageLayoutComponent (AC: #2)
- [x] Task 3: Create FormPageLayoutComponent (AC: #3)
- [x] Task 4-6: PoC migrations completed — agent-list, agent-detail, agent-form migrated to use layout components
- [x] Task 7: Build and test pass (AC: #7)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Completion Notes List

- Created 3 shared layout components with externalized templates, styles, and specs (12 files)
- ListPageLayoutComponent: title, create button (RouterLink), content projection slots ([filters], [table]), load-more, empty state
- DetailPageLayoutComponent: breadcrumbs, skeleton loading, content projection slots ([metadata], [sections], [actions])
- FormPageLayoutComponent: breadcrumbs, title, SaveBar integration, Cmd+S/Escape keyboard shortcuts via host property
- PoC migrations completed: agent-list, agent-detail, and agent-form migrated to use layout components
- All 90 test files (1016 tests) pass with zero regressions, build passes

### File List

- `src/app/shared/components/layouts/list-page-layout.component.ts` (new)
- `src/app/shared/components/layouts/list-page-layout.component.html` (new)
- `src/app/shared/components/layouts/list-page-layout.component.css` (new)
- `src/app/shared/components/layouts/list-page-layout.component.spec.ts` (new)
- `src/app/shared/components/layouts/detail-page-layout.component.ts` (new)
- `src/app/shared/components/layouts/detail-page-layout.component.html` (new)
- `src/app/shared/components/layouts/detail-page-layout.component.css` (new)
- `src/app/shared/components/layouts/detail-page-layout.component.spec.ts` (new)
- `src/app/shared/components/layouts/form-page-layout.component.ts` (new)
- `src/app/shared/components/layouts/form-page-layout.component.html` (new)
- `src/app/shared/components/layouts/form-page-layout.component.css` (new)
- `src/app/shared/components/layouts/form-page-layout.component.spec.ts` (new)
