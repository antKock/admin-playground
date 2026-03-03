# Brief Projet — Interface d'Administration Laureat v2

> **Version** : 1.0 — Mars 2026
> **Auteur** : [À compléter]
> **Statut** : Cadrage initial

---

## 1. Contexte

La plateforme **Laureat** gère les demandes de subvention de collectivités locales dans le cadre de programmes de financement (type ACTEE). Elle repose sur un système configurable de **modèles** et d'**indicateurs** qui permet aux administrateurs de définir les formulaires, les règles métier et les workflows sans développement spécifique.

Un **back-end API REST** (FastAPI / Python) est déjà en place et opérationnel, avec une documentation OpenAPI complète. Il manque aujourd'hui l'**interface d'administration** permettant aux équipes internes de gérer la configuration de la plateforme.

## 2. Objectif

Créer une **application front-end Angular** constituant le backoffice d'administration de la plateforme Laureat. Cette interface permet le CRUD (Create, Read, Update, Delete) des objets de configuration, en consommant exclusivement l'API REST existante.

L'outil est **semi-professionnel**, à usage **interne uniquement**. Il n'est pas exposé aux utilisateurs finaux (collectivités). Le niveau de sécurité requis est standard (authentification JWT, pas de contraintes réglementaires spécifiques).

## 3. Périmètre fonctionnel

### 3.1 Objets d'administration (≈ 7 entités)

| # | Objet | Description | Complexité | Priorité |
|---|-------|-------------|------------|----------|
| 1 | **Funding Programs** | Programmes de financement (CRUD simple) | Faible | P1 |
| 2 | **Action Themes** | Thématiques d'actions avec workflow de statuts (draft → published → disabled) + duplication | Faible-Moyenne | P2 |
| 3 | **Action Models** | Modèles d'actions finançables. Relations vers Funding Program, Action Theme, et Indicator Models | Moyenne | P3 |
| 4 | **Folder Models** | Modèles de dossiers de candidature. Relations vers Funding Programs | Moyenne | P3 |
| 5 | **Indicator Models** | Modèles d'indicateurs (champs réutilisables). Types, sous-types, associations aux Action Models, règles JSONLogic | Élevée | P4 |
| 6 | **Communities** | Collectivités. CRUD + affectation/retrait d'utilisateurs | Moyenne | P3 |
| 7 | **Agents** | Agents des collectivités. CRUD + gestion de statuts | Faible-Moyenne | P3 |

**Transversal** : Users / Roles (lecture de la liste des utilisateurs, changement de rôle).

### 3.2 Fonctionnalités par objet

Chaque objet dispose a minima de :

- **Liste paginée** avec pagination cursor-based (conforme à l'API)
- **Vue détail / lecture**
- **Formulaire de création**
- **Formulaire d'édition**
- **Suppression** avec confirmation
- **Filtres** quand l'API les expose (par statut, par programme, etc.)

Fonctionnalités spécifiques :

- **Action Themes** : transitions de statut via endpoints dédiés (publish, disable, activate), duplication
- **Action Models** : sélection d'un Funding Program et d'un Action Theme (dropdowns), association d'Indicator Models (multi-select ou drag & drop)
- **Indicator Models** : éditeur de règles JSONLogic (saisie directe JSON avec validation), gestion des types/sous-types
- **Communities** : gestion de la relation users ↔ communities

### 3.3 Hors périmètre (v1)

- Interface utilisateur final (portail collectivités)
- Gestion des dossiers et actions (instances) — uniquement les modèles
- Historique / versioning (les endpoints existent mais ne sont pas prioritaires pour l'admin)
- Génération de conventions
- Gestion des dépenses

## 4. Stack technique

| Composant | Choix |
|-----------|-------|
| **Framework** | Angular 20 (standalone components, signals) |
| **Langage** | TypeScript (strict mode) |
| **UI** | Design system custom léger, soigné mais sobre |
| **State** | Signals Angular natifs (pas de NgRx) |
| **HTTP** | HttpClient + interceptor JWT |
| **Routing** | Lazy loading par module fonctionnel |
| **JSONLogic** | Éditeur JSON (Monaco/CodeMirror) + validation via `json-logic-js` |
| **Back-end** | Aucun — front-only, consomme l'API REST existante |
| **API** | FastAPI sur `laureatv2-api-staging.osc-fr1.scalingo.io` |
| **Auth** | JWT via `/auth/login` (email/password) |

### 4.1 Principes techniques

- **Standalone components** exclusivement (pas de NgModule)
- **Services génériques** typés pour le CRUD et la pagination cursor-based
- **Interceptor HTTP** pour injection automatique du Bearer token
- **URL API configurable** via `environment.ts`
- **Structure de projet** : app Angular simple (`ng new`), pas de monorepo
- **Composants réutilisables** : table paginée, formulaire CRUD, dialog de confirmation, badge de statut

## 5. Design & UX

### 5.1 Philosophie

Backoffice soigné mais sobre. Pas de design system externe lourd (Material/PrimeNG). Un système léger et custom qui reste professionnel sans tomber dans le générique.

### 5.2 Layout

- **Sidebar** de navigation avec les différentes sections (objets d'admin)
- **Header** avec info utilisateur connecté et logout
- **Zone de contenu** principale
- Responsive non prioritaire (usage desktop principalement)

### 5.3 Patterns UI récurrents

- **Page liste** : tableau avec colonnes triables, pagination, bouton "Créer", filtres éventuels
- **Page détail/édition** : formulaire structuré, boutons d'action contextuels (publier, archiver…)
- **Badges de statut** : couleurs distinctes par statut (draft, published, disabled, deleted)
- **Dialogs** : confirmation de suppression, transitions de statut
- **Toasts/notifications** : feedback sur les actions (succès, erreur)

## 6. API — Points d'attention

### 6.1 Pagination cursor-based

Toutes les listes utilisent une pagination par curseur (`cursor` + `limit`), pas par offset. Le front doit gérer le pattern `PaginatedResponse<T>` retourné par l'API.

### 6.2 Écarts spec fonctionnelle vs API actuelle

La documentation fonctionnelle décrit des concepts plus riches que ce que l'API expose actuellement :

- Les **types d'indicateurs** dans l'API sont limités à `TEXT` et `NUMBER` ; la spec fonctionnelle prévoit aussi : Choix par liste, Oui/Non, Date, Téléversement, Groupement
- Les **sections** d'indicateurs dans les modèles ne semblent pas encore structurées dans l'API
- Les **statuts des modèles** (brouillon/publié/archivé) ne sont pas uniformément présents

**Règle** : on construit le front sur ce que l'API supporte réellement. Les concepts à venir de la spec fonctionnelle seront intégrés quand l'API évoluera.

### 6.3 Relations entre objets

- `ActionModel` → 1 `FundingProgram` + 1 `ActionTheme` + N `IndicatorModels`
- `FolderModel` → N `FundingPrograms`
- `IndicatorModel` → N `ActionModels` (association bidirectionnelle avec métadonnées : visibility_rule, required_rule, etc.)
- `Community` → N `Users`
- `Agent` → 1 `Community`

### 6.4 Règles JSONLogic

Les règles avancées (visibilité, valeur par défaut, obligation, éditabilité) sur les indicateurs sont exprimées en **JSONLogic**. L'administrateur saisira directement du code JSONLogic dans un éditeur intégré. Le front doit :

- Afficher un éditeur de code JSON avec coloration syntaxique
- Valider la syntaxe JSON à la saisie
- Optionnel v1 : prévisualiser l'évaluation de la règle

## 7. Plan de développement

### Phase 1 — Fondations + Funding Programs

Objectif : poser toute l'architecture et livrer le premier CRUD fonctionnel.

- Setup du projet Angular 20
- Design system de base (couleurs, typographie, composants élémentaires)
- Layout admin (sidebar, header, routing)
- Service API générique (HTTP, pagination cursor, interceptor auth)
- Page de login
- CRUD complet Funding Programs (liste, détail, création, édition, suppression)

### Phase 2 — Action Themes

- CRUD Action Themes
- Gestion du workflow de statuts (publish, disable, activate)
- Duplication
- Badges de statut

### Phase 3 — Action Models, Folder Models, Communities, Agents

- CRUD Action Models avec relations (dropdown Funding Program, dropdown Action Theme)
- Association Indicator Models aux Action Models
- CRUD Folder Models avec association Funding Programs
- CRUD Communities avec gestion users
- CRUD Agents

### Phase 4 — Indicator Models + Règles

- CRUD Indicator Models
- Éditeur JSONLogic intégré
- Gestion des associations avec métadonnées (visibility_rule, required_rule, etc.)
- Validation des règles côté front

## 8. Livrables

| Livrable | Format |
|----------|--------|
| Code source | Projet Angular 20 (repo Git) |
| Documentation technique | README + commentaires inline |
| Brief projet | Ce document (MD) |

## 9. Documents de référence

Les documents suivants sont fournis séparément et constituent la base de connaissance du projet :

| Document | Contenu |
|----------|---------|
| `openapi.json` | Spécification OpenAPI 3.1 complète de l'API Laureat |
| `spec_modeles.md` | Documentation fonctionnelle — Modèles |
| `spec_indicateurs.md` | Documentation fonctionnelle — Indicateurs |
| `spec_regles.md` | Documentation fonctionnelle — Règles avancées (JSONLogic) |
| `spec_modeles_indicateurs.md` | Documentation fonctionnelle — Vue d'ensemble Modèles + Indicateurs |
| Documentation JSONLogic | https://jsonlogic.com/ |

---

> **Note** : Ce document est un cadrage initial. Il sera enrichi au fil du développement en fonction des retours et des évolutions de l'API.
