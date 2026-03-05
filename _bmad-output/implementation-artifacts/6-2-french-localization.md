# Story 6.2: French Localization of All UI Copy

Status: ready-for-dev

## Story

As an admin user working in a French-speaking context, I want all UI labels, buttons, messages, and placeholders to be in French, so that the interface is consistent with my working language.

## Acceptance Criteria

1. All button labels are in French (e.g., "Create" → "Créer", "Edit" → "Modifier", "Delete" → "Supprimer", "Save" → "Enregistrer").
2. All table column headers are in French (e.g., "Name" → "Nom", "Created" → "Créé le", "Status" → "Statut").
3. All empty state messages are in French (e.g., "No action models found." → "Aucun modèle d'action trouvé.").
4. All confirmation dialog titles and messages are in French.
5. All metadata grid labels are in French (e.g., "Description", "Funding Program" → "Programme de financement").
6. All breadcrumb labels are in French (e.g., "Action Models" → "Modèles d'action").
7. Filter labels and placeholders are in French (e.g., "All Funding Programs" → "Tous les programmes de financement").
8. Error messages are in French (e.g., "Failed to load" → "Échec du chargement").
9. Section headers are in French (e.g., "API Inspector" → "Inspecteur API", "Indicators" → "Indicateurs").
10. No i18n framework is used — strings are hardcoded in French directly in templates and components.

## Tasks

- [ ] Task 1: Translate all 7 list component templates — page titles, button labels, empty states, filter labels, column headers (AC: #1, #2, #3, #7)
- [ ] Task 2: Translate all 7 detail component templates — page headers, action buttons, section titles, metadata labels (AC: #1, #5, #6, #9)
- [ ] Task 3: Translate all form components (create/edit) — form labels, placeholders, submit buttons, validation messages (AC: #1)
- [ ] Task 4: Translate confirmation dialog calls — delete confirmations, status change confirmations (AC: #4)
- [ ] Task 5: Translate shared components — breadcrumb labels, save-bar, API inspector section title, error states (AC: #6, #8, #9)
- [ ] Task 6: Translate indicator-specific UI — indicator card labels, picker placeholder, param labels (already partially in French) (AC: #9)
- [ ] Task 7: Update unit tests to match new French strings in assertions
- [ ] Task 8: Visual review pass — ensure no truncation or layout issues from longer French strings

## Dev Notes

### Scope
- This is a find-and-replace task across all feature and shared component templates
- No i18n framework, no translation files — just change the English strings to French
- Some strings are already in French (indicator params: "Obligatoire", "Non éditable", "Visible", "Valeur par défaut", "Duplicable", "Valeurs contraintes")

### Translation Reference

| English | French |
|---------|--------|
| Create | Créer |
| Edit | Modifier |
| Delete | Supprimer |
| Save | Enregistrer |
| Cancel | Annuler |
| Discard | Abandonner |
| Clear filters | Effacer les filtres |
| Name | Nom |
| Description | Description |
| Status | Statut |
| Created | Créé le |
| Updated | Mis à jour le |
| Email | E-mail |
| Phone | Téléphone |
| Action Models | Modèles d'action |
| Action Themes | Thèmes d'action |
| Indicator Models | Modèles d'indicateur |
| Folder Models | Modèles de dossier |
| Funding Programs | Programmes de financement |
| Communities | Communautés |
| Agents | Agents |
| API Inspector | Inspecteur API |
| Metadata | Métadonnées |
| Indicators | Indicateurs |
| No [entity] found. | Aucun(e) [entité] trouvé(e). |
| Failed to load | Échec du chargement |
| Are you sure you want to delete | Êtes-vous sûr de vouloir supprimer |
| This action cannot be undone. | Cette action est irréversible. |

### Key Files
All files in `src/app/features/*/ui/*.component.ts` and `src/app/shared/components/*/`.

### Anti-Patterns
- Do NOT install ngx-translate or any i18n library
- Do NOT create a translations service or constants file — inline French directly
- Do NOT change API field names or data values — only UI labels
