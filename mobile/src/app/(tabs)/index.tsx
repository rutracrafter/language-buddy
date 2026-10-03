import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { DashboardMetrics } from '../../types';
import { LanguagePickerModal } from '../../components/LanguagePickerModal';

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

export default function DashboardScreen() {
  const { profile, fetchWithAuth } = useAuth();
  const router = useRouter();

  const [sessionMinutes, setSessionMinutes] = useState(
    () => profile?.preferences?.defaultSessionMinutes || 10
  );
  const [nativeLanguage, setNativeLanguage] = useState(
    () => profile?.nativeLanguage || 'English'
  );
  const [targetLanguage, setTargetLanguage] = useState(
    () => profile?.targetLanguage || 'Spanish'
  );
  const [customTopic, setCustomTopic] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [metrics, setMetrics] = useState<DashboardMetrics>({
    profile: null,
    stats: { totalItems: 0, recognitionItems: 0, productionItems: 0, totalReviews: 0 },
    coveredTopics: [],
    openNotes: [],
  });

  const [pickerModal, setPickerModal] = useState<{
    visible: boolean;
    title: string;
    type: 'native' | 'target';
  }>({
    visible: false,
    title: '',
    type: 'native',
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await fetchWithAuth('/api/profile/dashboard');
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch {
      // ignore
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await fetchWithAuth('/api/profile/dashboard');
        if (res.ok && !ignore) {
          const data = await res.json();
          setMetrics(data);
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      ignore = true;
    };
  }, [fetchWithAuth]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchDashboardData();
    setIsRefreshing(false);
  };

  const handleStartSession = (type: 'placement' | 'practice') => {
    router.push({
      pathname: '/session/live',
      params: {
        type,
        targetMinutes: type === 'placement' ? '8' : String(sessionMinutes),
        nativeLanguage,
        targetLanguage,
        topic:
          type === 'placement'
            ? 'ACTFL Oral Proficiency Placement Interview'
            : customTopic.trim() || undefined,
      },
    });
  };

  const currentLevel = profile?.level?.overall || 'A1';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#10b981" />}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Level & Status Bar */}
      <View style={styles.levelCard}>
        <View style={styles.levelBadge}>
          <Ionicons name="ribbon-outline" size={24} color="#10b981" />
        </View>
        <View style={styles.levelInfo}>
          <Text style={styles.levelLabel}>Current CEFR Level</Text>
          <View style={styles.levelRow}>
            <Text style={styles.levelText}>{currentLevel}</Text>
            <Text style={styles.confidenceText}>
              ({Math.round((profile?.levelConfidence ?? 0.1) * 100)}% confidence)
            </Text>
          </View>
        </View>
        {profile?.placementCompletedAt ? (
          <TouchableOpacity
            onPress={() => handleStartSession('placement')}
            style={styles.retakeButton}
          >
            <Text style={styles.retakeText}>Retake OPI</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Placement Prompt if not completed */}
      {!profile?.placementCompletedAt && (
        <View style={styles.placementBanner}>
          <View style={styles.placementHeader}>
            <View style={styles.placementTag}>
              <Ionicons name="sparkles" size={12} color="#f59e0b" />
              <Text style={styles.placementTagText}>Recommended First Step</Text>
            </View>
          </View>
          <Text style={styles.placementTitle}>Take the 8-Min Placement Interview</Text>
          <Text style={styles.placementDesc}>
            Adaptive ACTFL OPI conversation that checks your floor and ceiling levels in {targetLanguage}.
          </Text>
          <TouchableOpacity
            onPress={() => handleStartSession('placement')}
            style={styles.placementButton}
            activeOpacity={0.8}
          >
            <Text style={styles.placementButtonText}>Start Placement Interview</Text>
            <Ionicons name="arrow-forward" size={14} color="#020617" />
          </TouchableOpacity>
        </View>
      )}

      {/* Main Practice Launcher Card */}
      <View style={styles.launcherCard}>
        <View style={styles.launcherHeader}>
          <Ionicons name="mic-outline" size={18} color="#10b981" />
          <Text style={styles.launcherTag}>Ready to Speak</Text>
        </View>
        <Text style={styles.launcherTitle}>Speak {targetLanguage} with your AI Tutor</Text>
        <Text style={styles.launcherSubtitle}>
          Adapts dynamically to your speaking speed and weak spots.
        </Text>

        {/* Custom topic input */}
        <TextInput
          style={styles.topicInput}
          placeholder="Topic (optional, e.g. Ordering tapas, weekend trips)"
          placeholderTextColor="#64748b"
          value={customTopic}
          onChangeText={setCustomTopic}
        />

        {/* Duration selector */}
        <View style={styles.durationRow}>
          <Text style={styles.durationLabel}>Length:</Text>
          {[5, 10, 15, 20].map((mins) => (
            <TouchableOpacity
              key={mins}
              onPress={() => setSessionMinutes(mins)}
              style={[
                styles.durationPill,
                sessionMinutes === mins && styles.durationPillActive,
              ]}
            >
              <Text
                style={[
                  styles.durationText,
                  sessionMinutes === mins && styles.durationTextActive,
                ]}
              >
                {mins}m
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Start button */}
        <TouchableOpacity
          onPress={() => handleStartSession('practice')}
          style={styles.startButton}
          activeOpacity={0.8}
        >
          <Ionicons name="mic" size={18} color="#020617" />
          <Text style={styles.startButtonText}>Start {sessionMinutes}-Minute Session</Text>
        </TouchableOpacity>
      </View>

      {/* Language Selection Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="swap-horizontal-outline" size={18} color="#10b981" />
          <Text style={styles.cardTitle}>Language Settings</Text>
        </View>

        <View style={styles.languagePairRow}>
          <TouchableOpacity
            onPress={() =>
              setPickerModal({
                visible: true,
                title: 'Native / Support Language',
                type: 'native',
              })
            }
            style={styles.languageBox}
          >
            <Text style={styles.languageBoxLabel}>Native (Support)</Text>
            <View style={styles.langValueRow}>
              <Text style={styles.languageBoxValue}>{nativeLanguage}</Text>
              <Ionicons name="chevron-down" size={14} color="#94a3b8" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              setPickerModal({
                visible: true,
                title: 'Target Practice Language',
                type: 'target',
              })
            }
            style={styles.languageBox}
          >
            <Text style={styles.languageBoxLabel}>Target Language</Text>
            <View style={styles.langValueRow}>
              <Text style={[styles.languageBoxValue, { color: '#34d399' }]}>
                {targetLanguage}
              </Text>
              <Ionicons name="chevron-down" size={14} color="#94a3b8" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Memory Bank (FSRS) Stats */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="albums-outline" size={18} color="#10b981" />
          <Text style={styles.cardTitle}>Memory Bank (FSRS)</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{metrics.stats.totalItems}</Text>
            <Text style={styles.statLabel}>Total Words</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{metrics.stats.recognitionItems}</Text>
            <Text style={styles.statLabel}>Recognition</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: '#34d399' }]}>
              {metrics.stats.productionItems}
            </Text>
            <Text style={styles.statLabel}>Production</Text>
          </View>
        </View>
      </View>

      {/* Covered Topics */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="layers-outline" size={18} color="#10b981" />
          <Text style={styles.cardTitle}>Topics Practiced</Text>
        </View>

        {metrics.coveredTopics.length === 0 ? (
          <Text style={styles.emptyNote}>Topics will accumulate as you hold conversations.</Text>
        ) : (
          <View style={styles.topicsList}>
            {metrics.coveredTopics.map((top, i) => (
              <View key={top._id || i} style={styles.topicRow}>
                <View>
                  <Text style={styles.topicName}>{top.name}</Text>
                  <Text style={styles.topicSessions}>
                    {top.sessionsCount} session{top.sessionsCount === 1 ? '' : 's'}
                  </Text>
                </View>
                <View style={styles.depthBadge}>
                  <Text style={styles.depthText}>Depth {top.depth}/3</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Weak Spots & Notes */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="bulb-outline" size={18} color="#10b981" />
          <Text style={styles.cardTitle}>Focus Areas & Feedback</Text>
        </View>

        {metrics.openNotes.length === 0 ? (
          <Text style={styles.emptyNote}>No active error patterns logged yet.</Text>
        ) : (
          <View style={styles.notesList}>
            {metrics.openNotes.map((note, i) => (
              <View key={note._id || i} style={styles.noteItem}>
                <Text style={styles.noteKind}>{note.kind.replace('_', ' ')}</Text>
                <Text style={styles.noteText}>{note.text}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Language Picker Modal */}
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
  levelCard: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  levelBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  levelInfo: {
    flex: 1,
  },
  levelLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 2,
  },
  levelText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  confidenceText: {
    fontSize: 11,
    color: '#64748b',
  },
  retakeButton: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  retakeText: {
    fontSize: 11,
    color: '#fbbf24',
    fontWeight: '700',
  },
  placementBanner: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderRadius: 20,
    padding: 18,
  },
  placementHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  placementTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  placementTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fbbf24',
    textTransform: 'uppercase',
  },
  placementTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  placementDesc: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 17,
    marginBottom: 14,
  },
  placementButton: {
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  placementButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#020617',
  },
  launcherCard: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 24,
    padding: 20,
  },
  launcherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  launcherTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10b981',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  launcherTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  launcherSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
    marginBottom: 14,
  },
  topicInput: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    color: '#f8fafc',
    marginBottom: 14,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  durationLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginRight: 4,
  },
  durationPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1e293b',
  },
  durationPillActive: {
    backgroundColor: '#10b981',
  },
  durationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  durationTextActive: {
    color: '#020617',
    fontWeight: '800',
  },
  startButton: {
    backgroundColor: '#10b981',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  startButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#020617',
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  languagePairRow: {
    flexDirection: 'row',
    gap: 10,
  },
  languageBox: {
    flex: 1,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 10,
  },
  languageBoxLabel: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 4,
  },
  langValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  languageBoxValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f8fafc',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  statLabel: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  emptyNote: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    paddingVertical: 12,
  },
  topicsList: {
    gap: 8,
  },
  topicRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#020617',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  topicName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f1f5f9',
    textTransform: 'capitalize',
  },
  topicSessions: {
    fontSize: 10,
    color: '#64748b',
  },
  depthBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  depthText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#34d399',
  },
  notesList: {
    gap: 8,
  },
  noteItem: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: 10,
    padding: 10,
  },
  noteKind: {
    fontSize: 9,
    fontWeight: '800',
    color: '#f59e0b',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  noteText: {
    fontSize: 11,
    color: '#cbd5e1',
    lineHeight: 16,
  },
});
