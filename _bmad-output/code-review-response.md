# Réponse à la revue de code — Senior Angular Dev

**Date :** 2026-03-09
**Contributeurs :** Winston (Architecte), Amelia (Dev), Barry (Quick Flow), Bob (SM)

---

## Synthèse générale

La revue soulève des points pertinents qui se regroupent en deux catégories :

1. **Quick wins** — corrections rapides, faible risque, impact immédiat
2. **Refactoring structurel** — nécessite un plan d'exécution progressif

Le code est jugé relativement clair par le reviewer, ce qui constitue une base solide pour itérer.

---

## Analyse point par point

### 1. AuthService — Token et stockage

**Constat du reviewer :** Le token est décodé à chaque accès, `getToken` devrait être un getter, les infos utilisateur devraient être dans un store.

**Notre position : ✅ D'accord**

Le token décodé (claims utilisateur) devrait être mis en cache dans un `signal` au moment du login. Un seul décodage, N lectures. Transformer `getToken()` en getter est trivial. Quant au store vs service : dans notre pattern ACTEE, un `AuthStore` basé sur `signalStore` serait effectivement plus cohérent.

**Actions :**
- Créer un `AuthStore` (signalStore) exposant `token`, `decodedClaims`, `userName`, `email` comme signals
- Migrer la logique d'`AuthService` vers ce store
- Remplacer `getToken()` par un getter ou un signal `token()`

---

### 2. LoginComponent dans `core`

**Constat du reviewer :** N'a rien à faire dans `core`.

**Notre position : ✅ D'accord**

Le `LoginComponent` est un composant de feature, pas une infrastructure core.

**Action :**
- Déplacer `src/app/core/login/` → `src/app/features/login/`
- Mettre à jour les imports et le routing

---

### 3. Layout dans `core`

**Constat du reviewer :** Pure UI, ne devrait pas être dans `core`.

**Notre position : ✅ D'accord**

**Action :**
- Déplacer `src/app/core/layout/` → `src/app/shared/layout/`
- Mettre à jour les imports

---

### 4. withCursorPagination

**Constat du reviewer :** Over-engineered, des outils ngrx Signals existent, pas de doc.

**Notre position : ⚠️ Partiellement d'accord**

ngrx SignalStore n'offre pas de support natif pour la pagination par curseur. Notre implémentation répond à un besoin réel de l'API. Cependant, le manque de documentation est un vrai problème — toute infrastructure custom sans doc est de la dette technique.

**Actions :**
- Rédiger une documentation d'utilisation de `withCursorPagination` (JSDoc + un fichier d'exemples)
- Évaluer si les futures versions de ngrx proposent une alternative viable
- Renommer si nécessaire pour plus de clarté (`withCursorPagination` est en fait assez explicite)

---

### 5. Noms de propriétés obscurs

**Constat du reviewer :** `fpOptions`, `atLoading`, etc. sont difficiles à comprendre.

**Notre position : ✅ D'accord partiellement**

Certains noms méritent d'être clarifiés. D'autres sont des conventions internes qui deviennent claires avec le contexte projet. Une documentation des conventions de nommage aiderait les nouveaux arrivants.

**Actions :**
- Auditer les noms de propriétés/méthodes peu explicites
- Renommer les cas les plus obscurs (ex: `fpOptions` → nom plus descriptif)
- Documenter les conventions de nommage du projet

---

### 6. Double appel API pour les filtres

**Constat du reviewer :** Un second appel sans pagination récupère toutes les lignes pour construire les selects de filtres. Pas idéal.

**Notre position : ✅ D'accord — problème d'architecture**

C'est un problème de scalabilité. Récupérer toutes les lignes pour extraire les valeurs distinctes de filtres ne passera pas à l'échelle.

**Actions :**
- Demander (ou créer) un endpoint API dédié retournant les valeurs distinctes pour les filtres
- En attendant, mettre en cache côté client les options de filtre pour éviter les appels redondants
- Supprimer les appels "fetch all" une fois l'endpoint dédié disponible

---

### 7. Façade trop lourde — besoin de use-cases

**Constat du reviewer :** La façade porte trop d'intentions métier. Les méthodes devraient être dans des use-cases dédiés.

**Notre position : ⚠️ D'accord sur le fond, nuance sur la forme**

Le pattern use-case (un fichier = une interaction métier) apporte de la clarté, mais doit être appliqué avec mesure. Pour les opérations simples (CRUD), la façade reste le bon niveau d'abstraction. Pour les opérations complexes (ex: gestion des indicateurs avec logique conditionnelle), l'extraction en use-case est justifiée.

**Actions :**
- Identifier les méthodes de façade contenant de la logique métier complexe
- Extraire ces méthodes dans des fichiers use-case dédiés (ex: `actions/use-cases/toggle-indicator.ts`)
- Conserver les opérations simples dans la façade
- Commencer par le domaine `actions` comme implémentation de référence

---

### 8. Logique métier dans les composants

**Constat du reviewer :** Les composants contiennent trop de logique. Ils devraient uniquement exposer des propriétés de façade et appeler ses méthodes.

**Notre position : ✅ D'accord**

Un composant Angular devrait être un "thin controller" : il bind des signals et dispatch des actions via la façade, point final.

**Actions :**
- Auditer chaque composant pour identifier la logique métier embarquée
- Migrer cette logique vers le store ou des use-cases
- Les composants ne doivent contenir que : injection de la façade, bindings template, appels de méthodes façade

---

### 9. Templates inline vs fichiers HTML séparés

**Constat du reviewer :** Les templates inline sont une mauvaise idée, un fichier HTML séparé est plus maintenable.

**Notre position : ⚠️ Partiellement d'accord**

Pour les petits composants (< 30 lignes de template), l'inline est acceptable et réduit le nombre de fichiers. Pour les composants avec des templates conséquents, l'extraction est préférable.

**Actions :**
- Extraire les templates inline qui dépassent ~30 lignes dans des fichiers `.html` dédiés
- Conserver l'inline pour les petits composants (boutons, badges, etc.)

---

### 10. Composants au périmètre trop large

**Constat du reviewer :** Les composants devraient être découpés davantage. Les domaines ayant la même structure, les blocs UI pourraient être réutilisables.

**Notre position : ✅ D'accord**

C'est le point le plus impactant. Des composants partagés (filter-bar, data-table, detail-panel, action-toolbar) réduiraient la duplication entre domaines.

**Actions :**
- Identifier les blocs UI communs entre domaines (actions, agents, etc.)
- Créer des composants shared à responsabilité limitée : `FilterBarComponent`, `DataTableComponent`, `DetailPanelComponent`, etc.
- Refactorer un domaine pilote (`actions`) puis appliquer le pattern aux autres

---

### 11. Stores comme passe-plat

**Constat du reviewer :** Les stores n'ont qu'un rôle de passe-plat, la logique métier devrait y résider.

**Notre position : ✅ D'accord**

Dans le pattern ACTEE, le store est le gardien de l'état et de la logique métier. S'il ne fait que relayer des appels API, il ne remplit pas son rôle.

**Actions :**
- Migrer la logique métier des façades et composants vers les stores
- Les stores doivent gérer : transformations de données, dérivations d'état (`computed`), validations métier
- Les façades deviennent un point d'entrée léger pour les composants

---

## Plan d'action priorisé

### Sprint 1 — Quick Wins (estimation : 1-2 jours)

| # | Tâche | Risque | Effort |
|---|-------|--------|--------|
| 1 | `AuthService` → `AuthStore` + cache du token décodé | Faible | Moyen |
| 2 | Déplacer `LoginComponent` → `features/login` | Faible | Faible |
| 3 | Déplacer `Layout` → `shared/layout` | Faible | Faible |
| 4 | `getToken()` → getter/signal | Faible | Faible |
| 5 | Extraire les templates inline > 30 lignes | Faible | Faible |
| 6 | Documenter `withCursorPagination` | Faible | Moyen |

### Sprint 2 — Refactoring pilote sur le domaine `actions` (estimation : 3-5 jours)

| # | Tâche | Risque | Effort |
|---|-------|--------|--------|
| 7 | Migrer la logique métier des composants → store/use-cases | Moyen | Élevé |
| 8 | Extraire les use-cases complexes de la façade | Moyen | Moyen |
| 9 | Découper les composants larges en sous-composants | Moyen | Élevé |
| 10 | Renommer les propriétés/méthodes obscures | Faible | Moyen |

### Sprint 3 — Généralisation et infrastructure (estimation : 3-5 jours)

| # | Tâche | Risque | Effort |
|---|-------|--------|--------|
| 11 | Créer les composants shared réutilisables entre domaines | Moyen | Élevé |
| 12 | Appliquer le pattern du domaine pilote aux autres domaines | Moyen | Élevé |
| 13 | Endpoint API dédié pour les valeurs de filtres | Moyen | Moyen |
| 14 | Documenter les conventions de nommage et patterns | Faible | Moyen |

---

## Principes directeurs pour la suite

1. **Un domaine pilote d'abord** — Refactorer `actions` entièrement, valider le pattern, puis répliquer
2. **Ne pas tout casser d'un coup** — Chaque PR doit être autonome et testable
3. **Tests à chaque étape** — Aucun refactoring sans couverture de tests existante ou nouvelle
4. **Documentation au fil de l'eau** — Chaque pattern établi est documenté immédiatement
