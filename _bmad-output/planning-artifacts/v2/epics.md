---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories, step-04-final-validation]
status: 'complete'
completedAt: '2026-03-23'
inputDocuments:
  - _bmad-output/implementation-artifacts/v2/v2-technical-analysis.md
  - docs/architecture-ACTEE.md
  - _bmad-output/planning-artifacts/v1/architecture.md
  - _bmad-output/planning-artifacts/v1/epics.md
  - _bmad-output/planning-artifacts/v1.1/epics.md
  - _bmad-output/planning-artifacts/v1.2/epics.md
---

# admin-playground v2 - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for admin-playground v2, decomposing the requirements from the V2 Technical Analysis (code quality refactoring & handover preparation) and ACTEE Architecture guidelines into implementable stories. v2 focuses on structural refactoring, separation of concerns, shared component creation, and developer documentation — no new features.

Epic numbering continues from v1.2 (Epics 8–14).

## Requirements Inventory

### Functional Requirements

FR1: Externalize all inline templates (28 components) into dedicated `.html` files
FR2: Externalize all inline styles (15+ components) into dedicated `.css` files
FR3: Co-locate API Inspector files (interceptor, service, component) into `shared/api-inspector/`
FR4: Co-locate JSON-Logic files (11+ files) into `shared/jsonlogic/`
FR5: Co-locate Toast service with Toast component in `shared/components/toast/`
FR6: Co-locate Confirm Dialog service with Confirm Dialog component
FR7: Move OpenAPI watcher from `core/services/` to `core/api/`
FR8: Extract business logic from `action-model-detail` (`serverCards` computed) to facade/use-case
FR9: Extract business logic from `indicator-model-form` (`filteredAvailable` computed) to facade
FR10: Extract business logic from `indicator-model-form` (submit data preparation) to facade
FR11: Extract business logic from `community-users` (`filteredUsers` computed) to facade
FR12: Extract duplicated `agentTypeLabels` to shared utility
FR13: Extract business logic from `agent-list` (row transformation) to facade
FR14: Migrate `AuthService` to `AuthStore` using `signalStore` (ACTEE-compliant)
FR15: Create shared `FormFieldComponent` for validation pattern deduplication (9 forms to migrate)
FR16: Create shared `TooltipDirective` replacing CSS custom tooltips and native `title` attributes
FR17: Create `ApiInspectorContainerComponent` to eliminate manual `<app-api-inspector>` inclusion
FR18: Create shared layout components (list-page-layout, detail-page-layout, form-page-layout)
FR19: Document `withCursorPagination` pattern
FR20: Write developer guide for ACTEE patterns
FR21: Document known limitations and recommendations

### Non-Functional Requirements

NFR1: No logic changes during template/style externalization — extraction only
NFR2: No logic changes during file moves — relocation only
NFR3: `npx ng build` must pass after every batch/move
NFR4: `npx ng test --no-watch` must pass after every batch/move
NFR5: Components post-extraction must only contain UI logic and facade calls (ACTEE compliance)
NFR6: All imports must be updated after every file relocation
NFR7: Follow ACTEE architecture: domain → feature → UI separation
NFR8: Existing tests must be adapted (not deleted) when logic moves to facades

### Additional Requirements

- ACTEE pattern: UI speaks only to facade, all mutations through domain stores
- Stores use `signalStore` with `withState`, `withComputed`, `withMethods`, `withMutations`
- File naming follows strict kebab-case conventions from v1 architecture
- Path aliases (`@app/`, `@shared/`, `@domains/`, `@features/`, `@core/`) must be maintained
- AuthStore must follow domain store composition order: `withState` → resources → mutations → computed → methods
- `FormFieldComponent` must handle label, error display, and `border-error` class application
- Execution order is sequential: E1 → E2 → E3

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1 | 15 | Externalize inline templates (28 components) |
| FR2 | 15 | Externalize inline styles (15+ components) |
| FR3 | 15 | Co-locate API Inspector files |
| FR4 | 15 | Co-locate JSON-Logic files |
| FR5 | 15 | Co-locate Toast service with component |
| FR6 | 15 | Co-locate Confirm Dialog service with component |
| FR7 | 15 | Move OpenAPI watcher to `core/api/` |
| FR8 | 16 | Extract `serverCards` logic from action-model-detail |
| FR9 | 16 | Extract `filteredAvailable` logic from indicator-model-form |
| FR10 | 16 | Extract submit data preparation from indicator-model-form |
| FR11 | 16 | Extract `filteredUsers` logic from community-users |
| FR12 | 16 | Extract duplicated `agentTypeLabels` to shared util |
| FR13 | 16 | Extract row transformation from agent-list |
| FR14 | 16 | Migrate AuthService → AuthStore |
| FR15 | 16 | Create shared FormFieldComponent |
| FR16 | 16 | Create shared TooltipDirective |
| FR17 | 16 | Create ApiInspectorContainerComponent |
| FR18 | 16 | Create shared layout components |
| FR19 | 17 | Document withCursorPagination |
| FR20 | 17 | Write ACTEE developer guide |
| FR21 | 17 | Document known limitations |

## Epic List

### Epic 15: Code Organization & Maintainability
Developers can navigate, read, and maintain every component efficiently — all templates/styles are in dedicated files, and logically related files are co-located.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7

### Epic 16: ACTEE Compliance & Reusable Patterns
Developers can build new features using consistent ACTEE patterns — business logic lives in facades, auth uses a proper store, and shared components eliminate boilerplate.
**FRs covered:** FR8, FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR16, FR17, FR18

### Epic 17: Developer Documentation & Handover
New developers can onboard in under 10 minutes — custom patterns are documented, ACTEE conventions are explained, and known limitations are transparent.
**FRs covered:** FR19, FR20, FR21

---

## Epic 15: Code Organization & Maintainability

Developers can navigate, read, and maintain every component efficiently — all templates/styles are in dedicated files, and logically related files are co-located.

### Story 15.1: Externalize Templates and Styles for Shared Components

As a developer,
I want all shared components to have their templates and styles in dedicated `.html` and `.css` files,
So that I can read and edit markup and styling without scrolling through TypeScript logic.

**Acceptance Criteria:**

**Given** the 15 shared components with inline templates and styles (indicator-card, rule-field, openapi-banner, column-filter-popover, indicator-picker, param-hint-icons, toast, breadcrumb, toggle-row, section-anchors, metadata-grid, confirm-dialog, status-badge, multi-selector, save-bar)
**When** the extraction is complete
**Then** each component uses `templateUrl: './xxx.component.html'` instead of `template:`
**And** each component with inline styles uses `styleUrl: './xxx.component.css'` instead of `styles:`
**And** no logic or markup has been modified — only extracted to files
**And** `npx ng build` passes without errors
**And** `npx ng test --no-watch` passes without errors

---

### Story 15.2: Externalize Templates for Feature and Core Components

As a developer,
I want all feature and core components to have their templates in dedicated `.html` files,
So that the entire codebase follows a consistent file structure.

**Acceptance Criteria:**

**Given** the 13 components with inline templates only (activity-feed-page, agent-form, user-form, funding-program-form, community-form, action-theme-form, community-users, user-communities, folder-model-form, activity-list, api-inspector, login, community-list)
**When** the extraction is complete
**Then** each component uses `templateUrl: './xxx.component.html'` instead of `template:`
**And** no logic or markup has been modified — only extracted to files
**And** `npx ng build` passes without errors
**And** `npx ng test --no-watch` passes without errors

---

### Story 15.3: Co-locate API Inspector Files

As a developer,
I want all API Inspector-related files (interceptor, service, component) grouped in a single folder,
So that I can find and maintain the entire feature in one place.

**Acceptance Criteria:**

**Given** the API Inspector files are currently spread across `core/api/`, `shared/services/`, and `shared/components/api-inspector/`
**When** the relocation is complete
**Then** all files exist under `shared/api-inspector/`:
  - `api-inspector.interceptor.ts` (+ spec)
  - `api-inspector.service.ts` (+ spec)
  - `api-inspector.component.ts` (+ html + css + spec)
**And** all imports referencing the old paths are updated across the entire codebase
**And** path aliases are updated if necessary
**And** no logic has been modified — only file locations changed
**And** `npx ng build` passes without errors
**And** `npx ng test --no-watch` passes without errors

---

### Story 15.4: Co-locate JSON-Logic Files

As a developer,
I want all JSON-Logic-related files (validation, prose, tokenizer, parser, autocomplete, editors, variable dictionary) grouped in a single folder,
So that I can understand and maintain the rule engine as a cohesive module.

**Acceptance Criteria:**

**Given** 11+ JSON-Logic files currently scattered in `shared/utils/` and `shared/services/`
**When** the relocation is complete
**Then** all files exist under `shared/jsonlogic/`:
  - `jsonlogic-validate.ts` (+ spec)
  - `jsonlogic-prose.ts` (+ spec)
  - `prose-parser.ts` (+ spec)
  - `prose-tokenizer.ts` (+ spec)
  - `prose-autocomplete.ts` (+ spec)
  - `prose-codemirror-language.ts` (+ spec)
  - `json-editor-setup.ts`
  - `prose-editor-setup.ts`
  - `variable-dictionary.service.ts` (+ spec)
**And** all imports referencing the old paths are updated across the entire codebase
**And** no logic has been modified — only file locations changed
**And** `npx ng build` passes without errors
**And** `npx ng test --no-watch` passes without errors

---

### Story 15.5: Co-locate Service Files with Their Components

As a developer,
I want Toast service, Confirm Dialog service, and OpenAPI watcher placed alongside their related files,
So that logically coupled files are easy to find.

**Acceptance Criteria:**

**Given** `toast.service.ts` is in `shared/services/` while its component is in `shared/components/toast/`
**When** the relocation is complete
**Then** `toast.service.ts` exists in `shared/components/toast/`
**And** all imports referencing the old toast service path are updated

**Given** `confirm-dialog.service.ts` is in `shared/services/` while its component is in `shared/components/confirm-dialog/`
**When** the relocation is complete
**Then** `confirm-dialog.service.ts` exists in `shared/components/confirm-dialog/`
**And** all imports referencing the old confirm dialog service path are updated

**Given** `openapi-watcher.service.ts` is in `core/services/`
**When** the relocation is complete
**Then** `openapi-watcher.service.ts` exists in `core/api/`
**And** all imports referencing the old path are updated

**And** no logic has been modified in any relocated file
**And** `npx ng build` passes without errors
**And** `npx ng test --no-watch` passes without errors

---

## Epic 16: ACTEE Compliance & Reusable Patterns

Developers can build new features using consistent ACTEE patterns — business logic lives in facades, auth uses a proper store, and shared components eliminate boilerplate.

### Story 16.1: Extract Simple Business Logic to Facades

As a developer,
I want component-level filtering and label logic moved into facades and shared utilities,
So that UI components contain only display logic and facade calls.

**Acceptance Criteria:**

**Given** `community-users.component.ts` contains a `filteredUsers` computed with name/email filtering
**When** the extraction is complete
**Then** `CommunityFacade` exposes a method or computed for filtered users
**And** the component delegates filtering to the facade

**Given** `agentTypeLabels` mapping is duplicated in `agent-detail.component.ts` and `agent-list.component.ts`
**When** the extraction is complete
**Then** a shared utility `shared/utils/agent-labels.ts` exports the labels map
**And** both components import from the shared utility

**Given** `agent-list.component.ts` contains row transformation logic with label mapping
**When** the extraction is complete
**Then** `AgentFacade` exposes the formatted agent rows
**And** the component consumes the facade signal directly

**And** all existing tests are adapted to the new locations (not deleted)
**And** `npx ng test --no-watch` passes without errors

---

### Story 16.2: Extract Action Model Indicator Cards Logic

As a developer,
I want the complex `serverCards` computed (~40 lines of indicator mapping with children and parameter state) moved out of the detail component,
So that the action-model detail view contains only display logic.

**Acceptance Criteria:**

**Given** `action-model-detail.component.ts` contains a `serverCards` computed transforming indicator data into `IndicatorCardData[]`
**When** the extraction is complete
**Then** the logic lives in `ActionModelFacade` or a dedicated use-case `features/action-models/use-cases/build-indicator-cards.ts`
**And** the component consumes a facade signal for the card data
**And** child indicator handling and parameter state calculation are preserved exactly
**And** existing tests are adapted to the new location
**And** `npx ng test --no-watch` passes without errors

---

### Story 16.3: Extract Indicator Model Form Logic

As a developer,
I want the filtering and data preparation logic moved out of the indicator-model form component,
So that the form contains only UI state and facade calls.

**Acceptance Criteria:**

**Given** `indicator-model-form.component.ts` contains a `filteredAvailable` computed filtering indicators by type, self-reference, attached status, and search term
**When** the extraction is complete
**Then** `IndicatorModelFacade` exposes `getAvailableChildIndicators(searchTerm)` or equivalent
**And** the component delegates filtering to the facade

**Given** `indicator-model-form.component.ts` contains data transformation logic before submit
**When** the extraction is complete
**Then** `IndicatorModelFacade` exposes `prepareIndicatorData(formValue, attachedChildren)` or equivalent
**And** the component calls the facade method on submit

**And** existing tests are adapted to the new locations
**And** `npx ng test --no-watch` passes without errors

---

### Story 16.4: Migrate AuthService to AuthStore

As a developer,
I want authentication state managed by an ACTEE-compliant `signalStore`,
So that auth follows the same pattern as every other domain in the application.

**Acceptance Criteria:**

**Given** `core/auth/auth.service.ts` manages auth state with private signals and methods
**When** the migration is complete
**Then** `domains/auth/auth.store.ts` exists as a `signalStore` with:
  - `withState({ token, user })` — decoded user info stored at login time
  - `token` exposed as a signal (not a `getToken()` method)
  - `login()`, `logout()`, `setToken()` via `withMethods`
  - localStorage persistence preserved
**And** the store follows composition order: `withState` → `withComputed` → `withMethods`
**And** `LoginComponent` is updated to use `AuthStore`
**And** the auth guard is updated to use `AuthStore`
**And** the HTTP interceptor is updated to use `AuthStore.token()`
**And** all previous `AuthService` injections across the codebase are replaced
**And** `npx ng build` passes without errors
**And** `npx ng test --no-watch` passes without errors

---

### Story 16.5: Create FormFieldComponent and Migrate Forms

As a developer,
I want a shared form field wrapper that handles label, validation display, and error styling,
So that I don't duplicate `showError()` + `[class.border-error]` in every form.

**Acceptance Criteria:**

**Given** the `showError()` pattern and `border-error` class are duplicated across 9 form components
**When** the `FormFieldComponent` is created
**Then** `shared/components/form-field/form-field.component.ts` exists with:
  - `label` input for the field label
  - `control` input accepting an `AbstractControl`
  - `error` input for the error message
  - Content projection (`<ng-content>`) for the input element
  - Automatic `border-error` class application when control is dirty/touched + invalid
  - Conditional error message display
**And** all 9 form components (agent-form, action-theme-form, indicator-model-form, community-form, funding-program-form, user-form, folder-model-form, building-form, login) are migrated to use `<app-form-field>`
**And** the duplicated `showError()` methods are removed from migrated components
**And** `npx ng build` passes without errors
**And** `npx ng test --no-watch` passes without errors

---

### Story 16.6: Create TooltipDirective

As a developer,
I want a unified tooltip directive replacing the mix of CSS pseudo-element tooltips and native `title` attributes,
So that tooltips are consistent across the application.

**Acceptance Criteria:**

**Given** `param-hint-icons.component.ts` uses CSS custom tooltips via `data-tooltip` + `::before`
**And** several detail components use native `title` attributes
**When** the `TooltipDirective` is created
**Then** `shared/directives/tooltip.directive.ts` exists with:
  - `appTooltip` input accepting the tooltip text
  - Show/hide on hover
  - Consistent positioning (top by default)
  - Consistent styling
**And** existing CSS custom tooltips in `param-hint-icons` are replaced with `appTooltip`
**And** native `title` attributes used as tooltips are replaced with `appTooltip`
**And** `npx ng build` passes without errors
**And** `npx ng test --no-watch` passes without errors

---

### Story 16.7: Create ApiInspectorContainerComponent

As a developer,
I want a container component that automatically includes the API Inspector,
So that feature components don't each manually add `<app-api-inspector>`.

**Acceptance Criteria:**

**Given** every detail/form/list component manually includes `<app-api-inspector>` in its template
**When** the `ApiInspectorContainerComponent` is created
**Then** `shared/api-inspector/api-inspector-container.component.ts` exists with:
  - Injection of `ApiInspectorService`
  - Automatic rendering of `<app-api-inspector>`
  - Content projection via `<ng-content>` for the wrapped feature component
**And** feature components that previously included `<app-api-inspector>` are refactored to use the container (or the container is applied at page/layout level)
**And** manual `<app-api-inspector>` inclusions are removed from migrated components
**And** `npx ng build` passes without errors
**And** `npx ng test --no-watch` passes without errors

---

### Story 16.8: Create Shared Layout Components

As a developer,
I want reusable layout components for list pages, detail pages, and form pages,
So that I don't duplicate the same structural patterns across all 7+ domains.

**Acceptance Criteria:**

**Given** list pages repeat: title + create button + filters + DataTable + loadMore pagination + empty state with `hasLoaded` guard
**When** `ListPageLayoutComponent` is created
**Then** `shared/components/layouts/list-page-layout.component.ts` encapsulates the common list structure
**And** content slots allow feature-specific elements (filters, table columns, actions)

**Given** detail pages repeat: breadcrumb + skeleton loading + MetadataGrid + sections + action buttons (edit, delete)
**When** `DetailPageLayoutComponent` is created
**Then** `shared/components/layouts/detail-page-layout.component.ts` encapsulates the common detail structure
**And** content slots allow feature-specific sections and metadata

**Given** form pages repeat: breadcrumb + form + SaveBar + Cmd+S shortcut + Escape cancel + `HasUnsavedChanges` guard
**When** `FormPageLayoutComponent` is created
**Then** `shared/components/layouts/form-page-layout.component.ts` encapsulates the common form structure
**And** content slots allow the feature-specific form fields

**And** at least one existing feature per layout type is migrated as proof of concept
**And** the abstraction level remains practical — no over-engineered generic framework
**And** `npx ng build` passes without errors
**And** `npx ng test --no-watch` passes without errors

---

## Epic 17: Developer Documentation & Handover

New developers can onboard in under 10 minutes — custom patterns are documented, ACTEE conventions are explained, and known limitations are transparent.

### Story 17.1: Document withCursorPagination Pattern

As a developer new to the project,
I want comprehensive documentation of the `withCursorPagination` store feature,
So that I can integrate cursor-based pagination into new domain stores without reading the source code.

**Acceptance Criteria:**

**Given** `domains/shared/with-cursor-pagination.ts` is a custom reusable store feature
**When** the documentation is complete
**Then** a documentation file exists in `docs/` covering:
  - Purpose and approach (cursor-based, not offset)
  - Exposed state: `items`, `cursor`, `hasMore`, `isLoading`, `error`, `totalCount`
  - Exposed computed: `isEmpty`, `totalLoaded`
  - Exposed methods: `load(filters)`, `loadMore()`, `refresh(filters?)`, `loadAll(filters)`, `reset()`
  - Filter persistence behavior between `loadMore()` and `refresh()`
  - When to use `load()` vs `refresh()` vs `loadAll()`
  - `FilterParams` format
  - Complete integration example showing usage inside a domain store
**And** the documentation is concise and developer-oriented (reference, not tutorial)

---

### Story 17.2: Write ACTEE Developer Guide

As a developer joining the project,
I want a concise guide explaining the architecture conventions and how to add new features,
So that I can be productive in under 10 minutes without asking colleagues.

**Acceptance Criteria:**

**Given** the project follows ACTEE architecture with project-specific adaptations
**When** the guide is complete
**Then** a documentation file exists in `docs/` covering:
  - Architecture overview: domain → feature → UI flow
  - How to create a new domain (checklist: store, api, models, forms)
  - How to create a new feature (checklist: store, facade, UI components)
  - Naming conventions (files, stores, facades, APIs, selectors)
  - Mutation patterns (`withMutations`, `httpMutation`)
  - Form patterns (`createXxxForm`, `FormFieldComponent`)
  - List patterns (DataTable, filters, cursor pagination, `hasLoaded` guard)
  - Detail patterns (MetadataGrid, skeleton loading, `clearSelection` on destroy)
**And** the guide references existing code as examples (not hypothetical)
**And** the guide is under 500 lines — concise and scannable

---

### Story 17.3: Document Known Limitations & Recommendations

As a developer maintaining the project,
I want a clear list of known limitations and future recommendations,
So that I understand architectural trade-offs and don't waste time on known issues.

**Acceptance Criteria:**

**Given** the project has known technical limitations and deferred improvements
**When** the documentation is complete
**Then** a documentation file exists in `docs/` covering:
  - **Double API call for filters:** Lists require a second unpaginated call to populate filter dropdowns — this is a backend concern, frontend should consume a dedicated `/options` or `/filters` endpoint when available
  - Any other limitations discovered during v2 implementation
  - Recommendations for future improvements not implemented in v2
**And** each limitation includes: what it is, why it exists, and what the recommended resolution is
**And** the document distinguishes between frontend limitations and backend dependencies
