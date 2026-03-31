# Story 23.3: UI Cleanup — Navbar Reorganization, Beta Tagging, and API Inspector Removal

Status: done

## Story

As an admin user, I want a clearer navigation structure and honest feature labeling, so that I can find tools intuitively and know which features are still in progress.

## Context

- The "Modèles" are being separated from other configuration items to prepare for a future "Instructions" section (Instructions / Critères)
- Activité is kept as-is but marked beta — a full rework is planned later
- "Administration" is renamed to "Debugging" because these items will be removed long-term
- API Inspector is unused and adds noise to every page

## Acceptance Criteria

### AC-1: Navbar sections reorganized

- Navigation has three sections: **Objets**, **Modèles**, **Debugging**
- **Objets** contains (in order): Programmes, Thèmes d'action, Utilisateurs
- **Modèles** contains (in order): Indicateurs, Actions, Dossiers, Entités (shortened labels — no "Modèles de..." prefix since the section header provides context)
- **Debugging** contains (in order): Sites, Bâtiments, Communautés, Activité
- "Agents" nav item is removed entirely

### AC-2: Beta tag on Activité

- The Activité page (`activity-feed-page`) displays a "bêta" badge next to the page title
- Every `<app-activity-list>` block on detail pages displays the same "bêta" badge next to the section heading
- Badge style: soft amber pill, lowercase "bêta"

### AC-3: API Inspector removed

- `<app-api-inspector />` removed from the global layout
- Empty `<div id="section-api-inspector">` shells removed from action-model and indicator-model detail pages
- API Inspector component, service, interceptor, and their spec files deleted
- Interceptor registration removed from `app.config.ts`

## Out of Scope

- New "Instructions" section (future work)
- Activité feature rework
- Removing Debugging routes entirely

## Technical Notes

### Files to modify

- `src/app/core/layout/app-layout.component.ts` — restructure nav arrays, remove ApiInspector import
- `src/app/core/layout/app-layout.component.html` — update section labels, remove `<app-api-inspector />`
- `src/app/features/activity-feed/ui/activity-feed-page.component.html` — add beta badge to h1
- `src/app/shared/components/activity-list/activity-list.component.html` — add beta badge to h2
- `src/app/features/action-models/ui/action-model-detail.component.html` — remove empty `<div id="section-api-inspector">`
- `src/app/features/indicator-models/ui/indicator-model-detail.component.html` — remove empty `<div id="section-api-inspector">`
- `src/app/app.config.ts` — remove interceptor registration

### Files to delete

- `src/app/shared/api-inspector/api-inspector.component.ts`
- `src/app/shared/api-inspector/api-inspector.component.html`
- `src/app/shared/api-inspector/api-inspector.component.spec.ts`
- `src/app/shared/api-inspector/api-inspector.service.ts`
- `src/app/shared/api-inspector/api-inspector.service.spec.ts`
- `src/app/shared/api-inspector/api-inspector.interceptor.ts`
- `src/app/shared/api-inspector/api-inspector.interceptor.spec.ts`

## Tasks / Subtasks

- [x] Task 1: Restructure navbar (AC: #1)
  - [x] 1.1 Refactor `configItems` → `objetItems` array: Programmes, Thèmes d'action, Utilisateurs
  - [x] 1.2 Create `modelItems` array: Indicateurs, Actions, Dossiers, Entités (shortened labels)
  - [x] 1.3 Refactor `adminItems` → `debugItems` array: Sites, Bâtiments, Communautés, Activité (remove Agents)
  - [x] 1.4 Update template section labels: Objets, Modèles, Debugging
  - [x] 1.5 Remove unused icon imports (UserCog for Agents)

- [x] Task 2: Add beta badge to Activité (AC: #2)
  - [x] 2.1 Add "bêta" amber pill badge next to h1 in `activity-feed-page.component.html`
  - [x] 2.2 Add "bêta" amber pill badge next to h2 in `activity-list.component.html`

- [x] Task 3: Remove API Inspector (AC: #3)
  - [x] 3.1 Remove `<app-api-inspector />` from `app-layout.component.html`
  - [x] 3.2 Remove ApiInspectorComponent import from `app-layout.component.ts`
  - [x] 3.3 Remove empty `<div id="section-api-inspector">` from action-model and indicator-model detail templates
  - [x] 3.4 Remove `apiInspectorInterceptor` from `app.config.ts`
  - [x] 3.5 Delete `src/app/shared/api-inspector/` directory

## Dev Agent Record

### Implementation Notes

- Restructured navbar from 2 sections (Configuration/Administration) to 3 sections (Objets/Modèles/Debugging)
- Moved Utilisateurs from adminItems to objetItems; moved model-related items to new modelItems array with shortened labels
- Removed Agents nav item entirely and its UserCog icon import
- Added soft amber pill "bêta" badge (`bg-amber-100 text-amber-800 rounded-full`) to both the activity feed page h1 and the reusable activity-list component h2
- Fully removed API Inspector: component, service, interceptor, spec files, template references, and interceptor registration
- Updated existing layout spec tests to match new nav structure (3 sections, 11 items)

### Debug Log

No issues encountered during implementation.

## File List

- `src/app/core/layout/app-layout.component.ts` — modified (nav arrays restructured, imports cleaned)
- `src/app/core/layout/app-layout.component.html` — modified (section labels updated, api-inspector removed)
- `src/app/core/layout/app-layout.component.spec.ts` — modified (tests updated for new nav structure)
- `src/app/features/activity-feed/ui/activity-feed-page.component.html` — modified (beta badge added)
- `src/app/shared/components/activity-list/activity-list.component.html` — modified (beta badge added)
- `src/app/features/action-models/ui/action-model-detail.component.html` — modified (api-inspector div removed)
- `src/app/features/indicator-models/ui/indicator-model-detail.component.html` — modified (api-inspector div removed)
- `src/app/app.config.ts` — modified (interceptor removed)
- `src/app/shared/components/activity-list/activity-list.component.spec.ts` — modified (beta badge assertion added)
- `src/app/shared/api-inspector/` — deleted (entire directory: component, service, interceptor, specs)

## Change Log

- 2026-03-31: Implemented story 23.3 — reorganized navbar into Objets/Modèles/Debugging sections, added "bêta" badge to Activité, removed API Inspector entirely
- 2026-03-31: Code review fix — added beta badge assertion to activity-list spec
