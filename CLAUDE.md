# CLAUDE.md — Admin Playground

## Required Reading

Before any feature work, read **[docs/actee-developer-guide.md](docs/actee-developer-guide.md)** — it defines the ACTEE architecture pattern (Domain → Feature → Pages), naming conventions, and templates for every layer.

## Commands

- **Build:** `npx ng build`
- **Test:** `npx ng test --no-watch` (never use `npx vitest run` — the Angular builder configures vitest internally)
- **Lint:** `npx ng lint`
- **Format check:** `npx prettier --check "src/**/*.{ts,css,html}"`

## Architecture Rules

- **ACTEE pattern:** Domain stores → Feature stores → Facades → Components
- **Components only talk to their facade** — never to stores or APIs directly
- **Signals only** — no Observables in components; use `signal`, `computed`, `input`, `output`, `effect`
- **Feature stores are read-only** — only `withComputed`, no mutations
- **Mutation status signals** (`createMutationIsPending`, etc.) are exposed by the facade directly from the domain store, never through the feature store
- **Domain store composition order:** `withState → withProps → withFeature(pagination) → withMutations → withMethods`

## Conventions

- **Path aliases:** `@app/`, `@shared/`, `@domains/`, `@features/`, `@core/`
- **Date formatting:** use `formatDateFr()` from `@app/shared/utils/format-date`, or `type: 'date'` in MetadataGrid/DataTable
- **Detail components:** must call `facade.clearSelection()` in `ngOnDestroy`
- **List components:** must have a `hasLoaded` signal guard on empty state
- **Form components:** implement `HasUnsavedChanges` interface for `unsavedChangesGuard`
- **Toasts are in French** — facades handle toast messages and navigation

## Tech Stack

- Angular 21, standalone components
- `@ngrx/signals` for state management
- `@angular-architects/ngrx-toolkit` for `httpMutation`
- Tailwind CSS
- Vitest (via Angular builder — no `vitest.config.ts`)
