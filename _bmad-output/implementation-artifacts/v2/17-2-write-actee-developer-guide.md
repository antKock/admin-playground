# Story 17.2: Write ACTEE Developer Guide

Status: ready-for-dev

## Story

As a developer joining the project,
I want a concise guide explaining the architecture conventions and how to add new features,
so that I can be productive in under 10 minutes.

## Acceptance Criteria

1. Documentation file `docs/actee-developer-guide.md` exists with architecture overview explaining domain -> feature -> UI flow
2. "Create a New Domain" checklist covers: store, API service, models, forms — with exact file naming and placement
3. "Create a New Feature" checklist covers: derived store, facade, list/detail/form UI components — with exact file naming and placement
4. Naming conventions section covers files (kebab-case), stores, facades, APIs, and selectors
5. Pattern reference sections cover: mutations (`withMutations`, `httpMutation`), forms (`createXxxForm`), lists (DataTable, filters, cursor pagination, `hasLoaded` guard), and details (MetadataGrid, skeleton loading, `clearSelection` on destroy)
6. Guide is under 500 lines, concise, and scannable — references real code, not hypothetical examples

## Tasks / Subtasks

- [ ] Task 1: Analyze existing code for concrete examples (AC: #1, #6)
  - [ ] 1.1 Read `docs/architecture-ACTEE.md` — use as foundation, identify what needs to be made more practical
  - [ ] 1.2 Read a complete domain as exemplar: `src/app/domains/agents/` (store, api, models, forms)
    - `src/app/domains/agents/agent.store.ts`
    - `src/app/domains/agents/agent.api.ts`
    - `src/app/domains/agents/agent.models.ts`
    - `src/app/domains/agents/forms/agent.form.ts`
  - [ ] 1.3 Read a complete feature as exemplar: `src/app/features/agents/`
    - `src/app/features/agents/agent.store.ts`
    - `src/app/features/agents/agent.facade.ts`
    - `src/app/features/agents/ui/agent-list.component.ts`
    - `src/app/features/agents/ui/agent-detail.component.ts`
    - `src/app/features/agents/ui/agent-form.component.ts`
  - [ ] 1.4 Read a page module as exemplar: `src/app/pages/agents/`
    - `src/app/pages/agents/agents.page.ts`
    - `src/app/pages/agents/agents.routes.ts`
  - [ ] 1.5 Note patterns for mutations, form creation, list/detail conventions

- [ ] Task 2: Write architecture overview section (AC: #1)
  - [ ] 2.1 Describe the 3-layer flow: domain (data) -> feature (behavior) -> pages (routing)
  - [ ] 2.2 Explain what belongs in each layer — stores, APIs, models in domain; facades, derived stores, UI in feature; routes and layout in pages
  - [ ] 2.3 Include a simple directory tree showing the pattern

- [ ] Task 3: Write "Create a New Domain" checklist (AC: #2)
  - [ ] 3.1 Step-by-step: create models file (`xxx.models.ts`)
  - [ ] 3.2 Step-by-step: create API service (`xxx.api.ts`) with `httpMutation` methods
  - [ ] 3.3 Step-by-step: create domain store (`xxx.store.ts`) with `signalStore`, `withState`, `withCursorPagination`, `withMutations`
  - [ ] 3.4 Step-by-step: create form factory (`forms/xxx.form.ts`) with `createXxxForm()`
  - [ ] 3.5 Reference exact file paths from `agents` domain as template

- [ ] Task 4: Write "Create a New Feature" checklist (AC: #3)
  - [ ] 4.1 Step-by-step: create derived feature store (`xxx.store.ts` in features)
  - [ ] 4.2 Step-by-step: create facade (`xxx.facade.ts`) — readonly signals, async CRUD with toast+navigate
  - [ ] 4.3 Step-by-step: create list component (`xxx-list.component.ts`) — DataTable, filters, `hasLoaded` guard
  - [ ] 4.4 Step-by-step: create detail component (`xxx-detail.component.ts`) — MetadataGrid, `clearSelection` on destroy
  - [ ] 4.5 Step-by-step: create form component (`xxx-form.component.ts`) — SaveBar, reactive form binding
  - [ ] 4.6 Step-by-step: create page and routes (`pages/xxx/`)
  - [ ] 4.7 Reference exact file paths from `agents` feature as template

- [ ] Task 5: Write patterns reference sections (AC: #4, #5)
  - [ ] 5.1 Mutation patterns: `withMutations` in store, `httpMutation` in API — show real signatures
  - [ ] 5.2 Form patterns: `createXxxForm()` factory, reactive forms, SaveBar integration
  - [ ] 5.3 List patterns: DataTable columns, filter config, cursor pagination hook, `hasLoaded` empty state guard
  - [ ] 5.4 Detail patterns: MetadataGrid config, skeleton loading, `ngOnDestroy` with `facade.clearSelection()`
  - [ ] 5.5 Date formatting: `formatDateFr()` from `@app/shared/utils/format-date`, MetadataGrid `type: 'date'`

- [ ] Task 6: Verify under 500 lines (AC: #6)
  - [ ] 6.1 Count lines in `docs/actee-developer-guide.md` — must be under 500
  - [ ] 6.2 Trim any verbose sections — favor tables, code snippets, and bullet points over prose

## Dev Notes

- **Foundation document:** `docs/architecture-ACTEE.md` — read first, then make it practical with real examples
- **Primary exemplar domain:** `agents` — it has all 4 files (store, api, models, forms) and a complete feature layer
- **All domain stores to scan for common patterns:**
  - `src/app/domains/action-models/action-model.store.ts`
  - `src/app/domains/action-themes/action-theme.store.ts`
  - `src/app/domains/agents/agent.store.ts`
  - `src/app/domains/building/building.store.ts`
  - `src/app/domains/communities/community.store.ts`
  - `src/app/domains/folder-models/folder-model.store.ts`
  - `src/app/domains/funding-programs/funding-program.store.ts`
  - `src/app/domains/indicator-models/indicator-model.store.ts`
  - `src/app/domains/site/site.store.ts`
  - `src/app/domains/users/user.store.ts`
- **All facades to scan:**
  - `src/app/features/agents/agent.facade.ts`
  - `src/app/features/action-models/action-model.facade.ts`
  - `src/app/features/communities/community.facade.ts`
  - (and all others under `src/app/features/*/`)
- **Shared components referenced in patterns:**
  - `src/app/shared/components/data-table/`
  - `src/app/shared/components/metadata-grid/`
  - `src/app/shared/components/save-bar/`
  - `src/app/shared/components/breadcrumb/`
  - `src/app/shared/components/confirm-dialog/`
  - `src/app/shared/components/toast/`
  - `src/app/shared/components/indicator-card/`
  - `src/app/shared/components/rule-field/`
- **Utility files:**
  - `src/app/shared/utils/format-date.ts` — `formatDateFr()` helper
- **Path aliases:** `@app/` = `src/app/`, `@shared/` = `src/app/shared/`, `@domains/` = `src/app/domains/`, `@features/` = `src/app/features/`, `@core/` = `src/app/core/`
- **Output file:** `docs/actee-developer-guide.md`
- **Hard constraint:** Under 500 lines. Use tables for naming conventions, code blocks for signatures, checklists for steps. Minimal prose.
- **Note on singular vs plural:** Some domain folders are singular (`building`, `site`) while others are plural (`agents`, `communities`). Document this inconsistency or normalize in the guide.

### Project Structure Notes

- Files to create:
  - `docs/actee-developer-guide.md`

### References

- [Source: _bmad-output/planning-artifacts/v2/epics.md#Story 17.2]
- [Source: _bmad-output/implementation-artifacts/v2/v2-technical-analysis.md]
- [Source: docs/architecture-ACTEE.md]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
