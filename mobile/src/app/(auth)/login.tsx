import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LanguagePickerModal } from '../../components/LanguagePickerModal';
import { getApiBaseUrl, setApiBaseUrl } from '../../constants/api';

const COMMON_LANGUAGES = [
  'English',
  'Spanish',
  'Japanese',
  'French',
  'German',
  'Italian',
  'Portuguese',
  'Chinese (Mandarin)',
  'Korean',
  'Russian',
  'Arabic',
];

export default function LoginScreen() {
  const { login, signup } = useAuth();
  const router = useRouter();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nativeLanguage, setNativeLanguage] = useState('English');
  const [targetLanguage, setTargetLanguage] = useState('Spanish');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState('');
  const [isEditingServer, setIsEditingServer] = useState(false);

  useEffect(() => {
    getApiBaseUrl().then(setServerUrl);
  }, []);

  const handleSaveServer = async () => {
    if (serverUrl.trim()) {
      await setApiBaseUrl(serverUrl.trim());
      setIsEditingServer(false);
    }
  };

  const [pickerModal, setPickerModal] = useState<{
    visible: boolean;
    title: string;
    type: 'native' | 'target';
  }>({
    visible: false,
    title: '',
    type: 'native',
  });

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      setError('Please fill in all fields');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      if (isSignUp) {
        if (nativeLanguage.trim().toLowerCase() === targetLanguage.trim().toLowerCase()) {
          throw new Error('Native and target languages must be different.');
        }
        await signup(email, password, nativeLanguage, targetLanguage);
      } else {
        await login(email, password);
      }
      router.replace('/(tabs)');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Ionicons name="headset" size={32} color="#020617" />
          </View>
          <Text style={styles.title}>Language Buddy</Text>
          <Text style={styles.subtitle}>Speaking & listening first with AI</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          {/* Tab Switcher */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              onPress={() => {
                setIsSignUp(false);
                setError(null);
              }}
              style={[styles.tabButton, !isSignUp && styles.tabButtonActive]}
            >
              <Text style={[styles.tabText, !isSignUp && styles.tabTextActive]}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setIsSignUp(true);
                setError(null);
              }}
              style={[styles.tabButton, isSignUp && styles.tabButtonActive]}
            >
              <Text style={[styles.tabText, isSignUp && styles.tabTextActive]}>Create Account</Text>
            </TouchableOpacity>
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#fb7185" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Form Inputs */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#64748b"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {/* Language Selection on Sign Up */}
          {isSignUp && (
            <View style={styles.languagesSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="globe-outline" size={14} color="#10b981" />
                <Text style={styles.sectionTitle}>Language Pair</Text>
              </View>

              <View style={styles.languagePickersRow}>
                <TouchableOpacity
                  onPress={() =>
                    setPickerModal({
                      visible: true,
                      title: 'Select Support Language',
                      type: 'native',
                    })
                  }
                  style={styles.langSelector}
                >
                  <Text style={styles.langSubLabel}>Native / Support</Text>
                  <View style={styles.langValueRow}>
                    <Text style={styles.langValueText}>{nativeLanguage}</Text>
                    <Ionicons name="chevron-down" size={14} color="#94a3b8" />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() =>
                    setPickerModal({
                      visible: true,
                      title: 'Select Target Language',
                      type: 'target',
                    })
                  }
                  style={styles.langSelector}
                >
                  <Text style={styles.langSubLabel}>Target Language</Text>
                  <View style={styles.langValueRow}>
                    <Text style={[styles.langValueText, { color: '#34d399' }]}>
                      {targetLanguage}
                    </Text>
                    <Ionicons name="chevron-down" size={14} color="#94a3b8" />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting}
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#020617" />
            ) : (
              <View style={styles.submitRow}>
                <Text style={styles.submitText}>
                  {isSignUp ? 'Create Account & Begin' : 'Sign In'}
                </Text>
                <Ionicons name="arrow-forward" size={16} color="#020617" />
              </View>
            )}
          </TouchableOpacity>

          {/* Server Config Link */}
          <TouchableOpacity
            onPress={() => setIsEditingServer((e) => !e)}
            style={styles.serverRow}
          >
            <Ionicons name="server-outline" size={12} color="#64748b" />
            <Text style={styles.serverRowText} numberOfLines={1}>
              {serverUrl || 'Default server'} (edit)
            </Text>
          </TouchableOpacity>

          {isEditingServer && (
            <View style={styles.serverEditBox}>
              <Text style={styles.serverEditLabel}>Backend Server URL:</Text>
              <TextInput
                style={styles.serverInput}
                value={serverUrl}
                onChangeText={setServerUrl}
                placeholder="http://10.30.10.24:8088"
                placeholderTextColor="#64748b"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={handleSaveServer} style={styles.saveServerBtn}>
                <Text style={styles.saveServerText}>Save Server URL</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Language Picker Sheet */}
      <LanguagePickerModal
        visible={pickerModal.visible}
        title={pickerModal.title}
        selectedLanguage={pickerModal.type === 'native' ? nativeLanguage : targetLanguage}
        languages={COMMON_LANGUAGES}
        onSelect={(lang) => {
          if (pickerModal.type === 'native') setNativeLanguage(lang);
          else setTargetLanguage(lang);
        }}
        onClose={() => setPickerModal((p) => ({ ...p, visible: false }))}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    paddingBottom: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#10b981',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#34d399',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: '#fda4af',
    fontSize: 12,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#f8fafc',
  },
  languagesSection: {
    marginTop: 4,
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#34d399',
  },
  languagePickersRow: {
    flexDirection: 'row',
    gap: 10,
  },
  langSelector: {
    flex: 1,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 10,
  },
  langSubLabel: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 4,
  },
  langValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  langValueText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  submitButton: {
    backgroundColor: '#10b981',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#020617',
  },
  serverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    paddingVertical: 4,
  },
  serverRowText: {
    fontSize: 11,
    color: '#64748b',
  },
  serverEditBox: {
    marginTop: 10,
    backgroundColor: '#020617',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  serverEditLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 6,
  },
  serverInput: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: '#38bdf8',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 8,
  },
  saveServerBtn: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  saveServerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#34d399',
  },
});
