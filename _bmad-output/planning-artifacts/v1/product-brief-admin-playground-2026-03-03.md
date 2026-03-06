---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments:
  - docs/BRIEF_CLAUDE_PROJET_ADMIN_LAUREAT.md
  - docs/indicateurs.md
  - docs/modeles.md
  - docs/modeles-avec-indicateurs.md
  - docs/parametres-indicateur.md
  - docs/regles-avancees.md
date: 2026-03-03
author: Anthony
---

# Product Brief: admin-playground

<!-- Content will be appended sequentially through collaborative workflow steps -->

## Executive Summary

The Laureat Admin Interface is an internal backoffice that unblocks the daily configuration work of the Laureat platform team. Today, three tech-savvy operators manage a sophisticated no-code configuration system — indicators, models, rules, programs — exclusively through raw API calls and Postman. This is a critical bottleneck: the platform can barely function during active development without a purpose-built interface.

The v1 goal is laser-focused on operational unblocking: full CRUD access to all configuration objects through a functional, efficient Angular 20 interface. Speed of delivery and completeness of coverage matter more than visual polish. A v2 phase will refine the experience into a polished daily tool once the core is in place.

---

## Core Vision

### Problem Statement

The Laureat platform has a powerful, fully operational REST API for managing funding program configuration — but no interface to use it. The three internal operators who configure the platform daily (indicators, models, rules, associations) are forced to craft raw API calls or use Postman for every single operation. During active development, this is a daily blocker.

### Problem Impact

- Configuration work that should take minutes takes much longer due to manual API crafting
- Error-prone: no validation layer, no relationship visibility, no workflow guidance
- Creates a hard dependency on developer availability for what should be operator-level tasks
- Actively slows down platform development velocity — the team can't properly test and configure without this tool

### Why Existing Solutions Fall Short

There is no existing solution. The API was built correctly and completely — the gap is purely the human-facing layer. Generic API clients (Postman, Insomnia) don't understand the domain model, can't enforce relationships (e.g. an ActionModel requires a FundingProgram + ActionTheme), and offer no workflow for status transitions or JSONLogic rule editing.

### Proposed Solution

A focused Angular 20 admin interface — internal-only, desktop-first — providing full CRUD access to all 7 configuration entities. The interface is designed for tech-savvy operators who value speed and directness: structured forms, clear relationships, status workflow actions, and an integrated JSONLogic editor. V1 priority is functional completeness. V2 will layer on polish and daily-use ergonomics.

### Key Differentiators

- **Built for the domain**: understands the model → indicator → parameter → rule hierarchy natively
- **Built for its users**: three technical operators who want efficiency, not hand-holding — no unnecessary UX padding
- **Pragmatic scope**: built strictly on what the API supports today, no speculative features
- **Stepping stone architecture**: clean Angular 20 + signals foundation that makes a v2 polish low-effort

---

## Target Users

### Primary Users

**Persona 1 — Alex, the Product Manager**

Alex is the product owner of the Laureat platform. He has a strong technical understanding of how the system works — models, indicators, rules, programs — but doesn't write code. He needs to configure and validate platform objects to move development forward, test new program structures, and ensure the platform behaves correctly before it reaches end users (the collectivités).

- **Goal**: Be unblocked. Create, inspect, and update configuration objects without waiting for a developer.
- **Current pain**: Opens Postman, crafts API payloads manually, fights with JSON syntax, loses track of which objects exist and how they relate.
- **Values**: Speed, directness, clear feedback. Doesn't need a pretty interface — needs a *correct* and *complete* one.
- **Usage pattern**: Daily during development. 1-week intensive sprints during program configuration. ~10 min/day for maintenance.

---

**Persona 2 — Sophie, the Business Analyst**

Sophie is the platform configurator. She owns the program configuration end-to-end: creating indicator models, assembling action models, defining JSONLogic rules, tuning indicator parameters. She's the most intensive user of the admin — if anyone's going to hit edge cases, it's her.

- **Goal**: Configure a full program from scratch without developer involvement. Manage the model → indicator → parameter → rule chain fluently.
- **Current pain**: The most in pain. She understands the domain deeply but is forced to work through raw API calls, making configuration slow and error-prone. A mistake in a JSONLogic rule has no immediate feedback.
- **Values**: Completeness and accuracy. Needs to see relationships clearly (which indicators are attached to which models, what rules are active). Will use every feature of the interface.
- **Usage pattern**: Power user. Leads the 1-week intensive configuration sprints. Daily check-ins during maintenance.

---

### Secondary Users

**Persona 3 — Dev Team (read-mostly)**

Developers occasionally use the admin to inspect the current state of configuration objects, cross-reference API responses, and verify that what's stored matches expectations. They don't manage configuration — they troubleshoot.

- **Goal**: Quickly look up an object (indicator, model, rule) to understand its current state.
- **Values**: Data fidelity. They want to see what the API actually returns, without abstraction.
- **Usage pattern**: Occasional, ad hoc. Not a primary design driver but a valid use case.

---

### User Journey

**Sophie — Configuring a New Funding Program (core journey)**

1. **Setup**: A new funding program (e.g. ACTEE 2026) needs to be configured. Sophie starts by creating the FundingProgram object.
2. **Indicators first**: She creates the reusable IndicatorModels for this program — types, subtypes, labels, list values.
3. **Build the models**: She creates ActionModels and FolderModels, attaches them to the program, and associates the right indicators.
4. **Parameters & rules**: For each indicator in each model, she configures the 6 parameters (required, visible, editable, default, constraint, duplicable) and writes JSONLogic rules where needed.
5. **Publish**: She transitions objects from draft → published through the workflow actions.
6. **Validate**: Alex cross-checks the configuration, confirms it looks right, and gives the green light.

**"Aha!" moment**: Sophie creates a full ActionModel with indicator associations and publishes it — in 15 minutes — where it previously took an hour of Postman work.

---

## Success Metrics

### User Success

The primary success signal for v1 is **operational independence**: Alex and Sophie can create, edit, and publish any configuration object without opening Postman or involving a developer.

**Key user success markers:**

- Sophie can configure a complete funding program (indicators → models → associations → rules → publish) end-to-end through the interface alone
- Alex, as PM, uses the admin to validate platform state and feels confident in what he sees — no need to cross-check with raw API responses
- Neither user needs to craft a manual API call for any standard configuration task covered by the 7 entities

**The "aha!" moment**: First time Sophie publishes a fully configured ActionModel with JSONLogic rules — in minutes, with immediate feedback — where it previously took hours with no confidence it was correct.

### Business Objectives

| Horizon | Objective |
|---------|-----------|
| **v1** | Replace Postman as the primary configuration tool. All 7 entities manageable through the UI. |
| **v1** | Unblock daily development: team can configure and test platform state without developer involvement. |
| **v2** | Become the polished daily tool the team reaches for first, every time. |
| **Strategic** | Prove that an AI-assisted (BMAD-driven) development workflow can deliver a production-quality internal tool — validating the approach for future projects without full dev team investment. |

### Key Performance Indicators

| KPI | Target | Timeframe |
|-----|--------|-----------|
| **Coverage** | All 7 configuration entities fully CRUD-able | v1 launch |
| **PM adoption** | Alex uses admin as primary config tool, not Postman | First week after launch |
| **Solo configuration** | Sophie completes a full program config without dev help | First full program config |
| **Time-to-config** | Complex config tasks (hours today) → sub-30 minutes | v1 |
| **Zero Postman fallback** | No standard config task requires Postman | v1 steady state |

### Future Success Criteria (v2+)

- **JSONLogic validation**: Inline feedback on rule correctness — syntax errors caught before save
- **Rule-to-prose translation**: JSONLogic rendered as human-readable text (e.g. `{"==": [{"var": "mode_chauffe"}, "autre"]}` → *"If mode_chauffe equals 'autre'"*) — critical for Sophie to validate complex rule chains without reading raw JSON
- **BMAD proof point**: This project serves as a reference case that AI-assisted product development (BMAD workflow) can deliver production-grade internal tooling at a fraction of traditional dev cost and timeline

---

## MVP Scope

### Core Features (MVP — Phases 1 & 2)

The MVP goal is to **validate the UX pattern and API integration** before tackling the more complex entities. It delivers immediate value by unblocking the two most common lightweight config tasks.

**Phase 1 — Foundations + Funding Programs:**
- Project scaffolding: Angular 20, TypeScript strict, standalone components, signals
- Design system baseline: layout, typography, colors, reusable components (table, form, dialog, badge, toast)
- Admin layout: sidebar navigation, header with user info + logout
- JWT authentication: email/password login form, token stored securely, HTTP interceptor
- Cursor-based pagination service (generic, reusable across all entities)
- Full CRUD for **Funding Programs** (list, detail, create, edit, delete with confirmation)

**Phase 2 — Action Themes:**
- Full CRUD for **Action Themes**
- Status workflow: draft → published → disabled (via dedicated endpoints)
- Duplication feature
- Status badges

**MVP success gate**: Alex can log in, create a Funding Program, create an Action Theme, and walk through the full status lifecycle — without touching Postman. UX validated, API integration confirmed.

---

### Full v1 Scope (Phases 3 & 4)

**Phase 3 — Action Models, Folder Models, Communities, Agents:**
- **Action Models**: CRUD + dropdown selectors (Funding Program, Action Theme) + Indicator Model association
- **Folder Models**: CRUD + Funding Program association
- **Communities**: CRUD + user assignment/removal
- **Agents**: CRUD + status management

**Phase 4 — Indicator Models + Rules (the beast):**
- **Indicator Models**: Full CRUD, type/subtype management, status workflow, all 6 parameter configurations
- Integrated JSONLogic editor (Monaco or CodeMirror) with JSON syntax validation
- Association management: indicator ↔ model with metadata (visibility_rule, required_rule, etc.)

**v1 success gate**: Sophie completes a full program configuration — indicators, models, associations, rules, publish — without opening Postman.

---

### Out of Scope for v1

Per the original brief, explicitly excluded:
- End-user portal (collectivités)
- Dossier and action instances (only models are in scope)
- Convention generation
- Expense management
- Versioning/history (endpoints exist, deferred)
- Multi-user roles / RBAC (single user login for v1)
- Bulk import/export (no API support today)
- Audit logs
- Multi-language / i18n
- Mobile/responsive layout (desktop-first, internal tool)

---

### Potential Low-Hanging Fruit (not committed, worth considering)

- **Copy-to-clipboard on technical labels** — one-click copy of `snake_case` labels, useful when cross-referencing in JSONLogic rules
- **JSONLogic rule-to-prose preview** — show a read-only human-readable summary of a rule (e.g. *"If mode_chauffe equals 'autre'"*) — low cost, high value for Sophie validating rules
- **Deep-link to detail pages** — shareable URLs for any object detail, useful for dev team cross-referencing
- **API contract validation** — on app startup or on demand, fetch the live OpenAPI spec (`https://laureatv2-api-staging.osc-fr1.scalingo.io/openapi.json`) and compare against the expected schema — surface warnings if endpoints or response shapes have changed, preventing silent failures during active API development

---

### Technical Constraints

| Constraint | Value |
|-----------|-------|
| Framework | Angular 20, standalone components, signals |
| Language | TypeScript strict mode |
| Bundler | Parcel (personal hosting) |
| Hosting | Personal domain (public GitHub repo — no sensitive data) |
| Auth | Single user, email/password, JWT — credentials via `.env.local` |
| API | `laureatv2-api-staging.osc-fr1.scalingo.io` — configurable via `environment.ts` |
| API Reference | Live OpenAPI spec: `https://laureatv2-api-staging.osc-fr1.scalingo.io/openapi.json` (always up to date) |
| Migration path | Company GitHub + redeploy if v1 succeeds |
