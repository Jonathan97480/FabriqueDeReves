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

const SYSTEM_PROMPT_SCENE = `Tu es un conteur pour enfants créatif. Génère une histoire courte et magique en JSON uniquement.
Format obligatoire :
{"text":"<2-3 phrases pour enfants en français>","visuals":{"bg":"<forest|castle|space|ocean|mountain|village|garden|cave>","hero":"<HERO_ID>_<happy|brave|curious|thinking>","item":"<wand|compass|mirror|book|crown|key|lamp|flower|star>","effect":"<stars|rain|snow|fireflies|magic|clouds>"}}
Réponds UNIQUEMENT avec le JSON, sans texte avant ni après.`;

const SYSTEM_PROMPT_CHOICES = `Tu es un conteur pour enfants. Génère exactement 3 choix en JSON uniquement.
Format obligatoire :
[{"id":"1","text":"<choix court en français>","icon":"<compass|cave|star|map|key>","color":"<green|purple|pink|orange>","nextScene":"<mot_clé>"},{"id":"2","text":"<choix>","icon":"<icone>","color":"<couleur>","nextScene":"<mot_clé>"},{"id":"3","text":"<choix>","icon":"<icone>","color":"<couleur>","nextScene":"<mot_clé>"}]
Réponds UNIQUEMENT avec le JSON, sans texte avant ni après.`;

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

        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw) as GemmaResponse;

        if (!parsed.visuals?.hero?.startsWith(characterId)) {
          parsed.visuals.hero = `${characterId}_happy`;
        }
        return parsed;
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
    async (currentScene: string, characterId: string): Promise<StoryChoice[]> => {
      const config = currentConfig ?? (await loadAIConfig());
      setIsLoading(true);
      try {
        const userPrompt = `Histoire: "${currentScene.slice(0, 300)}"\nPersonnage: ${characterId}`;
        const raw = await callAI(config, SYSTEM_PROMPT_CHOICES, userPrompt, 250);
        console.log(`[${config.provider}] Choix:`, raw);

        const jsonMatch = raw.match(/\[[\s\S]*\]/);
        const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
        const choices: StoryChoice[] = Array.isArray(parsed) ? parsed : (parsed.choices ?? []);

        if (choices.length === 0) return createDefaultChoices();
        return choices.slice(0, 3);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`[IA] Erreur choix, fallback:`, message);
        return createDefaultChoices();
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
