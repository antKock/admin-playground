# ✨ Fonctionnalités utilisateur

## 📢 Feed d'activités

### 🎯 Qu'est-ce que c'est ?

Un **fil d'actualités** qui liste toutes les modifications effectuées sur la plateforme.

### 📱 Où le trouver ?

**Emplacement suggéré** :

- Icone "🔔 Notifications" dans le menu
- Page dédiée "Activités"
- Widget sur le tableau de bord

### 👀 Que voit-on ?

Chaque entrée affiche :

- **Qui** : Nom + photo de l'utilisateur
- **Quoi** : Description claire de l'action
- **Quand** : Date/heure relative ("il y a 2h")
- **Changements** : Résumé des modifications

### 💡 Exemples

```
👤 Marie Martin - il y a 2 heures
   a modifié le dossier "Rénovation École Pasteur"
   Statut : signé → cloté
   👁️ Voir le dossier

👤 Jean Dupont - il y a 3 heures  
   a créé l'action "Formation du personnel"
   dans le dossier "Projet ABC"
   👁️ Voir l'action

👤 Sophie Bernard - hier à 16h45
   a supprimé le dossier "Test projet"
   👁️ Voir la version sauvegardée
```

### 🎯 Filtres disponibles

- **Par utilisateur** : "Que fait Marie ?"
- **Par type** : "Toutes les créations de dossiers"
- **Par date** : "Activités de la semaine dernière"
- **Par projet** : "Tout ce qui concerne le dossier #123"

### 🔔 Notifications

**"Qu'est-ce qui s'est passé depuis ma dernière visite ?"**

Badge avec le nombre de nouvelles activités :

- 🔔 **12 nouvelles modifications**
- Affiché au login
- Liste des activités pendant l'absence

---

## 📚 Onglet "Historique" sur les pages

### 🎯 Qu'est-ce que c'est ?

Un **onglet dédié** sur chaque page de dossier/action montrant son historique complet.

### 📍 Où le placer ?

En tant qu'onglet sur les pages de détail :

```
[📋 Détails] [📎 Actions] [📊 Budget] [🕰️ Historique]
```

### 👀 Que voit-on ?

**Timeline verticale** des modifications :

```
● 15 déc. 14h30 - Marie Martin
  Modifié : Statut signé → cloté
  📸 Version sauvegardée
  
● 10 déc. 09h15 - Jean Dupont  
  Modifié : Budget 50 000€ → 55 000€
  
● 5 déc. 16h00 - Sophie Bernard
  Création du dossier
  📸 Version initiale
```

---

## 📸 Consultation des versions

### 🎯 Qu'est-ce que c'est ?

**Voyager dans le temps** pour voir un objet tel qu'il était avant.

### 🕹️ Interface proposée

**Sélecteur de version** :

```
📸 Voir une version antérieure

🗓️ Sélectionnez une date :
[▼] 15 déc. 14h30 - Avant cloture
    10 déc. 09h15 - Avant changement budget  
    5 déc. 16h00 - Version initiale

[Voir cette version]
```

### 👁️ Mode lecture seule

Quand on consulte une version :

- **Bandeau jaune** : "⚠️ Version du 10 décembre - Lecture seule"
- Tous les champs grisés (non modifiables)
- Bouton **"Revenir à la version actuelle"**
- Bouton **"Comparer avec aujourd'hui"**

---

## ⚖️ Comparaison de versions

### 🎯 Qu'est-ce que c'est ?

Voir **les différences** entre deux versions du même objet.

### 🎨 Design proposé

**Vue côte à côte** :

```
┌─────────────────────────┬─────────────────────────┐
│ Version 10 déc. 09h15   │ Version actuelle        │
├─────────────────────────┼─────────────────────────┤
│ Nom                     │ (identique)             │
│ Rénovation École Pasteur│                         │
├─────────────────────────┼─────────────────────────┤
│ Statut                  │ ❌ DIFFÉRENT            │
│ 🔴 signé                │ 🟢 cloté                │
├─────────────────────────┼─────────────────────────┤
│ Budget                  │ ❌ DIFFÉRENT            │
│ 🔴 50 000 €             │ 🟢 55 000 €             │
└─────────────────────────┴─────────────────────────┘

Légende : 🔴 Ancien  🟢 Nouveau
```

### 💡 Cas d'usage

- "Qu'est-ce qui a changé depuis la validation ?"
- "Comparer le budget initial vs final"
- "Voir l'évolution d'un projet sur 6 mois"

---

## 📊 Récapitulatif des interfaces

| Fonctionnalité | Où ? | Quoi ? |
| --- | --- | --- |
| **Feed global** | Menu principal | Toutes les activités récentes |
| **Timeline projet** | Onglet historique | Modifications d'un objet |
| **Versions** | Sélecteur de date | Voir état passé |
| **Comparaison** | Mode diff | Changements entre 2 dates |
| **Notifications** | Badge login | Nouveautés depuis dernière visite |