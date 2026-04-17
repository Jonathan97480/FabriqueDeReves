# Plume & Rêve 🌙✨

Application de contes interactifs offline pour enfants avec IA locale.

## 🎯 Caractéristiques

- **Architecture React Native moderne** avec séparation stricte des préoccupations
- **IA Locale Gemma 4 2B** pour génération de histoires personnalisées
- **Stratégie visuelle combinatoire** avec superposition de 4 couches
- **Animations fluides** avec React Native Reanimated et Lottie
- **Mode offline** - fonctionne sans connexion internet
- **Interface féérique** adaptée aux enfants

## 🏗️ Architecture

### Structure du projet

```
src/
├── components/        # Composants UI atomiques
│   ├── Header.tsx
│   ├── ProgressBar.tsx
│   ├── VisualScene.tsx
│   ├── StoryText.tsx
│   ├── ChoiceButton.tsx
│   ├── MagicButton.tsx
│   └── CharacterCard.tsx
├── screens/          # Écrans de l'application
│   ├── CharacterSelectionScreen.tsx
│   └── StoryScreen.tsx
├── hooks/           # Custom Hooks pour la logique métier
│   ├── useGemma.js
│   └── useStoryEngine.js
├── services/        # Services utilitaires
│   └── AssetManager.js
├── navigation/      # Configuration de la navigation
│   └── AppNavigator.tsx
├── theme/          # Thème et styles
│   ├── colors.ts
│   └── styles.ts
├── types/          # Types TypeScript
│   └── index.ts
└── assets/         # Assets statiques
    ├── images/
    ├── animations/
    └── models/
```

### Principes d'architecture

1. **Composants UI** : Uniquement de la présentation, aucune logique métier
2. **Hooks** : Toute l'intelligence et la gestion d'état
3. **Services** : Logique utilitaire et mapping d'assets

## 🎨 Système visuel

### Couches combinatoires

L'application superpose 4 couches visuelles :

1. **Background** : Fond de scène (forêt, château, espace, etc.)
2. **Effect** : Effets d'ambiance (étoiles, pluie, neige, etc.)
3. **Hero** : Personnage avec pose spécifique
4. **Item** : Objet magique

### Palette de couleurs

- **Bleu féérique** : `#E6F7FF` → `#B3E0FF`
- **Rose magique** : `#FF9EC8`
- **Orange enchanté** : `#FFB366`
- **Vert nature** : `#A8E6CF`
- **Violet mystique** : `#D8B5FF`

## 🚀 Installation et démarrage

### Prérequis

- Node.js 18+
- npm ou yarn
- Expo CLI
- React Native development environment

### Installation

```bash
# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm start

# Pour iOS
npm run ios

# Pour Android
npm run android

# Pour Web
npm run web
```

### Assets requis

Les assets suivants doivent être placés dans le dossier `src/assets/` :

```
assets/
├── images/
│   ├── backgrounds/      # Fonds de scène (.webp)
│   ├── heroes/           # Personnages (.png transparent)
│   ├── items/            # Objets magiques (.png transparent)
│   ├── effects/          # Effets d'ambiance (.webp)
│   └── icons/            # Icônes de boutons (.png)
├── animations/          # Animations Lottie (.json)
└── models/              # Modèles Gemma (.task)
```

## 🤖 Intégration IA

### Modèle Gemma 4 2B

Le modèle doit être téléchargé et placé dans `assets/models/` :

- **Fichier** : `gemma-4-2b-int4.task`
- **Format** : MediaPipe LLM Inference SDK
- **Taille** : ~1.2GB

### Configuration

La configuration du modèle se fait dans `src/hooks/useGemma.js` :

```javascript
const config = {
  modelPath: '/models/gemma-4-2b-int4.task',
  maxTokens: 500,
  temperature: 0.7
};
```

## 📱 Fonctionnalités principales

### 1. Sélection de personnage
- 3 personnages uniques (Léo, Maya, Étincelle)
- Cartes interactives avec animations
- Feedback visuel de sélection

### 2. Génération d'histoire
- Texte généré par l'IA locale
- Effet de frappe progressif
- Choix interactifs pour l'utilisateur

### 3. Scènes visuelles
- Superposition de 4 couches
- Animations fluides d'entrée
- Mise à jour dynamique des assets

### 4. Progression
- Barre de progression visuelle
- Suivi des choix de l'utilisateur
- Possibilité de recommencer

## 🔧 Personnalisation

### Ajouter un personnage

1. Ajouter les images dans `assets/images/heroes/`
2. Mettre à jour `AssetManager.js` :
```javascript
getCharacterInfo(characterId) {
  const characterMap = {
    'new_char': {
      id: 'new_char',
      name: 'Nom du personnage',
      description: 'Description',
      image: this.getHero('new_char_happy'),
      theme: 'theme',
    },
    // ...
  };
}
```

### Ajouter des scènes

Modifier les mappings dans `AssetManager.js` :

```javascript
backgrounds: {
  'new_bg': require('../assets/images/backgrounds/new_bg.webp'),
  // ...
}
```

## 📝 Notes de développement

### Séparation stricte

- **Composants** : Receivent des props, affichent du visuel
- **Hooks** : Gèrent l'état et la logique métier
- **Services** : Fournissent des fonctions utilitaires

### Performance

- Utilisation de `StyleSheet.create` pour la performance
- Animations avec `react-native-reanimated`
- Images optimisées en WebP

### Accessibilité

- Contraste suffisant pour les textes
- Touch targets minimum 44x44px
- Support pour screen readers

## 🐛 Problèmes connus

- Le modèle Gemma peut prendre du temps à se charger
- Les animations peuvent être moins fluides sur les appareils plus anciens
- Le streaming de texte est simulé (MediaPipe n'a pas de streaming natif)

## 🚧 À faire

- [ ] Intégration complète de l'IA Gemma
- [ ] Sons et effets audio
- [ ] Plus de scènes et d'histoires
- [ ] Système de sauvegarde
- [ ] Mode multi-joueur
- [ ] Personnalisation avancée

## 📄 Licence

Ce projet est développé dans un but éducatif.

## 🙏 Remerciements

- React Native et Expo
- MediaPipe pour l'inférence locale
- Lottie pour les animations
- La communauté open source

---

**Plume & Rêve** - Là où les rêves deviennent réalité ✨