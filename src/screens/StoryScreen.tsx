/**
 * StoryScreen.tsx
 * Écran principal de l'histoire interactive
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { NavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import ProgressBar from '../components/ProgressBar';
import VisualScene from '../components/VisualScene';
import StoryText from '../components/StoryText';
import ChoiceButton from '../components/ChoiceButton';
import { gradients } from '../theme/colors';
import useStoryEngine from '../hooks/useStoryEngine';

type StoryScreenNavigationProp = NavigationProp<RootStackParamList>;
type StoryScreenRouteProp = RouteProp<RootStackParamList, 'Story'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const StoryScreen: React.FC = () => {
  const navigation = useNavigation<StoryScreenNavigationProp>();
  const route = useRoute<StoryScreenRouteProp>();
  const characterId = route.params?.characterId;
  const {
    currentScene,
    storyProgress,
    currentChoices,
    currentAssets,
    makeChoice,
    getProgressPercentage,
    resetStory,
    selectedCharacter,
    startStory,
  } = useStoryEngine();

  const [showChoices, setShowChoices] = useState(false);
  const [showQuitDialog, setShowQuitDialog] = useState(false);

  useEffect(() => {
    if (characterId) {
      startStory(characterId);
    } else {
      navigation.navigate('CharacterSelection');
    }
  }, [characterId]);

  // Masquer les choix dès qu'une nouvelle scène arrive
  useEffect(() => {
    setShowChoices(false);
  }, [currentScene?.id]);

  const handleStoryTextComplete = () => {
    setShowChoices(true);
  };

  const handleChoice = (choiceId: string) => {
    makeChoice(choiceId);
    setShowChoices(false);
  };

  const handleBack = () => {
    setShowQuitDialog(!showQuitDialog);
  };

  const handleQuitConfirm = () => {
    resetStory();
    // Navigation vers l'écran de sélection
    navigation.navigate('CharacterSelection');
  };

  const handleQuitCancel = () => {
    setShowQuitDialog(false);
  };

  // Afficher un état de chargement si aucune scène n'est chargée
  if (!currentScene || !currentAssets) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={gradients.primary}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.loadingText}>Chargement de l'histoire...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={gradients.primary}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <Header
        title={`Plume & Rêve - ${currentScene.id}`}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity onPress={handleBack}>
            <Ionicons name="close" size={24} color="#2C3E50" />
          </TouchableOpacity>
        }
      />

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <ProgressBar
          progress={getProgressPercentage()}
          showPercentage={false}
        />
      </View>

      {/* Story Content */}
      <ScrollView
        style={styles.contentContainer}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Visual Scene */}
        <VisualScene
          background={currentAssets.background}
          hero={currentAssets.hero}
          item={currentAssets.item}
          effect={currentAssets.effect}
        />

        {/* Story Text */}
        <View style={styles.textContainer}>
          <StoryText
            text={currentScene.text}
            onComplete={handleStoryTextComplete}
            typingSpeed={25}
          />
        </View>

        {/* Choices */}
        {showChoices && currentChoices.length > 0 && (
          <View style={styles.choicesContainer}>
            {currentChoices.map((choice) => (
              <ChoiceButton
                key={choice.id}
                id={choice.id}
                text={choice.text}
                icon={choice.icon}
                color={choice.color}
                onPress={handleChoice}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Quit Dialog */}
      {showQuitDialog && (
        <View style={styles.quitDialogContainer}>
          <View style={styles.quitDialog}>
            <Text style={styles.quitDialogTitle}>Quitter l'histoire?</Text>
            <Text style={styles.quitDialogText}>
              Ta progression sera perdue. Es-tu sûr de vouloir quitter?
            </Text>
            <View style={styles.quitDialogButtons}>
              <TouchableOpacity
                style={styles.quitDialogButton}
                onPress={handleQuitCancel}
              >
                <Text style={styles.quitDialogButtonText}>Non</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quitDialogButton, styles.quitDialogButtonConfirm]}
                onPress={handleQuitConfirm}
              >
                <Text style={[styles.quitDialogButtonText, styles.quitDialogButtonTextConfirm]}>
                  Oui, quitter
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E6F7FF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 20,
    color: '#2C3E50',
    fontWeight: 'bold',
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  contentContainer: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 15,
    paddingBottom: 30,
  },
  textContainer: {
    marginTop: 15,
  },
  choicesContainer: {
    marginTop: 20,
  },
  quitDialogContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  quitDialog: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 25,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  quitDialogTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 10,
    textAlign: 'center',
  },
  quitDialogText: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 24,
  },
  quitDialogButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  quitDialogButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FF9EC8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quitDialogButtonConfirm: {
    backgroundColor: '#FF9EC8',
  },
  quitDialogButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF9EC8',
  },
  quitDialogButtonTextConfirm: {
    color: '#FFFFFF',
  },
});

export default StoryScreen;