/**
 * SettingsScreen.tsx
 * Écran de configuration du fournisseur IA.
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
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
import { colors, gradients } from '../theme/colors';

const PROVIDERS: ProviderType[] = ['openai', 'anthropic', 'ollama', 'custom'];

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();

  const [config, setConfig] = useState<AIConfig>({ ...PROVIDER_DEFAULTS.openai });
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    loadAIConfig().then(setConfig);
  }, []);

  const handleProviderChange = useCallback((provider: ProviderType) => {
    setConfig((prev) => ({
      ...PROVIDER_DEFAULTS[provider],
      // Conserver la clé si on revient au même fournisseur
      apiKey: prev.provider === provider ? prev.apiKey : PROVIDER_DEFAULTS[provider].apiKey,
    }));
    setTestResult(null);
  }, []);

  const handleSave = useCallback(async () => {
    const validationError = validateConfig(config);
    if (validationError) {
      Alert.alert('Paramètre manquant', validationError);
      return;
    }
    await saveAIConfig(config);
    Alert.alert('Sauvegardé ✓', 'Les réglages ont été enregistrés.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  }, [config, navigation]);

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
        if (config.apiKey) headers['Authorization'] = `Bearer ${config.apiKey}`;
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

  const suggestedModels = PROVIDER_MODELS[config.provider];

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradients.primary} style={StyleSheet.absoluteFill} />
      <Header title="Réglages IA ⚙️" showBackButton onBackPress={() => navigation.goBack()} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Sélecteur de fournisseur */}
          <Text style={styles.sectionTitle}>Fournisseur IA</Text>
          <View style={styles.providerGrid}>
            {PROVIDERS.map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.providerChip, config.provider === p && styles.providerChipActive]}
                onPress={() => handleProviderChange(p)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.providerChipText,
                    config.provider === p && styles.providerChipTextActive,
                  ]}
                >
                  {PROVIDER_LABELS[p]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* URL de base — Ollama / Custom */}
          {(config.provider === 'ollama' || config.provider === 'custom') && (
            <>
              <Text style={styles.label}>URL du serveur</Text>
              <TextInput
                style={styles.input}
                value={config.baseUrl}
                onChangeText={(v) => setConfig((c) => ({ ...c, baseUrl: v }))}
                placeholder={
                  config.provider === 'ollama'
                    ? 'http://192.168.1.x:11434/v1'
                    : 'http://localhost:1234/v1'
                }
                placeholderTextColor={colors.text.secondary}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              {config.provider === 'ollama' && (
                <Text style={styles.hint}>
                  💡 Remplace l'IP par celle de ta machine sur le réseau local.{'\n'}
                  Assure-toi qu'Ollama tourne avec OLLAMA_HOST=0.0.0.0
                </Text>
              )}
              {config.provider === 'custom' && (
                <Text style={styles.hint}>
                  💡 L'URL doit se terminer par /v1{'\n'}Ex : http://192.168.1.x:8080/v1{'\n'}{'\n'}Pour llama.cpp server : l'endpoint est /v1/chat/completions{'\n'}Pour LM Studio : port 1234 par défaut
                </Text>
              )}
            </>
          )}

          {/* Clé API — pas pour Ollama */}
          {config.provider !== 'ollama' && (
            <>
              <Text style={styles.label}>Clé API</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, styles.inputFlex]}
                  value={config.apiKey}
                  onChangeText={(v) => setConfig((c) => ({ ...c, apiKey: v }))}
                  placeholder={
                    config.provider === 'openai'
                      ? 'sk-...'
                      : config.provider === 'anthropic'
                        ? 'sk-ant-...'
                        : 'Clé API (optionnelle)'
                  }
                  placeholderTextColor={colors.text.secondary}
                  secureTextEntry={!showApiKey}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowApiKey((v) => !v)}
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

          {/* Modèle */}
          <Text style={styles.label}>Modèle</Text>
          <TextInput
            style={styles.input}
            value={config.model}
            onChangeText={(v) => setConfig((c) => ({ ...c, model: v }))}
            placeholder="Nom du modèle"
            placeholderTextColor={colors.text.secondary}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Suggestions de modèles */}
          {suggestedModels.length > 0 && (
            <View style={styles.modelSuggestions}>
              {suggestedModels.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.modelChip, config.model === m && styles.modelChipActive]}
                  onPress={() => setConfig((c) => ({ ...c, model: m }))}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.modelChipText,
                      config.model === m && styles.modelChipTextActive,
                    ]}
                  >
                    {m}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Résultat du test */}
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
                color={testResult.ok ? '#27ae60' : '#e74c3c'}
              />
              <Text style={styles.testResultText}>{testResult.message}</Text>
            </View>
          )}

          {/* Boutons */}
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
            >
              <Text style={styles.buttonPrimaryText}>Sauvegarder</Text>
            </TouchableOpacity>
          </View>
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 24,
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
    backgroundColor: '#d5f5e3',
  },
  testResultError: {
    backgroundColor: '#fdecea',
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
});

export default SettingsScreen;
