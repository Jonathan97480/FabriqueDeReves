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

type CharacterArc = {
  title: string;
  objective: string;
  tension: string;
  endingStyle: string;
  motifs: string[];
  valueTheme: string;
};

const CHARACTER_ARCS: Record<string, CharacterArc> = {
  leo: {
    title: 'Explorateur des etoiles',
    objective: 'comprendre un mystere cosmique et guider son equipage',
    tension: 'choisir entre curiosite, prudence et courage dans linconnu',
    endingStyle: 'une conclusion lumineuse sur la confiance et la decouverte',
    motifs: ['constellation', 'hublot', 'signal stellaire', 'carte du ciel'],
    valueTheme: 'confiance et esprit dexploration',
  },
  maya: {
    title: 'Gardienne des jardins magiques',
    objective: 'proteger le vivant et restaurer lharmonie dun lieu enchante',
    tension: 'equilibrer empathie, dialogue et action pour aider les autres',
    endingStyle: 'une conclusion tendre sur le soin et lamitie',
    motifs: ['fleurs lumieres', 'source claire', 'chemin de mousse', 'graines dorees'],
    valueTheme: 'empathie et harmonie',
  },
  spark: {
    title: 'Petit dragon coeur vaillant',
    objective: 'canaliser sa flamme pour aider sans faire peur',
    tension: 'transformer limpulsite en gestes utiles et bienveillants',
    endingStyle: 'une conclusion joyeuse sur la maitrise de soi et lentraide',
    motifs: ['etincelles douces', 'souffle chaud', 'aile brillante', 'roche volcanique'],
    valueTheme: 'maitrise de soi et entraide',
  },
};

const DECISION_KEYWORDS: Array<{ tag: string; keywords: string[] }> = [
  { tag: 'exploration', keywords: ['explorer', 'sentier', 'suivre', 'chercher', 'observer'] },
  { tag: 'dialogue', keywords: ['parler', 'demander', 'ecouter', 'conseil', 'discuter'] },
  { tag: 'courage', keywords: ['courage', 'oser', 'avancer', 'entrer', 'affronter'] },
  { tag: 'prudence', keywords: ['doucement', 'prudemment', 'ralentir', 'attendre'] },
  { tag: 'entraide', keywords: ['aider', 'proteger', 'soutenir', 'partager'] },
  { tag: 'creativite', keywords: ['imaginer', 'idee', 'inventer', 'astuce', 'magique'] },
];

const MAX_RECENT_CHOICES = 3;
const MAX_DECISION_TAGS = 6;

const pickCharacterArc = (characterId: string): CharacterArc => {
  return CHARACTER_ARCS[characterId] ?? {
    title: 'Aventure feerique',
    objective: 'grandir a travers des choix utiles et bienveillants',
    tension: 'trouver le bon equilibre entre curiosite et prudence',
    endingStyle: 'une conclusion douce avec un apprentissage clair',
    motifs: ['lueur magique', 'sentier secret', 'objet mystere'],
    valueTheme: 'courage bienveillant',
  };
};

const getArcPhase = (sceneNumber: number, totalScenes: number): string => {
  const ratio = sceneNumber / Math.max(totalScenes, 1);

  if (ratio <= 0.34) {
    return 'Ouverture: installer le monde, la mission et un premier obstacle.';
  }

  if (ratio <= 0.75) {
    return 'Developpement: consequences des choix, nouvel obstacle et progression claire.';
  }

  return 'Resolution: preparer la conclusion et la lecon positive du personnage.';
};

const inferDecisionTag = (choiceText: string): string => {
  const lower = choiceText.toLowerCase();
  const found = DECISION_KEYWORDS.find((entry) =>
    entry.keywords.some((keyword) => lower.includes(keyword))
  );

  return found?.tag ?? 'choix_reflechi';
};

const summarizeDecisionTags = (decisionTags: string[]): string => {
  if (decisionTags.length === 0) {
    return 'choix_reflechi';
  }

  return Array.from(new Set(decisionTags)).slice(0, 4).join(', ');
};

const formatRecentChoices = (recentChoiceTexts: string[]): string => {
  if (recentChoiceTexts.length === 0) {
    return 'Aucun choix precedent.';
  }

  return recentChoiceTexts
    .slice(-MAX_RECENT_CHOICES)
    .map((choiceText, index) => `${index + 1}. ${choiceText}`)
    .join(' | ');
};

const buildEndingInstruction = (
  characterId: string,
  decisionTags: string[],
  recentChoiceTexts: string[]
): string => {
  const arc = pickCharacterArc(characterId);
  const decisionSummary = summarizeDecisionTags(decisionTags);
  const recentChoices = formatRecentChoices(recentChoiceTexts);

  return `Ceci est la derniere scene. Termine le conte avec ${arc.endingStyle}. ` +
    `Integre explicitement les consequences positives des decisions suivantes: ${decisionSummary}. ` +
    `Rappelle au moins un choix recent de maniere naturelle: ${recentChoices}. ` +
    `Mets en valeur la theme de valeur: ${arc.valueTheme}. ` +
    'La fin doit etre claire, complete, rassurante et sans suspense.';
};

const buildFallbackEndingText = (
  characterId: string,
  characterName: string,
  decisionTags: string[],
  recentChoiceTexts: string[]
): string => {
  const arc = pickCharacterArc(characterId);
  const decisionSummary = summarizeDecisionTags(decisionTags);
  const lastChoice = recentChoiceTexts[recentChoiceTexts.length - 1] ?? 'faire un choix bienveillant';

  return `${characterName} termine son arc "${arc.title}" avec une fin douce et lumineuse. ` +
    `Grace a ses decisions (${decisionSummary}), il/elle comprend la valeur de ${arc.valueTheme}. ` +
    `Son dernier elan, "${lastChoice}", devient un souvenir heureux qui rassure tout le monde.`;
};

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
  const [recentChoiceTexts, setRecentChoiceTexts] = useState<string[]>([]);
  const [keyDecisionTags, setKeyDecisionTags] = useState<string[]>([]);
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
      characterIdOverride?: string,
      previousChoiceText?: string,
      recentChoicesOverride?: string[],
      arcOverride?: CharacterArc
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
        const activeArc = arcOverride ?? pickCharacterArc(activeCharacterId);
        const recentChoicesForPrompt = (recentChoicesOverride ?? recentChoiceTexts).slice(-MAX_RECENT_CHOICES);

        const choices = await generateChoices(scene.text, activeCharacterId, {
          sceneNumber,
          totalScenes,
          previousChoiceText,
          recentChoices: recentChoicesForPrompt,
          arcTitle: activeArc.title,
          arcObjective: activeArc.objective,
        });
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
    [generateChoices, recentChoiceTexts, selectedCharacter]
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
        setRecentChoiceTexts(savedStory.recentChoiceTexts ?? []);
        setKeyDecisionTags(savedStory.keyDecisionTags ?? []);
        setStoryStartedAt(savedStory.startedAt);
        setResumeStorySummary(toResumeSummary(savedStory));
        return;
      }

      const startedAt = Date.now();
      setStoryStartedAt(startedAt);
      setRecentChoiceTexts([]);
      setKeyDecisionTags([]);

      const arc = pickCharacterArc(characterId);
      const arcMotifs = arc.motifs.join(', ');

      try {
        const initialScene = await generateStoryScene(
          `Commence une histoire magique pour enfants. ${storytellerStyle} Le heros principal est ${characterDesc}. Arc narratif: ${arc.title}. Objectif: ${arc.objective}. Tension narrative: ${arc.tension}. Motifs a reutiliser: ${arcMotifs}. Phase narrative: ${getArcPhase(1, totalScenes)}. Nous sommes a la scene 1 sur ${totalScenes}. Garde un ton rassurant et adapte le vocabulaire aux enfants.`,
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
          recentChoiceTexts: [],
          keyDecisionTags: [],
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
          recentChoiceTexts: [],
          keyDecisionTags: [],
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
    async (
      previousScene: StoryScene,
      choiceText: string,
      updatedChoices: string[],
      updatedRecentChoices: string[],
      updatedDecisionTags: string[]
    ) => {
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
      const arc = pickCharacterArc(selectedCharacter.id);
      const recentChoicesContext = formatRecentChoices(updatedRecentChoices);
      const decisionSummary = summarizeDecisionTags(updatedDecisionTags);
      const arcPhase = getArcPhase(nextSceneNumber, totalScenes);
      const arcMotifs = arc.motifs.join(', ');
      const storytellerStyle =
        STORYTELLER_PERSONALITIES[appSettings.storytellerPersonality].promptStyle;
      const endingInstruction = buildEndingInstruction(
        selectedCharacter.id,
        updatedDecisionTags,
        updatedRecentChoices
      );

      try {
        const newScene = await generateStoryScene(
          `${previousScene.text}\n\n${characterDesc} decide de : ${choiceText}. Arc en cours: ${arc.title}. Objectif de larc: ${arc.objective}. Tension: ${arc.tension}. Motifs a garder visibles: ${arcMotifs}. Theme de valeur: ${arc.valueTheme}. Phase narrative: ${arcPhase}. Choix recents: ${recentChoicesContext}. Decisions clefs prises: ${decisionSummary}. ${storytellerStyle} Nous sommes a la scene ${nextSceneNumber} sur ${totalScenes}. ${
            isFinalScene
              ? endingInstruction
              : `Continue lhistoire de maniere magique et adaptee aux enfants. Le heros principal reste ${characterInfo?.name ?? selectedCharacter.id}.`
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
        setRecentChoiceTexts(updatedRecentChoices);
        setKeyDecisionTags(updatedDecisionTags);

        const nextChoices = await generateChoicesForScene(
          formattedScene,
          nextSceneNumber,
          totalScenes,
          undefined,
          choiceText,
          updatedRecentChoices,
          arc
        );

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
          recentChoiceTexts: updatedRecentChoices,
          keyDecisionTags: updatedDecisionTags,
          startedAt: storyStartedAt ?? Date.now(),
          updatedAt: Date.now(),
        });
        await refreshSavedStories();
      } catch (error) {
        console.error('Erreur lors de la génération de scène:', error);

        const fallbackScene: StoryScene = {
          id: `scene_${nextSceneNumber}`,
          text: isFinalScene
            ? buildFallbackEndingText(
                selectedCharacter.id,
                characterInfo?.name ?? 'Le heros',
                updatedDecisionTags,
                updatedRecentChoices
              )
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
        setRecentChoiceTexts(updatedRecentChoices);
        setKeyDecisionTags(updatedDecisionTags);

        const nextChoices = await generateChoicesForScene(
          fallbackScene,
          nextSceneNumber,
          totalScenes,
          undefined,
          choiceText,
          updatedRecentChoices,
          arc
        );

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
          recentChoiceTexts: updatedRecentChoices,
          keyDecisionTags: updatedDecisionTags,
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
        const updatedRecentChoices = [...recentChoiceTexts, choice.text].slice(-MAX_RECENT_CHOICES);

        const nextDecisionTag = inferDecisionTag(choice.text);
        const updatedDecisionTags = [...keyDecisionTags, nextDecisionTag].slice(-MAX_DECISION_TAGS);

        setStoryProgress((prev) => ({
          ...prev,
          choices: updatedChoices,
        }));

        setRecentChoiceTexts(updatedRecentChoices);
        setKeyDecisionTags(updatedDecisionTags);

        await nextScene(
          currentScene,
          choice.text,
          updatedChoices,
          updatedRecentChoices,
          updatedDecisionTags
        );
      }
    },
    [
      currentChoices,
      currentScene,
      keyDecisionTags,
      nextScene,
      recentChoiceTexts,
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
    setRecentChoiceTexts([]);
    setKeyDecisionTags([]);
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
