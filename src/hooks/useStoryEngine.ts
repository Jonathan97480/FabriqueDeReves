/**
 * useStoryEngine.ts
 * Hook pour gérer l'état de l'histoire et la sélection des assets visuels.
 */

import { useState, useCallback, useEffect } from 'react';
import AssetManager from '../services/AssetManager';
import useGemmaGGUF from './useGemmaGGUF';
import {
  DEFAULT_APP_SETTINGS,
  loadAppSettings,
  STORYTELLER_PERSONALITIES,
} from '../services/AppSettingsConfig';
import {
  appendCompletedStory,
  clearActiveStory,
  loadActiveStory,
  loadStoryHistory,
  saveActiveStory,
  toResumeSummary,
} from '../services/StoryProgressService';
import {
  AppSettings,
  Character,
  CompletedStorySummary,
  StoryChoice,
  StoryProgress,
  StoryResumeSummary,
  StoryScene,
} from '../types';

const useStoryEngine = () => {
  const [currentScene, setCurrentScene] = useState<StoryScene | null>(null);
  const [storyProgress, setStoryProgress] = useState<StoryProgress>({
    currentScene: 0,
    totalScenes: DEFAULT_APP_SETTINGS.maxScenes,
    characterId: '',
    choices: [],
  });
  const [currentChoices, setCurrentChoices] = useState<StoryChoice[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [appSettings, setAppSettings] = useState<AppSettings>({ ...DEFAULT_APP_SETTINGS });
  const [storyStartedAt, setStoryStartedAt] = useState<number | null>(null);
  const [resumeStorySummary, setResumeStorySummary] = useState<StoryResumeSummary | null>(null);
  const [storyHistory, setStoryHistory] = useState<CompletedStorySummary[]>([]);
  const [isSavedStoriesReady, setIsSavedStoriesReady] = useState(false);
  const [currentAssets, setCurrentAssets] = useState<{
    background: number | { color: string; tag: string; isPlaceholder: boolean };
    hero: number | { color: string; tag: string; isPlaceholder: boolean };
    item: number | { color: string; tag: string; isPlaceholder: boolean };
    effect: number | { color: string; tag: string; isPlaceholder: boolean };
  } | null>(null);

  const { generateStoryScene, generateChoices } = useGemmaGGUF();

  const refreshSavedStories = useCallback(async () => {
    const [activeStory, history] = await Promise.all([loadActiveStory(), loadStoryHistory()]);
    setResumeStorySummary(toResumeSummary(activeStory));
    setStoryHistory(history);
    setIsSavedStoriesReady(true);
  }, []);

  useEffect(() => {
    loadAppSettings().then(setAppSettings).catch(() => {
      setAppSettings({ ...DEFAULT_APP_SETTINGS });
    });

    refreshSavedStories().catch(() => {
      setResumeStorySummary(null);
      setStoryHistory([]);
      setIsSavedStoriesReady(true);
    });
  }, [refreshSavedStories]);

  const updateSceneAssets = useCallback((visuals: StoryScene['visuals']) => {
    const assets = {
      background: AssetManager.getAssetOrPlaceholder('backgrounds', visuals.bg),
      hero: AssetManager.getAssetOrPlaceholder('heroes', visuals.hero),
      item: AssetManager.getAssetOrPlaceholder('items', visuals.item),
      effect: AssetManager.getAssetOrPlaceholder('effects', visuals.effect),
    };

    setCurrentAssets(assets);
  }, []);

  const generateChoicesForScene = useCallback(
    async (
      scene: StoryScene,
      sceneNumber: number,
      totalScenes: number,
      characterIdOverride?: string
    ): Promise<StoryChoice[]> => {
      const activeCharacterId = characterIdOverride ?? selectedCharacter?.id;

      if (!activeCharacterId) {
        return [];
      }

      if (sceneNumber >= totalScenes) {
        setCurrentChoices([]);
        return [];
      }

      try {
        const choices = await generateChoices(scene.text, activeCharacterId);
        setCurrentChoices(choices);
        return choices;
      } catch (error) {
        console.error('Erreur lors de la génération de choix:', error);

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
            icon: 'star',
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
        return defaultChoices;
      }
    },
    [generateChoices, selectedCharacter]
  );

  const selectCharacter = useCallback((characterId: string) => {
    const character = AssetManager.getCharacterInfo(characterId);
    setSelectedCharacter(character);

    setStoryProgress((prev) => ({
      ...prev,
      characterId,
    }));
  }, []);

  const startStory = useCallback(
    async (characterId: string) => {
      selectCharacter(characterId);

      const loadedSettings = await loadAppSettings().catch(() => ({ ...DEFAULT_APP_SETTINGS }));
      const totalScenes = loadedSettings.maxScenes;
      const storytellerStyle =
        STORYTELLER_PERSONALITIES[loadedSettings.storytellerPersonality].promptStyle;
      setAppSettings(loadedSettings);

      const characterInfo = AssetManager.getCharacterInfo(characterId);
      const characterDesc = characterInfo
        ? `${characterInfo.name} (${characterInfo.description})`
        : characterId;

      const savedStory = await loadActiveStory();
      if (savedStory && savedStory.characterId === characterId && savedStory.storyProgress.currentScene > 0) {
        setCurrentScene(savedStory.currentScene);
        updateSceneAssets(savedStory.currentScene.visuals);
        setStoryProgress(savedStory.storyProgress);
        setCurrentChoices(savedStory.currentChoices);
        setStoryStartedAt(savedStory.startedAt);
        setResumeStorySummary(toResumeSummary(savedStory));
        return;
      }

      const startedAt = Date.now();
      setStoryStartedAt(startedAt);

      try {
        const initialScene = await generateStoryScene(
          `Commence une histoire magique pour enfants. ${storytellerStyle} Le héros principal est ${characterDesc}. L'histoire doit parler de ce personnage spécifique. Nous sommes à la scène 1 sur ${totalScenes}. Garde un ton rassurant et adapte le vocabulaire aux enfants.`,
          characterId
        );

        const formattedScene: StoryScene = {
          id: 'scene_1',
          text: initialScene.text,
          visuals: {
            bg: initialScene.visuals.bg,
            hero: initialScene.visuals.hero,
            item: initialScene.visuals.item,
            effect: initialScene.visuals.effect,
          },
        };

        const initialProgress: StoryProgress = {
          currentScene: 1,
          totalScenes,
          characterId,
          choices: [],
        };

        setCurrentScene(formattedScene);
        updateSceneAssets(formattedScene.visuals);
        setStoryProgress(initialProgress);

        const initialChoices = await generateChoicesForScene(formattedScene, 1, totalScenes, characterId);

        await saveActiveStory({
          characterId,
          storyProgress: initialProgress,
          currentScene: formattedScene,
          currentChoices: initialChoices,
          startedAt,
          updatedAt: Date.now(),
        });
        await refreshSavedStories();
      } catch (error) {
        console.error("Erreur lors du démarrage de l'histoire:", error);

        const fallbackScene: StoryScene = {
          id: 'scene_1',
          text: `${characterInfo?.name ?? 'Le héros'} commence une belle aventure remplie de mystères et de douceur.`,
          visuals: {
            bg: characterInfo?.theme ?? 'forest',
            hero: AssetManager.generateHeroTag(characterId, 'happy'),
            item: 'star',
            effect: 'magic',
          },
        };

        const initialProgress: StoryProgress = {
          currentScene: 1,
          totalScenes,
          characterId,
          choices: [],
        };

        setCurrentScene(fallbackScene);
        updateSceneAssets(fallbackScene.visuals);
        setStoryProgress(initialProgress);

        const initialChoices = await generateChoicesForScene(fallbackScene, 1, totalScenes, characterId);

        await saveActiveStory({
          characterId,
          storyProgress: initialProgress,
          currentScene: fallbackScene,
          currentChoices: initialChoices,
          startedAt,
          updatedAt: Date.now(),
        });
        await refreshSavedStories();
      }
    },
    [
      generateChoicesForScene,
      generateStoryScene,
      refreshSavedStories,
      selectCharacter,
      updateSceneAssets,
    ]
  );

  const nextScene = useCallback(
    async (previousScene: StoryScene, choiceText: string, updatedChoices: string[]) => {
      if (!selectedCharacter) {
        return;
      }

      const nextSceneNumber = storyProgress.currentScene + 1;
      const totalScenes = storyProgress.totalScenes;
      const isFinalScene = nextSceneNumber >= totalScenes;
      const characterInfo = AssetManager.getCharacterInfo(selectedCharacter.id);
      const characterDesc = characterInfo
        ? `${characterInfo.name} (${characterInfo.description})`
        : selectedCharacter.id;
      const storytellerStyle =
        STORYTELLER_PERSONALITIES[appSettings.storytellerPersonality].promptStyle;

      try {
        const newScene = await generateStoryScene(
          `${previousScene.text}\n\n${characterDesc} décide de : ${choiceText}. ${storytellerStyle} Nous sommes à la scène ${nextSceneNumber} sur ${totalScenes}. ${
            isFinalScene
              ? 'Ceci est la dernière scène. Termine le conte avec une fin douce, claire et satisfaisante, sans suspense.'
              : `Continue l'histoire de manière magique et adaptée aux enfants. Le héros principal reste ${characterInfo?.name ?? selectedCharacter.id}.`
          }`,
          selectedCharacter.id
        );

        const formattedScene: StoryScene = {
          id: `scene_${nextSceneNumber}`,
          text: newScene.text,
          visuals: {
            bg: newScene.visuals.bg,
            hero: newScene.visuals.hero,
            item: newScene.visuals.item,
            effect: newScene.visuals.effect,
          },
        };

        const nextProgress: StoryProgress = {
          ...storyProgress,
          choices: updatedChoices,
          currentScene: nextSceneNumber,
        };

        setCurrentScene(formattedScene);
        updateSceneAssets(formattedScene.visuals);
        setStoryProgress(nextProgress);

        const nextChoices = await generateChoicesForScene(formattedScene, nextSceneNumber, totalScenes);

        if (isFinalScene) {
          await appendCompletedStory(selectedCharacter.id, totalScenes, formattedScene.text);
          await clearActiveStory();
          await refreshSavedStories();
          return;
        }

        await saveActiveStory({
          characterId: selectedCharacter.id,
          storyProgress: nextProgress,
          currentScene: formattedScene,
          currentChoices: nextChoices,
          startedAt: storyStartedAt ?? Date.now(),
          updatedAt: Date.now(),
        });
        await refreshSavedStories();
      } catch (error) {
        console.error('Erreur lors de la génération de scène:', error);

        const fallbackScene: StoryScene = {
          id: `scene_${nextSceneNumber}`,
          text: isFinalScene
            ? `${characterInfo?.name ?? 'Le héros'} découvre enfin une fin lumineuse et rentre le coeur rempli de souvenirs merveilleux.`
            : `L'aventure de ${characterInfo?.name ?? 'le héros'} continue avec de nouvelles découvertes pleines de magie.`,
          visuals: {
            bg: characterInfo?.theme ?? 'forest',
            hero: AssetManager.generateHeroTag(selectedCharacter.id, isFinalScene ? 'happy' : 'brave'),
            item: 'star',
            effect: 'magic',
          },
        };

        const nextProgress: StoryProgress = {
          ...storyProgress,
          choices: updatedChoices,
          currentScene: nextSceneNumber,
        };

        setCurrentScene(fallbackScene);
        updateSceneAssets(fallbackScene.visuals);
        setStoryProgress(nextProgress);

        const nextChoices = await generateChoicesForScene(fallbackScene, nextSceneNumber, totalScenes);

        if (isFinalScene) {
          await appendCompletedStory(selectedCharacter.id, totalScenes, fallbackScene.text);
          await clearActiveStory();
          await refreshSavedStories();
          return;
        }

        await saveActiveStory({
          characterId: selectedCharacter.id,
          storyProgress: nextProgress,
          currentScene: fallbackScene,
          currentChoices: nextChoices,
          startedAt: storyStartedAt ?? Date.now(),
          updatedAt: Date.now(),
        });
        await refreshSavedStories();
      }
    },
    [
      appSettings.storytellerPersonality,
      generateChoicesForScene,
      generateStoryScene,
      refreshSavedStories,
      selectedCharacter,
      storyProgress,
      storyStartedAt,
      storyProgress.currentScene,
      storyProgress.totalScenes,
      updateSceneAssets,
    ]
  );

  const updateSceneText = useCallback(
    (text: string) => {
      if (currentScene) {
        setCurrentScene((prev) => ({
          ...prev!,
          text,
        }));
      }
    },
    [currentScene]
  );

  const updateSceneVisuals = useCallback(
    (visuals: StoryScene['visuals']) => {
      if (currentScene) {
        setCurrentScene((prev) => ({
          ...prev!,
          visuals,
        }));
        updateSceneAssets(visuals);
      }
    },
    [currentScene, updateSceneAssets]
  );

  const makeChoice = useCallback(
    async (choiceId: string) => {
      if (storyProgress.currentScene >= storyProgress.totalScenes) {
        return;
      }

      const choice = currentChoices.find((currentChoice) => currentChoice.id === choiceId);
      if (choice && currentScene) {
        const updatedChoices = [...storyProgress.choices, choiceId];

        setStoryProgress((prev) => ({
          ...prev,
          choices: updatedChoices,
        }));

        await nextScene(currentScene, choice.text, updatedChoices);
      }
    },
    [
      currentChoices,
      currentScene,
      nextScene,
      storyProgress.choices,
      storyProgress.currentScene,
      storyProgress.totalScenes,
    ]
  );

  const resetStory = useCallback(() => {
    setCurrentScene(null);
    setStoryProgress({
      currentScene: 0,
      totalScenes: appSettings.maxScenes,
      characterId: '',
      choices: [],
    });
    setCurrentChoices([]);
    setSelectedCharacter(null);
    setCurrentAssets(null);
    setStoryStartedAt(null);
    void clearActiveStory();
    void refreshSavedStories();
  }, [appSettings.maxScenes, refreshSavedStories]);

  const clearSavedStoryProgress = useCallback(async () => {
    await clearActiveStory();
    await refreshSavedStories();
  }, [refreshSavedStories]);

  const updateTotalScenes = useCallback((total: number) => {
    setStoryProgress((prev) => ({
      ...prev,
      totalScenes: total,
    }));
  }, []);

  const getProgressPercentage = useCallback(() => {
    if (storyProgress.totalScenes === 0) {
      return 0;
    }

    return Math.round((storyProgress.currentScene / storyProgress.totalScenes) * 100);
  }, [storyProgress.currentScene, storyProgress.totalScenes]);

  const isStoryComplete = useCallback(() => {
    return storyProgress.currentScene >= storyProgress.totalScenes;
  }, [storyProgress.currentScene, storyProgress.totalScenes]);

  const getCurrentCharacter = useCallback(() => {
    return selectedCharacter;
  }, [selectedCharacter]);

  const getAllCharacters = useCallback(() => {
    return AssetManager.getAllCharacters();
  }, []);

  const updateCharacterEmotion = useCallback(
    (emotion: 'happy' | 'brave' | 'curious' | 'thinking') => {
      if (currentScene && selectedCharacter) {
        const newVisuals = {
          ...currentScene.visuals,
          hero: AssetManager.generateHeroTag(selectedCharacter.id, emotion),
        };
        updateSceneVisuals(newVisuals);
      }
    },
    [currentScene, selectedCharacter, updateSceneVisuals]
  );

  return {
    currentScene,
    storyProgress,
    currentChoices,
    selectedCharacter,
    currentAssets,
    selectCharacter,
    startStory,
    nextScene,
    updateSceneText,
    updateSceneVisuals,
    makeChoice,
    resetStory,
    updateTotalScenes,
    getProgressPercentage,
    isStoryComplete,
    getCurrentCharacter,
    getAllCharacters,
    updateCharacterEmotion,
    resumeStorySummary,
    storyHistory,
    isSavedStoriesReady,
    refreshSavedStories,
    clearSavedStoryProgress,
  };
};

export default useStoryEngine;
