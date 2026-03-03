# Modèles

Les **modèles** configurent le comportement d’un type d’objet.

Ils couvrent les actions finançables, les dossiers, et les objets “référentiel”.

Voir aussi : [Modèles avec Indicateurs](https://actee.gitbook.io/actee/interne-admin/modeles-avec-indicateurs).

Un modèle définit :

* ce que l’utilisateur final peut faire ;
* quelles informations on lui demande ;
* quels champs sont réutilisés (via les indicateurs).

### Types de modèles

Une grande partie de la plateforme repose sur des modèles.

#### Modèles rattachés à un programme ou modèles d'actions

* **Modèle d’action** — actions finançables (ex. SDIE, audit énergétique).
  * Rattaché à : un programme.
* **Modèle de dossier** — informations demandées dans les dossiers de candidature.
  * Rattaché à : un programme.
* **Modèle de dépense** — informations demandées lors d’une remontée de dépense.
  * Rattaché à : un ou plusieurs modèles d’action.

{% hint style="danger" %}
Note PM : Fonctionnement des modèles de dépense à clarifier
{% endhint %}

* **Modèle de convention** — informations utilisées pour générer des conventions de financement.
  * Rattaché à : un ou plusieurs programmes.

{% hint style="danger" %}
Note PM : Configuration des convention à clarifier, aujourd'hui ça repose sur des docs word provenant du pôle juridique
{% endhint %}

#### Modèles communs (référentiel)

* **Modèle de collectivité** — informations demandées sur les collectivités.
  * Portée : commun à tous les programmes.
* **Modèle de site** — informations demandées sur les sites et bâtiments.
  * Portée : commun à tous les programmes.
* **Modèle d’agent** — informations demandées sur les agents.
  * Portée : commun à tous les programmes.

### Structure d’un modèle

<figure><img src="https://2479308484-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FHkt5SD9dwQoYbIYe3vvZ%2Fuploads%2F95u9bNatqrNxV4qOl3H0%2Fimage.png?alt=media&#x26;token=862a06f1-3fac-49a8-9c4a-9d91fab13483" alt=""><figcaption></figcaption></figure>

#### Informations du modèle

Chaque modèle a des informations globales.

Elles sont obligatoires sauf mention contraire.

* **Intitulé** — nom du modèle côté administration. Invisible côté utilisateur final.
* **Label utilisateur** — nom affiché dans l’application.
  * Uniquement pour les modèles d’action.
  * Valeur par défaut : intitulé du modèle.
* **Label technique** — identifiant interne, invisible côté utilisateur final.
  * Utilisé pour les références dans l’administration.
  * Exemple : lier un modèle de dépense à un modèle d’action.
  * Utilisé aussi pour l’analyse de données.
  * Valeur par défaut : transcription de l’intitulé en `snake_case`.
  * Doit être unique. Sinon suffixe `_<N>`.
  * Non modifiable pour les modèles communs (collectivité, bâtiment...)
* **Programme** — label technique du ou des programmes associés.
  * Uniquement pour action / dossier / convention.
  * Un seul programme pour un modèle d’action.
  * Plusieurs programmes possibles pour dossier et convention.
* **Thématique** — thématique rattachée au modèle d’action.
  * Uniquement pour les modèles d’action.
  * Sert au regroupement dans l’application.
* **Modèle de dépense** — modèle de dépense rattaché au modèle d’action.
  * Uniquement pour les modèles d’action.

{% hint style="danger" %}
Note PM : Quid de l'instruction "métier" des dépense ? Un modèle de dépense va avoir deux instructions liées ? Une financière et une métier ?
{% endhint %}

* **Description** (facultatif) — description du modèle.
  * Visible côté utilisateur final pour les modèles d’action.

{% hint style="danger" %}
Note PM : Fonctionnement des 3 éléments suivants contrôler la "visibilité" sont à clarifier; notamment pour les modèles de dossier (comment se passe un changement de modèle ? ça veut dire que plusieurs modèles sont liés au même programme...)
{% endhint %}

* **\[A clarifier] Début de visibilité** — date à partir de laquelle le modèle est actif.
* **Fin de visibilité** — date à partir de laquelle le modèle est inactif.
* **Règles de visibilité** — règles limitant l’accès au modèle. Par exemple "Action visible si la collectivité est dans le département 16"

#### Sections “Indicateurs”

Chaque type de modèle a une ou plusieurs sections “Indicateurs”.

Elles définissent le formulaire affiché à l’utilisateur.

Actions possibles :

* **Ajouter un indicateur** — ajoute un indicateur existant au modèle.
  * Voir [Indicateurs](https://actee.gitbook.io/actee/interne-admin/modeles-avec-indicateurs/indicateurs).
* **Éditer les paramètres d’un indicateur** — adapte son comportement dans ce modèle.
  * Voir [Paramètres indicateur](https://actee.gitbook.io/actee/interne-admin/modeles-avec-indicateurs/parametres-indicateur).
* **Paramétrer la section** — paramètres par défaut appliqués à ses indicateurs.
  * Voir [Paramètres indicateur](https://actee.gitbook.io/actee/interne-admin/modeles-avec-indicateurs/parametres-indicateur).
* **Ajouter un élément de présentation** — titre, sous-titre, description.
* **Réorganiser les éléments** — change l’ordre ou supprime des éléments.

{% hint style="info" %}
Le formulaire suit l’ordre défini dans la configuration.
{% endhint %}

#### Section “Association d’objets”

Uniquement disponible pour les modèles d’action.

L'administrateur peut autoriser ou non l’association d’objets à une action.

Exemples : Associer des "bâtiments" à un "audit énergétique"

**Indicateurs x Objets**

Des indicateurs (et éléments de présentation) peuvent être ajoutés aux sections "association d'objets"

Ces indicateurs seront demandés pour chaque des objets liés à l'action.

Exemple : “surface plancher” demandé pour chaque bâtiment lié.

{% hint style="warning" %}
**\[A clarifier /** **confirmer] Valeur indicateur entre objet et action**

La valeur d'un indicateur lié à un objet peut être différente entre l'instance de l'indicateur rattaché à l'objet, et celui rattaché à l'action.

Exemple simplifié :

* En 2025, une synchronisation avec IPPER charge les infos du bâtiment X
  * Le bâtiment X a une consommation annuelle de 100
  * `batimentX.consommation = 100`
* En 2026, la collectivité fait une action 1 (audit énérgétique) sur le bâtiment X
  * La plateforme demande l'information de consommation. Vu que l'information existe au niveau du bâtiment, l'info est pré-remplie dans l'action.
  * `batimentX.consommation = 100` & `action1.batimentX.consommation = 100`
* En 2027, la collectivité fait une action 2 (travaux pour réduire sa consommation) sur le bâtiment X.
  * La plateforme demande l'information de consommation. Vu que l'information existe au niveau du bâtiment, l'info est pré-remplie dans l'action.
  * MAIS la consommation a baissé à 80, la collectivité corrige l'information dans l'action, ce qui met à jour l'indicateur du bâtiment
  * `action2.batimentX.consommation = 80` & `batimentX.consommation = 80`
* Au final, on a trois instances de la même information, pertinente pour chacun des objets
  * `batimentX.consommation = 80` & `action1.batimentX.consommation = 100` & `action2.batimentX.consommation = 80`
    {% endhint %}

### Statut d'un modèle

Chaque modèle **rattaché à un programme** peut avoir 3 statuts :

* **Brouillon** — en création. Des infos obligatoires peuvent manquer.
  * Changement possible pour "publié"
* **Publié** — validé par un administrateur. Actif par défaut.
  * Changement possible pour "archivé"
* **Archivé** — inactif. Reste lié aux objets déjà créés.
  * Changement possible pour "publié"

{% hint style="info" %}
Les modèles communs (collectivité / site / agent) n’ont qu’un seul statut : **Publié**.
{% endhint %}

### Modification d'un modèle

Les modèles restent modifiables.

Quand un modèle est déjà utilisé, certaines contraintes s’appliquent.

#### Informations du modèle

* **Intitulé / label utilisateur / label technique / description** : modifiables à tout moment.
  * Le changement s’applique partout où ces valeurs sont référencées.
* **Programme** : non modifiable dès qu’au moins une action/dossier/convention existe.
* **Thématique** : modifiable à tout moment.
  * Le changement s’applique aux actions existantes et futures.
* **Modèle de dépense** : modifiable à tout moment.
  * N’impacte pas les dépenses déjà réalisées.
  * S’applique aux dépenses futures.
* **Visibilité (début, fin, règles)** : modifiable à tout moment.
  * Ne supprime pas les objets déjà créés.

#### Indicateurs

Tant qu’aucun objet n’est lié au modèle, tout est modifiable.

Détails :

* **Supprimer un indicateur**
  * Si l’indicateur est référencé dans une règle : suppression impossible.
    * Retirez d’abord la référence.
    * Voir [Paramètres indicateur](https://actee.gitbook.io/actee/interne-admin/modeles-avec-indicateurs/parametres-indicateur).
  * Sinon : suppression possible.
    * Les données existantes restent conservées.
* **Ajouter un indicateur** : possible.
  * Il s’applique aux objets futurs.
  * <mark style="background-color:$warning;">Point de vigilance</mark> : ajouter après coup un indicateur **obligatoire** peut laisser des objets incomplets. À cadrer (migration, valeur neutre, ou règle de complétion).
    * Règle idéale : Si l'indicateur ajouté n'est pas éditable par l'utilisateur (ex. info de candidature d'un dossier déjà conventionné), une valeur par défaut est indiqué pour que côté data on sache que l'indicateur a été demandé à postériori
* **Modifier paramétrage d'un indicateur :** voir [Paramètres indicateur](https://actee.gitbook.io/actee/interne-admin/modeles-avec-indicateurs/parametres-indicateur)

{% hint style="info" %}
**Idées de compléments**

* Ajouter 2–3 exemples concrets de modèles (action, dossier, dépense) avec ce que l’utilisateur voit.
* Clarifier la différence **statut** (brouillon/publié/archivé) vs **visibilité** (dates/règles).
* Détailler le cas “modèle de dépense” : lien avec action, impacts sur l’existant, cas multi-actions.
* Ajouter une section “Bonnes pratiques” : gérer l’ajout tardif d’un indicateur obligatoire.
  {% endhint %}
