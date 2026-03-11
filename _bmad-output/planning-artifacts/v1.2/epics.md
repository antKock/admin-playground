---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - _bmad-output/planning-artifacts/v1.2/api-review-2026-03-11.md
  - _bmad-output/planning-artifacts/v1.1/epics.md
---

# admin-playground v1.2 — Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for admin-playground v1.2, decomposing the requirements from the API Spec Review (2026-03-11) and product decisions made in party mode into implementable stories. v1.2 focuses on leveraging newly available API capabilities, enriching existing features, and adding two new domain features (Users Management and History/Activity).

Epic numbering continues from v1.1 (Epic 7: Prose Editor).

## Requirements Inventory

### Functional Requirements

FR1: Display total_count ("Showing X of Y") in all DataTable footers
FR2: Replace indicator-model usage client-side hack (100-item ceiling) with server-side `?action_model_id=` filter
FR3: Add IndicatorModelType filter dropdown to indicator-models list
FR4: Add `active_only` filter toggle to funding-programs list
FR5: Enrich FundingProgram form with `budget`, `start_date`, `end_date`, `is_active`, `folder_model_id` fields
FR6: Enrich FundingProgram detail view with all new fields in MetadataGrid
FR7: Add `funding_program_ids` multi-select to FolderModel form
FR8: Display linked funding programs on FolderModel detail
FR9: Display parent and children community lists on Community detail (clickable links)
FR10: Display parent count and children count columns on Community list table
FR11: Support indicator group type: visual distinction in list, children section in detail, children picker in form (no params), `children_ids` on create/update
FR12: Users management: full CRUD (list, detail, create, edit, delete) with role assignment via `/admin/roles/`
FR13: Users management: community assignment panel on user detail (mirror of CommunityUsersComponent, using community endpoints)
FR14: History/Activity tab on entity detail views showing timestamped activities with user_name, action, changes_summary
FR15: FundingProgram ↔ FolderModel bidirectional navigation on detail pages
FR16: Global activity feed in shell (notification bell or activity panel)

### Non-Functional Requirements

NFR1: Follow existing ACTEE pattern (domain store, feature facade, API service) for all new features
NFR2: Reuse existing shared components (DataTable, MetadataGrid, StatusBadge, ConfirmDialog) — no new paradigms
NFR3: Generated OpenAPI types are already current — domain models re-export from generated types
NFR4: All new filters use existing filter infrastructure (activeFilters signal → facade.load(filters) → API query params)

### Additional Requirements

- Indicator group children picker reuses association UX pattern (attach/detach) without parameters
- User-community assignment uses community endpoints (`POST/DELETE /communities/{id}/users/{user_id}`), not user endpoints
- `UserUpdate` does NOT accept `community_ids` — relationship managed via community endpoints only
- Role assignment uses dedicated `/admin/roles/user/{user_id}` endpoint (GET to read, PUT to set)
- History API uses `/history/{entity_type}/{entity_id}/activities` — shared component pattern across all entity detail views
- FolderModel uses `funding_program_ids[]` (plural) on create/update, `funding_programs[]` (full objects) on read
- FundingProgram ↔ FolderModel bidirectional: `folder_model_id` on FP, `funding_program_ids` on FM
- Phase 4 items not included: community hierarchy management and version comparison remain future scope

### FR Coverage Map

FR1:  Epic 8  — total_count display in DataTable footers
FR2:  Epic 8  — replace indicator usage hack with server-side filter
FR3:  Epic 8  — indicator-model type filter
FR4:  Epic 8  — funding-program active_only filter
FR5:  Epic 9  — FundingProgram form enrichment (budget, dates, is_active, folder_model_id)
FR6:  Epic 9  — FundingProgram detail enrichment
FR7:  Epic 9  — FolderModel form funding_program_ids multi-select
FR8:  Epic 9  — FolderModel detail linked funding programs
FR9:  Epic 10 — Community detail parents/children display
FR10: ~~Epic 10~~ — DEFERRED (API lacks count fields on CommunityRead)
FR11: Epic 10 — Indicator group type support
FR12: Epic 11 — Users CRUD + role assignment
FR13: Epic 11 — Users community assignment panel
FR14: Epic 11 — History/Activity tab on detail views
FR15: Epic 9 — FundingProgram ↔ FolderModel bidirectional navigation (merged into Stories 9.2 + 9.4)
FR16: Epic 12 — Global activity feed

## Epic List

> **Adjustments (2026-03-11 party-mode review):**
> - Story 10.2 deferred (API lacks count fields on CommunityRead)
> - Story 12.1 merged into Stories 9.2 + 9.4 (same detail components already being modified)
> - Epic 9 absorbs FR15 (bidirectional navigation), Epic 12 reduced to 1 story

### Epic 8: List & Filter Enhancements
Admins get better visibility across all entity lists — total counts in every table footer, plus targeted filters on indicator models (by type) and funding programs (by active status). Also fixes the indicator usage ceiling bug.
**FRs covered:** FR1, FR2, FR3, FR4
**Estimate:** ~4 points | 1 sprint

### Epic 9: Funding Programs & Folder Models Enrichment
Admins can manage the full financial and programmatic data — budgets, dates, active status on funding programs; multi-program associations on folder models. Includes bidirectional navigation links between FP and FM detail pages (absorbed from former Story 12.1).
**FRs covered:** FR5, FR6, FR7, FR8, FR15
**Estimate:** ~5 points | 1 sprint

### Epic 10: Communities & Indicator Models Enrichment
Admins see community hierarchy (parents/children) in detail views, and can manage grouped indicators with the new "group" type and its children picker.
**FRs covered:** FR9, FR11 (FR10 deferred — API lacks count fields on CommunityRead)
**Estimate:** ~3 points | 1 sprint
**Stories:** 10.1, 10.3, 10.4 (Story 10.2 deferred)

### Epic 11: Users Management & Activity History
Admins can manage users (create, edit, deactivate, assign roles and communities) and see activity history on any entity detail page — who changed what, when.
**FRs covered:** FR12, FR13, FR14
**Estimate:** ~12 points | 2 sprints

### Epic 12: Global Activity Feed
Admins can access a global activity feed from the shell to monitor recent changes across all entities.
**FRs covered:** FR16 (FR15 moved to Epic 9)
**Estimate:** ~3 points | 1 sprint
**Stories:** 12.2 only (Story 12.1 merged into 9.2 + 9.4)

---

## Epic 8: List & Filter Enhancements

Admins get better visibility across all entity lists — total counts in every table footer, plus targeted filters on indicator models (by type) and funding programs (by active status). Also fixes the indicator usage ceiling bug.

### Story 8.1: Total Count Display in DataTable Footer

As an admin,
I want to see "Showing X of Y" in every table footer,
So that I know how many total records exist and how many are currently loaded.

**Acceptance Criteria:**

**Given** any entity list page (action-models, action-themes, indicator-models, funding-programs, folder-models, communities, agents)
**When** the data loads successfully
**Then** the table footer displays "Showing {loaded_count} of {total_count}" using `PaginationMeta.total_count`
**And** the count updates when more items are loaded via "Load More"

**Given** `total_count` is `null` (API returns null)
**When** the table renders
**Then** the footer displays only "Showing {loaded_count}" without "of Y"

---

### Story 8.2: Server-Side Indicator Usage Lookup

As an admin,
I want the indicator-model detail page to accurately show which action models reference this indicator,
So that I get complete usage data without artificial limits.

**Acceptance Criteria:**

**Given** an indicator-model detail page
**When** the usage section loads
**Then** it fetches action models using the best available API approach (paginated `GET /action-models/` with increased limit, or dedicated endpoint if available)
**And** the previous 100-item ceiling workaround is replaced with a scalable approach
**And** each action model in the usage list links to its detail page

**Given** no action models reference this indicator
**When** the usage section loads
**Then** it displays "No action models use this indicator"

---

### Story 8.3: Indicator Model Type Filter

As an admin,
I want to filter the indicator-models list by type (text, number, group),
So that I can quickly find indicators of a specific type.

**Acceptance Criteria:**

**Given** the indicator-models list page
**When** the page loads
**Then** a "Type" filter dropdown is available with options matching `IndicatorModelType` enum values

**Given** the admin selects a type filter value
**When** the filter is applied
**Then** the list reloads with `?type={selected_type}` query parameter
**And** only indicators of the selected type are displayed
**And** the active filter is visually indicated

**Given** the admin clears the type filter
**When** the filter is removed
**Then** the list reloads showing all indicator types

---

### Story 8.4: Funding Program Active Filter

As an admin,
I want to filter the funding-programs list to show only active programs,
So that I can focus on current programs without scrolling past inactive ones.

**Acceptance Criteria:**

**Given** the funding-programs list page
**When** the page loads
**Then** an "Active only" filter toggle or dropdown is available

**Given** the admin enables the "Active only" filter
**When** the filter is applied
**Then** the list reloads with `?active_only=true` query parameter
**And** only funding programs with `is_active=true` are displayed

**Given** the admin disables the "Active only" filter
**When** the filter is removed
**Then** the list reloads showing all funding programs (active and inactive)

---

## Epic 9: Funding Programs & Folder Models Enrichment

Admins can manage the full financial and programmatic data — budgets, dates, active status on funding programs; multi-program associations on folder models.

### Story 9.1: FundingProgram Form Enrichment

As an admin,
I want to set budget, start/end dates, active status, and linked folder model when creating or editing a funding program,
So that I can capture the full financial and programmatic context.

**Acceptance Criteria:**

**Given** the funding-program create or edit form
**When** the form renders
**Then** it includes the following fields in addition to existing ones:
- `budget` — number input (optional, min 0)
- `start_date` — date picker (optional)
- `end_date` — date picker (optional)
- `is_active` — toggle switch (defaults to true on create)
- `folder_model_id` — dropdown selector populated from `GET /folder-models/` (optional)

**Given** the admin fills in the enriched fields and submits
**When** the form is valid
**Then** all fields are sent in the `POST` or `PUT` payload
**And** the admin is navigated to the detail page on success

**Given** the admin edits an existing funding program
**When** the form loads
**Then** all enriched fields are pre-populated with current values

---

### Story 9.2: FundingProgram Detail Enrichment

As an admin,
I want to see budget, dates, active status, and linked folder model on the funding-program detail page,
So that I can review the complete program information at a glance.

**Acceptance Criteria:**

**Given** a funding-program detail page
**When** the page loads
**Then** the MetadataGrid displays:
- `budget` formatted as currency (or "—" if null)
- `start_date` and `end_date` formatted with `formatDateFr()` (or "—" if null)
- `is_active` as a status badge (active/inactive)
- `folder_model_id` as a clickable link to the folder-model detail page (or "—" if null)

**Given** the funding program has `is_active = false`
**When** the detail page renders
**Then** the active status badge clearly indicates inactive state

---

### Story 9.3: FolderModel Form with Funding Programs

As an admin,
I want to associate multiple funding programs to a folder model when creating or editing,
So that I can define which programs fund this folder type.

**Acceptance Criteria:**

**Given** the folder-model create or edit form
**When** the form renders
**Then** it includes a `funding_program_ids` multi-select picker populated from `GET /funding-programs/`

**Given** the admin selects one or more funding programs
**When** the form is submitted
**Then** the `funding_program_ids` array is sent in the payload
**And** the folder model is created/updated with the associations

**Given** the admin edits an existing folder model with associated funding programs
**When** the form loads
**Then** the multi-select is pre-populated with the current `funding_programs[]` from the read model

**Given** the admin removes all funding program selections
**When** the form is submitted
**Then** the `funding_program_ids` is sent as an empty array

---

### Story 9.4: FolderModel Detail with Linked Funding Programs

As an admin,
I want to see which funding programs are associated with a folder model on its detail page,
So that I can understand the programmatic relationships.

**Acceptance Criteria:**

**Given** a folder-model detail page with associated funding programs
**When** the page loads
**Then** a "Funding Programs" section displays the list of associated programs
**And** each program name is a clickable link to its detail page

**Given** a folder-model with no associated funding programs
**When** the detail page loads
**Then** the "Funding Programs" section displays an empty state message

---

## Epic 10: Communities & Indicator Models Enrichment

Admins see community hierarchy (parents/children) in detail views, and can manage grouped indicators with the new "group" type and its children picker.

### Story 10.1: Community Detail — Parents & Children Display

As an admin,
I want to see a community's parent and child communities on its detail page,
So that I can understand the organizational hierarchy.

**Acceptance Criteria:**

**Given** a community detail page
**When** the page loads
**Then** a "Parents" section is displayed, populated from `GET /communities/{id}/parents`
**And** a "Children" section is displayed, populated from `GET /communities/{id}/children`
**And** each community name is a clickable link to its detail page

**Given** a community with no parents
**When** the detail page loads
**Then** the "Parents" section displays an empty state message

**Given** a community with no children
**When** the detail page loads
**Then** the "Children" section displays an empty state message

---

### ~~Story 10.2: Community List — Parent & Children Count Columns~~ — DEFERRED

> **Deferred (2026-03-11 party-mode review):** `CommunityRead` has no `parents_count` or `children_count` fields. Loading counts per row requires N*2 API calls (prohibitively expensive). Showing "—" provides zero user value. Deferred until the API adds count fields to the list response.

---

### Story 10.3: Indicator Group Type — List & Detail

As an admin,
I want to visually distinguish group-type indicators in the list and see their children on the detail page,
So that I can understand the indicator hierarchy at the model level.

**Acceptance Criteria:**

**Given** the indicator-models list page
**When** the table renders
**Then** group-type indicators are visually distinguished (icon, badge, or type column)
**And** a child count is shown for group indicators (e.g., "3 children")

**Given** a group-type indicator-model detail page
**When** the page loads
**Then** a "Children" section displays the list of child indicators from `IndicatorModelRead.children[]`
**And** each child indicator name is a clickable link to its detail page
**And** the `unit` field is not shown (groups have no unit)

**Given** a non-group indicator-model detail page
**When** the page loads
**Then** no "Children" section is displayed

---

### Story 10.4: Indicator Group Type — Form with Children Picker

As an admin,
I want to assign child indicators to a group-type indicator when creating or editing,
So that I can organize related indicators into logical groups.

**Acceptance Criteria:**

**Given** the indicator-model create or edit form
**When** the admin selects type "group"
**Then** the `unit` field is hidden
**And** a "Children" picker section appears, reusing the attach/detach association UX pattern (same as action-model indicator attachment, but without parameters)

**Given** the children picker is displayed
**When** the admin searches for indicators to attach
**Then** only indicators of type `text` or `number` are shown (groups are excluded from the picker)

**Given** the admin attaches child indicators
**When** the form is submitted
**Then** the `children_ids` array is sent in the `POST` or `PUT` payload

**Given** the admin edits an existing group indicator
**When** the form loads
**Then** the children picker is pre-populated with current children from `IndicatorModelRead.children[]`

**Given** the admin changes the type from "group" to "text" or "number"
**When** the type changes
**Then** the children picker is hidden and `children_ids` is cleared

---

## Epic 11: Users Management & Activity History

Admins can manage users (create, edit, deactivate, assign roles and communities) and see activity history on any entity detail page — who changed what, when.

### Story 11.1: Users Domain & List Page

As an admin,
I want to see a list of all users with their key information,
So that I can find and manage user accounts.

**Acceptance Criteria:**

**Given** the admin navigates to the Users section
**When** the page loads
**Then** a table displays users from `GET /users/` with columns:
- Display name (first_name + last_name, sortable)
- Email (sortable)
- Role (sortable, mapped label)
- Active status (status badge)
- Community count (number of associated communities)
- Updated date (sortable, formatted with `formatDateFr()`)

**Given** the users list has more than one page
**When** the admin scrolls or clicks "Load More"
**Then** additional users are loaded via cursor pagination

**Technical notes:**
- New domain module: `domains/users/` (user.api.ts, user.store.ts, user.models.ts)
- New feature module: `features/users/` (user.facade.ts, user.store.ts, ui components)
- Models re-export from generated OpenAPI types (`UserRead`, `UserCreate`, `UserUpdate`)
- Follow ACTEE pattern identical to existing domains
- Add route and navigation entry in shell

---

### Story 11.2: User Detail Page

As an admin,
I want to see the full details of a user account,
So that I can review their information, role, and community memberships.

**Acceptance Criteria:**

**Given** the admin clicks a user in the list (or navigates to `/users/{id}`)
**When** the detail page loads
**Then** it displays user information via MetadataGrid:
- Email
- First name, Last name
- Role (from `UserRead.role`)
- Active status (status badge)
- Created date, Updated date (formatted with `formatDateFr()`)

**And** a "Communities" section shows the user's `communities[]` list
**And** each community name is a clickable link to its detail page

**Given** the admin clicks "Edit"
**When** the edit form loads
**Then** the form is pre-populated with current user data (Story 11.3)

**Given** the admin clicks "Delete"
**When** the confirmation dialog is accepted
**Then** `DELETE /users/{id}` is called
**And** the admin is navigated back to the users list

---

### Story 11.3: User Create & Edit Form

As an admin,
I want to create new users and edit existing ones,
So that I can manage user accounts in the system.

**Acceptance Criteria:**

**Given** the admin clicks "Add" on the users list page
**When** the create form renders
**Then** it shows fields:
- `email` (required, email validation)
- `first_name` (required)
- `last_name` (required)
- `password` (required on create only)
- `is_active` (toggle, defaults to true)
- `role` (dropdown populated from `GET /admin/roles/`)

**Given** the admin submits a valid create form
**When** the request succeeds
**Then** `POST /users/` is called with the form data
**And** the admin is navigated to the new user's detail page

**Given** the admin edits an existing user
**When** the edit form renders
**Then** all fields are pre-populated with current values
**And** the `password` field is not shown (cannot change password via edit)

**Given** the admin submits a valid edit form
**When** the request succeeds
**Then** `PUT /users/{id}` is called
**And** role is updated separately via `PUT /admin/roles/user/{user_id}` if changed
**And** the admin is navigated back to the detail page

---

### Story 11.4: User Community Assignment

As an admin,
I want to manage which communities a user belongs to from the user detail page,
So that I can control user access from either the user or community perspective.

**Acceptance Criteria:**

**Given** a user detail page
**When** the "Communities" section renders
**Then** it shows the user's current communities from `UserRead.communities[]`
**And** a community picker/search is available to add new assignments

**Given** the admin selects a community from the picker
**When** the assignment is confirmed
**Then** `POST /communities/{community_id}/users/{user_id}` is called
**And** the communities list refreshes to show the new assignment

**Given** the admin clicks remove on an assigned community
**When** the confirmation dialog is accepted
**Then** `DELETE /communities/{community_id}/users/{user_id}` is called
**And** the community is removed from the list

**Given** the admin searches in the community picker
**When** typing a search term
**Then** communities are filtered by name
**And** already-assigned communities are greyed out or excluded

---

### Story 11.5: Activity History Tab on Entity Detail Views

As an admin,
I want to see a history of changes on any entity's detail page,
So that I can understand who changed what and when.

**Acceptance Criteria:**

**Given** any entity detail page (action-model, action-theme, indicator-model, funding-program, folder-model, community, agent, user)
**When** the page loads
**Then** an "Activity" section or tab is available

**Given** the admin views the Activity section
**When** it loads
**Then** it calls `GET /history/{entity_type}/{entity_id}/activities`
**And** displays a chronological list of activities, each showing:
- Timestamp (formatted with `formatDateFr()`)
- User name (`ActivityResponse.user_name`)
- Action type (create, update, delete)
- Changes summary (`ActivityResponse.changes_summary`)

**Given** an entity with no activity history
**When** the Activity section loads
**Then** it displays an empty state message

**Given** an entity with many activities
**When** the list is long
**Then** activities are paginated via cursor pagination (API supports cursor + limit up to 200)

**Technical notes:**
- New shared domain module: `domains/history/` (history.api.ts, history.store.ts)
- New shared UI component: `ActivityListComponent` (reusable across all detail views)
- Entity type mapping: each domain provides its `entity_type` string for the API call
- This partially fills the `updated_by` gap via `ActivityResponse.user_name`

---

## Epic 12: Global Activity Feed

Admins can access a global activity feed from the shell to monitor recent changes across all entities.

> **Adjustment (2026-03-11):** Former Story 12.1 (FP ↔ FM bidirectional navigation) was merged into Stories 9.2 and 9.4 since both already modify the same detail components. Epic 12 now contains only Story 12.2.

### Story 12.2: Global Activity Feed

As an admin,
I want to access a global activity feed from the application shell,
So that I can monitor recent changes across all entities without visiting each one individually.

**Acceptance Criteria:**

**Given** the admin is on any page in the application
**When** they click the activity icon/bell in the shell header
**Then** a panel or dropdown opens showing recent activities from `GET /history/activities`
**And** each activity entry shows: timestamp, user name, action type, entity type, entity display name, and changes summary

**Given** the activity feed is open
**When** the admin clicks on an activity entry
**Then** they are navigated to the corresponding entity's detail page

**Given** the activity feed
**When** it loads
**Then** activities are sorted by most recent first
**And** pagination is supported (cursor-based, limit up to 200)

**Given** the activity feed
**When** the admin wants to filter
**Then** filter options are available for: entity type, action type (create/update/delete), and time range (since parameter)

**Technical note:** Depends on the shared `domains/history/` module established in Story 11.5. The shell component consumes the same history API service but calls the global endpoint (`GET /history/activities`) instead of entity-scoped ones.
