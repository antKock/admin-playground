---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories, step-04-final-validation]
status: 'complete'
completedAt: '2026-03-04'
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
---

# Laureat Admin Interface - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for admin-playground (Laureat Admin Interface), decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories. This version is aligned with the ACTEE corporate architecture guidelines (Domain → Feature → UI layered architecture with NgRx Signal Stores, facades, and strict separation of concerns).

## Requirements Inventory

### Functional Requirements

FR1: User can authenticate with email and password to access the admin interface
FR2: User can log out and terminate their session
FR3: System automatically attaches authentication credentials to all outbound API requests
FR4: System redirects unauthenticated users to the login page and preserves their intended destination
FR5: User can navigate to any of the 7 entity management sections from a persistent sidebar
FR6: User can see their current authentication context (logged-in state) in the application header
FR7: User can view a paginated list of any configuration entity (Funding Programs, Action Themes, Action Models, Folder Models, Communities, Agents, Indicator Models)
FR8: User can filter entity lists by available criteria (status, associated program, etc.) where the API supports it
FR9: User can view the complete details of any configuration entity
FR10: User can create a new configuration entity via a structured form
FR11: User can edit an existing configuration entity
FR12: User can delete a configuration entity with an explicit confirmation step
FR13: User can transition a supported entity through its defined status workflow (e.g. draft → published → disabled/archived)
FR14: User can duplicate an Action Theme
FR15: System prevents invalid status transitions and communicates the reason to the user
FR16: User can view the current status of any entity at a glance in list and detail views
FR17: User can associate an Action Model with a Funding Program and Action Theme via selection
FR18: User can associate a Folder Model with one or more Funding Programs
FR19: User can assign and remove users from a Community
FR20: User can attach Indicator Models to an Action Model
FR21: User can see which models a given Indicator Model is currently associated with
FR22: User can manage association metadata between an Indicator Model and a model (visibility_rule, required_rule, etc.)
FR23: User can configure the 6 behavior parameters for each indicator within a model context: required, visible, editable, default value, constraint, duplicable
FR24: User can input a JSONLogic rule expression for any rule-capable indicator parameter via a multi-line text field
FR25: User can configure the type and subtype of an Indicator Model
FR26: User can manage the list of valid values for list-type indicators
FR27: System prevents type changes on indicators that have existing instances and explains the constraint
FR28: User can view all parameters and rules configured for an indicator within a specific model context
FR29: System displays a clear, human-readable error message for every failed API operation
FR30: System confirms successful create, update, and delete operations with a visible notification
FR31: System surfaces API constraint violations with explanations that identify what failed and why — no silent failures
FR32: User can view the last API request URL and full response payload for any entity on its detail page

### NonFunctional Requirements

NFR1: (Performance) No heavy client-side computation; all performance is API-bound
NFR2: (Performance) Paginated list views must feel responsive on a standard office network connection to the staging API
NFR3: (Performance) No offline capability required
NFR4: (Security) All communication with the Laureat API occurs over HTTPS
NFR5: (Security) JWT stored securely client-side; never exposed in URLs or logs
NFR6: (Security) Credentials managed via `.env.local` — must not be committed to the repository
NFR7: (Security) No sensitive citizen or personal data stored or cached client-side
NFR8: (Integration) Admin consumes the Laureat REST API exclusively — no other backends or third-party services
NFR9: (Integration) API base URL configurable via `environment.ts` to support staging/production switching
NFR10: (Integration) Live OpenAPI specification (`/openapi.json`) is the authoritative source of truth
NFR11: (Integration) All API errors propagated to the user — no silent failures
NFR12: (Integration) Cursor-based pagination contract honored consistently across all entity list views
NFR13: (Code Quality) Angular 20 standalone components exclusively — no NgModule
NFR14: (Code Quality) TypeScript strict mode throughout
NFR15: (Code Quality) NgRx Signal Stores for all reactive state (per ACTEE architecture)
NFR16: (Code Quality) Consistent ACTEE architectural patterns across all 7 entity modules
NFR17: (Code Quality) Inline code documentation for all non-obvious logic
NFR18: (Code Quality) Lazy-loaded routing per entity module

> **Note:** The PRD lists 21 NFRs (NFR1–NFR21) under a slightly different numbering scheme. This epics document consolidates to 18 NFRs reflecting the architecture evolution from raw Angular signals (PRD) to NgRx Signal Stores (ACTEE). Specifically: PRD's NFR3 ("no response time targets") and NFR4 ("no offline") are implicit in the epics context; PRD's NFR18 ("Angular signals") became NFR15 ("NgRx Signal Stores"); and the session-expiry NFR was dropped as implicit in the auth system. All substantive NFR requirements are preserved.

### Additional Requirements

**From Architecture (ACTEE migration context):**
- Install `@ngrx/signals` + `@angular-architects/ngrx-toolkit` as new dependencies
- Create ACTEE folder structure: `domains/` → `features/` → `pages/`
- Create reusable `withCursorPagination()` store feature in `domains/shared/`
- Update TSConfig with ACTEE path aliases (`@domains/*`, `@features/*`, `@pages/*`)
- Migrate existing entities (Funding Programs, Action Themes) from `BaseEntityService<T>` service pattern to ACTEE domain stores + facades
- Remove old service-based patterns (`BaseEntityService<T>`) after migration is complete
- All entities follow identical ACTEE module structure: domain store + API file + models + forms → feature store + facade + UI components → page
- API Gap Documentation: mandatory `_bmad-output/api-observations.md` updates when encountering API discrepancies
- Starter template: existing project — no new scaffolding needed
- ACTEE layer boundaries enforced: pages → feature UI → facade → feature store / domain store → API file
- 18 naming/structure conflict points addressed with mandatory patterns
- 11 enforcement rules + 10 explicit anti-patterns documented

**From UX:**
- Tailwind CSS + Angular CDK design system
- 13 custom shared components (DataTable, MetadataGrid, StatusBadge, Toast, ConfirmDialog, SaveBar, SectionAnchors, ApiInspector, IndicatorCard, ToggleRow, RuleField, IndicatorPicker, ParamHintIcons)
- Explicit save pattern with unsaved-state tracking
- Model-as-workspace pattern for ActionModel detail view
- Infinite scroll (cursor-based) pagination UX
- Progressive disclosure for complex indicator configuration

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1 | Epic 0 | Email/password authentication (preserved) |
| FR2 | Epic 0 | Logout (preserved) |
| FR3 | Epic 0 | Auto-attach credentials (preserved) |
| FR4 | Epic 0 | Redirect unauthenticated users (preserved) |
| FR5 | Epic 0 | 7-entity sidebar navigation (preserved) |
| FR6 | Epic 0 | Auth context in header (preserved) |
| FR7 | Epic 0 (FP, AT) / Epic 1 (AM, FM) / Epic 2 (Comm, Agents) / Epic 3 (IM) | Paginated entity lists |
| FR8 | Epic 0 (FP, AT) / Epic 1 (AM, FM) / Epic 2 (Comm, Agents) / Epic 3 (IM) / Epic 4 (remaining) | Entity list filtering |
| FR9 | Epic 0 (FP, AT) / Epic 1 (AM, FM) / Epic 2 (Comm, Agents) / Epic 3 (IM) | Entity detail views |
| FR10 | Epic 0 (FP, AT) / Epic 1 (AM, FM) / Epic 2 (Comm, Agents) / Epic 3 (IM) | Create entity |
| FR11 | Epic 0 (FP, AT) / Epic 1 (AM, FM) / Epic 2 (Comm, Agents) / Epic 3 (IM) | Edit entity |
| FR12 | Epic 0 (FP, AT) / Epic 1 (AM, FM) / Epic 2 (Comm, Agents) / Epic 3 (IM) | Delete with confirmation |
| FR13 | Epic 0 (AT) / Epic 1 (AM) / Epic 2 (Agents) / Epic 3 (IM) | Status transitions |
| FR14 | Epic 0 | Duplicate Action Theme (preserved) |
| FR15 | Epic 0 | Invalid transition blocking (preserved) |
| FR16 | Epic 0 (AT) / Epic 1 (AM) / Epic 2 (Agents) / Epic 3 (IM) | Status visibility |
| FR17 | Epic 1 | Action Model ↔ FP/AT association |
| FR18 | Epic 1 | Folder Model ↔ FP association |
| FR19 | Epic 2 | Community user assignment/removal |
| FR20 | Epic 3 | Attach Indicator Models to Action Model |
| FR21 | Epic 3 | Indicator "used in N models" visibility |
| FR22 | Epic 3 | Association metadata management |
| FR23 | Epic 3 | 6-parameter configuration |
| FR24 | Epic 3 (basic) / Epic 5 (enhanced) | JSONLogic rule input |
| FR25 | Epic 3 | Indicator type/subtype management |
| FR26 | Epic 3 | List values management |
| FR27 | Epic 3 | Type-change constraint with explanation |
| FR28 | Epic 3 (basic) / Epic 5 (enhanced) | Parameter/rule visibility |
| FR29 | Epic 0 | Human-readable API errors (preserved) |
| FR30 | Epic 0 | Success notifications (preserved) |
| FR31 | Epic 0 | Constraint violation explanations (preserved) |
| FR32 | Epic 4 | API request/response inspector |

## Epic List

### Epic 0: ACTEE Architecture Migration — Preserving FP & AT Operator Workflows
Restructure existing codebase from flat service-based architecture to ACTEE layered architecture (Domain → Feature → UI with NgRx Signal Stores), establishing the patterns all future entity development will follow. After this epic, operators can still create/manage Funding Programs and Action Themes exactly as before — same functionality, new architecture.
**FRs preserved:** FR1–FR6, FR7–FR12 (FP + AT), FR13–FR16, FR29–FR31

### Epic 1: Action Models & Folder Models
Operators can create, edit, and manage Action Models (with Funding Program / Action Theme selectors) and Folder Models (with Funding Program association). Built natively in ACTEE patterns established in Epic 0. Completes the model-level configuration layer.
**Depends on:** Epic 0 (ACTEE patterns, domain store conventions, `withCursorPagination()`)
**FRs covered:** FR7–FR12 (AM + FM), FR13, FR16, FR17, FR18

### Epic 2: Communities & Agents
Operators can create and manage Communities (with user assignment/removal) and Agents (with status management). Built natively in ACTEE patterns. Completes the people/organization entities.
**FRs covered:** FR7–FR12 (Communities + Agents), FR13, FR16, FR19

### Epic 3: Indicator Models & Parameter Configuration
Operators can manage the full indicator lifecycle: create Indicator Models, configure type/subtype, manage list values, attach indicators to Action Models, configure the 6 behavior parameters per association, and input JSONLogic rules. The most complex surface — built last after patterns are proven across 6 simpler entities.
**FRs covered:** FR7–FR12 (IM), FR13, FR16, FR20–FR28

### Epic 4: Developer Tooling & Cross-Entity Polish
Alex can inspect API request/response data on any entity detail page. Cross-entity filtering (FR8) is completed for any entities not yet covered. Final integration testing across the full configuration chain.
**FRs covered:** FR8 (remaining), FR32

### Epic 5: v2 — Ergonomics & UX Refinement
Polish phase: proper JSONLogic editor (Monaco/CodeMirror) with syntax highlighting and validation, rule-to-prose translation, deep-link URLs, and daily-use ergonomics improvements.
**FRs covered:** v2 scope (enhances FR24, FR28)

---

## Epic 0: ACTEE Architecture Migration — Preserving FP & AT Operator Workflows

Restructure existing codebase from flat service-based architecture to ACTEE layered architecture (Domain → Feature → UI with NgRx Signal Stores), establishing the patterns all future entity development will follow. After this epic, operators can still create/manage Funding Programs and Action Themes exactly as before — same functionality, new architecture.

### Story 0.1: Install ACTEE Dependencies & Create Folder Structure

As a development team,
I want the ACTEE dependencies installed and folder structure created,
So that all future entity development follows the ACTEE layered architecture from day one.

**Acceptance Criteria:**

**Given** the existing Angular project with no NgRx dependencies
**When** the developer runs the installation
**Then** `@ngrx/signals` and `@angular-architects/ngrx-toolkit` are added to `package.json` and installed successfully
**And** `npm install` completes without peer dependency conflicts

**Given** the existing flat `src/app/` structure
**When** the ACTEE folder structure is created
**Then** the following directories exist: `src/app/domains/`, `src/app/domains/shared/`, `src/app/features/`, `src/app/pages/`
**And** placeholder directories exist for all 7 entities under `domains/`, `features/`, and `pages/`

**Given** the existing `tsconfig.json`
**When** ACTEE path aliases are added
**Then** the following aliases are configured: `@domains/*`, `@features/*`, `@pages/*`, `@shared/*`, `@core/*`
**And** existing `@app/*` alias is preserved

**Given** all changes are in place
**When** `ng build` is executed
**Then** the application compiles without errors
**And** `ng serve` starts successfully with no runtime errors
**And** all existing functionality (auth, navigation, FP, AT) continues to work unchanged

### Story 0.2: Create Reusable Cursor Pagination Store Feature

As a development team,
I want a reusable `withCursorPagination<T>()` store feature,
So that all 7 entity domain stores share a single, tested pagination implementation instead of duplicating cursor logic.

**Acceptance Criteria:**

**Given** the `domains/shared/` directory exists
**When** the `withCursorPagination<T>()` custom store feature is implemented
**Then** it is located at `src/app/domains/shared/with-cursor-pagination.ts`
**And** it encapsulates: items array, cursor state, hasMore flag, isLoading state, error state

**Given** a domain store composing `withCursorPagination()`
**When** the initial load is triggered
**Then** it calls the configured API endpoint with `cursor: null` and `limit: N`
**And** it populates the items array with the response data
**And** it sets `hasMore` based on whether a next cursor is returned

**Given** a domain store with items already loaded and `hasMore === true`
**When** `loadMore()` is called
**Then** it calls the API with the current cursor value
**And** it appends new items to the existing array (does not replace)
**And** it updates the cursor for the next page

**Given** a domain store with items loaded and `hasMore === false`
**When** `loadMore()` is called
**Then** no API call is made

**Given** the store feature is implemented
**When** unit tests are executed
**Then** all tests pass covering: initial load, load more, end of list, error handling, loading state transitions

### Story 0.3: Migrate Funding Programs to ACTEE Pattern (Pilot)

As an operator (Alex/Sophie),
I want Funding Programs to work exactly as before under the new ACTEE architecture,
So that the migration proves the pattern works without disrupting my daily configuration workflow.

**Acceptance Criteria:**

**Given** the existing Funding Programs service-based implementation
**When** the ACTEE migration is complete
**Then** the following files exist and follow ACTEE conventions:
- `domains/funding-programs/funding-program.store.ts` (domain store with `signalStore`)
- `domains/funding-programs/funding-program.api.ts` (resources + `HttpMutationRequest`)
- `domains/funding-programs/funding-program.models.ts` (types extending generated API types)
- `domains/funding-programs/forms/funding-program.form.ts` (FormGroup factory)
- `features/funding-programs/funding-program.store.ts` (feature store, `withComputed` only)
- `features/funding-programs/funding-program.facade.ts` (`@Injectable`, single UI entry point)
- `features/funding-programs/ui/funding-program-list.component.ts`
- `features/funding-programs/ui/funding-program-detail.component.ts`
- `features/funding-programs/ui/funding-program-form.component.ts`
- `pages/funding-programs/funding-programs.page.ts` (layout only, zero logic)
- `pages/funding-programs/funding-programs.routes.ts`

**Given** the domain store is implemented
**When** inspecting the store composition
**Then** it follows the mandatory order: `withState` → `withCursorPagination` → `withMutations` → `withComputed` → `withMethods`
**Note**: `withCursorPagination` replaces `withEntityResources` for this project because the API uses cursor-based pagination not natively supported by `withEntityResources`. Detail loading uses API functions called from `withMethods`.

**Given** the feature store is implemented
**When** inspecting its composition
**Then** it contains only `withComputed` — no mutations, no methods, no API calls

**Given** the facade is implemented
**When** inspecting its public API
**Then** it exposes readonly data signals (items, selectedItem, isLoading) and intention methods (load, loadMore, select, create, update, delete)
**And** UI components inject only the facade — never stores or services directly

**Given** `app.routes.ts` is updated
**When** navigating to `/funding-programs`
**Then** the route lazy-loads through `pages/funding-programs/funding-programs.routes.ts`

**Given** the migration is complete
**When** an operator lists Funding Programs
**Then** the paginated list displays correctly with cursor-based infinite scroll
**When** an operator creates a new Funding Program
**Then** the form displays, validates, and saves successfully with a success toast
**When** an operator edits an existing Funding Program
**Then** the edit form pre-populates, validates, and saves successfully
**When** an operator deletes a Funding Program
**Then** a confirmation dialog appears, and upon confirmation the item is deleted with a success toast
**And** API errors display human-readable error messages via toast

### Story 0.4: Migrate Action Themes to ACTEE Pattern

As an operator (Alex/Sophie),
I want Action Themes to work exactly as before under the new ACTEE architecture — including status transitions and duplication,
So that the ACTEE pattern is validated for lifecycle-managed entities.

**Acceptance Criteria:**

**Given** the existing Action Themes service-based implementation
**When** the ACTEE migration is complete
**Then** the following files exist and follow ACTEE conventions:
- `domains/action-themes/action-theme.store.ts` (domain store)
- `domains/action-themes/action-theme.api.ts` (CRUD resources + publish/disable/activate/duplicate mutations)
- `domains/action-themes/action-theme.models.ts`
- `domains/action-themes/forms/action-theme.form.ts`
- `features/action-themes/action-theme.store.ts` (feature store, read-only)
- `features/action-themes/action-theme.facade.ts` (facade with lifecycle intentions)
- `features/action-themes/ui/action-theme-list.component.ts`
- `features/action-themes/ui/action-theme-detail.component.ts`
- `features/action-themes/ui/action-theme-form.component.ts`
- `pages/action-themes/action-themes.page.ts`
- `pages/action-themes/action-themes.routes.ts`

**Given** the API file is implemented
**When** inspecting mutation definitions
**Then** status transitions (publish, disable, activate) use `exhaustOp` race condition strategy
**And** CRUD mutations (create, update, delete) use `concatOp`
**And** duplicate mutation is defined as an `HttpMutationRequest`

**Given** the facade is implemented
**When** inspecting its public API
**Then** it exposes lifecycle intention methods: `publish()`, `disable()`, `activate()`, `duplicate()`
**And** it exposes per-mutation status signals for fine-grained UI feedback (e.g., "publishing..." spinner)

**Given** the migration is complete
**When** an operator views the Action Theme list
**Then** each row shows the current status via StatusBadge (draft, published, disabled)
**When** an operator transitions an Action Theme from draft → published
**Then** the status updates immediately in the UI with a success toast
**When** an operator attempts an invalid status transition
**Then** the system blocks the action and displays an informative error message (FR15)
**When** an operator duplicates an Action Theme
**Then** a new Action Theme is created with the duplicated data and appears in the list

**Given** all ACTEE boundary rules
**When** inspecting component imports
**Then** no UI component imports a store or API file directly — facades only
**And** no feature store contains `withMutations` or `withMethods`
**And** no page component contains `inject()` or any logic

### Story 0.5: Remove Legacy Service Pattern & Final Cleanup

As a development team,
I want all legacy service-based patterns removed from the codebase,
So that there is a single, consistent architecture (ACTEE) with no dead code or pattern ambiguity.

**Acceptance Criteria:**

**Given** Funding Programs and Action Themes are fully migrated to ACTEE
**When** the cleanup is complete
**Then** `BaseEntityService<T>` is deleted from the codebase
**And** the old Funding Programs service file is deleted
**And** the old Action Themes service file is deleted
**And** any old component files that were replaced by `features/*/ui/` components are deleted
**And** any old routing files replaced by `pages/*/` routes are deleted

**Given** all legacy files are removed
**When** searching the codebase for imports of deleted files
**Then** zero references to `BaseEntityService`, old service paths, or old component paths exist

**Given** the cleanup is complete
**When** `ng build` is executed
**Then** the application compiles without errors and without unused import warnings

**Given** the full cleanup is complete
**When** the operator performs a full regression test
**Then** authentication works (login, logout, redirect) — FR1–FR4
**And** sidebar navigation works with all 7 sections visible — FR5
**And** auth context displays in the header — FR6
**And** Funding Programs: list, create, edit, delete all work — FR7–FR12
**And** Action Themes: list, create, edit, delete, status transitions, duplication all work — FR7–FR16
**And** error messages display correctly for failed operations — FR29–FR31
**And** success toasts confirm successful operations — FR30

---

## Epic 1: Action Models & Folder Models

Operators can create, edit, and manage Action Models (with Funding Program / Action Theme selectors) and Folder Models (with Funding Program association). Built natively in ACTEE patterns. Completes the model-level configuration layer.

### Story 1.1: Action Models CRUD with ACTEE Pattern

As an operator (Alex/Sophie),
I want to create, view, edit, and delete Action Models through the admin interface,
So that I can manage the model-level configuration layer without using Postman.

**Acceptance Criteria:**

**Given** Epic 0 is complete and ACTEE patterns are established
**When** the Action Models ACTEE implementation is complete
**Then** the following files exist following the ACTEE pattern established in Epic 0:
- `domains/action-models/action-model.store.ts` (domain store using `withCursorPagination`)
- `domains/action-models/action-model.api.ts` (resources + CRUD mutations)
- `domains/action-models/action-model.models.ts` (types from generated API types)
- `domains/action-models/forms/action-model.form.ts` (FormGroup factory)
- `features/action-models/action-model.store.ts` (feature store, read-only)
- `features/action-models/action-model.facade.ts` (facade)
- `features/action-models/ui/action-model-list.component.ts`
- `features/action-models/ui/action-model-detail.component.ts`
- `features/action-models/ui/action-model-form.component.ts`
- `pages/action-models/action-models.page.ts`
- `pages/action-models/action-models.routes.ts`

**Given** the Action Models route is configured
**When** an operator navigates to `/action-models`
**Then** a paginated list of Action Models displays with cursor-based infinite scroll

**Given** an operator is on the Action Models list
**When** they click "Create"
**Then** a form displays with fields matching the API schema (label, technical_label, description, etc.)
**And** required fields are validated on blur and on submit

**Given** an operator fills in a valid Action Model form
**When** they submit the form
**Then** the Action Model is created via the API
**And** a success toast confirms the creation
**And** the operator is navigated to the detail view or list

**Given** an operator is viewing an Action Model detail
**When** they click "Edit"
**Then** the form pre-populates with current values
**And** they can modify and save with a success toast

**Given** an operator clicks "Delete" on an Action Model
**When** they confirm the deletion in the confirmation dialog
**Then** the Action Model is deleted via the API with a success toast
**And** API errors display human-readable error messages

### Story 1.2: Action Model — Funding Program & Action Theme Association

As an operator (Sophie),
I want to select a Funding Program and Action Theme when creating or editing an Action Model,
So that each Action Model is correctly linked to its parent program and theme.

**Acceptance Criteria:**

**Given** the Action Model create/edit form
**When** the form renders
**Then** a Funding Program selector dropdown is populated with available Funding Programs from the FP domain store
**And** an Action Theme selector dropdown is populated with available Action Themes from the AT domain store

**Given** an operator selects a Funding Program and Action Theme
**When** they save the Action Model
**Then** the association is persisted via the API
**And** the detail view displays the associated Funding Program and Action Theme

**Given** an operator is editing an existing Action Model
**When** the form loads
**Then** the currently associated Funding Program and Action Theme are pre-selected in the dropdowns

**Given** the feature store for Action Models
**When** inspecting its implementation
**Then** it aggregates data from both the action-model domain store and the funding-program / action-theme domain stores to compose the selector options
**And** the facade exposes the composed view-model to UI components

### Story 1.3: Action Model Status Workflow

As an operator (Alex/Sophie),
I want to transition Action Models through their status lifecycle,
So that I can control which models are active and ready for use.

**Acceptance Criteria:**

**Given** an Action Model with status "draft"
**When** the operator clicks the "Publish" action
**Then** the status transitions to "published" via the API
**And** the StatusBadge updates immediately in both list and detail views
**And** a success toast confirms the transition

**Given** an Action Model with status "published"
**When** the operator clicks "Disable"
**Then** the status transitions to "disabled" with a success toast

**Given** an Action Model in any status
**When** an invalid transition is attempted
**Then** the system blocks the action and displays an informative error message explaining why (FR15)

**Given** the API file for Action Models
**When** inspecting status mutation definitions
**Then** status transitions use `exhaustOp` race condition strategy to prevent duplicate submissions

**Given** the Action Models list view
**When** rendered
**Then** each row displays the current status via StatusBadge component (FR16)

### Story 1.4: Folder Models CRUD with ACTEE Pattern

As an operator (Alex/Sophie),
I want to create, view, edit, and delete Folder Models through the admin interface,
So that I can manage folder-level configuration for funding programs.

**Acceptance Criteria:**

**Given** ACTEE patterns are established
**When** the Folder Models ACTEE implementation is complete
**Then** the following files exist following the identical ACTEE module structure:
- `domains/folder-models/folder-model.store.ts`
- `domains/folder-models/folder-model.api.ts`
- `domains/folder-models/folder-model.models.ts`
- `domains/folder-models/forms/folder-model.form.ts`
- `features/folder-models/folder-model.store.ts`
- `features/folder-models/folder-model.facade.ts`
- `features/folder-models/ui/folder-model-list.component.ts`
- `features/folder-models/ui/folder-model-detail.component.ts`
- `features/folder-models/ui/folder-model-form.component.ts`
- `pages/folder-models/folder-models.page.ts`
- `pages/folder-models/folder-models.routes.ts`

**Given** the Folder Models route is configured
**When** an operator navigates to `/folder-models`
**Then** a paginated list of Folder Models displays with cursor-based infinite scroll

**Given** an operator creates a Folder Model
**When** they fill in the form with valid data and submit
**Then** the Folder Model is created via the API with a success toast

**Given** an operator edits an existing Folder Model
**When** they modify fields and save
**Then** the changes are persisted with a success toast

**Given** an operator deletes a Folder Model
**When** they confirm the deletion
**Then** the Folder Model is deleted with a success toast
**And** API errors display human-readable messages

### Story 1.5: Folder Model — Funding Program Association

As an operator (Sophie),
I want to associate a Folder Model with one or more Funding Programs,
So that folder structures are correctly linked to their parent programs.

**Acceptance Criteria:**

**Given** the Folder Model create/edit form
**When** the form renders
**Then** a Funding Program multi-selector is populated with available Funding Programs from the FP domain store

**Given** an operator selects one or more Funding Programs
**When** they save the Folder Model
**Then** the associations are persisted via the API
**And** the detail view displays the associated Funding Programs

**Given** an operator is editing an existing Folder Model
**When** the form loads
**Then** the currently associated Funding Programs are pre-selected

**Given** an operator removes a Funding Program association
**When** they save the Folder Model
**Then** the association is removed via the API
**And** the detail view reflects the updated associations

---

## Epic 2: Communities & Agents

Operators can create and manage Communities (with user assignment/removal) and Agents (with status management). Built natively in ACTEE patterns. Completes the people/organization entities.

### Story 2.1: Communities CRUD with ACTEE Pattern

As an operator (Alex/Sophie),
I want to create, view, edit, and delete Communities through the admin interface,
So that I can manage organizational groupings without using Postman.

**Acceptance Criteria:**

**Given** ACTEE patterns are established
**When** the Communities ACTEE implementation is complete
**Then** the following files exist following the ACTEE module structure:
- `domains/communities/community.store.ts`
- `domains/communities/community.api.ts`
- `domains/communities/community.models.ts`
- `domains/communities/forms/community.form.ts`
- `features/communities/community.store.ts`
- `features/communities/community.facade.ts`
- `features/communities/ui/community-list.component.ts`
- `features/communities/ui/community-detail.component.ts`
- `features/communities/ui/community-form.component.ts`
- `pages/communities/communities.page.ts`
- `pages/communities/communities.routes.ts`

**Given** the Communities route is configured
**When** an operator navigates to `/communities`
**Then** a paginated list of Communities displays with cursor-based infinite scroll

**Given** an operator creates a Community
**When** they fill in the form with valid data and submit
**Then** the Community is created via the API with a success toast

**Given** an operator edits an existing Community
**When** they modify fields and save
**Then** the changes are persisted with a success toast

**Given** an operator deletes a Community
**When** they confirm the deletion
**Then** the Community is deleted with a success toast
**And** API errors display human-readable messages

### Story 2.2: Community User Assignment & Removal

As an operator (Alex/Sophie),
I want to assign users to and remove users from a Community,
So that I can manage which users belong to each organizational group.

**Acceptance Criteria:**

**Given** an operator is viewing a Community detail page
**When** they look at the user section
**Then** a list of currently assigned users is displayed

**Given** an operator wants to add a user to a Community
**When** they use the user assignment interface
**Then** available users are displayed for selection
**And** selecting a user and confirming assigns them to the Community via the API
**And** a success toast confirms the assignment
**And** the user list updates immediately

**Given** an operator wants to remove a user from a Community
**When** they click "Remove" next to an assigned user
**Then** a confirmation dialog appears
**And** upon confirmation, the user is removed from the Community via the API
**And** a success toast confirms the removal
**And** the user list updates immediately

**Given** the API returns an error during assignment or removal
**When** the error is received
**Then** a human-readable error message is displayed via toast

### Story 2.3: Agents CRUD with ACTEE Pattern

As an operator (Alex/Sophie),
I want to create, view, edit, and delete Agents through the admin interface,
So that I can manage agent configurations without using Postman.

**Acceptance Criteria:**

**Given** ACTEE patterns are established
**When** the Agents ACTEE implementation is complete
**Then** the following files exist following the ACTEE module structure:
- `domains/agents/agent.store.ts`
- `domains/agents/agent.api.ts` (including soft-delete semantics)
- `domains/agents/agent.models.ts`
- `domains/agents/forms/agent.form.ts`
- `features/agents/agent.store.ts`
- `features/agents/agent.facade.ts`
- `features/agents/ui/agent-list.component.ts`
- `features/agents/ui/agent-detail.component.ts`
- `features/agents/ui/agent-form.component.ts`
- `pages/agents/agents.page.ts`
- `pages/agents/agents.routes.ts`

**Given** the Agents route is configured
**When** an operator navigates to `/agents`
**Then** a paginated list of Agents displays with cursor-based infinite scroll

**Given** an operator creates an Agent
**When** they fill in the form with valid data and submit
**Then** the Agent is created via the API with a success toast

**Given** an operator edits an existing Agent
**When** they modify fields and save
**Then** the changes are persisted with a success toast

**Given** an operator deletes an Agent
**When** they confirm the deletion
**Then** the Agent is soft-deleted via the API with a success toast
**And** API errors display human-readable messages

### Story 2.4: Agent Status Management

As an operator (Alex/Sophie),
I want to manage Agent status through the admin interface,
So that I can control which agents are active and visible in the system.

**Acceptance Criteria:**

**Given** an Agent with a current status
**When** the operator views the Agent in the list
**Then** the current status is displayed via StatusBadge (FR16)

**Given** an Agent in the detail view
**When** the operator clicks a status transition action
**Then** the status transitions via the API
**And** the StatusBadge updates immediately
**And** a success toast confirms the transition

**Given** an invalid status transition is attempted
**When** the API rejects the transition
**Then** the system displays an informative error message explaining the constraint (FR15)

**Given** the API file for Agents
**When** inspecting status mutation definitions
**Then** status transitions use `exhaustOp` race condition strategy

---

## Epic 3: Indicator Models & Parameter Configuration

Operators can manage the full indicator lifecycle: create Indicator Models, configure type/subtype, manage list values, attach indicators to Action Models, configure the 6 behavior parameters per association, and input JSONLogic rules. The most complex surface — built last after patterns are proven across 6 simpler entities.

### Story 3.1: Indicator Models CRUD with ACTEE Pattern

As an operator (Sophie),
I want to create, view, edit, and delete Indicator Models through the admin interface,
So that I can manage the indicator definitions that drive the entire configuration system.

**Acceptance Criteria:**

**Given** ACTEE patterns are established and 6 simpler entities already follow the pattern
**When** the Indicator Models ACTEE implementation is complete
**Then** the following files exist following the ACTEE module structure:
- `domains/indicator-models/indicator-model.store.ts`
- `domains/indicator-models/indicator-model.api.ts` (including association metadata CRUD)
- `domains/indicator-models/indicator-model.models.ts`
- `domains/indicator-models/forms/indicator-model.form.ts`
- `features/indicator-models/indicator-model.store.ts`
- `features/indicator-models/indicator-model.facade.ts`
- `features/indicator-models/ui/indicator-model-list.component.ts`
- `features/indicator-models/ui/indicator-model-detail.component.ts`
- `features/indicator-models/ui/indicator-model-form.component.ts`
- `pages/indicator-models/indicator-models.page.ts`
- `pages/indicator-models/indicator-models.routes.ts`

**Given** the Indicator Models route is configured
**When** an operator navigates to `/indicator-models`
**Then** a paginated list of Indicator Models displays with cursor-based infinite scroll

**Given** an operator creates an Indicator Model
**When** they fill in the form (label, technical label, description, etc.) and submit
**Then** the Indicator Model is created via the API with a success toast

**Given** an operator edits an existing Indicator Model
**When** they modify label fields and save
**Then** the changes are persisted with a success toast
**And** the interface makes clear that label changes propagate to all associated models

**Given** an operator deletes an Indicator Model
**When** they confirm the deletion
**Then** the Indicator Model is deleted with a success toast
**And** API errors display human-readable messages

### Story 3.2: Indicator Model Type, Subtype & List Values Management

As an operator (Sophie),
I want to configure the type and subtype of an Indicator Model and manage list values for list-type indicators,
So that each indicator's data structure is correctly defined before it is used in models.

**Acceptance Criteria:**

**Given** an operator is creating or editing an Indicator Model
**When** the form renders
**Then** a type selector displays the available indicator types (FR25)
**And** a subtype selector is available where applicable

**Given** an operator selects a list-type indicator
**When** the type is set to a list variant
**Then** a list values management interface appears (FR26)
**And** the operator can add, edit, reorder, and remove valid values
**And** changes are saved with the Indicator Model

**Given** a published Indicator Model with existing instances
**When** an operator attempts to change the type
**Then** the system blocks the change with a clear explanation: "Type cannot be changed once instances exist" (FR27)

**Given** an operator changes the subtype on a draft Indicator Model
**When** they save
**Then** the subtype is updated via the API with a success toast

### Story 3.3: Indicator Model Status Workflow & Usage Visibility

As an operator (Sophie),
I want to transition Indicator Models through their status lifecycle and see which models use each indicator,
So that I can manage indicator publication and understand cross-entity impact before making changes.

**Acceptance Criteria:**

**Given** an Indicator Model with status "draft"
**When** the operator clicks "Publish"
**Then** the status transitions to "published" via the API with a success toast
**And** the StatusBadge updates immediately in list and detail views (FR16)

**Given** an Indicator Model in any status
**When** an invalid transition is attempted
**Then** the system blocks the action with an informative error message (FR15)

**Given** an operator views an Indicator Model detail page
**When** the page renders
**Then** a "Used in N models" section displays which Action Models this indicator is currently associated with (FR21)
**And** the count and model names/links are visible

**Given** the status transition mutations
**When** inspecting their definition
**Then** they use `exhaustOp` race condition strategy

### Story 3.4: Attach Indicator Models to Action Models

As an operator (Sophie),
I want to attach Indicator Models to an Action Model from the Action Model workspace,
So that I can define which indicators are part of each model's configuration.

**Acceptance Criteria:**

**Given** an operator is viewing an Action Model detail page (workspace view)
**When** they open the indicator association panel
**Then** currently attached Indicator Models are listed (FR20)

**Given** an operator wants to attach a new Indicator Model
**When** they use the IndicatorPicker component
**Then** available Indicator Models are displayed for selection
**And** selecting and confirming attaches the indicator to the Action Model via the API
**And** a success toast confirms the attachment
**And** the indicator list updates immediately

**Given** an operator wants to remove an indicator association
**When** they click "Remove" on an attached indicator
**Then** a confirmation dialog appears
**And** upon confirmation, the association is removed via the API

**Given** an operator has multiple indicators attached to an Action Model
**When** they drag an indicator card to a new position using the drag handle
**Then** the indicator order is updated in the UI immediately via Angular CDK DragDrop
**And** the new order is persisted via the API
**And** the reordered list is preserved on page reload

**Given** the Action Model feature store
**When** inspecting its implementation
**Then** it aggregates data from both the action-model and indicator-model domain stores to compose the workspace view
**And** the facade orchestrates the cross-domain interactions

### Story 3.5: Indicator Parameter Configuration (6 Parameters)

As an operator (Sophie),
I want to configure the 6 behavior parameters for each indicator within a specific model context,
So that indicator behavior (required, visible, editable, default value, constraint, duplicable) is correctly defined per model.

**Acceptance Criteria:**

**Given** an operator has attached an Indicator Model to an Action Model
**When** they expand the indicator's parameter panel in the Action Model workspace
**Then** 6 parameter configuration fields are displayed: required, visible, editable, default value, constraint, duplicable (FR23)

**Given** an operator configures a boolean parameter (required, visible, editable, duplicable)
**When** they toggle the value using the ToggleRow component
**Then** the parameter value is updated
**And** changes are tracked as unsaved until explicitly saved

**Given** an operator configures a value parameter (default value, constraint)
**When** they enter a value in the appropriate field
**Then** the value is validated and tracked as unsaved

**Given** an operator has made parameter changes
**When** they save via the SaveBar
**Then** all parameter values are persisted via the API as association metadata (FR22)
**And** a success toast confirms the save

**Given** an operator views parameters for an indicator within a model context
**When** the panel renders
**Then** all currently configured parameters and their values are displayed accurately (FR28)
**And** ParamHintIcons indicate which parameters have non-default values

### Story 3.6: JSONLogic Rule Input for Indicator Parameters

As an operator (Sophie),
I want to input JSONLogic rule expressions for rule-capable indicator parameters,
So that I can define conditional behavior (e.g., "show this field only when mode_chauffe = autre").

**Acceptance Criteria:**

**Given** an operator is configuring an indicator parameter that supports rules
**When** the parameter panel renders
**Then** a multi-line text field (RuleField component) is available for JSONLogic input (FR24)

**Given** an operator types a JSONLogic rule into the text field
**When** the input is valid JSON
**Then** the field accepts the input without error

**Given** an operator types invalid JSON into the rule field
**When** they attempt to save
**Then** the system indicates the JSON is malformed before sending to the API

**Given** an operator has entered a JSONLogic rule (e.g., `{"==": [{"var": "mode_chauffe"}, "autre"]}`)
**When** they save via the SaveBar
**Then** the rule is persisted as part of the association metadata (visibility_rule, required_rule, etc.) via the API
**And** a success toast confirms the save

**Given** an operator reopens the parameter panel for an indicator with existing rules
**When** the panel renders
**Then** the stored JSONLogic rule is displayed faithfully in the text field — no abstraction loss (FR28)
**And** the rule is readable and copyable

**Given** the RuleField component renders in v1
**When** a JSONLogic rule references variables (e.g., `{"var": "mode_chauffe"}`)
**Then** the prose translation area above the textarea shows a static placeholder: "Rule references: mode_chauffe" (extracted variable names only)
**And** full human-readable prose translation is deferred to v2 (Story 5.2)

---

## Epic 4: Developer Tooling & Cross-Entity Polish

Alex can inspect API request/response data on any entity detail page. Cross-entity filtering (FR8) is completed for any entities not yet covered. Final integration testing across the full configuration chain.

### Story 4.1: API Request/Response Inspector

As a developer (Alex),
I want to view the last API request URL and full response payload on any entity detail page,
So that I can validate API behavior and diagnose issues without opening Postman or browser DevTools.

**Acceptance Criteria:**

**Given** an operator is viewing any entity detail page (FP, AT, AM, FM, IM, Community, Agent)
**When** they open the API Inspector panel
**Then** the last API request URL is displayed (FR32)
**And** the full response payload is displayed in a readable format

**Given** the ApiInspector shared component
**When** inspecting its implementation
**Then** it is a purely presentational component in `shared/components/api-inspector/`
**And** it receives request/response data via `input()` signals
**And** it has no domain knowledge or facade access

**Given** an API call is made on a detail page (e.g., loading entity data, saving changes)
**When** the response is received
**Then** the API Inspector updates with the latest request URL and response body

**Given** the inspector displays a response
**When** an operator views it
**Then** the JSON is formatted and readable
**And** the operator can copy the response payload

### Story 4.2: Cross-Entity List Filtering

As an operator (Alex/Sophie),
I want to filter entity lists by available criteria (status, associated program, etc.),
So that I can quickly find the configuration objects I need in large lists.

**Acceptance Criteria:**

**Given** any entity list view that supports filtering
**When** the API provides filter parameters (e.g., status, funding_program_id)
**Then** filter controls are displayed above the list (FR8)

**Given** an operator selects a filter value (e.g., status = "published")
**When** the filter is applied
**Then** the list reloads from the API with the filter parameter
**And** the pagination resets to the first page (cursor = null)
**And** the active filter is visually indicated

**Given** an operator clears a filter
**When** the filter is removed
**Then** the list reloads showing all items
**And** the pagination resets

**Given** filtering is implemented
**When** inspecting the implementation
**Then** filter state is managed in the domain store
**And** the facade exposes filter methods and active filter signals
**And** the DataTable component receives filter controls via its existing API

### Story 4.3: End-to-End Configuration Workflow — Full Chain Validation

As an operator (Sophie),
I want to complete a full funding program configuration — from program creation through model publication — entirely within the admin interface,
So that I can confidently configure real program structures without any Postman fallback.

**Acceptance Criteria:**

**Given** all 7 entities are fully implemented
**When** Sophie performs the complete configuration workflow:
1. Create a Funding Program
2. Create an Action Theme
3. Create Indicator Models (with type/subtype, list values)
4. Publish the Indicator Models
5. Create an Action Model, associate it with the FP and AT
6. Attach Indicator Models to the Action Model
7. Configure parameters for each indicator (required, visible, editable, default, constraint, duplicable)
8. Enter JSONLogic rules for conditional parameters
9. Save all parameter configuration
10. Publish the Action Model
**Then** every step completes without errors through the admin interface alone
**And** the final published Action Model reflects all associations, parameters, and rules correctly
**And** Sophie has not opened Postman or browser DevTools at any point

**Given** a published Action Model exists with full indicator configuration
**When** Alex opens its detail page to validate the configuration
**Then** the indicator list is visible with all associations
**And** each indicator's parameters and rules are displayed correctly
**And** the API Inspector shows the correct response data matching what the API stores
**And** Alex trusts the admin as the authoritative view of platform configuration

---

## Epic 5: v2 — Ergonomics & UX Refinement

Polish phase: proper JSONLogic editor (Monaco/CodeMirror) with syntax highlighting and validation, rule-to-prose translation, deep-link URLs, and daily-use ergonomics improvements.

### Story 5.1: JSONLogic Editor with Syntax Highlighting

As an operator (Sophie),
I want a proper code editor for JSONLogic rules with syntax highlighting and inline validation,
So that writing and editing complex rules is faster and less error-prone.

**Acceptance Criteria:**

**Given** an operator opens a JSONLogic rule field
**When** the editor renders
**Then** it uses Monaco or CodeMirror with JSON syntax highlighting
**And** it replaces the plain multi-line text field from v1

**Given** an operator types a JSONLogic rule
**When** the JSON is syntactically invalid
**Then** inline validation highlights the error with a clear message (line number, expected token)
**And** the error is caught before save — no need to submit to discover the issue

**Given** an operator types valid JSON
**When** the editor validates it
**Then** no error indicators are shown
**And** the editor provides bracket matching and auto-indentation

### Story 5.2: JSONLogic Rule-to-Prose Translation

As an operator (Sophie),
I want JSONLogic rules rendered as human-readable text alongside the raw JSON,
So that I can quickly understand what a rule does without mentally parsing JSON syntax.

**Acceptance Criteria:**

**Given** a stored JSONLogic rule (e.g., `{"==": [{"var": "mode_chauffe"}, "autre"]}`)
**When** the parameter panel displays the rule
**Then** a human-readable translation is shown alongside: e.g., "When mode_chauffe equals 'autre'"

**Given** a complex nested JSONLogic rule
**When** the translation renders
**Then** it produces a best-effort readable description
**And** if the rule is too complex for translation, the raw JSON is shown without error

**Given** an operator edits the rule in the code editor
**When** the JSON changes and is valid
**Then** the prose translation updates in real-time

### Story 5.3: Deep-Link URLs for Detail Pages

As an operator (Alex/Sophie),
I want shareable URLs that link directly to specific entity detail pages,
So that I can share links with teammates and bookmark frequently accessed configurations.

**Acceptance Criteria:**

**Given** an operator is viewing an entity detail page
**When** they copy the browser URL
**Then** the URL contains the entity type and ID (e.g., `/action-models/abc123`)

**Given** an operator pastes a deep-link URL into the browser
**When** the page loads
**Then** the application navigates directly to the entity detail page
**And** the correct data is loaded from the API

**Given** an unauthenticated user accesses a deep-link URL
**When** the page loads
**Then** they are redirected to login with the deep-link preserved as the intended destination (FR4)
**And** after login, they are redirected to the deep-linked page

### Story 5.4: Daily-Use Ergonomics & UX Polish

As an operator (Alex/Sophie),
I want improved ergonomics for daily configuration tasks,
So that the admin becomes my go-to tool that I reach for first, every time.

**Acceptance Criteria:**

**Given** an operator uses the admin daily
**When** performing common tasks
**Then** keyboard shortcuts are available for frequent actions (save, cancel, navigate)

**Given** an operator is working with long entity lists
**When** scrolling and paginating
**Then** scroll position is preserved when returning from detail views
**And** the list loads smoothly with no jank

**Given** an operator is editing a form
**When** they have unsaved changes and attempt to navigate away
**Then** the unsaved changes guard provides a clear, non-disruptive dialog
**And** the save bar is always visible with unsaved change count

**Given** an operator is working across multiple entities
**When** navigating between sections
**Then** transitions are smooth and fast
**And** previously loaded data is available immediately (no unnecessary re-fetches where appropriate)

### Story 5.5: DataTable Sorting & Row Interactions

As an operator (Alex/Sophie),
I want sortable columns, hover actions, and richer cell rendering in entity list tables,
So that I can find, identify, and act on entities efficiently without navigating to detail pages.

> **Origin:** UX Gap Analysis review (2026-03-04). Gaps: GAP-EL1 (P0), GAP-EL3 (P1), GAP-EL4 (P1), GAP-EL5 (P2).

**Acceptance Criteria:**

**Given** a DataTable column is configured as sortable
**When** the operator clicks the column header
**Then** the table sorts by that column (ascending first, toggle to descending, toggle to unsorted)
**And** a sort indicator arrow is visible on the active sort column

**Given** the operator hovers over a table row
**When** the row has configured actions (e.g. duplicate, delete)
**Then** action buttons appear in the last column with a fade-in transition
**And** clicking an action triggers the corresponding operation

**Given** an entity has both `name` and `technical_label` fields
**When** the DataTable renders the name column
**Then** the display name is shown in bold and the technical name below in monospace gray text

**Given** a DataTable column references a foreign entity (e.g. Funding Program, Action Theme)
**When** the table renders that column
**Then** the entity name is shown as a clickable link that navigates to the referenced entity's detail page

### Story 5.6: Detail Page Header & Navigation Polish

As an operator (Alex/Sophie),
I want breadcrumb navigation, technical names, meta info, and section anchors on detail pages,
So that I always know where I am, can see key entity metadata at a glance, and can jump between page sections.

> **Origin:** UX Gap Analysis review (2026-03-04). Gaps: GAP-L1 (P1), GAP-MW2 (P1), GAP-MW3/ID7 (P1), GAP-MW5/ID5 (P1), GAP-MW11 (P2).

**Acceptance Criteria:**

**Given** the operator is on any page in the application
**When** the page renders
**Then** a breadcrumb trail is shown in the header: "Section > Current page" with clickable parent links

**Given** the operator is on an entity detail page that has a `technical_label` field
**When** the page renders
**Then** the technical name is displayed below the title in monospace gray text

**Given** the operator is on an entity detail page
**When** the page renders
**Then** a meta line shows: "Updated [formatted date] · ID: [entity id]"
**And** "Updated by" is omitted until the API provides an `updated_by` field

**Given** the operator is on ActionModel detail or Indicator detail
**When** the page has multiple sections (Metadata, Indicators, API Inspector, etc.)
**Then** SectionAnchorsComponent is rendered with clickable pills for each section
**And** clicking a pill scrolls to the corresponding section

**Given** breadcrumbs are implemented
**When** the operator is on a detail page
**Then** the "← Back to list" button is removed in favor of the breadcrumb parent link

### Story 5.7: Accessibility & Cross-Cutting Consistency

As an operator (Alex/Sophie),
I want consistent behavior, proper accessibility, and polished UI across all entity pages,
So that the application feels reliable, works with assistive technology, and has no rough edges.

> **Origin:** UX Gap Analysis review (2026-03-04). Gaps: GAP-TR1 (P1), GAP-CC2 (P2), GAP-CC3 (P2), GAP-CC4 (P2), GAP-CC5 (P2), GAP-L2 (P2), GAP-L3 (P2).

**Acceptance Criteria:**

**Given** a ToggleRow component renders a toggle switch
**When** screen readers interpret the toggle
**Then** the toggle has `role="switch"`, `aria-checked` reflecting state, and `aria-label` with the toggle label

**Given** any entity detail page shows date fields (Created, Updated)
**When** the dates render
**Then** all dates use consistent `fr-FR` locale formatting (no raw ISO strings)

**Given** ActionThemeList loads data
**When** the API request is in flight
**Then** no "No items found" empty state flashes before data arrives (add `hasLoaded` guard)

**Given** an ActionModelDetail API request fails
**When** the error response is received
**Then** an error message is displayed with a retry option (matching IndicatorModelDetail pattern)

**Given** the operator navigates away from ActionModelDetail
**When** the component is destroyed
**Then** `facade.clearSelection()` is called to prevent stale data (matching IndicatorModelDetail pattern)

**Given** the operator is logged in
**When** they look at the application header
**Then** a user avatar (initials circle) and full name are displayed next to the logout button

**Given** the sidebar renders navigation items
**When** the operator scans the navigation
**Then** items are grouped under section labels ("Configuration" and "Administration") with uppercase gray dividers
