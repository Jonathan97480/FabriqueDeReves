---
name: ai-scene-format
description: "Use when writing prompts for Gemma, implementing useGemmaGGUF, or handling AI output in useStoryEngine. Covers the exact JSON format the AI must produce for story scenes and choices."
---

# Format JSON des scènes IA — Plume & Rêve

## Contexte

`useGemmaGGUF.ts` génère des scènes de conte. `useStoryEngine.ts` consomme ces scènes.  
L'IA **doit** retourner du JSON strictement conforme — sinon `useStoryEngine` bascule sur les fallbacks statiques.

## Format `GemmaResponse` (une scène)

```typescript
interface GemmaResponse {
  text: string; // Texte narratif affiché à l'enfant (2-4 phrases max)
  visuals: {
    bg: string; // Tag background (ex: "forest", "castle")
    hero: string; // Tag héros  (ex: "leo_happy", "maya_brave")
    item: string; // Tag objet  (ex: "wand", "compass")
    effect: string; // Tag effet  (ex: "stars", "magic")
  };
}
```

### Exemple de réponse valide

```json
{
  "text": "Léo s'avança prudemment dans la forêt enchantée. Les arbres murmurent des secrets anciens autour de lui.",
  "visuals": {
    "bg": "forest",
    "hero": "leo_curious",
    "item": "compass",
    "effect": "fireflies"
  }
}
```

## Tags autorisés par couche

Les tags doivent correspondre aux clés enregistrées dans `AssetManager.ts` :

| Couche   | Tags valides                                                           |
| -------- | ---------------------------------------------------------------------- |
| `bg`     | `forest` `castle` `space` `ocean` `mountain` `village` `garden` `cave` |
| `hero`   | `<characterId>_<pose>` — poses : `happy` `brave` `curious` `thinking`  |
| `item`   | `wand` `compass` `mirror` `book` `crown` `key` `lamp` `flower` `star`  |
| `effect` | `stars` `rain` `snow` `fireflies` `magic` `clouds`                     |

**IDs de personnages** : `leo`, `maya`, `spark`

## Format des choix

```typescript
interface StoryChoice {
  id: string;
  text: string; // Texte du choix (court, 5-8 mots)
  icon: string; // Nom d'icône Ionicons (ex: "compass", "star")
  color: string; // Hex depuis src/theme/colors.ts
  nextScene: string; // ID de la prochaine scène
}
```

## Prompt système recommandé pour Gemma

```
Tu es un conteur pour enfants. Génère UNIQUEMENT du JSON valide, sans texte autour.
Format strict :
{
  "text": "...",
  "visuals": { "bg": "...", "hero": "...", "item": "...", "effect": "..." }
}
Personnage actif : {characterId}
Tags disponibles : [liste des tags]
```

## Pipeline dans useStoryEngine

```
generateStoryScene(prompt) → GemmaResponse JSON
    ↓
AssetManager.getBackground(response.visuals.bg)
AssetManager.getHero(response.visuals.hero)
...
    ↓
currentAssets (state) → <VisualScene />
```

Voir `src/hooks/useStoryEngine.ts` et `src/hooks/useGemmaGGUF.ts` pour l'implémentation.
