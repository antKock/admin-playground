---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-03-03'
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/product-brief-admin-playground-2026-03-03.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - _bmad-output/planning-artifacts/ux-design-directions.html
  - docs/BRIEF_CLAUDE_PROJET_ADMIN_LAUREAT.md
  - docs/color-palette.md
  - docs/reference-links.md
  - openapi.json (remote: https://laureatv2-api-staging.osc-fr1.scalingo.io/openapi.json)
workflowType: 'architecture'
project_name: 'admin-playground'
user_name: 'Anthony'
date: '2026-03-03'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements (32 FRs across 6 domains):**

| Domain | FRs | Architectural Impact |
|--------|-----|---------------------|
| **Auth & Session** | FR1–FR4 | JWT interceptor, route guards, token storage, redirect-after-login |
| **Navigation & Layout** | FR5–FR6 | App shell with sidebar + header, 7-section routing |
| **Entity CRUD** | FR7–FR12 | Generic CRUD pattern × 7 entities, cursor pagination service, form generation |
| **Status & Lifecycle** | FR13–FR16 | Status workflow engine (draft→published→disabled), duplication, transition validation |
| **Relationships & Associations** | FR17–FR22 | FK selectors, bidirectional indicator-model links, association metadata CRUD |
| **Indicator Parameters** | FR23–FR28 | 6-parameter config per indicator per model context, JSONLogic input, type constraints |
| **Feedback & Errors** | FR29–FR31 | Toast system, error interception, constraint explanation |
| **Dev Tooling** | FR32 | API inspector component on detail pages |

**Non-Functional Requirements:**

- **Performance:** API-bound, no heavy client computation. Pagination must feel responsive. No offline capability.
- **Security:** HTTPS only, JWT stored securely, credentials in `.env.local`, no sensitive data cached client-side.
- **Integration:** Single API consumer (Laureat REST API). OpenAPI spec is source of truth. Cursor-based pagination everywhere.
- **Code Quality:** Angular 20 standalone components, TypeScript strict, signals (no NgRx), consistent patterns across all 7 modules, inline documentation.

### UX Architectural Implications

The UX specification is comprehensive (14 steps, fully designed). Key architectural drivers:

1. **Design system: Tailwind CSS + Angular CDK** — custom component library, no pre-built UI library (no Material/PrimeNG). 60+ design tokens mapped to Tailwind theme.
2. **Component library (13 custom components):** AppLayout, DataTable, MetadataGrid, SectionAnchors, StatusBadge, SaveBar, Toast, ConfirmDialog, IndicatorCard, ToggleRow, RuleField, IndicatorPicker, ApiInspector.
3. **Interaction model:** Explicit save (not auto-save), unsaved-state tracking per indicator card, navigation guards.
4. **Model-as-workspace pattern:** ActionModel detail is a single-page workspace with expandable indicator cards, inline parameter configuration, drag-to-reorder — the most complex UI surface.
5. **Infinite scroll** (not traditional pagination buttons) — cursor-based, loads at 80% scroll threshold.
6. **CDK usage:** Overlay (dropdowns, dialogs), DragDrop (indicator reorder), A11y (focus trap), Clipboard, Scrolling (virtual scroll).
7. **Icons:** Lucide via `lucide-angular`.
8. **Pixel-level reference:** `ux-design-directions.html` serves as the implementation mockup with component→CSS class mappings.

### OpenAPI Spec Insights

From the live API analysis (80+ endpoints across 15+ entity groups, 7 in v1 scope):

- **Cursor-based pagination** confirmed on all list endpoints (cursor + limit params, `PaginatedResponse<T>`)
- **Status workflows** confirmed: ActionThemes have publish/disable/activate endpoints; Agents have soft-delete
- **Communities** have parent-child hierarchy with recursive fetching — more complex than simple CRUD
- **Indicator-model association metadata** confirmed: visibility_rule, required_rule, editable, default_value, duplicable, constrained_values
- **History/versioning endpoints** exist but are explicitly deferred — architecture should be aware but not build for them
- **Actions/Folders** (instances) exist in API but are out of scope
- **`by-unique-id`** endpoint pattern exists on multiple entities (ActionThemes, Communities, Agents, Actions, Folders)

### Scale & Complexity Assessment

| Indicator | Assessment |
|-----------|-----------|
| **Project type** | Angular 20 SPA — frontend-only, single API consumer |
| **Complexity** | Medium — standard CRUD patterns over a non-trivial domain model |
| **Entity count** | 7 entities, varying complexity (simple CRUD → complex workspace) |
| **Integration** | Single REST API, JWT auth, cursor pagination |
| **Real-time** | None |
| **Multi-tenancy** | None |
| **Regulatory** | None (internal tool, no citizen data) |
| **User interaction complexity** | High for indicator configuration (6 params × N indicators × JSONLogic rules), low-medium for other entities |
| **Data complexity** | Medium — entity relationships, bidirectional associations with metadata |
| **Primary technical domain** | Frontend web application |

### Technical Constraints & Dependencies

1. **Angular 20** — standalone components, signals, lazy loading (mandated by PRD + brief)
2. **No backend** — frontend-only, all data operations via Laureat REST API
3. **Tailwind CSS + Angular CDK** — mandated by UX spec for styling + behavioral primitives
4. **TypeScript strict mode** — mandated by PRD
5. **API base URL configurable** via `environment.ts` — staging default: `laureatv2-api-staging.osc-fr1.scalingo.io`
6. **Live OpenAPI spec** is source of truth — API may change between sprints (primary risk)
7. **Bundler: open question** — brief mentions Parcel (personal hosting), but Angular 20 default is esbuild/Vite. Needs resolution in Step 3.
8. **Development model:** AI-assisted (BMAD-driven), reviewed by senior Angular developer
9. **Hosting:** Personal domain initially, company GitHub + redeploy if v1 succeeds

### Cross-Cutting Concerns

1. **Generic API service layer** — Typed services for CRUD + cursor pagination, reusable across all 7 entities
2. **Error handling** — Centralized HTTP error interception → toast notification. Explanatory messages with cause and resolution. Never silent failures.
3. **Authentication** — JWT interceptor on all requests, route guards for protected routes, redirect-after-login preservation
4. **Status workflow** — Reusable status transition pattern across entities with different lifecycle states (draft→published→disabled)
5. **Unsaved state management** — Signal-based dirty tracking for indicator cards, navigation guards on unsaved changes
6. **Entity relationship rendering** — Linked reference fields (select + ↗ navigate icon) used across multiple entities
7. **Loading states** — Skeleton patterns for tables and detail views, consistent across all entities
8. **Consistent module structure** — Same folder/file/service/routing pattern across all 7 entity modules for predictability

## Starter Template Evaluation

### Primary Technology Domain

Frontend web application (Angular 20 SPA) — single-page application consuming an existing REST API. No backend component.

### Starter Options Considered

| Option | Verdict |
|--------|---------|
| **Angular CLI `ng new`** | The only sensible choice. Angular's official scaffolding, standalone by default, esbuild builder, signals support. Everything else adds unnecessary divergence from framework conventions. |
| **Nx workspace** | Overkill for a single-app internal tool with no monorepo needs. |
| **Custom Vite + Angular** | Unnecessary — Angular CLI already uses esbuild/Vite under the hood since v17+. |

### Selected Starter: Angular CLI (`ng new`)

**Rationale:** Angular CLI is the canonical scaffolding tool. For a single-app project reviewed by a senior Angular developer, staying on framework defaults maximizes predictability and reviewability. No reason to deviate.

**Initialization Command:**

```bash
ng new admin-playground --style=css --routing --ssr=false --skip-tests=false
```

Post-scaffold setup:
```bash
cd admin-playground
npm install tailwindcss @tailwindcss/postcss postcss --save-dev
npm install @angular/cdk
npm install lucide-angular
```

### Architectural Decisions Provided by Starter

**Language & Runtime:**
- TypeScript strict mode (Angular CLI default)
- Angular 20.x with standalone components as default (no NgModule)

**Build Tooling:**
- `@angular-devkit/build-angular:application` — esbuild-based builder
- HMR enabled by default in `ng serve`
- Production optimization (tree-shaking, minification, code splitting) out of the box

**Styling Solution:**
- Plain CSS selected at scaffold (Tailwind added post-scaffold via PostCSS)
- Tailwind CSS v4.x configured via `.postcssrc.json` with `@tailwindcss/postcss` plugin
- `@import "tailwindcss"` in `src/styles.css`
- Custom theme extends Tailwind with 60+ project design tokens

**Testing Framework:**
- Karma + Jasmine (Angular CLI default) for unit tests
- Consider migrating to Jest or Vitest in v2 if needed

**Code Organization:**
- Angular CLI default structure: `src/app/` with lazy-loaded feature modules
- Routing module with lazy loading per entity

**Development Experience:**
- `ng serve` with HMR for development
- `ng build` for production builds
- Angular DevTools browser extension for debugging signals and component trees

**Additional Dependencies (post-scaffold):**
- `@angular/cdk` — behavioral primitives (Overlay, DragDrop, A11y, Clipboard, Scrolling)
- `lucide-angular` (v0.575.x) — icon library
- `tailwindcss` (v4.x) + `@tailwindcss/postcss` + `postcss` — utility-first CSS

**Bundler Decision (resolving open question from brief):**
Angular's default **esbuild** builder. Parcel (mentioned in original brief) is superseded — esbuild is faster, natively integrated, and maintained by the Angular team. No ejection needed.

**Note:** Project initialization using this command should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Generic API service architecture (base + entity extensions)
- Error handling architecture (interceptor + component hybrid)
- JWT authentication flow (localStorage, no refresh, 401 redirect)
- Component architecture pattern (hybrid smart/presentational)
- Signal usage pattern (services expose signals via toSignal bridge)
- Form strategy (Reactive Forms)
- API type management (auto-generated from OpenAPI + hand-written extensions)

**Important Decisions (Shape Architecture):**
- Lazy loading per entity (7 routes)
- Linting & formatting (ESLint + Prettier)
- Environment configuration (environment.ts files)
- Hosting & deployment (Vercel + GitHub auto-deploy)

**Deferred Decisions (v1 Polish / v2):**
- Signal-based entity caching (deferred to last v1 epic "Polish" — add if API latency becomes noticeable)
- Token refresh (deferred — backend needs to add `/auth/refresh` endpoint first)
- CI/CD pipeline (deferred — manual push from terminal, Vercel auto-deploys)
- Runtime environment config (deferred — only staging for now, `environment.prod.ts` added when production is ready)

### Data Architecture

**API Type Management — Hybrid (auto-generate + hand-written):**
- Use `openapi-typescript` to auto-generate TypeScript interfaces from the live `/openapi.json` spec
- Auto-generated types live in `src/app/core/api/generated/` — never hand-edited
- Hand-written frontend-specific types (form models, UI state, component inputs) live in `src/app/core/models/`
- Re-generate types periodically or when API changes are detected
- Rationale: OpenAPI spec is the declared source of truth (PRD). Auto-generation keeps types honest; hand-written extensions cover UI-only concerns.

**Client-Side Caching — None for v1 (signal cache deferred to polish epic):**
- Every navigation triggers a fresh API call. Simple, always fresh data.
- Service layer designed with signals from day one, so adding a signal-based entity cache is an internal change, not a refactor.
- Deferred to last v1 epic: if API latency becomes noticeable for the 3 operators, add per-entity signal cache with invalidation on mutation.

**Form Strategy — Angular Reactive Forms:**
- All entity forms use `FormBuilder` + `FormGroup` + `FormControl`
- Reactive forms provide programmatic control needed for the indicator parameter configuration (6 toggles + JSONLogic rule fields per card)
- Validation: client-side on blur + on submit, server-side errors mapped to fields where possible
- Rationale: Standard Angular pattern for non-trivial forms. Template-driven forms lack the dynamic control needed for the workspace pattern.

### Authentication & Security

**JWT Storage — `localStorage`:**
- Token stored in `localStorage` under a namespaced key
- Persists across browser sessions for convenience (3 trusted internal users)
- Cleared on explicit logout
- XSS risk is minimal: no public surface, no user-generated content, internal-only tool
- Rationale: Convenience for daily-use internal tool outweighs theoretical XSS risk.

**Token Refresh — None (deferred to backend):**
- No refresh token endpoint exists in the API currently
- On token expiry: first API call returns 401 → HTTP interceptor redirects to login page with preserved intended destination (FR4)
- Backend team should add `/auth/refresh` endpoint — tracked in `api-observations.md`
- Rationale: Clean separation. Frontend shouldn't work around a missing backend feature.

**Route Guards — Functional guard checking token presence:**
- Angular `canActivate` functional guard checks if JWT exists in localStorage
- No client-side token expiry validation — if token is expired, the first API call will 401 and the interceptor handles redirect
- Login page is the only unguarded route
- Rationale: Simple, robust. Server is the authority on token validity.

### API & Communication Patterns

**Generic API Service Architecture — Base service + entity extensions:**
- `BaseEntityService<T>` provides: `list(cursor?, limit?)`, `getById(id)`, `create(data)`, `update(id, data)`, `delete(id)`
- All list methods return `PaginatedResponse<T>` with cursor-based pagination
- Entity-specific services extend the base for custom endpoints:
  - `ActionThemeService` adds `publish()`, `disable()`, `activate()`, `duplicate()`
  - `CommunityService` adds `assignUser()`, `removeUser()`, `getParents()`, `getChildren()`
  - `IndicatorModelService` adds association metadata management
  - `AgentService` handles soft-delete semantics
- Services use HttpClient internally (Observables), expose data via signals using `toSignal()`
- Rationale: 7 entities share CRUD + pagination. Generic base eliminates duplication. Extensions handle domain-specific operations cleanly.

**Error Handling — Hybrid (interceptor + component):**
- **HTTP Interceptor** catches infrastructure errors globally:
  - 401 → Redirect to login (with preserved destination)
  - 500 → Generic "Server error" toast
  - 0 / network errors → "Connection lost" toast
- **Components** handle domain-specific errors locally:
  - 409 Conflict → Contextual message ("Cannot delete theme — linked to 3 models")
  - 422 Validation → Map to specific form fields with explanatory messages
  - 400 Bad Request → Display API error message with context
- Toast service is the centralized notification channel for both paths
- Rationale: PRD requires "no silent failures" (FR29-FR31). UX spec requires explanatory messages ("what + why + what to do"). Infrastructure errors are generic; business errors need context.

**API Response Typing — Strict:**
- All HTTP calls return `Observable<TypedResponse<T>>` with proper generics
- Auto-generated types from OpenAPI spec enforce API contract at compile time
- No `any` types in the API layer
- Rationale: TypeScript strict mode is mandated. Auto-generated types make this essentially free.

### Frontend Architecture

**Component Architecture — Hybrid (smart pages + presentational shared components):**
- **Shared components** (DataTable, StatusBadge, Toast, ConfirmDialog, etc.) are purely presentational: inputs/outputs, no data fetching, no service injection
- **Entity page components** (FundingProgramListComponent, ActionModelDetailComponent, etc.) are "smart": they inject services, fetch data, manage state, orchestrate child components
- No separate container/wrapper components — the page IS the container
- Rationale: Matches the UX spec's component strategy exactly. 13 shared components are UI primitives; entity pages are the data layer. Adding a container abstraction would be unnecessary overhead for 7 entity modules.

**Signal Usage — Services bridge, components consume:**
- HttpClient returns Observables internally within services
- Services expose data to components via signals using `toSignal()` bridge
- Components work exclusively with signals for template binding and reactive state
- Unsaved-state tracking for indicator cards: signal-based dirty detection per card, aggregate dirty signal for SaveBar visibility
- Rationale: Idiomatic Angular 20. HttpClient is inherently Observable-based; signals are the component-level reactive primitive.

**Lazy Loading — One route per entity:**
- 7 lazy-loaded feature routes, one per entity, matching sidebar navigation 1:1
- Each feature route contains: list component, detail/workspace component, create/edit component (or combined)
- Shared components loaded eagerly (part of core module — small, used everywhere)
- Rationale: Clean, predictable, minimal bundle size per route. No reason to group entities.

**Environment Configuration — `environment.ts` files:**
- `environment.ts` — development/staging (default): API URL points to `laureatv2-api-staging.osc-fr1.scalingo.io`
- `environment.prod.ts` — production: added when production environment is ready (~2 months)
- Contains: `apiBaseUrl`, `production` flag
- Rationale: Standard Angular pattern. Only staging for now. Production file is a trivial addition later.

### Infrastructure & Deployment

**Hosting — Vercel with GitHub auto-deploy:**
- Angular SPA deployed as static files to Vercel
- GitHub repository connected to Vercel for automatic deployment on push
- `vercel.json` with SPA fallback rewrite (all routes → `index.html`)
- Free tier sufficient for 3 internal users
- Migration path: company GitHub + redeploy if v1 succeeds

**CI/CD — Manual push, Vercel auto-deploys:**
- Developer (AI-assisted) commits and pushes from terminal
- Vercel handles build (`ng build`) and deployment automatically on push
- No dedicated CI/CD pipeline for v1 — overhead not justified for solo development
- Deferred: GitHub Actions for lint/test/build gates when project moves to company GitHub

**Linting & Formatting — ESLint + Prettier:**
- ESLint with Angular-specific rules (shipped with Angular CLI)
- Prettier for consistent formatting across all files
- Critical for AI-generated code under senior dev review — formatting consistency builds trust
- Run on save (editor integration) and as pre-commit check

### Decision Impact Analysis

**Implementation Sequence:**
1. Project scaffold (`ng new`) + Tailwind + CDK + Lucide setup
2. Auto-generate API types from OpenAPI spec
3. Core services: AuthService (JWT + interceptor), BaseEntityService, ToastService
4. App shell: AppLayout, routing, route guards
5. Shared components: DataTable, StatusBadge, ConfirmDialog, Toast, MetadataGrid, SectionAnchors, SaveBar
6. Entity modules: simple entities first (FundingPrograms, ActionThemes), complex last (IndicatorModels)

**Cross-Component Dependencies:**
- BaseEntityService depends on: AuthService (JWT interceptor), auto-generated API types
- All entity services depend on: BaseEntityService
- All entity components depend on: shared components + entity services
- SaveBar depends on: signal-based dirty tracking (implemented in IndicatorCard)
- IndicatorPicker depends on: IndicatorModelService (search/filter)
- ApiInspector depends on: last HTTP response captured by entity service

## Implementation Patterns & Consistency Rules

### Critical Conflict Points Identified

15 areas where AI agents could make different choices, organized into 5 categories. All patterns below are mandatory for any agent working on this codebase.

### Naming Patterns

**API ↔ TypeScript Naming — Keep `snake_case`:**
- All API types use `snake_case` field names, matching the Laureat API exactly
- No camelCase transformation layer — types are 1:1 with API JSON
- Examples: `funding_program_id`, `technical_label`, `created_at`, `action_model_id`
- Rationale: Eliminates transformation bugs, keeps types honest to the API contract, reviewer sees types that match API responses exactly

**File Naming — Angular CLI `kebab-case` convention:**
- Components: `funding-program-list.component.ts`
- Services: `funding-program.service.ts`
- Models/types: `funding-program.model.ts`
- Routes: `funding-program.routes.ts`
- Specs: `funding-program.service.spec.ts` (co-located)

**Component Selectors — `app-` prefix:**
- All component selectors use `app-` prefix: `app-data-table`, `app-status-badge`, `app-funding-program-list`
- Standard Angular CLI default, no project-specific prefix needed (no third-party component conflict risk)

**CSS Classes — Match UX mockup conventions:**
- Shared component classes match the `ux-design-directions.html` CSS class mapping (e.g., `.data-table`, `.indicator-card`, `.toggle-row`, `.save-bar`)
- Tailwind utility classes for styling; custom classes only for component-specific structural CSS
- Design tokens mapped to Tailwind theme config (e.g., `bg-brand-primary`, `text-error`, `surface-subtle`)

### Structure Patterns

**Feature Module Organization — Flat folder per entity:**

Every entity follows this exact structure:
```
src/app/features/{entity-name}/
  ├── {entity-name}-list.component.ts
  ├── {entity-name}-detail.component.ts
  ├── {entity-name}-form.component.ts       // handles both create and edit via mode input
  ├── {entity-name}.service.ts              // extends BaseEntityService<T>
  ├── {entity-name}.routes.ts               // lazy-loaded route config
  └── {entity-name}.model.ts                // frontend-specific types (if needed)
```

- All files in one flat folder — no nested subfolders within a feature
- Same structure across all 7 entities without exception
- Entity names use plural kebab-case: `funding-programs`, `action-themes`, `action-models`, `folder-models`, `indicator-models`, `communities`, `agents`

**Test Placement — Co-located (Angular convention):**
- `funding-program.service.spec.ts` lives next to `funding-program.service.ts`
- `funding-program-list.component.spec.ts` lives next to `funding-program-list.component.ts`
- No separate `__tests__/` folders

**Shared Component Organization:**
```
src/app/shared/
  ├── components/
  │   ├── data-table/
  │   │   ├── data-table.component.ts
  │   │   ├── data-table.component.html
  │   │   ├── data-table.component.css
  │   │   └── data-table.component.spec.ts
  │   ├── status-badge/
  │   ├── confirm-dialog/
  │   ├── toast/
  │   ├── save-bar/
  │   ├── metadata-grid/
  │   ├── section-anchors/
  │   └── api-inspector/
  ├── services/
  │   ├── toast.service.ts
  │   └── confirm-dialog.service.ts
  └── pipes/
```

Each shared component gets its own subfolder containing component + template + styles + spec.

**Core Service Organization:**
```
src/app/core/
  ├── api/
  │   ├── generated/                        // auto-generated from OpenAPI (never hand-edit)
  │   └── base-entity.service.ts            // generic CRUD + pagination base
  ├── auth/
  │   ├── auth.service.ts
  │   ├── auth.guard.ts
  │   └── auth.interceptor.ts
  ├── models/                               // hand-written frontend-specific types
  └── services/
      └── ... (cross-cutting services)
```

### Format Patterns

**API Data Formats — Follow API conventions exactly:**
- JSON field names: `snake_case` (matching API)
- Dates: ISO 8601 strings as returned by API (e.g., `"2026-03-03T10:30:00Z"`)
- Booleans: `true`/`false`
- Nulls: preserved as `null` (not converted to `undefined` or empty string)
- IDs: string type (as returned by API)

**Paginated Response Structure:**
```typescript
interface PaginatedResponse<T> {
  items: T[];
  cursor: string | null;
  limit: number;
}
```
All list endpoints return this shape. The generic `BaseEntityService.list()` always returns `PaginatedResponse<T>`.

**Error Display Format:**
- Toast message pattern: **"Bold action"** + context — e.g., **"Action Model saved"** · 2 indicators updated
- Error messages follow: *what happened* + *why* + *what to do* — e.g., "Type cannot be changed — instances of this indicator already exist. Create a new indicator instead."
- API error responses are surfaced with the API's own message when available, never swallowed

### Communication Patterns

**Signal State Management:**
- Entity services expose readonly signals: `items`, `selectedItem`, `isLoading`, `error`
- Mutation methods (`create`, `update`, `delete`) are async and refresh the relevant signals after success
- No global state store — each entity service manages its own signal state
- Unsaved state tracking: signal-based dirty detection per IndicatorCard, aggregate `hasDirtyCards` signal drives SaveBar visibility
- State updates are always immutable — create new signal values, never mutate existing

**Component Communication:**
- Parent → Child: via `input()` (signal-based inputs)
- Child → Parent: via `output()` (signal-based outputs)
- Sibling: via shared service with signals (e.g., ToastService)
- No `@ViewChild` for data passing — only for DOM access when strictly needed
- No EventEmitter — use `output()` exclusively (Angular 20 convention)

### Process Patterns

**Loading State Convention:**
- Each entity service exposes an `isLoading` signal (writable, boolean)
- Set `true` before API call, `false` on success or error (always reset in `finally`)
- Components bind to `isLoading` for skeleton/spinner display
- DataTable accepts `isLoading` input → shows skeleton rows (6 rows of shimmer)
- Detail views show skeleton blocks matching MetadataGrid layout
- Never show a full-page spinner — always structural skeletons

**Error Handling Flow:**
1. HTTP interceptor catches infrastructure errors (401, 500, network) → handles globally
2. Service-level `catchError` catches domain errors (409, 422, 400) → stores in `error` signal
3. Component reads `error` signal → displays contextual message (inline or toast)
4. Error signals are cleared on next successful operation
5. Never: `console.error` without also surfacing to user. Never: swallowed errors.

**Form Validation Flow:**
- Client-side validation: on blur + on submit
- Error text appears below field immediately on blur if invalid
- On submit: all fields validated, first error field focused
- Server-side errors (422): mapped to specific form fields where possible, otherwise error toast
- Invalid field visual: red border replaces default border, error text below in `text-error` color

**Navigation Guard Flow:**
- On navigate away with unsaved changes → ConfirmDialog: "You have unsaved changes. Discard or stay?"
- On discard → reset form/card state to last-saved values, allow navigation
- On stay → cancel navigation, return focus to current view
- Guard registered on all workspace/detail routes

### Component Input/Output Convention

All shared components follow this contract:
- Inputs use Angular `input()` function (signal-based)
- Required inputs use `input.required<T>()`
- Outputs use Angular `output()` function (signal-based)
- No two-way binding sugar — explicit input + output pairs
- All inputs are typed — no `any`

### Import Organization

Within each TypeScript file, imports follow this order (separated by blank lines):

```typescript
// 1. Angular core
import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

// 2. Angular CDK
import { CdkDragDrop } from '@angular/cdk/drag-drop';

// 3. Third-party
import { LucideAngularModule } from 'lucide-angular';

// 4. App core
import { BaseEntityService } from '@app/core/api/base-entity.service';
import { AuthService } from '@app/core/auth/auth.service';

// 5. App shared
import { DataTableComponent } from '@app/shared/components/data-table/data-table.component';
import { StatusBadgeComponent } from '@app/shared/components/status-badge/status-badge.component';

// 6. Feature-local (relative)
import { FundingProgramService } from './funding-program.service';
```

ESLint + Prettier enforce this ordering.

### Enforcement Guidelines

**All AI agents MUST:**
1. Follow the flat feature folder structure exactly — no deviations, no "improvements"
2. Use `snake_case` for all API-related types — no camelCase transformation
3. Extend `BaseEntityService<T>` for every entity service — no standalone HTTP calls
4. Use `input()` / `output()` for component communication — no `@Input` / `@Output` decorators
5. Expose service state via signals — no raw Observable subscriptions in components
6. Follow the import ordering convention
7. Co-locate tests next to source files
8. Match the UX mockup CSS class names for shared components

**Anti-Patterns (explicitly forbidden):**
- Creating a `utils/` grab-bag folder with unrelated helpers
- Using `any` type anywhere in the API layer
- Auto-saving on form field change (always explicit save)
- Adding `console.log` for debugging without removing before commit
- Using `@ViewChild` for data passing between components
- Creating wrapper/container components around entity pages
- Using NgModule anywhere (standalone components only)
- Importing from `@angular/forms` without using Reactive Forms (no template-driven forms)

## Project Structure & Boundaries

### Complete Project Directory Structure

```
admin-playground/
├── .eslintrc.json
├── .gitignore
├── .postcssrc.json                          # Tailwind PostCSS config
├── .prettierrc
├── angular.json
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.spec.json
├── vercel.json                              # SPA fallback rewrite
│
├── scripts/
│   └── generate-api-types.sh                # runs openapi-typescript against live spec
│
├── src/
│   ├── index.html
│   ├── main.ts                              # bootstrapApplication()
│   ├── styles.css                           # @import "tailwindcss" + custom theme tokens
│   │
│   ├── app/
│   │   ├── app.component.ts                 # root component
│   │   ├── app.routes.ts                    # top-level lazy routes
│   │   ├── app.config.ts                    # provideRouter, provideHttpClient, interceptors
│   │   │
│   │   ├── core/
│   │   │   ├── api/
│   │   │   │   ├── generated/               # auto-generated from OpenAPI (never hand-edit)
│   │   │   │   │   └── api-types.ts         # openapi-typescript output
│   │   │   │   ├── base-entity.service.ts   # generic CRUD + cursor pagination
│   │   │   │   └── paginated-response.model.ts
│   │   │   ├── auth/
│   │   │   │   ├── auth.service.ts          # login, logout, token management
│   │   │   │   ├── auth.guard.ts            # functional canActivate guard
│   │   │   │   ├── auth.interceptor.ts      # JWT injection + 401 redirect
│   │   │   │   └── login.component.ts       # login page
│   │   │   ├── layout/
│   │   │   │   ├── app-layout.component.ts  # sidebar + header + content shell
│   │   │   │   ├── app-layout.component.html
│   │   │   │   └── app-layout.component.css
│   │   │   └── models/                      # hand-written frontend-specific types
│   │   │       └── ui.model.ts              # e.g., toast types, form modes
│   │   │
│   │   ├── shared/
│   │   │   ├── components/
│   │   │   │   ├── data-table/
│   │   │   │   │   ├── data-table.component.ts
│   │   │   │   │   ├── data-table.component.html
│   │   │   │   │   ├── data-table.component.css
│   │   │   │   │   └── data-table.component.spec.ts
│   │   │   │   ├── status-badge/
│   │   │   │   ├── confirm-dialog/
│   │   │   │   ├── toast/
│   │   │   │   ├── save-bar/
│   │   │   │   ├── metadata-grid/
│   │   │   │   ├── section-anchors/
│   │   │   │   ├── api-inspector/
│   │   │   │   ├── indicator-card/          # workspace-specific but shared across model types
│   │   │   │   ├── toggle-row/
│   │   │   │   ├── rule-field/
│   │   │   │   ├── indicator-picker/
│   │   │   │   └── param-hint-icons/
│   │   │   ├── services/
│   │   │   │   ├── toast.service.ts
│   │   │   │   └── confirm-dialog.service.ts
│   │   │   └── pipes/
│   │   │
│   │   ├── features/
│   │   │   ├── funding-programs/
│   │   │   │   ├── funding-program-list.component.ts
│   │   │   │   ├── funding-program-detail.component.ts
│   │   │   │   ├── funding-program-form.component.ts
│   │   │   │   ├── funding-program.service.ts
│   │   │   │   ├── funding-program.routes.ts
│   │   │   │   └── funding-program.model.ts
│   │   │   ├── action-themes/
│   │   │   │   ├── action-theme-list.component.ts
│   │   │   │   ├── action-theme-detail.component.ts
│   │   │   │   ├── action-theme-form.component.ts
│   │   │   │   ├── action-theme.service.ts   # + publish/disable/activate/duplicate
│   │   │   │   ├── action-theme.routes.ts
│   │   │   │   └── action-theme.model.ts
│   │   │   ├── action-models/
│   │   │   │   ├── action-model-list.component.ts
│   │   │   │   ├── action-model-detail.component.ts  # the workspace view
│   │   │   │   ├── action-model-form.component.ts
│   │   │   │   ├── action-model.service.ts   # + indicator association management
│   │   │   │   ├── action-model.routes.ts
│   │   │   │   └── action-model.model.ts
│   │   │   ├── folder-models/
│   │   │   │   ├── folder-model-list.component.ts
│   │   │   │   ├── folder-model-detail.component.ts
│   │   │   │   ├── folder-model-form.component.ts
│   │   │   │   ├── folder-model.service.ts
│   │   │   │   ├── folder-model.routes.ts
│   │   │   │   └── folder-model.model.ts
│   │   │   ├── indicator-models/
│   │   │   │   ├── indicator-model-list.component.ts
│   │   │   │   ├── indicator-model-detail.component.ts  # 3-col metadata, list values, usage
│   │   │   │   ├── indicator-model-form.component.ts
│   │   │   │   ├── indicator-model.service.ts  # + association metadata CRUD
│   │   │   │   ├── indicator-model.routes.ts
│   │   │   │   └── indicator-model.model.ts
│   │   │   ├── communities/
│   │   │   │   ├── community-list.component.ts
│   │   │   │   ├── community-detail.component.ts
│   │   │   │   ├── community-form.component.ts
│   │   │   │   ├── community.service.ts      # + assignUser/removeUser
│   │   │   │   ├── community.routes.ts
│   │   │   │   └── community.model.ts
│   │   │   └── agents/
│   │   │       ├── agent-list.component.ts
│   │   │       ├── agent-detail.component.ts
│   │   │       ├── agent-form.component.ts
│   │   │       ├── agent.service.ts          # + soft-delete semantics
│   │   │       ├── agent.routes.ts
│   │   │       └── agent.model.ts
│   │   │
│   │   └── environments/
│   │       ├── environment.ts                # staging (default)
│   │       └── environment.prod.ts           # production (added when ready)
│   │
│   └── assets/
│       └── (static assets if needed)
```

### Architectural Boundaries

**API Boundary:**
- All HTTP calls go through `BaseEntityService` or entity-specific extensions — no direct `HttpClient` injection in components
- `auth.interceptor.ts` is the single point for JWT injection and 401 handling
- `core/api/generated/` is the type boundary — auto-generated from OpenAPI spec, never hand-edited

**Component Boundary:**
- `shared/components/` are purely presentational — no service injection, no HTTP calls
- `features/*/` components are smart — they inject services, manage state, orchestrate shared components
- `core/layout/` is the app shell — owns sidebar navigation and header

**Data Flow:**
```
Component → EntityService → BaseEntityService → HttpClient → auth.interceptor → Laureat API
                ↓                                                    ↓
         signals (items,                                    JWT token injected
         isLoading, error)                                  401 → redirect to login
                ↓
         Template binding
```

### Requirements → Structure Mapping

| FR Domain | Primary Location |
|-----------|-----------------|
| **FR1-4 (Auth)** | `core/auth/` — AuthService, guard, interceptor, login component |
| **FR5-6 (Navigation)** | `core/layout/` — AppLayout with sidebar + header |
| **FR7-12 (Entity CRUD)** | `features/*/` — 7 entity feature folders, each following identical structure |
| **FR13-16 (Status)** | Entity services (publish/disable/activate methods) + `shared/components/status-badge/` |
| **FR17-22 (Relationships)** | Entity detail components + `shared/components/metadata-grid/` (linked fields) + `shared/components/indicator-picker/` |
| **FR23-28 (Indicator Params)** | `shared/components/indicator-card/`, `toggle-row/`, `rule-field/` + `features/action-models/action-model-detail.component.ts` workspace |
| **FR29-31 (Feedback)** | `shared/components/toast/` + `shared/services/toast.service.ts` + `core/auth/auth.interceptor.ts` |
| **FR32 (API Inspector)** | `shared/components/api-inspector/` — rendered on all detail pages |

### Cross-Cutting Concerns Mapping

| Concern | Location |
|---------|----------|
| JWT authentication | `core/auth/` (service + interceptor + guard) |
| Error handling | `core/auth/auth.interceptor.ts` (global) + entity components (domain-specific) |
| Toast notifications | `shared/services/toast.service.ts` + `shared/components/toast/` |
| Cursor pagination | `core/api/base-entity.service.ts` (generic) |
| API types | `core/api/generated/api-types.ts` (auto-generated from OpenAPI) |
| Design tokens | `src/styles.css` (Tailwind theme) |
| Unsaved state | Signal-based dirty tracking in `shared/components/indicator-card/` + `shared/components/save-bar/` |
| Confirmation dialogs | `shared/services/confirm-dialog.service.ts` + `shared/components/confirm-dialog/` |

### Development Workflow

**Development:**
- `ng serve` — runs dev server with HMR on `http://localhost:4200`
- Proxies to staging API via Angular CLI proxy config (optional) or direct CORS

**Type Generation:**
- `scripts/generate-api-types.sh` — runs `openapi-typescript` against `https://laureatv2-api-staging.osc-fr1.scalingo.io/openapi.json`
- Output: `src/app/core/api/generated/api-types.ts`
- Run manually when API changes are suspected or on a regular cadence

**Build & Deploy:**
- `ng build` → `dist/admin-playground/` (static files)
- Push to GitHub → Vercel auto-deploys
- `vercel.json` contains SPA rewrite: `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`

## Architecture Validation Results

### Coherence Validation

**Decision Compatibility: PASS**
- Angular 20 + Tailwind CSS v4 + Angular CDK: fully compatible, well-documented integration path
- esbuild builder + Tailwind PostCSS: standard setup, no conflicts
- Standalone components + signals + Reactive Forms: all native Angular 20, no library conflicts
- lucide-angular 0.575.x: supports standalone components
- `openapi-typescript` for type generation: framework-agnostic, works with any TypeScript project

**Pattern Consistency: PASS**
- `snake_case` API types + auto-generation = types always match API contract
- Signal-based services + `toSignal()` bridge = consistent reactive pattern throughout
- `BaseEntityService<T>` + entity extensions = same pattern across all 7 entities
- Flat feature folders + co-located tests = Angular CLI convention throughout
- Import ordering + ESLint + Prettier = enforced consistency

**Structure Alignment: PASS**
- Directory structure directly maps to the patterns defined in Implementation Patterns
- Every shared component from the UX spec has a home in `shared/components/`
- Every entity has an identical folder structure
- Core services (auth, API base) are properly isolated from features

### Requirements Coverage Validation

**Functional Requirements: 32/32 COVERED**

| FR Range | Domain | Architectural Support |
|----------|--------|----------------------|
| FR1-4 | Auth & Session | `core/auth/` — AuthService, guard, interceptor, login component |
| FR5-6 | Navigation & Layout | `core/layout/` — AppLayout with sidebar + header |
| FR7-12 | Entity CRUD | `features/*/` — 7 entity modules + BaseEntityService + DataTable + MetadataGrid |
| FR13-16 | Status & Lifecycle | Entity services (publish/disable/activate/duplicate) + StatusBadge + ConfirmDialog |
| FR17-22 | Relationships | MetadataGrid linked fields + IndicatorPicker + entity detail components |
| FR23-28 | Indicator Parameters | IndicatorCard + ToggleRow + RuleField + action-model workspace |
| FR29-31 | Feedback & Errors | Toast service + HTTP interceptor (global) + component-level error handling (domain) |
| FR32 | Dev Tooling | ApiInspector component on all detail pages |

**Non-Functional Requirements: ALL COVERED**
- Performance: lazy loading per entity, cursor pagination, no heavy client computation, skeleton loading states
- Security: JWT in localStorage, HTTPS only, interceptor for token injection, route guards, `.env.local` for credentials
- Integration: single API consumer, centralized service layer, auto-generated types from OpenAPI spec
- Code quality: TypeScript strict, standalone components, signals, ESLint + Prettier, consistent patterns across 7 modules

### Implementation Readiness Validation

**Decision Completeness: HIGH**
- All critical decisions documented with versions and rationale
- Technology versions verified via web search (Angular 20, Tailwind v4, CDK, lucide-angular 0.575.x)
- Deferred decisions explicitly listed with rationale (signal caching → polish epic, token refresh → backend, CI/CD → later)

**Structure Completeness: HIGH**
- Every file and directory specified in the project tree
- Every FR mapped to a specific location
- Cross-cutting concerns mapped to their homes
- Data flow diagram provided

**Pattern Completeness: HIGH**
- 15 conflict points identified and addressed
- 8 mandatory enforcement rules + 8 explicit anti-patterns
- Import ordering, component API conventions, error handling flow, loading state patterns all specified
- Concrete code examples provided

### Gap Analysis Results

**No critical gaps found.**

**Important gaps identified and resolved:**

1. **TSConfig path aliases** — Import examples use `@app/core/...` and `@app/shared/...`. Resolution: configure `paths` in `tsconfig.json` during project scaffold:
   ```json
   {
     "compilerOptions": {
       "paths": {
         "@app/*": ["src/app/*"]
       }
     }
   }
   ```

2. **CORS / Proxy configuration** — Development against the staging API from `localhost` may require a proxy. Resolution: include `proxy.conf.json` in scaffold if staging API doesn't set CORS headers for localhost:
   ```json
   {
     "/api": {
       "target": "https://laureatv2-api-staging.osc-fr1.scalingo.io",
       "secure": true,
       "changeOrigin": true
     }
   }
   ```
   Run with: `ng serve --proxy-config proxy.conf.json`

3. **API Inspector data capture pattern** — ApiInspector needs the raw HTTP response. Resolution: entity services store the last `HttpResponse` (including headers, status, body) in a `lastResponse` signal. ApiInspector reads this signal on detail pages. Pattern addition to BaseEntityService:
   ```typescript
   protected lastResponse = signal<HttpResponse<unknown> | null>(null);
   ```

**Nice-to-have gaps (deferred):**
- No e2e testing strategy (acceptable for v1 — 3 manual testers)
- No error boundary component (interceptor + toast covers this adequately)
- No performance monitoring (not needed for 3 internal users on staging)

### Architecture Completeness Checklist

**Requirements Analysis**
- [x] Project context thoroughly analyzed (PRD, product brief, UX spec, OpenAPI spec, original brief)
- [x] Scale and complexity assessed (medium complexity, frontend-only SPA)
- [x] Technical constraints identified (Angular 20, no backend, single API, TypeScript strict)
- [x] Cross-cutting concerns mapped (auth, error handling, pagination, loading states, dirty tracking)

**Architectural Decisions**
- [x] Critical decisions documented with versions (Angular 20, Tailwind v4, CDK, esbuild)
- [x] Technology stack fully specified (all dependencies listed with versions)
- [x] Integration patterns defined (BaseEntityService, interceptor chain, signal-based state)
- [x] Performance considerations addressed (lazy loading, cursor pagination, deferred caching)

**Implementation Patterns**
- [x] Naming conventions established (snake_case API, kebab-case files, app- selectors)
- [x] Structure patterns defined (flat feature folders, co-located tests, shared component subfolders)
- [x] Communication patterns specified (input/output signals, service signals, toast service)
- [x] Process patterns documented (error handling flow, loading states, form validation, navigation guards)

**Project Structure**
- [x] Complete directory structure defined (every file and folder)
- [x] Component boundaries established (presentational vs smart, core vs shared vs features)
- [x] Integration points mapped (data flow diagram)
- [x] Requirements to structure mapping complete (all 32 FRs mapped)

### Architecture Readiness Assessment

**Overall Status: READY FOR IMPLEMENTATION**

**Confidence Level: HIGH**

**Key Strengths:**
- Unusually complete input documents (PRD, UX spec with 13 components, pixel-level HTML mockup, live OpenAPI spec) reduce ambiguity to near-zero
- Single API consumer architecture is inherently simple — no backend complexity, no database decisions
- Consistent entity pattern (BaseEntityService + flat feature folders) makes the 7-entity scope manageable and predictable
- Technology stack is 100% Angular ecosystem defaults — no exotic libraries or unconventional patterns for the senior reviewer

**Areas for Future Enhancement:**
- Signal-based entity caching (deferred to v1 polish epic)
- Token refresh flow (pending backend `/auth/refresh` endpoint)
- CI/CD pipeline (when project moves to company GitHub)
- E2e testing strategy (when user base grows beyond 3)
- Runtime environment configuration (when production environment is ready)

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented in this file
- Use implementation patterns consistently across all 7 entity modules
- Respect project structure and boundaries — no deviations, no "improvements"
- Refer to this document for all architectural questions
- Refer to `ux-design-specification.md` for component behavior and visual design
- Refer to `ux-design-directions.html` for pixel-level implementation reference
- Refer to `api-observations.md` for known API gaps and backend feedback

**First Implementation Priority:**
1. `ng new admin-playground --style=css --routing --ssr=false` + configure TSConfig paths
2. Install dependencies: `tailwindcss @tailwindcss/postcss postcss @angular/cdk lucide-angular`
3. Configure Tailwind (PostCSS + `styles.css` + theme tokens from color palette)
4. Configure ESLint + Prettier
5. Run `openapi-typescript` to generate initial API types
6. Build `core/auth/` (AuthService, interceptor, guard, login page)
7. Build `core/layout/` (AppLayout with sidebar + header)
8. Build first shared components (DataTable, StatusBadge, Toast, ConfirmDialog)
9. Build first entity: Funding Programs (simplest CRUD, validates full pattern)
10. Build remaining entities in order of increasing complexity
