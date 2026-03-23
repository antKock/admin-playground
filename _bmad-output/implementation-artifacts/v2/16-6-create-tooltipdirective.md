# Story 16.6: Create TooltipDirective

Status: ready-for-dev

## Story

As a developer,
I want a unified tooltip directive replacing CSS pseudo-element tooltips and native title attributes,
so that tooltips are consistent across the application.

## Acceptance Criteria

1. A reusable `TooltipDirective` exists at `src/app/shared/directives/tooltip.directive.ts` with configurable text, hover show/hide, and consistent styling
2. CSS custom tooltips in `param-hint-icons` component are replaced with the directive
3. Native `title` attribute tooltips across detail components are replaced with the directive
4. Old CSS tooltip styles are removed from `param-hint-icons`

## Tasks / Subtasks

- [ ] Task 1: Create TooltipDirective in `shared/directives/` (AC: #1)
  - [ ] 1.1 Create `src/app/shared/directives/tooltip.directive.ts`:
    - Standalone directive, selector: `[appTooltip]`
    - Input: `appTooltip: string` — the tooltip text
    - Optional input: `tooltipPosition: 'top' | 'bottom' | 'left' | 'right'` (default: `'top'`)
    - HostListener: `mouseenter` — create and position tooltip element
    - HostListener: `mouseleave` — remove tooltip element
    - Tooltip element: dynamically created `<div>` appended to `document.body`
    - Positioning: calculate based on host element's `getBoundingClientRect()` + scroll offset
    - Styling: dark background (`#333`), white text, small font, rounded corners, small arrow via CSS pseudo-element, `z-index: 1000`
  - [ ] 1.2 Create `src/app/shared/directives/tooltip.directive.spec.ts`:
    - Test: creates tooltip on mouseenter
    - Test: removes tooltip on mouseleave
    - Test: positions tooltip above host by default
    - Test: supports configurable position
    - Test: does not create tooltip if appTooltip is empty string
    - Test: cleans up tooltip on directive destroy (OnDestroy)

- [ ] Task 2: Replace CSS custom tooltips in param-hint-icons (AC: #2)
  - [ ] 2.1 Analyze `src/app/shared/components/param-hint-icons/param-hint-icons.component.ts` — current CSS tooltips use `data-tooltip` attribute + `::before` pseudo-element
  - [ ] 2.2 Replace `data-tooltip` attributes with `[appTooltip]` directive binding
  - [ ] 2.3 Import `TooltipDirective` in the component's imports array

- [ ] Task 3: Replace native title tooltip attributes across detail components (AC: #3)
  - [ ] 3.1 Search codebase for `title=` attributes used as tooltips in detail component templates
  - [ ] 3.2 Replace with `[appTooltip]` directive in each affected component:
    - `src/app/features/agents/ui/agent-detail.component.ts`
    - `src/app/features/buildings/ui/building-detail.component.ts`
    - `src/app/features/communities/ui/community-detail.component.ts`
    - `src/app/features/action-models/ui/action-model-detail.component.ts`
    - `src/app/features/indicator-models/ui/indicator-model-detail.component.ts`
    - Other detail components as found during search
  - [ ] 3.3 Import `TooltipDirective` in each migrated component's imports array

- [ ] Task 4: Remove old CSS tooltip styles from param-hint-icons (AC: #4)
  - [ ] 4.1 Remove `data-tooltip` related CSS rules (the `::before` pseudo-element tooltip styles)
  - [ ] 4.2 Remove any `[data-tooltip]` attribute selectors from the stylesheet
  - [ ] 4.3 Verify no other components depend on these CSS tooltip styles

- [ ] Task 5: Update affected spec files
  - [ ] 5.1 Update `param-hint-icons.component.spec.ts` — ensure TooltipDirective is imported in test module
  - [ ] 5.2 Update affected detail component spec files

- [ ] Task 6: Run `npx ng build` and `npx ng test --no-watch` (AC: #1, #2, #3, #4)

## Dev Notes

- **Current CSS tooltip in param-hint-icons**: Uses `data-tooltip` attribute with `::before` pseudo-element for hover tooltips. This is a CSS-only approach that has positioning limitations and inconsistent styling compared to other tooltips.
- **Native `title` attributes**: Render as browser-default tooltips with no styling control, slow appearance delay, and inconsistent cross-browser behavior.
- **Directive approach advantages**: Consistent styling, configurable position, immediate show, accessible (can add `aria-describedby`), testable.
- **Cleanup on destroy**: The directive MUST implement `OnDestroy` to remove any orphaned tooltip elements (e.g., if the host element is removed while tooltip is visible).
- **Edge cases to handle**:
  - Tooltip near viewport edges — flip position to prevent overflow
  - Empty tooltip text — skip creating the element
  - Rapid mouse enter/leave — debounce or ensure cleanup
- This is the first directive in `src/app/shared/directives/` — the directory does not exist yet and must be created.

### Project Structure Notes

- **Create**: `src/app/shared/directives/tooltip.directive.ts`
- **Create**: `src/app/shared/directives/tooltip.directive.spec.ts`
- **Modify**: `src/app/shared/components/param-hint-icons/param-hint-icons.component.ts` — replace CSS tooltips with directive
- **Modify**: Multiple detail components — replace native `title` with `[appTooltip]`

### References

- [Source: docs/architecture-ACTEE.md]
- [Source: _bmad-output/planning-artifacts/v2/epics.md#Story 16.6]
- [Source: _bmad-output/implementation-artifacts/v2/v2-technical-analysis.md]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
