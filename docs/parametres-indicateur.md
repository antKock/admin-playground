# Paramètres indicateur

Les **paramètres d’indicateur** définissent le comportement d’un indicateur dans un **modèle**.

Ils permettent d’adapter un même champ selon le contexte.\
Exemple : obligatoire dans un modèle, optionnel dans un autre.

Voir aussi :

* [Modèles avec Indicateurs](https://actee.gitbook.io/actee/interne-admin/modeles-avec-indicateurs)
* [Modèles](https://actee.gitbook.io/actee/interne-admin/modeles-avec-indicateurs/modeles)
* [Indicateurs](https://actee.gitbook.io/actee/interne-admin/modeles-avec-indicateurs/indicateurs)

### À retenir

* Un paramètre s’active en **ON / OFF**.
* Un paramètre peut aussi être piloté par des **règles**.
* Les paramètres de **section** s’appliquent avant ceux des indicateurs.

### Paramètres disponibles

Récap simplifié des 6 paramètres activable en **ON / OFF**:

<table><thead><tr><th width="167.18182373046875">Paramètre</th><th>Ce que ça change côté utilisateur</th><th>Spécificité</th></tr></thead><tbody><tr><td>Obligatoire</td><td>Une valeur doit être saisie pour ce champs</td><td>ON / OFF</td></tr><tr><td>Non visible</td><td>Cache l’indicateur dans le formulaire</td><td>ON / OFF. Utile pour des champs conditionnels</td></tr><tr><td>Non éditable</td><td>Bloque la modification de la valeur</td><td>ON / OFF. Souvent combiné avec “Valeur par défaut”</td></tr><tr><td>Valeur par défaut</td><td>Pré-remplit la valeur à la création</td><td>Peut être fixe ou issue d’une règle.</td></tr><tr><td>Valeur contrainte</td><td>Limite la saisie (ex. bornes, format)</td><td>Dépend du type d’indicateur et du statut/section</td></tr><tr><td>Duplicable</td><td>Autorise plusieurs occurrences du même indicateur</td><td>Bornes min/max configurables</td></tr></tbody></table>

**Obligatoire**

Si activé, l’utilisateur doit renseigner une valeur.\
Sinon, il ne peut pas passer l’objet au statut **Complété**.

S’il n’y a pas de valeur saisie, l’indicateur passe en erreur.\
Sauf si **Non éditable** est activé : pas d’erreur sur un champ non modifiable.

**Non visible**

Si activé, l’indicateur n’apparaît pas dans le formulaire utilisateur.

Ce paramètre est utile pour afficher un champ “conditionnel”.\
Exemple : afficher “Précisez” seulement si l’utilisateur répond “Autre”.

**Non éditable**

Si activé, l’utilisateur ne peut pas modifier la valeur.

C’est souvent utilisé avec **Valeur par défaut**.\
La valeur est alors définie par l’administration (ou par une règle).

**Valeur par défaut**

Si activé, l’indicateur est pré-rempli avec une valeur définie.

<details>

<summary>Définir la valeur par défaut (fixe, ou calculée).</summary>

Il peut s'agir d'une valeur définie. ex : `42`

Il peut s'agir d'une valeur "référencée". Voir [Références](https://actee.gitbook.io/actee/interne-admin/regles-avancees#references-dans-les-regles). Exemple : `cout_total`

Il peut s'agir d'un calcul. ex : `cout_total * 0.60`

Operations autorisées : `+`, `-`, `*`, `/`&#x20;

</details>

<details>

<summary>Quand la valeur est-elle appliquée ?</summary>

La valeur par défaut est appliquée à la **création initiale** de l’objet.\
C’est la première fois que l’objet est créé à partir du modèle.

Exemple : à la création d’une action basée sur un **modèle d’action**.

</details>

<details>

<summary>Valeur "calculée" et saisie utilisateur</summary>

Une valeur par défaut peut dépendre d’autres indicateurs.

Les règles sont évaluées dynamiquement.\
Si un indicateur de référence change, la valeur calculée peut évoluer.

La plateforme ne remplace pas une valeur saisie manuellement.\
Si l’utilisateur modifie la valeur, la mise à jour automatique est désactivée.

</details>

**Valeur contrainte**

Si activé, la saisie est limitée par une contrainte. Exemple : un nombre entre 0 et 100.

Si la contrainte définie n'est pas respectée par la valeur du champs, alors il se met en erreur.

Sauf si **Non éditable** est activé : pas d’erreur sur un champ non modifiable.

{% hint style="info" %}
Le paramètre "valeur contrainte" n'est pas disponible pour les "indicateurs groupés", mais peut être appliqué aux indicateurs faisant parti d'un groupe.
{% endhint %}

<details>

<summary>Comment rédiger la contrainte ?</summary>

Les possibilités de contraintes sont potentiellement infinies.

Elles s’appuient sur la même logique de fonctionnement que les [conditions de paramètre](https://actee.gitbook.io/actee/interne-admin/regles-avancees#conditions-de-parametre).

C'est à dire que vous pouvez utiliser des opérateurs et références pour construire la règle souhaitée.

A ce jour, la valeur contrainte doit être rédigée au format "JSON Logic", avant qu'une UI plus élégante soit proposée. Demandez à l'équipe technique ou à ChatGPT pour rédiger la règle souhaitée.

</details>

**Duplicable**

Si activé, l’utilisateur peut dupliquer l’indicateur.\
Ça permet de saisir plusieurs valeurs pour un même champ.

Configuration (admin) : définir les bornes de duplication (**min** et **max**).

Exemple : renseigner une consommation annuelle pour plusieurs années.

### Règles d'activation

L’activation **ON / OFF** d’un paramètre ne suffit pas toujours.

Les **règles** permettent de piloter :

* l’**activation** d’un paramètre (ex. rendre un champ visible) ;
* le **résultat** d’un paramètre (ex. calculer une valeur par défaut, une contrainte, des bornes).

{% hint style="info" %}
**Exemple — “Précisez votre réponse”**

Vous avez un indicateur `mode_chauffe` avec les choix : fioul, électricité, autre.

Vous voulez afficher `precisez` seulement si l’utilisateur choisit “autre”.

Règle sur le paramètre **Non visible** de `precisez` :

* Si `mode_chauffe` est différent de `autre`, alors `precisez` est **non visible**.
  {% endhint %}

{% hint style="info" %}
**Exemple — “Bonus rural”**

Vous avez un indicateur `bonus_rural` (Oui / Non).

Vous voulez définir un taux par défaut selon la réponse.

Règle sur le paramètre **Valeur par défaut** :

* Si `bonus_rural` est égal à `oui`, alors `60%`.
* Sinon, `50%`.
  {% endhint %}

{% hint style="info" %}
Les règles sont re-testées dynamiquement.

Si une valeur change, les champs dépendants sont mis à jour.
{% endhint %}

Voir [Règles (conditions, références, opérateurs)](https://actee.gitbook.io/actee/interne-admin/modeles-avec-indicateurs/regles-avancees).

### Paramètres de section

Les indicateurs d’un modèle sont organisés par **sections**.

Chaque section peut avoir ses propres paramètres et règles.\
Ils couvrent des besoins transverses (ex. figer des champs selon un statut).

Les paramètres de section s’appliquent **avant** ceux des indicateurs.\
Si une section est “Non visible”, aucun indicateur ne s’affiche.

Tous les paramètres ne s’appliquent pas aux sections.\
Exemple : **Valeur par défaut** n’a pas de sens au niveau section.

{% hint style="danger" %}
Note PM : Clarifier les paramètres appliqués aux sections et leur fonctionnement
{% endhint %}

### Modifier un paramètre sur un modèle déjà utilisé

Modifier un paramètre ne “réécrit” pas automatiquement l’historique.\
Le comportement dépend du paramètre.

**Obligatoire / Non éditable / Non visible**

Modification possible.\
Le changement s’applique à partir de la modification.

**Valeur par défaut**

Modification possible.

Le changement n’actualise pas automatiquement les objets existants.

* Les indicateurs déjà instanciés ne sont pas modifiés.
* Si la valeur est calculée, elle peut être recalculée plus tard.
  * Exemple : l’utilisateur modifie un indicateur référencé.

Si vous devez mettre à jour des valeurs déjà instanciées, c’est exceptionnel.\
Contactez l’équipe technique.

**Duplicable**

Modification possible.\
Les données passées sont conservées.

* Activer la duplication : pas d’impact sur l’historique.
* Désactiver la duplication : les duplications existantes restent.
* Réduire une limite (ex. “max 5”) : l’existant reste, la contrainte s’applique ensuite.

**Valeur contrainte**

Modification possible.\
La contrainte s’applique selon le statut (voir plus haut, section “Valeur contrainte”).

<table data-view="cards"><thead><tr><th>Aller plus loin</th><th data-hidden data-card-target data-type="content-ref"></th></tr></thead><tbody><tr><td>Indicateurs</td><td><a href="indicateurs">indicateurs</a></td></tr><tr><td>Modèles</td><td><a href="modeles">modeles</a></td></tr><tr><td>Modèles avec Indicateurs</td><td><a href=""></a></td></tr></tbody></table>
