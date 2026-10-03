import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { getApiBaseUrl, setApiBaseUrl } from '../../constants/api';

const COMMON_INTERESTS = [
  'Travel & Sightseeing',
  'Food & Cooking',
  'Music & Concerts',
  'Movies & Cinema',
  'Technology & AI',
  'Literature & Books',
  'Business & Career',
  'Fitness & Sports',
  'History & Culture',
];

export default function SettingsScreen() {
  const { user, profile, updateProfile, logout } = useAuth();
  const router = useRouter();

  const [speechRate, setSpeechRate] = useState<number>(profile?.preferences?.speechRate ?? 1.0);
  const [nativeLangSupport, setNativeLangSupport] = useState<'low' | 'med' | 'high'>(
    profile?.preferences?.nativeLangSupport ?? 'med'
  );
  const [interests, setInterests] = useState<string[]>(profile?.interests ?? []);
  const [customInterest, setCustomInterest] = useState('');
  const [apiUrl, setApiUrlState] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getApiBaseUrl().then(setApiUrlState);
  }, []);

  const toggleInterest = (item: string) => {
    setInterests((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const addCustomInterest = () => {
    const trimmed = customInterest.trim();
    if (trimmed && !interests.includes(trimmed)) {
      setInterests((prev) => [...prev, trimmed]);
      setCustomInterest('');
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      if (apiUrl.trim()) {
        await setApiBaseUrl(apiUrl.trim());
      }

      await updateProfile({
        interests,
        preferences: {
          speechRate,
          nativeLangSupport,
          defaultSessionMinutes: profile?.preferences?.defaultSessionMinutes ?? 10,
        },
      });

      Alert.alert('Saved', 'Your preferences have been updated.');
    } catch {
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Account Info */}
      <View style={styles.card}>
        <View style={styles.accountRow}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={20} color="#10b981" />
          </View>
          <View style={styles.accountDetails}>
            <Text style={styles.emailText}>{user?.email}</Text>
            <Text style={styles.accountSubText}>Level {profile?.level?.overall || 'A1'}</Text>
          </View>
        </View>
      </View>

      {/* Speech Rate Selection */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="speedometer-outline" size={18} color="#10b981" />
          <Text style={styles.cardTitle}>Tutor Speech Rate ({speechRate}x)</Text>
        </View>
        <Text style={styles.cardDesc}>
          Baseline speech rate for the AI voice tutor.
        </Text>
        <View style={styles.speedRow}>
          {[0.8, 0.9, 1.0, 1.1, 1.2].map((rate) => (
            <TouchableOpacity
              key={rate}
              onPress={() => setSpeechRate(rate)}
              style={[
                styles.speedPill,
                Math.abs(speechRate - rate) < 0.04 && styles.speedPillActive,
              ]}
            >
              <Text
                style={[
                  styles.speedPillText,
                  Math.abs(speechRate - rate) < 0.04 && styles.speedPillTextActive,
                ]}
              >
                {rate}x
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Native Language Support Level */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="options-outline" size={18} color="#10b981" />
          <Text style={styles.cardTitle}>Native Support Level</Text>
        </View>
        <Text style={styles.cardDesc}>
          How much native language scaffolding the tutor provides.
        </Text>
        <View style={styles.supportRow}>
          {(['low', 'med', 'high'] as const).map((level) => (
            <TouchableOpacity
              key={level}
              onPress={() => setNativeLangSupport(level)}
              style={[
                styles.supportPill,
                nativeLangSupport === level && styles.supportPillActive,
              ]}
            >
              <Text
                style={[
                  styles.supportText,
                  nativeLangSupport === level && styles.supportTextActive,
                ]}
              >
                {level.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Conversation Interests */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="heart-outline" size={18} color="#f43f5e" />
          <Text style={styles.cardTitle}>Conversation Interests</Text>
        </View>
        <Text style={styles.cardDesc}>
          Used by the AI Planner to craft personalized conversation topics.
        </Text>

        <View style={styles.interestsWrap}>
          {COMMON_INTERESTS.map((item) => {
            const isSelected = interests.includes(item);
            return (
              <TouchableOpacity
                key={item}
                onPress={() => toggleInterest(item)}
                style={[styles.interestChip, isSelected && styles.interestChipActive]}
              >
                <Text style={[styles.interestChipText, isSelected && styles.interestChipTextActive]}>
                  {isSelected ? '✓ ' : '+ '}
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.addInterestRow}>
          <TextInput
            style={styles.addInterestInput}
            placeholder="Custom interest..."
            placeholderTextColor="#64748b"
            value={customInterest}
            onChangeText={setCustomInterest}
          />
          <TouchableOpacity onPress={addCustomInterest} style={styles.addInterestButton}>
            <Text style={styles.addInterestButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Backend API Host Configuration */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="server-outline" size={18} color="#38bdf8" />
          <Text style={styles.cardTitle}>Backend Server Address</Text>
        </View>
        <Text style={styles.cardDesc}>
          Point this to your laptop’s local IP (e.g. http://192.168.1.50:8081) when running on a physical phone.
        </Text>
        <TextInput
          style={styles.apiInput}
          value={apiUrl}
          onChangeText={setApiUrlState}
          placeholder="http://192.168.x.x:8081"
          placeholderTextColor="#64748b"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Save Button */}
      <TouchableOpacity
        onPress={handleSaveSettings}
        disabled={isSaving}
        style={styles.saveButton}
        activeOpacity={0.8}
      >
        <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save Settings'}</Text>
      </TouchableOpacity>

      {/* Logout Button */}
      <TouchableOpacity onPress={handleLogout} style={styles.logoutButton} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={18} color="#f43f5e" />
        <Text style={styles.logoutButtonText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountDetails: {
    flex: 1,
  },
  emailText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  accountSubText: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  cardDesc: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 12,
    lineHeight: 16,
  },
  speedRow: {
    flexDirection: 'row',
    gap: 8,
  },
  speedPill: {
    flex: 1,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  speedPillActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  speedPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  speedPillTextActive: {
    color: '#020617',
    fontWeight: '800',
  },
  supportRow: {
    flexDirection: 'row',
    gap: 8,
  },
  supportPill: {
    flex: 1,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  supportPillActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  supportText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  supportTextActive: {
    color: '#020617',
    fontWeight: '800',
  },
  interestsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  interestChip: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  interestChipActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10b981',
  },
  interestChipText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  interestChipTextActive: {
    color: '#34d399',
  },
  addInterestRow: {
    flexDirection: 'row',
    gap: 8,
  },
  addInterestInput: {
    flex: 1,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: '#f8fafc',
  },
  addInterestButton: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  addInterestButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#34d399',
  },
  apiInput: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#38bdf8',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  saveButton: {
    backgroundColor: '#10b981',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#020617',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  logoutButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f43f5e',
  },
});
