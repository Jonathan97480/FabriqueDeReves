import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AppSettings,
  NarratorEngine,
  NarratorLanguage,
  NarratorVoiceGender,
  StorytellerPersonality,
} from '../types';

const STORAGE_KEY = '@plumereve_app_settings';

export const MIN_SCENES = 5;
export const MAX_SCENES = 15;

export const DEFAULT_APP_SETTINGS: AppSettings = {
  maxScenes: 8,
  storytellerPersonality: 'gentle',
  autoPlayNarration: false,
  narratorEngine: 'app',
  narratorVoiceGender: 'female',
  narratorLanguage: 'fr-FR',
};

export const NARRATOR_ENGINE_OPTIONS: Record<
  NarratorEngine,
  { label: string; description: string }
> = {
  app: {
    label: "Voix de l'application",
    description: 'Voix stable choisie selon langue et genre.',
  },
  system: {
    label: 'Voix Android (systeme)',
    description: 'Utilise la voix par defaut du telephone.',
  },
};

export const STORYTELLER_PERSONALITIES: Record<
  StorytellerPersonality,
  { label: string; description: string; promptStyle: string }
> = {
  gentle: {
    label: 'Doux et rassurant',
    description: 'Parfait pour apaiser et raconter calmement.',
    promptStyle: 'Le conteur parle avec douceur, sécurité et tendresse.',
  },
  playful: {
    label: 'Joueur et joyeux',
    description: 'Un ton léger, souriant et amusant.',
    promptStyle: 'Le conteur adopte un ton joyeux, ludique et plein de malice.',
  },
  dreamy: {
    label: 'Poétique et rêveur',
    description: 'Des images douces et beaucoup de magie.',
    promptStyle: 'Le conteur utilise un ton poétique, rêveur et très imagé.',
  },
  adventurous: {
    label: 'Curieux et aventureux',
    description: 'Pour encourager l’exploration sans être effrayant.',
    promptStyle: 'Le conteur garde un ton aventureux, curieux et toujours adapté aux enfants.',
  },
};

export const NARRATOR_VOICE_OPTIONS: Record<
  NarratorVoiceGender,
  { label: string; description: string }
> = {
  female: {
    label: 'Voix féminine',
    description: 'Privilégie une voix douce de narratrice quand elle existe.',
  },
  male: {
    label: 'Voix masculine',
    description: 'Privilégie une voix de narrateur quand elle existe.',
  },
};

export const NARRATOR_LANGUAGE_OPTIONS: Record<
  NarratorLanguage,
  { label: string; description: string }
> = {
  'fr-FR': {
    label: 'Francais',
    description: 'Par defaut pour les contes en francais.',
  },
  'en-US': {
    label: 'English',
    description: 'Voix anglaise americain.',
  },
  'es-ES': {
    label: 'Espanol',
    description: 'Voix espagnole.',
  },
};

export function clampSceneCount(value: number): number {
  if (Number.isNaN(value)) {
    return DEFAULT_APP_SETTINGS.maxScenes;
  }

  return Math.max(MIN_SCENES, Math.min(MAX_SCENES, Math.round(value)));
}

export async function loadAppSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return { ...DEFAULT_APP_SETTINGS };
    }

    const parsed = JSON.parse(raw) as Partial<AppSettings>;

    const storytellerPersonality =
      parsed.storytellerPersonality && parsed.storytellerPersonality in STORYTELLER_PERSONALITIES
        ? parsed.storytellerPersonality
        : DEFAULT_APP_SETTINGS.storytellerPersonality;

    const narratorVoiceGender: NarratorVoiceGender =
      parsed.narratorVoiceGender === 'male' || parsed.narratorVoiceGender === 'female'
        ? parsed.narratorVoiceGender
        : DEFAULT_APP_SETTINGS.narratorVoiceGender;

    const narratorEngine: NarratorEngine =
      parsed.narratorEngine === 'system' || parsed.narratorEngine === 'app'
        ? parsed.narratorEngine
        : DEFAULT_APP_SETTINGS.narratorEngine;

    const narratorLanguage: NarratorLanguage =
      parsed.narratorLanguage && parsed.narratorLanguage in NARRATOR_LANGUAGE_OPTIONS
        ? parsed.narratorLanguage
        : DEFAULT_APP_SETTINGS.narratorLanguage;

    return {
      ...DEFAULT_APP_SETTINGS,
      ...parsed,
      maxScenes: clampSceneCount(parsed.maxScenes ?? DEFAULT_APP_SETTINGS.maxScenes),
      storytellerPersonality,
      narratorEngine,
      narratorVoiceGender,
      narratorLanguage,
      autoPlayNarration:
        typeof parsed.autoPlayNarration === 'boolean'
          ? parsed.autoPlayNarration
          : DEFAULT_APP_SETTINGS.autoPlayNarration,
    };
  } catch {
    return { ...DEFAULT_APP_SETTINGS };
  }
}

export async function saveAppSettings(settings: AppSettings): Promise<void> {
  const normalizedSettings: AppSettings = {
    ...settings,
    maxScenes: clampSceneCount(settings.maxScenes),
  };

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedSettings));
}