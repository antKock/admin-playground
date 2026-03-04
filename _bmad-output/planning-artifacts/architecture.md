---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-03-04'
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/product-brief-admin-playground-2026-03-03.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - _bmad-output/planning-artifacts/epics.md
  - docs/BRIEF_CLAUDE_PROJET_ADMIN_LAUREAT.md
  - docs/architecture-ACTEE.md
  - docs/comparison-report-ACTEE-vs-admin-playground.md
  - docs/color-palette.md
  - docs/reference-links.md
workflowType: 'architecture'
project_name: 'admin-playground'
user_name: 'Anthony'
date: '2026-03-04'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Migration Context

**This architecture document replaces the previous flat-architecture design (2026-03-03).** The project is being realigned to the **ACTEE corporate architecture guidelines** (Domain → Feature → UI layered architecture with NgRx Signal Stores, facades, and strict separation of concerns).

**Current Implementation State:**

| Component | Status | Migration Impact |
|-----------|--------|-----------------|
| **Auth system** (JWT, interceptor, guard, login) | Built (Epic 1) | Low — mostly infrastructure, stays in `core/` |
| **App shell** (sidebar, layout, routing) | Built (Epic 1) | Low — becomes a `page` wrapper |
| **Shared components** (DataTable, MetadataGrid, StatusBadge, Toast, ConfirmDialog) | Built (Epic 1) | None — already presentational, ACTEE-compliant |
| **BaseEntityService\<T\>** | Built (Epic 1) | **High — replaced by domain stores + API files** |
| **Funding Programs** (full CRUD) | Built (Epic 2) | **High — service → domain store + facade refactor** |
| **Action Themes** (CRUD + publish/disable/activate/duplicate) | Built (Epic 2) | **High — service → domain store + facade refactor** |
| **Action Models, Folder Models, Indicator Models, Communities, Agents** | Stubs only | None — build natively in ACTEE patterns |

### Requirements Overview

**Functional Requirements (32 FRs across 6 domains):**

| Domain | FRs | Architectural Impact (ACTEE lens) |
|--------|-----|----------------------------------|
| **Auth & Session** | FR1–FR4 | Stays in `core/auth/`. No ACTEE layer needed — infrastructure concern. |
| **Navigation & Layout** | FR5–FR6 | App shell becomes `pages/` layer. Sidebar stays in `core/layout/`. |
| **Entity CRUD** | FR7–FR12 | **Core migration target.** Each entity gets: `domains/{entity}/` (store + API + models) + `features/{entity}/` (derived store + facade + UI components). |
| **Status & Lifecycle** | FR13–FR16 | Status transitions become domain store mutations via `withMutations` + `httpMutation`. |
| **Relationships & Associations** | FR17–FR22 | Cross-domain reads handled by feature stores aggregating multiple domain stores. |
| **Indicator Parameters** | FR23–FR28 | **Most complex surface.** Domain use-cases own parameter validation logic. Facade orchestrates the workspace. |
| **Feedback & Errors** | FR29–FR31 | Toast service stays in `shared/`. Error interception stays in `core/`. |
| **Dev Tooling** | FR32 | API Inspector stays in `shared/components/`. |

**Non-Functional Requirements:**

- **Performance:** API-bound, no heavy client computation. Cursor pagination must feel responsive. No offline capability.
- **Security:** HTTPS only, JWT in localStorage, interceptor for token injection, route guards. No change from current.
- **Integration:** Single API consumer (Laureat REST API). OpenAPI spec is source of truth. Cursor-based pagination everywhere.
- **Code Quality:** Angular 20 standalone components, TypeScript strict, **NgRx Signal Stores** (replacing raw Angular signals in services), consistent ACTEE patterns across all 7 modules.

### UX Architectural Implications

The UX specification is comprehensive (14 steps, fully designed). Key architectural drivers under ACTEE:

1. **Design system (Tailwind CSS + Angular CDK)** — unchanged, stays in `shared/`
2. **13 custom shared components** — already presentational, ACTEE-compliant
3. **Explicit save pattern** — unsaved-state tracking moves from service signals to domain store state
4. **Model-as-workspace** (ActionModel detail) — facade orchestrates multiple domain stores (action-models + indicator-models), derived feature store exposes composed view
5. **Infinite scroll** (cursor-based) — pagination state managed by domain store via `withEntityResources`
6. **CDK usage** (Overlay, DragDrop, A11y) — UI-only, no ACTEE layer impact

### Scale & Complexity Assessment

| Indicator | Assessment |
|-----------|-----------|
| **Project type** | Angular 20 SPA — frontend-only, single API consumer |
| **Complexity** | Medium — standard CRUD patterns + one complex workspace surface |
| **Entity count** | 7 entities, varying complexity (simple CRUD → complex workspace) |
| **Architecture paradigm** | ACTEE: Domain → Feature → UI with NgRx Signal Stores |
| **Migration scope** | 2 entities to retrofit, 5 to build natively, infrastructure mostly stable |
| **Real-time** | None |
| **Multi-tenancy** | None |
| **Regulatory** | None (internal tool, no citizen data) |
| **Primary technical domain** | Frontend web application |

### Technical Constraints & Dependencies

1. **Angular 20** — standalone components, signals, lazy loading (mandated by PRD + brief)
2. **NEW: @ngrx/signals** — required by ACTEE for domain and feature stores
3. **NEW: ngrx-toolkit** — required by ACTEE for `withEntityResources`, `withMutations`, `httpMutation`
4. **Tailwind CSS + Angular CDK** — mandated by UX spec (unchanged)
5. **TypeScript strict mode** — mandated by PRD (unchanged)
6. **Single API consumer** — Laureat REST API, cursor-based pagination, OpenAPI spec as source of truth
7. **esbuild builder** — Angular default (unchanged)
8. **Development model:** AI-assisted (BMAD-driven), reviewed by senior Angular developer
9. **Hosting:** Vercel with GitHub auto-deploy (unchanged)

### Cross-Cutting Concerns

1. **Domain stores as single source of truth** — replaces `BaseEntityService<T>`. Every entity's state lives in a `signalStore` in `domains/{entity}/`.
2. **Facades as UI entry point** — components never talk to stores or services directly. One facade per feature.
3. **API centralization** — all HTTP operations defined in `{entity}.api.ts` files using resources and `HttpMutationRequest`. No scattered HTTP calls.
4. **Error handling** — centralized HTTP interceptor (unchanged) + domain store error state (replaces service-level error signals).
5. **Authentication** — JWT interceptor + guard (unchanged, stays in `core/auth/`).
6. **Status workflows** — domain mutations via `withMutations` (replaces service methods).
7. **Unsaved state management** — domain store state (replaces service-level signal tracking).
8. **Consistent module structure** — ACTEE pattern replicated across all 7 entity modules.

## Starter Template Evaluation

### Primary Technology Domain

Frontend web application (Angular 21 SPA) — **existing project, migration context**. No new project scaffolding needed. Evaluation focuses on new ACTEE dependencies being added to the existing stack.

### Current Stack (Already In Place)

| Dependency | Version | Status |
|-----------|---------|--------|
| Angular (core, CDK, forms, router) | 21.2.0 | Already installed |
| Tailwind CSS + PostCSS | 4.2.1 | Already installed |
| lucide-angular | 0.576.0 | Already installed |
| TypeScript | 5.9.2 | Already installed |
| Vitest | 4.0.8 | Already installed |
| ESLint + Prettier | 9.x / 3.8.x | Already installed |
| openapi-typescript | 7.13.0 | Already installed |
| RxJS | 7.8.x | Already installed |

### New Dependencies Required by ACTEE

| Dependency | Latest Version | Angular 21 Compat | Purpose |
|-----------|---------------|-------------------|---------|
| **@ngrx/signals** | 21.0.1 | Aligned (v21 = Angular 21) | `signalStore`, `withState`, `withComputed`, `withMethods` — core ACTEE store primitive |
| **@angular-architects/ngrx-toolkit** | 21.0.1 | Aligned (v21 = Angular 21) | `withEntityResources`, `withMutations`, `httpMutation` — ACTEE data layer |

### Installation Command

```bash
npm install @ngrx/signals @angular-architects/ngrx-toolkit
```

### What These Dependencies Provide

**@ngrx/signals (v21):**
- `signalStore()` — factory for creating signal-based stores (replaces `BaseEntityService<T>`)
- `withState()` — typed state definition
- `withComputed()` — derived signals (replaces computed signals in services)
- `withMethods()` — store methods
- `patchState()` — immutable state updates
- DevTools integration for debugging store state

**@angular-architects/ngrx-toolkit (v21):**
- `withEntityResources()` — connects Angular Resources (HTTP GET) to entity state in the store, auto-manages loading/error/entity state
- `withMutations()` — registers HTTP mutations (POST, PATCH, DELETE) on the store
- `httpMutation()` — defines individual mutation requests with race condition strategies (`switchOp`, `mergeOp`, `concatOp`, `exhaustOp`)
- `HttpMutationRequest` — typed mutation descriptor used in `{entity}.api.ts` files

### Compatibility Assessment

- **Angular 21 + @ngrx/signals 21 + ngrx-toolkit 21**: All on the same major version. Fully compatible.
- **Vitest**: No conflict — stores are plain TypeScript, testable without Angular TestBed.
- **Tailwind / CDK**: No conflict — UI layer is independent of state management.
- **openapi-typescript**: No conflict — generated types feed into domain models as before.

### Architectural Decisions Inherited From Existing Starter

All previous Angular CLI decisions remain in effect:
- **Build tooling:** esbuild-based builder (Angular default)
- **Styling:** Tailwind CSS v4 via PostCSS
- **Testing:** Vitest (already migrated from Karma)
- **Linting:** ESLint + Prettier with Angular-specific rules
- **Code organization:** Standalone components, lazy-loaded routes
- **Type generation:** openapi-typescript from live OpenAPI spec

### Risk Assessment for New Dependencies

| Risk | Level | Mitigation |
|------|-------|-----------|
| @ngrx/signals learning curve | Medium | Well-documented, active community, v21 is mature |
| ngrx-toolkit stability | Medium | Maintained by Angular Architects (Manfred Steyer), aligned with NgRx releases |
| Breaking changes in future versions | Low | Major versions align with Angular — predictable upgrade path |
| Bundle size impact | Low | Tree-shakeable, only imported features are bundled |

## Implementation Patterns & Consistency Rules

### Critical Conflict Points Identified

18 areas where AI agents could make different choices when implementing ACTEE patterns, organized into 5 categories. All patterns below are mandatory.

### Naming Patterns

**ACTEE Layer File Naming — Strict kebab-case with layer suffix:**

| Layer | File Pattern | Example |
|-------|-------------|---------|
| Domain store | `domains/{entity}/{entity}.store.ts` | `domains/funding-programs/funding-program.store.ts` |
| Domain API | `domains/{entity}/{entity}.api.ts` | `domains/funding-programs/funding-program.api.ts` |
| Domain models | `domains/{entity}/{entity}.models.ts` | `domains/funding-programs/funding-program.models.ts` |
| Domain forms | `domains/{entity}/forms/{entity}.form.ts` | `domains/funding-programs/forms/funding-program.form.ts` |
| Domain use-cases | `domains/{entity}/use-cases/{use-case-name}.use-case.ts` | `domains/indicator-models/use-cases/validate-parameter.use-case.ts` |
| Feature store | `features/{entity}/{entity}.store.ts` | `features/funding-programs/funding-program.store.ts` |
| Feature facade | `features/{entity}/{entity}.facade.ts` | `features/funding-programs/funding-program.facade.ts` |
| Feature UI | `features/{entity}/ui/{component-name}.component.ts` | `features/funding-programs/ui/funding-program-list.component.ts` |
| Page | `pages/{entity}/{entity}.page.ts` | `pages/funding-programs/funding-programs.page.ts` |
| Routes | `pages/{entity}/{entity}.routes.ts` | `pages/funding-programs/funding-programs.routes.ts` |

**Entity folder naming — Plural kebab-case** (unchanged):
`funding-programs`, `action-themes`, `action-models`, `folder-models`, `indicator-models`, `communities`, `agents`

**Store export naming — PascalCase with layer prefix:**
- Domain store: `FundingProgramDomainStore`
- Feature store: `FundingProgramFeatureStore`
- Rationale: Avoids ambiguity when both stores are injected in the same file (e.g., facade injects both).

**Facade export naming — PascalCase with `Facade` suffix:**
- `FundingProgramFacade`, `ActionThemeFacade`, etc.
- Injectable class (not a `signalStore` — a plain `@Injectable` that composes stores).

**API export naming — Functions prefixed with entity:**
- Resources: `fundingProgramListResource`, `fundingProgramDetailResource`
- Mutations: `createFundingProgramMutation`, `updateFundingProgramMutation`, `deleteFundingProgramMutation`
- Custom mutations: `publishActionThemeMutation`, `duplicateActionThemeMutation`

**Component selectors — `app-` prefix (unchanged):**
- `app-funding-program-list`, `app-funding-program-detail`, `app-funding-program-form`
- Page selectors: `app-funding-programs-page`

**API data conventions (unchanged):**
- JSON field names: `snake_case` matching API exactly
- No camelCase transformation layer
- Dates: ISO 8601 strings as returned by API
- IDs: string type
- Nulls: preserved as `null`

### Structure Patterns

**ACTEE Module Organization — Every entity follows this exact structure:**

```
src/app/
├── domains/{entity}/
│   ├── {entity}.store.ts          # signalStore — source of truth
│   ├── {entity}.api.ts            # resources + HttpMutationRequest
│   ├── {entity}.models.ts         # domain types (extends generated API types)
│   ├── forms/
│   │   └── {entity}.form.ts       # FormGroup factory function
│   └── use-cases/                 # optional — extract when complexity demands
│       └── {use-case}.use-case.ts
├── features/{entity}/
│   ├── {entity}.store.ts          # signalStore — computed only, read-only
│   ├── {entity}.facade.ts         # @Injectable — UI entry point
│   ├── use-cases/                 # optional — extract when facade orchestration is complex
│   │   └── {use-case}.use-case.ts
│   └── ui/
│       ├── {entity}-list.component.ts
│       ├── {entity}-detail.component.ts
│       └── {entity}-form.component.ts
└── pages/{entity}/
    ├── {entity}.page.ts           # route = layout only
    └── {entity}.routes.ts         # lazy-loaded route config
```

Same structure across all 7 entities without exception.

**Store Composition Order — Consistent `with*` ordering:**

```typescript
export const FundingProgramDomainStore = signalStore(
  { providedIn: 'root' },
  withState({ /* ... */ }),           // 1. State first
  withEntityResources({ /* ... */ }), // 2. Resources (GET)
  withMutations({ /* ... */ }),       // 3. Mutations (POST/PATCH/DELETE)
  withComputed(/* ... */),            // 4. Computed signals
  withMethods(/* ... */),             // 5. Methods last
);
```

Always follow this order. No exceptions.

**Test Placement — Co-located (unchanged):**
- `funding-program.store.spec.ts` next to `funding-program.store.ts`
- `funding-program.facade.spec.ts` next to `funding-program.facade.ts`
- Component specs next to components in `ui/`
- No separate `__tests__/` folders

**Shared Domain Utilities:**
```
src/app/domains/shared/
├── with-cursor-pagination.ts    # reusable store feature
└── ... (future shared store features)
```

### Format Patterns

**Paginated Response Structure (unchanged):**
```typescript
interface PaginatedResponse<T> {
  items: T[];
  cursor: string | null;
  limit: number;
}
```

**Domain Model Pattern — Extend generated types:**
```typescript
// domains/funding-programs/funding-program.models.ts
import { components } from '@app/core/api/generated/api-types';

export type FundingProgram = components['schemas']['FundingProgramResponse'];
export type CreateFundingProgram = components['schemas']['CreateFundingProgramRequest'];
export type UpdateFundingProgram = components['schemas']['UpdateFundingProgramRequest'];
```

Never hand-write types that the API already defines. Extend only for frontend-specific concerns.

**Form Factory Pattern:**
```typescript
// domains/funding-programs/forms/funding-program.form.ts
export function createFundingProgramForm(initial?: Partial<FundingProgram>): FormGroup {
  return new FormGroup({
    label: new FormControl(initial?.label ?? '', [Validators.required]),
    // ...
  });
}
```

Factories are pure functions. No `inject()`, no side effects.

**Error Display Format (unchanged):**
- Toast: **"Bold action"** + context
- Errors: *what happened* + *why* + *what to do*
- API error messages surfaced when available

### Communication Patterns

**Facade-to-UI Contract:**
```typescript
// features/funding-programs/funding-program.facade.ts
@Injectable({ providedIn: 'root' })
export class FundingProgramFacade {
  // Data signals — from feature store
  readonly items = this.featureStore.rows;
  readonly selectedItem = this.featureStore.selectedItem;
  readonly isLoading = this.featureStore.isLoading;

  // Intention methods — delegate to domain store
  load() { /* ... */ }
  loadMore() { /* ... */ }
  select(id: string) { /* ... */ }
  create(data: CreateFundingProgram) { /* ... */ }
  update(id: string, data: UpdateFundingProgram) { /* ... */ }
  delete(id: string) { /* ... */ }
}
```

- Data signals are `readonly` properties
- Intention methods are verbs (load, create, update, delete, publish, duplicate)
- Facade never exposes the store directly — only curated signals and methods

**Component → Facade Communication:**
- Components inject facade only: `private facade = inject(FundingProgramFacade)`
- Template binds to facade signals: `{{ facade.items() }}`
- Events call facade methods: `(click)="facade.delete(item.id)"`
- No `subscribe()`. No `async` pipe. No direct store access.

**Component Input/Output (unchanged):**
- `input()` / `input.required<T>()` for inputs
- `output()` for outputs
- No `@Input` / `@Output` decorators
- No two-way binding sugar

**Page Component Contract:**
```typescript
// pages/funding-programs/funding-programs.page.ts
@Component({
  selector: 'app-funding-programs-page',
  template: `<app-funding-program-list />`,
  imports: [FundingProgramListComponent],
})
export class FundingProgramsPage {}
```

Pages compose features. Zero logic. No service injection. No facade injection. Layout only.

### Process Patterns

**Loading State Convention — ngrx-toolkit resource status:**
- `withEntityResources` auto-manages loading state per resource
- Feature store exposes `isLoading` as `computed` from domain store resource status
- Facade exposes `isLoading` to UI
- DataTable accepts `isLoading` input → shows skeleton rows
- Detail views show skeleton blocks

**Mutation Status Convention:**
- Each `httpMutation` exposes its own status (idle, pending, success, error)
- Facade can expose per-mutation status for fine-grained UI feedback (e.g., "publishing..." spinner on publish button)
- Global mutation status available via `withMutations` aggregate

**Form Validation Flow (unchanged):**
- Client-side: on blur + on submit
- Error text below field on blur if invalid
- On submit: all validated, first error focused
- Server 422: mapped to fields where possible, otherwise toast

**Navigation Guard Flow (unchanged):**
- Unsaved changes → ConfirmDialog
- Discard → reset, allow navigation
- Stay → cancel navigation

**API Gap Documentation — Mandatory:**
- When an AI agent encounters an API gap (missing endpoint, unclear contract, schema mismatch, unexpected behavior), it MUST append an entry to `_bmad-output/api-observations.md`
- Entry format: **Observation** (what was found) → **Impact** (how it affects the frontend) → **Suggestion/Workaround** (what was done or what backend should change)
- This applies during both migration of existing entities and development of new ones
- Never silently work around an API limitation — document it first, then implement the workaround
- Examples of gaps to document: missing pagination total_count, unclear status transition endpoints, missing association CRUD endpoints, unexpected response shapes

**Import Organization — Updated for ACTEE layers:**
```typescript
// 1. Angular core
import { Component, inject } from '@angular/core';

// 2. Angular CDK
import { CdkDragDrop } from '@angular/cdk/drag-drop';

// 3. Third-party (NgRx, Lucide, etc.)
import { signalStore, withComputed } from '@ngrx/signals';

// 4. App domains
import { FundingProgramDomainStore } from '@app/domains/funding-programs/funding-program.store';

// 5. App features (facades, feature stores)
import { FundingProgramFacade } from '@app/features/funding-programs/funding-program.facade';

// 6. App shared
import { DataTableComponent } from '@app/shared/components/data-table/data-table.component';

// 7. Feature-local (relative)
import { FundingProgramListComponent } from './ui/funding-program-list.component';
```

### Enforcement Guidelines

**All AI agents MUST:**
1. Follow the ACTEE module structure exactly — `domains/` → `features/` → `pages/`
2. Never let UI components import stores or API files directly — facades only
3. Never let feature stores mutate state — `withComputed` only
4. Never let domain stores call HTTP directly — resources and mutations from API files only
5. Use the store composition order: state → resources → mutations → computed → methods
6. Export stores with layer-prefixed names (`DomainStore`, `FeatureStore`)
7. Keep page components logic-free — compose features, layout only
8. Use form factories from `domains/{entity}/forms/` — never define forms inline in components
9. Use `snake_case` for all API-related types — no camelCase transformation
10. Co-locate tests next to source files
11. Follow the import ordering convention (7 tiers)

**Anti-Patterns (explicitly forbidden):**
- Component importing a domain store directly (must go through facade)
- Feature store with `withMethods` or `withMutations` (read-only only)
- Domain store with inline HTTP calls (must use API file resources/mutations)
- Page component with `inject(Facade)` or any logic
- Form definition inside a component file (must use domain form factory)
- Creating a `utils/` grab-bag folder
- Using `any` type in the API or store layers
- Using `@ViewChild` for data passing
- Using `subscribe()` in components
- Using NgModule anywhere

## Project Structure & Boundaries

### Complete Project Directory Structure

```
admin-playground/
├── .eslintrc.json
├── .gitignore
├── .postcssrc.json
├── .prettierrc
├── angular.json
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.spec.json
├── vercel.json
│
├── scripts/
│   └── generate-api-types.sh
│
├── src/
│   ├── index.html
│   ├── main.ts
│   ├── styles.css
│   │
│   ├── app/
│   │   ├── app.component.ts
│   │   ├── app.routes.ts
│   │   ├── app.config.ts
│   │   │
│   │   ├── core/                                    # Infrastructure (NOT an ACTEE domain)
│   │   │   ├── api/
│   │   │   │   ├── generated/
│   │   │   │   │   └── api-types.ts                 # openapi-typescript output (never hand-edit)
│   │   │   │   └── paginated-response.model.ts
│   │   │   ├── auth/
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── auth.guard.ts
│   │   │   │   ├── auth.interceptor.ts
│   │   │   │   └── login.component.ts
│   │   │   ├── layout/
│   │   │   │   ├── app-layout.component.ts
│   │   │   │   ├── app-layout.component.html
│   │   │   │   └── app-layout.component.css
│   │   │   └── models/
│   │   │       └── ui.model.ts
│   │   │
│   │   ├── domains/                                 # ACTEE: Source of truth layer
│   │   │   ├── shared/
│   │   │   │   └── with-cursor-pagination.ts        # Reusable store feature
│   │   │   │
│   │   │   ├── funding-programs/
│   │   │   │   ├── funding-program.store.ts         # signalStore — domain source of truth
│   │   │   │   ├── funding-program.api.ts           # resources + HttpMutationRequest
│   │   │   │   ├── funding-program.models.ts        # types extending generated API types
│   │   │   │   ├── funding-program.store.spec.ts
│   │   │   │   └── forms/
│   │   │   │       └── funding-program.form.ts      # FormGroup factory
│   │   │   │
│   │   │   ├── action-themes/
│   │   │   │   ├── action-theme.store.ts
│   │   │   │   ├── action-theme.api.ts              # + publish/disable/activate/duplicate mutations
│   │   │   │   ├── action-theme.models.ts
│   │   │   │   ├── action-theme.store.spec.ts
│   │   │   │   └── forms/
│   │   │   │       └── action-theme.form.ts
│   │   │   │
│   │   │   ├── action-models/
│   │   │   │   ├── action-model.store.ts
│   │   │   │   ├── action-model.api.ts              # + indicator association mutations
│   │   │   │   ├── action-model.models.ts
│   │   │   │   ├── action-model.store.spec.ts
│   │   │   │   └── forms/
│   │   │   │       └── action-model.form.ts
│   │   │   │
│   │   │   ├── folder-models/
│   │   │   │   ├── folder-model.store.ts
│   │   │   │   ├── folder-model.api.ts
│   │   │   │   ├── folder-model.models.ts
│   │   │   │   ├── folder-model.store.spec.ts
│   │   │   │   └── forms/
│   │   │   │       └── folder-model.form.ts
│   │   │   │
│   │   │   ├── indicator-models/
│   │   │   │   ├── indicator-model.store.ts
│   │   │   │   ├── indicator-model.api.ts           # + association metadata CRUD
│   │   │   │   ├── indicator-model.models.ts
│   │   │   │   ├── indicator-model.store.spec.ts
│   │   │   │   ├── forms/
│   │   │   │   │   └── indicator-model.form.ts
│   │   │   │   └── use-cases/                       # extracted when complexity demands
│   │   │   │       └── (future: validate-parameter.use-case.ts)
│   │   │   │
│   │   │   ├── communities/
│   │   │   │   ├── community.store.ts
│   │   │   │   ├── community.api.ts                 # + assignUser/removeUser mutations
│   │   │   │   ├── community.models.ts
│   │   │   │   ├── community.store.spec.ts
│   │   │   │   └── forms/
│   │   │   │       └── community.form.ts
│   │   │   │
│   │   │   └── agents/
│   │   │       ├── agent.store.ts
│   │   │       ├── agent.api.ts                     # + soft-delete semantics
│   │   │       ├── agent.models.ts
│   │   │       ├── agent.store.spec.ts
│   │   │       └── forms/
│   │   │           └── agent.form.ts
│   │   │
│   │   ├── features/                                # ACTEE: Functional blocks
│   │   │   ├── funding-programs/
│   │   │   │   ├── funding-program.store.ts         # signalStore — computed only, read-only
│   │   │   │   ├── funding-program.facade.ts        # @Injectable — UI entry point
│   │   │   │   ├── funding-program.facade.spec.ts
│   │   │   │   ├── use-cases/                       # optional — extract when needed
│   │   │   │   └── ui/
│   │   │   │       ├── funding-program-list.component.ts
│   │   │   │       ├── funding-program-list.component.spec.ts
│   │   │   │       ├── funding-program-detail.component.ts
│   │   │   │       ├── funding-program-detail.component.spec.ts
│   │   │   │       ├── funding-program-form.component.ts
│   │   │   │       └── funding-program-form.component.spec.ts
│   │   │   │
│   │   │   ├── action-themes/
│   │   │   │   ├── action-theme.store.ts
│   │   │   │   ├── action-theme.facade.ts           # + publish/disable/activate/duplicate intentions
│   │   │   │   ├── action-theme.facade.spec.ts
│   │   │   │   └── ui/
│   │   │   │       ├── action-theme-list.component.ts
│   │   │   │       ├── action-theme-list.component.spec.ts
│   │   │   │       ├── action-theme-detail.component.ts
│   │   │   │       ├── action-theme-detail.component.spec.ts
│   │   │   │       ├── action-theme-form.component.ts
│   │   │   │       └── action-theme-form.component.spec.ts
│   │   │   │
│   │   │   ├── action-models/
│   │   │   │   ├── action-model.store.ts            # aggregates action-model + indicator-model domains
│   │   │   │   ├── action-model.facade.ts           # orchestrates workspace interactions
│   │   │   │   ├── action-model.facade.spec.ts
│   │   │   │   └── ui/
│   │   │   │       ├── action-model-list.component.ts
│   │   │   │       ├── action-model-detail.component.ts  # workspace view
│   │   │   │       └── action-model-form.component.ts
│   │   │   │
│   │   │   ├── folder-models/
│   │   │   │   ├── folder-model.store.ts
│   │   │   │   ├── folder-model.facade.ts
│   │   │   │   ├── folder-model.facade.spec.ts
│   │   │   │   └── ui/
│   │   │   │       ├── folder-model-list.component.ts
│   │   │   │       ├── folder-model-detail.component.ts
│   │   │   │       └── folder-model-form.component.ts
│   │   │   │
│   │   │   ├── indicator-models/
│   │   │   │   ├── indicator-model.store.ts
│   │   │   │   ├── indicator-model.facade.ts
│   │   │   │   ├── indicator-model.facade.spec.ts
│   │   │   │   └── ui/
│   │   │   │       ├── indicator-model-list.component.ts
│   │   │   │       ├── indicator-model-detail.component.ts  # 3-col metadata, list values, usage
│   │   │   │       └── indicator-model-form.component.ts
│   │   │   │
│   │   │   ├── communities/
│   │   │   │   ├── community.store.ts
│   │   │   │   ├── community.facade.ts
│   │   │   │   ├── community.facade.spec.ts
│   │   │   │   └── ui/
│   │   │   │       ├── community-list.component.ts
│   │   │   │       ├── community-detail.component.ts
│   │   │   │       └── community-form.component.ts
│   │   │   │
│   │   │   └── agents/
│   │   │       ├── agent.store.ts
│   │   │       ├── agent.facade.ts
│   │   │       ├── agent.facade.spec.ts
│   │   │       └── ui/
│   │   │           ├── agent-list.component.ts
│   │   │           ├── agent-detail.component.ts
│   │   │           └── agent-form.component.ts
│   │   │
│   │   ├── pages/                                   # ACTEE: Routes = layout only
│   │   │   ├── funding-programs/
│   │   │   │   ├── funding-programs.page.ts
│   │   │   │   └── funding-programs.routes.ts
│   │   │   ├── action-themes/
│   │   │   │   ├── action-themes.page.ts
│   │   │   │   └── action-themes.routes.ts
│   │   │   ├── action-models/
│   │   │   │   ├── action-models.page.ts
│   │   │   │   └── action-models.routes.ts
│   │   │   ├── folder-models/
│   │   │   │   ├── folder-models.page.ts
│   │   │   │   └── folder-models.routes.ts
│   │   │   ├── indicator-models/
│   │   │   │   ├── indicator-models.page.ts
│   │   │   │   └── indicator-models.routes.ts
│   │   │   ├── communities/
│   │   │   │   ├── communities.page.ts
│   │   │   │   └── communities.routes.ts
│   │   │   └── agents/
│   │   │       ├── agents.page.ts
│   │   │       └── agents.routes.ts
│   │   │
│   │   ├── shared/                                  # Presentational (unchanged)
│   │   │   ├── components/
│   │   │   │   ├── data-table/
│   │   │   │   ├── status-badge/
│   │   │   │   ├── confirm-dialog/
│   │   │   │   ├── toast/
│   │   │   │   ├── save-bar/
│   │   │   │   ├── metadata-grid/
│   │   │   │   ├── section-anchors/
│   │   │   │   ├── api-inspector/
│   │   │   │   ├── indicator-card/
│   │   │   │   ├── toggle-row/
│   │   │   │   ├── rule-field/
│   │   │   │   ├── indicator-picker/
│   │   │   │   └── param-hint-icons/
│   │   │   ├── services/
│   │   │   │   ├── toast.service.ts
│   │   │   │   └── confirm-dialog.service.ts
│   │   │   └── pipes/
│   │   │
│   │   └── environments/
│   │       ├── environment.ts
│   │       └── environment.prod.ts
│   │
│   └── assets/
```

### Architectural Boundaries

**ACTEE Layer Data Flow:**

```
Page (route entry)
  │ composes
  ▼
Feature UI (components)
  │ injects
  ▼
Facade (@Injectable)
  │ reads              │ delegates
  ▼                    ▼
Feature Store          Domain Store
(computed only)        (source of truth)
  │ reads              │ consumes
  ▼                    ▼
Domain Store           API file
(source of truth)      (resources + mutations)
                       │ uses
                       ▼
                    core/api/generated/api-types.ts
```

**Boundary Rules:**
- Pages → can only import feature UI components
- Feature UI → can only import facade
- Facade → can import feature store + domain store(s)
- Feature store → can only import domain store(s) (read-only via `computed`)
- Domain store → can only import API file definitions
- API file → can only import generated types + `HttpClient`

**Infrastructure Boundary (`core/`):**
- `core/auth/` — auth service, interceptor, guard, login. Standalone. Not an ACTEE domain.
- `core/layout/` — app shell (sidebar, header). Standalone.
- `core/api/generated/` — auto-generated types. Read-only, never hand-edited.
- `core/models/` — shared frontend-only types (toast types, UI enums).

**Shared Boundary (`shared/`):**
- Purely presentational components — `input()` / `output()` only
- Shared services (toast, confirm-dialog) — UI infrastructure
- No domain knowledge, no store access, no facade access

### Requirements → Structure Mapping

| FR Domain | Primary Location |
|-----------|-----------------|
| **FR1-4 (Auth)** | `core/auth/` — AuthService, guard, interceptor, login |
| **FR5-6 (Navigation)** | `core/layout/` — AppLayout with sidebar + header |
| **FR7-12 (Entity CRUD)** | `domains/*/` (stores + APIs) + `features/*/` (facades + UI) + `pages/*/` (routes) |
| **FR13-16 (Status)** | `domains/*/` (status mutations in API files) + `features/*/` (facade exposes intentions) + `shared/components/status-badge/` |
| **FR17-22 (Relationships)** | `features/action-models/action-model.store.ts` (aggregates action-model + indicator-model domains) + `shared/components/metadata-grid/` + `shared/components/indicator-picker/` |
| **FR23-28 (Indicator Params)** | `domains/indicator-models/` (store + API + forms) + `features/action-models/` (workspace facade) + `shared/components/indicator-card/`, `toggle-row/`, `rule-field/` |
| **FR29-31 (Feedback)** | `shared/components/toast/` + `shared/services/toast.service.ts` + `core/auth/auth.interceptor.ts` |
| **FR32 (API Inspector)** | `shared/components/api-inspector/` |

### Cross-Cutting Concerns Mapping

| Concern | Location |
|---------|----------|
| JWT authentication | `core/auth/` (service + interceptor + guard) |
| Error handling | `core/auth/auth.interceptor.ts` (infrastructure) + mutation status via facades (domain) |
| Toast notifications | `shared/services/toast.service.ts` + `shared/components/toast/` |
| Cursor pagination | `domains/shared/with-cursor-pagination.ts` (reusable store feature) |
| API types | `core/api/generated/api-types.ts` (auto-generated) |
| Design tokens | `src/styles.css` (Tailwind theme) |
| Unsaved state | Domain store state + facade exposure + `shared/components/save-bar/` |
| Confirmation dialogs | `shared/services/confirm-dialog.service.ts` + `shared/components/confirm-dialog/` |

### TSConfig Path Aliases

```json
{
  "compilerOptions": {
    "paths": {
      "@app/*": ["src/app/*"],
      "@domains/*": ["src/app/domains/*"],
      "@features/*": ["src/app/features/*"],
      "@pages/*": ["src/app/pages/*"],
      "@shared/*": ["src/app/shared/*"],
      "@core/*": ["src/app/core/*"]
    }
  }
}
```

### Development Workflow

**Development:** `ng serve` — HMR on `http://localhost:4200`

**Type Generation:** `scripts/generate-api-types.sh` — runs `openapi-typescript` → `core/api/generated/api-types.ts`

**Build & Deploy:** `ng build` → `dist/admin-playground/` → push to GitHub → Vercel auto-deploys

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Domain store architecture with `signalStore` + `withEntityResources` + `withMutations`
- Reusable `withCursorPagination()` custom store feature (replaces `BaseEntityService<T>`)
- Facade as single UI entry point
- API file pattern (`{entity}.api.ts` with resources + `HttpMutationRequest`)
- Form ownership in domain layer
- Migration strategy for existing entities (big bang per entity)

**Important Decisions (Shape Architecture):**
- Feature store always present (structural consistency)
- Error handling via mutation status (ngrx-toolkit native)
- Page components as route = layout only

**Deferred Decisions (v2):**
- Signal-based entity caching (deferred — no caching for v1, fresh API calls)
- Token refresh (deferred — backend needs `/auth/refresh` endpoint)
- CI/CD pipeline (deferred — Vercel auto-deploys on push)
- Domain use-cases (ACTEE says "extract when complexity demands" — deferred until indicator parameter logic proves complex enough)

### Data Architecture

**Domain Store Pattern — `signalStore` + composable features:**
- Each entity gets a domain store in `domains/{entity}/{entity}.store.ts`
- Store composed with: `withState`, `withComputed`, `withMethods`, `withEntityResources`, `withMutations`
- Domain store is the **single source of truth** for entity state
- No direct HTTP calls in stores — all I/O defined in `{entity}.api.ts`

**Cursor Pagination — Reusable `withCursorPagination()` custom store feature:**
- A shared custom store feature `withCursorPagination<T>()` encapsulates: cursor state, hasMore flag, loadMore method, append-on-load behavior
- Wraps `withEntityResources` with cursor/limit parameters
- Reused across all 7 entity domain stores — preserves the generic reusability of the current `BaseEntityService<T>` in ACTEE's paradigm
- Located in `src/app/domains/shared/with-cursor-pagination.ts`

**API File Pattern — `{entity}.api.ts`:**
- Each entity gets `domains/{entity}/{entity}.api.ts`
- Exports: resource definitions (for `withEntityResources`) + `HttpMutationRequest` definitions (for `withMutations`)
- All HTTP endpoints for an entity live in this single file
- Uses auto-generated types from `core/api/generated/api-types.ts`

**Form Ownership — Domain owns form definitions:**
- Form factory functions live in `domains/{entity}/forms/{entity}.form.ts`
- Each factory returns a typed `FormGroup` with validators
- UI components call the factory but don't define the form structure
- Aligns with ACTEE: domain owns business rules, forms are business rules

**Client-Side Caching — None for v1:**
- Every navigation triggers a fresh API call (unchanged from current)
- Domain store state is the runtime cache; no persistence layer
- Deferred: signal-based entity cache if API latency becomes noticeable

### Authentication & Security

**Unchanged from current implementation:**
- JWT stored in `localStorage` (3 trusted internal users, no public surface)
- HTTP interceptor injects JWT on all requests
- 401 → redirect to login with preserved destination
- Functional `canActivate` guard checks token presence
- No token refresh (deferred to backend)
- Auth stays in `core/auth/` — not an ACTEE domain (infrastructure concern)

### API & Communication Patterns

**Resource-based data fetching (`withEntityResources`):**
- GET operations defined as resources in `{entity}.api.ts`
- Resources auto-manage: loading state, error state, entity state
- Domain store consumes resources — never calls HttpClient directly
- `withCursorPagination()` wraps resources for paginated list endpoints

**Mutation-based writes (`withMutations` + `httpMutation`):**
- POST, PATCH, DELETE operations defined as `HttpMutationRequest` in `{entity}.api.ts`
- Domain store registers mutations via `withMutations`
- Mutation status (loading, success, error) tracked per mutation by ngrx-toolkit
- Race condition strategy: `concatOp` (default) for most mutations; `exhaustOp` for publish/status transitions

**Error Handling — Mutation status (ngrx-toolkit native):**
- Infrastructure errors (401, 500, network): HTTP interceptor → toast (unchanged)
- Domain errors (409, 422, 400): mutation status exposes error per operation → facade exposes to UI → component displays contextual message
- No separate `error` signal in domain store — mutation status is the error channel
- Toast service remains the centralized notification channel

**API Response Typing — Strict (unchanged):**
- Auto-generated types from OpenAPI spec (`core/api/generated/api-types.ts`)
- `snake_case` field names matching API exactly — no camelCase transformation
- No `any` types in the API layer

### Frontend Architecture

**Component Architecture — ACTEE layered:**
- **Pages** (`pages/{entity}/`): route = layout only. Compose features, no logic.
- **Feature UI** (`features/{entity}/ui/`): components talk only to facade. Can contain form logic, validation UI, conditional display. Never import store, use-case, or service directly.
- **Shared components** (`shared/components/`): purely presentational (unchanged, already ACTEE-compliant)

**Feature Store — Always present:**
- Every feature gets a `signalStore` in `features/{entity}/{entity}.store.ts`
- Read-only: `withComputed` only — no mutations, no API calls, no methods that modify state
- Exposes view-model signals derived from one or more domain stores
- Even for simple CRUD entities where it's a passthrough — structural consistency across all 7 entities

**Facade — Single UI entry point:**
- Every feature gets a facade in `features/{entity}/{entity}.facade.ts`
- Exposes: data signals from feature store + intention methods that delegate to domain store
- Components inject only the facade — never stores, services, or use-cases directly
- Testable without Angular (mock the stores)

**Signal Usage — Store-native:**
- Domain stores expose signals via `signalStore` (replaces `toSignal()` bridge in services)
- Feature stores expose `computed` signals
- Facades expose both data signals and action methods
- Components consume facade signals for template binding
- No `subscribe()` in components. No `async` pipe. Signals only.

**Lazy Loading — One route per entity (unchanged):**
- 7 lazy-loaded feature routes, one per entity
- Each route loads via `pages/{entity}/` page component
- Shared components loaded eagerly (small, used everywhere)

### Infrastructure & Deployment

**Unchanged from current:**
- Vercel with GitHub auto-deploy
- `vercel.json` with SPA fallback rewrite + API proxy
- `ng build` → static files
- ESLint + Prettier for consistency
- Environment configuration via `environment.ts` files
- No CI/CD pipeline for v1

### Decision Impact Analysis

**Implementation Sequence:**
1. Install `@ngrx/signals` + `@angular-architects/ngrx-toolkit`
2. Create `domains/shared/with-cursor-pagination.ts` (reusable store feature)
3. Create folder structure (`domains/`, `features/` restructure, `pages/`)
4. **Pilot migration**: Funding Programs (simplest entity) — domain store + API + feature store + facade + update components
5. **Second migration**: Action Themes (adds status mutations: publish/disable/activate/duplicate)
6. Build remaining 5 entities natively in ACTEE patterns
7. Remove `BaseEntityService<T>` and old service files

**Cross-Component Dependencies:**
- `withCursorPagination()` must exist before any domain store
- Domain stores depend on: `{entity}.api.ts` + auto-generated types
- Feature stores depend on: domain stores
- Facades depend on: feature stores + domain stores
- UI components depend on: facades only
- Pages depend on: feature UI components

## Architecture Validation Results

### Coherence Validation

**Decision Compatibility: PASS**
- Angular 21 + @ngrx/signals 21 + ngrx-toolkit 21: all aligned, fully compatible
- ACTEE layer pattern fully implemented: `domains/` → `features/` → `pages/`
- signalStore composition: `withState` → `withEntityResources` → `withMutations` → `withComputed` → `withMethods`
- All ACTEE golden rules enforced

**Pattern Consistency: PASS**
- 18 conflict points addressed with enforceable rules
- Naming conventions align across all ACTEE layers
- Import ordering (7 tiers) accounts for domain/feature/page layers
- Store composition order is deterministic

**Structure Alignment: PASS**
- Directory structure matches ACTEE folder convention exactly
- Feature structure includes optional `use-cases/` folder per ACTEE spec
- Every entity follows identical module structure
- Boundary rules prevent cross-layer imports

### ACTEE Compliance Matrix

| ACTEE Golden Rule | Implementation | Enforced By |
|------------------|---------------|-------------|
| Pages = aucune logique métier | Zero-logic page components | Anti-pattern: page with inject() |
| UI ne parle qu'à une facade | Components inject facade only | Anti-pattern: component imports store |
| Toute mutation passe par domain store | Facade delegates to domain store | Anti-pattern: feature store with withMutations |
| Domain = seule source de vérité | signalStore in domains/ | Structure: domains/{entity}/{entity}.store.ts |
| Stores dérivés en lecture seule | Feature stores: withComputed only | Anti-pattern: feature store with withMethods |
| Use-cases optionnels | Deferred, folder structure ready | domains/{entity}/use-cases/ + features/{entity}/use-cases/ |

### Requirements Coverage Validation

**Functional Requirements: 32/32 COVERED**

| FR Range | Domain | Architectural Support |
|----------|--------|----------------------|
| FR1-4 | Auth & Session | `core/auth/` — unchanged |
| FR5-6 | Navigation & Layout | `core/layout/` + `pages/` |
| FR7-12 | Entity CRUD | `domains/*/` + `features/*/` + `pages/*/` |
| FR13-16 | Status & Lifecycle | Domain mutations + facade intentions + StatusBadge |
| FR17-22 | Relationships | Feature stores aggregating domains + MetadataGrid + IndicatorPicker |
| FR23-28 | Indicator Parameters | Domain store + forms + (future) use-cases + workspace facade |
| FR29-31 | Feedback & Errors | Toast + interceptor + mutation status |
| FR32 | Dev Tooling | ApiInspector shared component |

**Non-Functional Requirements: ALL COVERED**
- Performance: lazy loading, cursor pagination via `withCursorPagination`, skeleton loading from resource status
- Security: JWT in localStorage, interceptor, route guards (unchanged)
- Integration: single API consumer, centralized API files, auto-generated types
- Code quality: TypeScript strict, ACTEE patterns enforced, ESLint + Prettier

### Implementation Readiness Validation

**Decision Completeness: HIGH**
- All critical decisions documented with rationale
- Technology versions verified (Angular 21, @ngrx/signals 21, ngrx-toolkit 21)
- Deferred decisions explicitly listed

**Structure Completeness: HIGH**
- Every file and directory specified
- Every FR mapped to specific locations
- Cross-cutting concerns mapped
- Data flow diagram provided

**Pattern Completeness: HIGH**
- 18 conflict points addressed
- 11 mandatory enforcement rules + 10 explicit anti-patterns
- Code examples for all major patterns

### Gap Analysis Results

**Critical gaps: None.**

**Important gaps identified and resolved:**

1. **Feature use-cases folder** — ACTEE shows `features/{entity}/use-cases/` as optional. Was missing from structure. **Resolution:** Added to structure pattern.

2. **API Observations process** — API is behind PRD requirements. **Resolution:** Added mandatory process pattern: agents update `_bmad-output/api-observations.md` when encountering API gaps.

3. **API Inspector data capture** — Resources/mutations don't expose raw HTTP responses. **Resolution:** `HttpResponseCapture` interceptor in `core/api/`.

4. **TSConfig path aliases** — New aliases needed for ACTEE layers. **Resolution:** Update during setup phase.

5. **Route updates** — `app.routes.ts` must point to `pages/`. **Resolution:** Part of each entity migration.

6. **Existing test migration** — Tests reference old service pattern. **Resolution:** Included in big-bang migration per entity.

**Nice-to-have gaps (deferred):**
- No e2e testing strategy (acceptable for v1)
- No error boundary component (interceptor + mutation status covers adequately)
- No performance monitoring (not needed for 3 internal users)

### Architecture Completeness Checklist

**Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Migration context documented (EPICs 1 & 2 built)
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] ACTEE compliance verified against all golden rules
- [x] Migration strategy decided (big bang per entity)
- [x] Deferred decisions explicitly listed

**Implementation Patterns**
- [x] Naming conventions established (18 conflict points)
- [x] Structure patterns defined (ACTEE module structure)
- [x] Communication patterns specified
- [x] Process patterns documented
- [x] API observations process mandated

**Project Structure**
- [x] Complete directory structure defined
- [x] ACTEE layer boundaries established
- [x] Requirements to structure mapping complete
- [x] Feature use-cases folder included per ACTEE spec

### Architecture Readiness Assessment

**Overall Status: READY FOR IMPLEMENTATION**

**Confidence Level: HIGH**

**Key Strengths:**
- Full ACTEE compliance — all 6 golden rules enforced with anti-patterns
- Reusable `withCursorPagination()` preserves generic CRUD pattern
- Clear migration path for 2 existing + 5 new entities
- All dependency versions aligned (Angular 21 + NgRx 21 + ngrx-toolkit 21)
- API observations process ensures gaps are tracked, not silently worked around

**Areas for Future Enhancement:**
- Domain use-cases: extract when indicator parameter logic demands
- Feature use-cases: extract when facade orchestration becomes complex
- Signal-based entity caching: deferred to polish phase
- E2E testing: add when project moves to company GitHub

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all ACTEE layer boundaries exactly as documented
- Use implementation patterns consistently across all 7 entity modules
- Respect the store composition order (state → resources → mutations → computed → methods)
- **When encountering API gaps or discrepancies:** update `_bmad-output/api-observations.md` with the observation, impact, and any workaround decision taken. Never silently work around an API limitation.
- Refer to this document for all architectural questions

**First Implementation Priority:**
1. `npm install @ngrx/signals @angular-architects/ngrx-toolkit`
2. Update `tsconfig.json` with ACTEE path aliases
3. Create `domains/shared/with-cursor-pagination.ts`
4. Create folder structure (`domains/`, `pages/`)
5. Pilot migration: Funding Programs
