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

---

## Epic 13: API Alignment & Schema Sync

### 13.1 — OpenAPI Types & Field Renames

- [ ] `npx ng build` succeeds with zero errors
- [ ] `npx ng test --no-watch` passes all tests
- [ ] Action model detail shows `status` field
- [ ] Indicator model detail shows `status` field
- [ ] All entity details show `last_updated_at` (not `updated_at`)
- [ ] Action model form: indicator parameter rules use correct field names (Obligatoire, Non éditable, Masqué, Valeur par défaut, Duplicable, Valeurs contraintes)
- [ ] Indicator parameter cards display rule values correctly

### 13.2 — Last Updated By on Metadata Grids

Test on each entity type: Action Model, Action Theme, Funding Program, Folder Model, Community, Agent, Indicator Model

- [ ] "Dernière modification par" row appears in metadata grid
- [ ] When `last_updated_by_id` is a valid user → shows resolved user name
- [ ] When `last_updated_by_id` is null → shows "—"
- [ ] When user lookup fails → shows truncated UUID gracefully

### 13.3 — Server-Side Filters

**Action Models list (`/action-models`)**
- [ ] Filter by Action Theme → only matching models shown, API sends `action_theme_id` param
- [ ] Filter by Status (e.g. `draft`) → API sends `status=draft`
- [ ] Multi-select status filter → API sends comma-separated (e.g. `status=draft,published`)
- [ ] Clear filter → full list returns

**Agents list (`/agents`)**
- [ ] Filter by Community → API sends `community_id` param
- [ ] Filter by Status → API sends `status` param

**Indicator Models list (`/indicator-models`)**
- [ ] Filter by Action Model → API sends `action_model_id` param
- [ ] Filter by Type → API sends `type` param
- [ ] Filter by Status → API sends `status` param

### 13.4 — Pagination Upgrade

- [ ] Any list view: initial load shows first page
- [ ] "Charger plus" or scroll load triggers next page with `cursor` param
- [ ] Total count displayed matches API `pagination.total_count`
- [ ] When `has_next_page` is false → no more "load more" button/trigger
- [ ] Empty list → shows empty state, no pagination controls

---

## Epic 14: Status Workflows & New Capabilities

### 14.1 — Action Model Status Workflow

- [ ] Detail view: StatusBadge shows current status with correct color (draft=gray, published=green, disabled=red)
- [ ] List view: status column shows StatusBadge for each row
- [ ] Draft action model detail → "Publier" button visible
- [ ] Click "Publier" → success toast "Modèle d'action publié", detail refreshes, status = published
- [ ] Published action model → "Désactiver" button visible
- [ ] Click "Désactiver" → success toast, status = disabled
- [ ] Disabled action model → "Réactiver" button visible
- [ ] Click "Réactiver" → success toast, status = published
- [ ] Double-click any status button rapidly → only one API request sent (check Network tab)
- [ ] Button shows loading/disabled state while mutation is pending
- [ ] Status filter on list: filter by draft, published, disabled

### 14.2 — Indicator Model Status Workflow

- [ ] Detail view: StatusBadge shows current status
- [ ] List view: status column with StatusBadge
- [ ] Draft → "Publier" → success toast, status changes to published
- [ ] Published → "Désactiver" → success toast, status changes to disabled
- [ ] Disabled → "Réactiver" → success toast, status changes to published
- [ ] Double-click protection works (exhaustOp)
- [ ] Status filter on list works with server-side param

### 14.3 — Token Refresh

- [ ] Login → access token stored, refresh token in httpOnly cookie
- [ ] Normal API calls work with valid token
- [ ] When access token expires → 401 triggers automatic refresh
- [ ] After refresh → original request retried transparently (no user-visible error)
- [ ] Open Network tab: verify only one `/auth/refresh` call even with concurrent 401s
- [ ] When refresh token is also expired → redirect to `/login` with `returnUrl` preserved
- [ ] Click Logout → `POST /auth/logout` called, redirect to login page
- [ ] After logout → API calls return 401 (no stale token)

### 14.4 — CDM Role & Soft-Delete Handling

**Roles**
- [ ] User list: role badges show "Admin" (red), "CDM" (blue), "Collectivité" (gray)
- [ ] CDM user can log in and access all admin pages
- [ ] Role-based guards accept `collectivite`, `cdm`, `admin` values

**Soft-Delete**
- [ ] Action models list: deleted items hidden by default
- [ ] Select "deleted" in status filter → deleted items appear with muted styling
- [ ] Deleted items show "Supprimé" status badge
- [ ] Indicator models list: same behavior for deleted items
- [ ] Clear status filter → deleted items hidden again

---

## Epic 15: Sites & Buildings

### 15.1 — Sites CRUD

**Navigation**
- [ ] Sidebar: "Sites" entry visible under Administration section (MapPin icon)
- [ ] Click sidebar → navigates to `/sites`

**List View (`/sites`)**
- [ ] DataTable shows columns: Nom, SIREN, Usage, Créé le
- [ ] Data loads from API with cursor-based pagination
- [ ] "Charger plus" works when more pages exist
- [ ] Total count displayed
- [ ] Empty state: "Aucun site trouvé."
- [ ] "Créer un site" button visible → navigates to `/sites/new`

**Detail View (`/sites/:id`)**
- [ ] Click row → navigates to `/sites/:id`
- [ ] Breadcrumbs: Sites > [Site Name]
- [ ] Metadata grid shows: Nom, SIREN (mono), Usage, ID externe (mono), Communauté (linked → clickable to `/communities/:id`, shows community name), Identifiant unique (mono), Créé le, Mis à jour le, Dernière modification par
- [ ] "Modifier" button → navigates to `/sites/:id/edit`
- [ ] "Supprimer" button → confirmation dialog → on confirm: toast "Site supprimé", navigate to `/sites`
- [ ] Loading skeleton shown while fetching
- [ ] Error state shown on API failure

**Buildings Sub-List (on site detail)**
- [ ] "Bâtiments" section shows with count indicator (e.g. "(3)")
- [ ] Table shows: Nom, Usage, RNB IDs, Créé le
- [ ] Click building row → navigates to `/buildings/:id`
- [ ] "Ajouter un bâtiment" button → navigates to `/buildings/new?site_id=X`
- [ ] Empty state: "Aucun bâtiment associé à ce site."
- [ ] Loading skeleton while fetching buildings

**Create Form (`/sites/new`)**
- [ ] Breadcrumbs: Sites > Nouveau site
- [ ] Fields: Nom (required), SIREN (required, 9-digit validation), Usage (optional textarea), ID externe (optional), Communauté (required, select populated from API)
- [ ] Submit with empty required fields → validation errors shown
- [ ] Enter invalid SIREN (e.g. "12345") → error: "Le SIREN doit comporter exactement 9 chiffres"
- [ ] Enter valid SIREN (e.g. "123456789") → no error
- [ ] Community select: shows loading state, then community names
- [ ] Submit valid form → toast "Site créé", navigate to `/sites`
- [ ] Ctrl+S / Cmd+S shortcut submits form
- [ ] Escape key navigates back (when not focused on input)
- [ ] Navigate away with unsaved changes → unsaved changes guard triggers

**Edit Form (`/sites/:id/edit`)**
- [ ] Breadcrumbs: Sites > [Site Name] > Modifier
- [ ] Form pre-filled with current values
- [ ] Submit → toast "Site mis à jour", navigate to `/sites/:id`
- [ ] Cancel → navigate back to detail

### 15.2 — Buildings CRUD with RNB Linking

**Navigation**
- [ ] Sidebar: "Bâtiments" entry visible under Administration (Building2 icon)
- [ ] Click sidebar → navigates to `/buildings`

**List View (`/buildings`)**
- [ ] DataTable shows columns: Nom, Usage, Créé le
- [ ] Data loads with cursor-based pagination
- [ ] "Charger plus" works
- [ ] Empty state: "Aucun bâtiment trouvé."
- [ ] "Créer un bâtiment" button → navigates to `/buildings/new`

**Detail View (`/buildings/:id`)**
- [ ] Breadcrumbs: Bâtiments > [Building Name]
- [ ] Metadata grid shows: Nom, Usage, ID externe (mono), Site (linked → clickable to `/sites/:id`, shows site name), Identifiant unique (mono), Créé le, Mis à jour le, Dernière modification par
- [ ] "Modifier" / "Supprimer" buttons work correctly
- [ ] Delete: confirmation → toast "Bâtiment supprimé" → navigate to `/buildings`

**RNB Management (on building detail)**
- [ ] "Identifiants RNB" section visible
- [ ] Existing RNB IDs shown as chip-list (mono font, rounded tags)
- [ ] Each chip has X button to remove
- [ ] Click X → confirmation dialog → on confirm: toast "RNB supprimé", chips refresh
- [ ] No RNB IDs → shows "Aucun identifiant RNB."
- [ ] Text input + "Ajouter" button for adding RNB
- [ ] Type RNB ID + click "Ajouter" → toast "RNB ajouté", chip appears, input clears
- [ ] Press Enter in input → same as clicking "Ajouter"
- [ ] Empty input → "Ajouter" button disabled
- [ ] While mutation pending → buttons disabled, "Ajout..." label shown

**Create Form (`/buildings/new`)**
- [ ] Fields: Nom (required), Usage (optional textarea), ID externe (optional), Site (required, select populated from API)
- [ ] Submit valid → toast "Bâtiment créé", navigate to `/buildings`
- [ ] Navigate from site detail ("Ajouter un bâtiment") → site_id pre-filled in select

**Edit Form (`/buildings/:id/edit`)**
- [ ] Form pre-filled with current values
- [ ] Submit → toast "Bâtiment mis à jour", navigate to `/buildings/:id`

**Cross-Navigation (15.1 ↔ 15.2)**
- [ ] Site detail → click building row → building detail opens
- [ ] Site detail → "Ajouter un bâtiment" → building form with site pre-selected
- [ ] Building detail → click Site linked field → site detail opens
- [ ] Building form → site select shows all sites by name

---

## Cross-Cutting Checks

- [ ] All toast messages appear and auto-dismiss
- [ ] Navigation breadcrumbs correct on all pages
- [ ] Browser back/forward navigation works correctly
- [ ] No console errors in browser DevTools
- [ ] API Inspector (bottom of detail pages) shows request/response for debugging
- [ ] Activity list sections on detail pages load entity history
