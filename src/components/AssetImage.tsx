/**
 * AssetImage.tsx
 * Composant intelligent qui affiche soit un vrai asset soit un placeholder
 */

import React from 'react';
import { View, Text, StyleSheet, Image, ImageStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

interface AssetImageProps {
  source: number | { color: string; tag: string; isPlaceholder: boolean };
  style?: ImageStyle;
  fallbackEmoji?: string;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
}

const AssetImage: React.FC<AssetImageProps> = ({
  source,
  style,
  fallbackEmoji = '🎨',
  resizeMode = 'contain',
}) => {
  // Vérifier si c'est un placeholder
  const isPlaceholder = typeof source === 'object' && source.isPlaceholder;

  if (isPlaceholder) {
    const placeholder = source as { color: string; tag: string; isPlaceholder: boolean };

    return (
      <View style={[styles.placeholder, style]}>
        <LinearGradient
          colors={[placeholder.color, adjustColor(placeholder.color, 20)]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.placeholderContent}>
          <Text style={styles.emoji}>{fallbackEmoji}</Text>
          <Text style={styles.tagText}>{placeholder.tag}</Text>
        </View>
      </View>
    );
  }

  // C'est un vrai asset
  return (
    <Image
      source={source as number}
      style={style}
      resizeMode={resizeMode}
    />
  );
};

// Fonction utilitaire pour éclaircir/assombrir une couleur
function adjustColor(color: string, amount: number): string {
  const clamp = (value: number) => Math.min(255, Math.max(0, value));

  let hex = color.replace('#', '');

  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }

  const num = parseInt(hex, 16);
  const r = clamp((num >> 16) + amount);
  const g = clamp(((num >> 8) & 0x00FF) + amount);
  const b = clamp((num & 0x0000FF) + amount);

  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
}

const styles = StyleSheet.create({
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    overflow: 'hidden',
  },
  placeholderContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  emoji: {
    fontSize: 32,
    marginBottom: 5,
  },
  tagText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default AssetImage;