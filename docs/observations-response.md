 # Analyse des Observations API

 _Vérification croisée du document `api-observations.md` contre le codebase actuel._

 **Date d'analyse :** 2026-03-05
 **Branche analysée :** LV2-162

 ---

 ## Synthese

 Sur les 14 points soulevés, **13 sont toujours d'actualité**. Seul le point 14 (association metadata) est résolu — les 6 champs existent bien dans le modèle et les schemas.

 ---

 ## Verification point par point

 ### 1. Token Refresh — Non resolu

 Aucun endpoint `/auth/refresh` n'existe. Les endpoints d'authentification disponibles sont : `POST /auth/register`, `POST /auth/login`, `POST /auth/token`, `GET /auth/me`, `POST /auth/logout`, `GET /auth/users`, `GET /auth/protected`.

 Indispensable pour une bonne UX. Sans refresh token, l'utilisateur est redirigé vers le login à chaque expiration.

 ### 2. ActionModel status — Non resolu (BLOCKER)

 Le modèle `ActionModel` n'a **pas** de champ `status`. Les champs disponibles sont : `id`, `name`, `description`, `created_at`, `updated_at`, `funding_program_id`, `action_theme_id`.

 Le document propose deux options pertinentes :
 - **Option A :** Ajouter `status` + endpoints de transition (comme ActionTheme)
 - **Option B :** Confirmer que le lifecycle est hérité du parent ActionTheme

 L'Option B mérite d'être tranchée côté produit avant de coder quoi que ce soit.

 ### 3. IndicatorModel status — Non resolu (BLOCKER)

 Le modèle `IndicatorModel` n'a **pas** de champ `status`. Les champs sont : `id`, `name`, `technical_label`, `description`, `type`, `unit`, `created_at`, `updated_at`.

 Sans status, pas de workflow de publication.

 ### 4. IndicatorModel subtype — Non resolu

 Aucun champ `subtype` sur `IndicatorModel`. Le type est géré via un enum `IndicatorModelType` avec uniquement deux valeurs : `"text"` et `"number"`.

 ### 5. IndicatorModel list_values — Non resolu

 Aucun champ `list_values` n'existe. Les configurations disponibles sont `DuplicableConfig` et `ConstrainedValuesConfig`, mais rien pour gérer des valeurs énumérées.

 > **Note :** Les points 4 et 5 sont liés et devraient être traités ensemble. Le subtype détermine si `list_values` est nécessaire.

 ### 6. updated_by — Non resolu

 Aucun champ `updated_by` trouvé sur les entités. Seuls `created_at` et `updated_at` (timestamps) existent, sans attribution d'utilisateur.

 ### 7. Full-text search — Non resolu

 Aucun paramètre `q` ou `search` trouvé sur les endpoints de liste. Les filtres disponibles sont spécifiques (`funding_program_id`, `type`, `status_filter`, `action_model_id`).

 ### 8. Multi-select filters (OR support) — Non resolu

 Les filtres ne supportent pas les valeurs multiples séparées par des virgules. Chaque filtre accepte une valeur unique. Marqué HIGH à juste titre — c'est un pattern standard pour les tables admin.

 ### 9. action_theme_id filter sur GET /action-models/ — Non resolu

 Le endpoint `GET /action-models/` ne supporte que le filtre `funding_program_id`. Pas de paramètre `action_theme_id`.

 ### 10. community_id filter sur GET /agents/ — Non resolu

 Le endpoint `GET /agents/` ne supporte que `status` et `include_deleted`. Pas de paramètre `community_id`. Les agents sont filtrés en interne par les communautés accessibles de l'utilisateur, mais aucun filtre explicite n'est exposé.

 > **Note :** Les points 9 et 10 sont faciles à implémenter (un `Query` param + un `WHERE` clause) et pourraient être regroupés dans un même ticket.

 ### 11. GET /communities/{id}/users — Non resolu

 Cet endpoint n'existe pas. Seuls `POST` (assigner) et `DELETE` (retirer) existent pour la relation community-users. Pas de `GET` pour lister les utilisateurs d'une communauté.

 ### 12. GET /indicator-models/{id}/action-models — Non resolu

 Cet endpoint de reverse-lookup n'existe pas. L'inverse existe (`GET /indicator-models/by-action-model/{action_model_id}`), mais pas la direction demandée.

 ### 13. IndicatorModelWithAssociation — technical_label manquant

 Le schema `IndicatorModelWithAssociation` n'inclut **pas** le champ `technical_label`. Les champs présents sont : `id`, `name`, `description`, `type`, `unit`, `created_at`, `updated_at`, plus les champs d'association.

 ### 14. Indicator-Model association metadata — Resolu

 La table de liaison `IndicatorModelActionModelLink` **contient bien** les 6 champs de métadonnées :
 - `visibility_rule` (défaut : `"true"`)
 - `required_rule` (défaut : `"false"`)
 - `editable_rule` (défaut : `"true"`)
 - `default_value_rule` (nullable)
 - `duplicable_enabled`, `duplicable_min`, `duplicable_max`
 - `constrained_values_enabled`, `constrained_min`, `constrained_max`

 Le risque est plus faible qu'anticipé dans le document. Le test de round-trip recommandé reste une bonne idée.

 ---

 ## Points additionnels

 ### GET /auth/users vs GET /users/ — Problème d'architecture

 Deux endpoints pour la même ressource avec des formats de réponse différents (array brut vs `PaginatedResponse`). Source de confusion. Recommandation : déprécier `/auth/users` au profit de `/users/` avec un filtre `community_id`.

 ### FR27 (type-change constraint)

 Le document dit "backend should enforce this regardless of frontend" — c'est 100% juste. C'est une contrainte d'intégrité, pas une règle UI. A implémenter côté backend indépendamment du frontend.

 ---

 ## Recommandation de priorisation backend

 | Priorité | Points | Effort |
 |-----------|--------|--------|
 | **P0** (bloquant) | ActionModel status (#2), IndicatorModel status (#3) | Moyen — modèles + migration + endpoints de transition |
 | **P1** (haute valeur) | Multi-select filters (#8), Token refresh (#1) | Faible à moyen |
 | **P2** (amélioration) | Filtres manquants (#9, #10), GET /communities/{id}/users (#11), technical_label (#13) | Faible |
 | **P3** (backlog) | updated_by (#6), full-text search (#7), subtype/list_values (#4, #5), reverse-lookup (#12) | Moyen à élevé |

 ---

 ## Conclusion

 Document d'observations de grande qualité, prêt à être transformé en tickets. Les priorités sont bien calibrées. Les blockers identifiés sont légitimes et confirmés par l'analyse du code.
