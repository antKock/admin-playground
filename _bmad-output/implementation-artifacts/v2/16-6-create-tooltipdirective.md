# Story 16.6: Create TooltipDirective

Status: done

## Story

As a developer,
I want a unified tooltip directive replacing CSS pseudo-element tooltips and native title attributes,
so that tooltips are consistent across the application.

## Acceptance Criteria

1. A reusable `TooltipDirective` exists at `src/app/shared/directives/tooltip.directive.ts`
2. CSS custom tooltips in `param-hint-icons` component are replaced with the directive
3. Native `title` attribute tooltips across detail components are replaced with the directive
4. Old CSS tooltip styles are removed from `param-hint-icons`

## Tasks / Subtasks

- [x] All tasks completed

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Completion Notes List

- Created `TooltipDirective` with signal inputs, dynamic tooltip element on `document.body`, position calculation, OnDestroy cleanup
- Created spec with 4 tests (mouseenter, mouseleave, empty text, destroy)
- Replaced `[attr.data-tooltip]` with `[appTooltip]` in param-hint-icons template
- Removed CSS `::before` pseudo-element tooltip styles from param-hint-icons
- Replaced `title="Retirer l'utilisateur"` with `appTooltip` in community-users
- Detail components don't use `title` attributes for tooltips, so no changes needed there
- All 86 test files (1002 tests) pass with zero regressions

### File List

- `src/app/shared/directives/tooltip.directive.ts` (new)
- `src/app/shared/directives/tooltip.directive.spec.ts` (new)
- `src/app/shared/components/param-hint-icons/param-hint-icons.component.ts` (modified)
- `src/app/shared/components/param-hint-icons/param-hint-icons.component.html` (modified)
- `src/app/shared/components/param-hint-icons/param-hint-icons.component.css` (modified)
- `src/app/features/communities/ui/community-users.component.ts` (modified)
- `src/app/features/communities/ui/community-users.component.html` (modified)
