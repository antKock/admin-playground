# Story 17.3: Document Known Limitations & Recommendations

Status: review

## Story

As a developer maintaining the project,
I want a clear list of known limitations and future recommendations,
so that I understand trade-offs and don't waste time on known issues.

## Acceptance Criteria

1. Documentation file `docs/known-limitations.md` exists and is organized by category (frontend limitations vs backend dependencies)
2. The double API call for filter dropdowns limitation is documented with: what it is, why it exists, and the recommended resolution (backend `/options` or `/filters` endpoint)
3. All other limitations discovered during v2 implementation are documented (collected from story completion notes in prior stories)
4. Future recommendations section lists improvements deferred from v2 with rationale
5. Each entry clearly states: what the limitation is, why it exists, and the recommended resolution

## Tasks / Subtasks

- [x] Task 1: Review v2 story completion notes for discovered limitations (AC: #1, #3)
  - [x] 1.1 Read `_bmad-output/implementation-artifacts/v2/sprint-status.yaml` for any noted issues or blockers
  - [x] 1.2 Read completion notes in all v2 story files under `_bmad-output/implementation-artifacts/v2/`
  - [x] 1.3 Read `_bmad-output/implementation-artifacts/v2/v2-technical-analysis.md` for architectural observations
  - [x] 1.4 Scan `_bmad-output/` root for any issue/observation files
  - [x] 1.5 Compile a list of all discovered limitations and categorize as frontend vs backend

- [x] Task 2: Document double API call limitation (AC: #2, #5)
  - [x] 2.1 Describe the limitation: list components must make two API calls — one paginated for table data, one unpaginated for filter dropdown options
  - [x] 2.2 Explain why: backend does not expose a dedicated `/options` or `/filters` endpoint for dropdown values
  - [x] 2.3 Document current workaround: `loadAll()` or separate fetch for filter population
  - [x] 2.4 Recommend resolution: backend should provide `/options` or `/filters` endpoint per resource
  - [x] 2.5 Reference affected components — all list components under `src/app/features/*/ui/*-list.component.ts`

- [x] Task 3: Document any other discovered limitations (AC: #3, #5)
  - [x] 3.1 For each limitation found in Task 1: write what, why, and recommended resolution
  - [x] 3.2 Categorize each as: frontend limitation, backend dependency, or architectural trade-off
  - [x] 3.3 Documented limitations: domain folder naming inconsistency, no request deduplication, no optimistic updates, rule parameter string defaults, FormFieldComponent ViewEncapsulation.None, activity feed scale concern

- [x] Task 4: Write future recommendations section (AC: #4)
  - [x] 4.1 List improvements that were considered but deferred from v2 scope
  - [x] 4.2 For each recommendation: describe the improvement, estimated effort, and priority
  - [x] 4.3 Recommendations: backend filter endpoints, E2E tests, Storybook, request caching, folder naming normalization, FormFieldComponent completion, tooltip scroll fix

## Dev Notes

(unchanged from original)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

### Completion Notes List

- Reviewed all v2 story completion notes (Epic 15 stories 15-1 through 15-3, Epic 16 stories 16-1 through 16-8)
- Scanned _bmad-output/ for observation files — most were deleted from git, used v2-technical-analysis.md as primary source
- Found 1 TODO comment in codebase: `ruleForApi()` in action-model.facade.ts referencing backend null defaults migration
- Documented 7 frontend limitations organized by category: double API call, request deduplication, optimistic updates, domain naming, rule defaults, ViewEncapsulation.None, activity feed scale
- Documented 3 backend dependencies: filter endpoints, null defaults, OpenAPI completeness
- Wrote future recommendations table with 7 items including effort and priority estimates
- Each limitation follows consistent format: what, why, current workaround, recommended resolution
- Document is 124 lines, scannable with clear headings and tables

### File List

- `docs/known-limitations.md` (new)
