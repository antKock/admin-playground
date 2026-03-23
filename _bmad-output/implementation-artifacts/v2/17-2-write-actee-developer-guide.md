# Story 17.2: Write ACTEE Developer Guide

Status: review

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

- [x] Task 1: Analyze existing code for concrete examples (AC: #1, #6)
  - [x] 1.1 Read `docs/architecture-ACTEE.md` — use as foundation, identify what needs to be made more practical
  - [x] 1.2 Read a complete domain as exemplar: `src/app/domains/agents/` (store, api, models, forms)
  - [x] 1.3 Read a complete feature as exemplar: `src/app/features/agents/`
  - [x] 1.4 Read a page module as exemplar: `src/app/pages/agents/`
  - [x] 1.5 Note patterns for mutations, form creation, list/detail conventions

- [x] Task 2: Write architecture overview section (AC: #1)
  - [x] 2.1 Describe the 3-layer flow: domain (data) -> feature (behavior) -> pages (routing)
  - [x] 2.2 Explain what belongs in each layer — stores, APIs, models in domain; facades, derived stores, UI in feature; routes and layout in pages
  - [x] 2.3 Include a simple directory tree showing the pattern

- [x] Task 3: Write "Create a New Domain" checklist (AC: #2)
  - [x] 3.1 Step-by-step: create models file (`xxx.models.ts`)
  - [x] 3.2 Step-by-step: create API service (`xxx.api.ts`) with `httpMutation` methods
  - [x] 3.3 Step-by-step: create domain store (`xxx.store.ts`) with `signalStore`, `withState`, `withCursorPagination`, `withMutations`
  - [x] 3.4 Step-by-step: create form factory (`forms/xxx.form.ts`) with `createXxxForm()`
  - [x] 3.5 Reference exact file paths from `agents` domain as template

- [x] Task 4: Write "Create a New Feature" checklist (AC: #3)
  - [x] 4.1 Step-by-step: create derived feature store (`xxx.store.ts` in features)
  - [x] 4.2 Step-by-step: create facade (`xxx.facade.ts`) — readonly signals, async CRUD with toast+navigate
  - [x] 4.3 Step-by-step: create list component (`xxx-list.component.ts`) — DataTable, filters, `hasLoaded` guard
  - [x] 4.4 Step-by-step: create detail component (`xxx-detail.component.ts`) — MetadataGrid, `clearSelection` on destroy
  - [x] 4.5 Step-by-step: create form component (`xxx-form.component.ts`) — SaveBar, reactive form binding
  - [x] 4.6 Step-by-step: create page and routes (`pages/xxx/`)
  - [x] 4.7 Reference exact file paths from `agents` feature as template

- [x] Task 5: Write patterns reference sections (AC: #4, #5)
  - [x] 5.1 Mutation patterns: `withMutations` in store, `httpMutation` in API — show real signatures
  - [x] 5.2 Form patterns: `createXxxForm()` factory, reactive forms, SaveBar integration
  - [x] 5.3 List patterns: DataTable columns, filter config, cursor pagination hook, `hasLoaded` empty state guard
  - [x] 5.4 Detail patterns: MetadataGrid config, skeleton loading, `ngOnDestroy` with `facade.clearSelection()`
  - [x] 5.5 Date formatting: `formatDateFr()` from `@app/shared/utils/format-date`, MetadataGrid `type: 'date'`

- [x] Task 6: Verify under 500 lines (AC: #6)
  - [x] 6.1 Count lines in `docs/actee-developer-guide.md` — must be under 500
  - [x] 6.2 Trim any verbose sections — favor tables, code snippets, and bullet points over prose

## Dev Notes

(unchanged from original)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

### Completion Notes List

- Read `docs/architecture-ACTEE.md` as foundation, then made it practical with real code examples
- Analyzed complete agent domain (store, api, models, forms) and feature (feature store, facade, list/detail/form, page/routes)
- Wrote architecture overview with 3-layer diagram (domain → feature → pages) and directory tree
- Wrote "Create a New Domain" section with complete code templates for models, API, store, form
- Wrote "Create a New Feature" section with feature store, facade, list/detail/form components, page+routes
- Wrote naming conventions table covering files, stores, facades, APIs, forms, models, components
- Wrote pattern reference covering mutations (concatOp/exhaustOp), date formatting, shared components table
- Documented domain folder naming inconsistency (singular `building/`/`site/` vs plural convention)
- Final line count: 373 lines (under 500 limit)
- All code examples reference real patterns from the agents domain

### File List

- `docs/actee-developer-guide.md` (new)
