# UAT Manual Tests — Epics 12, 13, 14, 15

Generated: 2026-03-14

---

## Epic 12: Global Activity Feed

### 12.2 — Activity Panel

- [ ] Bell icon visible in shell header
- [ ] Click bell → slide-over panel opens from right
- [ ] Activity entries display: formatted timestamp, user name, action badge, entity type, entity name
- [ ] Action badges show correct labels/colors: Création (green), Modification (blue), Suppression (red)
- [ ] Click an activity entry → navigates to the correct entity detail page
- [ ] Panel closes after navigation
- [ ] Scroll to bottom → loads next page (infinite scroll)
- [ ] Verify no duplicate entries on scroll load
- [ ] Filter by entity type (e.g. select "Modèle d'action") → list updates
- [ ] Filter by action type (e.g. "Création" only) → list updates
- [ ] Filter by time range (since) → list updates
- [ ] Clear filters → full list returns
- [ ] Press Escape → panel closes
- [ ] Click outside panel → panel closes
- [ ] Open panel with no activities → shows empty state message

**Anthony Tests**
- We removed the Activity panel and replaced it with a dedicated page, with an access from the navbar. Check for dead code

---

## Epic 13: API Alignment & Schema Sync

### 13.1 — OpenAPI Types & Field Renames

- [X] `npx ng build` succeeds with zero errors
- [X] `npx ng test --no-watch` passes all tests
- [X] Action model detail shows `status` field
- [X] Indicator model detail shows `status` field
- [X] All entity details show `last_updated_at` (not `updated_at`)
- [X] Action model form: indicator parameter rules use correct field names (Obligatoire, Non éditable, Masqué, Valeur par défaut, Duplicable, Valeurs contraintes)
- [F] Indicator parameter cards display rule values correctly

**Anthony Tests**
- The parameters "duplicable" and "valeurs contraintes" should have a JSONLOGIC box as the other parameters, it isn't the case right now.



### 13.2 — Last Updated By on Metadata Grids

Test on each entity type: Action Model, Action Theme, Funding Program, Folder Model, Community, Agent, Indicator Model

- [X] "Dernière modification par" row appears in metadata grid
- [X] When `last_updated_by_id` is a valid user → shows resolved user name
- [X] When `last_updated_by_id` is null → shows "—"
- [X] When user lookup fails → shows truncated UUID gracefully

### 13.3 — Server-Side Filters

**Action Models list (`/action-models`)**
- [X] Filter by Action Theme → only matching models shown, API sends `action_theme_id` param
- [X] Filter by Status (e.g. `draft`) → API sends `status=draft`
- [X] Multi-select status filter → API sends comma-separated (e.g. `status=draft,published`)
- [X] Clear filter → full list returns

**Anthony Tests**
- When I multi-select a status filter, it only shows models with all those statuses; the filter works as an AND filter, instead of an OR filter

**Agents list (`/agents`)**
- [X] Filter by Community → API sends `community_id` param
- [X] Filter by Status → API sends `status` param

**Indicator Models list (`/indicator-models`)**
- [X] Filter by Action Model → API sends `action_model_id` param
- [X] Filter by Type → API sends `type` param
- [X] Filter by Status → API sends `status` param

### 13.4 — Pagination Upgrade

- [X] Any list view: initial load shows first page
- [X] "Charger plus" or scroll load triggers next page with `cursor` param
- [X] Total count displayed matches API `pagination.total_count`
- [X] When `has_next_page` is false → no more "load more" button/trigger
- [X] Empty list → shows empty state, no pagination controls

---

## Epic 14: Status Workflows & New Capabilities

### 14.1 — Action Model Status Workflow

- [X] Detail view: StatusBadge shows current status with correct color (draft=gray, published=green, disabled=red)
- [X] List view: status column shows StatusBadge for each row
- [X] Draft action model detail → "Publier" button visible
- [X] Click "Publier" → success toast "Modèle d'action publié", detail refreshes, status = published
- [X] Published action model → "Désactiver" button visible
- [X] Click "Désactiver" → success toast, status = disabled
- [X] Disabled action model → "Réactiver" button visible
- [X] Click "Réactiver" → success toast, status = published
- [X] Double-click any status button rapidly → only one API request sent (check Network tab)
- [X] Button shows loading/disabled state while mutation is pending
- [X] Status filter on list: filter by draft, published, disabled

### 14.2 — Indicator Model Status Workflow

- [X] Detail view: StatusBadge shows current status
- [X] List view: status column with StatusBadge
- [X] Draft → "Publier" → success toast, status changes to published
- [X] Published → "Désactiver" → success toast, status changes to disabled
- [X] Disabled → "Réactiver" → success toast, status changes to published
- [X] Double-click protection works (exhaustOp)
- [X] Status filter on list works with server-side param

**Anthony Test**
- One unrelated API error : "Http failure response for https://staging-admin-playground.anthonykocken.fr/api/history/IndicatorModel/bc3f5359-8680-464e-a43b-f869efd95eb8/activities?limit=20: 400 OK"


### 14.3 — Token Refresh

- [ ] Login → access token stored, refresh token in httpOnly cookie
- [ ] Normal API calls work with valid token
- [ ] When access token expires → 401 triggers automatic refresh
- [ ] After refresh → original request retried transparently (no user-visible error)
- [ ] Open Network tab: verify only one `/auth/refresh` call even with concurrent 401s
- [ ] When refresh token is also expired → redirect to `/login` with `returnUrl` preserved
- [ ] Click Logout → `POST /auth/logout` called, redirect to login page
- [ ] After logout → API calls return 401 (no stale token)

**Anthony Test**
- Don't know how to make sure the refresh toekn is stored; I don't see it in the login API response

### 14.4 — CDM Role & Soft-Delete Handling

**Roles**
- [X] User list: role badges show "Admin" (red), "CDM" (blue), "Collectivité" (gray)
- [X] CDM user can log in and access all admin pages
- [X] Role-based guards accept `collectivite`, `cdm`, `admin` values

**Anthony Tests**
- "Collectivité" users shouldn't be able to access admin pages, even in read mode. They may need to access some of this data in the end-user app; but shouldn't be able to access the admin UI.

**Soft-Delete**
- [X] Action models list: deleted items hidden by default
- [X] Select "deleted" in status filter → deleted items appear with muted styling
- [X] Deleted items show "Supprimé" status badge
- [X] Indicator models list: same behavior for deleted items
- [X] Clear status filter → deleted items hidden again

---

## Epic 15: Sites & Buildings

### 15.1 — Sites CRUD

**Navigation**
- [X] Sidebar: "Sites" entry visible under Administration section (MapPin icon)
- [F] Click sidebar → navigates to `/sites`

**Anthony Tests**
- "Internal Server Error" when accessing `/sites`

**List View (`/sites`)**
- [F] DataTable shows columns: Nom, SIREN, Usage, Créé le
- [F] Data loads from API with cursor-based pagination
- [F] "Charger plus" works when more pages exist
- [F] Total count displayed
- [F] Empty state: "Aucun site trouvé."
- [F] "Créer un site" button visible → navigates to `/sites/new`

**Anthony Tests**
- Can't test because of bug above

**Detail View (`/sites/:id`)**
- [F] Click row → navigates to `/sites/:id`
- [F] Breadcrumbs: Sites > [Site Name]
- [F] Metadata grid shows: Nom, SIREN (mono), Usage, ID externe (mono), Communauté (linked → clickable to `/communities/:id`, shows community name), Identifiant unique (mono), Créé le, Mis à jour le, Dernière modification par
- [F] "Modifier" button → navigates to `/sites/:id/edit`
- [F] "Supprimer" button → confirmation dialog → on confirm: toast "Site supprimé", navigate to `/sites`
- [F] Loading skeleton shown while fetching
- [F] Error state shown on API failure

**Anthony Tests**
- Can't test because of bug above

**Buildings Sub-List (on site detail)**
- [F] "Bâtiments" section shows with count indicator (e.g. "(3)")
- [F] Table shows: Nom, Usage, RNB IDs, Créé le
- [F] Click building row → navigates to `/buildings/:id`
- [F] "Ajouter un bâtiment" button → navigates to `/buildings/new?site_id=X`
- [F] Empty state: "Aucun bâtiment associé à ce site."
- [F] Loading skeleton while fetching buildings

**Anthony Tests**
- Can't test because of bug above

**Create Form (`/sites/new`)**
- [F] Breadcrumbs: Sites > Nouveau site
- [F] Fields: Nom (required), SIREN (required, 9-digit validation), Usage (optional textarea), ID externe (optional), Communauté (required, select populated from API)
- [F] Submit with empty required fields → validation errors shown
- [F] Enter invalid SIREN (e.g. "12345") → error: "Le SIREN doit comporter exactement 9 chiffres"
- [F] Enter valid SIREN (e.g. "123456789") → no error
- [F] Community select: shows loading state, then community names
- [F] Submit valid form → toast "Site créé", navigate to `/sites`
- [F] Ctrl+S / Cmd+S shortcut submits form
- [F] Escape key navigates back (when not focused on input)
- [F] Navigate away with unsaved changes → unsaved changes guard triggers

**Anthony Tests**
- Can't test because of bug above

**Edit Form (`/sites/:id/edit`)**
- [F] Breadcrumbs: Sites > [Site Name] > Modifier
- [F] Form pre-filled with current values
- [F] Submit → toast "Site mis à jour", navigate to `/sites/:id`
- [F] Cancel → navigate back to detail

**Anthony Tests**
- Can't test because of bug above

### 15.2 — Buildings CRUD with RNB Linking

**Navigation**
- [X] Sidebar: "Bâtiments" entry visible under Administration (Building2 icon)
- [X] Click sidebar → navigates to `/buildings`

**List View (`/buildings`)**
- [X] DataTable shows columns: Nom, Usage, Créé le
- [X] Data loads with cursor-based pagination
- [X] "Charger plus" works
- [X] Empty state: "Aucun bâtiment trouvé."
- [X] "Créer un bâtiment" button → navigates to `/buildings/new`

**Detail View (`/buildings/:id`)**
- [X] Breadcrumbs: Bâtiments > [Building Name]
- [X] Metadata grid shows: Nom, Usage, ID externe (mono), Site (linked → clickable to `/sites/:id`, shows site name), Identifiant unique (mono), Créé le, Mis à jour le, Dernière modification par
- [X] "Modifier" / "Supprimer" buttons work correctly
- [X] Delete: confirmation → toast "Bâtiment supprimé" → navigate to `/buildings`

**Anthony Tests**
- activities?limit=20 error: {
    "detail": "Invalid entity_type. Must be one of: Action, ActionModel, ActionTheme, Agent, Community, Folder, FolderModel, FundingProgram, Role, User"
}
- Couldn't test "site" related aspect due to the 500 error on site calls

**RNB Management (on building detail)**
- [X] "Identifiants RNB" section visible
- [X] Existing RNB IDs shown as chip-list (mono font, rounded tags)
- [X] Each chip has X button to remove
- [X] Click X → confirmation dialog → on confirm: toast "RNB supprimé", chips refresh
- [X] No RNB IDs → shows "Aucun identifiant RNB."
- [X] Text input + "Ajouter" button for adding RNB
- [X] Type RNB ID + click "Ajouter" → toast "RNB ajouté", chip appears, input clears
- [X] Press Enter in input → same as clicking "Ajouter"
- [X] Empty input → "Ajouter" button disabled
- [X] While mutation pending → buttons disabled, "Ajout..." label shown

**Create Form (`/buildings/new`)**
- [X] Fields: Nom (required), Usage (optional textarea), ID externe (optional), Site (required, select populated from API)
- [ ] Submit valid → toast "Bâtiment créé", navigate to `/buildings`
- [ ] Navigate from site detail ("Ajouter un bâtiment") → site_id pre-filled in select

**Anthony Test**
- Can't test site-related aspect due to 500 error on site calls


**Edit Form (`/buildings/:id/edit`)**
- [X] Form pre-filled with current values
- [X] Submit → toast "Bâtiment mis à jour", navigate to `/buildings/:id`


**Cross-Navigation (15.1 ↔ 15.2)**
- [ ] Site detail → click building row → building detail opens
- [ ] Site detail → "Ajouter un bâtiment" → building form with site pre-selected
- [ ] Building detail → click Site linked field → site detail opens
- [ ] Building form → site select shows all sites by name

**Anthony Test**
- Can't test site-related aspect due to 500 error on site calls

---

## Cross-Cutting Checks

- [X] All toast messages appear and auto-dismiss
- [X] Navigation breadcrumbs correct on all pages
- [X] Browser back/forward navigation works correctly
- [ ] No console errors in browser DevTools
- [X] API Inspector (bottom of detail pages) shows request/response for debugging
- [X] Activity list sections on detail pages load entity history
