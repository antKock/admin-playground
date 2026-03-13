# Paramètres individuels par enfant sur les indicateurs de groupe

**Statut :** En attente de décision backend
**Date :** 2026-03-13
**Epic :** Enrichissement indicateurs groupe

---

## Problème

Quand un indicateur de type **groupe** est associé à un modèle d'action, l'utilisateur peut configurer les 6 paramètres (visibilité, obligatoire, éditable, valeur par défaut, duplicable, valeurs contraintes) sur le **parent uniquement**.

Les **indicateurs enfants** du groupe n'ont aucune configuration de paramètres individuelle. L'utilisateur a besoin de pouvoir définir des paramètres différents sur chaque enfant (ex : rendre un enfant obligatoire mais pas les autres).

---

## État actuel du schéma

### Écriture (`IndicatorModelAssociationInput`)

Structure plate — un seul `indicator_model_id` + 6 champs de paramètres :

```
indicator_model_associations: [
  { indicator_model_id, visibility_rule, required_rule, editable_rule, ... }
]
```

### Lecture (`IndicatorModelWithAssociation`)

Ne contient pas les enfants. Champs : `id`, `name`, `type`, `unit`, + les 6 paramètres d'association.

### Modèle indicateur (`IndicatorModelRead`)

Contient `children: IndicatorModelRead[]` pour le type groupe — mais cette info n'est pas propagée dans les associations.

---

## Proposition UX (Sally)

Layout de la carte indicateur groupe quand elle est dépliée :

```
┌─────────────────────────────────────────────────────┐
│ ⠿  📊 Mon Indicateur Groupe    [group]   ● ● ● ✕ ▾ │  ← Carte parent (style existant)
├─────────────────────────────────────────────────────┤
│  ▸ Obligatoire  ▸ Non éditable  ▸ Masqué  ...      │  ← 6 paramètres du parent
│─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│  INDICATEURS DU GROUPE                    2 enfants │  ← Séparateur avec label
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │  Indicateur Enfant 1    [number]   ● ● ● ▾   │  │  ← Carte enfant (indentée, fond clair)
│  │  └─ tech_label_1                              │  │
│  ├───────────────────────────────────────────────┤  │
│  │  ▸ Obligatoire  ▸ Non éditable  ▸ Masqué ... │  │  ← 6 paramètres de l'enfant
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │  Indicateur Enfant 2    [text]     ● ● ● ▾   │  │
│  │  └─ tech_label_2                              │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Principes de design

1. **Hiérarchie visuelle** — Les enfants sont imbriqués à l'intérieur de la carte parent, indentés avec un fond plus clair. Ça rend immédiatement clair qu'ils font partie du groupe.

2. **Séparation claire** — Un séparateur en pointillés avec le label **"Indicateurs du groupe"** sépare les paramètres du parent de ceux des enfants. Les paramètres du parent apparaissent en premier.

3. **Expand/collapse indépendant** — Chaque enfant a son propre chevron pour déplier ses 6 paramètres indépendamment. Déplier la carte parent montre à la fois ses propres paramètres ET la section enfants.

4. **Pas de bouton supprimer sur les enfants** — Les enfants ne sont pas détachables individuellement — ils viennent avec le groupe. Seul le parent a le bouton ✕.

5. **Pas de drag handle sur les enfants** — L'ordre des enfants suit la définition du modèle d'indicateur, pas configurable au niveau de l'association.

---

## Décision technique en attente

### Option A — Plat (hack frontend)

Attacher automatiquement chaque enfant comme une entrée `IndicatorModelAssociationInput` séparée à côté du parent. Le frontend les imbrique visuellement.

- **+** Zéro modification backend
- **−** Les enfants apparaissent comme des indicateurs indépendants dans le modèle de données. Rien dans le schéma ne les relie à leur parent. Réordonnancement, détachement et intégrité fragiles. Les consommateurs de l'API ne peuvent pas distinguer enfants de groupe vs indicateurs autonomes.

### Option B — Imbriqué (modification du schéma)

Ajouter un champ optionnel `children_associations` à `IndicatorModelAssociationInput` :

```python
class IndicatorModelAssociationInput:
    indicator_model_id: UUID
    visibility_rule: str = "true"
    required_rule: str = "false"
    editable_rule: str = "true"
    default_value_rule: str | None = None
    duplicable: DuplicableConfig | None = None
    constrained_values: ConstrainedValuesConfig | None = None
    # NOUVEAU — pertinent uniquement quand l'indicateur est de type "group"
    children_associations: list[ChildIndicatorAssociationInput] | None = None
```

`ChildIndicatorAssociationInput` a les mêmes 6 champs de paramètres + `indicator_model_id`, sans imbrication supplémentaire.

- **+** Modèle de données propre, relation parent-enfant explicite, les consommateurs de l'API comprennent la hiérarchie
- **−** Migration du schéma backend + le modèle de lecture (`IndicatorModelWithAssociation`) doit inclure les enfants avec leurs paramètres

### Option C — Endpoint séparé ?

À discuter — un endpoint dédié pour gérer les associations enfants indépendamment.

---

## Fichiers impactés (frontend, une fois la décision prise)

| Fichier | Modification |
|---------|-------------|
| `shared/components/indicator-card/indicator-card.component.ts` | Ajouter section enfants imbriquée dans la carte dépliée |
| `features/action-models/action-model.facade.ts` | Gérer les paramètres enfants dans `_paramEdits`, `saveParamEdits()`, `attachIndicator()` |
| `features/action-models/action-model.store.ts` | Propager les données enfants depuis `attachedIndicators` |
| `core/api/generated/api-types.ts` | Régénérer après modification backend (si Option B) |
| `domains/action-models/action-model.models.ts` | Mettre à jour les types TypeScript |
