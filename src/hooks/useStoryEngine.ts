/**
 * useStoryEngine.ts
 * Hook pour gérer l'état de l'histoire et la sélection des assets visuels
 */

import { useState, useCallback, useEffect } from 'react';
import AssetManager from '../services/AssetManager';
import useGemmaGGUF from './useGemmaGGUF';
import { StoryScene, Character, StoryChoice, StoryProgress } from '../types';

const useStoryEngine = () => {
  const [currentScene, setCurrentScene] = useState<StoryScene | null>(null);
  const [storyProgress, setStoryProgress] = useState<StoryProgress>({
    currentScene: 0,
    totalScenes: 10,
    characterId: '',
    choices: [],
  });
  const [currentChoices, setCurrentChoices] = useState<StoryChoice[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [currentAssets, setCurrentAssets] = useState<{
    background: number | { color: string; tag: string; isPlaceholder: boolean };
    hero: number | { color: string; tag: string; isPlaceholder: boolean };
    item: number | { color: string; tag: string; isPlaceholder: boolean };
    effect: number | { color: string; tag: string; isPlaceholder: boolean };
  } | null>(null);

  // Utiliser le hook GGUF pour la génération IA
  const { generateStoryScene, generateChoices } = useGemmaGGUF();

  /**
   * Sélectionne un personnage
   */
  const selectCharacter = useCallback((characterId: string) => {
    const character = AssetManager.getCharacterInfo(characterId);
    setSelectedCharacter(character);

    setStoryProgress(prev => ({
      ...prev,
      characterId: characterId,
    }));
  }, []);

  /**
   * Initialise une nouvelle histoire
   */
  const startStory = useCallback(async (characterId: string) => {
    selectCharacter(characterId);

    const characterInfo = AssetManager.getCharacterInfo(characterId);
    const characterDesc = characterInfo
      ? `${characterInfo.name} (${characterInfo.description})`
      : characterId;

    try {
      const initialScene = await generateStoryScene(
        `Commence une histoire magique pour enfants. Le héros principal est ${characterDesc}. L'histoire doit parler de ce personnage spécifique.`,
        characterId
      );

      const formattedScene: StoryScene = {
        id: 'scene_0',
        text: initialScene.text,
        visuals: {
          bg: initialScene.visuals.bg,
          hero: initialScene.visuals.hero,
          item: initialScene.visuals.item,
          effect: initialScene.visuals.effect,
        },
      };

      setCurrentScene(formattedScene);
      updateSceneAssets(formattedScene.visuals);

      setStoryProgress(prev => ({
        ...prev,
        currentScene: 0,
        choices: [],
      }));

      const choices = await generateChoices(formattedScene.text, characterId);
      setCurrentChoices(choices);
    } catch (error) {
      console.error('Erreur lors du démarrage de l\'histoire:', error);
      const characterInfo = AssetManager.getCharacterInfo(characterId);
      const fallbackScene: StoryScene = {
        id: 'scene_0',
        text: `${characterInfo?.name ?? 'Le héros'} part à l'aventure dans un monde rempli de mystères...`,
        visuals: {
          bg: characterInfo?.theme ?? 'forest',
          hero: AssetManager.generateHeroTag(characterId, 'happy'),
          item: 'star',
          effect: 'magic',
        },
      };
      setCurrentScene(fallbackScene);
      updateSceneAssets(fallbackScene.visuals);
      setCurrentChoices([
        { id: '1', text: 'Explorer les environs', icon: 'compass', color: 'green', nextScene: 'exploration' },
        { id: '2', text: 'Demander conseil', icon: 'star', color: 'purple', nextScene: 'conseil' },
        { id: '3', text: 'Avancer courageusement', icon: 'star', color: 'pink', nextScene: 'aventure' },
      ]);
    }
  }, [selectCharacter, generateStoryScene, generateChoices, updateSceneAssets]);

  /**
   * Met à jour les assets visuels de la scène courante
   */
  const updateSceneAssets = useCallback((visuals: StoryScene['visuals']) => {
    // Utiliser getAssetOrPlaceholder pour gérer les assets manquants
    const assets = {
      background: AssetManager.getAssetOrPlaceholder('backgrounds', visuals.bg),
      hero: AssetManager.getAssetOrPlaceholder('heroes', visuals.hero),
      item: AssetManager.getAssetOrPlaceholder('items', visuals.item),
      effect: AssetManager.getAssetOrPlaceholder('effects', visuals.effect),
    };
    setCurrentAssets(assets);
  }, []);

  /**
   * Passe à la scène suivante avec de nouveaux visuels générés par l'IA
   */
  const nextScene = useCallback(async (previousScene: StoryScene, choiceText: string) => {
    try {
      if (!selectedCharacter) return;

      const characterInfo = AssetManager.getCharacterInfo(selectedCharacter.id);
      const characterDesc = characterInfo
        ? `${characterInfo.name} (${characterInfo.description})`
        : selectedCharacter.id;

      const newScene = await generateStoryScene(
        `${previousScene.text}\n\n${characterDesc} décide de: ${choiceText}. Continue l'histoire de manière magique et adaptée aux enfants. Le héros principal reste ${characterInfo?.name ?? selectedCharacter.id}.`,
        selectedCharacter.id
      );

      const formattedScene: StoryScene = {
        id: `scene_${storyProgress.currentScene + 1}`,
        text: newScene.text,
        visuals: {
          bg: newScene.visuals.bg,
          hero: newScene.visuals.hero,
          item: newScene.visuals.item,
          effect: newScene.visuals.effect,
        },
      };

      setCurrentScene(formattedScene);
      updateSceneAssets(formattedScene.visuals);

      setStoryProgress(prev => ({
        ...prev,
        currentScene: prev.currentScene + 1,
      }));

      // Générer des choix pour cette scène
      await generateChoicesForScene(formattedScene);
    } catch (error) {
      console.error('Erreur lors de la génération de scène:', error);
      if (selectedCharacter) {
        const characterInfo = AssetManager.getCharacterInfo(selectedCharacter.id);
        const fallbackScene: StoryScene = {
          id: `scene_${storyProgress.currentScene + 1}`,
          text: `L'aventure de ${characterInfo?.name ?? 'le héros'} continue avec de nouvelles découvertes...`,
          visuals: {
            bg: characterInfo?.theme ?? 'forest',
            hero: AssetManager.generateHeroTag(selectedCharacter.id, 'brave'),
            item: 'star',
            effect: 'magic',
          },
        };
        setCurrentScene(fallbackScene);
        updateSceneAssets(fallbackScene.visuals);
        await generateChoicesForScene(fallbackScene);
      }
    }
  }, [selectedCharacter, storyProgress.currentScene, generateStoryScene, generateChoicesForScene, updateSceneAssets]);

  /**
   * Met à jour le texte de la scène actuelle
   */
  const updateSceneText = useCallback((text: string) => {
    if (currentScene) {
      setCurrentScene(prev => ({
        ...prev!,
        text: text,
      }));
    }
  }, [currentScene]);

  /**
   * Met à jour les visuels de la scène actuelle
   */
  const updateSceneVisuals = useCallback((visuals: StoryScene['visuals']) => {
    if (currentScene) {
      setCurrentScene(prev => ({
        ...prev!,
        visuals: visuals,
      }));
      updateSceneAssets(visuals);
    }
  }, [currentScene, updateSceneAssets]);

  /**
   * Génère des choix pour la scène actuelle avec l'IA locale
   */
  const generateChoicesForScene = useCallback(async (scene: StoryScene) => {
    try {
      if (!selectedCharacter) return;

      // Générer des choix avec l'IA locale
      const choices = await generateChoices(scene.text, selectedCharacter.id);

      setCurrentChoices(choices);
    } catch (error) {
      console.error('Erreur lors de la génération de choix:', error);

      // Fallback sur des choix par défaut en cas d'erreur
      const defaultChoices: StoryChoice[] = [
        {
          id: '1',
          text: 'Explorer les environs',
          icon: 'compass',
          color: 'green',
          nextScene: 'exploration',
        },
        {
          id: '2',
          text: 'Demander conseil',
          icon: 'fairy',
          color: 'purple',
          nextScene: 'conseil',
        },
        {
          id: '3',
          text: 'Avancer courageusement',
          icon: 'star',
          color: 'pink',
          nextScene: 'aventure',
        },
      ];

      setCurrentChoices(defaultChoices);
    }
  }, [selectedCharacter, generateChoices]);

  /**
   * Traite un choix de l'utilisateur et génère la scène suivante avec l'IA
   */
  const makeChoice = useCallback(async (choiceId: string) => {
    const choice = currentChoices.find(c => c.id === choiceId);
    if (choice && currentScene) {
      setStoryProgress(prev => ({
        ...prev,
        choices: [...prev.choices, choiceId],
      }));

      // Générer la nouvelle scène avec l'IA locale basée sur le choix
      await nextScene(currentScene, choice.text);
    }
  }, [currentChoices, currentScene, nextScene]);

  /**
   * Réinitialise l'histoire
   */
  const resetStory = useCallback(() => {
    setCurrentScene(null);
    setStoryProgress({
      currentScene: 0,
      totalScenes: 10,
      characterId: '',
      choices: [],
    });
    setCurrentChoices([]);
    setSelectedCharacter(null);
    setCurrentAssets(null);
  }, []);

  /**
   * Met à jour le progrès total de l'histoire
   */
  const updateTotalScenes = useCallback((total: number) => {
    setStoryProgress(prev => ({
      ...prev,
      totalScenes: total,
    }));
  }, []);

  /**
   * Calcule le pourcentage de progression
   */
  const getProgressPercentage = useCallback(() => {
    if (storyProgress.totalScenes === 0) return 0;
    return Math.round((storyProgress.currentScene / storyProgress.totalScenes) * 100);
  }, [storyProgress]);

  /**
   * Vérifie si l'histoire est terminée
   */
  const isStoryComplete = useCallback(() => {
    return storyProgress.currentScene >= storyProgress.totalScenes;
  }, [storyProgress]);

  /**
   * Obtient les informations sur le personnage actuel
   */
  const getCurrentCharacter = useCallback(() => {
    return selectedCharacter;
  }, [selectedCharacter]);

  /**
   * Obtient la liste de tous les personnages disponibles
   */
  const getAllCharacters = useCallback(() => {
    return AssetManager.getAllCharacters();
  }, []);

  /**
   * Met à jour l'émotion du personnage dans la scène actuelle
   */
  const updateCharacterEmotion = useCallback((emotion: 'happy' | 'brave' | 'curious' | 'thinking') => {
    if (currentScene && selectedCharacter) {
      const newVisuals = {
        ...currentScene.visuals,
        hero: AssetManager.generateHeroTag(selectedCharacter.id, emotion),
      };
      updateSceneVisuals(newVisuals);
    }
  }, [currentScene, selectedCharacter, updateSceneVisuals]);

  return {
    // État actuel
    currentScene,
    storyProgress,
    currentChoices,
    selectedCharacter,
    currentAssets,

    // Actions
    selectCharacter,
    startStory,
    nextScene,
    updateSceneText,
    updateSceneVisuals,
    makeChoice,
    resetStory,
    updateTotalScenes,

    // Utilitaires
    getProgressPercentage,
    isStoryComplete,
    getCurrentCharacter,
    getAllCharacters,
    updateCharacterEmotion,
  };
};

export default useStoryEngine;