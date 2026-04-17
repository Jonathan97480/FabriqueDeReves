/**
 * CharacterSelectionScreen.tsx
 * Écran pour sélectionner un personnage
 */

import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { NavigationProp } from '@react-navigation/native';
import Header from '../components/Header';
import ProgressBar from '../components/ProgressBar';
import CharacterCard from '../components/CharacterCard';
import MagicButton from '../components/MagicButton';
import { colors, gradients } from '../theme/colors';
import useStoryEngine from '../hooks/useStoryEngine';

type CharacterSelectionScreenNavigationProp = NavigationProp<RootStackParamList>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CharacterSelectionScreen: React.FC = () => {
  const navigation = useNavigation<CharacterSelectionScreenNavigationProp>();
  const {
    clearSavedStoryProgress,
    isSavedStoriesReady,
    refreshSavedStories,
    resumeStorySummary,
    selectCharacter,
    selectedCharacter,
    storyHistory,
    getAllCharacters,
  } = useStoryEngine();

  const characters = getAllCharacters();

  useFocusEffect(
    React.useCallback(() => {
      void refreshSavedStories();
    }, [refreshSavedStories])
  );

  const handleCharacterSelect = (characterId: string) => {
    selectCharacter(characterId);
  };

  const handleStartAdventure = () => {
    if (selectedCharacter) {
      navigation.navigate('Story', { characterId: selectedCharacter.id });
    }
  };

  const handleResumeStory = () => {
    if (!resumeStorySummary) {
      return;
    }

    navigation.navigate('Story', { characterId: resumeStorySummary.characterId });
  };

  const handleReplayFromHistory = (characterId: string) => {
    navigation.navigate('Story', { characterId });
  };

  const settingsButton = (
    <TouchableOpacity
      onPress={() => navigation.navigate('Settings')}
      activeOpacity={0.7}
      style={styles.settingsButton}
    >
      <Ionicons name="settings-outline" size={24} color="#2C3E50" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={gradients.primary}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <Header
        title="La Fabrique à Rêves"
        showBackButton={false}
        rightComponent={settingsButton}
      />

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <ProgressBar progress={10} showPercentage={false} />
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Choisis ton Héros!</Text>
        <Text style={styles.subtitle}>Un personnage va t'accompagner dans cette aventure</Text>
      </View>

      {isSavedStoriesReady && resumeStorySummary && (
        <View style={styles.resumeContainer}>
          <Text style={styles.sectionTitle}>Histoire en cours</Text>
          <Text style={styles.resumeText}>
            {resumeStorySummary.characterName} - scene {resumeStorySummary.currentScene}/{resumeStorySummary.totalScenes}
          </Text>
          <View style={styles.resumeButtonsRow}>
            <MagicButton
              title="Reprendre l'histoire"
              onPress={handleResumeStory}
              variant="secondary"
              style={styles.resumeButton}
            />
            <MagicButton
              title="Effacer"
              onPress={() => {
                void clearSavedStoryProgress();
              }}
              variant="tertiary"
              style={styles.resumeButton}
            />
          </View>
        </View>
      )}

      {isSavedStoriesReady && storyHistory.length > 0 && (
        <View style={styles.historyContainer}>
          <Text style={styles.sectionTitle}>Historique des contes</Text>
          {storyHistory.slice(0, 3).map((historyItem) => (
            <TouchableOpacity
              key={historyItem.id}
              style={styles.historyItem}
              onPress={() => handleReplayFromHistory(historyItem.characterId)}
              activeOpacity={0.8}
            >
              <Text style={styles.historyTitle}>
                {historyItem.characterName} - {historyItem.totalScenes} scenes
              </Text>
              <Text style={styles.historyPreview}>{historyItem.endingPreview}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Characters List */}
      <ScrollView
        style={styles.charactersContainer}
        contentContainerStyle={styles.charactersContent}
        showsVerticalScrollIndicator={false}
      >
        {characters.map((character) => (
          <CharacterCard
            key={character.id}
            id={character.id}
            name={character.name}
            description={character.description}
            image={character.image}
            isSelected={selectedCharacter?.id === character.id}
            onPress={handleCharacterSelect}
            style={styles.characterCard}
          />
        ))}
      </ScrollView>

      {/* Start Button */}
      {selectedCharacter && (
        <View style={styles.buttonContainer}>
          <MagicButton
            title={`Je choisis ${selectedCharacter.name}!`}
            onPress={handleStartAdventure}
            variant="primary"
          />
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
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  titleContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
  },
  resumeContainer: {
    marginHorizontal: 20,
    marginBottom: 14,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resumeText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 12,
  },
  resumeButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  resumeButton: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  historyContainer: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  historyItem: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.background.primary,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  historyPreview: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  charactersContainer: {
    flex: 1,
  },
  charactersContent: {
    paddingHorizontal: 10,
    paddingBottom: 100,
  },
  characterCard: {
    width: SCREEN_WIDTH - 40,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  settingsButton: {
    padding: 4,
  },
});

export default CharacterSelectionScreen;