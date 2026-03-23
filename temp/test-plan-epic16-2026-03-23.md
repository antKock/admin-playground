# Plan de test — Epic 16 : ACTEE Compliance & Reusable Patterns

**Date :** 2026-03-23
**Branche :** staging
**Environnement :** https://laureatv2-api-staging.osc-fr1.scalingo.io
**Tests automatisés :** 89 fichiers, 1041 tests — tous passent

---

## Niveau de risque de régression : MOYEN-HAUT

| Story | Périmètre | Risque | Raison |
|-------|-----------|--------|--------|
| 16.1 | Facades agents/communautés | Faible | Refactoring interne, même comportement visible |
| 16.2 | Cartes indicateurs (détail modèle d'action) | Moyen | Extraction ~40 lignes de logique imbriquée — affichage des cartes pourrait casser |
| 16.3 | Formulaire modèle d'indicateur | Moyen | Filtrage enfants + préparation submit déplacés au facade |
| **16.4** | **Auth : login, logout, guards, interceptor** | **Haut** | **Migration complète de AuthService → AuthStore + expiration JWT + guards modifiés** |
| 16.5 | Validation de tous les 10 formulaires | Moyen | Nouveau composant FormField remplace showError() dans chaque formulaire |
| 16.6 | Tooltips | Faible | Remplacement CSS → directive, cosmétique |
| 16.7 | API Inspector | Faible | Outil dev déplacé dans le layout |
| 16.8 | Layouts partagés (agents) | Faible | Nouveaux composants, migration PoC agents uniquement |

**Risque principal :** Story 16.4 (auth) touche le chemin critique d'accès à l'application. Story 16.5 a un large périmètre (10 formulaires modifiés).

---

## 1. Authentification (Story 16.4) — RISQUE HAUT

> Migration AuthService → AuthStore (signalStore). Login, logout, gardes de routes, intercepteur HTTP, gestion des tokens JWT.

### 1.1 Login

| # | Action | Résultat attendu | OK |
|---|--------|-------------------|----|
| 1 | Aller sur `/login` sans être connecté | La page de connexion s'affiche | |
| 2 | Se connecter avec des identifiants valides (admin) | Redirection vers `/`, email visible dans le header | |
| 3 | Se connecter avec des identifiants invalides | Message d'erreur affiché, pas de redirection | |
| 4 | Se connecter avec un utilisateur `collectivite` | Rejeté : redirection vers `/login` (pas d'accès admin) | |

### 1.2 Session et persistance

| # | Action | Résultat attendu | OK |
|---|--------|-------------------|----|
| 5 | Se connecter, puis recharger la page (F5) | La session persiste — pas de retour à `/login` | |
| 6 | Se connecter, fermer l'onglet, en ouvrir un nouveau | La session persiste (token dans localStorage) | |
| 7 | DevTools > Application > localStorage : supprimer `laureat_admin_jwt`, recharger | Redirection vers `/login` | |
| 8 | DevTools > localStorage : injecter un token expiré (`exp` dans le passé), recharger | Redirection vers `/login` (token rejeté, supprimé du localStorage) | |

### 1.3 Logout

| # | Action | Résultat attendu | OK |
|---|--------|-------------------|----|
| 9 | Cliquer "Déconnexion" dans le header | Redirection vers `/login`, token supprimé du localStorage | |
| 10 | Après déconnexion, utiliser le bouton retour du navigateur | Pas d'accès aux pages protégées — redirection `/login` | |

### 1.4 Rafraîchissement de token

| # | Action | Résultat attendu | OK |
|---|--------|-------------------|----|
| 11 | Rester connecté suffisamment longtemps pour que le token expire | Le refresh se déclenche automatiquement (vérifier réseau : POST `/auth/refresh`) | |
| 12 | Si le refresh échoue (cookie expiré) | Redirection vers `/login` avec `returnUrl` | |

### 1.5 Gardes de routes

| # | Action | Résultat attendu | OK |
|---|--------|-------------------|----|
| 13 | Non connecté : naviguer vers `/agents` | Redirection vers `/login?returnUrl=%2Fagents` | |
| 14 | Se connecter après redirection du #13 | Retour vers `/agents` (returnUrl respecté) | |
| 15 | Connecté : naviguer vers `/login` | Redirection vers `/` (loginGuard) | |

---

## 2. Validation des formulaires (Story 16.5) — RISQUE MOYEN

> Nouveau `FormFieldComponent` remplace les méthodes `showError()` locales. Chaque formulaire doit afficher les erreurs de validation correctement.

### 2.1 Affichage des erreurs

| # | Page | Action | Résultat attendu | OK |
|---|------|--------|-------------------|----|
| 16 | Créer un agent | Soumettre le formulaire vide | Bordures rouges sur les champs requis, messages d'erreur visibles | |
| 17 | Créer un modèle d'action | Soumettre le formulaire vide | Bordures rouges + messages d'erreur | |
| 18 | Créer un modèle d'indicateur | Soumettre le formulaire vide | Bordures rouges + messages d'erreur | |
| 19 | Créer une communauté | Soumettre avec le nom vide | Bordure rouge sur le champ nom | |
| 20 | Créer un programme de financement | Soumettre le formulaire vide | Bordures rouges + messages d'erreur | |
| 21 | Créer un utilisateur | Soumettre le formulaire vide | Bordures rouges + messages d'erreur | |
| 22 | Créer un thème d'action | Soumettre le formulaire vide | Bordures rouges + messages d'erreur | |
| 23 | Créer un modèle de dossier | Soumettre le formulaire vide | Bordures rouges + messages d'erreur | |
| 24 | Créer un site | Soumettre le formulaire vide | Bordures rouges + messages d'erreur | |
| 25 | Créer un bâtiment | Soumettre le formulaire vide | Bordures rouges + messages d'erreur | |

### 2.2 Correction et soumission

| # | Page | Action | Résultat attendu | OK |
|---|------|--------|-------------------|----|
| 26 | Créer un agent | Remplir les champs obligatoires après erreur | Les bordures rouges disparaissent, soumission réussie | |
| 27 | Modifier un agent existant | Charger le formulaire pré-rempli | Les valeurs existantes sont affichées correctement dans les champs | |
| 28 | Modifier un modèle d'action | Modifier un champ + Enregistrer | Toast succès, valeur persistée | |

### 2.3 Raccourcis clavier (Story 16.8 — FormPageLayout)

| # | Page | Action | Résultat attendu | OK |
|---|------|--------|-------------------|----|
| 29 | Formulaire agent (mode édition) | Modifier un champ, puis Cmd+S / Ctrl+S | Le formulaire se soumet (save-bar se déclenche) | |
| 30 | Formulaire agent (mode édition) | Cmd+S sans modification | Rien ne se passe (formulaire non dirty), pas de dialogue navigateur "Enregistrer la page" | |
| 31 | Formulaire agent (mode création) | Appuyer Escape sans modification | Retour à la liste agents | |
| 32 | Formulaire agent | Focus dans un champ `<input>`, appuyer Escape | Le champ perd le focus mais **pas** de navigation — on reste sur le formulaire | |

---

## 3. Cartes indicateurs — Détail modèle d'action (Stories 16.2, 16.3)

> Logique `serverCards` extraite vers `buildIndicatorCards()`. Les cartes d'indicateurs doivent s'afficher identiquement.

### 3.1 Affichage des cartes

| # | Action | Résultat attendu | OK |
|---|--------|-------------------|----|
| 33 | Ouvrir un modèle d'action avec indicateurs attachés | Les cartes d'indicateurs s'affichent avec nom, label technique, type | |
| 34 | Vérifier les icônes de paramètres (obligatoire, masqué, désactivé) | Les icônes reflètent l'état des règles (on/off/rule) | |
| 35 | Ouvrir un modèle avec un indicateur groupe ayant des enfants | Les enfants s'affichent sous l'indicateur parent | |

### 3.2 Édition de paramètres

| # | Action | Résultat attendu | OK |
|---|--------|-------------------|----|
| 36 | Modifier `hidden_rule` d'un indicateur → Enregistrer | Toast succès, paramètre persisté après rechargement | |
| 37 | Modifier `required_rule` avec du JSON invalide → Enregistrer | Toast erreur "Corrigez les erreurs JSON avant d'enregistrer" | |
| 38 | Modifier `default_value_rule` avec du JSON invalide → Enregistrer | Toast erreur (ce champ est maintenant validé — c'était un bug corrigé) | |
| 39 | Modifier un paramètre puis "Annuler" (discard) | Les modifications sont annulées, retour à l'état serveur | |
| 40 | Modifier un paramètre, naviguer sans enregistrer | Le compteur de modifications non sauvegardées s'affiche | |

### 3.3 Attacher / Détacher

| # | Action | Résultat attendu | OK |
|---|--------|-------------------|----|
| 41 | Attacher un nouvel indicateur au modèle | Toast succès, indicateur apparaît dans la liste | |
| 42 | Détacher un indicateur | Toast succès, indicateur disparaît de la liste | |
| 43 | Réordonner les indicateurs par drag-and-drop | L'ordre est persisté après rechargement | |

---

## 4. Filtrage et logique extraite aux facades (Stories 16.1, 16.3)

### 4.1 Communautés — Gestion des utilisateurs

| # | Page | Action | Résultat attendu | OK |
|---|------|--------|-------------------|----|
| 44 | Détail communauté | Ouvrir le picker "Ajouter un utilisateur" | La liste d'utilisateurs s'affiche | |
| 45 | Détail communauté | Taper dans le champ de recherche utilisateur | La liste filtre par nom/email en temps réel | |
| 46 | Détail communauté | Assigner un utilisateur | L'utilisateur apparaît dans la liste des membres | |
| 47 | Détail communauté | Retirer un utilisateur (confirmation) | L'utilisateur disparaît de la liste des membres | |
| 48 | Détail communauté | Utilisateur déjà assigné dans le picker | L'utilisateur est grisé / marqué comme assigné | |

### 4.2 Agents — Liste et labels

| # | Page | Action | Résultat attendu | OK |
|---|------|--------|-------------------|----|
| 49 | Liste agents | Vérifier la colonne "Type d'agent" | Affiche "Conseiller en performance énergétique" et "Autre" (pas les codes bruts) | |
| 50 | Détail agent | Vérifier le champ "Type d'agent" dans les métadonnées | Label traduit correctement | |
| 51 | Liste agents | Vérifier la colonne "Nom" | Affiche prénom + nom (ou "—" si vide) | |

### 4.3 Modèles d'indicateur — Formulaire groupe

| # | Page | Action | Résultat attendu | OK |
|---|------|--------|-------------------|----|
| 52 | Formulaire modèle d'indicateur | Sélectionner type "Groupe" | Le picker d'indicateurs enfants apparaît | |
| 53 | Formulaire modèle d'indicateur | Rechercher dans le picker enfants | Le filtre fonctionne par nom | |
| 54 | Formulaire modèle d'indicateur | Attacher des enfants puis soumettre | Les enfants sont persistés sur le modèle | |
| 55 | Formulaire modèle d'indicateur (édition) | Modifier un groupe existant | Les enfants existants sont pré-chargés | |

---

## 5. Tooltips (Story 16.6)

| # | Page | Action | Résultat attendu | OK |
|---|------|--------|-------------------|----|
| 56 | Détail modèle d'action | Survoler les icônes de paramètres d'indicateur | Tooltip avec le nom du paramètre apparaît | |
| 57 | Détail modèle d'action | Quitter le survol | Le tooltip disparaît immédiatement | |
| 58 | Détail communauté (utilisateurs) | Survoler le bouton "Retirer" | Tooltip "Retirer l'utilisateur" apparaît | |
| 59 | Navigation au clavier | Tab vers une icône de paramètre, puis Escape | Le tooltip apparaît au focus, disparaît sur Escape | |

---

## 6. API Inspector dans le layout (Story 16.7)

| # | Action | Résultat attendu | OK |
|---|--------|-------------------|----|
| 60 | Naviguer sur n'importe quelle page de détail | La section "Inspecteur API" est visible en bas de page | |
| 61 | Ouvrir l'inspecteur après une requête API | URL de la requête et corps de la réponse affichés | |
| 62 | Naviguer entre différentes pages de détail | L'inspecteur se met à jour avec la dernière requête | |
| 63 | Cliquer "Copier" dans l'inspecteur | Le JSON est copié dans le presse-papiers | |

---

## 7. Non-régression générale

| # | Fonctionnalité | Action | Résultat attendu | OK |
|---|----------------|--------|-------------------|----|
| 64 | Toutes les listes | Charger chaque page de liste (10 entités) | Toutes les listes chargent sans erreur console | |
| 65 | Tous les détails | Ouvrir un élément de chaque entité | Les métadonnées s'affichent correctement | |
| 66 | Navigation agent | Liste → Détail → Modifier → Retour au détail → Retour à la liste | Navigation fluide, pas de stale data | |
| 67 | Breadcrumbs agent | Vérifier le fil d'Ariane sur détail et formulaire agent | Liens corrects, nom de l'agent visible | |
| 68 | Sidebar | Vérifier les 11 items de navigation | Tous les liens fonctionnent et mènent aux bonnes pages | |
| 69 | Transitions de statut | Publier / Désactiver / Activer un modèle d'action | Transitions fonctionnelles, toast de succès | |
| 70 | Transitions de statut agent | Compléter / Supprimer un agent | Transitions fonctionnelles | |
| 71 | Pagination | Scroller une liste longue (agents ou modèles d'action) | "Charger plus" fonctionne, compteur "X sur Y" correct | |
| 72 | Changements non sauvegardés | Modifier un formulaire, essayer de naviguer | Dialogue de confirmation "unsaved changes" | |
| 73 | Erreurs réseau | DevTools > Network > Offline, essayer une action | Toast "Connection lost" sans crash | |
