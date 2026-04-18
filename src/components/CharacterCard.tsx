/**
 * CharacterCard.tsx
 * Composant atomique pour afficher une carte de personnage
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import AssetImage from './AssetImage';

interface CharacterCardProps {
  id: string;
  name: string;
  description: string;
  image: number | null;
  isSelected?: boolean;
  onPress: (id: string) => void;
  style?: any;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const CharacterCard: React.FC<CharacterCardProps> = ({
  id,
  name,
  description,
  image,
  isSelected = false,
  onPress,
  style,
}) => {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 100 });
  };

  const handlePress = () => {
    // Subtle rotation animation on selection
    rotation.value = withSpring(5, { damping: 15, stiffness: 100 });

    setTimeout(() => {
      rotation.value = withSpring(-5, { damping: 15, stiffness: 100 });

      setTimeout(() => {
        rotation.value = withSpring(0, { damping: 15, stiffness: 100 });
      }, 100);
    }, 100);

    onPress(id);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const containerStyle = isSelected
    ? [styles.container, styles.selectedContainer]
    : styles.container;

  return (
    <AnimatedTouchableOpacity
      style={[containerStyle, animatedStyle, style]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        <AssetImage
          source={image}
          style={styles.image}
          resizeMode="contain"
        />
        {isSelected && (
          <View style={styles.selectedBadge}>
            <Text style={styles.selectedBadgeText}>✓</Text>
          </View>
        )}
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </AnimatedTouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 15,
    margin: 10,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  selectedContainer: {
    borderColor: colors.pink,
    shadowColor: colors.pink,
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: colors.background.primary,
    borderRadius: 15,
    marginBottom: 10,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '90%',
    height: '90%',
  },
  selectedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: colors.pink,
    borderRadius: 20,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  selectedBadgeText: {
    color: colors.text.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  textContainer: {
    paddingHorizontal: 5,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 5,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default CharacterCard;