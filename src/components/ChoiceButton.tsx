/**
 * ChoiceButton.tsx
 * Composant atomique pour les boutons de choix interactifs
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../theme/colors';
import AssetImage from './AssetImage';

interface ChoiceButtonProps {
  id: string;
  text: string;
  icon: string | number | { color: string; tag: string; isPlaceholder: boolean };
  color: 'pink' | 'orange' | 'green' | 'purple';
  onPress: (id: string) => void;
  disabled?: boolean;
  style?: any;
}

const ChoiceButton: React.FC<ChoiceButtonProps> = ({
  id,
  text,
  icon,
  color,
  onPress,
  disabled = false,
  style,
}) => {
  const getGradient = () => {
    switch (color) {
      case 'pink':
        return gradients.buttonPink;
      case 'green':
        return gradients.buttonGreen;
      case 'orange':
        return gradients.buttonOrange;
      case 'purple':
        return gradients.buttonPurple;
      default:
        return gradients.buttonPink;
    }
  };

  const getIconEmoji = () => {
    const iconMap: { [key: string]: string } = {
      'compass': '🧭',
      'cave': '🕳️',
      'fairy': '🧚',
      'star': '⭐',
      'map': '🗺️',
      'key': '🔑',
    };
    return iconMap[icon as string] || '✨';
  };

  const isAsset = typeof icon === 'object' && !Array.isArray(icon);

  return (
    <TouchableOpacity
      style={[styles.container, disabled && styles.disabled, style]}
      onPress={() => onPress(id)}
      activeOpacity={0.8}
      disabled={disabled}
    >
      <LinearGradient
        colors={getGradient()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        {isAsset ? (
          <AssetImage
            source={icon as any}
            style={styles.iconImage}
            resizeMode="contain"
          />
        ) : typeof icon === 'string' ? (
          <Text style={styles.iconEmoji}>{getIconEmoji()}</Text>
        ) : null}

        <View style={styles.textContainer}>
          <Text style={styles.text}>{text}</Text>
        </View>

        <View style={styles.arrowContainer}>
          <Text style={styles.arrow}>→</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 15,
    padding: 15,
    marginVertical: 8,
    marginHorizontal: 15,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
    minHeight: 70,
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  iconEmoji: {
    fontSize: 32,
    marginRight: 15,
  },
  iconImage: {
    width: 40,
    height: 40,
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.white,
    textAlign: 'center',
  },
  arrowContainer: {
    marginLeft: 10,
  },
  arrow: {
    fontSize: 24,
    color: colors.text.white,
    fontWeight: 'bold',
  },
});

export default ChoiceButton;