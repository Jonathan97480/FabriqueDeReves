# 🚀 Démarrage rapide - Plume & Rêve

Guide rapide pour lancer l'application et commencer le développement.

## 📋 Prérequis

- **Node.js** 18+ : [Télécharger ici](https://nodejs.org/)
- **npm** (inclus avec Node.js)
- **Expo CLI** : `npm install -g expo-cli`
- **IDE** : VS Code (recommandé) avec les extensions React Native

## ⚡ Installation rapide

### Windows
Double-cliquez sur `INSTALL.bat` ou exécutez :

```bash
npm install
npm start
```

### Mac/Linux
```bash
chmod +x INSTALL.sh
./INSTALL.sh
```

Ou manuellement :

```bash
npm install
npm start
```

## 📱 Lancer l'application

Après installation, vous avez plusieurs options :

### Option 1 : Expo Go (Recommandé pour le développement rapide)

1. **Téléchargez Expo Go** sur votre téléphone :
   - [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - [iOS](https://apps.apple.com/app/expo-go/id982107779)

2. **Scannez le QR code** affiché dans le terminal
3. **L'application se lance** sur votre téléphone !

### Option 2 : Émulateur Android

```bash
npm run android
```

*Prérequis : Android Studio avec émulateur configuré*

### Option 3 : Simulateur iOS (Mac seulement)

```bash
npm run ios
```

*Prérequis : Xcode installé*

### Option 4 : Navigateur Web

```bash
npm run web
```

*Note : Certaines fonctionnalités natives peuvent ne pas fonctionner parfaitement*

## 🎨 Premiers pas

### 1. Explorer l'application

Une fois lancée, l'application affiche :

1. **Écran de sélection** : Choisissez votre héros (Léo, Maya ou Étincelle)
2. **Écran d'histoire** : Découvrez une histoire interactive avec des placeholders
3. **Choix** : Faites des choix pour continuer l'histoire

### 2. Comprendre les placeholders

L'application fonctionne avec des **placeholders colorés** tant que les vrais assets ne sont pas créés :

- 🧙 **Héros** : Cercles colorés avec emoji
- 🌟 **Objets** : Petits cercles avec étoiles
- ✨ **Effets** : Émojis d'ambiance
- 🎨 **Fonds** : Dégradés de couleurs

### 3. Structure du code

```
src/
├── components/     # Composants UI réutilisables
├── screens/       # Écrans de l'application
├── hooks/        # Logique métier (useGemma, useStoryEngine)
├── services/      # Services (AssetManager)
├── navigation/    # Configuration navigation
└── theme/        # Couleurs et styles
```

## 🔧 Personnalisation rapide

### Changer les couleurs

Modifiez `src/theme/colors.ts` :

```typescript
export const colors = {
  pink: '#FF9EC8',      // Changez cette couleur
  orange: '#FFB366',
  // ...
};
```

### Ajouter un personnage

1. Créez les images dans `src/assets/images/heroes/`
2. Ajoutez le mapping dans `src/services/AssetManager.js`
3. Le personnage apparaît automatiquement !

### Modifier le texte de l'histoire

Les textes sont générés par l'IA locale (Gemma 4 2B) ou par défaut dans `src/hooks/useStoryEngine.js`.

## 📚 Documentation complète

- **README.md** : Documentation complète du projet
- **ASSETS_GUIDE.md** : Guide de création des assets visuels
- **PROJET.md** : Spécifications techniques originales

## 🐛 Problèmes courants

### "Module not found"
```bash
rm -rf node_modules
npm install
```

### "Metro bundler error"
```bash
npx expo start --clear
```

### L'application ne se lance pas
- Vérifiez que votre téléphone et ordinateur sont sur le même réseau
- Désactivez le VPN/Firewall temporairement
- Essayez avec un câble USB (Android)

## 🎯 Prochaines étapes

1. **Créer les vrais assets** : Suivez `ASSETS_GUIDE.md`
2. **Configurer l'IA** : Téléchargez le modèle Gemma 4 2B
3. **Personnaliser les histoires** : Modifiez les prompts dans `useGemma.js`
4. **Ajouter des fonctionnalités** : Sons, sauvegarde, etc.

## 💬 Besoin d'aide ?

- **Expo Documentation** : https://docs.expo.dev/
- **React Native** : https://reactnative.dev/
- **MediaPipe** : https://developers.google.com/mediapipe

---

**Bon développement !** 🎉

L'application est prête à être personnalisée. N'hésitez pas à explorer le code et à apporter vos modifications.