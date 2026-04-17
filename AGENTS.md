# Plume & Rêve — Agent Instructions

Application mobile React Native / Expo de contes interactifs pour enfants avec IA locale (Gemma 4 2B GGUF).

## Build & Run

```bash
npm install          # Installation
npm start            # Expo dev server
npm run android      # Émulateur Android
npm run ios          # Simulateur iOS
npm run web          # Navigateur web
```

> Aucun framework de test installé pour l'instant. Ne pas générer de tests Jest sans d'abord ajouter la dépendance.

## Architecture

```
Components (UI pur, aucune logique)
    ↓
Hooks (état + logique métier)
    ↓
Services (utilitaires + mapping d'assets)
```

**Règle absolue : séparation stricte des couches** (voir [PROJET.md](PROJET.md)).

| Dossier              | Rôle                                                                                   |
| -------------------- | -------------------------------------------------------------------------------------- |
| `src/components/`    | Composants UI sans état métier                                                         |
| `src/hooks/`         | Toute la logique → `useStoryEngine.ts` (orchestrateur), `useGemmaGGUF.ts` (IA)         |
| `src/services/`      | `AssetManager.ts` — mapping tags IA → images locales, fallback placeholder             |
| `src/screens/`       | Écrans consommant les hooks, pas de logique directe                                    |
| `src/types/index.ts` | Source de vérité unique pour tous les types                                            |
| `src/theme/`         | Design tokens (colors.ts, styles.ts) — utiliser exclusivement, pas de valeurs magiques |

## Conventions clés

- **TypeScript strict** (`strict: true` dans tsconfig) — typer complètement, pas de `any`
- **Nommage** : composants `PascalCase.tsx`, hooks `useCamelCase.ts`, services `ServiceName.ts`, écrans `NameScreen.tsx`
- **Animations** : utiliser `react-native-reanimated` (pas `Animated` de React Native core)
- **Couleurs / gradients** : importer depuis `src/theme/colors.ts` uniquement
- **Assets manquants** : toujours utiliser `AssetManager.getAssetOrPlaceholder()` — ne jamais accéder aux images directement

## Système visuel 4 couches

Chaque scène est composée de : `background` + `effect` + `hero` + `item`  
Les tags sont générés par l'IA (format JSON) et résolus par `AssetManager`.  
Images dans `src/assets/images/{backgrounds,effects,heroes,items}/`.

## Intégration IA

- `useGemmaGGUF.ts` — hook actif (GGUF via ONNX Runtime, actuellement simulé)
- `useGemma.ts` — hook alternatif MediaPipe (non utilisé en production)
- Modèle : `src/assets/models/gemma-4-E2B-it-UD-IQ2_M.gguf` (~1.2 GB, non versionné)
- Pattern singleton (`gemmaSingleton`) — ne jamais instancier le modèle hors du hook

## Liens documentation

- Architecture détaillée → [PROJET.md](PROJET.md)
- État du projet → [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)
- Intégration GGUF → [GGUF_INTEGRATION.md](GGUF_INTEGRATION.md)
- Gestion des assets → [ASSETS_GUIDE.md](ASSETS_GUIDE.md)
