import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../context/AuthContext';
import { VoiceOrb } from '../../components/VoiceOrb';
import { TranscriptSheet } from '../../components/TranscriptSheet';
import { LiveTranscriptItem } from '../../types';

export default function LiveSessionScreen() {
  const params = useLocalSearchParams<{
    type?: string;
    targetMinutes?: string;
    nativeLanguage?: string;
    targetLanguage?: string;
    topic?: string;
  }>();

  const { fetchWithAuth, profile } = useAuth();
  const router = useRouter();

  const sessionType = (params.type || 'practice') as 'placement' | 'practice';
  const targetMinutes = parseInt(params.targetMinutes || '10', 10);
  const nativeLanguage = params.nativeLanguage || profile?.nativeLanguage || 'English';
  const targetLanguage = params.targetLanguage || profile?.targetLanguage || 'Spanish';
  const topic = params.topic || (sessionType === 'placement' ? 'ACTFL Placement Interview' : 'Everyday life');

  const [status, setStatus] = useState<'connecting' | 'connected' | 'finishing' | 'finished' | 'error'>('connecting');
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [speechRate, setSpeechRate] = useState(profile?.preferences?.speechRate ?? 1.0);
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  const [micVolume] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [transcript, setTranscript] = useState<LiveTranscriptItem[]>([]);
  const [sessionAnalysis, setSessionAnalysis] = useState<any | null>(null);
  const [isTranscriptSheetOpen, setIsTranscriptSheetOpen] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const toolEventsRef = useRef<any[]>([]);

  // Append transcript fragment
  const appendTranscript = useCallback((speaker: 'learner' | 'agent', text: string) => {
    if (!text) return;
    setTranscript((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.speaker === speaker) {
        const copy = [...prev];
        copy[copy.length - 1] = {
          ...last,
          text: last.text + text,
          at: new Date(),
        };
        return copy;
      }
      return [
        ...prev,
        {
          id: `${speaker}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          speaker,
          text,
          at: new Date(),
        },
      ];
    });
  }, []);

  // Initialize and open live session
  const initSession = useCallback(async () => {
    try {
      setStatus('connecting');
      setError(null);
      setTranscript([]);
      setSessionAnalysis(null);
      toolEventsRef.current = [];
      setElapsedSeconds(0);

      // Step 1: Start session on backend
      const res = await fetchWithAuth('/api/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: sessionType,
          targetMinutes,
          nativeLanguage,
          targetLanguage,
          topic,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to start session on backend');
      }

      const sessionData = await res.json();
      sessionIdRef.current = sessionData.sessionId;

      // Step 2: Open WebSocket directly to Gemini Live
      const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained?access_token=${sessionData.token}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Mobile Live WebSocket opened!');
        setStatus('connected');

        // Send setup message
        const setupMsg = {
          setup: {
            model: 'models/gemini-3.8-live',
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Aoede' },
                },
              },
            },
            systemInstruction: {
              parts: [{ text: sessionData.systemInstruction }],
            },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
          },
        };
        ws.send(JSON.stringify(setupMsg));

        // Start elapsed timer
        timerRef.current = setInterval(() => {
          setElapsedSeconds((s) => s + 1);
        }, 1000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Handle setup complete -> trigger tutor to speak first
          if (data.setupComplete) {
            console.log('Setup complete, prompting tutor to speak first...');
            const triggerMsg = {
              clientContent: {
                turns: [
                  {
                    role: 'user',
                    parts: [
                      {
                        text: `Please begin the conversation right now. Greet me warmly in ${targetLanguage} and ask your opening question!`,
                      },
                    ],
                  },
                ],
                turnComplete: true,
              },
            };
            ws.send(JSON.stringify(triggerMsg));
          }

          // Handle server content & transcriptions
          if (data.serverContent) {
            const sc = data.serverContent;
            if (sc.inputTranscription?.text) {
              appendTranscript('learner', sc.inputTranscription.text);
            }
            if (sc.outputTranscription?.text) {
              appendTranscript('agent', sc.outputTranscription.text);
            }
            if (sc.modelTurn) {
              setAgentSpeaking(true);
            }
            if (sc.turnComplete) {
              setAgentSpeaking(false);
            }
            if (sc.interrupted) {
              setAgentSpeaking(false);
            }
          }

          // Handle tool calls
          if (data.toolCall?.functionCalls) {
            for (const call of data.toolCall.functionCalls) {
              toolEventsRef.current.push({
                name: call.name,
                args: call.args,
                id: call.id,
                at: new Date().toISOString(),
              });
            }

            ws.send(
              JSON.stringify({
                toolResponse: {
                  functionResponses: data.toolCall.functionCalls.map((fc: any) => ({
                    id: fc.id,
                    response: { output: { success: true } },
                  })),
                },
              })
            );
          }
        } catch (msgErr) {
          console.log('Message parse note:', msgErr);
        }
      };

      ws.onerror = (e) => {
        console.log('WebSocket error:', e);
        setError('Voice connection interrupted.');
        setStatus('error');
      };

      ws.onclose = (e) => {
        console.log('WebSocket closed code:', e.code);
        if (timerRef.current) clearInterval(timerRef.current);
      };
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not establish voice loop.');
      setStatus('error');
    }
  }, [sessionType, targetMinutes, nativeLanguage, targetLanguage, topic, fetchWithAuth, appendTranscript]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!ignore) {
        await initSession();
      }
    })();
    return () => {
      ignore = true;
      if (timerRef.current) clearInterval(timerRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [initSession]);

  const handleFinishSession = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStatus('finishing');

    if (timerRef.current) clearInterval(timerRef.current);
    if (wsRef.current) wsRef.current.close();

    const currentSessionId = sessionIdRef.current;
    if (currentSessionId) {
      try {
        const res = await fetchWithAuth(`/api/sessions/${currentSessionId}/finish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transcript: transcript.map((t) => ({
              speaker: t.speaker,
              text: t.text,
              lang: 'auto',
              at: t.at.toISOString(),
            })),
            toolEvents: toolEventsRef.current,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.analysis) {
            setSessionAnalysis(data.analysis);
          }
        }
      } catch (err) {
        console.log('Finish session error:', err);
      }
    }

    setStatus('finished');
  };

  const handleInterrupt = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAgentSpeaking(false);
  };

  const handleToggleMute = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsMuted((m) => !m);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Render Finished Summary Screen
  if (status === 'finished') {
    const isPlacement = sessionType === 'placement';
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.summaryContent} showsVerticalScrollIndicator={false}>
          <View style={styles.summaryHeader}>
            <View style={[styles.summaryIconBadge, isPlacement && styles.summaryIconBadgePlacement]}>
              <Ionicons
                name={isPlacement ? 'ribbon' : 'checkmark-circle'}
                size={36}
                color={isPlacement ? '#f59e0b' : '#10b981'}
              />
            </View>
            <Text style={styles.summaryTitle}>
              {isPlacement ? 'Placement Assessment Complete!' : 'Session Complete!'}
            </Text>
            <Text style={styles.summarySubtitle}>
              {isPlacement
                ? `Proficiency evaluated across ACTFL task ladder for ${targetLanguage}.`
                : `Spoken practice in ${targetLanguage} saved to memory.`}
            </Text>
          </View>

          {/* Placement Result Banner */}
          {isPlacement && sessionAnalysis?.level && (
            <View style={styles.placementResultBox}>
              <Text style={styles.placementResultTag}>Assigned CEFR Level</Text>
              <Text style={styles.placementResultLevel}>Level {sessionAnalysis.level.overall}</Text>
              <Text style={styles.placementResultDetails}>
                Speaking: {sessionAnalysis.level.speaking} • Listening: {sessionAnalysis.level.listening}
              </Text>
              <View style={styles.floorCeilingRow}>
                <Text style={styles.floorText}>Floor: {sessionAnalysis.floorLevel}</Text>
                <Text style={styles.ceilingText}>Ceiling: {sessionAnalysis.ceilingLevel}</Text>
              </View>
            </View>
          )}

          {/* Stats Grid */}
          <View style={styles.summaryStatsRow}>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatLabel}>Duration</Text>
              <Text style={styles.summaryStatValue}>{formatTimer(elapsedSeconds)}</Text>
            </View>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatLabel}>Spoken Turns</Text>
              <Text style={styles.summaryStatValue}>{transcript.length}</Text>
            </View>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatLabel}>
                {isPlacement ? 'Starter Items' : 'Reviewed'}
              </Text>
              <Text style={[styles.summaryStatValue, { color: '#38bdf8' }]}>
                {isPlacement
                  ? sessionAnalysis?.starterItems?.length || 0
                  : sessionAnalysis?.itemsReviewed?.length || 0}
              </Text>
            </View>
          </View>

          {/* Feedback Insights */}
          {sessionAnalysis?.summary && (
            <View style={styles.insightsCard}>
              <View style={styles.insightHeader}>
                <Ionicons name="sparkles" size={16} color="#10b981" />
                <Text style={styles.insightHeaderTitle}>AI Tutor Insights</Text>
              </View>
              <View style={styles.insightBlock}>
                <Text style={styles.insightBlockTitle}>✓ What Went Well</Text>
                <Text style={styles.insightBlockText}>
                  {sessionAnalysis.summary.whatWentWell || sessionAnalysis.summary.strengths}
                </Text>
              </View>
              <View style={[styles.insightBlock, { borderLeftColor: '#38bdf8' }]}>
                <Text style={[styles.insightBlockTitle, { color: '#38bdf8' }]}>🎯 Next Focus</Text>
                <Text style={styles.insightBlockText}>
                  {sessionAnalysis.summary.nextFocus || sessionAnalysis.summary.nextSteps}
                </Text>
              </View>
            </View>
          )}

          {/* Return button */}
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)')}
            style={styles.doneButton}
            activeOpacity={0.8}
          >
            <Text style={styles.doneButtonText}>Return to Dashboard</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Session Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Text style={styles.topBarTargetLang}>{targetLanguage}</Text>
          <View style={styles.topBarPill}>
            <Text style={styles.topBarPillText}>
              {sessionType === 'placement' ? 'OPI Placement' : 'Practice'}
            </Text>
          </View>
        </View>

        <View style={styles.timerBadge}>
          <Ionicons name="time-outline" size={14} color="#10b981" />
          <Text style={styles.timerText}>
            {formatTimer(elapsedSeconds)} / {formatTimer(targetMinutes * 60)}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            Alert.alert('Exit Session?', 'Are you sure you want to finish this session?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Finish & Save', onPress: handleFinishSession },
            ]);
          }}
          style={styles.closeIcon}
        >
          <Ionicons name="close" size={22} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      {/* Main Center Area: Voice Orb & Status */}
      <View style={styles.centerArea}>
        <VoiceOrb agentSpeaking={agentSpeaking} isMuted={isMuted} micVolume={micVolume} />

        <Text style={styles.statusTitle}>
          {status === 'connecting'
            ? 'Opening Voice Channel...'
            : agentSpeaking
            ? 'Language Buddy Speaking...'
            : isMuted
            ? 'Microphone Muted'
            : micVolume > 0.05
            ? 'Listening to you...'
            : 'Your Turn to Speak'}
        </Text>

        <Text style={styles.topicSubtitle} numberOfLines={2}>
          {topic}
        </Text>

        {agentSpeaking && (
          <TouchableOpacity onPress={handleInterrupt} style={styles.interruptPill} activeOpacity={0.8}>
            <Ionicons name="hand-right-outline" size={14} color="#f59e0b" />
            <Text style={styles.interruptText}>Interrupt & Speak</Text>
          </TouchableOpacity>
        )}

        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color="#fb7185" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>

      {/* Slide-up Live Transcript Sheet */}
      <TranscriptSheet
        transcript={transcript}
        isOpen={isTranscriptSheetOpen}
        onToggle={() => setIsTranscriptSheetOpen((open) => !open)}
      />

      {/* Bottom Controls Bar */}
      <View style={styles.bottomControls}>
        <TouchableOpacity
          onPress={handleToggleMute}
          style={[styles.controlButton, isMuted && styles.controlButtonActive]}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isMuted ? 'mic-off' : 'mic'}
            size={22}
            color={isMuted ? '#ffffff' : '#f8fafc'}
          />
        </TouchableOpacity>

        {/* Speed button */}
        <TouchableOpacity
          onPress={() => {
            const nextRate = speechRate === 1.0 ? 0.8 : speechRate === 0.8 ? 1.2 : 1.0;
            setSpeechRate(nextRate);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          style={styles.speedButton}
        >
          <Text style={styles.speedButtonText}>{speechRate}x</Text>
        </TouchableOpacity>

        {/* End Session Button */}
        <TouchableOpacity
          onPress={handleFinishSession}
          disabled={status === 'finishing'}
          style={styles.endButton}
          activeOpacity={0.8}
        >
          {status === 'finishing' ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Ionicons name="call" size={18} color="#ffffff" style={{ transform: [{ rotate: '135deg' }] }} />
              <Text style={styles.endButtonText}>End</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#0f172a',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topBarTargetLang: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  topBarPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  topBarPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#34d399',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  timerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f8fafc',
    fontFamily: 'Menlo',
  },
  closeIcon: {
    padding: 6,
  },
  centerArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  statusTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 20,
    textAlign: 'center',
  },
  topicSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'center',
    maxWidth: '85%',
  },
  interruptPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginTop: 14,
  },
  interruptText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fbbf24',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderRadius: 12,
    padding: 10,
    marginTop: 12,
    gap: 6,
  },
  errorText: {
    fontSize: 11,
    color: '#fda4af',
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  controlButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonActive: {
    backgroundColor: '#e11d48',
  },
  speedButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  speedButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#34d399',
  },
  endButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e11d48',
    paddingHorizontal: 20,
    height: 52,
    borderRadius: 26,
    gap: 6,
  },
  endButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  summaryContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },
  summaryHeader: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  summaryIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  summaryIconBadgePlacement: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
  },
  summarySubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: '90%',
  },
  placementResultBox: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  placementResultTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fbbf24',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  placementResultLevel: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    marginVertical: 4,
  },
  placementResultDetails: {
    fontSize: 12,
    color: '#cbd5e1',
  },
  floorCeilingRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  floorText: {
    fontSize: 12,
    color: '#34d399',
    fontWeight: '700',
  },
  ceilingText: {
    fontSize: 12,
    color: '#f43f5e',
    fontWeight: '700',
  },
  summaryStatsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  summaryStatItem: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  summaryStatLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  summaryStatValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10b981',
    marginTop: 2,
  },
  insightsCard: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 12,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  insightHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f8fafc',
  },
  insightBlock: {
    backgroundColor: '#020617',
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
  },
  insightBlockTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#34d399',
    marginBottom: 4,
  },
  insightBlockText: {
    fontSize: 12,
    color: '#cbd5e1',
    lineHeight: 17,
  },
  doneButton: {
    backgroundColor: '#10b981',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  doneButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#020617',
  },
});
