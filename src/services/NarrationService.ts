import * as Speech from 'expo-speech';
import { NarratorEngine, NarratorLanguage, NarratorVoiceGender } from '../types';

const FEMALE_TOKENS = ['female', 'femme', 'woman', 'girl'];
const MALE_TOKENS = ['male', 'homme', 'man', 'boy'];
const FRENCH_TOKENS = ['fr', 'french', 'fr-fr', 'fr_ca'];

type VoiceLike = { identifier?: string; name?: string; language?: string };

let cachedVoiceSelection:
  | {
      gender: NarratorVoiceGender;
      language: NarratorLanguage;
      identifier?: string;
      languageTag?: string;
    }
  | null = null;

const getPrimaryLanguage = (locale?: string): string => {
  if (!locale) {
    return '';
  }

  return locale.split('-')[0]?.toLowerCase() ?? '';
};

const matchesPrimaryLanguage = (voiceLanguage: string | undefined, preferredLanguage: NarratorLanguage) => {
  return getPrimaryLanguage(voiceLanguage) === getPrimaryLanguage(preferredLanguage);
};

const scoreVoice = (
  voice: VoiceLike,
  preferredGender: NarratorVoiceGender,
  preferredLanguage: NarratorLanguage
) => {
  const haystack = `${voice.identifier ?? ''} ${voice.name ?? ''} ${voice.language ?? ''}`.toLowerCase();
  const genderTokens = preferredGender === 'female' ? FEMALE_TOKENS : MALE_TOKENS;
  const otherTokens = preferredGender === 'female' ? MALE_TOKENS : FEMALE_TOKENS;

  let score = 0;

  if (voice.language?.toLowerCase() === preferredLanguage.toLowerCase()) {
    score += 8;
  } else if (matchesPrimaryLanguage(voice.language, preferredLanguage)) {
    score += 5;
  }

  if (FRENCH_TOKENS.some((token) => haystack.includes(token))) {
    score += 4;
  }

  if (genderTokens.some((token) => haystack.includes(token))) {
    score += 3;
  }

  if (otherTokens.some((token) => haystack.includes(token))) {
    score -= 2;
  }

  return score;
};

export async function getPreferredVoice(
  preferredGender: NarratorVoiceGender,
  preferredLanguage: NarratorLanguage
) {
  const voices = await Speech.getAvailableVoicesAsync().catch(() => []);

  if (!voices.length) {
    return null;
  }

  if (
    cachedVoiceSelection &&
    cachedVoiceSelection.gender === preferredGender &&
    cachedVoiceSelection.language === preferredLanguage
  ) {
    const cachedVoice = voices.find(
      (voice) => voice.identifier === cachedVoiceSelection?.identifier
    );
    if (cachedVoice) {
      return cachedVoice;
    }
  }

  const samePrimaryLanguageVoices = voices.filter((voice) =>
    matchesPrimaryLanguage(voice.language, preferredLanguage)
  );
  const candidateVoices = samePrimaryLanguageVoices.length > 0 ? samePrimaryLanguageVoices : voices;

  const sortedVoices = [...candidateVoices].sort(
    (left, right) =>
      scoreVoice(right, preferredGender, preferredLanguage) -
      scoreVoice(left, preferredGender, preferredLanguage)
  );

  const selectedVoice = sortedVoices[0] ?? null;
  if (selectedVoice) {
    cachedVoiceSelection = {
      gender: preferredGender,
      language: preferredLanguage,
      identifier: selectedVoice.identifier,
      languageTag: selectedVoice.language,
    };
  }

  return selectedVoice;
}

export async function speakSceneText(
  text: string,
  narratorEngine: NarratorEngine,
  preferredGender: NarratorVoiceGender,
  preferredLanguage: NarratorLanguage
) {
  const trimmedText = text.trim();

  if (!trimmedText) {
    return;
  }

  Speech.stop();

  if (narratorEngine === 'system') {
    // Laisse Android choisir sa voix par défaut pour la langue demandée.
    Speech.speak(trimmedText, {
      language: preferredLanguage,
      rate: 0.92,
      pitch: 1,
    });
    return;
  }

  const voice = await getPreferredVoice(preferredGender, preferredLanguage);

  Speech.speak(trimmedText, {
    language: voice?.language ?? preferredLanguage,
    voice: voice?.identifier,
    pitch: preferredGender === 'female' ? 1.05 : 0.95,
    rate: 0.92,
  });
}

export function stopNarration() {
  Speech.stop();
}

export function resetNarrationVoiceCache() {
  cachedVoiceSelection = null;
}
