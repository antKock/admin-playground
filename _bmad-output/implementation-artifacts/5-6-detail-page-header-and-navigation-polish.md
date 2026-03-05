# Story 5.6: Detail Page Header & Navigation Polish

Status: review

## Story

As an operator (Alex/Sophie),
I want breadcrumb navigation, technical names, meta info, and section anchors on detail pages,
so that I always know where I am, can see key entity metadata at a glance, and can jump between page sections.

> **Origin:** UX Gap Analysis review (2026-03-04). Gaps: GAP-L1 (P1), GAP-MW2 (P1), GAP-MW3/ID7 (P1), GAP-MW5/ID5 (P1), GAP-MW11 (P2).

## Acceptance Criteria

1. **Given** the operator is on any page in the application **When** the page renders **Then** a breadcrumb trail is shown in the header: "Section > Current page" with clickable parent links
2. **Given** the operator is on an entity detail page that has a `technical_label` field **When** the page renders **Then** the technical name is displayed below the title in monospace gray text
3. **Given** the operator is on an entity detail page **When** the page renders **Then** a meta line shows: "Updated [formatted date] · ID: [entity id]" **And** "Updated by" is omitted until the API provides an `updated_by` field
4. **Given** the operator is on ActionModel detail or Indicator detail **When** the page has multiple sections (Metadata, Indicators, API Inspector, etc.) **Then** SectionAnchorsComponent is rendered with clickable pills for each section **And** clicking a pill scrolls to the corresponding section
5. **Given** breadcrumbs are implemented **When** the operator is on a detail page **Then** the "Back to list" button is removed in favor of the breadcrumb parent link

## Tasks / Subtasks

- [x] Task 1: Create shared BreadcrumbComponent (AC: #1, #5)
  - [x] Create `src/app/shared/components/breadcrumb/breadcrumb.component.ts`
  - [x] Interface: `BreadcrumbItem { label: string; route?: string }` — last item has no route (current page)
  - [x] Input: `items = input.required<BreadcrumbItem[]>()`
  - [x] Template: items joined by `›` separator, clickable items use `routerLink`, last item is plain text
  - [x] Style: font-size 13px, `text-text-secondary` for links, `text-text-primary` for current page, gap between items
  - [x] No service-based auto-breadcrumbs — keep it simple: each detail component provides its breadcrumb items

- [x] Task 2: Add technical_label display to detail headers (AC: #2)
  - [x] Indicator Models: `technical_label` shown below h1 in monospace gray
  - [x] Action Themes: `technical_label` shown below h1 in monospace gray
  - [x] Action Models: verified — does NOT have `technical_label` in API schema, skipped
  - [x] Funding Programs, Folder Models, Communities, Agents: no `technical_label`, skipped

- [x] Task 3: Add meta info line to detail headers (AC: #3)
  - [x] Added "Updated [date] · ID: [id]" to ALL 7 entity detail components
  - [x] Uses `fr-FR` locale date formatting (consistent with DataTable)
  - [x] "Updated by" omitted — API does not provide field yet

- [x] Task 4: Integrate SectionAnchorsComponent on multi-section detail pages (AC: #4)
  - [x] ActionModelDetail: sections Metadata, Indicators (with count), API Inspector — section IDs added, SectionAnchorsComponent rendered
  - [x] IndicatorModelDetail: sections Metadata, Usage (with count), API Inspector — section IDs added, SectionAnchorsComponent rendered

- [x] Task 5: Integrate breadcrumb and remove "Back to list" button (AC: #1, #5)
  - [x] All 7 detail components: breadcrumb added, "Back to list" button removed
  - [x] Error states: breadcrumb shown with "Error" as current page
  - [x] All 7 form components: breadcrumb added, "← Back" button removed
  - [x] Form edit mode: 3-level breadcrumb (Entity Type > Entity Name > Edit)
  - [x] Form create mode: 2-level breadcrumb (Entity Type > New Entity)

- [x] Task 6: Tests (AC: #1-5)
  - [x] BreadcrumbComponent spec: 5 tests (renders items, last item plain text, clickable links, separators, 3-level breadcrumbs)
  - [x] All 396 tests pass, zero regressions, build succeeds

## Dev Notes

### Architecture Compliance

- **New file:** `src/app/shared/components/breadcrumb/breadcrumb.component.ts` — standalone component
- **New file:** `src/app/shared/components/breadcrumb/breadcrumb.component.spec.ts` — 5 tests
- **Modified files:** all 7 detail components, all 7 form components
- **No services or stores** — pure presentational
- **Pattern:** Breadcrumb is a shared component; each page provides its own breadcrumb items

### Critical Implementation Details

- Action Models do NOT have `technical_label` in the API schema — only Indicator Models and Action Themes have it
- For forms with private facades (action-theme, community, funding-program), added `itemName` computed signal to expose entity name for breadcrumb
- For agent-form, added `agentDisplayName` computed to derive name from first_name + last_name
- Made `editId` non-private in form components for breadcrumb template access
- SectionAnchorsComponent already had IntersectionObserver — just added `id` attributes to section wrappers

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Removed `technical_label` from ActionModelDetail template — ActionModelRead schema doesn't include the field (TS2339 build error)

### Completion Notes List

- Created BreadcrumbComponent with BreadcrumbItem interface, routerLink navigation, separator rendering
- Added breadcrumbs to all 14 detail and form components, removed all "Back to list" / "← Back" buttons
- Added technical_label display to IndicatorModelDetail and ActionThemeDetail
- Added meta info line (Updated date + ID) to all 7 detail components with fr-FR formatting
- Integrated SectionAnchorsComponent on ActionModelDetail (3 sections) and IndicatorModelDetail (3 sections)
- All 396 tests pass, zero regressions, build succeeds

### File List

- `src/app/shared/components/breadcrumb/breadcrumb.component.ts` — new: BreadcrumbComponent with BreadcrumbItem interface
- `src/app/shared/components/breadcrumb/breadcrumb.component.spec.ts` — new: 5 tests
- `src/app/features/action-models/ui/action-model-detail.component.ts` — modified: breadcrumb, meta info, section anchors
- `src/app/features/indicator-models/ui/indicator-model-detail.component.ts` — modified: breadcrumb, technical_label, meta info, section anchors
- `src/app/features/action-themes/ui/action-theme-detail.component.ts` — modified: breadcrumb, technical_label, meta info
- `src/app/features/funding-programs/ui/funding-program-detail.component.ts` — modified: breadcrumb, meta info
- `src/app/features/folder-models/ui/folder-model-detail.component.ts` — modified: breadcrumb, meta info
- `src/app/features/communities/ui/community-detail.component.ts` — modified: breadcrumb, meta info
- `src/app/features/agents/ui/agent-detail.component.ts` — modified: breadcrumb, meta info
- `src/app/features/action-models/ui/action-model-form.component.ts` — modified: breadcrumb, editId visibility
- `src/app/features/indicator-models/ui/indicator-model-form.component.ts` — modified: breadcrumb, editId visibility
- `src/app/features/action-themes/ui/action-theme-form.component.ts` — modified: breadcrumb, itemName computed, editId visibility
- `src/app/features/funding-programs/ui/funding-program-form.component.ts` — modified: breadcrumb, itemName computed, editId visibility
- `src/app/features/folder-models/ui/folder-model-form.component.ts` — modified: breadcrumb, editId visibility
- `src/app/features/communities/ui/community-form.component.ts` — modified: breadcrumb, itemName computed, editId visibility
- `src/app/features/agents/ui/agent-form.component.ts` — modified: breadcrumb, agentDisplayName computed, editId visibility

## Change Log

- 2026-03-05: Added breadcrumb navigation, technical_label display, meta info lines, and section anchors to all detail/form pages
