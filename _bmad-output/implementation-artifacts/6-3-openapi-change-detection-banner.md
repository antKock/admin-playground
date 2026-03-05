# Story 6.3: OpenAPI Change Detection Banner

Status: ready-for-dev

## Story

As a developer using the admin dashboard, I want to be notified when the API's OpenAPI spec has changed since the last type generation, so that I can regenerate types and avoid runtime mismatches.

## Acceptance Criteria

1. After the app loads, a background fetch retrieves the live `openapi.json` from the staging API endpoint.
2. The fetch is non-blocking — the app loads and functions normally regardless of whether the check succeeds or fails.
3. If the fetch fails (network error, timeout, non-200 response), it fails silently with a console warning. No UI impact.
4. The fetched spec is compared against a stored baseline hash (SHA-256 of the last-known spec, stored in `localStorage`).
5. If no baseline exists (first run), the current spec hash is saved as the baseline. No warning shown.
6. If the hashes differ, an amber/orange warning banner appears at the top of the app (above the navigation sidebar).
7. The banner collapsed state shows: warning icon + "Le schéma API a changé depuis la dernière synchronisation" + expand chevron.
8. The banner expanded state shows a summary of changes: added/removed/modified paths and schemas, listed in a compact format.
9. A "Ignorer" (dismiss) button hides the banner. Dismissal is stored per-hash in `localStorage` — the banner won't reappear for the same change.
10. When `scripts/generate-api-types.sh` is run, it also updates the baseline hash in a committed file (e.g., `.openapi-baseline.sha256`) so the app can use it as the initial reference.
11. The change detection compares OpenAPI `paths` keys and `components.schemas` keys to produce a human-readable diff summary.

## Tasks

- [ ] Task 1: Create `OpenApiWatcherService` — injectable service with `changes: Signal<OpenApiChange[] | null>` (AC: #1, #2, #3, #4, #5)
- [ ] Task 2: Implement SHA-256 hashing via `crypto.subtle.digest()` for spec comparison (AC: #4)
- [ ] Task 3: Implement lightweight diff logic — compare `paths` keys and `components.schemas` keys between stored and fetched specs (AC: #11)
- [ ] Task 4: Create `OpenApiBannerComponent` — expandable amber banner with collapsed/expanded states (AC: #6, #7, #8)
- [ ] Task 5: Implement dismiss logic — store dismissed hash in `localStorage`, don't show banner for same hash (AC: #9)
- [ ] Task 6: Integrate banner into `AppComponent` shell — render above the router outlet / sidebar (AC: #6)
- [ ] Task 7: Update `scripts/generate-api-types.sh` to also save baseline hash to `.openapi-baseline.sha256` and `localStorage`-compatible format (AC: #10)
- [ ] Task 8: Trigger the watcher service on app init (use `APP_INITIALIZER` or `afterNextRender` in app component) (AC: #1, #2)
- [ ] Task 9: Unit tests for `OpenApiWatcherService` (hash, diff, silent failure) and `OpenApiBannerComponent` (expand/collapse, dismiss)

## Dev Notes

### Architecture

```
App loads → OpenApiWatcherService.check() called
  → fetch('https://laureatv2-api-staging.osc-fr1.scalingo.io/openapi.json')
  → hash response with SHA-256
  → compare to localStorage['openapi-baseline-hash']
  → if different:
      → parse both specs (stored full spec + new full spec)
      → diff paths + schemas keys
      → set changes signal
  → if same or first run: no-op
  → if fetch fails: console.warn(), no-op
```

### Key Decisions
- Use `fetch()` directly, NOT `HttpClient` — avoids interference with API interceptors and error handlers
- Store both the hash AND the full spec JSON in `localStorage` for diff computation (key: `openapi-baseline-hash`, `openapi-baseline-spec`)
- The banner lives in the app shell, outside the router — visible on all pages
- Use `crypto.subtle.digest('SHA-256', ...)` — native browser API, no library needed
- Diff is structural (key-level), not deep content diff — enough to surface what changed

### Change Detection Logic
```typescript
interface OpenApiChange {
  type: 'added' | 'removed' | 'modified';
  category: 'path' | 'schema';
  name: string;
}

// Compare paths: Object.keys(oldSpec.paths) vs Object.keys(newSpec.paths)
// Compare schemas: Object.keys(oldSpec.components.schemas) vs Object.keys(newSpec.components.schemas)
// For keys present in both: JSON.stringify deep equality check → 'modified' if different
```

### Key Files
| File | Role |
|------|------|
| `src/app/core/services/openapi-watcher.service.ts` | New — background check + diff logic |
| `src/app/shared/components/openapi-banner/openapi-banner.component.ts` | New — expandable warning banner |
| `src/app/app.component.ts` | Add banner + trigger service |
| `scripts/generate-api-types.sh` | Add baseline hash generation |

### Styling
- Banner background: amber/orange (`#fef3c7` bg, `#92400e` text, `#f59e0b` border-left)
- Collapsed: single line, 40px height
- Expanded: scrollable list, max-height 300px
- Position: fixed top or sticky top, full width, z-index above everything

### Anti-Patterns
- Do NOT block app loading on the fetch
- Do NOT use HttpClient (keep decoupled from app's HTTP layer)
- Do NOT deep-diff the entire spec — structural key comparison is sufficient
- Do NOT show errors to the user if the fetch fails
