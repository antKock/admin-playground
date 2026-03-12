# Manual Test Recap — UAT Pass 2 Fixes

**Date:** 2026-03-12
**Branch:** `staging`
**Scope:** Fixes for issues found during UAT Pass 2 on Epics 8-12

---

## Fix 1 — TEST 8.1: "Charger plus" Button in DataTable

**Issue:** No visible "Charger plus" button for pagination.
**Fix:** Added explicit "Charger plus" button in DataTable footer when more pages exist.
**Files changed:** `data-table.component.html`, `data-table.component.css`

| # | Test Step | Expected Result |
|---|-----------|-----------------|
| 1 | Navigate to **any** entity list page with enough items to paginate | A **"Charger plus"** button is visible below the table rows |
| 2 | Click **"Charger plus"** | Next page loads; loaded count (X) increases in footer; button disappears if no more pages |
| 3 | While loading, observe the button | Button is replaced by a loading spinner |

---

## Fix 2 — TEST 8.2: Empty State Copy for Indicator Usage

**Issue:** Copy said "Non utilisé dans aucun modèle d'action." — should be "Utilisé dans aucun modèle d'action."
**Fix:** Updated the empty state text.
**Files changed:** `indicator-model-detail.component.ts`

| # | Test Step | Expected Result |
|---|-----------|-----------------|
| 1 | Open an indicator model **not used** by any action model | Shows **"Utilisé dans aucun modèle d'action."** |

---

## Fix 3 — TEST 9.2 / 9.4: FP ↔ FM Links Open in New Tab

**Issue:** Clicking FP→FM or FM→FP links navigated in the same tab.
**Fix:** Added `target="_blank" rel="noopener noreferrer"` to MetadataGrid linked fields and folder-model-detail FP links.
**Files changed:** `metadata-grid.component.ts`, `folder-model-detail.component.ts`

| # | Test Step | Expected Result |
|---|-----------|-----------------|
| 1 | Open a **funding program** detail with a linked folder model | Folder model link shows with external icon |
| 2 | Click the **folder model link** | Opens `/folder-models/{id}` in a **new tab** |
| 3 | Open a **folder model** detail with linked funding programs | Funding program names are clickable links |
| 4 | Click a **funding program link** | Opens `/funding-programs/{id}` in a **new tab** |

---

## Fix 4 — TEST 10.1: Community Parent/Child Link Navigation

**Issue:** Clicking parent/child community links did nothing (only right-click → new tab worked).
**Root cause:** `ngOnInit` used `route.snapshot` (one-time read). Angular reuses the component for same-route navigation, so param changes were ignored.
**Fix:** Switched to `route.paramMap` observable subscription so the component reloads when navigating between communities.
**Files changed:** `community-detail.component.ts`, `community-detail.component.spec.ts`

| # | Test Step | Expected Result |
|---|-----------|-----------------|
| 1 | Open a community with **parent communities** | Parent names displayed as clickable links |
| 2 | Click a **parent community link** | Navigates to that community's detail page; page content updates |
| 3 | Open a community with **child communities** | Child names displayed as clickable links |
| 4 | Click a **child community link** | Navigates to that community's detail page; page content updates |
| 5 | Click browser **back button** after navigating | Returns to the previous community |

---

## Fix 5 — TEST 10.3: Remove "Enfants" Count Column from Indicator List

**Issue:** The "Enfants" count column was considered useless.
**Fix:** Removed the `children_count` column from the indicator model list.
**Files changed:** `indicator-model-list.component.ts`, `indicator-model-list.component.spec.ts`

| # | Test Step | Expected Result |
|---|-----------|-----------------|
| 1 | Navigate to **Indicator Models** list | Table columns are: **Nom**, **Type**, **Unité**, **Mis à jour le** — no "Enfants" column |

---

## Fix 6 — TEST 10.4: Save Indicator After Type Change (Groupe → Texte)

**Issue:** Cannot save an indicator when changing type from "Groupe" to "Texte".
**Root cause:** Form submitted `children_ids: []` for non-group types which could be rejected by the API.
**Fix:** Send `children_ids: null` (not empty array) for non-group types; explicitly set `unit: null` for group type.
**Files changed:** `indicator-model-form.component.ts`

| # | Test Step | Expected Result |
|---|-----------|-----------------|
| 1 | Create a new **group** indicator with children | Indicator created successfully |
| 2 | **Edit** it: change type from **"Groupe"** to **"Texte"** | Children picker hides; unit field reappears |
| 3 | Click **Enregistrer** | Indicator saved successfully; type is now "Texte" |
| 4 | Verify the detail page | Type shows "Texte"; no "Indicateurs enfants" section |

---

## Fix 7 — TEST 11.2: User Communities as Clickable Links

**Issue:** Community names in user detail page were plain text, not clickable.
**Fix:** Added `RouterLink` import and wrapped community names in `<a>` tags linking to `/communities/{id}` (opens in new tab).
**Files changed:** `user-communities.component.ts`

| # | Test Step | Expected Result |
|---|-----------|-----------------|
| 1 | Open a user detail page with assigned communities | Community names are displayed as **clickable links** (blue, underline on hover) |
| 2 | Click a community link | Opens `/communities/{id}` in a **new tab** |
| 3 | Open a user with **no** communities | Shows "Aucune communauté assignée à cet utilisateur." |

---

## Fix 8 — TEST 11.4: Community Picker + Confirm Dialog HTML

**Issue A:** Community picker showed no results (silent API error).
**Fix A:** Added `communitiesError` state to the store/facade and error message in the picker UI.
**Files changed:** `user.store.ts` (domain), `user.store.ts` (feature), `user.facade.ts`, `user-communities.component.ts`

| # | Test Step | Expected Result |
|---|-----------|-----------------|
| 1 | On user detail, click **"+ Assigner une communauté"** | Picker opens; communities are listed (or error message shown if API fails) |
| 2 | Type in the search box | Communities filtered by name |
| 3 | Check already-assigned communities | Greyed out with **"Déjà assignée"** badge |
| 4 | Click **"Assigner"** on an unassigned community | Community assigned; toast shown; list refreshes |

**Issue B:** Confirm dialog showed raw HTML tags (`<strong>`) instead of bold text.
**Fix B:** Changed confirm dialog template from `{{ dialog.message }}` to `[innerHTML]="dialog.message"`.
**Files changed:** `confirm-dialog.component.ts`

| # | Test Step | Expected Result |
|---|-----------|-----------------|
| 5 | Click the **remove** (×) button on an assigned community | Confirm dialog shows community name in **bold** (not raw HTML tags) |
| 6 | Click **"Retirer"** | Community removed; toast shown |

---

## Summary

| # | Fix | Epic | Status |
|---|-----|------|--------|
| 1 | "Charger plus" button in DataTable | 8.1 | Ready for retest |
| 2 | Empty state copy fix | 8.2 | Ready for retest |
| 3 | FP ↔ FM links open in new tab | 9.2, 9.4 | Ready for retest |
| 4 | Community parent/child navigation | 10.1 | Ready for retest |
| 5 | Remove "Enfants" column | 10.3 | Ready for retest |
| 6 | Indicator type change save | 10.4 | Ready for retest |
| 7 | User communities clickable links | 11.2 | Ready for retest |
| 8 | Community picker error visibility + dialog HTML | 11.4 | Ready for retest |

**Build:** Passes
**Tests:** 865/865 passing (74 test files)
