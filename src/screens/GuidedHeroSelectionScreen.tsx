import React from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import Header from '../components/Header';
import CharacterCard from '../components/CharacterCard';
import MagicButton from '../components/MagicButton';
import ProgressBar from '../components/ProgressBar';
import useStoryEngine from '../hooks/useStoryEngine';
import { RootStackParamList } from '../navigation/AppNavigator';
import { colors, gradients } from '../theme/colors';

type GuidedHeroSelectionNavigationProp = NavigationProp<RootStackParamList>;

const GuidedHeroSelectionScreen: React.FC = () => {
  const navigation = useNavigation<GuidedHeroSelectionNavigationProp>();
  const { getAllCharacters, selectedCharacter, selectCharacter } = useStoryEngine();
  const [sceneCount, setSceneCount] = React.useState(5);

  const characters = getAllCharacters();

  const handleStartFlow = () => {
    if (!selectedCharacter) {
      return;
    }

    navigation.navigate('GuidedSceneBuilder', {
      characterId: selectedCharacter.id,
      totalScenes: sceneCount,
      sceneIndex: 1,
      guidedScenes: [],
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradients.primary} style={StyleSheet.absoluteFill} />

      <Header
        title="Mode guidé - Étape 1"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.progressContainer}>
        <ProgressBar progress={15} showPercentage={false} />
      </View>

      <View style={styles.titleContainer}>
        <Text style={styles.title}>Choisis ton héros</Text>
        <Text style={styles.subtitle}>Clique sur l image du héros, puis continue vers la scène 1.</Text>
      </View>

      <View style={styles.sceneCountCard}>
        <Text style={styles.sceneCountTitle}>Nombre de scènes</Text>
        <View style={styles.sceneCountRow}>
          <MagicButton
            title="-"
            onPress={() => setSceneCount((prev) => Math.max(3, prev - 1))}
            variant="tertiary"
            style={styles.counterButton}
          />
          <Text style={styles.sceneCountValue}>{sceneCount}</Text>
          <MagicButton
            title="+"
            onPress={() => setSceneCount((prev) => Math.min(8, prev + 1))}
            variant="tertiary"
            style={styles.counterButton}
          />
        </View>
      </View>

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
            onPress={selectCharacter}
          />
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <MagicButton
          title={selectedCharacter ? `Continuer avec ${selectedCharacter.name}` : 'Choisir un héros'}
          onPress={handleStartFlow}
          variant="primary"
          disabled={!selectedCharacter}
        />
      </View>
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
    marginBottom: 16,
  },
  titleContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
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
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  sceneCountCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 14,
    padding: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sceneCountTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  sceneCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  counterButton: {
    minWidth: 62,
    paddingVertical: 10,
    paddingHorizontal: 0,
  },
  sceneCountValue: {
    minWidth: 34,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  charactersContainer: {
    flex: 1,
  },
  charactersContent: {
    paddingHorizontal: 10,
    paddingBottom: 120,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});

export default GuidedHeroSelectionScreen;
