/**
 * VisualScene.tsx
 * Composant atomique qui affiche une scène avec superposition de 4 couches visuelles
 * Utilise le style 'Absolute Fill' pour superposer les couches
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import AssetImage from './AssetImage';

interface VisualSceneProps {
  background: number | { color: string; tag: string; isPlaceholder: boolean };
  hero: number | { color: string; tag: string; isPlaceholder: boolean } | null;
  item: number | { color: string; tag: string; isPlaceholder: boolean } | null;
  effect: number | { color: string; tag: string; isPlaceholder: boolean };
  onImageLoad?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const VisualScene: React.FC<VisualSceneProps> = ({
  background,
  hero,
  item,
  effect,
  onImageLoad,
}) => {
  // Animation values
  const heroScale = useSharedValue(0);
  const heroOpacity = useSharedValue(0);
  const itemScale = useSharedValue(0);
  const itemOpacity = useSharedValue(0);
  const effectOpacity = useSharedValue(0);

  // Start animations when component mounts
  useEffect(() => {
    // Hero animation - scale up and fade in
    setTimeout(() => {
      heroScale.value = withSpring(1, { damping: 15, stiffness: 100 });
      heroOpacity.value = withTiming(1, { duration: 500 });
    }, 200);

    // Item animation - scale up and fade in
    setTimeout(() => {
      itemScale.value = withSpring(1, { damping: 15, stiffness: 100 });
      itemOpacity.value = withTiming(1, { duration: 500 });
    }, 500);

    // Effect animation - fade in
    setTimeout(() => {
      effectOpacity.value = withTiming(1, { duration: 500 });
    }, 700);
  }, []);

  // Animated styles
  const heroAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heroScale.value }],
    opacity: heroOpacity.value,
  }));

  const itemAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: itemScale.value }],
    opacity: itemOpacity.value,
  }));

  const effectAnimatedStyle = useAnimatedStyle(() => ({
    opacity: effectOpacity.value,
  }));

  const handleImageLoad = () => {
    if (onImageLoad) {
      onImageLoad();
    }
  };

  return (
    <View style={styles.container}>
      {/* Layer 1: Background (Fond) */}
      <AssetImage
        source={background}
        style={styles.backgroundLayer}
        resizeMode="cover"
      />

      {/* Layer 2: Effect (Effet d'ambiance - Météo/Particules) */}
      <Animated.View style={[styles.effectLayer, effectAnimatedStyle]}>
        <AssetImage
          source={effect}
          style={styles.effectImage}
          resizeMode="cover"
          fallbackEmoji="✨"
        />
      </Animated.View>

      {/* Layer 3: Hero (Héros - Pose spécifique en PNG transparent) */}
      {hero !== null && (
        <Animated.View style={[styles.heroLayer, heroAnimatedStyle]}>
          <AssetImage
            source={hero}
            style={styles.heroImage}
            resizeMode="contain"
            fallbackEmoji="🧙"
          />
        </Animated.View>
      )}

      {/* Layer 4: Item (Objet magique - PNG transparent) */}
      {item !== null && (
        <Animated.View style={[styles.itemLayer, itemAnimatedStyle]}>
          <AssetImage
            source={item}
            style={styles.itemImage}
            resizeMode="contain"
            fallbackEmoji="🌟"
          />
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9, // Ratio 16:9 pour un rendu cinématique
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: '#E6F7FF',
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  effectLayer: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
  effectImage: {
    width: '100%',
    height: '100%',
  },
  heroLayer: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  heroImage: {
    width: '80%',
    height: '80%',
  },
  itemLayer: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 20,
    paddingBottom: 20,
    pointerEvents: 'none',
  },
  itemImage: {
    width: '30%',
    height: '30%',
  },
});

export default VisualScene;