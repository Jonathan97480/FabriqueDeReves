# Guide de création des assets pour Plume & Rêve 🎨

Ce guide explique comment créer et organiser les assets visuels pour l'application.

## 📁 Structure des dossiers

```
src/assets/
├── images/
│   ├── backgrounds/          # Fonds de scène
│   ├── heroes/               # Personnages
│   ├── items/                # Objets magiques
│   ├── effects/              # Effets d'ambiance
│   └── icons/                # Icônes de boutons
├── animations/              # Animations Lottie
└── models/                  # Modèles IA
```

## 🖼️ Backgrounds (Fonds de scène)

**Format** : WebP
**Dimensions** : 1920x1080 (16:9 ratio)
**Dossier** : `src/assets/images/backgrounds/`

**Fichiers requis** :
- `forest.webp` - Forêt enchantée
- `castle.webp` - Château magique
- `space.webp` - Espace cosmique
- `ocean.webp` - Océan mystérieux
- `mountain.webp` - Montagne mystique
- `village.webp` - Village féerique
- `garden.webp` - Jardin magique
- `cave.webp` - Grotte secrète
- `default.webp` - Fond par défaut

**Style** :
- Dégradés doux et féeriques
- Palette de couleurs : bleus, verts, violets
- Éléments fantastiques : étoiles, arbres, châteaux
- Pas de textes ou éléments distraits

## 👤 Heroes (Personnages)

**Format** : PNG avec transparence
**Dimensions** : 800x800 px minimum
**Dossier** : `src/assets/images/heroes/`

**Fichiers requis** :

### Léo (Astronaute)
- `leo_happy.png` - Content/souriant
- `leo_brave.png` - Courageux/déterminé
- `leo_curious.png` - Curieux/intéressé
- `leo_thinking.png` - Réfléchissant

### Maya (Princesse)
- `maya_happy.png` - Content/souriant
- `maya_brave.png` - Courageuse/déterminée
- `maya_curious.png` - Curieuse/intéressée
- `maya_thinking.png` - Réfléchissante

### Étincelle (Dragon)
- `spark_happy.png` - Content/souriant
- `spark_brave.png` - Courageux/déterminé
- `spark_curious.png` - Curieux/intéressé
- `spark_thinking.png` - Réfléchissant

**Style** :
- Style cartoon/manga enfantin
- Expressions claires et exagérées
- Fond transparent
- Contours noirs épais
- Couleurs vives et saturées

## 🪄 Items (Objets magiques)

**Format** : PNG avec transparence
**Dimensions** : 256x256 px minimum
**Dossier** : `src/assets/images/items/`

**Fichiers requis** :
- `wand.png` - Baguette magique
- `compass.png` - Boussole magique
- `mirror.png` - Miroir enchanté
- `book.png` - Livre de sorts
- `crown.png` - Couronne royale
- `key.png` - Clé mystérieuse
- `lamp.png` - Lampe magique
- `flower.png` - Fleur magique
- `star.png` - Étoile filante
- `default.png` - Objet par défaut

**Style** :
- Style iconique et reconnaissable
- Effets de brillance/magie
- Fond transparent
- Isolé sur fond blanc pour editing

## ✨ Effects (Effets d'ambiance)

**Format** : WebP avec transparence
**Dimensions** : 1920x1080 (16:9 ratio)
**Dossier** : `src/assets/images/effects/`

**Fichiers requis** :
- `stars.webp` - Étoiles scintillantes
- `rain.webp` - Pluie douce
- `snow.webp` - Neige légère
- `fireflies.webp` - Lucioles
- `magic.webp` - Particules magiques
- `clouds.webp` - Nuages doux
- `default.webp` - Effet par défaut

**Style** :
- Subtil et non-intrusif
- Animation suggérée par la composition
- Transparence pour superposition
- Couleurs pastel

## 🎯 Icons (Icônes de boutons)

**Format** : PNG avec transparence
**Dimensions** : 64x64 px minimum
**Dossier** : `src/assets/images/icons/`

**Fichiers requis** :
- `compass.png` - Icône boussole
- `cave.png` - Icône grotte
- `fairy.png` - Icône fée
- `star.png` - Icône étoile
- `map.png` - Icône carte
- `key.png` - Icône clé

**Style** :
- Style flat/material design
- Fond transparent
- Contours épais
- Couleurs unies

## 🎬 Animations (Lottie)

**Format** : JSON (Lottie)
**Dossier** : `src/assets/animations/`

**Fichiers requis** :
- `hero_idle.json` - Animation d'attente du héros
- `magic_effect.json` - Effet magique
- `transition.json` - Transition de scène
- `success.json` - Animation de succès

**Caractéristiques** :
- Boucle infinie pour idle
- Courtes (2-3 secondes) pour transitions
- Optimisées pour mobile
- Palette de couleurs cohérente

## 🤖 Models (Modèles IA)

**Format** : .task (MediaPipe)
**Dossier** : `src/assets/models/`

**Fichiers requis** :
- `gemma-4-2b-int4.task` - Modèle Gemma 4 2B quantifié

**Téléchargement** :
Le modèle doit être téléchargé depuis les sources officielles MediaPipe ou Google.

## 🛠️ Outils recommandés

### Pour les images
- **Adobe Photoshop** - Édition professionnelle
- **GIMP** - Alternative gratuite
- **Figma** - Design et prototypage
- **Canva** - Design accessible
- **Pixelmator** - Édition Mac

### Pour les animations
- **After Effects** + **Bodymovin** - Export Lottie
- **LottieFiles** - Bibliothèque et éditeur en ligne
- **Haiku** - Création d'animations

### Pour l'optimisation
- **Squoosh** - Compression WebP
- **TinyPNG** - Compression PNG
- **ImageOptim** - Optimisation Mac

## 📝 Checklist de création

Pour chaque asset :

- [ ] Format correct (WebP/PNG)
- [ ] Dimensions appropriées
- [ ] Fond transparent (si nécessaire)
- [ ] Palette de couleurs cohérente
- [ ] Style adapté aux enfants
- [ ] Optimisation pour mobile
- [ ] Nom de fichier correct
- [ ] Placement dans le bon dossier

## 🎨 Directives de style

### Couleurs principales
- **Bleu féérique** : `#E6F7FF` → `#B3E0FF`
- **Rose magique** : `#FF9EC8`
- **Orange enchanté** : `#FFB366`
- **Vert nature** : `#A8E6CF`
- **Violet mystique** : `#D8B5FF`

### Principes de design
1. **Accessibilité** : Contraste suffisant, textes lisibles
2. **Enfants** : Formes simples, couleurs vives, expressions claires
3. **Performance** : Optimisation pour mobile, poids minimal
4. **Cohérence** : Style uniforme à travers tous les assets
5. **Magie** : Éléments fantastiques, brillance, effets lumineux

## 🔧 Intégration dans le code

Une fois les assets créés :

1. Placez-les dans les dossiers appropriés
2. Mettez à jour `src/services/AssetManager.js` avec les nouveaux chemins
3. Testez avec le composant `AssetImage` qui gère automatiquement les placeholders
4. Vérifiez le rendu sur différents appareils

## 🆘 Support

Pour toute question sur la création des assets, consultez :
- La documentation React Native sur les images
- Les guidelines Lottie pour les animations
- Les spécifications MediaPipe pour les modèles IA

---

**Note** : Le projet fonctionne avec des placeholders colorés jusqu'à ce que les vrais assets soient créés. Utilisez-les comme guide pour le style et les dimensions.