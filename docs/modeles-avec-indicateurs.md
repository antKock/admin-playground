# Modèles avec Indicateurs

La plateforme est conçue pour être **configurable sans développement**.

On évite “un écran par action”. On préfère assembler des briques réutilisables.

### En bref

* Un **modèle** définit la structure et le comportement d’un objet.
* Un **indicateur** est un champ réutilisable.
* Les **paramètres d’indicateur** adaptent un indicateur à un modèle.

### Contexte et objectif

On gère un catalogue d’actions finançables.

Chaque action a ses règles et ses champs.

Beaucoup de champs restent communs. Exemple : coût de l’action.

{% hint style="info" %}
Le “spécifique” (un écran par action) coûte cher.

Il augmente la maintenance.

Il réduit l’autonomie métier sur la configuration.
{% endhint %}

### Comment ça marche : modèles + indicateurs

<figure><img src="https://2479308484-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FHkt5SD9dwQoYbIYe3vvZ%2Fuploads%2FXbmaVgHjf89bGTJPIJ8S%2Fimage.png?alt=media&#x26;token=e4e84638-dc38-4aee-9c48-1c45150ca285" alt=""><figcaption></figcaption></figure>

On sépare :

* la **structure** (ce qu’on veut permettre et afficher),
* des **briques de données** réutilisables (les champs),
* et leur **paramétrage** selon le contexte.

Cette approche repose sur 3 concepts.

#### 1) Modèles

Les **modèles** configurent le comportement d’un type d’objet.

Ça couvre les actions finançables, les dossiers, et les objets “référentiel”.

Le modèle définit :

* ce que l’utilisateur final peut faire,
* quelles informations on lui demande.

Voir [Modèles](https://actee.gitbook.io/actee/interne-admin/modeles-avec-indicateurs/modeles).

#### 2) Indicateurs

Les **indicateurs** sont les champs réutilisables de la plateforme.

Ils sont rattachés aux modèles.

Ça permet de partager un même champ entre plusieurs modèles.

Voir [Indicateurs](https://actee.gitbook.io/actee/interne-admin/modeles-avec-indicateurs/indicateurs).

#### 3) Paramètres d’indicateur

Un indicateur peut se comporter différemment selon le modèle.

Exemple : obligatoire dans un modèle, optionnel dans un autre.

On configure donc des **paramètres d’indicateur** par modèle (et souvent par section).

Voir [Paramètres indicateur](https://actee.gitbook.io/actee/interne-admin/modeles-avec-indicateurs/parametres-indicateur).

Quand un paramètre dépend du contexte (statut, autre champ, etc.), on utilise des règles.

Voir [Règles (conditions, références, opérateurs)](https://actee.gitbook.io/actee/interne-admin/modeles-avec-indicateurs/regles-avancees).

### Workflow de configuration (en pratique)

Dans l’administration, on fait en général :

1. Créer les **indicateurs** (types, libellés, listes, etc.).
2. Créer le **modèle** (objet ciblé, sections, description, etc.).
3. Rattacher les **indicateurs** au modèle, dans les bonnes sections.
4. Régler les **paramètres d’indicateur** (obligatoire, visibilité, défaut, règles…).
5. Publier / activer ce qui doit être disponible en configuration.

### Ce qui change où

* Modifier un **indicateur** impacte tous les modèles qui l’utilisent.
* Modifier des **paramètres d’indicateur** n’impacte que le modèle (et la section) visés.

### À retenir

* Un **modèle** = un gabarit de configuration.
* Un **indicateur** = un champ réutilisable.
* Les **paramètres** = l’adaptation du champ à un modèle.

<table data-view="cards"><thead><tr><th>Aller plus loin</th><th data-hidden data-card-target data-type="content-ref"></th></tr></thead><tbody><tr><td>Modèles</td><td><a href="modeles-avec-indicateurs/modeles">modeles</a></td></tr><tr><td>Indicateurs</td><td><a href="modeles-avec-indicateurs/indicateurs">indicateurs</a></td></tr><tr><td>Règles (conditions, références, opérateurs)</td><td><a href="modeles-avec-indicateurs/regles-avancees">regles-avancees</a></td></tr><tr><td>Paramètres indicateur</td><td><a href="modeles-avec-indicateurs/parametres-indicateur">parametres-indicateur</a></td></tr></tbody></table>
