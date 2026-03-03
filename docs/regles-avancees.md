# Règles avancées

Ces **règles** sont utilisées pour :

* paramétrer un **indicateur** (valeur par défaut, visibilité, contrainte, etc.) ;
* paramétrer les indicateurs d’une **section complète** ;
* gérer la **visibilité** des **modèles d’actions** (quand cette configuration est branchée sur des règles).

### À retenir

* Une règle est composée de **conditions logiques SI / ET / OU**
* Une condition logique teste des **références** (valeurs lues) grâce à des **opérateurs** (= ; < ; > ...)
  * Les opérateurs disponibles dépendent du type d’indicateur référencé
* Le **résultat de la règle** permet peut-être de la forme `true / false` ou une `valeur` (ex : 42)
  * Le résultat conditionne l'activation d'un paramètre, la validation de la valeur d'un champs, la visibilité d'un modèle d'action ...
* Les règles sont **re-testées dynamiquement** quand les valeurs référencées changent.

#### Exemples de règles sur indicateur

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

### Logique ET / OU

Une règle peut combiner plusieurs conditions (ET / OU).

Elle peut aussi définir plusieurs cas (si… alors… sinon…).

#### Cas simple : activer / désactiver un paramètre (ON / OFF)

Exemple :

```
SI (condition_1 ET condition_2)
OU condition_3
ALORS activer le paramètre
```

Interprétation :

* `condition_1` et `condition_2` vraies → paramètre activé.
* `condition_3` vraie → paramètre activé.
* `condition_1` seule vraie → paramètre non activé.

#### Cas avancé : définir une valeur / contrainte / bornes

Pour **Valeur par défaut**, **Valeur contrainte** et **Duplicable**, chaque cas peut définir un résultat différent.

Exemple :

```
SI conditions_A
ALORS valeur / contrainte / bornes = X

OU conditions_B
ALORS valeur / contrainte / bornes = Y

SINON valeur / contrainte / bornes = Z
```

### Références dans les règles

Dans une règle, vous pouvez lire la valeur :

* d’un **indicateur du modèle** (dans une section) ;
* d’un **objet lié** (ex. porteur, site, bénéficiaires).

Pour construire une référence, utilisez toujours le **label technique** de l’indicateur.

Il est décrit dans [Indicateurs](https://actee.gitbook.io/actee/interne-admin/indicateurs#informations-de-lindicateur).

**Référencer un indicateur du modèle**

Format : `section.technical_label`

* `section` = nom de la section dans le modèle.
* `technical_label` = label technique de l’indicateur.

Exemples :

* `perimetre.cout_total`
* `suivi.planning`

**Référencer un objet lié**

Format : `object.indicateur_technique`

Exemples :

* `porteur.departement`
* `site.surface_shab`

{% hint style="warning" %}
**\[A confirmer] Cas particulier — objets “multi”**

Parfois, un lien pointe vers **plusieurs objets** du même type.

Exemple : une action a plusieurs bénéficiaires.

Dans ce cas, `objet_lie.indicateur_technique` renvoie :

* la **valeur** si elle est identique sur tous les objets ;
* `null` si au moins deux objets ont des valeurs différentes.

Exemple avec `beneficiaries.departement` :

* tous les bénéficiaires = `75` → `beneficiaries.departement = 75`
* au moins un bénéficiaire ≠ `75` → `beneficiaries.departement = null`
  {% endhint %}

**Référence avancée sur l’indicateur**

Par défaut, une référence lit la valeur (`value`) de l’indicateur.

Parfois, vous voulez lire une information avancée.

Exemple : le type d’un fichier.

<details>

<summary>Liste des références avancées</summary>

* Texte
  * `value` : valeur du champ
  * `length` : nombre de caractères
* Numérique
  * `value` : valeur du champ
* Choix par liste
  * `value` : tableau des valeurs
  * `length` : nombre de valeurs
* Oui / Non
  * `value` : valeur du champ
* Téléversement
  * `value` : `true` si un fichier est versé, `false` sinon
  * `length` : nombre de fichiers téléversés
  * `name` : nom du fichier téléversé
  * `size` : poids du fichier téléversé
  * `type` : extension du fichier téléversé
* Date
  * `value` : valeur de la date

</details>

### Opérateurs

Une condition compare une **valeur** (référence) à une constante.

Exemple : `perimetre.departement` **est** `75`.

Les opérateurs disponibles dépendent du type d’indicateur.

**Tableau des opérateurs**

<table data-full-width="true"><thead><tr><th>Opérateur</th><th>Description</th><th width="86.5546875">Texte</th><th width="120.20526123046875">Numérique</th><th width="100.219482421875">Liste de valeurs</th><th width="101.977294921875">Oui/Non</th><th width="92.79400634765625">Fichier</th><th width="78.64990234375">Date</th><th width="111.600830078125">JSON Logic</th></tr></thead><tbody><tr><td><strong>est</strong></td><td>égalité stricte</td><td>✅</td><td>✅</td><td>✅</td><td>✅</td><td>⚠️</td><td>✅</td><td><code>==</code></td></tr><tr><td><strong>n’est pas</strong></td><td>différent de</td><td>✅</td><td>✅</td><td>✅</td><td>✅</td><td>⚠️</td><td>✅</td><td><code>!=</code></td></tr><tr><td><strong>contient</strong></td><td>inclut une sous-valeur</td><td>✅</td><td>❌</td><td>❌</td><td>❌</td><td>⚠️</td><td>❌</td><td><code>in</code></td></tr><tr><td><strong>ne contient pas</strong></td><td>n’inclut pas</td><td>✅</td><td>❌</td><td>❌</td><td>❌</td><td>⚠️</td><td>❌</td><td><code>! (in …)</code></td></tr><tr><td><strong>est vide</strong></td><td>aucune valeur définie</td><td>✅</td><td>✅</td><td>✅</td><td>✅</td><td>✅</td><td>✅</td><td><code>!</code></td></tr><tr><td><strong>n’est pas vide</strong></td><td>valeur présente</td><td>✅</td><td>✅</td><td>✅</td><td>✅</td><td>✅</td><td>✅</td><td><code>!!</code></td></tr><tr><td><strong>est l’un de</strong></td><td>appartient à une liste</td><td>✅</td><td>✅</td><td>✅</td><td>❌</td><td>⚠️</td><td>✅</td><td><code>in</code></td></tr><tr><td><strong>n’est pas l’un de</strong></td><td>n’appartient pas</td><td>✅</td><td>✅</td><td>✅</td><td>❌</td><td>⚠️</td><td>✅</td><td><code>! (in …)</code></td></tr><tr><td><strong>est inférieur à</strong></td><td>comparaison</td><td>⚠️</td><td>✅</td><td>⚠️</td><td>❌</td><td>⚠️</td><td>✅</td><td><code>&#x3C;</code></td></tr><tr><td><strong>est supérieur à</strong></td><td>comparaison</td><td>⚠️</td><td>✅</td><td>⚠️</td><td>❌</td><td>⚠️</td><td>✅</td><td><code>></code></td></tr><tr><td><strong>est égal ou inférieur à</strong></td><td>comparaison</td><td>⚠️</td><td>✅</td><td>⚠️</td><td>❌</td><td>⚠️</td><td>✅</td><td><code>&#x3C;=</code></td></tr><tr><td><strong>est égal ou supérieur à</strong></td><td>comparaison</td><td>⚠️</td><td>✅</td><td>⚠️</td><td>❌</td><td>⚠️</td><td>✅</td><td><code>>=</code></td></tr></tbody></table>

⚠️ = nécessite une référence avancée.

Exemple : `uploaded_files.length` pour tester le nombre de fichiers téléversés.
