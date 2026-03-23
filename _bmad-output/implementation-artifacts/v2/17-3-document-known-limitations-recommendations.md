# Story 17.3: Document Known Limitations & Recommendations

Status: ready-for-dev

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

- [ ] Task 1: Review v2 story completion notes for discovered limitations (AC: #1, #3)
  - [ ] 1.1 Read `_bmad-output/implementation-artifacts/v2/sprint-status.yaml` for any noted issues or blockers
  - [ ] 1.2 Read completion notes in all v2 story files under `_bmad-output/implementation-artifacts/v2/`
    - `15-1-externalize-templates-styles-shared-components.md`
    - `15-2-externalize-templates-feature-core-components.md`
    - `15-3-co-locate-api-inspector-files.md`
  - [ ] 1.3 Read `_bmad-output/implementation-artifacts/v2/v2-technical-analysis.md` for architectural observations
  - [ ] 1.4 Scan `_bmad-output/` root for any issue/observation files:
    - `_bmad-output/api-observations.md`
    - `_bmad-output/backend-issues-uat-epics-12-15.md`
    - `_bmad-output/backend-work-summary.md`
    - `_bmad-output/code-review-response.md`
    - `_bmad-output/uat-epics-12-15.md`
  - [ ] 1.5 Compile a list of all discovered limitations and categorize as frontend vs backend

- [ ] Task 2: Document double API call limitation (AC: #2, #5)
  - [ ] 2.1 Describe the limitation: list components must make two API calls — one paginated for table data, one unpaginated for filter dropdown options
  - [ ] 2.2 Explain why: backend does not expose a dedicated `/options` or `/filters` endpoint for dropdown values
  - [ ] 2.3 Document current workaround: `loadAll()` or separate fetch for filter population
  - [ ] 2.4 Recommend resolution: backend should provide `/options` or `/filters` endpoint per resource
  - [ ] 2.5 Reference affected components — all list components under `src/app/features/*/ui/*-list.component.ts`

- [ ] Task 3: Document any other discovered limitations (AC: #3, #5)
  - [ ] 3.1 For each limitation found in Task 1: write what, why, and recommended resolution
  - [ ] 3.2 Categorize each as: frontend limitation, backend dependency, or architectural trade-off
  - [ ] 3.3 Possible limitations to investigate (verify from source/notes):
    - Singular vs plural domain folder naming inconsistency (`building` vs `buildings`, `site` vs `sites`)
    - No offline/cache strategy for API data
    - No optimistic updates on mutations (all mutations wait for server response)
    - No request deduplication or cancellation
    - History/activity feed may have performance concerns at scale

- [ ] Task 4: Write future recommendations section (AC: #4)
  - [ ] 4.1 List improvements that were considered but deferred from v2 scope
  - [ ] 4.2 For each recommendation: describe the improvement, estimated effort, and priority
  - [ ] 4.3 Possible recommendations to consider:
    - Backend filter/options endpoints
    - Request caching layer
    - Optimistic mutation support
    - Folder naming normalization (singular vs plural)
    - FormFieldComponent migration for remaining forms (if applicable)
    - E2E test coverage
    - Storybook for shared components

## Dev Notes

- **Primary input files to read for discovered limitations:**
  - `_bmad-output/implementation-artifacts/v2/sprint-status.yaml`
  - `_bmad-output/implementation-artifacts/v2/v2-technical-analysis.md`
  - `_bmad-output/api-observations.md` (if it still exists — git shows deleted)
  - `_bmad-output/backend-issues-uat-epics-12-15.md` (if it still exists — git shows deleted)
  - `_bmad-output/backend-work-summary.md` (if it still exists — git shows deleted)
  - `_bmad-output/uat-epics-12-15.md` (if it still exists — git shows deleted)
- **Note:** Several `_bmad-output/` files show as deleted in git status. The agent should check `git show HEAD:path` to recover content if needed, or check if they exist in the working tree.
- **Double API call pattern — affected list components:**
  - `src/app/features/action-models/ui/action-model-list.component.ts`
  - `src/app/features/action-themes/ui/action-theme-list.component.ts`
  - `src/app/features/agents/ui/agent-list.component.ts`
  - `src/app/features/buildings/ui/building-list.component.ts`
  - `src/app/features/communities/ui/community-list.component.ts`
  - `src/app/features/folder-models/ui/folder-model-list.component.ts`
  - `src/app/features/funding-programs/ui/funding-program-list.component.ts`
  - `src/app/features/indicator-models/ui/indicator-model-list.component.ts`
  - `src/app/features/sites/ui/site-list.component.ts`
  - `src/app/features/users/ui/user-list.component.ts`
- **Domain folder naming inconsistency:**
  - Singular: `src/app/domains/building/`, `src/app/domains/site/`
  - Plural: `src/app/domains/agents/`, `src/app/domains/communities/`, `src/app/domains/users/`, etc.
  - Feature folders are all plural: `src/app/features/buildings/`, `src/app/features/sites/`
- **Output file:** `docs/known-limitations.md`
- **Format:** Use a consistent template per limitation entry: heading, description, category (frontend/backend/architectural), current workaround (if any), recommended resolution

### Project Structure Notes

- Files to create:
  - `docs/known-limitations.md`

### References

- [Source: _bmad-output/planning-artifacts/v2/epics.md#Story 17.3]
- [Source: _bmad-output/implementation-artifacts/v2/v2-technical-analysis.md]
- [Source: _bmad-output/implementation-artifacts/v2/sprint-status.yaml]
- [Source: docs/architecture-ACTEE.md]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
