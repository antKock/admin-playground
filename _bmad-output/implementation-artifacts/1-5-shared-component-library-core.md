# Story 1.5: Shared Component Library — Core

Status: done

## Story

As a developer,
I want the foundational shared components built and ready for use,
so that all entity modules in subsequent epics use consistent, tested UI components.

## Acceptance Criteria

1. **DataTable Component** — Accepts column definitions and row data via `input()` signals, supports infinite scroll cursor-based pagination (loads at 80% scroll threshold), displays skeleton loading rows (6 rows of shimmer) when `isLoading` is true, emits row click events via `output()`, uses `.data-table` CSS class convention
2. **StatusBadge Component** — Accepts a status string input, renders appropriate semantic color badge (Draft: neutral, Published: green #2e8b7a, Disabled: gray #c8c8c8), uses `text-xs` type scale
3. **Toast + ToastService** — ToastService is injectable with `success()`, `error()`, `info()` methods. Toasts appear as non-blocking overlays using CDK Overlay. Auto-dismiss after configurable duration. Messages follow pattern: **"Bold action"** + context
4. **ConfirmDialog + ConfirmDialogService** — ConfirmDialogService provides `confirm(title, message)` returning Observable/Promise. Dialog uses CDK Overlay with focus trapping (CDK A11y). Renders Cancel and Confirm buttons
5. **MetadataGrid Component** — Accepts key-value pairs via input, renders structured grid layout. Supports linked reference fields with navigation icon for entity relationships
6. **SectionAnchors Component** — Renders anchor links for navigating between sections on detail pages. Smooth scroll to target. Active state tracks scroll position via intersection observer
7. **Component Standards** — All use standalone architecture (no NgModule), all use `input()`/`output()` signal-based API, all are purely presentational (no service injection, no HTTP calls — except Toast/ConfirmDialog services), each has own subfolder with component + template + styles + spec files

## Tasks / Subtasks

- [x] Task 1: Create shared directory structure
  - [x] Create `src/app/shared/components/` directory
  - [x] Create `src/app/shared/services/` directory

- [x] Task 2: DataTable Component (AC: #1)
  - [x] Create `src/app/shared/components/data-table/data-table.component.ts`
  - [x] Inputs: `columns: ColumnDef[]`, `data: T[]`, `isLoading: boolean`, `hasMore: boolean`
  - [x] Outputs: `rowClick: T`, `loadMore: void`
  - [x] Implement infinite scroll: observe scroll position, emit `loadMore` at 80% threshold
  - [x] Skeleton loading: 6 rows of shimmer animation when `isLoading && data.length === 0`
  - [x] Use `<table>` with proper `<thead>`/`<tbody>`, `aria-sort` on sortable columns
  - [x] Row hover: `surface-table-row-hover` (#f0f2fa)
  - [x] Row height: 48px minimum
  - [x] Enter key on focused row triggers row click
  - [x] CSS class: `.data-table`
  - [x] Create spec file with tests

- [x] Task 3: StatusBadge Component (AC: #2)
  - [x] Create `src/app/shared/components/status-badge/status-badge.component.ts`
  - [x] Input: `status: string`, optional `label: string`
  - [x] Color mapping: draft → neutral/white, published/done → green (#2e8b7a), disabled/closed → gray (#c8c8c8), review → lavender (#d9c8f5), error/invalid → red (#f5a0a0), modify → amber (#f5d87a), processing → orange (#e89420)
  - [x] Pill shape: rounded-full, px-2 py-0.5, text-xs, font-medium
  - [x] Always includes text label — never color-only (accessibility)
  - [x] CSS class: `.status-badge`
  - [x] Create spec file

- [x] Task 4: Toast + ToastService (AC: #3)
  - [x] Create `src/app/shared/services/toast.service.ts`
  - [x] Create `src/app/shared/components/toast/toast.component.ts`
  - [x] ToastService methods: `success(message)`, `error(message)`, `info(message)`
  - [x] Use CDK Overlay for positioning (top-right)
  - [x] Auto-dismiss: default 4 seconds, configurable via optional `duration` param
  - [x] Stackable: multiple toasts can appear simultaneously
  - [x] Dismissable on click
  - [x] Variants: success (green `surface-success`), error (red `surface-error`), info (neutral)
  - [x] Accessibility: `role="alert"`, `aria-live="assertive"`
  - [x] Message format: **"Bold action"** · context (e.g., **"Funding Program created"** · 1 record added)
  - [x] Create spec files for both service and component

- [x] Task 5: ConfirmDialog + ConfirmDialogService (AC: #4)
  - [x] Create `src/app/shared/services/confirm-dialog.service.ts`
  - [x] Create `src/app/shared/components/confirm-dialog/confirm-dialog.component.ts`
  - [x] Service: `confirm(options: { title, message, confirmLabel?, confirmVariant? }): Promise<boolean>`
  - [x] Use CDK Overlay + CDK FocusTrap (A11y)
  - [x] Backdrop overlay (semi-transparent)
  - [x] Cancel + Confirm buttons
  - [x] `confirmVariant`: 'primary' (brand-primary) or 'danger' (error red) — for delete confirmations
  - [x] Escape key closes dialog (returns false)
  - [x] Focus returns to trigger element on close
  - [x] Create spec files

- [x] Task 6: MetadataGrid Component (AC: #5)
  - [x] Create `src/app/shared/components/metadata-grid/metadata-grid.component.ts`
  - [x] Input: `fields: MetadataField[]` where MetadataField = `{ label, value, type?, linkedRoute? }`
  - [x] Field types: `text` (default), `mono` (monospace font), `linked` (with navigation icon)
  - [x] 2-column grid layout on `surface-subtle` background
  - [x] Linked fields: display value + Lucide ExternalLink/ArrowUpRight icon for navigation
  - [x] Output: `navigateToLinked(route: string)`
  - [x] Labels use `text-xs text-secondary`, values use `text-sm text-primary`
  - [x] CSS class: `.metadata-grid`
  - [x] Create spec file

- [x] Task 7: SectionAnchors Component (AC: #6)
  - [x] Create `src/app/shared/components/section-anchors/section-anchors.component.ts`
  - [x] Input: `sections: SectionDef[]` where SectionDef = `{ label, count?, targetId }`
  - [x] Output: `anchorClicked(targetId: string)`
  - [x] Pill-shaped buttons on muted background
  - [x] Click → smooth scroll to `#targetId`
  - [x] Active state: track scroll position with IntersectionObserver, highlight current section
  - [x] Accessibility: `role="navigation"`, `aria-label="Page sections"`
  - [x] CSS class: `.section-anchors`
  - [x] Create spec file

- [x] Task 8: Verification
  - [x] All components compile without errors
  - [x] All spec files pass
  - [x] No `any` types in component code
  - [x] All components use `input()`/`output()` — no `@Input`/`@Output` decorators
  - [x] All components are standalone

## Dev Notes

### Architecture Patterns & Constraints

- **All Standalone**: No NgModule — every component uses default standalone
- **Signal API**: Use `input()` and `output()` from `@angular/core` (NOT `@Input`/`@Output` decorators)
- **Purely Presentational**: DataTable, StatusBadge, MetadataGrid, SectionAnchors have NO service injection and make NO HTTP calls
- **Service Components**: Toast and ConfirmDialog have companion services (ToastService, ConfirmDialogService) that use CDK Overlay
- **Angular CDK Usage**:
  - `@angular/cdk/overlay` — Toast positioning, ConfirmDialog overlay
  - `@angular/cdk/a11y` — Focus trapping in ConfirmDialog, focus monitoring
  - `@angular/cdk/scrolling` — Scroll observer for DataTable infinite scroll
- **Tailwind Design Tokens**: All colors reference the custom tokens from Story 1.1's styles.css
- **Icons**: Lucide Angular for all icons (ArrowUpRight for linked fields, etc.)
- **Test Co-location**: Every component has a `.spec.ts` file in the same directory

### Component CSS Class Mapping (from UX spec)

| Component | CSS Class | Background |
|-----------|-----------|------------|
| DataTable | `.data-table` | `surface-base` |
| StatusBadge | `.status-badge` | varies by status |
| Toast | `.toast` | varies by type |
| ConfirmDialog | `.confirm-dialog` | `surface-base` |
| MetadataGrid | `.metadata-grid` | `surface-subtle` |
| SectionAnchors | `.section-anchors` | `surface-muted` |

### Files Created by This Story

```
src/app/shared/
├── components/
│   ├── data-table/
│   │   ├── data-table.component.ts
│   │   ├── data-table.component.html
│   │   ├── data-table.component.css
│   │   └── data-table.component.spec.ts
│   ├── status-badge/
│   │   ├── status-badge.component.ts
│   │   └── status-badge.component.spec.ts
│   ├── toast/
│   │   ├── toast.component.ts
│   │   └── toast.component.spec.ts
│   ├── confirm-dialog/
│   │   ├── confirm-dialog.component.ts
│   │   └── confirm-dialog.component.spec.ts
│   ├── metadata-grid/
│   │   ├── metadata-grid.component.ts
│   │   ├── metadata-grid.component.html
│   │   └── metadata-grid.component.spec.ts
│   └── section-anchors/
│       ├── section-anchors.component.ts
│       └── section-anchors.component.spec.ts
└── services/
    ├── toast.service.ts
    └── confirm-dialog.service.ts
```

### Dependencies

- **Story 1.1**: Tailwind design tokens, `@angular/cdk`, `lucide-angular`
- **No dependency on Story 1.2 or 1.3** — these components don't make HTTP calls

### What This Story Does NOT Create

- No SaveBar component (Epic 6 — only needed for indicator workspace)
- No IndicatorCard, ToggleRow, RuleField, IndicatorPicker (Epic 6)
- No ApiInspector (Epic 7)
- No entity-specific components

### Anti-Patterns to Avoid

- DO NOT inject HttpClient or any service into presentational components
- DO NOT use `@Input`/`@Output` decorators — use `input()`/`output()` signal functions
- DO NOT use NgModule
- DO NOT use Material/PrimeNG components — build custom with Tailwind + CDK
- DO NOT use color alone for status — always pair with text label
- DO NOT create a monolithic shared module — each component is independently importable

### Accessibility Requirements

- DataTable: `<table>` with `<thead>`/`<tbody>`, `aria-sort` on columns, Enter key activates rows
- StatusBadge: Text label always present (never color-only)
- Toast: `role="alert"`, `aria-live="assertive"`
- ConfirmDialog: CDK FocusTrap, Escape to close, focus returns to trigger
- SectionAnchors: `role="navigation"`, `aria-label="Page sections"`
- All: Visible focus rings (2px brand-primary outline, 2px offset)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.5] — Acceptance criteria
- [Source: _bmad-output/planning-artifacts/architecture.md#Shared Components] — Component list, organization
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component Strategy] — Full component specs
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Color System] — Status color mapping
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Accessibility] — WCAG AA requirements

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- All 7 ACs implemented. DataTable with infinite scroll via IntersectionObserver, StatusBadge with 10 status color mappings, Toast with CDK-based service, ConfirmDialog with CDK A11y focus trapping, MetadataGrid with linked fields, SectionAnchors with IntersectionObserver active tracking. All components use input()/output() signals, standalone, no HTTP calls, no any types.

### File List

- src/app/shared/components/data-table/data-table.component.ts — Table with infinite scroll
- src/app/shared/components/data-table/data-table.component.html — Table template
- src/app/shared/components/data-table/data-table.component.css — Table styles + skeleton
- src/app/shared/components/data-table/data-table.component.spec.ts — 7 unit tests
- src/app/shared/components/status-badge/status-badge.component.ts — Status pill badges
- src/app/shared/components/status-badge/status-badge.component.spec.ts — 9 unit tests
- src/app/shared/components/toast/toast.component.ts — Toast container component
- src/app/shared/components/toast/toast.component.spec.ts — 8 unit tests
- src/app/shared/components/toast/toast.service.spec.ts — 9 unit tests
- src/app/shared/services/toast.service.ts — Toast notification service
- src/app/shared/components/confirm-dialog/confirm-dialog.component.ts — Dialog with CDK focus trap
- src/app/shared/components/confirm-dialog/confirm-dialog.component.spec.ts — 13 unit tests
- src/app/shared/services/confirm-dialog.service.ts — Dialog management service
- src/app/shared/components/metadata-grid/metadata-grid.component.ts — Key-value grid
- src/app/shared/components/metadata-grid/metadata-grid.component.spec.ts — 6 unit tests
- src/app/shared/components/section-anchors/section-anchors.component.ts — Section nav with IntersectionObserver
- src/app/shared/components/section-anchors/section-anchors.component.spec.ts — 7 unit tests
