# Story 17.1: Document withCursorPagination Pattern

Status: ready-for-dev

## Story

As a developer new to the project,
I want comprehensive documentation of the `withCursorPagination` store feature,
so that I can integrate cursor-based pagination into new domain stores without reading the source code.

## Acceptance Criteria

1. Documentation file `docs/with-cursor-pagination.md` exists and covers purpose, approach (cursor-based, not offset), and all exposed API
2. All exposed state (`items`, `cursor`, `hasMore`, `isLoading`, `error`, `totalCount`), computed (`isEmpty`, `totalLoaded`), and methods (`load`, `loadMore`, `refresh`, `loadAll`, `reset`) are documented with behavior descriptions
3. Documentation includes: filter persistence behavior, when to use `load()` vs `refresh()` vs `loadAll()`, `FilterParams` format, and a complete integration example from an existing domain store
4. Documentation is concise and developer-oriented (reference format, not tutorial)
5. All documented behavior is verified accurate against the source code

## Tasks / Subtasks

- [ ] Task 1: Read and analyze `withCursorPagination` source (AC: #1, #2)
  - [ ] 1.1 Read `src/app/domains/shared/with-cursor-pagination.ts` — extract all state, computed, and method signatures
  - [ ] 1.2 Identify `FilterParams` type definition and format
  - [ ] 1.3 Trace filter persistence logic — how filters are stored between `loadMore()` calls vs reset on `load()`
  - [ ] 1.4 Identify the `httpFetch` / API integration pattern used internally

- [ ] Task 2: Read an example domain store for integration pattern (AC: #3)
  - [ ] 2.1 Read `src/app/domains/action-models/action-model.store.ts` — identify how `withCursorPagination` is composed into the store
  - [ ] 2.2 Read `src/app/domains/action-models/action-model.api.ts` — identify the API method signature expected by the pagination feature
  - [ ] 2.3 Note the `withFeature(withCursorPagination(...))` call pattern and required config

- [ ] Task 3: Write documentation (AC: #1, #2, #3, #4)
  - [ ] 3.1 Write header: purpose and approach (cursor-based pagination, not offset)
  - [ ] 3.2 Write "State" section: `items`, `cursor`, `hasMore`, `isLoading`, `error`, `totalCount`
  - [ ] 3.3 Write "Computed" section: `isEmpty`, `totalLoaded`
  - [ ] 3.4 Write "Methods" section with behavior for each: `load(filters)`, `loadMore()`, `refresh(filters?)`, `loadAll(filters)`, `reset()`
  - [ ] 3.5 Write "Filter Persistence" section — explain how filters persist between `loadMore()` and `refresh()`
  - [ ] 3.6 Write "When to Use Which Method" decision table: `load()` vs `refresh()` vs `loadAll()`
  - [ ] 3.7 Write "FilterParams Format" section
  - [ ] 3.8 Write "Integration Example" section using real code from `action-model.store.ts`
  - [ ] 3.9 Output file: `docs/with-cursor-pagination.md`

- [ ] Task 4: Verify accuracy (AC: #5)
  - [ ] 4.1 Cross-check every documented method signature against source code
  - [ ] 4.2 Cross-check every documented state property against source code
  - [ ] 4.3 Verify integration example compiles conceptually against the actual store pattern

## Dev Notes

- **Primary source file:** `src/app/domains/shared/with-cursor-pagination.ts`
- **Example integration stores (pick one as primary, reference others):**
  - `src/app/domains/action-models/action-model.store.ts`
  - `src/app/domains/agents/agent.store.ts`
  - `src/app/domains/communities/community.store.ts`
- **Example API services (for understanding the fetch function signature):**
  - `src/app/domains/action-models/action-model.api.ts`
- **Output file:** `docs/with-cursor-pagination.md`
- **Format:** Developer reference — use tables for state/computed, code blocks for method signatures, keep prose minimal
- This is a custom store feature (not from `@ngrx/signals` directly) — document what makes it project-specific
- The pagination is cursor-based: the API returns a `cursor` token, and `loadMore()` passes it back to fetch the next page
- `loadAll()` is a convenience that loops `loadMore()` until `hasMore` is false — document when this is appropriate vs. dangerous (large datasets)
- `FilterParams` is likely a `Record<string, string | string[]>` or similar — verify from source

### Project Structure Notes

- Files to create:
  - `docs/with-cursor-pagination.md`

### References

- [Source: _bmad-output/planning-artifacts/v2/epics.md#Story 17.1]
- [Source: docs/architecture-ACTEE.md]
- [Source: src/app/domains/shared/with-cursor-pagination.ts]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
