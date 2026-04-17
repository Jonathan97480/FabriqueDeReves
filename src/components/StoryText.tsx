/**
 * StoryText.tsx
 * Composant atomique pour afficher le texte de l'histoire
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors } from '../theme/colors';

interface StoryTextProps {
  text: string;
  onComplete?: () => void;
  typingSpeed?: number;
  style?: any;
}

const StoryText: React.FC<StoryTextProps> = ({
  text,
  onComplete,
  typingSpeed = 30,
  style,
}) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Fade animation
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  // Reset complet quand le texte change (nouvelle scène)
  useEffect(() => {
    setDisplayText('');
    setCurrentIndex(0);
    setIsComplete(false);
    fadeAnim.setValue(0);
  }, [text]);

  useEffect(() => {
    // Start fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Typing effect
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, typingSpeed);

      return () => clearTimeout(timer);
    } else if (!isComplete) {
      setIsComplete(true);
      if (onComplete) {
        onComplete();
      }
    }
  }, [currentIndex, text, typingSpeed, isComplete, onComplete, fadeAnim]);

  // Skip typing effect on long press
  const handleLongPress = () => {
    setDisplayText(text);
    setCurrentIndex(text.length);
    setIsComplete(true);
  };

  return (
    <Animated.View
      style={[styles.container, { opacity: fadeAnim }, style]}
      onLongPress={handleLongPress}
    >
      <Text style={styles.text}>
        {displayText}
        {!isComplete && <Text style={styles.cursor}>|</Text>}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 20,
    borderRadius: 15,
    margin: 15,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    minHeight: 100,
    justifyContent: 'center',
  },
  text: {
    fontSize: 18,
    lineHeight: 28,
    color: colors.text.primary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  cursor: {
    color: colors.pink,
    animation: 'blink 1s infinite',
  },
});

export default StoryText;