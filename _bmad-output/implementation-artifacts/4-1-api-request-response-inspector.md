# Story 4.1: API Request/Response Inspector

Status: review

## Story

As a developer (Alex),
I want to view the last API request URL and full response payload on any entity detail page,
so that I can validate API behavior and diagnose issues without opening Postman or browser DevTools.

## Acceptance Criteria

1. **Given** an operator is viewing any entity detail page (FP, AT, AM, FM, IM, Community, Agent) **When** they open the API Inspector panel **Then** the last API request URL is displayed (FR32) **And** the full response payload is displayed in a readable format
2. **Given** the ApiInspector shared component **When** inspecting its implementation **Then** it is a purely presentational component in `shared/components/api-inspector/` **And** it receives request/response data via `input()` signals **And** it has no domain knowledge or facade access
3. **Given** an API call is made on a detail page (e.g., loading entity data, saving changes) **When** the response is received **Then** the API Inspector updates with the latest request URL and response body
4. **Given** the inspector displays a response **When** an operator views it **Then** the JSON is formatted and readable **And** the operator can copy the response payload
5. **Given** the inspector panel **When** it is rendered on a detail page **Then** it is collapsible (closed by default) to avoid visual noise **And** toggling it open/closed is smooth and immediate

## Tasks / Subtasks

- [x] Task 1: Create ApiInspectorService (AC: #3)
  - [x] Create `src/app/shared/services/api-inspector.service.ts`
  - [x] Signal-based service with `{ providedIn: 'root' }`
  - [x] Stores `lastRequestUrl: WritableSignal<string | null>` and `lastResponseBody: WritableSignal<unknown>(null)`
  - [x] `capture(url: string, body: unknown)` method to update both signals
  - [x] `clear()` method to reset to null
  - [x] Write spec: `api-inspector.service.spec.ts`

- [x] Task 2: Create apiInspectorInterceptor (AC: #3)
  - [x] Create `src/app/core/api/api-inspector.interceptor.ts` as functional `HttpInterceptorFn`
  - [x] Inject `ApiInspectorService`
  - [x] On successful responses: capture `req.urlWithParams` and `response.body` into the service
  - [x] Filter: only capture requests whose URL starts with `environment.apiBaseUrl` (skip non-API calls)
  - [x] Use `tap()` operator — do NOT interfere with the response stream
  - [x] Register in `app.config.ts`: add to `withInterceptors([authInterceptor, apiInspectorInterceptor])`
  - [x] Write spec: `api-inspector.interceptor.spec.ts`

- [x] Task 3: Create ApiInspectorComponent (AC: #1, #2, #4, #5)
  - [x] Create `src/app/shared/components/api-inspector/api-inspector.component.ts`
  - [x] Inputs: `requestUrl = input<string | null>(null)`, `responseBody = input<unknown>(null)`
  - [x] Collapsible panel: `isOpen = signal(false)` toggle, closed by default
  - [x] Header: "API Inspector" label with chevron toggle icon
  - [x] Request URL section: display in monospace font (`font-mono text-sm`)
  - [x] Response body: `JSON.stringify(body, null, 2)` rendered in a `<pre><code>` block with monospace font
  - [x] Copy button: uses `navigator.clipboard.writeText()` on the formatted JSON
  - [x] Copy feedback: button text changes to "Copied!" for 2 seconds then reverts
  - [x] Empty state: "No API data captured yet" when both inputs are null
  - [x] Write spec: `api-inspector.component.spec.ts`

- [x] Task 4: Integrate into all 7 detail components (AC: #1)
  - [x] Each detail component: import `ApiInspectorComponent` and `ApiInspectorService`
  - [x] Inject `ApiInspectorService` as `readonly inspectorService = inject(ApiInspectorService)`
  - [x] Add `<app-api-inspector [requestUrl]="inspectorService.lastRequestUrl()" [responseBody]="inspectorService.lastResponseBody()" />` at the bottom of each detail template, AFTER all existing content but BEFORE any save bar
  - [x] Files to modify (7 total):
    - `src/app/features/funding-programs/ui/funding-program-detail.component.ts`
    - `src/app/features/action-themes/ui/action-theme-detail.component.ts`
    - `src/app/features/action-models/ui/action-model-detail.component.ts`
    - `src/app/features/folder-models/ui/folder-model-detail.component.ts`
    - `src/app/features/indicator-models/ui/indicator-model-detail.component.ts`
    - `src/app/features/communities/ui/community-detail.component.ts`
    - `src/app/features/agents/ui/agent-detail.component.ts`

- [x] Task 5: Tests (AC: #1-5)
  - [x] ApiInspectorService spec: capture/clear, signal reactivity
  - [x] apiInspectorInterceptor spec: captures API calls, ignores non-API URLs, doesn't interfere with response
  - [x] ApiInspectorComponent spec: collapsed by default, toggle open/close, displays URL and formatted JSON, copy button, empty state
  - [x] Verify existing detail component specs still pass (no regressions)

## Dev Notes

### Architecture Compliance

**ACTEE Layer Placement:**
- `ApiInspectorService` → `shared/services/` (shared infrastructure, no domain knowledge)
- `apiInspectorInterceptor` → `core/api/` (infrastructure concern, alongside auth interceptor)
- `ApiInspectorComponent` → `shared/components/api-inspector/` (purely presentational)
- NO domain store changes, NO facade changes, NO feature store changes

**Interceptor Chain:**
- Current chain in `app.config.ts:12`: `provideHttpClient(withInterceptors([authInterceptor]))`
- Add inspector interceptor: `withInterceptors([authInterceptor, apiInspectorInterceptor])`
- Order matters: auth interceptor adds Bearer token FIRST, then inspector captures the final request/response
- The inspector interceptor must be AFTER auth so the captured URL includes any query params

**Component Pattern:**
- The ApiInspectorComponent is purely presentational — it receives data via `input()` signals only
- It does NOT inject any facade, domain store, or domain service
- The detail component bridges the gap: it injects `ApiInspectorService` and passes signals to the component inputs
- This keeps the component testable and reusable without domain coupling

### Key Implementation Details

**Interceptor Implementation:**
```typescript
export const apiInspectorInterceptor: HttpInterceptorFn = (req, next) => {
  const inspectorService = inject(ApiInspectorService);
  return next(req).pipe(
    tap(event => {
      if (event instanceof HttpResponse && req.url.startsWith(environment.apiBaseUrl)) {
        inspectorService.capture(req.urlWithParams, event.body);
      }
    }),
  );
};
```

**JSON Formatting:** Use `JSON.stringify(body, null, 2)` — do NOT use a third-party JSON viewer library. Plain formatted text in a `<pre>` block is sufficient for v1.

**Copy to Clipboard:** Use the standard `navigator.clipboard.writeText()` API. No need for a fallback — this is an internal desktop-only app on modern browsers.

**Collapsible Panel Styling:**
- Use the same surface/border tokens as existing components: `bg-surface-subtle`, `border border-border`, `rounded-lg`
- Header clickable area with cursor-pointer
- Chevron icon rotates on open (CSS transform or SVG swap)
- Content hidden with `@if (isOpen())` — no animation needed for v1

### Anti-Patterns to Avoid

- **DO NOT** create a custom HTTP client wrapper — use the standard Angular interceptor pattern
- **DO NOT** store request/response history (array of past calls) — only the LAST request/response is needed
- **DO NOT** add the inspector to list views — only detail pages (per FR32)
- **DO NOT** use `console.log` or `console.table` for debugging — the inspector replaces that need
- **DO NOT** import HttpResponse from the wrong package — use `import { HttpResponse } from '@angular/common/http'`
- **DO NOT** make the inspector panel a route or dialog — it's an inline collapsible section at the bottom of the detail page

### Project Structure Notes

Files to CREATE:
```
src/app/shared/services/api-inspector.service.ts
src/app/shared/services/api-inspector.service.spec.ts
src/app/shared/components/api-inspector/api-inspector.component.ts
src/app/shared/components/api-inspector/api-inspector.component.spec.ts
src/app/core/api/api-inspector.interceptor.ts
src/app/core/api/api-inspector.interceptor.spec.ts
```

Files to MODIFY:
```
src/app/app.config.ts                                                    (add interceptor to chain)
src/app/features/funding-programs/ui/funding-program-detail.component.ts (add inspector)
src/app/features/action-themes/ui/action-theme-detail.component.ts       (add inspector)
src/app/features/action-models/ui/action-model-detail.component.ts       (add inspector)
src/app/features/folder-models/ui/folder-model-detail.component.ts       (add inspector)
src/app/features/indicator-models/ui/indicator-model-detail.component.ts  (add inspector)
src/app/features/communities/ui/community-detail.component.ts            (add inspector)
src/app/features/agents/ui/agent-detail.component.ts                     (add inspector)
```

### UX Design Reference

From UX spec — ApiInspector is listed as a Phase 4 component:
- Collapsible panel at bottom of detail pages
- Monospace font for URL and JSON response
- Copy-to-clipboard button
- Clean, unobtrusive — developer tool, not operator-facing feature
- Color: use `bg-surface-subtle` background, `text-text-secondary` for labels, `font-mono` for data

### Previous Story Intelligence

**From Story 3.6 (JSONLogic Rule Input):**
- Build completed clean with 314 tests passing across 43 test files
- Simple approaches win: `JSON.parse()` sufficed for validation (no schema validators needed)
- Keep v1 scope minimal — defer visual polish to later stories
- The shared component pattern (RuleField) worked well: presentational component with inputs, no domain coupling

**From Git History:**
- Commit pattern: epic-scoped commits with pre-review/post-review cycle
- All shared components are standalone with co-located specs
- Existing interceptor uses functional `HttpInterceptorFn` pattern (not class-based)
- Test pattern: `TestBed` with `provideHttpClient()` + `provideHttpClientTesting()` + `HttpTestingController`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.1]
- [Source: _bmad-output/planning-artifacts/prd.md#FR32 - Developer Tooling]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#ApiInspector Component]
- [Source: _bmad-output/planning-artifacts/architecture.md#Shared Components]
- [Source: src/app/core/auth/auth.interceptor.ts - existing interceptor pattern]
- [Source: src/app/app.config.ts:12 - interceptor registration]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- Fixed test: replaced Jasmine `spyOn`/`fakeAsync`/`tick` with Vitest `vi.spyOn`/`vi.useFakeTimers`/`vi.advanceTimersByTime`
- Fixed test: mocked `navigator.clipboard` object (not available in jsdom test environment)

### Completion Notes List
- Created ApiInspectorService as signal-based root service with capture/clear methods
- Created apiInspectorInterceptor as functional HttpInterceptorFn, filters by apiBaseUrl, uses tap() to avoid interfering with response stream
- Created ApiInspectorComponent as purely presentational with input signals, collapsible panel, JSON formatting, copy-to-clipboard
- Integrated into all 7 detail components (FP, AT, AM, FM, IM, Community, Agent) — placed after content, before save bar
- Registered interceptor in app.config.ts after authInterceptor
- All 334 tests pass across 46 files, zero regressions

### Change Log
- 2026-03-05: Implemented Story 4.1 — API Request/Response Inspector

### File List
New:
- src/app/shared/services/api-inspector.service.ts
- src/app/shared/services/api-inspector.service.spec.ts
- src/app/shared/components/api-inspector/api-inspector.component.ts
- src/app/shared/components/api-inspector/api-inspector.component.spec.ts
- src/app/core/api/api-inspector.interceptor.ts
- src/app/core/api/api-inspector.interceptor.spec.ts

Modified:
- src/app/app.config.ts
- src/app/features/funding-programs/ui/funding-program-detail.component.ts
- src/app/features/action-themes/ui/action-theme-detail.component.ts
- src/app/features/action-models/ui/action-model-detail.component.ts
- src/app/features/folder-models/ui/folder-model-detail.component.ts
- src/app/features/indicator-models/ui/indicator-model-detail.component.ts
- src/app/features/communities/ui/community-detail.component.ts
- src/app/features/agents/ui/agent-detail.component.ts
