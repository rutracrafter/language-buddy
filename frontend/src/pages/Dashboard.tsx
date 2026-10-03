import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useGeminiLive } from '../hooks/useGeminiLive.js';
import { LiveSessionView } from '../components/LiveSessionView.js';
import { BottomNavBar, NavTabType } from '../components/BottomNavBar.js';
import { PracticeTab } from '../components/tabs/PracticeTab.js';
import { HistoryTab } from '../components/tabs/HistoryTab.js';
import { MeTab } from '../components/tabs/MeTab.js';
import { SettingsTab } from '../components/tabs/SettingsTab.js';

const AVAILABLE_LANGUAGES = [
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

const DAILY_PROMPTS = [
  {
    category: 'Daily Routine',
    title: 'Morning Rituals & Favorite Coffee',
    teaser: 'Practice ordering your go-to breakfast, describing how you start your morning, and setting your daily mood.',
  },
  {
    category: 'Travel & Culture',
    title: 'Dream Trips & Hidden Gems',
    teaser: 'Chat about a city you would love to visit, how to ask for directions, and finding authentic local food.',
  },
  {
    category: 'Food & Tapas',
    title: 'Ordering Tapas & Traditional Dishes',
    teaser: 'Roleplay a casual evening at a local market or bistro. Practice asking what is fresh and getting the bill.',
  },
  {
    category: 'Weekend & Hobbies',
    title: 'Weekend Plans & Unwinding',
    teaser: 'Discuss your favorite creative pastimes, music, or films, and what you enjoy doing when you have free time.',
  },
];

interface DashboardProps {
  onRestartOnboarding?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onRestartOnboarding }) => {
  const { user, profile, updateProfile, logout } = useAuth();
  const liveSession = useGeminiLive();

  const [activeTab, setActiveTab] = useState<NavTabType>('practice');
  const [nativeLanguage, setNativeLanguage] = useState(profile?.nativeLanguage || 'English');
  const [targetLanguage, setTargetLanguage] = useState(profile?.targetLanguage || 'Spanish');
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [promptIndex, setPromptIndex] = useState(0);
  const [requestedTopic, setRequestedTopic] = useState('');

  // Memory & SRS State
  const [dashboardMetrics, setDashboardMetrics] = useState<{
    stats: {
      totalItems: number;
      recognitionItems: number;
      productionItems: number;
      totalReviews: number;
    };
    coveredTopics: any[];
    openNotes: any[];
  }>({
    stats: {
      totalItems: 0,
      recognitionItems: 0,
      productionItems: 0,
      totalReviews: 0,
    },
    coveredTopics: [],
    openNotes: [],
  });

  const fetchDashboardStats = useCallback(async () => {
    try {
      const res = await fetch('/api/profile/dashboard');
      if (res.ok) {
        const data = await res.json();
        setDashboardMetrics({
          stats: data.stats || {
            totalItems: 0,
            recognitionItems: 0,
            productionItems: 0,
            totalReviews: 0,
          },
          coveredTopics: data.coveredTopics || [],
          openNotes: data.openNotes || [],
        });
      }
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      setIsLoadingHistory(true);
      const res = await fetch('/api/sessions/recent');
      if (res.ok) {
        const data = await res.json();
        setRecentSessions(data.sessions || []);
      }
    } catch (err) {
      console.error('Failed to fetch sessions history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
    fetchDashboardStats();
  }, [fetchHistory, fetchDashboardStats]);

  useEffect(() => {
    if (profile) {
      setNativeLanguage(profile.nativeLanguage || 'English');
      setTargetLanguage(profile.targetLanguage || 'Spanish');
    }
  }, [profile]);

  const handleShufflePrompt = () => {
    setPromptIndex((prev) => (prev + 1) % DAILY_PROMPTS.length);
  };

  const handleSaveSettings = async (updates: {
    nativeLanguage?: string;
    targetLanguage?: string;
    speechRate?: number;
    nativeLangSupport?: 'low' | 'med' | 'high';
    interests?: string[];
  }) => {
    if (updates.nativeLanguage) setNativeLanguage(updates.nativeLanguage);
    if (updates.targetLanguage) setTargetLanguage(updates.targetLanguage);

    await updateProfile({
      nativeLanguage: updates.nativeLanguage,
      targetLanguage: updates.targetLanguage,
      interests: updates.interests,
      preferences: {
        speechRate: updates.speechRate ?? profile?.preferences?.speechRate ?? 1.0,
        nativeLangSupport: updates.nativeLangSupport ?? profile?.preferences?.nativeLangSupport ?? 'med',
        defaultSessionMinutes: profile?.preferences?.defaultSessionMinutes ?? 10,
      },
    });
  };

  const handleStartSession = (type: 'placement' | 'practice') => {
    liveSession.startSession({
      type,
      nativeLanguage,
      targetLanguage,
      topic:
        type === 'placement'
          ? 'ACTFL Oral Proficiency Placement Interview'
          : requestedTopic.trim() || DAILY_PROMPTS[promptIndex].title,
      speechRate: profile?.preferences?.speechRate ?? 1.0,
    });
  };

  const handleReturnToDashboard = () => {
    liveSession.resetSession();
    fetchHistory();
    fetchDashboardStats();
  };

  const currentLevel = profile?.level?.overall || 'A1';
  const currentPrompt = DAILY_PROMPTS[promptIndex];

  // Active or completed session view (Hides bottom nav bar for full immersive focus)
  if (liveSession.status !== 'idle') {
    return (
      <LiveSessionView
        status={liveSession.status}
        sessionType={liveSession.sessionType}
        error={liveSession.error}
        isMuted={liveSession.isMuted}
        speechRate={liveSession.speechRate}
        echoGuard={liveSession.echoGuard}
        micVolume={liveSession.micVolume}
        agentSpeaking={liveSession.agentSpeaking}
        elapsedSeconds={liveSession.elapsedSeconds}
        targetMinutes={liveSession.targetMinutes}
        transcript={liveSession.transcript}
        sessionAnalysis={liveSession.sessionAnalysis}
        nativeLanguage={nativeLanguage}
        targetLanguage={targetLanguage}
        cefrLevel={currentLevel}
        topic={
          liveSession.sessionType === 'placement'
            ? 'ACTFL Oral Proficiency Placement Interview'
            : requestedTopic || currentPrompt.title
        }
        onToggleMute={liveSession.toggleMute}
        onToggleEchoGuard={liveSession.toggleEchoGuard}
        onInterruptTutor={liveSession.interruptTutor}
        onUpdateSpeechRate={liveSession.updateSpeechRate}
        onStopSession={liveSession.stopSession}
        onReturnToDashboard={handleReturnToDashboard}
      />
    );
  }

  return (
    <div className="flex-1 w-full max-w-xl mx-auto px-4 pt-3 pb-24 space-y-4">
      {/* Tab Content */}
      {activeTab === 'practice' && (
        <PracticeTab
          targetLanguage={targetLanguage}
          onStartSession={handleStartSession}
          dailyPrompt={currentPrompt}
          onShufflePrompt={handleShufflePrompt}
          requestedTopic={requestedTopic}
          onSelectTopic={setRequestedTopic}
          onClearTopic={() => setRequestedTopic('')}
        />
      )}

      {activeTab === 'history' && (
        <HistoryTab sessions={recentSessions} isLoading={isLoadingHistory} />
      )}

      {activeTab === 'me' && (
        <MeTab
          userEmail={user?.email}
          learnerProfile={profile}
          targetLanguage={targetLanguage}
          currentLevel={currentLevel}
          levelConfidence={profile?.levelConfidence || 0.25}
          onRetakePlacement={() => handleStartSession('placement')}
          dashboardMetrics={dashboardMetrics}
        />
      )}

      {activeTab === 'settings' && (
        <SettingsTab
          nativeLanguage={nativeLanguage}
          targetLanguage={targetLanguage}
          availableLanguages={AVAILABLE_LANGUAGES}
          speechRate={profile?.preferences?.speechRate || 1.0}
          nativeLangSupport={profile?.preferences?.nativeLangSupport || 'med'}
          interests={profile?.interests || []}
          onSave={handleSaveSettings}
          onLogout={logout}
          onRestartOnboarding={
            onRestartOnboarding || (() => alert('Onboarding walkthrough reset!'))
          }
          onStartPlacement={() => handleStartSession('placement')}
        />
      )}

      {/* Ergonomic 4-Tab Bottom Navigation Bar */}
      <BottomNavBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};
