# Guidelines frontend

## Architecture Frontend – Principes & Conventions

### Objectif

Cette application suit une architecture visant à :

- séparer strictement **métier / orchestration / UI**
- garantir que toute mutation d’état passe par les **stores**
- rendre les composants **réutilisables**
- permettre des **tests sans Angular**
- maintenir une **complexité maîtrisée** à long terme

---

## Vue d’ensemble

```
Domain (source de vérité)
   ↓
Feature (bloc fonctionnel)
   ↓
UI
```

Les pages ne contiennent **aucune logique métier**.  
Elles servent uniquement à composer des features et gérer le layout.

---

## Structure des dossiers

```text
src/app/
├─ domains/              # cœur métier
│  └─ sites/
│     ├─ site.store.ts
│     ├─ site.api.ts
│     ├─ site.models.ts
│     ├─ forms/
│     └─ use-cases/
├─ features/             # blocs fonctionnels réutilisables
│  └─ site-pdl/
│     ├─ site-pdl.store.ts
│     ├─ site-pdl.facade.ts
│     ├─ use-cases/
│     └─ ui/
│        └─ pdl-list.component.ts
└─ pages/                # routes = layout only
   └─ sites/
      └─ sites.page.ts
```

---

## Domain (domains/)

Le domain est la **source de vérité**.

Il contient : 
- models métier 
- stores NgRx Signals 
- APIs 
- forms 
- use-cases métier purs

------------------------------------------------------------------------

### Stores de domain

Les domain stores sont construits avec `signalStore` et utilisent les
helpers de la librairie ngrx-toolkit.

Ils peuvent être composés avec :

-   `withState`
-   `withProps`
-   `withFeature` (ex : `withCursorPagination`)
-   `withComputed`
-   `withMethods`
-   `withMutations`

------------------------------------------------------------------------

### Récupération de données --- withCursorPagination & rxMethod

La récupération de données depuis l'API se fait via :

-   **`withCursorPagination`** — un `signalStoreFeature` réutilisable
    pour les listes paginées (cursor-based)
-   **`rxMethod`** — pour les appels unitaires (ex : chargement d'un
    détail par ID)

#### withCursorPagination

Ce mécanisme permet :

-   de connecter un store à un loader HTTP paginé
-   de gérer automatiquement :
    -   `items`, `cursor`, `hasMore`
    -   `isLoading`, `error`
    -   `isEmpty`, `totalLoaded`
-   d'exposer les méthodes : `load()`, `loadMore()`, `refresh()`,
    `reset()`

Le loader est défini dans `{domain_name}.api.ts` et passé en
configuration :

```ts
withFeature((store) =>
  withCursorPagination<Entity>({
    loader: (params) => entityListLoader(store._http, params),
  }),
)
```

#### rxMethod (détail)

Le chargement d'une entité unique utilise `rxMethod` dans
`withMethods` :

```ts
selectById: rxMethod<string>(
  pipe(
    tap(() => patch(store, { isLoadingDetail: true })),
    switchMap((id) =>
      loadEntity(store._http, id).pipe(
        tap((item) => patch(store, { selectedItem: item, isLoadingDetail: false, detailError: null })),
        catchError((err) => {
          patch(store, { detailError: err?.message ?? 'Failed to load item', isLoadingDetail: false, selectedItem: null });
          return EMPTY;
        }),
      ),
    ),
  ),
),
```

Le domain store ne fait jamais d'appel HTTP direct :\
il consomme uniquement des loaders et des mutation requests exposés par
l'API du domain.

------------------------------------------------------------------------

### Mutations --- withMutations & httpMutation

Les mutations (POST, PATCH, DELETE) passent exclusivement par :

-   `withMutations`
-   des `httpMutation`

Principe :

-   Les mutations HTTP sont définies dans `{domain_name}.api.ts`
-   Elles exposent des `HttpMutationRequest`
-   Le store les enregistre via `withMutations`
-   Les composants ou facades déclenchent uniquement les intentions
-   Le domain store reste le point unique de mutation d'état

Cela garantit :

-   une traçabilité claire des mutations
-   une séparation stricte entre I/O et état
-   aucune logique HTTP dispersée dans les features

------------------------------------------------------------------------

### API du domain --- `{domain_name}.api.ts`

Chaque domain possède un fichier :

{domain_name}.api.ts

Il expose :

1.  Des loaders\
    Pour la récupération de données (listes paginées, détails, etc.)\
    Ces loaders sont consommés par `withCursorPagination` et `rxMethod`.

2.  Des `HttpMutationRequest`\
    Pour :

    -   POST
    -   PATCH
    -   DELETE

`HttpMutationRequest` est utilisé via `httpMutation`.

------------------------------------------------------------------------

### Règles

-   Un domain store :
    -   expose de l'état
    -   intègre la pagination via `withFeature` (`withCursorPagination`)
    -   enregistre ses mutations via `withMutations`
    -   ne contient aucun scénario
    -   ne déclenche aucun effet I/O direct
-   Un use-case de domain :
    -   modifie un domain store
    -   exprime une intention métier
    -   est testable sans Angular
    -   ne peut être dépendant d'un autre use-case
-   Toutes les opérations HTTP :
    -   sont définies dans `{domain_name}.api.ts`
    -   ne sont jamais appelées directement depuis une feature
    -   transitent toujours par le domain store

---

## Features (features/)

Une feature est un **bloc fonctionnel réutilisable**.

Elle représente :
- une sous‑page
- un widget métier
- une section fonctionnelle autonome

Elle contient :
- un store dérivé (**signalStore**)
- une **facade / orchestrateur**
- (optionnellement) des use‑cases locaux
- des composants UI

---

## Store dérivé (*.store.ts) — signalStore

**ViewModel Store du bloc**

### Rôle
- adapter les données du domain
- exposer uniquement des `computed`
- agréger plusieurs domain stores
- **ne jamais muter l’état métier**

```ts
export const SitePdlStore = signalStore(
  withComputed((store, siteStore = inject(SiteStore)) => ({
    rows: computed(() =>
      siteStore.pdls()
        .filter(p => p.active)
        .map(p => ({ id: p.id, name: p.label }))
    ),
  }))
);
```

### Règles
- `signalStore` uniquement
- `computed` uniquement
- aucune mutation
- aucune API
- aucun appel HTTP

---

## Facade / Orchestrateur (*.facade.ts)

**Point d’entrée unique pour l’UI**

### Rôle
- exposer les données du store dérivé
- exposer des intentions UI
- orchestrer les scénarios simples
- déléguer aux use‑cases si nécessaire

```ts
export class SitePdlFacade {
  readonly rows = this.store.rows;

  load() {
    this.siteStore.startLoadingPdl();
  }

  edit(id: string) {
    this.siteStore.editPdl(id);
  }
}
```

### Règles
- aucune mutation directe du store dérivé
- toute mutation passe par un domain store
- aucune dépendance UI
- testable sans Angular

---

## UI (ui/)

Les composants UI :
- ne parlent **qu’à la facade**
- peuvent contenir :
  - logique de formulaire
  - validation UI
  - affichage conditionnel
- n’importent jamais :
  - store
  - use‑case
  - service métier

---

## Pages (pages/)

Les pages correspondent strictement aux routes.

Elles servent uniquement à :
- composer des features
- gérer le layout

---

## Interfaces réactives & appels asynchrones

### Principes

-   Aucun Observable exposé à l'UI
-   La réactivité UI est assurée exclusivement par des Signals
-   Les appels HTTP passent par :
    -   des loaders (`withCursorPagination`, `rxMethod`)
    -   des `HttpMutationRequest` (`withMutations`)

### Appels asynchrones

-   Les resources encapsulent les appels GET
-   Les mutations encapsulent les POST, PATCH, DELETE
-   Les Promises ne sont jamais stockées dans l'état
-   Le store reste purement déclaratif

### Réactivité avec Signals

-   Les stores exposent :
    -   des signal
    -   des computed
-   Les composants UI consomment uniquement des signals synchrones
-   Aucun subscribe manuel
-   Aucun async pipe

## Règles d’or (non négociables)

- Les pages ne contiennent aucune logique métier
- L’UI ne parle qu’à une facade
- Toute mutation passe par un domain store
- Le domain est la seule source de vérité
- Les stores dérivés sont en lecture seule
- Les use‑cases de feature sont optionnels

---

## Mot de la fin

Cette architecture :
- minimise la complexité initiale
- évite la sur‑ingénierie
- protège le métier
- reste évolutive
- impose des frontières claires

**On commence simple (facade)**  
**On extrait quand la complexité l’exige (use‑cases)**