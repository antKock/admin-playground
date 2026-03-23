# Story 17.1: Document withCursorPagination Pattern

Status: review

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

- [x] Task 1: Read and analyze `withCursorPagination` source (AC: #1, #2)
  - [x] 1.1 Read `src/app/domains/shared/with-cursor-pagination.ts` — extract all state, computed, and method signatures
  - [x] 1.2 Identify `FilterParams` type definition and format
  - [x] 1.3 Trace filter persistence logic — how filters are stored between `loadMore()` calls vs reset on `load()`
  - [x] 1.4 Identify the `httpFetch` / API integration pattern used internally

- [x] Task 2: Read an example domain store for integration pattern (AC: #3)
  - [x] 2.1 Read `src/app/domains/action-models/action-model.store.ts` — identify how `withCursorPagination` is composed into the store
  - [x] 2.2 Read `src/app/domains/action-models/action-model.api.ts` — identify the API method signature expected by the pagination feature
  - [x] 2.3 Note the `withFeature(withCursorPagination(...))` call pattern and required config

- [x] Task 3: Write documentation (AC: #1, #2, #3, #4)
  - [x] 3.1 Write header: purpose and approach (cursor-based pagination, not offset)
  - [x] 3.2 Write "State" section: `items`, `cursor`, `hasMore`, `isLoading`, `error`, `totalCount`
  - [x] 3.3 Write "Computed" section: `isEmpty`, `totalLoaded`
  - [x] 3.4 Write "Methods" section with behavior for each: `load(filters)`, `loadMore()`, `refresh(filters?)`, `loadAll(filters)`, `reset()`
  - [x] 3.5 Write "Filter Persistence" section — explain how filters persist between `loadMore()` and `refresh()`
  - [x] 3.6 Write "When to Use Which Method" decision table: `load()` vs `refresh()` vs `loadAll()`
  - [x] 3.7 Write "FilterParams Format" section
  - [x] 3.8 Write "Integration Example" section using real code from `action-model.store.ts`
  - [x] 3.9 Output file: `docs/with-cursor-pagination.md`

- [x] Task 4: Verify accuracy (AC: #5)
  - [x] 4.1 Cross-check every documented method signature against source code
  - [x] 4.2 Cross-check every documented state property against source code
  - [x] 4.3 Verify integration example compiles conceptually against the actual store pattern

## Dev Notes

(unchanged from original)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

### Completion Notes List

- Read and analyzed `with-cursor-pagination.ts` (222 lines): extracted all state, computed, methods, filter persistence logic
- Read `action-model.store.ts` and `action-model.api.ts` for integration example
- Identified `FilterParams = Record<string, string | string[]>` type
- Traced filter persistence: `load()` stores new filters, `loadMore()` reuses, `refresh(undefined)` reuses, `refresh(filters)` stores new
- Documented all 6 state signals, 2 computed, 5 methods with behavior descriptions
- Included filter persistence flow diagram, "when to use which method" decision table, FilterParams format with examples
- Integration example uses real code from action-model domain (store + api + facade)
- Cross-verified all signatures against source: method names, parameter types, return types, internal behavior all accurate
- Document is 178 lines, reference format with tables and code blocks

### File List

- `docs/with-cursor-pagination.md` (new)
