/**
 * MagicButton.tsx
 * Composant atomique pour les boutons d'action magiques
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../theme/colors';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

interface MagicButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'tertiary';
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  style?: any;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const MagicButton: React.FC<MagicButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  style,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const getGradient = () => {
    switch (variant) {
      case 'secondary':
        return gradients.buttonGreen;
      case 'tertiary':
        return gradients.buttonPurple;
      case 'primary':
      default:
        return gradients.buttonPink;
    }
  };

  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(0.95, { damping: 15, stiffness: 100 });
    }
  };

  const handlePressOut = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(1, { damping: 15, stiffness: 100 });
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePress = () => {
    if (!disabled && !loading) {
      // Pulse animation on press
      scale.value = withSpring(0.9, { damping: 15, stiffness: 100 });

      setTimeout(() => {
        scale.value = withSpring(1.05, { damping: 15, stiffness: 100 });

        setTimeout(() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 100 });
        }, 100);
      }, 100);

      onPress();
    }
  };

  return (
    <AnimatedTouchableOpacity
      style={[styles.container, disabled && styles.disabled, animatedStyle, style]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.8}
      disabled={disabled || loading}
    >
      <LinearGradient
        colors={getGradient()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={colors.text.white} size="small" />
        ) : (
          <>
            {icon && (
              <Text style={styles.icon}>{icon}</Text>
            )}
            <Text style={styles.text}>{title}</Text>
          </>
        )}
      </View>
    </AnimatedTouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 25,
    paddingVertical: 18,
    paddingHorizontal: 35,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    overflow: 'hidden',
    minWidth: 200,
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  icon: {
    fontSize: 24,
    color: colors.text.white,
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.white,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});

export default MagicButton;