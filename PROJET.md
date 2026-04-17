Agis en tant qu'Expert Architecte Mobile React Native. Tu m'aides à développer "Plume & Rêve", une application de contes interactifs offline pour enfants.

### STACK TECHNIQUE :

- Framework : React Native (Architecture moderne).
- IA Locale : Gemma 4 2B (via MediaPipe LLM Inference SDK).
- Visuels : Stratégie de "Calques Combinatoires" (Images WebP locales superposées).
- Animations : Lottie pour les éléments dynamiques (héros, effets).

### ARCHITECTURE DU PROJET (SÉPARATION STRICTE) :

1. COMPOSANTS UI (/src/components/) :
   - Tout doit être un composant atomique (ex: <MagicButton />, <StoryText />, <VisualScene />).
   - INTERDICTION de mettre de la logique métier ici. Ils reçoivent des props et affichent du visuel.
2. LOGIQUE & ÉTAT (/src/hooks/) :
   - Toute l'intelligence doit être dans des Custom Hooks.
   - useGemma.js : Gère l'inférence locale et le streaming du texte.
   - useStoryEngine.js : Gère l'état de l'histoire et la sélection des assets visuels.
3. SERVICES (/src/services/) :
   - AssetManager.js : Logique pour mapper les tags de l'IA vers les fichiers images locaux.

### STRATÉGIE VISUELLE (COMBINATOIRE) :

L'interface visuelle superpose 4 couches :

1. Fond (Background)
2. Effet d'ambiance (Météo/Particules)
3. Héros (Pose spécifique en PNG transparent)
4. Objet magique (PNG transparent)

L'IA (Gemma) doit impérativement répondre au format JSON ou inclure des tags comme ceci :
{
"text": "Le texte de l'histoire...",
"visuals": { "bg": "forest", "hero": "happy", "item": "wand", "effect": "stars" }
}

### TA MISSION :

1. Propose l'arborescence complète des dossiers en respectant cette séparation.
2. Génère le code du service `AssetManager.js` qui transforme les tags de l'IA en chemins d'accès vers les images locales.
3. Génère le composant `VisualScene.js` qui utilise le style 'Absolute Fill' pour superposer les 4 couches d'images avec un bel arrondi de bordure.

Sois extrêmement rigoureux sur la propreté du code et l'aspect "Féérique" du design system.
