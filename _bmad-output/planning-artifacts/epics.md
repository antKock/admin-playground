---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories, step-04-final-validation]
status: 'complete'
completedAt: '2026-03-03'
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
---

# Laureat Admin Interface - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for admin-playground (Laureat Admin Interface), decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories.

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

NFR1: No heavy client-side computation; all performance is API-bound. Paginated list views must feel responsive on a standard office network connection.
NFR2: All communication with the Laureat API occurs over HTTPS
NFR3: JWT stored securely client-side; never exposed in URLs or logs
NFR4: Credentials (email/password, API base URL) managed via `.env.local` — must not be committed to the repository
NFR5: No sensitive citizen or personal data stored or cached client-side
NFR6: Session expires on logout; no persistent session across browser restarts required for v1
NFR7: Admin consumes the Laureat REST API exclusively — no other backends or third-party services
NFR8: API base URL configurable via `environment.ts` to support staging/production switching
NFR9: Live OpenAPI specification (`/openapi.json`) is the authoritative source of truth for all endpoint contracts
NFR10: All API errors propagated to the user — no silent failures or swallowed exceptions
NFR11: Cursor-based pagination contract (`cursor` + `limit` + `PaginatedResponse<T>`) honored consistently across all entity list views
NFR12: Admin builds strictly against current API support; features not yet exposed by the API are deferred
NFR13: Angular 20 standalone components exclusively — no NgModule
NFR14: TypeScript strict mode throughout
NFR15: Angular signals for all reactive state — no NgRx or third-party state libraries
NFR16: Consistent architectural patterns across all 7 entity modules (folder structure, service pattern, routing approach)
NFR17: Inline code documentation for all non-obvious logic, architectural decisions, and domain-specific behavior
NFR18: Lazy-loaded routing per entity module from day one

### Additional Requirements

**From Architecture:**

- Starter template: Angular CLI `ng new admin-playground --style=css --routing --ssr=false --skip-tests=false` — this must be the first implementation action
- Post-scaffold dependencies: `tailwindcss @tailwindcss/postcss postcss` (dev), `@angular/cdk`, `lucide-angular`
- Tailwind CSS v4 configured via `.postcssrc.json` with `@tailwindcss/postcss` plugin
- Auto-generate API types from live OpenAPI spec using `openapi-typescript` — output to `src/app/core/api/generated/api-types.ts`
- `BaseEntityService<T>` generic base for all entity services with CRUD + cursor pagination
- Entity-specific services extend base: ActionThemeService (publish/disable/activate/duplicate), CommunityService (assignUser/removeUser/parents/children), IndicatorModelService (association metadata), AgentService (soft-delete)
- JWT authentication: localStorage storage, HTTP interceptor for token injection, functional canActivate route guard, 401 redirect with preserved destination
- Error handling: hybrid interceptor (401/500/network) + component-level (409/422/400) with toast notification channel
- Signal-based services: HttpClient internally, `toSignal()` bridge, components consume signals exclusively
- Reactive Forms for all entity forms (`FormBuilder` + `FormGroup` + `FormControl`)
- ESLint + Prettier configured from scaffold
- TSConfig path aliases: `@app/*` → `src/app/*`
- Vercel deployment with `vercel.json` SPA fallback rewrite
- Proxy configuration for local development against staging API (if CORS required)
- API Inspector: entity services store `lastResponse` signal for ApiInspector component
- Flat feature folder structure per entity (list, detail, form, service, routes, model files)
- Shared components in `src/app/shared/components/` with individual subfolders
- Core services in `src/app/core/` (api, auth, layout, models)
- `snake_case` for all API types — no camelCase transformation
- Component selectors use `app-` prefix
- `input()` / `output()` signal-based component API — no `@Input` / `@Output` decorators

**From UX Design:**

- 13 custom shared components to build: AppLayout, DataTable, MetadataGrid, SectionAnchors, StatusBadge, SaveBar, Toast, ConfirmDialog, IndicatorCard, ToggleRow, RuleField, IndicatorPicker, ApiInspector
- Infinite scroll pattern (not traditional pagination buttons) — cursor-based, loads at 80% scroll threshold
- Model-as-workspace pattern for ActionModel detail: single-page with expandable indicator cards, inline parameter configuration
- Expandable card pattern for indicator parameter configuration: collapsed summary showing key states, expand to reveal 6 parameter toggle rows
- Explicit save model (not auto-save) with unsaved-state tracking per indicator card and navigation guards
- 60+ design tokens mapped to Tailwind custom theme (brand, surface, status, text, icon, stroke categories)
- Typography: system sans-serif primary, JetBrains Mono/Fira Code for monospace (technical labels, JSONLogic, API data)
- Minimum 1280px viewport, desktop-first, no responsive/mobile layout
- Skeleton loading patterns (not full-page spinners) for tables and detail views
- Status badges with semantic color: Draft (neutral), Published (green #2e8b7a), Disabled (gray #c8c8c8), Error (red #b32020)
- Toast notifications: non-blocking, auto-dismiss, pattern "Bold action" + context
- Error messages follow: what happened + why + what to do
- Confirmation dialogs only for destructive/irreversible operations (delete, type changes on published indicators)
- Keyboard efficiency: tab-through for repetitive configuration tasks
- CDK usage: Overlay (dropdowns, dialogs), DragDrop (indicator reorder), A11y (focus trap), Clipboard, Scrolling (virtual scroll)
- Parameter labels in French: Obligatoire, Non éditable, Non visible, Valeur par défaut, Duplicable, Valeurs contraintes
- "+ Ajouter une règle" action reveals JSONLogic text field per parameter toggle

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1 | Epic 1 | Email/password authentication |
| FR2 | Epic 1 | Logout and session termination |
| FR3 | Epic 1 | Auto-attach credentials to API requests |
| FR4 | Epic 1 | Redirect unauthenticated users with preserved destination |
| FR5 | Epic 1 | Sidebar navigation to 7 entity sections |
| FR6 | Epic 1 | Authentication context in header |
| FR7 | Epic 2 | Paginated entity list views |
| FR8 | Epic 2 | Filter entity lists |
| FR9 | Epic 2 | View entity details |
| FR10 | Epic 2 | Create entity via form |
| FR11 | Epic 2 | Edit entity |
| FR12 | Epic 2 | Delete entity with confirmation |
| FR13 | Epic 2 | Status workflow transitions |
| FR14 | Epic 2 | Duplicate Action Theme |
| FR15 | Epic 2 | Prevent invalid status transitions |
| FR16 | Epic 2 | Status visible in list and detail views |
| FR17 | Epic 3 | Associate Action Model with Funding Program / Action Theme |
| FR18 | Epic 3 | Associate Folder Model with Funding Programs |
| FR19 | Epic 4 | Assign/remove users from Community |
| FR20 | Epic 5 | Attach Indicator Models to Action Model |
| FR21 | Epic 5 | See which models use an Indicator Model |
| FR22 | Epic 6 | Manage association metadata (visibility_rule, required_rule, etc.) |
| FR23 | Epic 6 | Configure 6 behavior parameters per indicator per model context |
| FR24 | Epic 6 | JSONLogic rule input for rule-capable parameters |
| FR25 | Epic 5 | Configure Indicator Model type and subtype |
| FR26 | Epic 5 | Manage list values for list-type indicators |
| FR27 | Epic 5 | Prevent type changes on indicators with instances |
| FR28 | Epic 6 | View all parameters/rules for an indicator in model context |
| FR29 | Epic 2 | Human-readable error messages |
| FR30 | Epic 2 | Success notifications |
| FR31 | Epic 2 | Constraint violation explanations |
| FR32 | Epic 7 | API request/response inspector |

## Epic List

### Epic 1: Users Can Log In & Navigate the Admin Interface
Users can log in to the admin interface, see the application layout with sidebar navigation, and navigate between entity sections. This epic establishes the "door" — the foundational infrastructure and authentication that all subsequent epics build upon.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6
**Implementation notes:** Includes Angular CLI scaffold (`ng new`), Tailwind/CDK/Lucide setup, OpenAPI type generation, design token theme configuration, AppLayout (sidebar + header), AuthService, JWT interceptor, route guards, login page. Also builds the shared component library foundation (DataTable, StatusBadge, Toast, ConfirmDialog, MetadataGrid, SectionAnchors) since they are needed by all subsequent epics.

### Epic 2: Funding Program & Action Theme Management (MVP)
Users can create, view, edit, and delete Funding Programs and Action Themes — including full status workflow transitions (draft → published → disabled) and Action Theme duplication. This epic validates the complete CRUD + pagination + status + error handling patterns and serves as the MVP gate.
**FRs covered:** FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR16, FR29, FR30, FR31
**Implementation notes:** First two entities validate all CRUD, infinite scroll pagination, status lifecycle, and feedback/error patterns. FR29-31 (feedback and error handling) are implemented here as cross-cutting concerns reused by all subsequent epics. MVP gate: Alex logs in, creates a Funding Program and Action Theme, walks the status lifecycle — no Postman.

### Epic 3: Action Model & Folder Model Management
Users can create and manage Action Models (selecting associated Funding Program and Action Theme) and Folder Models (associating with one or more Funding Programs). Entity relationship management patterns are established.
**FRs covered:** FR17, FR18
**Implementation notes:** Introduces FK selector patterns and linked reference fields. Action Model detail view sets up the workspace foundation that will later host indicator cards in Epic 6. Folder Model adds multi-select Funding Program association.

### Epic 4: Community & Agent Management
Users can manage Communities (including assigning and removing users) and Agents (including soft-delete status management). After this epic, 6 of 7 entity types are fully operational.
**FRs covered:** FR19
**Implementation notes:** Communities have parent-child hierarchy with recursive fetching — more complex than simple CRUD. Agents have soft-delete semantics. Completes the simple-to-medium entity coverage.

### Epic 5: Indicator Model Management
Users can create and manage Indicator Models — configuring type and subtype, managing list values for list-type indicators, and seeing which models use each indicator. The reusable building blocks for the configuration chain are established.
**FRs covered:** FR20, FR21, FR25, FR26, FR27
**Implementation notes:** Indicator Models are the most complex entity type. This epic covers the entity itself: CRUD, type/subtype configuration, list value management, "used in N models" visibility, type-change constraints on published indicators, and attaching indicators to models.

### Epic 6: Indicator-Model Configuration Workspace
Users can configure all 6 behavior parameters for each indicator within a model context, input JSONLogic rules for conditional behavior, and manage association metadata. This is the "full chain" moment — the north star of the product.
**FRs covered:** FR22, FR23, FR24, FR28
**Implementation notes:** Builds the expandable card pattern (IndicatorCard, ToggleRow, RuleField, IndicatorPicker, SaveBar components). Model-as-workspace pattern on the ActionModel detail page. Explicit save with per-card dirty tracking and navigation guards. v1 gate: Sophie completes a full program configuration end-to-end without opening Postman.

### Epic 7: Developer Tooling & Polish
Users can inspect the last API request URL and full response payload on any entity detail page, enabling rapid development validation and issue diagnosis without leaving the admin interface.
**FRs covered:** FR32
**Implementation notes:** ApiInspector component rendered on all detail pages. Alex validates platform state by reading raw API responses directly. Optional: signal-based entity caching if API latency becomes noticeable for the 3 operators.

### Epic 8: UX Polish — Drag-to-Reorder & Inline Editable Properties (Bonus)
Users can reorder indicator associations on the Action Model workspace via drag-and-drop, and edit entity properties inline on detail pages without navigating to a separate edit form. This epic elevates the UX from functional to polished.
**FRs covered:** None (UX enhancement beyond PRD scope)
**Implementation notes:** CDK DragDrop for indicator card reordering on the ActionModel workspace. Inline-editable property fields on detail views replace the read-only MetadataGrid + separate edit form pattern for simple fields. Both features were identified in the UX Design Specification as chosen directions. This is a bonus epic — all core v1 functionality is complete after Epic 7.

## Epic 1: Users Can Log In & Navigate the Admin Interface

Users can log in to the admin interface, see the application layout with sidebar navigation, and navigate between entity sections.

### Story 1.1: Project Scaffold & Design System Foundation

As a developer,
I want the Angular project scaffolded with all dependencies, Tailwind design tokens, and tooling configured,
So that all subsequent development starts from a consistent, correctly-configured foundation.

**Acceptance Criteria:**

**Given** no project exists yet
**When** the scaffold is created using `ng new admin-playground --style=css --routing --ssr=false --skip-tests=false`
**Then** the project compiles and serves on `localhost:4200`
**And** Tailwind CSS v4 is configured via `.postcssrc.json` with `@tailwindcss/postcss` plugin
**And** `@angular/cdk`, `lucide-angular` are installed
**And** `styles.css` imports Tailwind and defines all 60+ design tokens from the color palette (brand, surface, status, text, icon, stroke)
**And** TypeScript strict mode is enabled
**And** TSConfig path aliases map `@app/*` to `src/app/*`
**And** ESLint and Prettier are configured and pass on the scaffold
**And** `vercel.json` is created with SPA fallback rewrite
**And** `.gitignore` excludes `.env.local` and standard Angular ignores
**And** `environment.ts` contains `apiBaseUrl` pointing to `laureatv2-api-staging.osc-fr1.scalingo.io` and a `production` flag

### Story 1.2: API Type Generation & Base Service Layer

As a developer,
I want auto-generated TypeScript types from the live OpenAPI spec and a generic base service for CRUD + cursor pagination,
So that all entity services share a consistent, type-safe API layer.

**Acceptance Criteria:**

**Given** the project scaffold exists with dependencies installed
**When** `openapi-typescript` is run against the live OpenAPI spec
**Then** TypeScript interfaces are generated in `src/app/core/api/generated/api-types.ts`
**And** a `scripts/generate-api-types.sh` script exists to re-run generation
**And** generated types use `snake_case` field names matching the API exactly
**And** `PaginatedResponse<T>` model is defined with `items: T[]`, `cursor: string | null`, `limit: number`
**And** `BaseEntityService<T>` is implemented in `src/app/core/api/base-entity.service.ts`
**And** `BaseEntityService<T>` provides `list(cursor?, limit?)`, `getById(id)`, `create(data)`, `update(id, data)`, `delete(id)` methods
**And** all list methods return `PaginatedResponse<T>`
**And** the service uses `HttpClient` internally and exposes data via signals using `toSignal()` bridge
**And** the service exposes readonly signals: `items`, `selectedItem`, `isLoading`, `error`
**And** the service stores a `lastResponse` signal for API Inspector use
**And** no `any` types exist in the API layer

### Story 1.3: Authentication System

As an operator (Sophie/Alex),
I want to log in with my email and password and have my session managed automatically,
So that I can securely access the admin interface without manually managing tokens.

**Acceptance Criteria:**

**Given** the user is not authenticated
**When** the user navigates to any protected route
**Then** they are redirected to the login page
**And** the intended destination URL is preserved

**Given** the user is on the login page
**When** they enter valid email and password and submit
**Then** the JWT token is stored in localStorage under a namespaced key
**And** the user is redirected to their intended destination (or the default landing page)

**Given** the user enters invalid credentials
**When** they submit the login form
**Then** a clear error message is displayed (not a generic "error occurred")
**And** the password field is cleared but email is preserved

**Given** the user is authenticated
**When** any HTTP request is made to the API
**Then** the JWT token is automatically attached via the HTTP interceptor
**And** all requests go over HTTPS

**Given** the user is authenticated and the token has expired
**When** an API call returns 401
**Then** the user is redirected to the login page with the current URL preserved as intended destination

**Given** the user clicks logout
**When** the logout action completes
**Then** the JWT is removed from localStorage
**And** the user is redirected to the login page

### Story 1.4: Application Shell & Navigation

As an operator (Sophie/Alex),
I want a persistent sidebar with all 7 entity sections and a header showing my login state,
So that I can navigate between entity sections efficiently and always know I'm authenticated.

**Acceptance Criteria:**

**Given** the user is authenticated
**When** they access the admin interface
**Then** the AppLayout component renders with a sidebar on the left and a header at the top
**And** the sidebar displays navigation links for all 7 entity sections: Funding Programs, Action Themes, Action Models, Folder Models, Communities, Agents, Indicator Models
**And** the header displays the user's authentication context (logged-in state)
**And** the header contains a logout button

**Given** the user clicks a sidebar navigation link
**When** the route changes
**Then** the corresponding entity section loads via lazy-loaded routing
**And** the current section is visually highlighted in the sidebar

**Given** the user is on any page in the application
**When** they look at the sidebar
**Then** it is always visible and accessible (persistent)
**And** they are never more than one click from any entity list

**Given** 7 entity feature modules exist
**When** the application loads
**Then** only the active route's module is loaded (lazy loading)
**And** each entity has a placeholder route component showing the entity name (ready for Epic 2+)

### Story 1.5: Shared Component Library — Core

As a developer,
I want the foundational shared components built and ready for use,
So that all entity modules in subsequent epics use consistent, tested UI components.

**Acceptance Criteria:**

**Given** the design system tokens are configured in Tailwind
**When** the DataTable component is implemented
**Then** it accepts column definitions and row data via `input()` signals
**And** it supports infinite scroll cursor-based pagination (loads at 80% scroll threshold)
**And** it displays skeleton loading rows (6 rows of shimmer) when `isLoading` is true
**And** it emits row click events via `output()` for navigation to detail views
**And** it renders in the data-table CSS class convention from the UX spec

**Given** the shared components folder structure exists
**When** StatusBadge is implemented
**Then** it accepts a status string input and renders the appropriate semantic color badge (Draft: neutral, Published: green #2e8b7a, Disabled: gray #c8c8c8)
**And** it uses the `text-xs` type scale

**Given** the shared components folder structure exists
**When** Toast + ToastService are implemented
**Then** ToastService is injectable and provides `success()`, `error()`, `info()` methods
**And** toasts appear as non-blocking overlays using CDK Overlay
**And** toasts auto-dismiss after a configurable duration
**And** toast messages follow the pattern: **"Bold action"** + context

**Given** the shared components folder structure exists
**When** ConfirmDialog + ConfirmDialogService are implemented
**Then** ConfirmDialogService provides a `confirm(title, message)` method returning an Observable/Promise
**And** the dialog uses CDK Overlay with focus trapping (CDK A11y)
**And** the dialog renders with Cancel and Confirm action buttons

**Given** the shared components folder structure exists
**When** MetadataGrid is implemented
**Then** it accepts key-value pairs via input and renders them in a structured grid layout
**And** it supports linked reference fields (with navigation icon) for entity relationships

**Given** the shared components folder structure exists
**When** SectionAnchors is implemented
**Then** it renders a list of anchor links for navigating between sections on a detail page

**Given** all shared components are built
**When** they are inspected
**Then** all use standalone component architecture (no NgModule)
**And** all use `input()` / `output()` signal-based API (no `@Input` / `@Output` decorators)
**And** all are purely presentational (no service injection, no HTTP calls)
**And** each has its own subfolder with component + template + styles + spec files

## Epic 2: Funding Program & Action Theme Management (MVP)

Users can create, view, edit, and delete Funding Programs and Action Themes — including full status workflow transitions and Action Theme duplication.

### Story 2.1: Funding Program List & Detail Views

As an operator (Sophie/Alex),
I want to view a paginated list of Funding Programs and see the full details of any program,
So that I can browse and inspect funding program configuration without using Postman.

**Acceptance Criteria:**

**Given** the user navigates to the Funding Programs section
**When** the list loads
**Then** a paginated list of Funding Programs is displayed in the DataTable component
**And** infinite scroll loads more results at 80% scroll threshold using cursor-based pagination
**And** each row shows the program's label, technical label, and creation date
**And** skeleton loading is displayed while data loads

**Given** the user clicks on a Funding Program row in the list
**When** the detail view loads
**Then** all fields of the Funding Program are displayed in a MetadataGrid
**And** the detail view uses the SectionAnchors component for navigation between sections

**Given** the Funding Program list is empty
**When** the user views the list
**Then** an empty state message is displayed with a prompt to create a new Funding Program

**Given** the feature module structure
**When** inspected
**Then** it follows the flat folder structure: `funding-program-list.component.ts`, `funding-program-detail.component.ts`, `funding-program-form.component.ts`, `funding-program.service.ts`, `funding-program.routes.ts`, `funding-program.model.ts`
**And** `FundingProgramService` extends `BaseEntityService<FundingProgram>`

### Story 2.2: Funding Program Create, Edit & Delete

As an operator (Sophie/Alex),
I want to create new Funding Programs, edit existing ones, and delete them with confirmation,
So that I can manage the full lifecycle of funding program configuration.

**Acceptance Criteria:**

**Given** the user clicks "Create" on the Funding Programs list
**When** the create form is displayed
**Then** a structured form is rendered using Angular Reactive Forms
**And** required fields are validated on blur and on submit
**And** the first invalid field is focused on submit if validation fails

**Given** the user fills in valid data and submits the create form
**When** the API call succeeds
**Then** a success toast is displayed ("Funding Program created")
**And** the user is navigated to the new program's detail view

**Given** the user fills in valid data and submits the create form
**When** the API call fails
**Then** a human-readable error message is displayed via toast
**And** 422 validation errors are mapped to specific form fields where possible
**And** the error explains what failed and why (FR29, FR31)

**Given** the user opens an existing Funding Program for editing
**When** the edit form is displayed
**Then** all fields are pre-populated with current values
**And** the form component handles both create and edit via a `mode` input

**Given** the user saves edits to a Funding Program
**When** the API call succeeds
**Then** a success toast confirms the update ("Funding Program updated")

**Given** the user clicks delete on a Funding Program
**When** the confirmation dialog appears
**Then** the dialog clearly states what will be deleted
**And** the user must explicitly confirm before the delete proceeds
**And** on successful deletion, a toast confirms and the user returns to the list
**And** on failure (e.g., 409 conflict), the error message explains why deletion failed and what to do

### Story 2.3: Action Theme List, Detail, Create, Edit & Delete

As an operator (Sophie/Alex),
I want full CRUD operations on Action Themes with the same patterns as Funding Programs,
So that I can manage action theme configuration consistently.

**Acceptance Criteria:**

**Given** the user navigates to the Action Themes section
**When** the list loads
**Then** Action Themes are displayed in a paginated DataTable with infinite scroll
**And** each row shows label, technical label, status badge, and creation date
**And** the StatusBadge component shows the current status (draft, published, disabled)

**Given** the user views an Action Theme detail
**When** the detail page loads
**Then** all fields are displayed in a MetadataGrid
**And** the current status is prominently displayed via StatusBadge

**Given** the user creates a new Action Theme
**When** the create form is displayed
**Then** the form includes fields for: label, technical_label, description, and any ActionTheme-specific fields returned by the API
**And** the status field is not editable on create (defaults to draft)
**And** required fields are validated on blur and on submit

**Given** the user edits an existing Action Theme
**When** the edit form is displayed
**Then** all fields are pre-populated with current values
**And** the status field is read-only (managed via status workflow in Story 2.4)

**Given** the user creates, edits, or deletes an Action Theme
**When** the operation completes
**Then** the same validation, error handling, and toast patterns from Funding Programs are followed
**And** `ActionThemeService` extends `BaseEntityService<ActionTheme>` with additional methods: `publish()`, `disable()`, `activate()`, `duplicate()`
**And** the feature module follows the identical flat folder structure

### Story 2.4: Action Theme Status Workflow & Duplication

As an operator (Sophie/Alex),
I want to transition Action Themes through their status lifecycle (draft → published → disabled) and duplicate them,
So that I can manage theme publication and quickly create variations.

**Acceptance Criteria:**

**Given** the user views an Action Theme in draft status
**When** they click the "Publish" action
**Then** the status transitions to published
**And** the StatusBadge updates immediately
**And** a success toast confirms ("Action Theme published")

**Given** the user views a published Action Theme
**When** they click the "Disable" action
**Then** the status transitions to disabled
**And** the StatusBadge updates to the disabled state (gray)

**Given** the user attempts an invalid status transition
**When** the API returns an error
**Then** the system displays a clear message explaining why the transition is not allowed (FR15)
**And** the current status remains unchanged

**Given** the user views an Action Theme
**When** they click the "Duplicate" action
**Then** a new Action Theme is created as a copy with draft status
**And** a success toast confirms ("Action Theme duplicated")
**And** the user is navigated to the new duplicate's detail view

**Given** the user views Action Theme list or detail
**When** they look at the status
**Then** the current status is visible at a glance via StatusBadge (FR16)

### Story 2.5: List Filtering

As an operator (Sophie/Alex),
I want to filter entity lists by available criteria (status, associated program, etc.),
So that I can quickly find specific entities without scrolling through the full list.

**Acceptance Criteria:**

**Given** the user is on the Action Themes list
**When** filter controls are available
**Then** the user can filter by status (draft, published, disabled) where the API supports it

**Given** the user applies a filter
**When** the list reloads
**Then** only matching entities are displayed
**And** the pagination resets to the beginning
**And** the active filter is visually indicated

**Given** the user clears all filters
**When** the list reloads
**Then** the full unfiltered list is displayed

**Filtering Scope Per Entity (FR8):**
Filtering is implemented only where the API exposes filter query parameters. The following is the expected scope based on the live OpenAPI spec:

| Entity | Filter Support | Available Filters |
|---|---|---|
| Action Themes | Yes | status |
| Funding Programs | Verify API | Check OpenAPI spec during implementation |
| Action Models | Verify API | Check OpenAPI spec during implementation |
| Folder Models | Verify API | Check OpenAPI spec during implementation |
| Communities | Verify API | Check OpenAPI spec during implementation |
| Agents | Verify API | Check OpenAPI spec during implementation |
| Indicator Models | Verify API | Check OpenAPI spec during implementation |

**Note:** During implementation, the developer should consult the live OpenAPI spec (`/openapi.json`) to determine the exact filter parameters available per entity. Any entity with API-supported filters should have filter controls added. Entities without API filter support should not have filter UI.

## Epic 3: Action Model & Folder Model Management

Users can create and manage Action Models and Folder Models with entity relationship associations.

### Story 3.1: Action Model CRUD with Relationship Selectors

As an operator (Sophie/Alex),
I want to create and manage Action Models, selecting their associated Funding Program and Action Theme,
So that I can build model configurations linked to the correct program and theme.

**Acceptance Criteria:**

**Given** the user navigates to the Action Models section
**When** the list loads
**Then** Action Models are displayed in a paginated DataTable with infinite scroll
**And** each row shows label, technical label, associated Funding Program name, associated Action Theme name, and status badge
**And** `ActionModelService` extends `BaseEntityService<ActionModel>`
**And** the feature module follows the flat folder structure

**Given** the user creates or edits an Action Model
**When** the form is displayed
**Then** a Funding Program selector (dropdown) is available, populated from the FundingProgramService
**And** an Action Theme selector (dropdown) is available, populated from the ActionThemeService
**And** both selectors show the entity label and allow selection (FR17)
**And** selected relationships display as linked reference fields with a navigation icon (click to open the linked entity)

**Given** the user views an Action Model detail
**When** the detail page loads
**Then** the associated Funding Program and Action Theme are displayed as linked references in the MetadataGrid
**And** clicking the link navigates to the associated entity's detail view

**Given** the user performs any CRUD operation on Action Models
**When** the operation completes
**Then** the same validation, error handling, and toast patterns established in Epic 2 are followed

### Story 3.2: Folder Model CRUD with Multi-Program Association

As an operator (Sophie/Alex),
I want to create and manage Folder Models, associating them with one or more Funding Programs,
So that I can organize folder structures linked to the appropriate programs.

**Acceptance Criteria:**

**Given** the user navigates to the Folder Models section
**When** the list loads
**Then** Folder Models are displayed in a paginated DataTable with infinite scroll
**And** each row shows label, technical label, associated Funding Program count, and status
**And** `FolderModelService` extends `BaseEntityService<FolderModel>`
**And** the feature module follows the flat folder structure

**Given** the user creates or edits a Folder Model
**When** the form is displayed
**Then** a multi-select Funding Program picker is available (FR18)
**And** the user can select one or more Funding Programs to associate
**And** selected programs are displayed as a list with remove capability

**Given** the user views a Folder Model detail
**When** the detail page loads
**Then** all associated Funding Programs are displayed as linked references
**And** clicking any link navigates to that Funding Program's detail view

## Epic 4: Community & Agent Management

Users can manage Communities (with user assignment) and Agents (with soft-delete). After this epic, 6 of 7 entity types are fully operational.

### Story 4.1: Community CRUD & User Assignment

As an operator (Sophie/Alex),
I want to create and manage Communities, including assigning and removing users,
So that I can organize user groups for the platform.

**Acceptance Criteria:**

**Given** the user navigates to the Communities section
**When** the list loads
**Then** Communities are displayed in a paginated DataTable with infinite scroll
**And** each row shows label, technical label, member count, and parent community (if applicable)
**And** `CommunityService` extends `BaseEntityService<Community>` with additional methods: `assignUser()`, `removeUser()`, `getParents()`, `getChildren()`
**And** the feature module follows the flat folder structure

**Given** the user views a Community detail
**When** the detail page loads
**Then** community metadata is displayed in a MetadataGrid
**And** a list of assigned users is displayed
**And** parent and child communities are shown as linked references (if applicable)

**Given** the user clicks "Assign User" on a Community
**When** the assignment interface is presented
**Then** the user can search/select a user to add (FR19)
**And** on successful assignment, the user list updates and a success toast is shown

**Given** the user clicks "Remove" on an assigned user
**When** the confirmation dialog appears and is confirmed
**Then** the user is removed from the community
**And** a success toast confirms the removal

**Given** the user performs CRUD operations on Communities
**When** any operation completes
**Then** the same validation, error handling, and toast patterns established in Epic 2 are followed

### Story 4.2: Agent CRUD & Soft-Delete Management

As an operator (Sophie/Alex),
I want to create and manage Agents with soft-delete status management,
So that I can manage agent records without permanently losing data.

**Acceptance Criteria:**

**Given** the user navigates to the Agents section
**When** the list loads
**Then** Agents are displayed in a paginated DataTable with infinite scroll
**And** each row shows label, status badge, and relevant metadata
**And** `AgentService` extends `BaseEntityService<Agent>` with soft-delete semantics
**And** the feature module follows the flat folder structure

**Given** the user creates or edits an Agent
**When** the form is displayed
**Then** a structured form with appropriate fields is rendered using Reactive Forms
**And** the same validation and error handling patterns are followed

**Given** the user deletes an Agent
**When** the delete action is triggered
**Then** the agent is soft-deleted (not permanently removed)
**And** the agent's status reflects the soft-deleted state
**And** a success toast confirms the operation

**Given** the user views the Agent list
**When** soft-deleted agents are present
**Then** their status is clearly indicated via StatusBadge

## Epic 5: Indicator Model Management

Users can create and manage Indicator Models — type/subtype configuration, list value management, and model association visibility.

### Story 5.1: Indicator Model CRUD with Type & Subtype Configuration

As an operator (Sophie),
I want to create and manage Indicator Models with type and subtype configuration,
So that I can define the building blocks for program configuration.

**Acceptance Criteria:**

**Given** the user navigates to the Indicator Models section
**When** the list loads
**Then** Indicator Models are displayed in a paginated DataTable with infinite scroll
**And** each row shows label, technical label, type badge, subtype, and status
**And** `IndicatorModelService` extends `BaseEntityService<IndicatorModel>` with additional methods for association metadata management
**And** the feature module follows the flat folder structure

**Given** the user creates a new Indicator Model
**When** the form is displayed
**Then** the user can select the indicator type from available types (FR25)
**And** the user can select or configure the subtype
**And** labels (user label, technical label) and descriptions are configurable
**And** the form follows Reactive Forms patterns

**Given** the user saves a new Indicator Model
**When** the API call succeeds
**Then** a success toast confirms creation
**And** the user is navigated to the new indicator's detail view

**Given** the user views an Indicator Model detail
**When** the detail page loads
**Then** all fields are displayed including type, subtype, labels, and description
**And** type and subtype are displayed with appropriate formatting (monospace for technical values)

### Story 5.2: Indicator Model List Values & Type Constraints

As an operator (Sophie),
I want to manage list values for list-type indicators and be prevented from changing types on indicators with existing instances,
So that I can configure indicator options safely without breaking existing data.

**Acceptance Criteria:**

**Given** the user edits a list-type Indicator Model
**When** the form is displayed
**Then** a list value management section is available (FR26)
**And** the user can add new values to the list
**And** the user can remove values from the list
**And** the user can reorder values in the list

**Given** the user tries to change the type of a published Indicator Model with existing instances
**When** the save is attempted
**Then** the system blocks the change (FR27)
**And** a clear explanatory message is displayed: "Type cannot be changed — instances of this indicator already exist. Create a new indicator instead."

**Given** the user edits a draft Indicator Model with no instances
**When** they change the type
**Then** the change is allowed and saves successfully

### Story 5.3: Indicator Model Association Visibility & Attachment

As an operator (Sophie/Alex),
I want to see which models use each Indicator Model and attach indicators to Action Models,
So that I can understand indicator usage across the system and build model configurations.

**Acceptance Criteria:**

**Given** the user views an Indicator Model detail
**When** the detail page loads
**Then** a "Used in Models" section displays the count and list of models this indicator is associated with (FR21)
**And** each model in the list is a linked reference that navigates to the model's detail view
**And** the count is visible at a glance (e.g., "Used in 3 models")

**Given** the user is on an Action Model detail page
**When** they want to attach an indicator
**Then** they can access an indicator attachment interface (FR20)
**And** they can search/browse available Indicator Models
**And** they can select and attach an indicator to the model
**And** on successful attachment, the indicator appears in the model's indicator list
**And** a success toast confirms the attachment

**Given** the user wants to remove an indicator from an Action Model
**When** they trigger the removal action
**Then** a confirmation dialog appears (if the indicator has configured parameters)
**And** on confirmation, the association is removed
**And** a success toast confirms the removal

## Epic 6: Indicator-Model Configuration Workspace

Users can configure all 6 behavior parameters for each indicator within a model context, input JSONLogic rules, and manage association metadata. The "full chain" moment.

### Story 6.1: Expandable Indicator Card System

As an operator (Sophie),
I want to see attached indicators as expandable cards on the Action Model detail page, with collapsed summaries and expandable parameter configuration,
So that I can scan indicator states at a glance and configure them in context.

**Acceptance Criteria:**

**Given** the user views an Action Model detail page with attached indicators
**When** the indicator list renders
**Then** each attached indicator appears as a collapsed IndicatorCard component
**And** the collapsed card shows: indicator label, technical label, type badge, and parameter summary icons (which of the 6 parameters are active)

**Given** the user clicks on a collapsed IndicatorCard
**When** the card expands
**Then** all 6 parameter rows are revealed as ToggleRow components
**And** parameter labels are in French: Obligatoire, Non éditable, Non visible, Valeur par défaut, Duplicable, Valeurs contraintes
**And** each parameter shows its current ON/OFF toggle state
**And** the expanded card sits on `surface-background-slight` background

**Given** the user clicks on an expanded IndicatorCard header
**When** the card collapses
**Then** the card returns to collapsed state showing the parameter summary

**Given** all shared components for this story are built
**When** inspected
**Then** IndicatorCard, ToggleRow are standalone components using `input()` / `output()` signal API
**And** they are located in `src/app/shared/components/`
**And** each has its own subfolder with component + template + styles + spec

### Story 6.2: Parameter Toggle Configuration & Dirty Tracking

As an operator (Sophie),
I want to toggle the 6 behavior parameters for each indicator and see which cards have unsaved changes,
So that I can experiment with configuration before committing and never lose track of what I've changed.

**Acceptance Criteria:**

**Given** the user expands an indicator card
**When** they toggle a parameter (e.g., Obligatoire ON → OFF)
**Then** the toggle updates immediately in the UI (optimistic local state)
**And** the card is marked as having unsaved changes (visual cue — subtle dot or border change)

**Given** the user has modified parameters on one or more indicator cards
**When** they look at the workspace
**Then** each modified card shows an unsaved indicator
**And** a global unsaved count is visible ("2 unsaved changes")
**And** the SaveBar component becomes visible/active at the bottom of the workspace

**Given** the user has unsaved changes
**When** the SaveBar is displayed
**Then** it shows a "Save" button (enabled) and a "Discard changes" option
**And** the Save button is disabled when no changes exist

**Given** the user clicks "Discard changes"
**When** the discard action completes
**Then** all modified cards reset to their last-saved parameter states
**And** all unsaved indicators are cleared
**And** the SaveBar hides

**Given** the user has unsaved changes and navigates away
**When** the navigation guard triggers
**Then** a ConfirmDialog appears: "You have unsaved changes on N indicators. Save or discard?"
**And** choosing "Save" saves all changes then navigates
**And** choosing "Discard" resets all cards and navigates

### Story 6.3: JSONLogic Rule Input & Association Metadata

As an operator (Sophie),
I want to add JSONLogic rules to any rule-capable parameter and manage the full association metadata between indicators and models,
So that I can configure conditional behavior and fine-tune how each indicator behaves in a specific model context.

**Acceptance Criteria:**

**Given** the user views an expanded indicator card with a parameter toggle
**When** they click "+ Ajouter une règle" on a rule-capable parameter
**Then** a multi-line text field (RuleField component) is revealed below the toggle (FR24)
**And** the field accepts raw JSONLogic JSON input
**And** reference format guidance is available nearby (e.g., `section.technical_label`)

**Given** the user types a JSONLogic rule into the text field
**When** the content is entered
**Then** the text renders in monospace font (JetBrains Mono / Fira Code)
**And** the card is marked as having unsaved changes

**Given** the user has configured parameters and rules across multiple indicator cards
**When** they click "Save"
**Then** all modified association metadata (visibility_rule, required_rule, editable, default_value, duplicable, constrained_values) is persisted via the API (FR22)
**And** a success toast confirms: "N indicator parameters updated"
**And** all unsaved indicators are cleared
**And** cards reflect the saved state

**Given** the user views an indicator card with existing rules
**When** the card is expanded
**Then** all configured parameters and rules are displayed faithfully (FR28)
**And** JSONLogic rules are readable in the text field — no abstraction loss between stored data and UI

**Given** the user saves association metadata
**When** the API returns an error on a specific parameter
**Then** an inline error is shown on the specific parameter that failed
**And** the error message explains what went wrong and why

### Story 6.4: Indicator Picker for Model Association

As an operator (Sophie),
I want to search and pick indicators to attach to a model from within the workspace view,
So that I can assemble model configurations without navigating away.

**Acceptance Criteria:**

**Given** the user is on the Action Model workspace view
**When** they click "Add indicator" (or equivalent action)
**Then** the IndicatorPicker component is displayed (overlay or inline panel)
**And** available Indicator Models are listed with search/filter capability
**And** already-attached indicators are visually distinguished or excluded

**Given** the user selects an indicator from the picker
**When** the selection is confirmed
**Then** the indicator is attached to the model via the API
**And** a new IndicatorCard appears in the workspace
**And** a success toast confirms the attachment

**Given** the user wants to remove an indicator from the workspace
**When** they click the remove action on an indicator card
**Then** a confirmation dialog appears if the indicator has configured parameters
**And** on confirmation, the association is removed and the card disappears

## Epic 7: Developer Tooling & Polish

Users can inspect API requests and responses on any entity detail page for development validation.

### Story 7.1: API Inspector on Detail Pages

As a developer/operator (Alex),
I want to view the last API request URL and full response payload on any entity detail page,
So that I can validate API behavior and diagnose issues without opening Postman.

**Acceptance Criteria:**

**Given** the user is on any entity detail page
**When** the page has loaded data from the API
**Then** an ApiInspector panel/section is available on the page (FR32)
**And** the inspector shows the last request URL (method + full URL)
**And** the inspector shows the full response payload (formatted JSON)
**And** the response data renders in monospace font

**Given** the user views the ApiInspector
**When** the response payload is displayed
**Then** it shows the raw data exactly as returned by the API — no transformation or filtering
**And** the user can copy the response payload (using CDK Clipboard)

**Given** the user navigates to a different entity detail page
**When** the new page loads
**Then** the ApiInspector updates to show the latest request/response for the current entity

**Given** the ApiInspector component is built
**When** inspected
**Then** it is a standalone shared component in `src/app/shared/components/api-inspector/`
**And** it reads the `lastResponse` signal from the entity service
**And** it uses `input()` / `output()` signal-based API
**And** it is integrated on all 7 entity detail pages

## Epic 8: UX Polish — Drag-to-Reorder & Inline Editable Properties (Bonus)

Users can reorder indicator associations via drag-and-drop and edit entity properties inline on detail pages. This bonus epic elevates the user experience from functional to polished.

### Story 8.1: Drag-to-Reorder Indicator Cards on Action Model Workspace

As an operator (Sophie),
I want to reorder indicator cards on the Action Model workspace by dragging them,
So that I can organize indicators in a logical order that reflects my configuration workflow.

**Acceptance Criteria:**

**Given** the user is on the Action Model workspace with multiple attached indicators
**When** they grab an indicator card's drag handle
**Then** the card becomes draggable with a visual drag preview
**And** drop zones are indicated between other cards

**Given** the user drops an indicator card in a new position
**When** the drop completes
**Then** the indicator order updates immediately in the UI
**And** the new order is persisted via the API
**And** a success toast confirms ("Indicator order updated")

**Given** the user drags a card but drops it back in its original position
**When** the drop completes
**Then** no API call is made and no toast is shown

**Given** the drag-to-reorder feature is implemented
**When** inspected
**Then** it uses CDK DragDrop (`cdkDropList`, `cdkDrag`)
**And** keyboard accessibility is supported (CDK A11y)
**And** it integrates with the existing IndicatorCard component without modifying its core behavior

### Story 8.2: Inline Editable Properties on Detail Views

As an operator (Sophie/Alex),
I want to edit simple entity properties directly on the detail page without navigating to a separate edit form,
So that quick edits are faster and I maintain context on the detail view.

**Acceptance Criteria:**

**Given** the user is on any entity detail page
**When** they click on an editable field value in the MetadataGrid
**Then** the field transforms into an inline edit input (text field, dropdown, or appropriate control)
**And** the field shows Save (checkmark) and Cancel (X) action icons

**Given** the user edits a field inline and clicks Save
**When** the API call succeeds
**Then** the field reverts to display mode with the updated value
**And** a success toast confirms the update

**Given** the user edits a field inline and clicks Cancel
**When** the cancel action completes
**Then** the field reverts to display mode with the original value
**And** no API call is made

**Given** the user edits a field inline and the API call fails
**When** the error is returned
**Then** the field remains in edit mode
**And** an inline error message is displayed below the field

**Given** the inline editing feature is implemented
**When** inspected
**Then** it extends the existing MetadataGrid component with an optional `editable` flag per field
**And** non-editable fields (IDs, timestamps, computed values) remain read-only
**And** the edit form route still exists as a fallback for complex multi-field edits
