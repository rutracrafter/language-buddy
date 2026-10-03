import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function HistoryScreen() {
  const { fetchWithAuth } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetchWithAuth('/api/sessions/recent');
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (err) {
      console.log('Failed to fetch history:', err);
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await fetchWithAuth('/api/sessions/recent');
        if (res.ok && !ignore) {
          const data = await res.json();
          setSessions(data.sessions || []);
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
    await fetchHistory();
    setIsRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#10b981" />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Spoken Sessions</Text>
        <Text style={styles.subtitle}>Review your transcripts & AI feedback</Text>
      </View>

      {sessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyBadge}>
            <Ionicons name="chatbubbles-outline" size={32} color="#64748b" />
          </View>
          <Text style={styles.emptyTitle}>No Recorded Sessions Yet</Text>
          <Text style={styles.emptySubtitle}>Start your first voice conversation on the Dashboard!</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {sessions.map((s) => {
            const durationSecs = s.endedAt
              ? Math.round((new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime()) / 1000)
              : s.targetMinutes * 60;
            const mins = Math.floor(durationSecs / 60);
            const secs = durationSecs % 60;
            const isSelected = selectedSession?._id === s._id;

            return (
              <TouchableOpacity
                key={s._id}
                onPress={() => setSelectedSession(isSelected ? null : s)}
                style={[styles.sessionCard, isSelected && styles.sessionCardActive]}
                activeOpacity={0.8}
              >
                <View style={styles.cardTopRow}>
                  <View style={styles.cardHeaderLeft}>
                    <Text style={styles.targetLangText}>{s.languages?.target || 'Spanish'}</Text>
                    <View style={styles.sessionTypeBadge}>
                      <Text style={styles.sessionTypeText}>
                        {s.type === 'placement' ? 'Placement OPI' : 'Practice'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.durationText}>
                    {mins}m {secs}s
                  </Text>
                </View>

                <Text style={styles.topicText} numberOfLines={1}>
                  {s.plan?.topic || 'Everyday conversation'}
                </Text>

                <View style={styles.cardBottomRow}>
                  <Text style={styles.dateText}>
                    {new Date(s.startedAt).toLocaleDateString()} • {new Date(s.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <Text style={styles.turnsText}>{s.transcript?.length || 0} turns</Text>
                </View>

                {/* Expanded Details */}
                {isSelected && (
                  <View style={styles.detailsContainer}>
                    {s.summary && (
                      <View style={styles.summaryBox}>
                        <Text style={styles.summaryLabel}>AI Feedback:</Text>
                        <Text style={styles.summaryText}>
                          {s.summary.whatWentWell || s.summary.strengths || s.summary.detailedFeedback}
                        </Text>
                      </View>
                    )}

                    <Text style={styles.transcriptHeader}>Transcript Preview:</Text>
                    <View style={styles.transcriptPreview}>
                      {(s.transcript || []).slice(0, 6).map((t: any, idx: number) => (
                        <Text key={idx} style={styles.previewLine}>
                          <Text style={{ fontWeight: '700', color: t.speaker === 'agent' ? '#34d399' : '#38bdf8' }}>
                            {t.speaker === 'agent' ? 'Tutor: ' : 'You: '}
                          </Text>
                          {t.text}
                        </Text>
                      ))}
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
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
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  list: {
    gap: 12,
  },
  sessionCard: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  sessionCardActive: {
    borderColor: '#10b981',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  targetLangText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#f1f5f9',
  },
  sessionTypeBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  sessionTypeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#34d399',
  },
  durationText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#34d399',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  topicText: {
    fontSize: 13,
    color: '#cbd5e1',
    fontWeight: '500',
    marginBottom: 8,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 11,
    color: '#64748b',
  },
  turnsText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  detailsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  summaryBox: {
    backgroundColor: '#020617',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#34d399',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  summaryText: {
    fontSize: 11,
    color: '#cbd5e1',
    lineHeight: 16,
  },
  transcriptHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 6,
  },
  transcriptPreview: {
    backgroundColor: '#020617',
    padding: 10,
    borderRadius: 10,
    gap: 6,
  },
  previewLine: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 16,
  },
});
