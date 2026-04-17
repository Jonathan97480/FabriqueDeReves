import AsyncStorage from '@react-native-async-storage/async-storage';
import AssetManager from './AssetManager';
import { CompletedStorySummary, SavedStoryState, StoryResumeSummary } from '../types';

const ACTIVE_STORY_KEY = '@plumereve:active_story';
const STORY_HISTORY_KEY = '@plumereve:story_history';
const MAX_HISTORY_ITEMS = 20;

function isValidSavedStoryState(value: unknown): value is SavedStoryState {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const story = value as Partial<SavedStoryState>;
  return (
    typeof story.characterId === 'string' &&
    !!story.currentScene &&
    !!story.storyProgress &&
    Array.isArray(story.currentChoices) &&
    typeof story.startedAt === 'number' &&
    typeof story.updatedAt === 'number'
  );
}

export async function loadActiveStory(): Promise<SavedStoryState | null> {
  try {
    const raw = await AsyncStorage.getItem(ACTIVE_STORY_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!isValidSavedStoryState(parsed)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export async function saveActiveStory(story: SavedStoryState): Promise<void> {
  await AsyncStorage.setItem(ACTIVE_STORY_KEY, JSON.stringify(story));
}

export async function clearActiveStory(): Promise<void> {
  await AsyncStorage.removeItem(ACTIVE_STORY_KEY);
}

export async function loadStoryHistory(): Promise<CompletedStorySummary[]> {
  try {
    const raw = await AsyncStorage.getItem(STORY_HISTORY_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item) => item && typeof item === 'object') as CompletedStorySummary[];
  } catch {
    return [];
  }
}

export async function appendCompletedStory(
  characterId: string,
  totalScenes: number,
  endingText: string
): Promise<void> {
  const existingHistory = await loadStoryHistory();
  const character = AssetManager.getCharacterInfo(characterId);
  const cleanPreview = endingText.trim().replace(/\s+/g, ' ');

  const newEntry: CompletedStorySummary = {
    id: `story_${Date.now()}`,
    characterId,
    characterName: character?.name ?? characterId,
    totalScenes,
    completedAt: Date.now(),
    endingPreview: cleanPreview.slice(0, 180),
  };

  const nextHistory = [newEntry, ...existingHistory].slice(0, MAX_HISTORY_ITEMS);
  await AsyncStorage.setItem(STORY_HISTORY_KEY, JSON.stringify(nextHistory));
}

export function toResumeSummary(story: SavedStoryState | null): StoryResumeSummary | null {
  if (!story) {
    return null;
  }

  const character = AssetManager.getCharacterInfo(story.characterId);

  return {
    characterId: story.characterId,
    characterName: character?.name ?? story.characterId,
    currentScene: story.storyProgress.currentScene,
    totalScenes: story.storyProgress.totalScenes,
    updatedAt: story.updatedAt,
  };
}
