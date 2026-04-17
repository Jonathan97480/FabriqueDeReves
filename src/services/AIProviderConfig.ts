/**
 * AIProviderConfig.ts
 * Service de configuration des fournisseurs IA.
 * Persiste les réglages dans AsyncStorage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export type ProviderType = 'openai' | 'anthropic' | 'ollama' | 'custom';

export interface AIConfig {
  provider: ProviderType;
  apiKey: string;
  baseUrl: string;
  model: string;
}

const STORAGE_KEY = '@plumereve_ai_config';

export const PROVIDER_DEFAULTS: Record<ProviderType, AIConfig> = {
  openai: {
    provider: 'openai',
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
  },
  anthropic: {
    provider: 'anthropic',
    apiKey: '',
    baseUrl: 'https://api.anthropic.com/v1',
    model: 'claude-3-haiku-20240307',
  },
  ollama: {
    provider: 'ollama',
    apiKey: '',
    baseUrl: 'http://192.168.1.1:11434/v1',
    model: 'llama3.2',
  },
  custom: {
    provider: 'custom',
    apiKey: '',
    baseUrl: '',
    model: '',
  },
};

export const PROVIDER_LABELS: Record<ProviderType, string> = {
  openai: 'OpenAI (ChatGPT)',
  anthropic: 'Anthropic (Claude)',
  ollama: 'Ollama (local/réseau)',
  custom: 'API compatible (LM Studio…)',
};

export const PROVIDER_MODELS: Record<ProviderType, string[]> = {
  openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'],
  anthropic: ['claude-3-haiku-20240307', 'claude-3-5-sonnet-20241022', 'claude-3-opus-20240229'],
  ollama: ['llama3.2', 'llama3.1', 'mistral', 'gemma3', 'phi3', 'qwen2.5'],
  custom: [],
};

export async function loadAIConfig(): Promise<AIConfig> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as AIConfig;
    }
  } catch {
    // Ignore read errors — use default
  }
  return { ...PROVIDER_DEFAULTS.openai };
}

export async function saveAIConfig(config: AIConfig): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

/**
 * Valide la config avant sauvegarde.
 * Retourne null si valide, ou un message d'erreur.
 */
export function validateConfig(config: AIConfig): string | null {
  if (!config.model.trim()) return 'Le modèle est requis.';
  if (config.provider !== 'ollama' && !config.apiKey.trim()) {
    return 'La clé API est requise pour ce fournisseur.';
  }
  if ((config.provider === 'ollama' || config.provider === 'custom') && !config.baseUrl.trim()) {
    return "L'URL de base est requise pour ce fournisseur.";
  }
  return null;
}
