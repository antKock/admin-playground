# Story 15.2: Externalize Templates for Feature & Core Components

Status: review

## Story

As a developer,
I want all feature and core components to have their templates in dedicated `.html` files,
so that the entire codebase follows a consistent file structure.

## Acceptance Criteria

1. All feature and core components with inline templates have external `.html` files
2. Component decorators use `templateUrl` instead of `template`
3. No logic changes in any component TypeScript file
4. `npx ng build` passes with zero errors
5. `npx ng test --no-watch` passes with zero regressions
6. `app-layout` is untouched (already externalized)

## Tasks / Subtasks

- [x] Task 1: Batch 1 — Extract templates for all feature form components (AC: #1, #2, #3)
  - [x] 1.1 `agent-form` — extract 151-line template to `.html`
  - [x] 1.2 `user-form` — extract 122-line template to `.html`
  - [x] 1.3 `funding-program-form` — extract 114-line template to `.html`
  - [x] 1.4 `community-form` — extract 83-line template to `.html`
  - [x] 1.5 `action-theme-form` — extract 81-line template to `.html`
  - [x] 1.6 `folder-model-form` — extract 72-line template to `.html`
  - [x] 1.7 `building-form` — extract template to `.html`
  - [x] 1.8 `site-form` — extract template to `.html`
  - [x] 1.9 `indicator-model-form` — extract template to `.html`
  - [x] 1.10 `action-model-form` — extract template to `.html`
  - [x] 1.11 Run `npx ng build` and `npx ng test --no-watch` to verify batch 1

- [x] Task 2: Batch 2 — Extract templates for feature list and detail components (AC: #1, #2, #3)
  - [x] 2.1 `community-list` — extract 23-line template to `.html`
  - [x] 2.2 `agent-list` — extract template to `.html`
  - [x] 2.3 `building-list` — extract template to `.html`
  - [x] 2.4 `folder-model-list` — extract template to `.html`
  - [x] 2.5 `action-theme-list` — extract template to `.html`
  - [x] 2.6 `action-model-list` — extract template to `.html`
  - [x] 2.7 `indicator-model-list` — extract template to `.html`
  - [x] 2.8 `user-list` — extract template to `.html`
  - [x] 2.9 `funding-program-list` — extract template to `.html`
  - [x] 2.10 `site-list` — extract template to `.html`
  - [x] 2.11 All detail components across features (agent-detail, community-detail, building-detail, folder-model-detail, action-theme-detail, action-model-detail, indicator-model-detail, user-detail, funding-program-detail, site-detail)
  - [x] 2.12 Run `npx ng build` and `npx ng test --no-watch` to verify batch 2

- [x] Task 3: Batch 3 — Extract templates for remaining components (AC: #1, #2, #3)
  - [x] 3.1 `activity-feed-page` — extract 252-line template to `.html`
  - [x] 3.2 `community-users` — extract 78-line template to `.html`
  - [x] 3.3 `user-communities` — extract 76-line template to `.html`
  - [x] 3.4 `activity-list` — extract 73-line template to `.html`
  - [x] 3.5 `api-inspector` — extract 49-line template to `.html`
  - [x] 3.6 `login` — extract 49-line template to `.html`
  - [x] 3.7 Any remaining feature/core components with inline templates not covered above
  - [x] 3.8 Run `npx ng build` and `npx ng test --no-watch` to verify batch 3

- [x] Task 4: Final verification (AC: #4, #5, #6)
  - [x] 4.1 Run full `npx ng build` — confirm zero errors
  - [x] 4.2 Run full `npx ng test --no-watch` — confirm zero regressions
  - [x] 4.3 Grep entire `src/` for remaining `template:` in `@Component` decorators — zero remaining in `.component.ts` files; 11 trivial `<router-outlet />` page wrappers in `src/app/pages/**/*.page.ts` intentionally kept inline
  - [x] 4.4 Verify `app-layout` was not modified

## Dev Notes

- **Depends on:** Story 15.1 should be completed first (shared components), but this story can proceed independently if needed
- **Extraction rule:** Replace `template:` with `templateUrl: './xxx.component.html'` in the `@Component` decorator
- **No logic changes** — this is a pure file extraction refactor
- **Important:** The 13 components listed in the story description are the largest, but ALL feature/core components with inline templates must be extracted. Do a full grep to find them all:
  ```bash
  grep -rl "template:" src/app/features/ src/app/core/ --include="*.component.ts"
  ```
- **Watch for:** Components that import template helper functions or use complex template expressions — ensure they survive extraction intact
- **Note:** Most feature components have inline templates only (no inline styles), so only `.html` files need to be created

### Project Structure Notes

Feature components follow the pattern `src/app/features/{domain}/ui/{component-name}/{component-name}.component.ts`

| Domain | Components to Extract |
|--------|----------------------|
| `action-models` | form, list, detail |
| `action-themes` | form, list, detail |
| `activity-feed` | page |
| `agents` | form, list, detail |
| `buildings` | form, list, detail |
| `communities` | form, list, detail, community-users |
| `folder-models` | form, list, detail |
| `funding-programs` | form, list, detail |
| `indicator-models` | form, list, detail |
| `sites` | form, list, detail |
| `users` | form, list, detail, user-communities |

Other locations:
- `src/app/shared/components/activity-list/activity-list.component.ts`
- `src/app/shared/components/api-inspector/api-inspector.component.ts`
- `src/app/core/auth/login/login.component.ts`

**Skip:** `src/app/core/layout/app-layout/` (already externalized)

### References

- [Source: _bmad-output/planning-artifacts/v2/epics.md#Story 15.2]
- [Source: _bmad-output/implementation-artifacts/v2/v2-technical-analysis.md#Template Externalization]
- [Source: docs/architecture-ACTEE.md]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

### Completion Notes List

- Extracted inline templates to `.html` for all 36 feature, core, and remaining shared components
- 10 form components, 10 list components, 10 detail components, 3 specialized feature components (activity-feed-page, community-users, user-communities), 2 shared (activity-list, api-inspector), 1 core (login)
- No inline styles found in feature/core components — only `.html` files created
- Zero inline templates remaining in `.component.ts` files; 11 trivial `<router-outlet />` page wrappers (`*.page.ts`) intentionally kept inline
- Build passes with zero errors, 82 test files / 971 tests pass with zero regressions
- `app-layout` confirmed untouched

### Change Log

- 2026-03-23: Externalized templates for all 36 feature, core, and remaining shared components

### File List

- src/app/features/agents/ui/agent-form.component.ts (modified)
- src/app/features/agents/ui/agent-form.component.html (new)
- src/app/features/users/ui/user-form.component.ts (modified)
- src/app/features/users/ui/user-form.component.html (new)
- src/app/features/funding-programs/ui/funding-program-form.component.ts (modified)
- src/app/features/funding-programs/ui/funding-program-form.component.html (new)
- src/app/features/communities/ui/community-form.component.ts (modified)
- src/app/features/communities/ui/community-form.component.html (new)
- src/app/features/action-themes/ui/action-theme-form.component.ts (modified)
- src/app/features/action-themes/ui/action-theme-form.component.html (new)
- src/app/features/folder-models/ui/folder-model-form.component.ts (modified)
- src/app/features/folder-models/ui/folder-model-form.component.html (new)
- src/app/features/buildings/ui/building-form.component.ts (modified)
- src/app/features/buildings/ui/building-form.component.html (new)
- src/app/features/sites/ui/site-form.component.ts (modified)
- src/app/features/sites/ui/site-form.component.html (new)
- src/app/features/indicator-models/ui/indicator-model-form.component.ts (modified)
- src/app/features/indicator-models/ui/indicator-model-form.component.html (new)
- src/app/features/action-models/ui/action-model-form.component.ts (modified)
- src/app/features/action-models/ui/action-model-form.component.html (new)
- src/app/features/communities/ui/community-list.component.ts (modified)
- src/app/features/communities/ui/community-list.component.html (new)
- src/app/features/agents/ui/agent-list.component.ts (modified)
- src/app/features/agents/ui/agent-list.component.html (new)
- src/app/features/buildings/ui/building-list.component.ts (modified)
- src/app/features/buildings/ui/building-list.component.html (new)
- src/app/features/folder-models/ui/folder-model-list.component.ts (modified)
- src/app/features/folder-models/ui/folder-model-list.component.html (new)
- src/app/features/action-themes/ui/action-theme-list.component.ts (modified)
- src/app/features/action-themes/ui/action-theme-list.component.html (new)
- src/app/features/action-models/ui/action-model-list.component.ts (modified)
- src/app/features/action-models/ui/action-model-list.component.html (new)
- src/app/features/indicator-models/ui/indicator-model-list.component.ts (modified)
- src/app/features/indicator-models/ui/indicator-model-list.component.html (new)
- src/app/features/users/ui/user-list.component.ts (modified)
- src/app/features/users/ui/user-list.component.html (new)
- src/app/features/funding-programs/ui/funding-program-list.component.ts (modified)
- src/app/features/funding-programs/ui/funding-program-list.component.html (new)
- src/app/features/sites/ui/site-list.component.ts (modified)
- src/app/features/sites/ui/site-list.component.html (new)
- src/app/features/agents/ui/agent-detail.component.ts (modified)
- src/app/features/agents/ui/agent-detail.component.html (new)
- src/app/features/communities/ui/community-detail.component.ts (modified)
- src/app/features/communities/ui/community-detail.component.html (new)
- src/app/features/buildings/ui/building-detail.component.ts (modified)
- src/app/features/buildings/ui/building-detail.component.html (new)
- src/app/features/folder-models/ui/folder-model-detail.component.ts (modified)
- src/app/features/folder-models/ui/folder-model-detail.component.html (new)
- src/app/features/action-themes/ui/action-theme-detail.component.ts (modified)
- src/app/features/action-themes/ui/action-theme-detail.component.html (new)
- src/app/features/action-models/ui/action-model-detail.component.ts (modified)
- src/app/features/action-models/ui/action-model-detail.component.html (new)
- src/app/features/indicator-models/ui/indicator-model-detail.component.ts (modified)
- src/app/features/indicator-models/ui/indicator-model-detail.component.html (new)
- src/app/features/users/ui/user-detail.component.ts (modified)
- src/app/features/users/ui/user-detail.component.html (new)
- src/app/features/funding-programs/ui/funding-program-detail.component.ts (modified)
- src/app/features/funding-programs/ui/funding-program-detail.component.html (new)
- src/app/features/sites/ui/site-detail.component.ts (modified)
- src/app/features/sites/ui/site-detail.component.html (new)
- src/app/features/activity-feed/ui/activity-feed-page.component.ts (modified)
- src/app/features/activity-feed/ui/activity-feed-page.component.html (new)
- src/app/features/communities/ui/community-users.component.ts (modified)
- src/app/features/communities/ui/community-users.component.html (new)
- src/app/features/users/ui/user-communities.component.ts (modified)
- src/app/features/users/ui/user-communities.component.html (new)
- src/app/shared/components/activity-list/activity-list.component.ts (modified)
- src/app/shared/components/activity-list/activity-list.component.html (new)
- src/app/shared/components/api-inspector/api-inspector.component.ts (modified)
- src/app/shared/components/api-inspector/api-inspector.component.html (new)
- src/app/core/auth/login.component.ts (modified)
- src/app/core/auth/login.component.html (new)
