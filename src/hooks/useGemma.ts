/**
 * useGemma.js
 * Hook pour gérer l'inférence locale avec Gemma 4 2B via MediaPipe LLM Inference SDK
 */

import { useState, useCallback, useRef } from 'react';
import { GestureRecognizer, FilesetResolver } from '@mediapipe/tasks-genai';

interface GemmaConfig {
  modelPath: string;
  maxTokens: number;
  temperature: number;
}

interface GemmaResponse {
  text: string;
  visuals: {
    bg: string;
    hero: string;
    item: string;
    effect: string;
  };
}

const useGemma = (config: GemmaConfig = {
  modelPath: '/models/gemma-4-2b-int4.task',
  maxTokens: 500,
  temperature: 0.7
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const modelRef = useRef<any>(null);

  /**
   * Charge le modèle Gemma
   */
  const loadModel = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Créer le recognizer avec MediaPipe
      const genai = await FilesetResolver.forGenAiTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai/wasm'
      );

      // Charger le modèle local
      modelRef.current = await GestureRecognizer.createFromOptions(genai, {
        baseOptions: {
          modelAssetPath: config.modelPath,
          delegate: 'GPU',
        },
        maxResults: config.maxTokens,
        temperature: config.temperature,
      });

      setIsModelLoaded(true);
    } catch (err) {
      setError(`Erreur lors du chargement du modèle: ${err.message}`);
      console.error('Gemma model loading error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  /**
   * Génère du texte à partir d'un prompt
   */
  const generateText = useCallback(async (prompt: string): Promise<string> => {
    if (!modelRef.current) {
      setError('Le modèle n\'est pas chargé');
      throw new Error('Model not loaded');
    }

    try {
      setIsLoading(true);
      setError(null);

      const result = await modelRef.current.generate(prompt);
      return result.text;
    } catch (err) {
      setError(`Erreur lors de la génération: ${err.message}`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Génère une scène d'histoire avec les visuels associés
   */
  const generateStoryScene = useCallback(async (
    prompt: string,
    characterId: string
  ): Promise<GemmaResponse> => {
    const systemPrompt = `Tu es un conteur pour enfants. Tu dois générer une histoire interactive
      dans le format JSON suivant:
      {
        "text": "Le texte de l'histoire adapté aux enfants...",
        "visuals": {
          "bg": "forest/castle/space/ocean/mountain/village/garden/cave",
          "hero": "${characterId}_happy/brave/curious/thinking",
          "item": "wand/compass/mirror/book/crown/key/lamp/flower/star",
          "effect": "stars/rain/snow/fireflies/magic/clouds"
        }
      }

      Réponds uniquement avec ce format JSON valide. L'histoire doit être adaptée aux enfants
      et inspirer l'imagination.`;

    const fullPrompt = `${systemPrompt}\n\nContexte: ${prompt}`;

    try {
      const response = await generateText(fullPrompt);

      // Parser la réponse JSON
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(response);
      } catch (parseErr) {
        // Si la réponse n'est pas du JSON valide, créer une réponse par défaut
        console.warn('Failed to parse JSON response, using default');
        parsedResponse = {
          text: response,
          visuals: {
            bg: 'forest',
            hero: `${characterId}_happy`,
            item: 'star',
            effect: 'magic',
          }
        };
      }

      return parsedResponse;
    } catch (err) {
      // En cas d'erreur, retourner une scène par défaut
      return {
        text: "Une erreur s'est produite, mais l'aventure continue...",
        visuals: {
          bg: 'forest',
          hero: `${characterId}_happy`,
          item: 'star',
          effect: 'magic',
        }
      };
    }
  }, [generateText]);

  /**
   * Génère des choix pour l'histoire
   */
  const generateChoices = useCallback(async (
    currentScene: string,
    characterId: string
  ): Promise<Array<{
    id: string;
    text: string;
    icon: string;
    color: string;
    nextScene: string;
  }>> => {
    const prompt = `Génère 3 choix narratifs pour continuer cette histoire:
      "${currentScene}"

      Pour un personnage ${characterId}.

      Réponds au format JSON:
      [
        {
          "id": "1",
          "text": "Description du choix",
          "icon": "compass/cave/fairy/star/map/key",
          "color": "pink/orange/green/purple",
          "nextScene": "description_breve"
        }
      ]`;

    try {
      const response = await generateText(prompt);
      let choices;

      try {
        choices = JSON.parse(response);
      } catch (parseErr) {
        // Choix par défaut si le parsing échoue
        choices = [
          {
            id: '1',
            text: 'Explorer les environs',
            icon: 'compass',
            color: 'green',
            nextScene: 'exploration'
          },
          {
            id: '2',
            text: 'Demander conseil',
            icon: 'fairy',
            color: 'purple',
            nextScene: 'conseil'
          },
          {
            id: '3',
            text: 'Avancer courageusement',
            icon: 'star',
            color: 'pink',
            nextScene: 'aventure'
          }
        ];
      }

      return choices;
    } catch (err) {
      // Choix par défaut en cas d'erreur
      return [
        {
          id: '1',
          text: 'Continuer l\'aventure',
          icon: 'compass',
          color: 'green',
          nextScene: 'continue'
        },
        {
          id: '2',
          text: 'Se reposer un moment',
          icon: 'star',
          color: 'pink',
          nextScene: 'rest'
        },
        {
          id: '3',
          text: 'Chercher de l\'aide',
          icon: 'fairy',
          color: 'purple',
          nextScene: 'help'
        }
      ];
    }
  }, [generateText]);

  /**
   * Streaming de texte (pour effet d'écriture progressive)
   */
  const streamText = useCallback(async (
    prompt: string,
    onChunk: (chunk: string) => void
  ): Promise<void> => {
    if (!modelRef.current) {
      setError('Le modèle n\'est pas chargé');
      throw new Error('Model not loaded');
    }

    try {
      setIsLoading(true);
      setError(null);

      // Simuler le streaming (MediaPipe n'a pas de streaming natif)
      const result = await modelRef.current.generate(prompt);
      const text = result.text;

      // Diviser le texte en chunks et les envoyer progressivement
      const chunkSize = 5;
      for (let i = 0; i < text.length; i += chunkSize) {
        const chunk = text.substring(i, i + chunkSize);
        onChunk(chunk);
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    } catch (err) {
      setError(`Erreur lors du streaming: ${err.message}`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Nettoyer le modèle
   */
  const cleanup = useCallback(() => {
    if (modelRef.current) {
      modelRef.current.close();
      modelRef.current = null;
    }
    setIsModelLoaded(false);
  }, []);

  return {
    isModelLoaded,
    isLoading,
    error,
    loadModel,
    generateText,
    generateStoryScene,
    generateChoices,
    streamText,
    cleanup,
  };
};

export default useGemma;