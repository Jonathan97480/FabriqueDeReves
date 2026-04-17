/**
 * SettingsScreen.tsx
 * Écran de réglages avec onglets IA, fabrique d'histoires et narration.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import { RootStackParamList } from '../navigation/AppNavigator';
import {
  loadAIConfig,
  saveAIConfig,
  validateConfig,
  PROVIDER_DEFAULTS,
  PROVIDER_LABELS,
  PROVIDER_MODELS,
  type AIConfig,
  type ProviderType,
} from '../services/AIProviderConfig';
import {
  clampSceneCount,
  DEFAULT_APP_SETTINGS,
  loadAppSettings,
  MAX_SCENES,
  MIN_SCENES,
  NARRATOR_ENGINE_OPTIONS,
  NARRATOR_LANGUAGE_OPTIONS,
  NARRATOR_VOICE_OPTIONS,
  saveAppSettings,
  STORYTELLER_PERSONALITIES,
} from '../services/AppSettingsConfig';
import {
  AppSettings,
  NarratorEngine,
  NarratorLanguage,
  NarratorVoiceGender,
  StorytellerPersonality,
} from '../types';
import { speakSceneText, stopNarration } from '../services/NarrationService';
import { colors, gradients } from '../theme/colors';

type SettingsNavigation = NavigationProp<RootStackParamList>;
type SettingsTab = 'ai' | 'story' | 'voice';

const PROVIDERS: ProviderType[] = ['openai', 'anthropic', 'ollama', 'custom'];
const STORYTELLER_OPTIONS: StorytellerPersonality[] = [
  'gentle',
  'playful',
  'dreamy',
  'adventurous',
];
const VOICE_OPTIONS: NarratorVoiceGender[] = ['female', 'male'];
const LANGUAGE_OPTIONS: NarratorLanguage[] = ['fr-FR', 'en-US', 'es-ES'];
const ENGINE_OPTIONS: NarratorEngine[] = ['app', 'system'];

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<SettingsNavigation>();

  const [activeTab, setActiveTab] = useState<SettingsTab>('ai');
  const [config, setConfig] = useState<AIConfig>({ ...PROVIDER_DEFAULTS.openai });
  const [appSettings, setAppSettings] = useState<AppSettings>({ ...DEFAULT_APP_SETTINGS });
  const [maxScenesInput, setMaxScenesInput] = useState(String(DEFAULT_APP_SETTINGS.maxScenes));
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    let isMounted = true;

    Promise.all([loadAIConfig(), loadAppSettings()]).then(([loadedConfig, loadedSettings]) => {
      if (!isMounted) {
        return;
      }

      setConfig(loadedConfig);
      setAppSettings(loadedSettings);
      setMaxScenesInput(String(loadedSettings.maxScenes));
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleProviderChange = useCallback((provider: ProviderType) => {
    setConfig((prev) => ({
      ...PROVIDER_DEFAULTS[provider],
      apiKey: prev.provider === provider ? prev.apiKey : PROVIDER_DEFAULTS[provider].apiKey,
    }));
    setTestResult(null);
  }, []);

  const updateSceneCount = useCallback((nextValue: number) => {
    const normalizedValue = clampSceneCount(nextValue);

    setAppSettings((prev) => ({
      ...prev,
      maxScenes: normalizedValue,
    }));
    setMaxScenesInput(String(normalizedValue));
  }, []);

  const handleSceneCountBlur = useCallback(() => {
    updateSceneCount(Number(maxScenesInput));
  }, [maxScenesInput, updateSceneCount]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);

    try {
      if (activeTab === 'ai') {
        const validationError = validateConfig(config);
        if (validationError) {
          Alert.alert('Paramètre manquant', validationError);
          return;
        }

        await saveAIConfig(config);
        Alert.alert('Réglages IA sauvegardés', 'Le fournisseur et le modèle ont été enregistrés.');
        return;
      }

      const normalizedSettings: AppSettings = {
        ...appSettings,
        maxScenes: clampSceneCount(Number(maxScenesInput)),
      };

      await saveAppSettings(normalizedSettings);
      setAppSettings(normalizedSettings);
      setMaxScenesInput(String(normalizedSettings.maxScenes));

      Alert.alert(
        activeTab === 'story' ? 'Fabrique sauvegardée' : 'Voix sauvegardée',
        activeTab === 'story'
          ? 'Les règles de la Fabrique à Rêves ont été enregistrées.'
          : 'Les préférences de narration automatique ont été enregistrées.'
      );
    } finally {
      setIsSaving(false);
    }
  }, [activeTab, appSettings, config, maxScenesInput]);

  const handleTest = useCallback(async () => {
    const validationError = validateConfig(config);
    if (validationError) {
      Alert.alert('Paramètre manquant', validationError);
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      let url: string;
      let fetchOptions: RequestInit;

      if (config.provider === 'anthropic') {
        url = `${config.baseUrl.replace(/\/$/, '')}/messages`;
        fetchOptions = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': config.apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: config.model,
            max_tokens: 10,
            messages: [{ role: 'user', content: 'Dis juste "OK".' }],
          }),
        };
      } else {
        const base = config.baseUrl.replace(/\/$/, '');
        const normalizedBase = /\/v\d+$/.test(base) ? base : `${base}/v1`;
        url = `${normalizedBase}/chat/completions`;

        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (config.apiKey) {
          headers.Authorization = `Bearer ${config.apiKey}`;
        }

        fetchOptions = {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: config.model,
            messages: [{ role: 'user', content: 'Dis juste "OK".' }],
            max_tokens: 10,
          }),
        };
      }

      const response = await fetch(url, fetchOptions);
      if (response.ok) {
        setTestResult({ ok: true, message: `Connexion réussie (${config.provider})` });
      } else {
        const err = await response.text();
        setTestResult({ ok: false, message: `Erreur ${response.status}: ${err.slice(0, 120)}` });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setTestResult({ ok: false, message });
    } finally {
      setIsTesting(false);
    }
  }, [config]);

  const handleVoicePreview = useCallback(() => {
    const sampleByLanguage: Record<NarratorLanguage, string> = {
      'fr-FR': 'Bonsoir, je suis la voix de Plume et Reve. Cette voix restera stable pendant votre histoire.',
      'en-US': 'Hello, I am the Plume and Reve narrator voice. This voice will stay consistent during your story.',
      'es-ES': 'Hola, soy la voz narradora de Plume y Reve. Esta voz se mantendra estable durante tu historia.',
    };

    const sampleText = sampleByLanguage[appSettings.narratorLanguage] ?? sampleByLanguage['fr-FR'];
    speakSceneText(
      sampleText,
      appSettings.narratorEngine,
      appSettings.narratorVoiceGender,
      appSettings.narratorLanguage
    );
  }, [appSettings.narratorEngine, appSettings.narratorLanguage, appSettings.narratorVoiceGender]);

  const renderTabs = () => (
    <View style={styles.tabRow}>
      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'ai' && styles.tabButtonActive]}
        onPress={() => setActiveTab('ai')}
        activeOpacity={0.8}
      >
        <Text style={[styles.tabButtonText, activeTab === 'ai' && styles.tabButtonTextActive]}>
          IA
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'story' && styles.tabButtonActive]}
        onPress={() => setActiveTab('story')}
        activeOpacity={0.8}
      >
        <Text style={[styles.tabButtonText, activeTab === 'story' && styles.tabButtonTextActive]}>
          Fabrique
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'voice' && styles.tabButtonActive]}
        onPress={() => setActiveTab('voice')}
        activeOpacity={0.8}
      >
        <Text style={[styles.tabButtonText, activeTab === 'voice' && styles.tabButtonTextActive]}>
          Voix
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderAISettings = () => {
    const suggestedModels = PROVIDER_MODELS[config.provider];

    return (
      <>
        <Text style={styles.sectionTitle}>Fournisseur IA</Text>
        <View style={styles.providerGrid}>
          {PROVIDERS.map((provider) => (
            <TouchableOpacity
              key={provider}
              style={[
                styles.providerChip,
                config.provider === provider && styles.providerChipActive,
              ]}
              onPress={() => handleProviderChange(provider)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.providerChipText,
                  config.provider === provider && styles.providerChipTextActive,
                ]}
              >
                {PROVIDER_LABELS[provider]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {(config.provider === 'ollama' || config.provider === 'custom') && (
          <>
            <Text style={styles.label}>URL du serveur</Text>
            <TextInput
              style={styles.input}
              value={config.baseUrl}
              onChangeText={(value) => setConfig((prev) => ({ ...prev, baseUrl: value }))}
              placeholder={
                config.provider === 'ollama'
                  ? 'http://10.0.2.2:11434/v1'
                  : 'http://10.0.2.2:8080/v1'
              }
              placeholderTextColor={colors.text.secondary}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <Text style={styles.hint}>
              Sur émulateur Android, 10.0.2.2 pointe souvent vers le PC hôte.
            </Text>
          </>
        )}

        {config.provider !== 'ollama' && (
          <>
            <Text style={styles.label}>Clé API</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, styles.inputFlex]}
                value={config.apiKey}
                onChangeText={(value) => setConfig((prev) => ({ ...prev, apiKey: value }))}
                placeholder={
                  config.provider === 'openai'
                    ? 'sk-...'
                    : config.provider === 'anthropic'
                      ? 'sk-ant-...'
                      : 'Clé API optionnelle'
                }
                placeholderTextColor={colors.text.secondary}
                secureTextEntry={!showApiKey}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowApiKey((prev) => !prev)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showApiKey ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color={colors.text.secondary}
                />
              </TouchableOpacity>
            </View>
          </>
        )}

        <Text style={styles.label}>Modèle</Text>
        <TextInput
          style={styles.input}
          value={config.model}
          onChangeText={(value) => setConfig((prev) => ({ ...prev, model: value }))}
          placeholder="Nom du modèle"
          placeholderTextColor={colors.text.secondary}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {suggestedModels.length > 0 && (
          <View style={styles.modelSuggestions}>
            {suggestedModels.map((model) => (
              <TouchableOpacity
                key={model}
                style={[styles.modelChip, config.model === model && styles.modelChipActive]}
                onPress={() => setConfig((prev) => ({ ...prev, model }))}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.modelChipText,
                    config.model === model && styles.modelChipTextActive,
                  ]}
                >
                  {model}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {testResult && (
          <View
            style={[
              styles.testResult,
              testResult.ok ? styles.testResultOk : styles.testResultError,
            ]}
          >
            <Ionicons
              name={testResult.ok ? 'checkmark-circle' : 'alert-circle'}
              size={18}
              color={testResult.ok ? colors.green : colors.orange}
            />
            <Text style={styles.testResultText}>{testResult.message}</Text>
          </View>
        )}

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={handleTest}
            activeOpacity={0.8}
            disabled={isTesting}
          >
            {isTesting ? (
              <ActivityIndicator size="small" color={colors.text.primary} />
            ) : (
              <Text style={styles.buttonSecondaryText}>Tester</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary]}
            onPress={handleSave}
            activeOpacity={0.8}
            disabled={isSaving}
          >
            <Text style={styles.buttonPrimaryText}>Sauvegarder</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  };

  const renderStorySettings = () => (
    <>
      <Text style={styles.sectionTitle}>Fabrique à Rêves</Text>
      <Text style={styles.sectionDescription}>
        Définis la longueur maximale des histoires et la personnalité du conteur.
      </Text>

      <Text style={styles.label}>Nombre maximum de scènes</Text>
      <View style={styles.counterRow}>
        <TouchableOpacity
          style={styles.counterButton}
          onPress={() => updateSceneCount(appSettings.maxScenes - 1)}
          activeOpacity={0.8}
        >
          <Ionicons name="remove" size={20} color={colors.text.primary} />
        </TouchableOpacity>

        <TextInput
          style={[styles.input, styles.counterInput]}
          value={maxScenesInput}
          onChangeText={(value) => setMaxScenesInput(value.replace(/[^0-9]/g, ''))}
          onBlur={handleSceneCountBlur}
          keyboardType="number-pad"
          placeholder={String(DEFAULT_APP_SETTINGS.maxScenes)}
          placeholderTextColor={colors.text.secondary}
          textAlign="center"
        />

        <TouchableOpacity
          style={styles.counterButton}
          onPress={() => updateSceneCount(appSettings.maxScenes + 1)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={20} color={colors.text.primary} />
        </TouchableOpacity>
      </View>
      <Text style={styles.hint}>
        Minimum {MIN_SCENES} scènes, maximum {MAX_SCENES}. La dernière scène devient une fin complète.
      </Text>

      <Text style={styles.label}>Personnalité du conteur</Text>
      <View style={styles.optionList}>
        {STORYTELLER_OPTIONS.map((personality) => {
          const option = STORYTELLER_PERSONALITIES[personality];

          return (
            <TouchableOpacity
              key={personality}
              style={[
                styles.optionCard,
                appSettings.storytellerPersonality === personality && styles.optionCardActive,
              ]}
              onPress={() =>
                setAppSettings((prev) => ({
                  ...prev,
                  storytellerPersonality: personality,
                }))
              }
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.optionTitle,
                  appSettings.storytellerPersonality === personality && styles.optionTitleActive,
                ]}
              >
                {option.label}
              </Text>
              <Text style={styles.optionDescription}>{option.description}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={[styles.singleButton, styles.buttonPrimary]}
        onPress={handleSave}
        activeOpacity={0.8}
        disabled={isSaving}
      >
        <Text style={styles.buttonPrimaryText}>Sauvegarder la Fabrique</Text>
      </TouchableOpacity>
    </>
  );

  const renderVoiceSettings = () => (
    <>
      <Text style={styles.sectionTitle}>Lecture automatique</Text>
      <Text style={styles.sectionDescription}>
        Active la lecture synthétique des scènes et choisis le type de voix préféré.
      </Text>

      <View style={styles.switchCard}>
        <View style={styles.switchTextContainer}>
          <Text style={styles.optionTitle}>Lire les scènes automatiquement</Text>
          <Text style={styles.optionDescription}>
            La narration démarre dès qu'une nouvelle scène est affichée.
          </Text>
        </View>
        <Switch
          value={appSettings.autoPlayNarration}
          onValueChange={(value) =>
            setAppSettings((prev) => ({
              ...prev,
              autoPlayNarration: value,
            }))
          }
          trackColor={{ false: colors.border, true: colors.green }}
          thumbColor={colors.card}
        />
      </View>

      <Text style={styles.label}>Moteur de voix</Text>
      <View style={styles.optionList}>
        {ENGINE_OPTIONS.map((engine) => {
          const option = NARRATOR_ENGINE_OPTIONS[engine];

          return (
            <TouchableOpacity
              key={engine}
              style={[
                styles.optionCard,
                appSettings.narratorEngine === engine && styles.optionCardActive,
              ]}
              onPress={() =>
                setAppSettings((prev) => ({
                  ...prev,
                  narratorEngine: engine,
                }))
              }
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.optionTitle,
                  appSettings.narratorEngine === engine && styles.optionTitleActive,
                ]}
              >
                {option.label}
              </Text>
              <Text style={styles.optionDescription}>{option.description}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.label}>Voix préférée</Text>
      <View style={styles.optionList}>
        {VOICE_OPTIONS.map((voiceGender) => {
          const option = NARRATOR_VOICE_OPTIONS[voiceGender];

          return (
            <TouchableOpacity
              key={voiceGender}
              style={[
                styles.optionCard,
                appSettings.narratorVoiceGender === voiceGender && styles.optionCardActive,
              ]}
              onPress={() =>
                setAppSettings((prev) => ({
                  ...prev,
                  narratorVoiceGender: voiceGender,
                }))
              }
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.optionTitle,
                  appSettings.narratorVoiceGender === voiceGender && styles.optionTitleActive,
                ]}
              >
                {option.label}
              </Text>
              <Text style={styles.optionDescription}>{option.description}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.label}>Langue de la voix</Text>
      <View style={styles.optionList}>
        {LANGUAGE_OPTIONS.map((languageCode) => {
          const option = NARRATOR_LANGUAGE_OPTIONS[languageCode];

          return (
            <TouchableOpacity
              key={languageCode}
              style={[
                styles.optionCard,
                appSettings.narratorLanguage === languageCode && styles.optionCardActive,
              ]}
              onPress={() =>
                setAppSettings((prev) => ({
                  ...prev,
                  narratorLanguage: languageCode,
                }))
              }
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.optionTitle,
                  appSettings.narratorLanguage === languageCode && styles.optionTitleActive,
                ]}
              >
                {option.label}
              </Text>
              <Text style={styles.optionDescription}>{option.description}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.hint}>
        La voix exacte dépend des voix installées sur l'appareil. L'application préfère le genre sélectionné quand c'est possible.
      </Text>

      <TouchableOpacity
        style={[styles.singleButton, styles.buttonSecondary]}
        onPress={handleVoicePreview}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonSecondaryText}>Tester la voix</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.singleButton, styles.buttonSecondary]}
        onPress={stopNarration}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonSecondaryText}>Arreter la lecture</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.singleButton, styles.buttonPrimary]}
        onPress={handleSave}
        activeOpacity={0.8}
        disabled={isSaving}
      >
        <Text style={styles.buttonPrimaryText}>Sauvegarder la voix</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradients.primary} style={StyleSheet.absoluteFill} />
      <Header title="Réglages" showBackButton onBackPress={() => navigation.goBack()} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {renderTabs()}
          {activeTab === 'ai' && renderAISettings()}
          {activeTab === 'story' && renderStorySettings()}
          {activeTab === 'voice' && renderVoiceSettings()}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 4,
    marginTop: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
  },
  tabButtonActive: {
    backgroundColor: colors.purple,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  tabButtonTextActive: {
    color: colors.text.white,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 24,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.text.secondary,
    marginBottom: 12,
  },
  providerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  providerChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  providerChipActive: {
    backgroundColor: colors.purple,
    borderColor: colors.purple,
  },
  providerChipText: {
    fontSize: 13,
    color: colors.text.primary,
    fontWeight: '500',
  },
  providerChipTextActive: {
    color: colors.text.white,
    fontWeight: '700',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 20,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputFlex: {
    flex: 1,
  },
  eyeButton: {
    padding: 10,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hint: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 6,
    lineHeight: 18,
  },
  modelSuggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  modelChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modelChipActive: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  modelChipText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  modelChipTextActive: {
    color: colors.text.primary,
    fontWeight: '700',
  },
  testResult: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 20,
    padding: 12,
    borderRadius: 12,
  },
  testResultOk: {
    backgroundColor: colors.background.primary,
  },
  testResultError: {
    backgroundColor: colors.background.secondary,
  },
  testResultText: {
    flex: 1,
    fontSize: 13,
    color: colors.text.primary,
    lineHeight: 18,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  singleButton: {
    marginTop: 28,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: colors.purple,
  },
  buttonPrimaryText: {
    color: colors.text.white,
    fontWeight: '700',
    fontSize: 15,
  },
  buttonSecondary: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  buttonSecondaryText: {
    color: colors.text.primary,
    fontWeight: '600',
    fontSize: 15,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  counterButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
  },
  optionList: {
    gap: 10,
    marginTop: 8,
  },
  optionCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionCardActive: {
    borderColor: colors.purple,
    backgroundColor: colors.background.primary,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  optionTitleActive: {
    color: colors.purple,
  },
  optionDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.secondary,
  },
  switchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 8,
  },
  switchTextContainer: {
    flex: 1,
  },
});

export default SettingsScreen;
