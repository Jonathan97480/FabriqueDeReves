/**
 * createPlaceholderAssets.ts
 * Script pour créer des assets placeholder
 *
 * Note: Dans un projet réel, ces assets seraient des images et animations réelles.
 * Pour ce projet, nous allons créer des fichiers placeholder qui peuvent être
 * remplacés par des vrais assets.
 */

import { StyleSheet, View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../../theme/colors';

// Placeholder Components pour le développement

export const PlaceholderBackground = ({ style }: { style?: any }) => (
  <LinearGradient
    colors={gradients.primary}
    style={[StyleSheet.absoluteFill, style]}
  />
);

export const PlaceholderHero = ({ style }: { style?: any }) => (
  <View style={[{
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.pink,
    justifyContent: 'center',
    alignItems: 'center',
  }, style]}>
    <Text style={{ fontSize: 40, color: 'white' }}>🧙</Text>
  </View>
);

export const PlaceholderItem = ({ style }: { style?: any }) => (
  <View style={[{
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.orange,
    justifyContent: 'center',
    alignItems: 'center',
  }, style]}>
    <Text style={{ fontSize: 25 }}>✨</Text>
  </View>
);

export const PlaceholderEffect = ({ style }: { style?: any }) => (
  <View style={[StyleSheet.absoluteFill, {
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.3,
  }, style]}>
    <Text style={{ fontSize: 100 }}>⭐</Text>
  </View>
);

export const PlaceholderIcon = ({ name, style }: { name: string, style?: any }) => (
  <View style={[{
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.green,
    justifyContent: 'center',
    alignItems: 'center',
  }, style]}>
    <Text style={{ fontSize: 20 }}>{name}</Text>
  </View>
);

// Fonction pour créer des placeholders de fichiers (à utiliser avec react-native-fs)
// Note: Ceci est un exemple - dans un vrai projet, vous utiliseriez des vraies images

export const createPlaceholderImage = (width: number, height: number, color: string) => {
  // Cette fonction créerait une image placeholder
  // Pour l'instant, nous utilisons les composants React ci-dessus
  return null;
};

// Liste des assets nécessaires avec leurs placeholders

export const REQUIRED_ASSETS = {
  backgrounds: [
    'forest',
    'castle',
    'space',
    'ocean',
    'mountain',
    'village',
    'garden',
    'cave',
    'default',
  ],
  heroes: [
    'leo_happy',
    'leo_brave',
    'leo_curious',
    'leo_thinking',
    'maya_happy',
    'maya_brave',
    'maya_curious',
    'maya_thinking',
    'spark_happy',
    'spark_brave',
    'spark_curious',
    'spark_thinking',
    'default',
  ],
  items: [
    'wand',
    'compass',
    'mirror',
    'book',
    'crown',
    'key',
    'lamp',
    'flower',
    'star',
    'default',
  ],
  effects: [
    'stars',
    'rain',
    'snow',
    'fireflies',
    'magic',
    'clouds',
    'default',
  ],
  icons: [
    'compass',
    'cave',
    'fairy',
    'star',
    'map',
    'key',
  ],
  animations: [
    'hero_idle',
    'magic_effect',
    'transition',
    'success',
  ],
  models: [
    'gemma-4-2b-int4.task',
  ],
};

export default REQUIRED_ASSETS;