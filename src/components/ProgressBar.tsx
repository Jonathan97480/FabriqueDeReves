/**
 * ProgressBar.tsx
 * Composant atomique pour la barre de progression
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../theme/colors';

interface ProgressBarProps {
  progress: number; // 0 to 100
  height?: number;
  showPercentage?: boolean;
  style?: any;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
  showPercentage = false,
  style,
}) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.track, { height }]}>
        <View
          style={[
            styles.fill,
            {
              height,
              width: `${clampedProgress}%`,
            },
          ]}
        >
          <LinearGradient
            colors={gradients.progress}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </View>
      </View>
      {showPercentage && (
        <Text style={styles.percentage}>{Math.round(clampedProgress)}%</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  track: {
    backgroundColor: colors.progress.track,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 4,
    overflow: 'hidden',
  },
  percentage: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 4,
    textAlign: 'right',
  },
});

export default ProgressBar;