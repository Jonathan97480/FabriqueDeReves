import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import Header from '../components/Header';
import MagicButton from '../components/MagicButton';
import { RootStackParamList } from '../navigation/AppNavigator';
import { colors, gradients } from '../theme/colors';

type ModeSelectionNavigationProp = NavigationProp<RootStackParamList>;

const ModeSelectionScreen: React.FC = () => {
  const navigation = useNavigation<ModeSelectionNavigationProp>();

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradients.primary} style={StyleSheet.absoluteFill} />

      <Header title="La Fabrique à Rêves" showBackButton={false} />

      <View style={styles.content}>
        <Text style={styles.title}>Choisis ton mode</Text>
        <Text style={styles.subtitle}>
          Tu peux partir dans une aventure libre, ou construire les scènes visuelles puis laisser l IA raconter.
        </Text>

        <View style={styles.cardsContainer}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Mode aventure IA</Text>
            <Text style={styles.cardDescription}>
              Tu choisis un héros, puis l IA crée l histoire et les choix à chaque scène.
            </Text>
            <MagicButton
              title="Choisir un héros"
              onPress={() => navigation.navigate('CharacterSelection', { mode: 'classic' })}
              variant="primary"
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Mode scènes guidées</Text>
            <Text style={styles.cardDescription}>
              Tu choisis les images de chaque scène, puis l IA écrit l histoire en suivant tes visuels.
            </Text>
            <MagicButton
              title="Commencer le parcours guidé"
              onPress={() => navigation.navigate('GuidedHeroSelection')}
              variant="secondary"
            />
          </View>
        </View>

        <MagicButton
          title="Réglages"
          onPress={() => navigation.navigate('Settings')}
          variant="tertiary"
          style={styles.settingsButton}
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  cardsContainer: {
    gap: 16,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 14,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  cardDescription: {
    fontSize: 15,
    color: colors.text.secondary,
    lineHeight: 21,
  },
  settingsButton: {
    marginTop: 24,
    alignSelf: 'center',
  },
});

export default ModeSelectionScreen;
