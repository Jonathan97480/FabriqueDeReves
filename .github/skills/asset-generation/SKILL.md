---
name: asset-generation
description: "Use when adding new visual assets (backgrounds, heroes, items, effects) to the project. Covers naming conventions, file format, folder placement, and registering the tag in AssetManager.ts."
argument-hint: "type de l'asset à ajouter (background/hero/item/effect)"
---

# Ajout d'un asset visuel — Plume & Rêve

## Système 4 couches

Chaque scène combine : `background` + `effect` + `hero` + `item`  
Les tags texte générés par l'IA sont résolus par `AssetManager` → images locales.

## Étapes pour ajouter un asset

### 1. Créer le fichier image

| Couche       | Dossier                          | Format                    | Taille recommandée |
| ------------ | -------------------------------- | ------------------------- | ------------------ |
| `background` | `src/assets/images/backgrounds/` | `.webp`                   | 1080×1920          |
| `hero`       | `src/assets/images/heroes/`      | `.png` (fond transparent) | 400×600            |
| `item`       | `src/assets/images/items/`       | `.png` (fond transparent) | 200×200            |
| `effect`     | `src/assets/images/effects/`     | `.webp`                   | 1080×1920          |

**Convention de nommage** : `<tag>.webp` ou `<tag>.png`  
Exemple : `forest.webp`, `leo_happy.png`, `wand.png`, `stars.webp`

### 2. Enregistrer le tag dans AssetManager.ts

Fichier : `src/services/AssetManager.ts`

Dans le constructeur, ajouter le tag + couleur placeholder dans la section correspondante :

```typescript
// Pour un background
this.placeholderColors.backgrounds["nouveau_tag"] = "#HEX";

// Pour un hero
this.placeholderColors.heroes["personnage_pose"] = "#HEX";
// Format hero tag : '<characterId>_<pose>' (poses: happy, brave, curious, thinking)

// Pour un item
this.placeholderColors.items["nom_item"] = "#HEX";

// Pour un effect
this.placeholderColors.effects["nom_effet"] = "#HEX";
```

### 3. Mapper le tag vers le require() (quand l'image existe)

Quand l'image réelle est prête (pas encore implémenté — voir TODO dans AssetManager), ajouter un `require()` dans la méthode correspondante :

```typescript
getBackground(tag: string) {
  const imageMap: Record<string, any> = {
    forest: require('../assets/images/backgrounds/forest.webp'),
    // ...
  };
  return imageMap[tag] ?? this.getPlaceholder('backgrounds', tag);
}
```

### 4. Vérifier dans l'app

- L'asset est rendu via `<AssetImage>` → `VisualScene`
- Si `isPlaceholder: true` → carré coloré avec le tag affiché
- Si image réelle → rendu normal

## Tags existants (référence)

- **Backgrounds** : `forest`, `castle`, `space`, `ocean`, `mountain`, `village`, `garden`, `cave`
- **Heroes** : `leo_happy`, `leo_brave`, `leo_curious`, `leo_thinking`, `maya_*`, `spark_*`
- **Items** : `wand`, `compass`, `mirror`, `book`, `crown`, `key`, `lamp`, `flower`, `star`
- **Effects** : `stars`, `rain`, `snow`, `fireflies`, `magic`, `clouds`

Voir [ASSETS_GUIDE.md](../../ASSETS_GUIDE.md) pour la documentation complète.
