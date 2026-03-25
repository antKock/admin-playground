---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories, step-04-final-validation]
status: 'complete'
completedAt: '2026-03-25'
inputDocuments:
  - temp/sections-feature-plan.md
---

# admin-playground v2.1 - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for admin-playground v2.1, decomposing the requirements from the Sections Feature Plan into implementable stories. v2.1 introduces section management on action models, folder models, and a new entity models feature module.

Epic numbering continues from v2 (Epics 15–17).

## Requirements Inventory

### Functional Requirements

FR1: Section CRUD on action models — create, update, delete sections via API
FR2: Association section toggles (sites/agents/communities) — ON/OFF creates or deletes sections
FR3: Section parameters editing — reuse indicator param UX, visually distinguished
FR4: Indicator management within sections — add/remove indicators scoped per section
FR5: Collapsible sections with indicator count badge when collapsed
FR6: Fixed sections (application, progress) always present on action-model detail
FR7: Section CRUD on folder models — application and progress sections only, no association sections
FR8: Entity models list page — 3 clickable cards (community, agent, site) with indicator count
FR9: Entity model detail page — properties (name, description) + single additional_info section
FR10: Entity model update via `PUT /entity-models/{entity_type}`
FR11: New navbar item "Modèles d'entités" with routing
FR12: Section-card shared component — reusable across all three phases
FR13: Reuse existing indicator-card, indicator-param-editor, build-association-inputs

### Non-Functional Requirements

NFR1: Section params must be visually distinct from indicator params (dotted separator, header placement with ⚙ icon)
NFR2: Rectangle visualization for sections (bordered cards, `bg-gray-50`, `border-l-4` accent)
NFR3: All sections collapsible for page scannability

### Additional Requirements

- Extend existing action-model and folder-model domain stores (no new domain stores for phases 1-2)
- New domain store for entity models only (phase 3)
- Section indicator assignment uses PUT replace-all pattern (same as existing indicator associations)
- Entity model route param is `entityType` (string enum), not UUID
- Declined: instance-level sections (ActionRead/FolderRead), object associations, IndicatorRead context fields — collectivité-facing, not admin scope

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1 | 18 | Section CRUD on action models |
| FR2 | 18 | Association section ON/OFF toggles |
| FR3 | 18 | Section parameters editing |
| FR4 | 18 | Indicator management within sections |
| FR5 | 18 | Collapsible sections with badge |
| FR6 | 18 | Fixed sections always present |
| FR7 | 19 | Section CRUD on folder models |
| FR8 | 20 | Entity models list page (3 cards) |
| FR9 | 20 | Entity model detail page |
| FR10 | 20 | Entity model update |
| FR11 | 20 | New navbar item + routing |
| FR12 | 18 | Shared section-card component |
| FR13 | 18 | Reuse existing indicator components |

## Epic List

### Epic 18: Section Management on Action Models
Admins can organize indicators into sections on action models — toggle association sections (sites/agents/communities) ON/OFF, manage fixed sections (application/progress), configure section parameters, and assign indicators within each section.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR12, FR13
**NFRs covered:** NFR1, NFR2, NFR3

### Epic 19: Section Management on Folder Models
Admins can manage sections (application/progress) on folder models with the same indicator-per-section management as action models.
**FRs covered:** FR7

### Epic 20: Entity Models Management
Admins can view all entity model types (community/agent/site) from a new navbar entry, navigate to each entity model's detail page, edit its properties, and manage its additional_info section with indicators.
**FRs covered:** FR8, FR9, FR10, FR11

---

## Epic 18: Section Management on Action Models

Admins can organize indicators into sections on action models — toggle association sections (sites/agents/communities) ON/OFF, manage fixed sections (application/progress), configure section parameters, and assign indicators within each section. Builds the shared `section-card` component reused by Epics 19 and 20.

### Story 18.1: Section-Card Component & Read-Only Section Display

As an admin,
I want to see indicators organized into sections on the action-model detail page,
So that I can understand how the action model is structured at a glance.

**Acceptance Criteria:**

**Given** the shared `section-card` component is implemented
**When** it is rendered with a section name, type, and indicator list
**Then** it displays a bordered card (bg-gray-50, border-l-4 accent) with a header showing the section name and a collapse/expand toggle
**And** when collapsed, it shows an indicator count badge (e.g. "3 indicateurs")
**And** when expanded, it shows a section params area (⚙ icon, dotted separator) and the list of indicator cards inside

**Given** an action model has sections returned in `ActionModelRead.sections`
**When** the admin views the action-model detail page
**Then** association sections (sites/agents/communities) are displayed under "Sections d'association"
**And** fixed sections (application/progress) are displayed under "Sections"
**And** each section renders its indicators using the existing `indicator-card` component

**References:** Reuses `indicator-card` (no changes). New shared component: `section-card`.

### Story 18.2: Association Section Toggles

As an admin,
I want to toggle association sections (sites, agents, communities) ON or OFF on an action model,
So that I can control which entity types can be associated with actions of this model.

**Acceptance Criteria:**

**Given** the action-model detail page displays the three association sections
**When** an association section is toggled OFF
**Then** the section shows a single collapsed line with "Section désactivée"
**And** a `DELETE /action-models/{id}/sections/{section_id}` request is sent

**Given** an association section is currently OFF
**When** the admin toggles it ON
**Then** a `POST /action-models/{id}/sections` request creates the section with the correct `section_type`
**And** the section expands to show the section params area and empty indicator list

**Given** a toggle operation fails
**When** the API returns an error
**Then** the toggle reverts to its previous state
**And** a toast error message is displayed in French

**References:** Extends action-model domain store with `createSection` / `deleteSection` mutations. Facade exposes `toggleAssociationSection(type)`. New component: `association-section-toggle`.

### Story 18.3: Fixed Sections Display

As an admin,
I want application and progress sections to always be visible on the action-model detail page,
So that I can configure them without needing to create them first.

**Acceptance Criteria:**

**Given** the action model API response includes application and/or progress sections
**When** the admin views the detail page
**Then** those sections render with their existing data (section params + indicators)

**Given** the action model API response does NOT include an application or progress section
**When** the admin views the detail page
**Then** the missing sections are still rendered as empty section cards
**And** each empty section shows "0 indicateurs" when collapsed and an empty indicator list with "[+ Ajouter un indicateur]" when expanded

**Given** a fixed section does not exist in the API yet
**When** the admin first interacts with it (e.g. adds an indicator or edits params)
**Then** the section is created via `POST /action-models/{id}/sections` before the interaction is processed

**References:** Facade computes the full section list by merging API response with the fixed section types.

### Story 18.4: Section Parameters Editing

As an admin,
I want to edit section-level parameters (e.g. min, max, hidden, required),
So that I can configure how each section behaves in the collectivité-facing forms.

**Acceptance Criteria:**

**Given** a section is expanded on the action-model detail page
**When** the admin views the section header area
**Then** section parameters are displayed with a ⚙ icon, separated from indicators by a dotted line
**And** the parameters are visually distinct from indicator-level parameters (header placement vs. inside indicator card)

**Given** the admin modifies a section parameter
**When** the change is saved
**Then** a `PUT /action-models/{id}/sections/{section_id}` request updates the section
**And** a success toast is displayed in French

**Given** the section parameter form matches the `SectionModelUpdate` schema
**When** rendered
**Then** it reuses the same UX pattern as `indicator-param-editor` (same controls, same layout)
**And** it is clearly scoped to the section level, not to any individual indicator

**References:** Reuses `indicator-param-editor` pattern. Facade exposes `updateSection(sectionId, params)`.

### Story 18.5: Indicator Management Within Sections

As an admin,
I want to add and remove indicators within a section,
So that I can define which data points are collected for each section of an action model.

**Acceptance Criteria:**

**Given** a section is expanded and shows its indicator list
**When** the admin clicks "[+ Ajouter un indicateur]"
**Then** an indicator selection flow allows choosing from available indicator models
**And** the selected indicator is added to that section with default parameters

**Given** indicators are assigned within a section
**When** the assignment is saved
**Then** a `PUT /action-models/{id}/sections/{section_id}/indicators` request sends the full indicator list (replace-all pattern)
**And** each indicator includes its association parameters (required, hidden, occurrence_rule, etc.)

**Given** an indicator exists within a section
**When** the admin edits its parameters (required, hidden, min/max, etc.)
**Then** the indicator-level params are displayed inside the `indicator-card` (nested within the section)
**And** changes are saved via the same PUT replace-all endpoint

**Given** an indicator exists within a section
**When** the admin removes it
**Then** the indicator is removed from the section's indicator list
**And** the updated list is sent via PUT replace-all

**References:** Adapts existing `build-association-inputs` utility scoped by `section_id`. Reuses `indicator-card` and `indicator-param-editor`. Facade exposes `updateSectionIndicators(sectionId, indicators)`.

---

## Epic 19: Section Management on Folder Models

Admins can manage sections (application/progress) on folder models with the same indicator-per-section management as action models. No association sections. Reuses all components from Epic 18.

### Story 19.1: Fixed Sections Display on Folder Models

As an admin,
I want to see application and progress sections on the folder-model detail page,
So that I can organize folder-level indicators into sections.

**Acceptance Criteria:**

**Given** the folder-model domain store is extended with section mutations
**When** the admin views a folder-model detail page
**Then** application and progress sections are always displayed using the shared `section-card` component
**And** sections from the `FolderModelRead` response (if present) render with their existing data

**Given** a section does not yet exist in the API response
**When** the admin views the detail page
**Then** the section renders as an empty card with "0 indicateurs" when collapsed
**And** an empty indicator list with "[+ Ajouter un indicateur]" when expanded

**Given** a section is displayed
**When** the admin edits section parameters
**Then** the section is created (POST) if it doesn't exist, or updated (PUT) if it does
**And** section params use the same visual pattern as action-model sections (⚙ icon, dotted separator)

**References:** Extends folder-model domain store with `createSection`, `updateSection`, `deleteSection` mutations. Facade mirrors action-model section patterns. Reuses `section-card` from Epic 18.

### Story 19.2: Indicator Management Within Folder Model Sections

As an admin,
I want to add, edit, and remove indicators within folder-model sections,
So that I can define which data points are collected for each section of a folder model.

**Acceptance Criteria:**

**Given** a folder-model section is expanded
**When** the admin clicks "[+ Ajouter un indicateur]"
**Then** an indicator selection flow allows choosing from available indicator models
**And** the selected indicator is added to that section with default parameters

**Given** indicators are assigned within a folder-model section
**When** the assignment is saved
**Then** a `PUT /folder-models/{id}/sections/{section_id}/indicators` request sends the full indicator list (replace-all pattern)

**Given** an indicator exists within a folder-model section
**When** the admin edits its parameters or removes it
**Then** changes are saved via the same PUT replace-all endpoint
**And** the `indicator-card` and `indicator-param-editor` components behave identically to action-model sections

**References:** Adapts `build-association-inputs` scoped by section for folder models. Reuses `indicator-card`, `indicator-param-editor` from Epic 18.

---

## Epic 20: Entity Models Management

Admins can view all entity model types (community/agent/site) from a new navbar entry, navigate to each entity model's detail page, edit its properties, and manage its additional_info section with indicators. New feature module with card-based list page.

### Story 20.1: Entity Models Domain, Routing & Navbar

As an admin,
I want a "Modèles d'entités" entry in the navigation bar,
So that I can access entity model configuration from anywhere in the app.

**Acceptance Criteria:**

**Given** the entity-model domain store is created
**When** the app loads
**Then** it provides a list loader (`GET /entity-models/`) and a select-by-type method
**And** an update mutation (`PUT /entity-models/{entity_type}`)

**Given** the navbar is rendered
**When** the admin views the sidebar
**Then** a "Modèles d'entités" item is visible
**And** clicking it navigates to `/entity-models`

**Given** the entity-models feature module is configured
**When** the admin navigates to `/entity-models`
**Then** the route resolves to the entity-model list component
**And** `/entity-models/:entityType` resolves to the entity-model detail component

**References:** New domain store: `entity-model.store`. New feature store with read-only computed projections. Route param is `entityType` (string enum: `community`, `agent`, `site`), not UUID.

### Story 20.2: Entity Models List Page

As an admin,
I want to see all three entity model types displayed as cards on a single page,
So that I can quickly identify and navigate to the entity model I want to configure.

**Acceptance Criteria:**

**Given** the admin navigates to `/entity-models`
**When** the entity models are loaded from `GET /entity-models/`
**Then** three clickable cards are displayed in a grid layout
**And** each card shows the entity type icon, French label (Communautés, Agents, Sites), and indicator count from its additional_info section

**Given** the entity models list page is displayed
**When** the admin clicks on a card
**Then** they are navigated to `/entity-models/{entityType}` (e.g. `/entity-models/community`)

**Given** the entity models are loading
**When** the API call is in progress
**Then** a loading state is displayed
**And** the `hasLoaded` signal guard prevents showing an empty state prematurely

**References:** No table component — uses a simple card grid. Each card reads from the entity model list in the feature store.

### Story 20.3: Entity Model Detail Page

As an admin,
I want to view and edit an entity model's properties and manage its additional_info section,
So that I can configure what additional information is collected for communities, agents, or sites.

**Acceptance Criteria:**

**Given** the admin navigates to `/entity-models/:entityType`
**When** the entity model is loaded via `GET /entity-models/{entity_type}`
**Then** the page displays a back button ("← Retour"), the entity type name in the header, properties (name, description), and metadata

**Given** the admin edits the entity model name or description
**When** the changes are saved
**Then** a `PUT /entity-models/{entity_type}` request updates the entity model
**And** a success toast is displayed in French

**Given** the entity model detail page is displayed
**When** the additional_info section is rendered
**Then** it uses the shared `section-card` component from Epic 18
**And** section parameters are editable with the same ⚙ icon / dotted separator pattern

**Given** the additional_info section is displayed
**When** the admin adds, edits, or removes indicators
**Then** indicator management works identically to action-model sections (PUT replace-all pattern)
**And** `indicator-card` and `indicator-param-editor` are reused

**Given** the admin navigates away from the detail page
**When** `ngOnDestroy` fires
**Then** `facade.clearSelection()` is called

**References:** Reuses `section-card`, `indicator-card`, `indicator-param-editor` from Epic 18. Implements `HasUnsavedChanges` for unsaved changes guard if properties form is dirty.
