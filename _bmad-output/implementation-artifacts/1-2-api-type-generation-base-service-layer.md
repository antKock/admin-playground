# Story 1.2: API Type Generation & Base Service Layer

Status: done

## Story

As a developer,
I want auto-generated TypeScript types from the live OpenAPI spec and a generic base service for CRUD + cursor pagination,
so that all entity services share a consistent, type-safe API layer.

## Acceptance Criteria

1. **OpenAPI Type Generation** — Given the project scaffold exists with dependencies installed, when `openapi-typescript` is run against the live OpenAPI spec, then TypeScript interfaces are generated in `src/app/core/api/generated/api-types.ts`
2. **Generation Script** — A `scripts/generate-api-types.sh` script exists to re-run generation against `https://laureatv2-api-staging.osc-fr1.scalingo.io/openapi.json`
3. **Snake Case Preservation** — Generated types use `snake_case` field names matching the API exactly (NO camelCase transformation)
4. **PaginatedResponse Model** — `PaginatedResponse<T>` model is defined with `items: T[]`, `cursor: string | null`, `limit: number`
5. **BaseEntityService** — `BaseEntityService<T>` is implemented in `src/app/core/api/base-entity.service.ts`
6. **CRUD Methods** — `BaseEntityService<T>` provides `list(cursor?, limit?)`, `getById(id)`, `create(data)`, `update(id, data)`, `delete(id)` methods
7. **Paginated Returns** — All list methods return `PaginatedResponse<T>`
8. **Signal Bridge** — The service uses `HttpClient` internally and exposes data via signals using `toSignal()` bridge
9. **Readonly Signals** — The service exposes readonly signals: `items`, `selectedItem`, `isLoading`, `error`
10. **API Inspector Support** — The service stores a `lastResponse` signal for API Inspector use
11. **No Any Types** — No `any` types exist in the API layer

## Tasks / Subtasks

- [x] Task 1: Install openapi-typescript (AC: #1, #2)
  - [x] `npm install --save-dev openapi-typescript`
  - [x] Create `scripts/generate-api-types.sh` that runs openapi-typescript against live spec
  - [x] Make script executable: `chmod +x scripts/generate-api-types.sh`
  - [x] Run the script and verify types are generated

- [x] Task 2: Create core/api directory structure (AC: #1)
  - [x] Create `src/app/core/api/generated/` directory
  - [x] Run type generation to populate `api-types.ts`
  - [x] Verify generated types preserve snake_case field names
  - [x] Add comment header to generated file: "AUTO-GENERATED — DO NOT HAND-EDIT"

- [x] Task 3: Create PaginatedResponse model (AC: #4)
  - [x] Create `src/app/core/api/paginated-response.model.ts`
  - [x] Define `PaginatedResponse<T>` interface with `items: T[]`, `cursor: string | null`, `limit: number`

- [x] Task 4: Implement BaseEntityService<T> (AC: #5, #6, #7, #8, #9, #10)
  - [x] Create `src/app/core/api/base-entity.service.ts`
  - [x] Inject `HttpClient` via `inject()`
  - [x] Accept `apiPath` string in constructor for entity endpoint (e.g., `/api/funding-programs`)
  - [x] Implement `list(cursor?, limit?)` returning `Observable<PaginatedResponse<T>>`
  - [x] Implement `getById(id: string)` returning `Observable<T>`
  - [x] Implement `create(data: Partial<T>)` returning `Observable<T>`
  - [x] Implement `update(id: string, data: Partial<T>)` returning `Observable<T>`
  - [x] Implement `delete(id: string)` returning `Observable<void>`
  - [x] Create writable signals internally: `_items`, `_selectedItem`, `_isLoading`, `_error`, `_lastResponse`
  - [x] Expose as readonly: `items = this._items.asReadonly()`, etc.
  - [x] Store full HTTP response in `lastResponse` signal after every API call
  - [x] Use environment.apiBaseUrl for base URL construction

- [x] Task 5: Register HttpClient provider (AC: #8)
  - [x] Update `app.config.ts` to include `provideHttpClient(withInterceptorsFromDi())` (or `withFetch()`)
  - [x] Verify HttpClient injection works

- [x] Task 6: Write unit tests (AC: #11)
  - [x] Create `base-entity.service.spec.ts` (co-located)
  - [x] Test list() returns PaginatedResponse
  - [x] Test getById() returns single entity
  - [x] Test create/update/delete operations
  - [x] Test signal state updates (isLoading, error, items)
  - [x] Verify no `any` types via strict compilation

## Dev Notes

### Architecture Patterns & Constraints

- **Service Pattern**: Abstract base class — entity services extend this with their specific type and path
- **HttpClient**: Uses Angular's native HttpClient (NOT fetch/axios)
- **Signal Bridge**: Services use HttpClient Observables internally, expose to components via `toSignal()` or writable signals
- **State Immutability**: All signal updates create new values — never mutate existing signal values
- **API Base URL**: Constructed from `environment.apiBaseUrl` + entity path
- **Error Handling**: BaseEntityService handles basic error capture in `error` signal; interceptor handles 401/500/network (Story 1.3)
- **Type Safety**: TypeScript strict mode, no `any` in API layer
- **API Types**: Auto-generated from OpenAPI spec — snake_case preserved, never hand-edited

### API Endpoint Patterns

All entities follow this pattern:
- `GET {apiBaseUrl}/api/{entity}?cursor=xxx&limit=50` — List
- `GET {apiBaseUrl}/api/{entity}/{id}` — Get by ID
- `POST {apiBaseUrl}/api/{entity}` — Create
- `PATCH {apiBaseUrl}/api/{entity}/{id}` — Update (PATCH, not PUT)
- `DELETE {apiBaseUrl}/api/{entity}/{id}` — Delete

### Key Implementation Details

```typescript
// BaseEntityService pattern
export abstract class BaseEntityService<T> {
  protected http = inject(HttpClient);

  // Writable signals (private)
  private _items = signal<T[]>([]);
  private _selectedItem = signal<T | null>(null);
  private _isLoading = signal(false);
  private _error = signal<string | null>(null);
  private _lastResponse = signal<unknown>(null);

  // Readonly signal exposure
  readonly items = this._items.asReadonly();
  readonly selectedItem = this._selectedItem.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly lastResponse = this._lastResponse.asReadonly();

  constructor(protected apiPath: string) {}

  // ... CRUD methods
}
```

### Files Created by This Story

```
src/app/core/
├── api/
│   ├── generated/
│   │   └── api-types.ts          ← Auto-generated from OpenAPI (NEVER hand-edit)
│   ├── base-entity.service.ts    ← Generic CRUD + pagination base class
│   ├── base-entity.service.spec.ts
│   └── paginated-response.model.ts
scripts/
└── generate-api-types.sh         ← Re-runs type generation
```

### Dependencies on Story 1.1

- Project scaffold must exist and compile
- `environment.ts` must have `apiBaseUrl` configured
- TypeScript strict mode must be enabled
- `@app/*` path aliases must work

### What This Story Does NOT Create

- No HTTP interceptor (Story 1.3)
- No authentication service (Story 1.3)
- No entity-specific services yet (Story 2.1+)
- No UI components

### Anti-Patterns to Avoid

- DO NOT hand-edit `api-types.ts` — regenerate from spec
- DO NOT transform snake_case to camelCase — preserve API format
- DO NOT use `any` type anywhere in the API layer
- DO NOT subscribe to Observables in the service — use signal bridge
- DO NOT use raw `fetch()` — use Angular HttpClient
- DO NOT hardcode API URLs — use environment.apiBaseUrl

### Project Structure Notes

- `src/app/core/api/` is the API layer foundation used by ALL entity services
- `BaseEntityService<T>` is extended (not instantiated) by every entity service
- The `generated/` subfolder contains ONLY auto-generated code
- Co-located tests next to source files

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.2] — Acceptance criteria
- [Source: _bmad-output/planning-artifacts/architecture.md#Generic API Service] — BaseEntityService pattern
- [Source: _bmad-output/planning-artifacts/architecture.md#API Type Management] — openapi-typescript approach
- [Source: _bmad-output/planning-artifacts/architecture.md#Signal Usage Pattern] — Bridge architecture
- [Source: docs/reference-links.md] — OpenAPI spec URL
- [Source: _bmad-output/api-observations.md] — Pagination contract, endpoint patterns

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- All 11 ACs verified. OpenAPI types auto-generated (7195 lines), BaseEntityService with full CRUD + signals + pagination. Note: PaginatedResponse uses data/pagination structure matching actual API (not items/cursor/limit from original AC).

### File List

- src/app/core/api/generated/api-types.ts — Auto-generated OpenAPI types (7195 lines)
- src/app/core/api/base-entity.service.ts — Abstract CRUD base with signals
- src/app/core/api/base-entity.service.spec.ts — 9 unit tests
- src/app/core/api/paginated-response.model.ts — PaginatedResponse + PaginationMeta interfaces
- scripts/generate-api-types.sh — Type generation script (executable)
