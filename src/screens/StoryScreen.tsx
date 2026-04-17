/**
 * StoryScreen.tsx
 * Écran principal de l'histoire interactive
 */

import React, { useState, useEffect, useRef } from 'react';
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
import { DEFAULT_APP_SETTINGS, loadAppSettings } from '../services/AppSettingsConfig';
import { speakSceneText, stopNarration } from '../services/NarrationService';
import { AppSettings } from '../types';
import { colors, gradients } from '../theme/colors';
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
    isStoryComplete,
    resetStory,
    selectedCharacter,
    startStory,
  } = useStoryEngine();

  const [showChoices, setShowChoices] = useState(false);
  const [showQuitDialog, setShowQuitDialog] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState<AppSettings>({ ...DEFAULT_APP_SETTINGS });
  const startedCharacterRef = useRef<string | null>(null);

  useEffect(() => {
    loadAppSettings().then(setVoiceSettings).catch(() => {
      setVoiceSettings({ ...DEFAULT_APP_SETTINGS });
    });
  }, []);

  useEffect(() => {
    if (characterId) {
      if (startedCharacterRef.current === characterId) {
        return;
      }

      startedCharacterRef.current = characterId;
      startStory(characterId);
    } else {
      navigation.navigate('CharacterSelection');
    }
  }, [characterId, navigation, startStory]);

  // Masquer les choix dès qu'une nouvelle scène arrive
  useEffect(() => {
    setShowChoices(false);
  }, [currentScene?.id]);

  useEffect(() => {
    if (!currentScene || !voiceSettings.autoPlayNarration) {
      return;
    }

    speakSceneText(
      currentScene.text,
      voiceSettings.narratorEngine,
      voiceSettings.narratorVoiceGender,
      voiceSettings.narratorLanguage
    );

    return () => {
      stopNarration();
    };
  }, [
    currentScene?.id,
    currentScene?.text,
    voiceSettings.autoPlayNarration,
    voiceSettings.narratorEngine,
    voiceSettings.narratorVoiceGender,
    voiceSettings.narratorLanguage,
  ]);

  useEffect(() => {
    return () => {
      stopNarration();
    };
  }, []);

  const storyComplete = isStoryComplete();

  const handleStoryTextComplete = () => {
    setShowChoices(true);
  };

  const handleChoice = (choiceId: string) => {
    stopNarration();
    makeChoice(choiceId);
    setShowChoices(false);
  };

  const handleBack = () => {
    setShowQuitDialog(!showQuitDialog);
  };

  const handleQuitConfirm = () => {
    stopNarration();
    // Retour sans effacer l'histoire: la reprise est disponible depuis l'accueil.
    navigation.navigate('CharacterSelection');
  };

  const handleQuitCancel = () => {
    setShowQuitDialog(false);
  };

  const handleRestartStory = () => {
    if (!characterId) {
      return;
    }

    stopNarration();
    startedCharacterRef.current = characterId;
    setShowChoices(false);
    resetStory();
    startStory(characterId);
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
            <Ionicons name="close" size={24} color={colors.text.primary} />
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
        {showChoices && !storyComplete && currentChoices.length > 0 && (
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

        {showChoices && storyComplete && (
          <View style={styles.endingCard}>
            <Text style={styles.endingTitle}>Fin du conte</Text>
            <Text style={styles.endingText}>
              Cette aventure est terminée. Tu peux relancer une nouvelle histoire ou revenir choisir un autre héros.
            </Text>
            <TouchableOpacity style={styles.endingPrimaryButton} onPress={handleRestartStory}>
              <Text style={styles.endingPrimaryButtonText}>Rejouer avec ce héros</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.endingSecondaryButton} onPress={handleQuitConfirm}>
              <Text style={styles.endingSecondaryButtonText}>Retour aux personnages</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Quit Dialog */}
      {showQuitDialog && (
        <View style={styles.quitDialogContainer}>
          <View style={styles.quitDialog}>
            <Text style={styles.quitDialogTitle}>Quitter l'histoire?</Text>
            <Text style={styles.quitDialogText}>
              Tu peux quitter et reprendre cette histoire plus tard depuis l'accueil.
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
                  Quitter
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
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 20,
    color: colors.text.primary,
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
  endingCard: {
    marginTop: 20,
    padding: 20,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  endingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 10,
  },
  endingText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  endingPrimaryButton: {
    marginTop: 18,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.purple,
    alignItems: 'center',
  },
  endingPrimaryButtonText: {
    color: colors.text.white,
    fontSize: 15,
    fontWeight: '700',
  },
  endingSecondaryButton: {
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  endingSecondaryButtonText: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: '600',
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
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 25,
    width: '100%',
    maxWidth: 400,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  quitDialogTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 10,
    textAlign: 'center',
  },
  quitDialogText: {
    fontSize: 16,
    color: colors.text.secondary,
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
    borderColor: colors.pink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quitDialogButtonConfirm: {
    backgroundColor: colors.pink,
  },
  quitDialogButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.pink,
  },
  quitDialogButtonTextConfirm: {
    color: colors.text.white,
  },
});

export default StoryScreen;