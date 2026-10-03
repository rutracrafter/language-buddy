import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LiveTranscriptItem } from '../types';

interface TranscriptSheetProps {
  transcript: LiveTranscriptItem[];
  isOpen: boolean;
  onToggle: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const TranscriptSheet: React.FC<TranscriptSheetProps> = ({
  transcript,
  isOpen,
  onToggle,
}) => {
  const scrollViewRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    if (isOpen) {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, [transcript, isOpen]);

  return (
    <View style={[styles.container, isOpen ? styles.containerOpen : styles.containerClosed]}>
      {/* Header / Grab Handle */}
      <TouchableOpacity onPress={onToggle} style={styles.handleContainer} activeOpacity={0.8}>
        <View style={styles.handleBar} />
        <View style={styles.headerRow}>
          <View style={styles.headerTitleRow}>
            <Ionicons name="chatbubbles-outline" size={16} color="#10b981" />
            <Text style={styles.headerTitle}>
              Live Transcript ({transcript.length} turns)
            </Text>
          </View>
          <Ionicons
            name={isOpen ? 'chevron-down' : 'chevron-up'}
            size={18}
            color="#94a3b8"
          />
        </View>
      </TouchableOpacity>

      {/* Transcript Messages List */}
      {isOpen && (
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {transcript.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Conversation will transcribe here live...</Text>
            </View>
          ) : (
            transcript.map((item) => {
              const isAgent = item.speaker === 'agent';
              return (
                <View
                  key={item.id}
                  style={[styles.turnContainer, isAgent ? styles.agentTurn : styles.learnerTurn]}
                >
                  <View style={styles.speakerLabelRow}>
                    <Text style={[styles.speakerName, isAgent ? styles.agentName : styles.learnerName]}>
                      {isAgent ? 'Language Buddy' : 'You'}
                    </Text>
                  </View>
                  <View style={[styles.bubble, isAgent ? styles.agentBubble : styles.learnerBubble]}>
                    <Text style={[styles.bubbleText, isAgent ? styles.agentText : styles.learnerText]}>
                      {item.text}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
    overflow: 'hidden',
  },
  containerClosed: {
    height: 60,
  },
  containerOpen: {
    height: SCREEN_HEIGHT * 0.45,
  },
  handleContainer: {
    height: 60,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  handleBar: {
    width: 36,
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f8fafc',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingBottom: 24,
    gap: 12,
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  turnContainer: {
    width: '100%',
  },
  agentTurn: {
    alignItems: 'flex-start',
  },
  learnerTurn: {
    alignItems: 'flex-end',
  },
  speakerLabelRow: {
    marginBottom: 3,
  },
  speakerName: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  agentName: {
    color: '#34d399',
  },
  learnerName: {
    color: '#38bdf8',
  },
  bubble: {
    maxWidth: '85%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  agentBubble: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  learnerBubble: {
    backgroundColor: '#059669',
    borderTopRightRadius: 4,
  },
  bubbleText: {
    fontSize: 13,
    lineHeight: 19,
  },
  agentText: {
    color: '#f1f5f9',
  },
  learnerText: {
    color: '#020617',
    fontWeight: '600',
  },
});
