/**
 * CharacterSelectionScreen.tsx
 * Écran pour sélectionner un personnage
 */

import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { NavigationProp } from '@react-navigation/native';
import Header from '../components/Header';
import ProgressBar from '../components/ProgressBar';
import CharacterCard from '../components/CharacterCard';
import MagicButton from '../components/MagicButton';
import { gradients } from '../theme/colors';
import useStoryEngine from '../hooks/useStoryEngine';

type CharacterSelectionScreenNavigationProp = NavigationProp<RootStackParamList>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CharacterSelectionScreen: React.FC = () => {
  const navigation = useNavigation<CharacterSelectionScreenNavigationProp>();
  const { selectCharacter, selectedCharacter, getAllCharacters } = useStoryEngine();

  const characters = getAllCharacters();

  const handleCharacterSelect = (characterId: string) => {
    selectCharacter(characterId);
  };

  const handleStartAdventure = () => {
    if (selectedCharacter) {
      navigation.navigate('Story', { characterId: selectedCharacter.id });
    }
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
    backgroundColor: '#E6F7FF',
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
    color: '#2C3E50',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
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