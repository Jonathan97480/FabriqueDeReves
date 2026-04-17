/**
 * useGemmaGGUF.ts
 * Hook d inference IA multi-fournisseur.
 * Supporte : OpenAI, Anthropic (Claude), Ollama, et toute API compatible OpenAI.
 */

import { useState, useCallback, useEffect } from 'react';
import { loadAIConfig, type AIConfig } from '../services/AIProviderConfig';

interface GemmaResponse {
  text: string;
  visuals: {
    bg: string;
    hero: string;
    item: string;
    effect: string;
  };
}

interface StoryChoice {
  id: string;
  text: string;
  icon: string;
  color: string;
  nextScene: string;
}

interface ChoiceGenerationContext {
  sceneNumber?: number;
  totalScenes?: number;
  previousChoiceText?: string;
  recentChoices?: string[];
  arcTitle?: string;
  arcObjective?: string;
}

const VALID_BACKGROUNDS = ['forest', 'castle', 'space', 'ocean', 'mountain', 'village', 'garden', 'cave'];
const VALID_ITEMS = ['wand', 'compass', 'mirror', 'book', 'crown', 'key', 'lamp', 'flower', 'star'];
const VALID_EFFECTS = ['stars', 'rain', 'snow', 'fireflies', 'magic', 'clouds'];
const VALID_COLORS = ['green', 'purple', 'pink', 'orange'];
const VALID_ICONS = ['compass', 'cave', 'fairy', 'star', 'map', 'key'];
const VALID_HERO_EMOTIONS = ['happy', 'brave', 'curious', 'thinking'];

const SYSTEM_PROMPT_SCENE = `Tu es un conteur pour enfants expert en narration interactive.
Mission: produire une scène qui fait progresser l'aventure avec cohérence et variété.
Contraintes narratives:
- 2 a 4 phrases claires, imagées, adaptées aux enfants (6-10 ans).
- La scene doit avoir un petit objectif concret, un mini-enjeu rassurant et une transition naturelle.
- Evite la repetition de formulations entre scenes consecutives.
- Si c'est une scene finale, conclure avec une fin douce, satisfaisante et memorisable.

Réponds en JSON strict uniquement.
Format obligatoire :
{"text":"<2-3 phrases pour enfants en français>","visuals":{"bg":"<forest|castle|space|ocean|mountain|village|garden|cave>","hero":"<HERO_ID>_<happy|brave|curious|thinking>","item":"<wand|compass|mirror|book|crown|key|lamp|flower|star>","effect":"<stars|rain|snow|fireflies|magic|clouds>"}}
Réponds UNIQUEMENT avec le JSON, sans texte avant ni après.`;

const SYSTEM_PROMPT_CHOICES = `Tu es un conteur pour enfants. Génère exactement 3 choix utiles et logiques.
Contraintes qualité:
- Chaque choix doit etre directement faisable dans la scene actuelle.
- Les 3 choix doivent etre differents (exploration, interaction, action/reflexion).
- Les choix doivent aider l'enfant a comprendre les consequences, sans peur.
- Texte de choix: 6 a 11 mots maximum, naturel en francais.
- Si des choix precedents sont fournis, au moins un choix doit faire reference a une consequence concrete de ces choix.

Réponds en JSON strict uniquement.
Format obligatoire :
[{"id":"1","text":"<choix court en français>","icon":"<compass|cave|star|map|key>","color":"<green|purple|pink|orange>","nextScene":"<mot_clé>"},{"id":"2","text":"<choix>","icon":"<icone>","color":"<couleur>","nextScene":"<mot_clé>"},{"id":"3","text":"<choix>","icon":"<icone>","color":"<couleur>","nextScene":"<mot_clé>"}]
Réponds UNIQUEMENT avec le JSON, sans texte avant ni après.`;

const slugify = (value: string, fallback = 'next_scene') => {
  const normalized = value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  return normalized || fallback;
};

const pickOne = <T,>(items: T[]): T => {
  return items[Math.floor(Math.random() * items.length)];
};

const clipChoiceText = (value: string): string => {
  const collapsed = value.replace(/\s+/g, ' ').trim();
  return collapsed.slice(0, 90);
};

const normalizeSceneText = (value: string): string => {
  const collapsed = value.replace(/\s+/g, ' ').trim();
  return collapsed.slice(0, 460);
};

const normalizeHeroTag = (tag: string, characterId: string) => {
  const [rawId, rawEmotion] = tag.split('_');
  const safeId = rawId === characterId ? characterId : characterId;
  const safeEmotion = VALID_HERO_EMOTIONS.includes(rawEmotion) ? rawEmotion : 'happy';
  return `${safeId}_${safeEmotion}`;
};

const normalizeVisualTag = (value: string, allowed: string[], fallback: string) => {
  return allowed.includes(value) ? value : fallback;
};

const parseFirstJsonObject = (raw: string): Record<string, unknown> | null => {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }

    try {
      return JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
};

const parseFirstJsonArray = (raw: string): unknown[] | null => {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return null;
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]) as unknown;
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
};

const createContextualChoices = (sceneText: string): StoryChoice[] => {
  const lower = sceneText.toLowerCase();

  const optionsByContext: Array<{ when: RegExp; choices: StoryChoice[] }> = [
    {
      when: /for[êe]t|jardin|nature|arbre|fleur/,
      choices: [
        { id: '1', text: 'Suivre le sentier de lumières', icon: 'compass', color: 'green', nextScene: 'sentier_lumiere' },
        { id: '2', text: 'Parler doucement aux animaux', icon: 'star', color: 'purple', nextScene: 'dialogue_animaux' },
        { id: '3', text: 'Observer les indices au sol', icon: 'map', color: 'orange', nextScene: 'indices_foret' },
      ],
    },
    {
      when: /espace|[ée]toile|plan[èe]te|cosmos|n[ée]buleuse/,
      choices: [
        { id: '1', text: 'Suivre la constellation la plus brillante', icon: 'star', color: 'purple', nextScene: 'constellation_brillante' },
        { id: '2', text: 'Scanner la zone avec la carte', icon: 'map', color: 'green', nextScene: 'scan_spatial' },
        { id: '3', text: 'Approcher doucement l objet mystérieux', icon: 'key', color: 'orange', nextScene: 'objet_mysterieux' },
      ],
    },
    {
      when: /ch[âa]teau|couronne|roi|reine|tour/,
      choices: [
        { id: '1', text: 'Entrer dans la grande bibliothèque', icon: 'key', color: 'purple', nextScene: 'bibliotheque_royale' },
        { id: '2', text: 'Explorer la cour du château', icon: 'map', color: 'green', nextScene: 'cour_chateau' },
        { id: '3', text: 'Demander conseil au gardien', icon: 'star', color: 'pink', nextScene: 'conseil_gardien' },
      ],
    },
  ];

  const contextual = optionsByContext.find((entry) => entry.when.test(lower));
  if (contextual) {
    return contextual.choices;
  }

  return [
    { id: '1', text: 'Explorer calmement les environs', icon: 'compass', color: 'green', nextScene: 'exploration_douce' },
    { id: '2', text: 'Demander un indice magique', icon: 'star', color: 'purple', nextScene: 'indice_magique' },
    { id: '3', text: 'Essayer une idée courageuse', icon: 'key', color: 'orange', nextScene: 'idee_courageuse' },
  ];
};

const sanitizeChoices = (rawChoices: unknown[], sceneText: string): StoryChoice[] => {
  const usedTexts = new Set<string>();

  const cleaned = rawChoices
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map((choice, index) => {
      const text = clipChoiceText(String(choice.text ?? ''));
      const icon = String(choice.icon ?? '').toLowerCase();
      const color = String(choice.color ?? '').toLowerCase();
      const nextScene = String(choice.nextScene ?? '');

      return {
        id: String(index + 1),
        text,
        icon: VALID_ICONS.includes(icon) ? icon : pickOne(VALID_ICONS),
        color: VALID_COLORS.includes(color) ? color : VALID_COLORS[index % VALID_COLORS.length],
        nextScene: slugify(nextScene || text, `next_scene_${index + 1}`),
      } as StoryChoice;
    })
    .filter((choice) => {
      if (!choice.text || choice.text.length < 8) {
        return false;
      }

      const dedupeKey = choice.text.toLowerCase();
      if (usedTexts.has(dedupeKey)) {
        return false;
      }

      usedTexts.add(dedupeKey);
      return true;
    })
    .slice(0, 3);

  if (cleaned.length < 3) {
    return createContextualChoices(sceneText);
  }

  return cleaned;
};

const ensureContinuityChoice = (
  choices: StoryChoice[],
  context?: ChoiceGenerationContext
): StoryChoice[] => {
  const recent = context?.recentChoices ?? [];
  if (recent.length === 0 || choices.length === 0) {
    return choices;
  }

  const recentLower = recent.join(' ').toLowerCase();
  const hasContinuity = choices.some((choice) => {
    const choiceLower = choice.text.toLowerCase();
    return choiceLower.includes('encore') || choiceLower.includes('suite') || recentLower.includes(choiceLower);
  });

  if (hasContinuity) {
    return choices;
  }

  const lastRecent = recent[recent.length - 1] ?? 'notre derniere idee';
  const continuityChoice: StoryChoice = {
    id: '1',
    text: `Continuer la suite de: ${lastRecent}`.slice(0, 88),
    icon: 'map',
    color: 'purple',
    nextScene: slugify(`suite_${lastRecent}`, 'suite_histoire'),
  };

  return [continuityChoice, ...choices.slice(0, 2)].map((choice, index) => ({
    ...choice,
    id: String(index + 1),
  }));
};

async function callOpenAICompat(
  config: AIConfig,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
): Promise<string> {
  // Normalise l'URL : ajoute /v1 si absent (ex: llama.cpp sans /v1)
  const base = config.baseUrl.replace(/\/$/, '');
  const normalizedBase = /\/v\d+$/.test(base) ? base : `${base}/v1`;
  const url = `${normalizedBase}/chat/completions`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }

  const body: Record<string, unknown> = {
    model: config.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: maxTokens,
    temperature: 0.8,
  };

  if (config.provider === 'openai') {
    body['response_format'] = { type: 'json_object' };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`[${config.provider}] ${response.status}: ${err.slice(0, 200)}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

async function callAnthropic(
  config: AIConfig,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
): Promise<string> {
  const url = `${config.baseUrl.replace(/\/$/, '')}/messages`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`[anthropic] ${response.status}: ${err.slice(0, 200)}`);
  }

  const data = await response.json();
  return data.content[0].text.trim();
}

async function callAI(
  config: AIConfig,
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 300,
): Promise<string> {
  if (config.provider === 'anthropic') {
    return callAnthropic(config, systemPrompt, userPrompt, maxTokens);
  }
  return callOpenAICompat(config, systemPrompt, userPrompt, maxTokens);
}

const useGemmaGGUF = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<AIConfig | null>(null);

  const loadModel = useCallback(async () => {
    setIsLoading(true);
    setLoadProgress(30);
    setError(null);

    try {
      const config = await loadAIConfig();
      setLoadProgress(70);

      if (config.provider !== 'ollama' && !config.apiKey.trim()) {
        throw new Error(
          `Aucune clé API configurée pour ${config.provider}. Ouvre les réglages ⚙️`,
        );
      }
      if ((config.provider === 'ollama' || config.provider === 'custom') && !config.baseUrl.trim()) {
        throw new Error("L URL du serveur n est pas configurée. Ouvre les réglages ⚙️");
      }
      if (!config.model.trim()) {
        throw new Error('Aucun modèle configuré. Ouvre les réglages ⚙️');
      }

      setCurrentConfig(config);
      setLoadProgress(100);
      setIsModelLoaded(true);
      console.log(`[IA] Prêt — fournisseur: ${config.provider}, modèle: ${config.model}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      console.warn('[IA] Erreur initialisation:', message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateStoryScene = useCallback(
    async (prompt: string, characterId: string): Promise<GemmaResponse> => {
      const config = currentConfig ?? (await loadAIConfig());
      setIsLoading(true);
      try {
        const system = SYSTEM_PROMPT_SCENE.replace('HERO_ID', characterId);
        const raw = await callAI(config, system, prompt, 300);
        console.log(`[${config.provider}] Scène:`, raw);

        const parsedObject = parseFirstJsonObject(raw);
        if (!parsedObject) {
          return createDefaultResponse(characterId);
        }

        const parsedText = normalizeSceneText(String(parsedObject.text ?? ''));
        const visuals = (parsedObject.visuals ?? {}) as Record<string, unknown>;

        return {
          text: parsedText || createDefaultResponse(characterId).text,
          visuals: {
            bg: normalizeVisualTag(String(visuals.bg ?? ''), VALID_BACKGROUNDS, 'forest'),
            hero: normalizeHeroTag(String(visuals.hero ?? `${characterId}_happy`), characterId),
            item: normalizeVisualTag(String(visuals.item ?? ''), VALID_ITEMS, 'star'),
            effect: normalizeVisualTag(String(visuals.effect ?? ''), VALID_EFFECTS, 'magic'),
          },
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`[IA] Erreur scène, fallback:`, message);
        setError(message);
        return createDefaultResponse(characterId);
      } finally {
        setIsLoading(false);
      }
    },
    [currentConfig],
  );

  const generateChoices = useCallback(
    async (
      currentScene: string,
      characterId: string,
      context?: ChoiceGenerationContext
    ): Promise<StoryChoice[]> => {
      const config = currentConfig ?? (await loadAIConfig());
      setIsLoading(true);
      try {
        const sceneSummary = normalizeSceneText(currentScene).slice(0, 340);
        const progression =
          context?.sceneNumber && context?.totalScenes
            ? `Scene actuelle: ${context.sceneNumber}/${context.totalScenes}`
            : 'Scene actuelle: inconnue';
        const previousChoiceLine = context?.previousChoiceText
          ? `Dernier choix pris: ${context.previousChoiceText}`
          : '';
        const recentChoicesLine =
          context?.recentChoices && context.recentChoices.length > 0
            ? `2-3 derniers choix: ${context.recentChoices.join(' | ')}`
            : '';
        const arcLine =
          context?.arcTitle && context?.arcObjective
            ? `Arc en cours: ${context.arcTitle}. Objectif: ${context.arcObjective}.`
            : '';

        const userPrompt = [
          `Histoire: "${sceneSummary}"`,
          `Personnage: ${characterId}`,
          progression,
          previousChoiceLine,
          recentChoicesLine,
          arcLine,
          'Les choix doivent etre directement relies a cette scene.',
        ]
          .filter(Boolean)
          .join('\n');

        const raw = await callAI(config, SYSTEM_PROMPT_CHOICES, userPrompt, 250);
        console.log(`[${config.provider}] Choix:`, raw);

        const parsedArray = parseFirstJsonArray(raw);
        if (!parsedArray) {
          return ensureContinuityChoice(createContextualChoices(currentScene), context);
        }

        return ensureContinuityChoice(sanitizeChoices(parsedArray, currentScene), context);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`[IA] Erreur choix, fallback:`, message);
        return ensureContinuityChoice(createContextualChoices(currentScene), context);
      } finally {
        setIsLoading(false);
      }
    },
    [currentConfig],
  );

  useEffect(() => {
    loadModel();
  }, [loadModel]);

  return {
    isModelLoaded,
    isLoading,
    loadProgress,
    error,
    loadModel,
    generateStoryScene,
    generateChoices,
  };
};

const FALLBACK_SCENES = [
  { text: "Une aventure magique commence dans un monde rempli de mystères et d émerveillement...", bg: 'forest', hero_emotion: 'curious', item: 'compass', effect: 'fireflies' },
  { text: 'Le héros découvre un chemin secret menant vers une forêt enchantée où des lucioles dansent...', bg: 'garden', hero_emotion: 'happy', item: 'flower', effect: 'fireflies' },
  { text: 'Des étoiles brillent dans le ciel nocturne, guidant notre voyageur vers une destination inconnue...', bg: 'space', hero_emotion: 'brave', item: 'star', effect: 'stars' },
];

const FALLBACK_CHOICES_SETS: StoryChoice[][] = [
  [
    { id: '1', text: 'Explorer la forêt mystérieuse', icon: 'compass', color: 'green', nextScene: 'exploration' },
    { id: '2', text: "Demander l aide d une fée", icon: 'star', color: 'purple', nextScene: 'aide_fee' },
    { id: '3', text: 'Suivre les étoiles', icon: 'star', color: 'pink', nextScene: 'etoiles' },
  ],
  [
    { id: '1', text: 'Entrer dans la grotte sombre', icon: 'cave', color: 'orange', nextScene: 'grotte' },
    { id: '2', text: 'Utiliser la carte magique', icon: 'map', color: 'green', nextScene: 'carte' },
    { id: '3', text: 'Avancer courageusement', icon: 'star', color: 'pink', nextScene: 'aventure' },
  ],
];

function createDefaultResponse(characterId: string): GemmaResponse {
  const s = FALLBACK_SCENES[Math.floor(Math.random() * FALLBACK_SCENES.length)];
  return {
    text: s.text,
    visuals: { bg: s.bg, hero: `${characterId}_${s.hero_emotion}`, item: s.item, effect: s.effect },
  };
}

function createDefaultChoices(): StoryChoice[] {
  return FALLBACK_CHOICES_SETS[Math.floor(Math.random() * FALLBACK_CHOICES_SETS.length)];
}

export default useGemmaGGUF;
