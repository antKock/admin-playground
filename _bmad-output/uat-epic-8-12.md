# User Acceptance Tests — Epics 8–12 (v1.2)

**Date:** 2026-03-11
**Tester:** Anthony
**Branch:** `staging`
**Status:** All stories in `review` — ready for UAT

> **Legend:** ✅ Pass | ❌ Fail | ⚠️ Partial | ⏭️ Skipped
>
> **Note:** Story 10.2 (Community List counts) is **deferred** (API gap). Story 12.1 (FP↔FM navigation) is **merged** into Stories 9.2 + 9.4.

---

## Epic 8: List & Filter Enhancements

### TEST 8.1 — Total Count Display in DataTable Footer

| # | Test Step | Expected Result |
|---|-----------|-----------------|
| 1 | Navigate to **any** entity list page (action-models, action-themes, indicator-models, funding-programs, folder-models, communities, agents) | Table footer shows **"Affichage de X sur Y"** where Y comes from `total_count` |
| 2 | Click **"Charger plus"** to load a second page | The loaded count (X) increases while total (Y) stays the same |
| 3 | Check a list where `total_count` might be null (if applicable) | Footer shows only **"Affichage de X"** without "sur Y" |

**Anthony — Pass 1:**
- I can't see the "Affichage de X sur Y" message in the footer.
- I can't see "Charger plus" button, likely because there is not enough items to trigger pagination.

**Anthony — Pass 2:**


---

### TEST 8.2 — Server-Side Indicator Usage (No More 100-Item Ceiling)

| # | Test Step | Expected Result |
|---|-----------|-----------------|
| 1 | Open the detail page of an indicator model that is used by action models | "Utilisation" section lists **all** action models referencing it (no truncation at 100) |
| 2 | Click on an action model name in the usage list | Navigates to `/action-models/{id}` detail page |
| 3 | Open an indicator model **not used** by any action model | Shows **"Non utilisé dans aucun modèle d'action."** |

**Anthony — Pass 1:**
- 1 - Passed
- 2 - Passed
- 3 - Passed

**Anthony — Pass 2:**


---

### TEST 8.3 — Indicator Model Type Filter

| # | Test Step | Expected Result |
|---|-----------|-----------------|
| 1 | Navigate to the **Indicator Models** list page | "Type" column has a **filter icon** in the header |
| 2 | Open the Type filter dropdown | Options include **"Texte"**, **"Nombre"**, and **"Groupe"** |
| 3 | Select a type (e.g., "Nombre") | List reloads showing only indicators of that type; filter icon shows active state |
| 4 | Clear the filter | List reloads showing all indicator types |

**Anthony — Pass 1:**
- 1. Passed
- 2. Partial, the "group" type is not shown in the filter dropdown; yet likely related to another bug below

**Anthony — Pass 2:**


---

### TEST 8.4 — Funding Program Active Filter

| # | Test Step | Expected Result |
|---|-----------|-----------------|
| 1 | Navigate to the **Funding Programs** list page | "Statut" column has a **filter icon** |
| 2 | Select **"Actif"** in the filter | List reloads showing only active programs (`?active_only=true`) |
| 3 | Select **"Inactif"** | List reloads showing only inactive programs |
| 4 | Clear the filter | All programs shown again |

**Anthony — Pass 1:**
1. Passed
2. Fail; whatever the chosen filter, the list reloads but does not show the filtered results
3. Fail; whatever the chosen filter, the list reloads but does not show the filtered results
4. Passed

**Anthony — Pass 2:**


---

## Epic 9: Funding Programs & Folder Models Enrichment

### TEST 9.1 — Funding Program Form (New Fields)

| # | Test Step | Expected Result |
|---|-----------|-----------------|
| 1 | Click **"Créer"** on funding programs list | Form shows new fields: **budget** (number), **start_date** (date), **end_date** (date), **is_active** (toggle, default true), **folder_model_id** (dropdown) |
| 2 | Fill all fields and submit | Program created with all fields; navigated to detail page showing correct values |
| 3 | Click **"Modifier"** on an existing funding program | Edit form pre-populates all fields including budget, dates, active toggle, and folder model dropdown |
| 4 | Change values and submit | Program updated; detail page reflects changes |

**Anthony — Pass 1:**
1. Partial; "folder_model_id" field is not displayed
2. Passed
3. Fail; dates are reset; saved dates are not restored
4. Passed

**Anthony — Pass 2:**


---

### TEST 9.2 — Funding Program Detail (Enriched + FP→FM Navigation)

| # | Test Step | Expected Result |
|---|-----------|-----------------|
| 1 | Open the detail page of a funding program with all fields set | MetadataGrid shows: **budget** (EUR currency format), **start_date** and **end_date** (fr-FR date), **is_active** as status badge, **folder model** as clickable link |
| 2 | Click the **folder model link** | Navigates to `/folder-models/{id}` detail page *(this is the FR15 bidirectional nav)* |
| 3 | Open a funding program with `is_active = false` | Status badge clearly shows **"Inactif"** |
| 4 | Open a funding program with no folder model | Folder model field shows **"—"** (no link) |

**Anthony — Pass 1:**
1. Fail; "folder model" is not available
2. Can't be tested because of bug above
3. Fail; no clear status badge
4. Fail; no folder model field

**Anthony — Pass 2:**


---

### TEST 9.3 — Folder Model Form (Funding Programs Multi-Select)

| # | Test Step | Expected Result |
|---|-----------|-----------------|
| 1 | Open the **create** folder model form | A **funding_program_ids** multi-select picker is available |
| 2 | Select multiple funding programs and submit | Folder model created with associations; detail page shows linked programs |
| 3 | **Edit** an existing folder model with linked funding programs | Multi-select is pre-populated with current programs |
| 4 | Remove all funding program selections and submit | Folder model saved with no associations (empty array sent) |

**Anthony — Pass 1:**
- 1. Pass
- 2. Pass
- 3. Pass
- 4. Partial; Can't save "folder model" with no funding programs; whereas it should be possible

**Anthony — Pass 2:**


---

### TEST 9.4 — Folder Model Detail (Linked FPs + FM→FP Navigation)

| # | Test Step | Expected Result |
|---|-----------|-----------------|
| 1 | Open a folder model that has associated funding programs | **"Programmes de financement"** section lists each program as a **clickable link** |
| 2 | Click a funding program link | Navigates to `/funding-programs/{id}` *(FR15 bidirectional nav — reverse direction)* |
| 3 | Open a folder model with **no** associated funding programs | Shows **"Aucun programme de financement associé"** |

**Anthony — Pass 1:**
1. Listed, but not as a link
2. Can't be tested
3. Pass

**Anthony — Pass 2:**


---

## Epic 10: Communities & Indicator Models Enrichment

### TEST 10.1 — Community Detail: Parents & Children

| # | Test Step | Expected Result |
|---|-----------|-----------------|
| 1 | Open a community that has **parent communities** | **"Parents"** section lists each parent as a clickable link to `/communities/{id}` |
| 2 | Open a community that has **child communities** | **"Enfants"** section lists each child as a clickable link |
| 3 | Click a parent or child community link | Navigates to that community's detail page |
| 4 | Open a community with **no parents** | Shows **"Aucune communauté parente."** |
| 5 | Open a community with **no children** | Shows **"Aucune communauté enfant."** |

**Anthony — Pass 1:**
1. Fail. In the community detail view, I can't see parent/child communities listed.
2. Can't be tested
3. Can't be tested
4. Can't be tested
5. Can't be tested

**Anthony — Pass 2:**


---

### TEST 10.2 — Community List: Parent & Children Count Columns

> ⏭️ **DEFERRED** — API does not return `parents_count` / `children_count` on `CommunityRead`. No test to perform.

**Anthony — Pass 1:**
1. Can't "count" columns

**Anthony — Pass 2:**


---

### TEST 10.3 — Indicator Group Type: List & Detail

| # | Test Step | Expected Result |
|---|-----------|-----------------|
| 1 | Navigate to **Indicator Models** list | Group-type indicators are **visually distinguished** (type column shows "Groupe") |
| 2 | Check a group indicator row | Shows a **child count** (e.g., "3 enfants") |
| 3 | Open a **group-type** indicator detail page | An **"Enfants"** section shows child indicators as clickable links; **unit field is hidden** |
| 4 | Open a **non-group** indicator detail page | No "Enfants" section; unit field is visible |

**Anthony — Pass 1:**
1. Fail, no "group" is displayed; likely because there is no "group" indicator in the dataset
2. Fail, can't be tested
3. I cannot create a group indicator; thus can't test
4. Pass

**Anthony — Pass 2:**


---

### TEST 10.4 — Indicator Group Type: Form with Children Picker

| # | Test Step | Expected Result |
|---|-----------|-----------------|
| 1 | Create a new indicator, select type **"Groupe"** | **Unit field hides**, **children picker appears** |
| 2 | Search for indicators in the picker | Only **text** and **number** type indicators shown (no groups) |
| 3 | Attach child indicators and submit | Group indicator created with `children_ids` in payload |
| 4 | **Edit** an existing group indicator | Children picker is pre-populated with current children |
| 5 | Change type from **"Groupe"** to **"Texte"** | Children picker **hides**, `children_ids` **cleared**; unit field reappears |

**Anthony — Pass 1:**
1. Fail, no "group" type available
2. Can't be tested, because of above
3. Can't be tested, because of above
4. Can't be tested, because of above
5. Can't be tested, because of above

**Anthony — Pass 2:**


---

## Epic 11: Users Management & Activity History

### TEST 11.1 — Users List Page

| # | Test Step | Expected Result |
|---|-----------|-----------------|
| 1 | Click **"Utilisateurs"** in the sidebar (Administration section) | Navigates to `/users`; table shows: **display name** (bold), **email**, **role**, **active status** (badge), **community count**, **updated date** (fr-FR) |
| 2 | Verify sorting | Columns for name, email, role, updated date are sortable |
| 3 | Click **"Charger plus"** (if enough users) | Next page loads via cursor pagination |
| 4 | Click a user row | Navigates to `/users/{id}` detail page |
| 5 | Click **"Créer un utilisateur"** | Navigates to `/users/new` |

**Anthony — Pass 1:**
1. Fail. I can see the "Utilisateurs" menu in the sidebar, but clicking it does nothing.
2. 3. 4. 5. Can't be tested because of issue above

**Anthony — Pass 2:**


---

### TEST 11.2 — User Detail Page

| # | Test Step | Expected Result |
|---|-----------|-----------------|
| 1 | Navigate to `/users/{id}` | MetadataGrid shows: **email**, **prénom**, **nom**, **role**, **active status** (badge), **created date**, **updated date** |
| 2 | Check **"Communautés"** section | Lists user's communities as clickable links to `/communities/{id}` |
| 3 | Click **"Modifier"** | Navigates to `/users/{id}/edit` |
| 4 | Click **"Supprimer"** → confirm dialog | User deleted, success toast, navigated back to `/users` |
| 5 | Navigate away from the page | No stale data on next visit (`clearSelection()` called on destroy) |

**Anthony — Pass 1:**
1. Can't be tested because of 11.1 failing

**Anthony — Pass 2:**


---

### TEST 11.3 — User Create & Edit Form

| # | Test Step | Expected Result |
|---|-----------|-----------------|
| 1 | Navigate to `/users/new` | Form shows: **email** (required), **first_name** (required), **last_name** (required), **password** (required), **is_active** (toggle, default true), **role** (dropdown) |
| 2 | Submit with empty required fields | Validation errors shown inline; first invalid field focused |
| 3 | Fill all fields and submit | `POST /users/` called; toast "Utilisateur créé"; navigated to list |
| 4 | Edit an existing user (`/users/{id}/edit`) | Form pre-populated; **password field NOT shown**; role dropdown populated |
| 5 | Change role and submit edit | `PUT /users/{id}` + separate `PUT /admin/roles/user/{id}` called |
| 6 | Make changes, then try to navigate away without saving | **Unsaved changes guard** prompts for confirmation |
| 7 | Press **Ctrl+S** with valid dirty form | Form submits |
| 8 | Press **Escape** | Navigates back |

**Anthony — Pass 1:**
1. Can't be tested because of 11.1 failing

**Anthony — Pass 2:**


---

### TEST 11.4 — User Community Assignment

| # | Test Step | Expected Result |
|---|-----------|-----------------|
| 1 | On user detail page, check **"Communautés"** section | Shows assigned communities with **remove** buttons |
| 2 | Click **"+ Assigner une communauté"** | Picker opens with searchable community list |
| 3 | Check already-assigned communities in picker | Greyed out with **"Déjà assignée"** badge |
| 4 | Click **"Assigner"** on an unassigned community | `POST /communities/{id}/users/{user_id}` called; toast shown; list refreshes |
| 5 | Click **remove** on an assigned community → confirm | `DELETE /communities/{id}/users/{user_id}` called; community removed |
| 6 | Type in the search box | Communities filtered by name (case-insensitive) |
| 7 | Click outside the picker | Picker closes |

**Anthony — Pass 1:**
1. Can't be tested because of 11.1 failing

**Anthony — Pass 2:**


---

### TEST 11.5 — Activity History on Entity Detail Pages

| # | Test Step | Expected Result |
|---|-----------|-----------------|
| 1 | Open **any** entity detail page (action-model, action-theme, indicator-model, funding-program, folder-model, community, agent, user) | An **"Activité"** section is visible |
| 2 | Check an entity **with** activity history | Each activity shows: **timestamp** (fr-FR), **user name**, **action type** (create/update/delete badge), **changes summary** |
| 3 | Check an entity with **no** activity history | Shows **"Aucune activité enregistrée."** |
| 4 | On an entity with many activities, click **"Charger plus"** | Next page loads via cursor pagination |
| 5 | Verify loading state | Loading indicator shown while fetching |

**Anthony — Pass 1:**
1. No "activité" section is visible
2. 3. 4. 5. can't be tested because of bug above

**Anthony — Pass 2:**


---

## Epic 12: Global Activity Feed

### TEST 12.1 — FP ↔ FM Bidirectional Navigation

> ⏭️ **MERGED** into Tests 9.2 and 9.4 above. No separate test needed.

---

### TEST 12.2 — Global Activity Feed (Dedicated Page)

| # | Test Step | Expected Result |
|---|-----------|-----------------|
| 1 | Click **"Activité"** in the sidebar (Administration section) | Navigates to `/activity`; table shows recent activities with filters |
| 2 | Check activity entries | Each shows: **timestamp**, **user name**, **action type**, **entity type**, **entity display name**, **changes summary** |
| 3 | Click an activity row | Navigates to the entity's detail page (e.g., `/funding-programs/{id}`) |
| 4 | Click **"Charger plus"** | Next page loads via cursor pagination |
| 5 | Use the **entity type** filter | List filters to show only that entity type |
| 6 | Use the **action type** filter (create/update/delete) | List filters by action |
| 7 | Use the **date** filter | List filters by date |

**Anthony — Pass 1:**
1. Pass; would be WAY better to have the "global activity feed" as a dedicated page rather than a slide-over panel; accessible from the sidebar with a table view
2. Partial : Change summary isn't always visible; maybe a backend issue ?
3. Pass
4. Pass
5. Pass
6. Pass
7. Pass

> **Note:** Pass 1 was tested with the old slide-over panel. It has since been replaced with a dedicated `/activity` page accessible from the sidebar.

**Anthony — Pass 2:**


---

## Summary

| Epic | Stories | Tests | Status |
|------|---------|-------|--------|
| **Epic 8** — List & Filter Enhancements | 8.1, 8.2, 8.3, 8.4 | 4 tests | Pass 2 |
| **Epic 9** — FP & FM Enrichment | 9.1, 9.2, 9.3, 9.4 | 4 tests | Pass 2 |
| **Epic 10** — Communities & Indicators Enrichment | 10.1, 10.3, 10.4 | 3 tests (10.2 deferred) | Pass 2 |
| **Epic 11** — Users & Activity History | 11.1, 11.2, 11.3, 11.4, 11.5 | 5 tests | Pass 2 |
| **Epic 12** — Global Activity Feed | 12.2 | 1 test (12.1 merged) | Pass 2 |
| **Total** | **17 stories** | **17 tests** | |
