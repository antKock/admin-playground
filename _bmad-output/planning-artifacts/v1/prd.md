---
stepsCompleted: [step-01-init, step-02-discovery, step-02b-vision, step-02c-executive-summary, step-03-success, step-04-journeys, step-05-domain, step-06-innovation, step-07-project-type, step-08-scoping, step-09-functional, step-10-nonfunctional, step-11-polish, step-12-complete]
inputDocuments:
  - _bmad-output/planning-artifacts/product-brief-admin-playground-2026-03-03.md
  - docs/BRIEF_CLAUDE_PROJET_ADMIN_LAUREAT.md
  - docs/indicateurs.md
  - docs/modeles.md
  - docs/modeles-avec-indicateurs.md
  - docs/parametres-indicateur.md
  - docs/regles-avancees.md
briefCount: 2
researchCount: 0
brainstormingCount: 0
projectDocsCount: 0
workflowType: 'prd'
classification:
  projectType: web_app
  domain: general
  domainFlavor: govtech-adjacent
  complexity: medium
  projectContext: greenfield
---

# Product Requirements Document — Laureat Admin Interface

**Author:** Anthony
**Date:** 2026-03-03

## Executive Summary

The Laureat Admin Interface is an internal backoffice that unblocks the daily configuration and development-validation work of the Laureat platform team. Three tech-savvy operators currently manage a sophisticated configuration system — indicators, models, parameters, JSONLogic rules, status workflows — exclusively through raw API calls and Postman. This is both a daily operational bottleneck and an active obstacle to development velocity: the team cannot reliably validate API behavior or test platform configuration without a purpose-built interface.

The v1 goal is laser-focused on two things: **operational completeness** (full CRUD across all 7 configuration entities) and **end-to-end reliability** (the full chain from indicator creation to rule-driven model publication must work correctly, not just partially). Correctness and completeness take priority over visual polish. A v2 phase layers ergonomics and UX refinement on a proven foundation.

### What Makes This Special

Built around **progressive disclosure of genuine domain complexity**: the Laureat configuration model — indicators with 6 contextual parameters, JSONLogic rules driving visibility and defaults, bidirectional model-indicator associations with metadata — is inherently non-trivial. Standard CRUD interactions are clean and direct; advanced configuration is one layer down, accessible when needed.

The differentiator is **confidence over speed**. The breakthrough moment is not saving time — it is the first time a complete ActionModel with JSONLogic rules is published end-to-end and works correctly. Users are technical operators who value correctness and completeness. Design philosophy: clean and professional ("good effort/look balance") without over-investing in visual polish. v1 earns trust through completeness; v2 layers on ergonomics.

### Project Classification

- **Type:** Angular 20 SPA — desktop-first, internal-only, no public surface
- **Domain:** General / govtech-adjacent (manages funding program configuration for local government collectivités)
- **Complexity:** Medium — standard CRUD patterns over a non-trivial domain model with entity relationships, status workflows, and rule-based parameters
- **Context:** Greenfield implementation with deep pre-existing domain context (fully operational REST API + complete domain documentation)
- **Development model:** AI-assisted (BMAD-driven); no direct PM code authoring; output reviewed by a senior Angular developer

## Success Criteria

### User Success

The primary success signal is **operational independence**: Alex and Sophie can create, edit, and publish any configuration object without opening Postman or involving a developer.

- Sophie completes a full program configuration — indicators → models → associations → parameters → JSONLogic rules → publish — end-to-end, through the interface alone
- Alex uses the admin as his primary tool to validate platform state; no need to cross-check with raw API responses
- Neither user needs to craft a manual API call for any standard configuration task across the 7 entities
- Complex configuration tasks (previously hours of Postman work) complete in under 30 minutes
- **Zero Postman fallback** for any operation the admin covers

**The "aha!" moment:** The first time the full chain — indicator created, attached to a model, parameters configured, JSONLogic rule written, model published — completes without errors and behaves correctly. Not faster: *correct and repeatable*.

### Business Success

| Horizon | Objective |
|---------|-----------|
| **MVP** | UX pattern validated, API integration confirmed. Alex logs in, creates a Funding Program and Action Theme, walks the status lifecycle — no Postman. |
| **v1** | All 7 configuration entities fully CRUD-able. Team unblocked from daily configuration and development validation during active sprints. |
| **v2** | Polished daily tool the team reaches for first, every time. Ergonomics and UX refinement layered on a proven foundation. |
| **Strategic** | Validates that BMAD-assisted development can deliver production-grade internal tooling at a fraction of traditional cost and timeline. |

### Technical Success

- **No silent failures** — every API error surfaced clearly to the user
- **Cursor-based pagination** reliable and consistent across all list views
- **Full config chain integrity** — the complete path (indicator → model → association → parameter → JSONLogic rule → publish) executes without errors
- **Basic API transparency** — request/response visibility for API calls made through the admin

### Measurable Outcomes

| KPI | Target | Phase |
|-----|--------|-------|
| Entity coverage | All 7 entities fully CRUD-able | v1 launch |
| PM adoption | Alex uses admin as primary config tool, not Postman | First week post-launch |
| Solo configuration | Sophie completes a full program config without dev involvement | First full program sprint |
| Time-to-config | Complex tasks: hours → under 30 minutes | v1 |
| Zero Postman fallback | No standard config task requires Postman | v1 steady state |
| Error surfacing | 100% of API errors visible to user | v1 launch |

## Product Scope & Phased Development

### Development Model & Quality Requirements

**Development approach:** AI-assisted (BMAD-driven) — no direct code authoring by the PM. Code reviewed by a senior Angular developer for quality assessment after MVP and before full v1 commitment.

Non-negotiable quality requirements given this model:
- Clean, idiomatic Angular 20 architecture (standalone components, signals, lazy loading) that passes senior dev review
- Inline documentation throughout — every non-obvious decision explained in code comments
- Consistent patterns across all 7 entity modules so the codebase is predictable and reviewable, not a collection of one-offs

### MVP — Minimum Viable Product

Validate the UX pattern and API integration before tackling complex entities.

- Project scaffolding: Angular 20, TypeScript strict, standalone components, signals
- Design system baseline: layout, typography, colors, reusable components (table, form, dialog, badge, toast)
- Admin layout: sidebar navigation, header with user info + logout
- JWT authentication: email/password login, secure token storage, HTTP interceptor
- Generic cursor-based pagination service (reusable across all entities)
- Full CRUD: **Funding Programs**
- Full CRUD: **Action Themes** — status workflow (draft → published → disabled) + duplication

**MVP gate:** Alex logs in, creates a Funding Program and Action Theme, walks the full status lifecycle — no Postman. UX validated. API integration confirmed.

### v1 — Full Operational Coverage

All 7 entities manageable through the interface. Team fully unblocked.

- **Action Models** — CRUD + Funding Program / Action Theme selectors + Indicator Model association
- **Folder Models** — CRUD + Funding Program association
- **Communities** — CRUD + user assignment/removal
- **Agents** — CRUD + status management
- **Indicator Models** — Full CRUD, type/subtype management, all 6 parameter configurations, multi-line text field for JSONLogic rule input (raw JSON, no editor features), association management with metadata (visibility_rule, required_rule, etc.)
- Basic API request/response inspector on entity detail pages

**v1 gate:** Sophie completes a full program configuration — indicators, models, associations, parameters, rules, publish — without opening Postman.

### v2 — Polish and Ergonomics

- UX refinement and daily-use ergonomics
- Proper JSONLogic editor (Monaco or CodeMirror) with syntax highlighting and JSON validation
- JSONLogic inline validation (syntax errors caught before save)
- Rule-to-prose translation (JSONLogic rendered as human-readable text)
- Deep-link to detail pages (shareable URLs)

### vX — Future Considerations

Out of scope until API support exists or business need arises:

- Multi-user roles / RBAC
- Versioning and history
- Bulk import/export
- Mobile/responsive layout
- Audit logs, multi-language / i18n
- End-user portal (collectivités)
- Dossier and action instances (only models are in scope)

### Risk Mitigation

**API Schema Drift (Primary Risk):** The Laureat API is under active development; endpoints, response shapes, or field names may change between sprints.
- *Mitigation:* API base URL and model types are centralized. The live OpenAPI spec (`/openapi.json`) is the source of truth — always build against the actual API. Changes are contained to typed service and model layers.

**AI Code Quality:** AI-generated code must meet senior Angular developer standards without direct PM code review.
- *Mitigation:* Architecture decisions are explicit and upfront. Inline documentation is a generation requirement. Consistent patterns across entities make the codebase predictable. Senior dev review after MVP provides an early quality signal.

**Indicator Model Complexity:** The indicator parameter configuration (6 parameters, JSONLogic rules, bidirectional associations with metadata) is the most complex UI surface.
- *Mitigation:* Built last (after patterns are established across 6 simpler entities). If interactions prove unexpectedly complex: simplify for v1 (e.g. plain text field for JSONLogic) or defer to v2. Correctness over elegance.

**Solo AI-Assisted Development:** Single point of failure; no dedicated QA or design.
- *Mitigation:* Phased delivery allows course correction. If a phase proves too complex, scope is reduced rather than quality compromised.

## User Journeys

### Journey 1: Sophie — Configuring a New Funding Program (Happy Path)

It's the start of an ACTEE 2026 configuration sprint. Sophie has a week to set up the full program structure from scratch. She opens the Laureat Admin, navigates to Funding Programs, and creates the program in under two minutes — label, technical label, description, saved.

She moves to Indicator Models. She creates them one by one — type, subtype, list values where needed, labels. Each saves cleanly. She publishes them with a single status transition action.

Then the real work: Action Models. She creates the first one, selects the Funding Program and Action Theme. She opens the indicator association panel and attaches her indicators. For each indicator, she expands the parameter panel: required? visible? editable? She sets a JSONLogic rule on `precisez` to only appear when `mode_chauffe` equals "autre". She types the rule directly into the multi-line text field. She saves. She publishes the model.

She steps back — the hierarchy is visible, the relationships are correct. Then she goes to find Alex.

**The moment:** Sophie shows Alex the published ActionModel. He opens it, reads the indicator list, checks the rules. It matches the spec exactly. He doesn't open Postman once. He says: *"ship it."*

**Requirements revealed:** Full CRUD for all 7 entities, indicator-to-model association UI, 6-parameter configuration per indicator, JSONLogic text input, status workflow actions, clear entity relationship visibility.

---

### Journey 2: Sophie — Mid-Sprint Correction (Edge Case)

Two days into the sprint, Sophie realizes the `surface_shab` indicator has the wrong label. She navigates to Indicator Models, finds it. It's published and attached to three models.

She opens the edit form. The label fields are editable — the interface makes clear that label changes propagate everywhere this indicator is used. She updates the user label, saves. No errors.

**The harder scenario:** She tries to change the *type* of a published indicator — the interface blocks her with a clear explanation: *"Type cannot be changed once instances exist."* She understands immediately and knows to create a new indicator instead.

**Requirements revealed:** Label editing with propagation clarity, type-change constraint with informative error message, "used in N models" visibility on indicator detail, error messages that explain *why*, not just *what*.

---

### Journey 3: Alex — Development Validation

Mid-sprint. The dev team has just shipped the Folder Model endpoints. Alex wants to verify the API is returning the right structure. He creates a test object in the admin, opens the detail view, and clicks the API inspector panel. He sees the raw GET response — `funding_programs`, `status`, `technical_label` all there. He spots that `description` is missing from the response. He files a ticket with the exact endpoint and payload. No Postman.

**The moment:** Alex finds a real API discrepancy in 3 minutes and documents it precisely.

**Requirements revealed:** API request/response viewer on entity detail pages (last request URL + response payload), accessible without leaving the admin UI.

---

### Journey 4: Dev Team — Inspect & Diagnose

A developer is debugging why a JSONLogic rule isn't evaluating correctly. She opens the admin, navigates to the Indicator Model, and opens the association detail for the problematic indicator. The rule is displayed in the text field — readable, not buried in a raw API response. She copies it, pastes it into a local test, and confirms the bug is in the evaluation logic, not the stored data. Five minutes, no context switching.

**Requirements revealed:** JSONLogic rule visible and readable in the indicator parameter panel, detail views that show stored values faithfully with no abstraction loss.

---

### Journey Requirements Summary

| Journey | Key Capabilities Required |
|---------|--------------------------|
| Sophie — Happy path | Full 7-entity CRUD, indicator association UI, 6-parameter config, JSONLogic text input, status workflows, entity relationship visibility |
| Sophie — Edge case | Informative constraint errors, propagation clarity on label edits, "used in N models" indicator metadata |
| Alex — Validation | API request/response inspector on detail pages, create/edit/read across all entities |
| Dev — Diagnose | Faithful data display, JSONLogic rule readability, no abstraction loss between stored data and UI |

## Technical Architecture

Angular 20 SPA, desktop-first, internal-only. No public-facing surface, no SEO requirements, no mobile layout. Runs behind JWT authentication on desktop browsers exclusively.

- **Application model:** SPA with lazy-loaded functional modules per entity
- **State management:** Angular signals (native) — no NgRx or external state library
- **HTTP layer:** Angular `HttpClient` with a single JWT interceptor on all requests
- **Routing:** Angular Router with lazy loading per module; route guards for authentication
- **API base URL:** Configurable via `environment.ts` — default: `laureatv2-api-staging.osc-fr1.scalingo.io`
- **No backend:** Frontend-only; all data operations go directly to the Laureat REST API
- **Reusable component library:** Paginated table, CRUD form shell, confirmation dialog, status badge, toast — built once, used across all 7 entities

### Browser Support

| Browser | Support |
|---------|---------|
| Chrome (latest) | ✅ Primary |
| Firefox / Safari / Edge (latest) | ✅ Best effort |
| IE / Legacy | ❌ Not supported |

**Viewport:** Minimum 1280px wide. No responsive/mobile layout for v1.

## Functional Requirements

### Authentication & Session Management

- **FR1:** User can authenticate with email and password to access the admin interface
- **FR2:** User can log out and terminate their session
- **FR3:** System automatically attaches authentication credentials to all outbound API requests
- **FR4:** System redirects unauthenticated users to the login page and preserves their intended destination

### Navigation & Layout

- **FR5:** User can navigate to any of the 7 entity management sections from a persistent sidebar
- **FR6:** User can see their current authentication context (logged-in state) in the application header

### Configuration Entity Management

- **FR7:** User can view a paginated list of any configuration entity (Funding Programs, Action Themes, Action Models, Folder Models, Communities, Agents, Indicator Models)
- **FR8:** User can filter entity lists by available criteria (status, associated program, etc.) where the API supports it
- **FR9:** User can view the complete details of any configuration entity
- **FR10:** User can create a new configuration entity via a structured form
- **FR11:** User can edit an existing configuration entity
- **FR12:** User can delete a configuration entity with an explicit confirmation step

### Status & Lifecycle Management

- **FR13:** User can transition a supported entity through its defined status workflow (e.g. draft → published → disabled/archived)
- **FR14:** User can duplicate an Action Theme
- **FR15:** System prevents invalid status transitions and communicates the reason to the user
- **FR16:** User can view the current status of any entity at a glance in list and detail views

### Entity Relationships & Associations

- **FR17:** User can associate an Action Model with a Funding Program and Action Theme via selection
- **FR18:** User can associate a Folder Model with one or more Funding Programs
- **FR19:** User can assign and remove users from a Community
- **FR20:** User can attach Indicator Models to an Action Model
- **FR21:** User can see which models a given Indicator Model is currently associated with
- **FR22:** User can manage association metadata between an Indicator Model and a model (visibility_rule, required_rule, etc.)

### Indicator Parameter Configuration

- **FR23:** User can configure the 6 behavior parameters for each indicator within a model context: required, visible, editable, default value, constraint, duplicable
- **FR24:** User can input a JSONLogic rule expression for any rule-capable indicator parameter via a multi-line text field
- **FR25:** User can configure the type and subtype of an Indicator Model
- **FR26:** User can manage the list of valid values for list-type indicators
- **FR27:** System prevents type changes on indicators that have existing instances and explains the constraint
- **FR28:** User can view all parameters and rules configured for an indicator within a specific model context

### Feedback & Error Handling

- **FR29:** System displays a clear, human-readable error message for every failed API operation
- **FR30:** System confirms successful create, update, and delete operations with a visible notification
- **FR31:** System surfaces API constraint violations with explanations that identify what failed and why — no silent failures

### Developer Tooling

- **FR32:** User can view the last API request URL and full response payload for any entity on its detail page

## Non-Functional Requirements

### Performance

- No heavy client-side computation; all performance is API-bound
- Paginated list views must feel responsive on a standard office network connection to the staging API
- No specific response time targets for v1; v2 may define targets based on observed bottlenecks
- No offline capability required

### Security

- All communication with the Laureat API occurs over HTTPS
- JWT stored securely client-side; never exposed in URLs or logs
- Credentials (email/password, API base URL) managed via `.env.local` — must not be committed to the repository
- No sensitive citizen or personal data stored or cached client-side — the admin manages configuration objects only
- Session expires on logout; no persistent session across browser restarts required for v1

### Integration

- Admin consumes the Laureat REST API exclusively — no other backends or third-party services
- API base URL configurable via `environment.ts` to support staging/production switching
- Live OpenAPI specification (`/openapi.json`) is the authoritative source of truth for all endpoint contracts and response shapes
- All API errors propagated to the user — no silent failures or swallowed exceptions
- Cursor-based pagination contract (`cursor` + `limit` + `PaginatedResponse<T>`) honored consistently across all entity list views
- Admin builds strictly against current API support; features documented in domain specs but not yet exposed by the API are deferred

### Code Quality

- Angular 20 standalone components exclusively — no NgModule
- TypeScript strict mode throughout
- Angular signals for all reactive state — no NgRx or third-party state libraries
- Consistent architectural patterns across all 7 entity modules (folder structure, service pattern, routing approach) — predictability is a first-class requirement for AI-generated code under senior dev review
- Inline code documentation for all non-obvious logic, architectural decisions, and domain-specific behavior
- Lazy-loaded routing per entity module from day one
