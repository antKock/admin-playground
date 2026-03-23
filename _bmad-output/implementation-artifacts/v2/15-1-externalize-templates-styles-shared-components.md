# Story 15.1: Externalize Templates & Styles for Shared Components

Status: review

## Story

As a developer,
I want all shared components to have their templates and styles in dedicated `.html` and `.css` files,
so that I can read and edit markup and styling without scrolling through TypeScript logic.

## Acceptance Criteria

1. All 15 shared components with inline templates/styles have external `.html` and/or `.css` files
2. Component decorators use `templateUrl` / `styleUrl` instead of `template` / `styles`
3. No logic changes in any component TypeScript file
4. `npx ng build` passes with zero errors
5. `npx ng test --no-watch` passes with zero regressions
6. Components `data-table` and `app-layout` are untouched (already externalized)

## Tasks / Subtasks

- [x] Task 1: Batch 1 — Extract templates+styles for the 5 largest components (AC: #1, #2, #3)
  - [x] 1.1 `indicator-card` — extract 249-line template to `.html`, 191-line styles to `.css`
  - [x] 1.2 `rule-field` — extract 79-line template to `.html`, 176-line styles to `.css`
  - [x] 1.3 `openapi-banner` — extract 109-line template to `.html`, 153-line styles to `.css`
  - [x] 1.4 `column-filter-popover` — extract 34-line template to `.html`, 95-line styles to `.css`
  - [x] 1.5 `indicator-picker` — extract 59-line template to `.html`, 125-line styles to `.css`
  - [x] 1.6 Run `npx ng build` and `npx ng test --no-watch` to verify batch 1

- [x] Task 2: Batch 2 — Extract templates+styles for 5 medium components (AC: #1, #2, #3)
  - [x] 2.1 `param-hint-icons` — extract 8-line template to `.html`, 58-line styles to `.css`
  - [x] 2.2 `toast` — extract 26-line template to `.html`, styles to `.css`
  - [x] 2.3 `breadcrumb` — extract 18-line template to `.html`, styles to `.css`
  - [x] 2.4 `toggle-row` — extract 25-line template to `.html`, styles to `.css`
  - [x] 2.5 `section-anchors` — extract 16-line template to `.html`, styles to `.css`
  - [x] 2.6 Run `npx ng build` and `npx ng test --no-watch` to verify batch 2

- [x] Task 3: Batch 3 — Extract templates+styles for remaining 5 components (AC: #1, #2, #3)
  - [x] 3.1 `metadata-grid` — extract 34-line template to `.html`, styles to `.css`
  - [x] 3.2 `confirm-dialog` — extract 36-line template to `.html`, styles to `.css`
  - [x] 3.3 `status-badge` — extract 4-line template to `.html`, 11-line styles to `.css`
  - [x] 3.4 `multi-selector` — extract 64-line template to `.html` (no inline styles)
  - [x] 3.5 `save-bar` — extract 26-line template to `.html` (no inline styles)
  - [x] 3.6 Run `npx ng build` and `npx ng test --no-watch` to verify batch 3

- [x] Task 4: Final verification (AC: #4, #5, #6)
  - [x] 4.1 Run full `npx ng build` — confirm zero errors
  - [x] 4.2 Run full `npx ng test --no-watch` — confirm zero regressions
  - [x] 4.3 Verify `data-table` and `app-layout` were not modified

## Dev Notes

- **Extraction rule:** Replace `template:` with `templateUrl: './xxx.component.html'` and `styles:` with `styleUrl: './xxx.component.css'` in the `@Component` decorator
- **No logic changes** — this is a pure file extraction refactor
- **Process per component:**
  1. Copy the inline template string content into a new `.html` file (strip backticks/quotes)
  2. Copy the inline styles array content into a new `.css` file (strip backticks/quotes)
  3. Update the decorator to reference external files
  4. Verify the component still compiles
- **Watch for:** Template expressions that use single quotes inside template literals — ensure they survive extraction intact
- **Watch for:** CSS `:host` selectors — they must remain as-is in the external `.css` file
- Components with no inline styles (`multi-selector`, `save-bar`) only need template extraction

### Project Structure Notes

All files are under `src/app/shared/components/`. For each component `xxx`:

| Component | Source TS | Create HTML | Create CSS |
|-----------|-----------|-------------|------------|
| indicator-card | `indicator-card/indicator-card.component.ts` | `indicator-card/indicator-card.component.html` | `indicator-card/indicator-card.component.css` |
| rule-field | `rule-field/rule-field.component.ts` | `rule-field/rule-field.component.html` | `rule-field/rule-field.component.css` |
| openapi-banner | `openapi-banner/openapi-banner.component.ts` | `openapi-banner/openapi-banner.component.html` | `openapi-banner/openapi-banner.component.css` |
| column-filter-popover | `column-filter-popover/column-filter-popover.component.ts` | `column-filter-popover/column-filter-popover.component.html` | `column-filter-popover/column-filter-popover.component.css` |
| indicator-picker | `indicator-picker/indicator-picker.component.ts` | `indicator-picker/indicator-picker.component.html` | `indicator-picker/indicator-picker.component.css` |
| param-hint-icons | `param-hint-icons/param-hint-icons.component.ts` | `param-hint-icons/param-hint-icons.component.html` | `param-hint-icons/param-hint-icons.component.css` |
| toast | `toast/toast.component.ts` | `toast/toast.component.html` | `toast/toast.component.css` |
| breadcrumb | `breadcrumb/breadcrumb.component.ts` | `breadcrumb/breadcrumb.component.html` | `breadcrumb/breadcrumb.component.css` |
| toggle-row | `toggle-row/toggle-row.component.ts` | `toggle-row/toggle-row.component.html` | `toggle-row/toggle-row.component.css` |
| section-anchors | `section-anchors/section-anchors.component.ts` | `section-anchors/section-anchors.component.html` | `section-anchors/section-anchors.component.css` |
| metadata-grid | `metadata-grid/metadata-grid.component.ts` | `metadata-grid/metadata-grid.component.html` | `metadata-grid/metadata-grid.component.css` |
| confirm-dialog | `confirm-dialog/confirm-dialog.component.ts` | `confirm-dialog/confirm-dialog.component.html` | `confirm-dialog/confirm-dialog.component.css` |
| status-badge | `status-badge/status-badge.component.ts` | `status-badge/status-badge.component.html` | `status-badge/status-badge.component.css` |
| multi-selector | `multi-selector/multi-selector.component.ts` | `multi-selector/multi-selector.component.html` | — |
| save-bar | `save-bar/save-bar.component.ts` | `save-bar/save-bar.component.html` | — |

**Skip:** `data-table/` and `app-layout/` (already externalized)

### References

- [Source: _bmad-output/planning-artifacts/v2/epics.md#Story 15.1]
- [Source: _bmad-output/implementation-artifacts/v2/v2-technical-analysis.md#Template Externalization]
- [Source: docs/architecture-ACTEE.md]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

### Completion Notes List

- Extracted inline templates to `.html` and inline styles to `.css` for all 15 shared components
- Used automated Node.js script to ensure consistent extraction across all components
- All 13 components with styles got both `.html` and `.css` files; 2 components (`multi-selector`, `save-bar`) only got `.html`
- Replaced `template:` with `templateUrl:` and `styles:` with `styleUrl:` in all component decorators
- Build passes with zero errors, 82 test files / 971 tests pass with zero regressions
- `data-table` and `app-layout` confirmed untouched

### Change Log

- 2026-03-23: Externalized templates and styles for 15 shared components (all batches)

### File List

- src/app/shared/components/indicator-card/indicator-card.component.ts (modified)
- src/app/shared/components/indicator-card/indicator-card.component.html (new)
- src/app/shared/components/indicator-card/indicator-card.component.css (new)
- src/app/shared/components/rule-field/rule-field.component.ts (modified)
- src/app/shared/components/rule-field/rule-field.component.html (new)
- src/app/shared/components/rule-field/rule-field.component.css (new)
- src/app/shared/components/openapi-banner/openapi-banner.component.ts (modified)
- src/app/shared/components/openapi-banner/openapi-banner.component.html (new)
- src/app/shared/components/openapi-banner/openapi-banner.component.css (new)
- src/app/shared/components/column-filter-popover/column-filter-popover.component.ts (modified)
- src/app/shared/components/column-filter-popover/column-filter-popover.component.html (new)
- src/app/shared/components/column-filter-popover/column-filter-popover.component.css (new)
- src/app/shared/components/indicator-picker/indicator-picker.component.ts (modified)
- src/app/shared/components/indicator-picker/indicator-picker.component.html (new)
- src/app/shared/components/indicator-picker/indicator-picker.component.css (new)
- src/app/shared/components/param-hint-icons/param-hint-icons.component.ts (modified)
- src/app/shared/components/param-hint-icons/param-hint-icons.component.html (new)
- src/app/shared/components/param-hint-icons/param-hint-icons.component.css (new)
- src/app/shared/components/toast/toast.component.ts (modified)
- src/app/shared/components/toast/toast.component.html (new)
- src/app/shared/components/toast/toast.component.css (new)
- src/app/shared/components/breadcrumb/breadcrumb.component.ts (modified)
- src/app/shared/components/breadcrumb/breadcrumb.component.html (new)
- src/app/shared/components/breadcrumb/breadcrumb.component.css (new)
- src/app/shared/components/toggle-row/toggle-row.component.ts (modified)
- src/app/shared/components/toggle-row/toggle-row.component.html (new)
- src/app/shared/components/toggle-row/toggle-row.component.css (new)
- src/app/shared/components/section-anchors/section-anchors.component.ts (modified)
- src/app/shared/components/section-anchors/section-anchors.component.html (new)
- src/app/shared/components/section-anchors/section-anchors.component.css (new)
- src/app/shared/components/metadata-grid/metadata-grid.component.ts (modified)
- src/app/shared/components/metadata-grid/metadata-grid.component.html (new)
- src/app/shared/components/metadata-grid/metadata-grid.component.css (new)
- src/app/shared/components/confirm-dialog/confirm-dialog.component.ts (modified)
- src/app/shared/components/confirm-dialog/confirm-dialog.component.html (new)
- src/app/shared/components/confirm-dialog/confirm-dialog.component.css (new)
- src/app/shared/components/status-badge/status-badge.component.ts (modified)
- src/app/shared/components/status-badge/status-badge.component.html (new)
- src/app/shared/components/status-badge/status-badge.component.css (new)
- src/app/shared/components/multi-selector/multi-selector.component.ts (modified)
- src/app/shared/components/multi-selector/multi-selector.component.html (new)
- src/app/shared/components/save-bar/save-bar.component.ts (modified)
- src/app/shared/components/save-bar/save-bar.component.html (new)
