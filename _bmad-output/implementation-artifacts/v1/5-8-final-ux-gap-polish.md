# Story 5.8: Final UX Gap Polish

Status: done

## Story

As an operator (Alex/Sophie),
I want the remaining visual polish gaps closed,
so that the admin interface feels consistent and professional across all views.

## Context

Post-implementation verification (2026-03-05) identified 9 remaining actionable gaps. Party mode review triaged them into:
- **5 items to implement** (Tier A+B): high-value, low-effort polish
- **1 item to reclassify** as intentional divergence (GAP-SB1)
- **3 items to defer** as not worth the effort (GAP-EL7, GAP-IP1, GAP-ID1)

Reference: `_bmad-output/planning-artifacts/ux-gap-analysis.md` — Post-Implementation Verification section

## Acceptance Criteria

1. **Given** an operator views a list page with FK columns (e.g. Action Models) **When** a Funding Program or Action Theme name is displayed **Then** it renders as a clickable link that navigates to that entity's detail page (GAP-EL5)
2. **Given** an operator views any list page **When** looking at the Create button **Then** a Plus icon is visible before the button text (GAP-EL8)
3. **Given** an operator views any DataTable **When** looking at column headers **Then** headers render in uppercase with letter-spacing for scannability (GAP-EL10)
4. **Given** an operator views the sidebar **When** the current page's nav item is active **Then** the active state has rounded right corners matching the spec (GAP-L6)
5. **Given** an operator views a detail page with section anchors **When** a section has a count (e.g. Indicators) **Then** the count renders as a styled badge element, not plain parenthesized text (GAP-MW10)
6. **Given** the gap analysis document **When** reviewing GAP-SB1, GAP-EL7, GAP-IP1, GAP-ID1 **Then** the doc is updated to reflect their final dispositions (divergence/deferred)

## Tasks / Subtasks

- [x] Task 1: Wire linked references on FK columns in list components (AC: #1, GAP-EL5)
  - [x] In `action-model-list`: change `funding_program_name` column to `type: 'link'` with `linkRoute: '/funding-programs'` and `linkIdKey: 'funding_program_id'`
  - [x] In `action-model-list`: change `action_theme_name` column to `type: 'link'` with `linkRoute: '/action-themes'` and `linkIdKey: 'action_theme_id'`
  - [x] Verify any other list components with FK columns and wire similarly if applicable (agent-list: community_name wired; folder-model-list: many-to-many FK, not applicable)

- [x] Task 2: Add Plus icon to Create buttons (AC: #2, GAP-EL8)
  - [x] Import `Plus` from `lucide-angular` in each list component that has a Create button
  - [x] Add `<lucide-icon [img]="PlusIcon" [size]="16" />` inside each Create button before the text
  - [x] Applies to: action-theme-list, action-model-list, indicator-model-list, folder-model-list, funding-program-list, community-list, agent-list

- [x] Task 3: Add uppercase text-transform to DataTable headers (AC: #3, GAP-EL10)
  - [x] In `data-table.component.css`, add to the `th` selector: `text-transform: uppercase; letter-spacing: 0.3px;`

- [x] Task 4: Add border-radius to active nav item (AC: #4, GAP-L6)
  - [x] In `app-layout.component.css`, add to `.nav-item-active`: `border-radius: 0 6px 6px 0; margin-right: 8px;`

- [x] Task 5: Style section anchor count as badge (AC: #5, GAP-MW10)
  - [x] In `section-anchors.component.ts`, wrap the count in a `<span class="count-badge">` with distinct background styling

- [x] Task 6: Update gap analysis doc with final dispositions (AC: #6)
  - [x] Move GAP-SB1 from "Partially Resolved" to "Intentional Divergences" — brand-purple save button is a better fit than spec's amber/orange
  - [x] Move GAP-EL7, GAP-IP1, GAP-ID1 to a new "Deferred" section — explicitly document rationale for each
  - [x] Update the Closure Summary counts to reflect final state
  - [x] Update the Remaining Actionable Items list to show only the 5 implemented items as completed

- [x] Task 7: Tests (AC: #1-5)
  - [x] Verify existing DataTable link-type tests cover the FK column wiring
  - [x] Run full test suite: `npx ng test --no-watch` — 409/409 tests pass
  - [x] Run build check: `npx ng build` — build succeeds

## Dev Notes

### Architecture Compliance

- **No new files** — all changes are to existing components and CSS
- **Pattern:** DataTable `type: 'link'` infrastructure already exists from Story 5-5
- **Pattern:** Lucide icons already imported in layout and other components

### Scope Boundaries

- Do NOT implement GAP-EL7 (page subtitles) — deferred, marginal value
- Do NOT implement GAP-IP1 (picker loading) — deferred, sub-300ms loads make spinners worse
- Do NOT implement GAP-ID1 (type badge in header) — deferred, redundant with MetadataGrid
- Do NOT change GAP-SB1 (save bar color) — reclassified as intentional divergence

### References

- [Source: _bmad-output/planning-artifacts/ux-gap-analysis.md — Post-Implementation Verification]
- [Party Mode Review: 2026-03-05]

## Dev Agent Record

### Implementation Plan
- Pure CSS and template changes — no new files, no architectural changes
- Leveraged existing DataTable `type: 'link'` infrastructure and Lucide icon patterns
- Updated section-anchors test to match new badge rendering (parenthesized text → styled badge)

### Completion Notes
- All 7 tasks completed, all 6 ACs satisfied
- 409/409 tests pass, build succeeds
- Also wired `community_name` as link in agent-list (additional FK column discovered during Task 1 verification)
- `folder-model-list` has many-to-many FK (comma-separated names) — correctly excluded from link wiring

## File List

- `src/app/features/action-models/ui/action-model-list.component.ts` — modified (link columns, Plus icon, linkClick handler)
- `src/app/features/agents/ui/agent-list.component.ts` — modified (link column, Plus icon, linkClick handler)
- `src/app/features/action-themes/ui/action-theme-list.component.ts` — modified (Plus icon)
- `src/app/features/indicator-models/ui/indicator-model-list.component.ts` — modified (Plus icon)
- `src/app/features/folder-models/ui/folder-model-list.component.ts` — modified (Plus icon)
- `src/app/features/funding-programs/ui/funding-program-list.component.ts` — modified (Plus icon)
- `src/app/features/communities/ui/community-list.component.ts` — modified (Plus icon)
- `src/app/shared/components/data-table/data-table.component.css` — modified (uppercase headers)
- `src/app/shared/components/data-table/data-table.component.ts` — modified (hasLinkTarget helper for graceful link fallback)
- `src/app/shared/components/data-table/data-table.component.html` — modified (conditional link rendering)
- `src/app/core/layout/app-layout.component.css` — modified (active nav border-radius)
- `src/app/shared/components/section-anchors/section-anchors.component.ts` — modified (count badge)
- `src/app/shared/components/section-anchors/section-anchors.component.spec.ts` — modified (updated test for badge)
- `src/app/shared/utils/navigate-to-link.ts` — created (shared link navigation utility)
- `_bmad-output/planning-artifacts/ux-gap-analysis.md` — modified (final dispositions)

## Change Log

- 2026-03-05: Story created from party mode review of post-implementation verification
- 2026-03-05: All tasks implemented — FK link columns, Plus icons, uppercase headers, nav border-radius, count badge, gap analysis updated
- 2026-03-05: Code review fixes — Plus icons on empty-state buttons (M1), stronger test assertion (M2), DataTable link fallback for missing FK (M3), shared navigateToLink utility (L1)
