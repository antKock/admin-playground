# Admin Playground — Lauréat v2 Admin Panel

Internal administration panel for managing the Lauréat v2 platform configuration: funding programs, action models, indicator models, communities, agents, and more.

## Stack

- **Angular 21** (standalone components, signals, NgRx Signal Store)
- **Tailwind CSS 4** for styling
- **CodeMirror 6** for JSONLogic rule editing
- **Vitest** for unit tests (via Angular's `@angular/build:unit-test` builder)
- **Vercel** for deployment (with API proxy to the staging backend)

## Getting started

```bash
npm install
npm start          # → http://localhost:4200
```

The dev server proxies API calls via Vercel rewrites (see `vercel.json`).
In production, `/api/*` is rewritten to the staging API at `laureatv2-api-staging.osc-fr1.scalingo.io`.

## Key commands

| Command | Description |
|---------|-------------|
| `npm start` | Start dev server |
| `npm run build` | Production build (output in `dist/`) |
| `npm test` | Run unit tests — **must use `ng test`**, not `npx vitest` directly (Angular builder handles Vitest config internally) |
| `npm run lint` | ESLint |

## API type generation

TypeScript types are auto-generated from the OpenAPI spec. Regenerate after API changes:

```bash
bash scripts/generate-api-types.sh
```

This fetches the OpenAPI JSON from the staging API and outputs types to `src/app/core/api/generated/api-types.ts`.

## Architecture

This project follows the **ACTEE pattern** — a layered architecture separating domain logic, feature orchestration, and UI.

**Read [`docs/architecture-ACTEE.md`](docs/architecture-ACTEE.md) before diving into the code.**

### Path aliases

Defined in `tsconfig.json` — use these instead of relative imports:

| Alias | Maps to |
|-------|---------|
| `@app/*` | `src/app/*` |
| `@domains/*` | `src/app/domains/*` |
| `@features/*` | `src/app/features/*` |
| `@pages/*` | `src/app/pages/*` |
| `@shared/*` | `src/app/shared/*` |
| `@core/*` | `src/app/core/*` |

### Folder structure

```
src/app/
├─ core/              # Auth, interceptors, API types, app config
├─ domains/           # Source of truth — stores, APIs, models, forms
│  ├─ shared/         # withCursorPagination, store utils
│  └─ {entity}/       # One folder per domain entity
├─ features/          # Feature blocks — facade, derived store, UI components
│  └─ {entity}/
├─ shared/            # Reusable UI components, services, utils, guards
├─ pages/             # Route shells — layout only, no logic
└─ environments/      # Dev/prod API base URLs
```

### Key patterns (see architecture doc for full details)

- **Domain stores** own all server state and mutations (`signalStore` + `withCursorPagination` + `withMutations`)
- **Feature stores** are read-only projections (`withComputed` only)
- **Facades** are the single entry point for UI — expose signals + intention methods
- **Pages** are route shells with `<router-outlet />` and zero logic
- **UI components** only talk to their facade — never to stores or services directly

## Additional docs

- [`docs/architecture-ACTEE.md`](docs/architecture-ACTEE.md) — Architecture principles & conventions
- [`docs/BRIEF_CLAUDE_PROJET_ADMIN_LAUREAT.md`](docs/BRIEF_CLAUDE_PROJET_ADMIN_LAUREAT.md) — Product brief & business context
- `docs/modeles.md`, `docs/indicateurs.md`, etc. — Functional specs (in French)
