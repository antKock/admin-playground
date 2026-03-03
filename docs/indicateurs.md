# Indicateurs

Les **indicateurs** sont les champs réutilisables de la plateforme.

On les crée une fois.

Ensuite, on les rattache à un ou plusieurs **modèles**.

Ça permet de partager le même champ entre plusieurs formulaires.

Voir :

* [Modèles](https://actee.gitbook.io/actee/interne-admin/modeles-avec-indicateurs/modeles)
* [Modèles avec Indicateurs](https://actee.gitbook.io/actee/interne-admin/modeles-avec-indicateurs)
* [Paramètres indicateur](https://actee.gitbook.io/actee/interne-admin/modeles-avec-indicateurs/parametres-indicateur)

### À retenir

* Un **indicateur** = un champ réutilisable.
* Un **modèle** = un gabarit qui assemble des indicateurs.
* Les **paramètres d’indicateur** adaptent l’indicateur à un modèle (obligatoire, visibilité, etc.).

### Types d’indicateur

Chaque indicateur a un **type principal** (format de la donnée).

Il peut aussi avoir un **sous-type** (variante de saisie).

* **Texte** — champ de donnée textuel
  * Court : limité en nombre de caractères.
  * Long : texte libre.
  * Email : format `x@y.z` (sauvegardé en minuscules côté back).
  * Téléphone : format `"10 digits"` ou `"+NN 9 digits"`.
  * IBAN : 27 caractères alphanumériques commençant par `FR` (espaces autorisés ; sauvegardé en majuscules sans espaces côté back).
* **Numérique** — champ de donnée numérique
  * Unité : une unité fixe est associée au champ.
    * kWh; MWh; GWh; kWh/m².an; kWh/m²; kW; MW; kWc; W/m²; kgCO₂e; tCO₂e; kgCO₂e/m².an; gCO₂e/kWh; € HT; € TTC; k€ HT; k€ TTC; €/m² HT; €/m² TTC; m²; m² SHAB; m² SDP; m³; m³/an; L/jour; °C; ppm; %HR; %
* **Choix par liste** — choix limité à une liste de valeurs
  * Choix unique : l’utilisateur ne peut sélectionner qu’une valeur.
  * Choix multiple : l’utilisateur peut sélectionner plusieurs valeurs.
* **Oui / Non** — choix entre Oui et Non
* **Téléversement** — l’utilisateur peut téléverser un fichier
* **Date** — champ lié à un instant donné
  * JJ/MM/AAAA
  * MM/AAAA
  * AAAA
* **Groupement** — indicateur regroupant plusieurs indicateurs
  * Exemple : “Consommation annuelle” contient “Année de référence” et “Consommation”.
  * Un groupement ne peut pas inclure d'indicateur de type groupement (un seul niveau d'imbrication)

### Structure d’un indicateur

<figure><img src="https://2479308484-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FHkt5SD9dwQoYbIYe3vvZ%2Fuploads%2F50Qw54ViYVaRdNORDmzJ%2Fimage.png?alt=media&#x26;token=9f79b304-b227-488f-ba1b-0b35e348ddd1" alt=""><figcaption></figcaption></figure>

#### Informations de l’indicateur

Chaque indicateur a des informations globales.

Elles sont obligatoires sauf mention contraire.

* **Intitulé** — nom de l’indicateur côté administration. Invisible côté utilisateur final.
* **Label technique** — identifiant interne, invisible côté utilisateur final.
  * Utilisé pour les références dans l’administration.
  * Exemple : lier un indicateur à un modèle d’action.
  * Utilisé aussi pour l’analyse de données.
  * Valeur par défaut : transcription de l’intitulé en `snake_case`.
  * Doit être unique. Sinon suffixe `_<N>`.
* **Label utilisateur** — nom affiché dans l’application.
  * Valeur par défaut : intitulé de l’indicateur.
* **Message de l’info-bulle** (facultatif) — texte d’aide pour l’utilisateur.
  * Visible via l’icône d’information.

### Statut d’un indicateur

Chaque indicateur peut avoir 3 statuts :

* **Brouillon** — en création. Des infos obligatoires peuvent manquer.
  * Changement possible vers “publié”.
* **Publié** — validé par un administrateur. Disponible dans la configuration des modèles.
  * Changement possible vers “archivé”, uniquement si l’indicateur n’est utilisé dans aucun modèle actif.
* **Archivé** — inactif. Non disponible dans la configuration des modèles.
  * Changement possible vers “publié”.

### Modification d’un indicateur

Les indicateurs restent modifiables.

Quand un modèle est déjà utilisé, certaines contraintes s’appliquent.

* **Intitulé / label technique / label utilisateur / info-bulle** : modifiables à tout moment.
  * Le changement s’applique partout où ces valeurs sont référencées.
* **Type principal** : impossible à changer si au moins une instance de l’indicateur existe.
* **Sous-type** : dépend du sous-type.
  * Choix unique / multiple : possible. Pas de modification des données passées.
    * Côté back, c’est le même type de donnée. Le front contraint l’affichage.
  * Unité par défaut : impossible.
    * Si nécessaire, passer par un ticket technique (métier + digital).
  * Texte court vs long : possible. Pas de modification des données passées.
    * Côté back, c’est le même type de donnée. Le front contraint l’affichage.
  * Format de date : possible. Pas de modification des données passées.
    * Côté back, c’est le même type de donnée. Le front contraint l’affichage.
    * Pour le format `AAAA`, la donnée est stockée en back comme `01/01/AAAA`.
* **Indicateurs groupés** : possible. Pas de modification des données passées.
* **Valeurs de liste** : possible.
  * Ajout : aucun impact.
  * Retrait : pas de modification des instances existantes.
  * Modification : mise à jour du libellé sur toutes les instances.

<table data-view="cards"><thead><tr><th>Aller plus loin</th><th data-hidden data-card-target data-type="content-ref"></th></tr></thead><tbody><tr><td>Modèles</td><td><a href="modeles">modeles</a></td></tr><tr><td>Modèles avec Indicateurs</td><td><a href=""></a></td></tr><tr><td>Paramètres indicateur</td><td><a href="parametres-indicateur">parametres-indicateur</a></td></tr></tbody></table>

{% hint style="info" %}
**Idées de compléments**

* Ajouter une section “Exemples” : 1 indicateur texte, 1 liste, 1 groupement, avec rendu côté utilisateur.
* Documenter précisément les formats attendus (téléphone, IBAN, email) + exemples valides/invalides.
* Lister les unités disponibles pour le numérique, ou pointer vers une page “Référentiels / unités”.
* Expliquer les impacts d’une modification sur les données existantes avec 2 cas (avant/après).
  {% endhint %}
