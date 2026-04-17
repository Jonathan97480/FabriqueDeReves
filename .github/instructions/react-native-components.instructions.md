---
description: "Use when creating or modifying React Native components, screens, or hooks. Covers Reanimated, StyleSheet, SafeArea, and project-specific component rules."
applyTo: "src/**/*.tsx"
---

# Règles composants React Native — Plume & Rêve

## Animations

- Toujours utiliser `react-native-reanimated` : `useSharedValue`, `useAnimatedStyle`, `withSpring`, `withTiming`
- **Jamais** `Animated` de `react-native` core
- Pattern standard pour une entrée :
  ```tsx
  const scale = useSharedValue(0);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  useEffect(() => {
    scale.value = withSpring(1);
  }, []);
  ```

## Styles

- Toujours `StyleSheet.create({})` — jamais d'objets de style inline non mémoïsés
- Couleurs et gradients : importer depuis `src/theme/colors.ts` uniquement
- Styles communs réutilisables : importer depuis `src/theme/styles.ts`
- Pas de valeurs magiques (`#FF0000`, `16`, `0.5`…) → utiliser les tokens du thème

## Composants

- Les composants dans `src/components/` ne contiennent **aucun état métier** : uniquement des props typées + rendu
- Les composants dans `src/screens/` consomment les hooks, pas de logique directe
- Tout état et logique → dans un hook de `src/hooks/`
- Props complètement typées, pas de `any`

## Assets

- **Jamais** accéder aux images directement avec `require()`
- Toujours passer par `AssetManager.getAssetOrPlaceholder()` (voir [ASSETS_GUIDE.md](../../ASSETS_GUIDE.md))
- L'`AssetImage` component gère le rendu placeholder/image réelle automatiquement

## SafeArea & Layout

- Utiliser `SafeAreaView` de `react-native-safe-area-context` (pas de `react-native`)
- Wrapping global déjà présent dans `App.tsx` via `SafeAreaProvider`

## Gradients

- Utiliser `LinearGradient` de `expo-linear-gradient`
- Les tableaux de couleurs viennent de `gradients` dans `src/theme/colors.ts`
