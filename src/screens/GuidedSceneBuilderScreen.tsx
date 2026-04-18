import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import ProgressBar from '../components/ProgressBar';
import VisualScene from '../components/VisualScene';
import AssetImage from '../components/AssetImage';
import MagicButton from '../components/MagicButton';
import AssetManager from '../services/AssetManager';
import { RootStackParamList } from '../navigation/AppNavigator';
import { GuidedSceneTemplate } from '../types';
import { colors, gradients } from '../theme/colors';

type GuidedSceneBuilderNavigationProp = NavigationProp<RootStackParamList>;
type GuidedSceneBuilderRouteProp = RouteProp<RootStackParamList, 'GuidedSceneBuilder'>;

type AssetOption = {
  tag: string;
  label: string;
  source: number | null;
};

type StepKey = 'bg' | 'hero' | 'item' | 'effect';

const BG_CANDIDATES: Array<{ tag: string; label: string }> = [
  { tag: 'forest', label: 'Forêt' },
  { tag: 'castle', label: 'Château' },
  { tag: 'space', label: 'Espace' },
  { tag: 'ocean', label: 'Océan' },
  { tag: 'cave', label: 'Grotte' },
  { tag: 'spaceship_cockpit', label: 'Cockpit vaisseau' },
  { tag: 'spaceship_corridor', label: 'Couloir vaisseau' },
];

const HERO_BY_CHARACTER: Record<string, Array<{ tag: string; label: string }>> = {
  leo: [
    { tag: 'leo_happy', label: 'Léo joyeux' },
    { tag: 'leo_brave', label: 'Léo courageux' },
    { tag: 'leo_curious', label: 'Léo curieux' },
    { tag: 'leo_thinking', label: 'Léo pensif' },
    { tag: 'leo_scared', label: 'Léo surpris' },
    { tag: 'leo_pointing', label: 'Léo montre' },
  ],
  maya: [
    { tag: 'maya_happy', label: 'Maya joyeuse' },
    { tag: 'maya_brave', label: 'Maya courageuse' },
    { tag: 'maya_curious', label: 'Maya curieuse' },
    { tag: 'maya_thinking', label: 'Maya pensive' },
  ],
  spark: [
    { tag: 'spark_happy', label: 'Étincelle joyeux' },
    { tag: 'spark_brave', label: 'Étincelle courageux' },
    { tag: 'spark_curious', label: 'Étincelle curieux' },
    { tag: 'spark_thinking', label: 'Étincelle pensif' },
  ],
};

const ITEM_CANDIDATES: Array<{ tag: string; label: string }> = [
  { tag: 'none', label: 'Sans objet' },
  { tag: 'wand', label: 'Baguette' },
  { tag: 'compass', label: 'Boussole' },
  { tag: 'key', label: 'Clé' },
  { tag: 'potion', label: 'Potion' },
  { tag: 'spaceship', label: 'Vaisseau' },
  { tag: 'rocket', label: 'Fusée' },
];

const EFFECT_CANDIDATES: Array<{ tag: string; label: string }> = [
  { tag: 'stars', label: 'Étoiles' },
  { tag: 'magic', label: 'Magie' },
  { tag: 'clouds', label: 'Brume' },
  { tag: 'rain', label: 'Pluie' },
  { tag: 'fireflies', label: 'Lucioles' },
];

const STEP_DEFINITIONS: Array<{ key: StepKey; title: string; hint: string }> = [
  { key: 'bg', title: 'Décor', hint: 'Choisis le fond principal de la scène.' },
  { key: 'hero', title: 'Héros', hint: 'Choisis la pose du héros visible dans la scène.' },
  { key: 'item', title: 'Objet', hint: 'Choisis l objet ou "Sans objet".' },
  { key: 'effect', title: 'Effet', hint: 'Choisis l ambiance visuelle (étoiles, magie...).' },
];

const buildAssetOptions = (
  candidates: Array<{ tag: string; label: string }>,
  resolver: (tag: string) => number | null,
  includeNone = false,
): AssetOption[] => {
  return candidates
    .map((candidate) => ({
      tag: candidate.tag,
      label: candidate.label,
      source: candidate.tag === 'none' && includeNone ? null : resolver(candidate.tag),
    }))
    .filter((option) => option.tag === 'none' || option.source !== null);
};

const createDefaultTemplate = (characterId: string, sceneIndex: number): GuidedSceneTemplate => ({
  id: `guided_scene_${sceneIndex}`,
  bg: sceneIndex % 2 === 0 ? 'spaceship_corridor' : 'spaceship_cockpit',
  hero: HERO_BY_CHARACTER[characterId]?.[0]?.tag ?? `${characterId}_happy`,
  item: sceneIndex % 2 === 0 ? 'none' : 'compass',
  effect: 'stars',
  note: '',
});

const GuidedSceneBuilderScreen: React.FC = () => {
  const navigation = useNavigation<GuidedSceneBuilderNavigationProp>();
  const route = useRoute<GuidedSceneBuilderRouteProp>();
  const { characterId, totalScenes, sceneIndex, guidedScenes } = route.params;

  const currentTemplate = useMemo(() => {
    const fromState = guidedScenes[sceneIndex - 1];
    return fromState ?? createDefaultTemplate(characterId, sceneIndex);
  }, [characterId, guidedScenes, sceneIndex]);

  const [bgTag, setBgTag] = useState(currentTemplate.bg);
  const [heroTag, setHeroTag] = useState(currentTemplate.hero);
  const [itemTag, setItemTag] = useState(currentTemplate.item);
  const [effectTag, setEffectTag] = useState(currentTemplate.effect);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const progress = Math.max(15, Math.round((sceneIndex / Math.max(totalScenes, 1)) * 100));

  const bgOptions = useMemo(
    () => buildAssetOptions(BG_CANDIDATES, (tag) => AssetManager.getBackground(tag)),
    [],
  );

  const heroOptions = useMemo(
    () => buildAssetOptions(HERO_BY_CHARACTER[characterId] ?? HERO_BY_CHARACTER.leo, (tag) => AssetManager.getHero(tag), true),
    [characterId],
  );

  const itemOptions = useMemo(
    () => buildAssetOptions(ITEM_CANDIDATES, (tag) => AssetManager.getItem(tag), true),
    [],
  );

  const effectOptions = useMemo(
    () => buildAssetOptions(EFFECT_CANDIDATES, (tag) => AssetManager.getEffect(tag)),
    [],
  );

  const selectedBackground = AssetManager.getBackground(bgTag);
  const selectedHero = heroTag === 'none' ? null : AssetManager.getHero(heroTag);
  const selectedItem = itemTag === 'none' ? null : AssetManager.getItem(itemTag);
  const selectedEffect = AssetManager.getEffect(effectTag);

  const activeStep = STEP_DEFINITIONS[currentStepIndex];
  const isLastStep = currentStepIndex === STEP_DEFINITIONS.length - 1;

  const currentOptions: AssetOption[] = useMemo(() => {
    if (activeStep.key === 'bg') {
      return bgOptions;
    }

    if (activeStep.key === 'hero') {
      return heroOptions;
    }

    if (activeStep.key === 'item') {
      return itemOptions;
    }

    return effectOptions;
  }, [activeStep.key, bgOptions, effectOptions, heroOptions, itemOptions]);

  const currentSelectedTag =
    activeStep.key === 'bg'
      ? bgTag
      : activeStep.key === 'hero'
        ? heroTag
        : activeStep.key === 'item'
          ? itemTag
          : effectTag;

  const handleSelectCurrentOption = (tag: string) => {
    if (activeStep.key === 'bg') {
      setBgTag(tag);
      return;
    }

    if (activeStep.key === 'hero') {
      setHeroTag(tag);
      return;
    }

    if (activeStep.key === 'item') {
      setItemTag(tag);
      return;
    }

    setEffectTag(tag);
  };

  const persistCurrentScene = (): GuidedSceneTemplate[] => {
    const nextGuidedScenes = [...guidedScenes];
    nextGuidedScenes[sceneIndex - 1] = {
      id: `guided_scene_${sceneIndex}`,
      bg: bgTag,
      hero: heroTag,
      item: itemTag,
      effect: effectTag,
    };
    return nextGuidedScenes;
  };

  const handleNext = () => {
    const nextGuidedScenes = persistCurrentScene();

    if (sceneIndex >= totalScenes) {
      navigation.navigate('Story', {
        characterId,
        mode: 'guided',
        guidedScenes: nextGuidedScenes,
      });
      return;
    }

    navigation.push('GuidedSceneBuilder', {
      characterId,
      totalScenes,
      sceneIndex: sceneIndex + 1,
      guidedScenes: nextGuidedScenes,
    });
  };

  const handlePrevious = () => {
    if (sceneIndex === 1) {
      navigation.goBack();
      return;
    }

    const nextGuidedScenes = persistCurrentScene();
    navigation.navigate('GuidedSceneBuilder', {
      characterId,
      totalScenes,
      sceneIndex: sceneIndex - 1,
      guidedScenes: nextGuidedScenes,
    });
  };

  const handleNextStep = () => {
    if (isLastStep) {
      handleNext();
      return;
    }

    setCurrentStepIndex((prev) => Math.min(STEP_DEFINITIONS.length - 1, prev + 1));
  };

  const handlePreviousStep = () => {
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradients.primary} style={StyleSheet.absoluteFill} />

      <Header
        title={`Mode guidé - Scène ${sceneIndex}/${totalScenes}`}
        showBackButton={true}
        onBackPress={handlePrevious}
      />

      <View style={styles.progressContainer}>
        <ProgressBar progress={progress} showPercentage={false} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.previewTitle}>Aperçu complet</Text>
        <VisualScene
          background={selectedBackground}
          hero={selectedHero}
          item={selectedItem}
          effect={selectedEffect}
        />

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Sélection actuelle</Text>
          <Text style={styles.summaryText}>Décor: {bgTag}</Text>
          <Text style={styles.summaryText}>Héros: {heroTag}</Text>
          <Text style={styles.summaryText}>Objet: {itemTag}</Text>
          <Text style={styles.summaryText}>Effet: {effectTag}</Text>
        </View>

        <View style={styles.stepHeaderCard}>
          <Text style={styles.stepHeaderTitle}>Étape {currentStepIndex + 1}/4 - {activeStep.title}</Text>
          <Text style={styles.stepHeaderHint}>{activeStep.hint}</Text>

          <View style={styles.stepPillsRow}>
            {STEP_DEFINITIONS.map((step, index) => {
              const isActive = index === currentStepIndex;
              const isDone = index < currentStepIndex;
              return (
                <TouchableOpacity
                  key={step.key}
                  style={[styles.stepPill, isActive && styles.stepPillActive]}
                  onPress={() => setCurrentStepIndex(index)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={isDone ? 'checkmark-circle' : isActive ? 'ellipse' : 'ellipse-outline'}
                    size={14}
                    color={isActive || isDone ? colors.text.primary : colors.text.secondary}
                  />
                  <Text style={[styles.stepPillText, isActive && styles.stepPillTextActive]}>{step.title}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <OptionSection
          title={activeStep.title}
          options={currentOptions}
          selectedTag={currentSelectedTag}
          onSelect={handleSelectCurrentOption}
        />

        <View style={styles.stepActionsRow}>
          <MagicButton
            title="Étape précédente"
            onPress={handlePreviousStep}
            variant="tertiary"
            disabled={currentStepIndex === 0}
            style={styles.stepActionButton}
          />
          <MagicButton
            title={isLastStep ? 'Terminer la scène' : 'Étape suivante'}
            onPress={handleNextStep}
            variant="secondary"
            style={styles.stepActionButton}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <MagicButton
          title={sceneIndex >= totalScenes ? 'Générer l histoire' : `Continuer vers scène ${sceneIndex + 1}`}
          onPress={handleNext}
          variant="primary"
        />
      </View>
    </View>
  );
};

interface OptionSectionProps {
  title: string;
  options: AssetOption[];
  selectedTag: string;
  onSelect: (tag: string) => void;
}

const OptionSection: React.FC<OptionSectionProps> = ({
  title,
  options,
  selectedTag,
  onSelect,
}) => {
  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.optionsRow}>
        {options.map((option) => {
          const isSelected = option.tag === selectedTag;
          return (
            <TouchableOpacity
              key={`${title}_${option.tag}`}
              style={[styles.optionCard, isSelected && styles.optionCardSelected]}
              onPress={() => onSelect(option.tag)}
              activeOpacity={0.85}
            >
              {option.source !== null ? (
                <AssetImage source={option.source} style={styles.optionImage} resizeMode="cover" />
              ) : (
                <View style={styles.noneOptionContainer}>
                  <Ionicons name="ban-outline" size={24} color={colors.text.secondary} />
                </View>
              )}
              <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]} numberOfLines={2}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
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
    marginBottom: 8,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
    gap: 10,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  sectionContainer: {
    marginTop: 8,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 10,
  },
  optionsRow: {
    gap: 10,
    paddingRight: 4,
  },
  summaryCard: {
    marginTop: 8,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  stepHeaderCard: {
    marginTop: 8,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 8,
  },
  stepHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  stepHeaderHint: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  stepPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stepPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  stepPillActive: {
    borderColor: colors.pink,
  },
  stepPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  stepPillTextActive: {
    color: colors.text.primary,
  },
  optionCard: {
    width: 132,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background.primary,
    padding: 6,
  },
  optionCardSelected: {
    borderColor: colors.pink,
    borderWidth: 2,
  },
  optionImage: {
    width: '100%',
    height: 88,
    borderRadius: 8,
    backgroundColor: colors.card,
  },
  noneOptionContainer: {
    width: '100%',
    height: 88,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionLabel: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
    textAlign: 'center',
    minHeight: 30,
  },
  optionLabelSelected: {
    color: colors.text.primary,
  },
  stepActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  stepActionButton: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});

export default GuidedSceneBuilderScreen;
