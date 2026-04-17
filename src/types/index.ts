export interface StoryScene {
  id: string;
  text: string;
  visuals: {
    bg: string;
    hero: string;
    item: string;
    effect: string;
  };
}

export interface Character {
  id: string;
  name: string;
  description: string;
  image: number | { color: string; tag: string; isPlaceholder: boolean };
  theme: string;
}

export interface StoryChoice {
  id: string;
  text: string;
  icon: string | number | { color: string; tag: string; isPlaceholder: boolean };
  color: string;
  nextScene: string;
}

export interface StoryProgress {
  currentScene: number;
  totalScenes: number;
  characterId: string;
  choices: string[];
}

export interface SavedStoryState {
  characterId: string;
  storyProgress: StoryProgress;
  currentScene: StoryScene;
  currentChoices: StoryChoice[];
  startedAt: number;
  updatedAt: number;
}

export interface StoryResumeSummary {
  characterId: string;
  characterName: string;
  currentScene: number;
  totalScenes: number;
  updatedAt: number;
}

export interface CompletedStorySummary {
  id: string;
  characterId: string;
  characterName: string;
  totalScenes: number;
  completedAt: number;
  endingPreview: string;
}

export type StorytellerPersonality = 'gentle' | 'playful' | 'dreamy' | 'adventurous';

export type NarratorVoiceGender = 'female' | 'male';

export type NarratorLanguage = 'fr-FR' | 'en-US' | 'es-ES';

export type NarratorEngine = 'app' | 'system';

export interface AppSettings {
  maxScenes: number;
  storytellerPersonality: StorytellerPersonality;
  autoPlayNarration: boolean;
  narratorEngine: NarratorEngine;
  narratorVoiceGender: NarratorVoiceGender;
  narratorLanguage: NarratorLanguage;
}
