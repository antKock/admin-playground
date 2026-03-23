# V2 — Analyse technique : Refacto qualité & préparation handover

Status: approved

## Contexte

Deux développeurs humains seniors (Maxime Allex et Léo Schmitt) ont réalisé une review indépendante de la codebase. Leurs constats convergent sur les mêmes axes d'amélioration. Cette v2 vise à adresser tous les feedbacks pertinents et front-centric avant de migrer le code vers le repo des développeurs humains pour qu'ils prennent la relève.

**Notes des reviewers :** 10/20 (Maxime) et 5/10 (Léo) — les deux confirment que le code est reprennable mais nécessite du refacto.

**Architecture de référence :** `docs/architecture-ACTEE.md`

---

## Épiques

| # | Épique | Description |
|---|--------|-------------|
| **E1** | Refacto structurel | Templates/styles externalisés + réorganisation des dossiers |
| **E2** | Séparation des responsabilités & composants shared | Extraction logique métier + AuthStore + composants/directives réutilisables |
| **E3** | Documentation & handover | Documentation patterns custom, guide développeur, limitations connues |

**Ordre d'exécution :** E1 → E2 → E3 (séquentiel, chaque épique prépare la suivante)

---

## E1 — Refacto structurel

### E1.1 — Externalisation des templates et styles inline

**Objectif :** Séparer tous les templates et styles inline en fichiers `.html` et `.css` dédiés.

**28 composants concernés :**

#### Templates + styles inline (15 composants) :

| Composant | Template (lignes) | Styles (lignes) | Chemin |
|-----------|--------------------|------------------|--------|
| `indicator-card` | 249 | 191 | `shared/components/indicator-card/` |
| `rule-field` | 79 | 176 | `shared/components/rule-field/` |
| `openapi-banner` | 109 | 153 | `shared/components/openapi-banner/` |
| `column-filter-popover` | 34 | 95 | `shared/components/column-filter-popover/` |
| `indicator-picker` | 59 | 125 | `shared/components/indicator-picker/` |
| `param-hint-icons` | 8 | 58 | `shared/components/param-hint-icons/` |
| `toast` | 26 | oui | `shared/components/toast/` |
| `breadcrumb` | 18 | oui | `shared/components/breadcrumb/` |
| `toggle-row` | 25 | oui | `shared/components/toggle-row/` |
| `section-anchors` | 16 | oui | `shared/components/section-anchors/` |
| `metadata-grid` | 34 | oui | `shared/components/metadata-grid/` |
| `confirm-dialog` | 36 | oui | `shared/components/confirm-dialog/` |
| `status-badge` | 4 | 11 | `shared/components/status-badge/` |
| `multi-selector` | 64 | non | `shared/components/multi-selector/` |
| `save-bar` | 26 | non | `shared/components/save-bar/` |

#### Templates inline seuls (13 composants) :

| Composant | Template (lignes) | Chemin |
|-----------|-------------------|--------|
| `activity-feed-page` | 252 | `features/activity-feed/ui/` |
| `agent-form` | 151 | `features/agents/ui/` |
| `user-form` | 122 | `features/users/ui/` |
| `funding-program-form` | 114 | `features/funding-programs/ui/` |
| `community-form` | 83 | `features/communities/ui/` |
| `action-theme-form` | 81 | `features/action-themes/ui/` |
| `community-users` | 78 | `features/communities/ui/` |
| `user-communities` | 76 | `features/users/ui/` |
| `folder-model-form` | 72 | `features/folder-models/ui/` |
| `activity-list` | 73 | `shared/components/activity-list/` |
| `api-inspector` | 49 | `shared/components/api-inspector/` |
| `login` | 49 | `core/auth/` |
| `community-list` | 23 | `features/communities/ui/` |

#### Déjà externalisés (aucune action) :
- `app-layout` (`core/layout/`)
- `data-table` (`shared/components/data-table/`)

**Règles d'exécution :**
- `template:` → `templateUrl: './xxx.component.html'`
- `styles:` → `styleUrl: './xxx.component.css'`
- Aucune modification de logique, uniquement extraction
- Vérifier `npx ng build` après chaque batch
- Vérifier `npx ng test --no-watch` après chaque batch

---

### E1.2 — Réorganisation de la structure de fichiers

**Objectif :** Co-localiser les fichiers logiquement liés, corriger les placements incohérents.

#### Problème 1 — API Inspector éclaté (HIGH)

**État actuel :**
- Interceptor : `core/api/api-inspector.interceptor.ts`
- Service : `shared/services/api-inspector.service.ts`
- Composant : `shared/components/api-inspector/api-inspector.component.ts`

**Cible :** Regrouper dans `shared/api-inspector/` :
```
shared/api-inspector/
├── api-inspector.interceptor.ts
├── api-inspector.interceptor.spec.ts
├── api-inspector.service.ts
├── api-inspector.service.spec.ts
├── api-inspector.component.ts
├── api-inspector.component.html
├── api-inspector.component.css
└── api-inspector.component.spec.ts
```

**Impact :** Mettre à jour les imports dans tous les fichiers qui référencent ces 3 fichiers. Mettre à jour le path alias si nécessaire.

#### Problème 2 — JSON-Logic éclaté (HIGH)

**État actuel :** 11+ fichiers en vrac dans `shared/utils/` :
- `jsonlogic-validate.ts` + spec
- `jsonlogic-prose.ts` + spec
- `prose-parser.ts` + spec
- `prose-tokenizer.ts` + spec
- `prose-autocomplete.ts` + spec
- `prose-codemirror-language.ts` + spec
- `json-editor-setup.ts`
- `prose-editor-setup.ts`
- Service lié : `shared/services/variable-dictionary.service.ts` + spec

**Cible :** Regrouper dans `shared/jsonlogic/` :
```
shared/jsonlogic/
├── jsonlogic-validate.ts (+spec)
├── jsonlogic-prose.ts (+spec)
├── prose-parser.ts (+spec)
├── prose-tokenizer.ts (+spec)
├── prose-autocomplete.ts (+spec)
├── prose-codemirror-language.ts (+spec)
├── json-editor-setup.ts
├── prose-editor-setup.ts
└── variable-dictionary.service.ts (+spec)
```

#### Problème 3 — Toast service séparé de son composant (MEDIUM)

**État actuel :**
- Service : `shared/services/toast.service.ts`
- Composant : `shared/components/toast/toast.component.ts`
- Spec service : `shared/components/toast/toast.service.spec.ts` (déjà côté composant !)

**Cible :** Déplacer `toast.service.ts` dans `shared/components/toast/`

#### Problème 4 — Confirm Dialog service séparé (MEDIUM)

**État actuel :**
- Service : `shared/services/confirm-dialog.service.ts`
- Composant : `shared/components/confirm-dialog/confirm-dialog.component.ts`

**Cible :** Déplacer `confirm-dialog.service.ts` dans `shared/components/confirm-dialog/`

#### Problème 5 — OpenAPI watcher mal placé (MEDIUM)

**État actuel :** `core/services/openapi-watcher.service.ts`

**Cible :** Déplacer dans `core/api/openapi-watcher.service.ts`

**Règles d'exécution :**
- Déplacer les fichiers, mettre à jour TOUS les imports
- Vérifier `npx ng build` après chaque déplacement
- Vérifier `npx ng test --no-watch` après chaque déplacement
- Ne pas modifier la logique des fichiers, uniquement les déplacer

---

## E2 — Séparation des responsabilités & composants shared

### E2.1 — Extraction de la logique métier des composants

**Objectif :** Les composants ne doivent contenir que de l'affichage et des appels à la facade. Toute transformation de données ou logique métier doit être dans la facade, le store dérivé, ou un use-case.

**Principe ACTEE :** "L'UI ne parle qu'à une facade" + "Les pages ne contiennent aucune logique métier"

#### Violation 1 — `action-model-detail.component.ts` : `serverCards` computed

**Fichier :** `features/action-models/ui/action-model-detail.component.ts`
**Problème :** ~40 lignes de mapping complexe transformant les données indicateurs en `IndicatorCardData[]` avec gestion des enfants et calcul d'état des paramètres.
**Action :** Déplacer cette logique dans `ActionModelFacade` ou créer un use-case `features/action-models/use-cases/build-indicator-cards.ts`.

#### Violation 2 — `indicator-model-form.component.ts` : `filteredAvailable` computed

**Fichier :** `features/indicator-models/ui/indicator-model-form.component.ts`
**Problème :** Filtrage métier des indicateurs disponibles (par type, auto-référence, déjà attachés, recherche).
**Action :** Déplacer dans `IndicatorModelFacade` : `facade.getAvailableChildIndicators(searchTerm)`.

#### Violation 3 — `indicator-model-form.component.ts` : préparation données submit

**Fichier :** `features/indicator-models/ui/indicator-model-form.component.ts`
**Problème :** Transformation des données formulaire avant envoi au backend.
**Action :** Créer `facade.prepareIndicatorData(formValue, attachedChildren)`.

#### Violation 4 — `community-users.component.ts` : `filteredUsers` computed

**Fichier :** `features/communities/ui/community-users.component.ts`
**Problème :** Filtrage des utilisateurs par nom/email dans le composant.
**Action :** Déplacer dans `CommunityFacade` : `facade.getFilteredUsers(query)`.

#### Violation 5 — `agentTypeLabels` dupliqué

**Fichiers :** `features/agents/ui/agent-detail.component.ts` ET `features/agents/ui/agent-list.component.ts`
**Problème :** Mapping de labels dupliqué entre deux composants.
**Action :** Extraire dans `shared/utils/agent-labels.ts`.

#### Violation 6 — `agent-list.component.ts` : transformation `rows`

**Fichier :** `features/agents/ui/agent-list.component.ts`
**Problème :** Mapping de données avec labels dans le composant.
**Action :** Déplacer dans `AgentFacade` : `facade.getFormattedAgents()`.

**Règles d'exécution :**
- Pour chaque extraction, adapter les tests existants
- Le composant résultant ne doit contenir QUE des appels facade et de la logique UI (affichage conditionnel, état formulaire)
- Vérifier `npx ng test --no-watch` après chaque extraction

---

### E2.2 — Migration AuthService vers AuthStore

**Objectif :** Migrer le service d'authentification vers un `signalStore` ACTEE-compliant.

**État actuel :** `core/auth/auth.service.ts`
- Token dans signal privé + localStorage
- `decodedPayload` en computed (memoized — correct)
- `getToken()` est une méthode (devrait être un signal)
- User metadata (userName, userEmail, userId, userRole) en computed signals

**Cible :** `domains/auth/auth.store.ts` avec `signalStore` :
- `withState({ token, user })` — stocker les infos décodées au login, pas décoder à la volée
- Signal `token()` exposé directement (plus de méthode `getToken()`)
- Mutations : `login()`, `logout()`, `refresh()`, `setToken()` via `withMethods`
- Conserver la persistance localStorage

**Impact :** Mettre à jour tous les injecteurs de `AuthService` vers `AuthStore`. Adapter le `LoginComponent`, les guards, et l'interceptor HTTP.

---

### E2.3 — Composant `FormFieldComponent` (wrapper validation)

**Objectif :** Éliminer la duplication du pattern `showError()` + `[class.border-error]` présent dans 7+ composants de formulaire.

**Pattern actuel dupliqué dans chaque form :**
```typescript
showError(field: string): boolean {
  const control = this.form.get(field);
  return !!control && control.invalid && (control.dirty || control.touched);
}
```
```html
<input [class.border-error]="showError('name')" formControlName="name" />
@if (showError('name')) {
  <p class="mt-1 text-sm text-error">Message d'erreur.</p>
}
```

**Composant cible :** `shared/components/form-field/form-field.component.ts`
```html
<app-form-field label="Nom" [control]="form.get('name')" error="Ce champ est requis.">
  <input formControlName="name" />
</app-form-field>
```

**Le composant gère :**
- Label avec `for` lié à l'input
- Application automatique de `border-error` via `ng-content` + CSS
- Affichage conditionnel du message d'erreur (dirty/touched + invalid)

**Composants à migrer :** agent-form, building-form, action-theme-form, indicator-model-form, community-form, funding-program-form, user-form, folder-model-form, login.

---

### E2.4 — Directive `TooltipDirective`

**Objectif :** Remplacer le mix de tooltips CSS custom (`data-tooltip` + `::before`) et tooltips HTML natifs (`title`) par une directive unifiée.

**État actuel :**
- `param-hint-icons.component.ts` : tooltip CSS custom avec pseudo-élément `::before`
- Plusieurs detail components : attribut `title` natif

**Directive cible :** `shared/directives/tooltip.directive.ts`
```html
<button appTooltip="Supprimer cet élément">...</button>
```

**La directive gère :**
- Positionnement (top par défaut)
- Styles cohérents
- Show/hide au hover

---

### E2.5 — Composant `ApiInspectorContainerComponent`

**Objectif :** Éviter la duplication de `<app-api-inspector>` dans chaque composant feature.

**État actuel :** Chaque composant detail/form/list inclut manuellement `<app-api-inspector>`.

**Composant cible :** `shared/api-inspector/api-inspector-container.component.ts`
```html
<app-api-inspector-container>
  <!-- contenu du composant feature -->
</app-api-inspector-container>
```

**Le container :**
- Injecte `ApiInspectorService`
- Affiche `<app-api-inspector>` automatiquement
- Projette le contenu enfant via `<ng-content>`

---

### E2.6 — Composants layout shared réutilisables

**Objectif :** Extraire les patterns UI répétés identiquement dans 7+ domaines.

**Patterns identifiés :**

#### 1. Layout de liste (list-page-layout)
Pattern commun : titre + bouton création + filtres + DataTable + pagination loadMore + empty state avec `hasLoaded` guard.

#### 2. Layout de détail (detail-page-layout)
Pattern commun : breadcrumb + skeleton loading + MetadataGrid + sections + boutons action (edit, delete).

#### 3. Layout de formulaire (form-page-layout)
Pattern commun : breadcrumb + formulaire + SaveBar + Cmd+S shortcut + Escape cancel + `HasUnsavedChanges` guard.

**Approche :** Créer des composants layout dans `shared/components/layouts/` qui encapsulent la structure commune et projettent le contenu spécifique via `<ng-content>` et template slots.

**Note :** Le degré d'abstraction exact sera défini lors de l'implémentation. L'objectif n'est pas un framework générique mais d'éliminer la duplication visible.

---

## E3 — Documentation & handover

### E3.1 — Documentation du pattern `withCursorPagination`

**Fichier :** `domains/shared/with-cursor-pagination.ts`

**Contenu à documenter :**
- Approche cursor-based (pas d'offset)
- State exposé : `items`, `cursor`, `hasMore`, `isLoading`, `error`, `totalCount`
- Computed : `isEmpty`, `totalLoaded`
- Méthodes : `load(filters)`, `loadMore()`, `refresh(filters?)`, `loadAll(filters)`, `reset()`
- Persistence des filtres entre `loadMore()` et `refresh()`
- Quand utiliser `load()` vs `refresh()` vs `loadAll()`
- Exemple d'intégration dans un domain store
- Format des filtres (`FilterParams`)

### E3.2 — Guide développeur ACTEE

**Objectif :** Un document concis qui permet à un développeur découvrant le projet de comprendre les conventions en < 10 minutes.

**Contenu :**
- Vue d'ensemble de l'architecture (domain → feature → UI)
- Comment créer un nouveau domaine (checklist)
- Comment créer une nouvelle feature (checklist)
- Conventions de nommage
- Patterns de mutation (`withMutations`, `httpMutation`)
- Patterns de formulaire (`createXxxForm`, `FormFieldComponent`)
- Patterns de liste (DataTable, filtres, pagination)

### E3.3 — Limitations connues & recommandations

**Contenu :**
- **Double appel API filtres :** Les listes paginées nécessitent un second appel sans pagination pour alimenter les selects de filtres. C'est un sujet backend — le front devrait consommer un endpoint dédié `/options` ou `/filters` quand il sera disponible.
- Recommandations d'évolution non implémentées en v2

---

## Résumé des impacts

| Métrique | Valeur |
|----------|--------|
| Composants à externaliser (template/styles) | 28 |
| Fichiers à déplacer (réorganisation) | ~20 |
| Composants avec logique à extraire | 6 |
| Nouveaux composants shared à créer | ~5 (FormField, Tooltip, ApiInspectorContainer, layouts) |
| Migration AuthService → AuthStore | 1 service, impacts sur guards + interceptor + login |
| Documents à rédiger | 3 |

## Vérification post-v2

- [ ] `npx ng build` passe sans erreur
- [ ] `npx ng test --no-watch` passe sans erreur
- [ ] Aucun composant n'injecte directement un store ou un service API
- [ ] Aucun template inline ne subsiste (sauf composants < 5 lignes de template)
- [ ] Les fichiers logiquement liés sont co-localisés
- [ ] `withCursorPagination` est documenté
- [ ] Un guide développeur existe
