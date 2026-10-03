import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.js';
import {
  HandDrawnPhone,
  HandDrawnShuffle,
  HandDrawnBook,
  HandDrawnSparkle,
  HandDrawnBookmark,
  HandDrawnFlame,
  HandDrawnCheck,
  HandDrawnClock,
} from '../components/HandDrawnIcons.js';
import { CEFRLevel } from '../types.js';
import { useGeminiLive } from '../hooks/useGeminiLive.js';
import { LiveSessionView } from '../components/LiveSessionView.js';
import { BUDDY_ASSETS } from '../assets/buddyAssets.js';

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

const CEFR_LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

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

export const Dashboard: React.FC = () => {
  const { profile, updateProfile } = useAuth();
  const liveSession = useGeminiLive();

  const [sessionMinutes, setSessionMinutes] = useState<number>(
    profile?.preferences?.defaultSessionMinutes || 10
  );
  const [nativeLanguage, setNativeLanguage] = useState(profile?.nativeLanguage || 'English');
  const [targetLanguage, setTargetLanguage] = useState(profile?.targetLanguage || 'Spanish');
  const [isUpdatingLanguages, setIsUpdatingLanguages] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
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
      if (profile.preferences?.defaultSessionMinutes) {
        setSessionMinutes(profile.preferences.defaultSessionMinutes);
      }
    }
  }, [profile]);

  const handleShufflePrompt = () => {
    setPromptIndex((prev) => (prev + 1) % DAILY_PROMPTS.length);
  };

  const handleSelectPrompt = () => {
    const current = DAILY_PROMPTS[promptIndex];
    setRequestedTopic(current.title);
  };

  const handleSaveLanguages = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nativeLanguage.trim().toLowerCase() === targetLanguage.trim().toLowerCase()) {
      alert('Support and target languages must be different.');
      return;
    }
    setIsUpdatingLanguages(true);
    try {
      await updateProfile({
        nativeLanguage,
        targetLanguage,
        preferences: {
          speechRate: profile?.preferences?.speechRate ?? 1.0,
          nativeLangSupport: profile?.preferences?.nativeLangSupport ?? 'med',
          defaultSessionMinutes: sessionMinutes,
        },
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error(err);
      alert('Failed to save language settings');
    } finally {
      setIsUpdatingLanguages(false);
    }
  };

  const handleMinutesChange = async (mins: number) => {
    setSessionMinutes(mins);
    try {
      await updateProfile({
        preferences: {
          speechRate: profile?.preferences?.speechRate ?? 1.0,
          nativeLangSupport: profile?.preferences?.nativeLangSupport ?? 'med',
          defaultSessionMinutes: mins,
        },
      });
    } catch (err) {
      console.error('Failed to update session length preference', err);
    }
  };

  const handleLevelChange = async (newLevel: CEFRLevel) => {
    try {
      await updateProfile({
        level: {
          overall: newLevel,
          speaking: newLevel,
          listening: newLevel,
        },
        levelConfidence: 0.25,
      });
    } catch (err) {
      console.error('Failed to update CEFR level', err);
    }
  };

  const handleStartSession = (type: 'placement' | 'practice') => {
    liveSession.startSession({
      type,
      targetMinutes: type === 'placement' ? 8 : sessionMinutes,
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

  // Active or completed session view
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
    <div className="flex-1 w-full max-w-xl mx-auto px-4 py-4 sm:py-6 space-y-4">
      {/* Top Quiet Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full overflow-hidden shadow-2xs shrink-0 bg-orange-100 ring-1 ring-orange-300 flex items-center justify-center">
            <img
              src={BUDDY_ASSETS.wavingHappy}
              alt="Buddy waving"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-[#2B2B2B] tracking-tight">Buddy is ready</span>
            </div>
            <span className="text-[10px] text-stone-500 font-medium block">
              Practicing {targetLanguage}
            </span>
          </div>
        </div>

        {/* Level and streak badge */}
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#2B2B2B] bg-white/90 px-3 py-1 rounded-full shadow-2xs border border-stone-200/80">
          <HandDrawnFlame size={14} washColor="#F97316" strokeColor="#2B2B2B" />
          <span className="font-bold text-[#2B2B2B]">Level {currentLevel}</span>
          <span className="text-stone-400">·</span>
          <select
            value={currentLevel}
            onChange={(e) => handleLevelChange(e.target.value as CEFRLevel)}
            className="bg-transparent text-[11px] font-bold text-stone-700 focus:outline-none cursor-pointer"
          >
            {CEFR_LEVELS.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Hero Ring Buddy Card */}
      <div className="relative rounded-[32px] bg-gradient-to-b from-[#FFA785] via-[#FB9B77] to-[#F38A65] p-5 shadow-lg shadow-orange-950/10 overflow-hidden text-stone-900 transition-all hover:shadow-xl">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/20 rounded-full blur-2xl pointer-events-none" />

        {/* Mascot Banner */}
        <div className="relative w-full h-14 -mx-1 mb-3 overflow-hidden rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center">
          <img
            src={BUDDY_ASSETS.heroBanner}
            alt="Adorable fluffy Buddy mascots"
            className="w-full h-full object-cover object-center opacity-95 transition-transform duration-700 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#FFA785]/80 via-transparent to-[#FFA785]/80 pointer-events-none" />
        </div>

        {/* Center Call Action Button */}
        <div className="flex flex-col items-center justify-center pt-1 pb-2 text-center">
          <div className="relative group">
            <div className="absolute inset-0 rounded-full bg-emerald-400/40 animate-ping opacity-60 pointer-events-none" />
            <div className="absolute -inset-2 rounded-full bg-emerald-300/30 blur-md pointer-events-none" />

            <button
              onClick={() => handleStartSession('practice')}
              aria-label="Ring Buddy now"
              className="relative w-20 h-20 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-stone-900 flex items-center justify-center shadow-lg shadow-emerald-950/25 transition-all duration-200 cursor-pointer hover:shadow-emerald-500/40"
            >
              <HandDrawnPhone
                size={36}
                washColor="#BAF7D0"
                strokeColor="#2B2B2B"
                strokeWidth={2.6}
                className="-rotate-12 transition-transform duration-300 group-hover:rotate-0"
              />
            </button>
          </div>

          <h2 className="mt-3 font-display font-extrabold text-[#2B2B2B] text-lg tracking-tight">
            Ring Buddy
          </h2>
          <p className="text-xs text-[#2B2B2B]/85 font-medium max-w-[240px] mt-0.5 leading-snug">
            and practice speaking {targetLanguage} naturally
          </p>

          {/* Target duration selector */}
          <div className="mt-3 flex items-center gap-1.5 bg-white/30 backdrop-blur-xs px-2.5 py-1 rounded-full">
            <span className="text-[10px] font-bold text-[#2B2B2B]/75 uppercase tracking-wider">
              Length:
            </span>
            {[5, 10, 15, 20].map((mins) => (
              <button
                key={mins}
                onClick={() => handleMinutesChange(mins)}
                className={`px-2 py-0.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  sessionMinutes === mins
                    ? 'bg-[#2B2B2B] text-white shadow-2xs'
                    : 'text-[#2B2B2B]/80 hover:bg-white/40'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>

          {requestedTopic ? (
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 bg-white/80 rounded-full text-[11px] font-medium text-[#2B2B2B] shadow-2xs">
              <span>🎯 Topic: {requestedTopic}</span>
              <button
                onClick={() => setRequestedTopic('')}
                className="text-stone-500 hover:text-stone-800 ml-1"
              >
                ✕
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Placement Interview Banner if not completed */}
      {!profile?.placementCompletedAt && (
        <div className="p-4 rounded-3xl bg-gradient-to-br from-[#FFE3D6] via-[#FFD8C7] to-[#FFCEB8] shadow-xs text-left relative overflow-hidden">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-orange-950">
              <HandDrawnSparkle size={15} washColor="#FEF08A" strokeColor="#2B2B2B" />
              <span>Recommended Assessment</span>
            </div>
            <span className="text-[10px] font-semibold text-orange-800 bg-white/60 px-2 py-0.5 rounded-full">
              8 mins
            </span>
          </div>
          <h4 className="font-display font-bold text-sm text-[#2B2B2B]">
            Take the ACTFL Oral Placement Interview
          </h4>
          <p className="text-xs text-[#2B2B2B]/80 mt-1 leading-relaxed">
            Buddy will evaluate your speaking floor and ceiling levels to calibrate your starting level in {targetLanguage}.
          </p>
          <button
            onClick={() => handleStartSession('placement')}
            className="mt-3 w-full py-2.5 px-4 rounded-2xl bg-[#2B2B2B] hover:bg-stone-800 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all"
          >
            <span>Start Placement Interview</span>
            <HandDrawnPhone size={14} washColor="#86EFAC" strokeColor="#FFFFFF" />
          </button>
        </div>
      )}

      {/* Not sure what to discuss? Daily Prompts */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-[#2B2B2B] tracking-tight">
            Not sure what to discuss?
          </h3>
          <button
            onClick={handleShufflePrompt}
            className="text-[11px] text-[#2B2B2B]/70 hover:text-[#2B2B2B] flex items-center gap-1.5 transition-colors py-1 px-2 rounded-lg hover:bg-stone-200/60 cursor-pointer"
            title="Shuffle topic prompt"
          >
            <HandDrawnShuffle size={13} strokeColor="#2B2B2B" washColor="#FED7AA" />
            <span className="font-semibold">Shuffle</span>
          </button>
        </div>

        <div
          onClick={handleSelectPrompt}
          className="group cursor-pointer p-4 rounded-3xl bg-gradient-to-br from-[#FFD1BA]/70 via-[#FFDFD0]/60 to-[#FCE6D9]/50 shadow-xs hover:shadow-md transition-all active:scale-[0.99] text-left border border-orange-200/40"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-950/70">
              {currentPrompt.category}
            </span>
            <span className="text-[10px] text-stone-500 font-semibold group-hover:text-emerald-700 transition-colors">
              Tap to practice this topic →
            </span>
          </div>
          <h4 className="font-display font-bold text-[#2B2B2B] text-sm leading-snug">
            {currentPrompt.title}
          </h4>
          <p className="text-xs text-[#2B2B2B]/75 mt-1 leading-relaxed">
            {currentPrompt.teaser}
          </p>
        </div>
      </div>

      {/* Language Selection Card */}
      <div className="p-4 rounded-3xl bg-white/90 shadow-xs border border-stone-200/80">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#2B2B2B]">
            <HandDrawnSparkle size={14} washColor="#86EFAC" strokeColor="#2B2B2B" />
            <span>Language Selection</span>
          </div>
          {saveSuccess && (
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
              <HandDrawnCheck size={11} washColor="#86EFAC" strokeColor="#065F46" />
              Saved
            </span>
          )}
        </div>

        <form onSubmit={handleSaveLanguages} className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
              Support Language
            </label>
            <select
              value={nativeLanguage}
              onChange={(e) => setNativeLanguage(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAF7F0] border border-stone-300 rounded-xl text-xs font-bold text-[#2B2B2B] focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {AVAILABLE_LANGUAGES.map((lang) => (
                <option key={`nat-${lang}`} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
              Target Language
            </label>
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAF7F0] border border-stone-300 rounded-xl text-xs font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {AVAILABLE_LANGUAGES.map((lang) => (
                <option key={`tar-${lang}`} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={isUpdatingLanguages}
              className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-[#2B2B2B] rounded-xl text-[11px] font-bold transition-colors cursor-pointer"
            >
              {isUpdatingLanguages ? 'Saving...' : 'Update Defaults'}
            </button>
          </div>
        </form>
      </div>

      {/* Memory Bank (FSRS Spaced Repetition) */}
      <div className="p-4 rounded-3xl bg-white/90 shadow-xs border border-stone-200/80">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#2B2B2B]">
            <HandDrawnBook size={15} washColor="#FED7AA" strokeColor="#2B2B2B" />
            <span>Memory Bank (SRS)</span>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
            {dashboardMetrics.stats.totalItems} words learned
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="p-3 rounded-2xl bg-[#FAF7F0] border border-stone-200/60">
            <div className="text-xl font-display font-extrabold text-[#2B2B2B]">
              {dashboardMetrics.stats.recognitionItems}
            </div>
            <div className="text-[10px] font-medium text-stone-500 mt-0.5">Recognition</div>
          </div>
          <div className="p-3 rounded-2xl bg-[#FAF7F0] border border-stone-200/60">
            <div className="text-xl font-display font-extrabold text-emerald-700">
              {dashboardMetrics.stats.productionItems}
            </div>
            <div className="text-[10px] font-medium text-stone-500 mt-0.5">Production</div>
          </div>
        </div>
      </div>

      {/* Topics Practiced */}
      {dashboardMetrics.coveredTopics.length > 0 && (
        <div className="p-4 rounded-3xl bg-white/90 shadow-xs border border-stone-200/80">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-[#2B2B2B]">Topics Practiced</h3>
            <span className="text-[11px] text-stone-500">
              {dashboardMetrics.coveredTopics.length} covered
            </span>
          </div>

          <div className="space-y-2">
            {dashboardMetrics.coveredTopics.map((top) => (
              <div
                key={top._id || top.name}
                className="p-3 rounded-2xl bg-[#FAF7F0] flex items-center justify-between text-xs border border-stone-200/60"
              >
                <div>
                  <span className="font-bold text-[#2B2B2B] capitalize block">{top.name}</span>
                  <span className="text-[10px] text-stone-500">
                    {top.sessionsCount} session{top.sessionsCount === 1 ? '' : 's'}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
                  Depth {top.depth}/3
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Focus Areas & Weak Spots */}
      {dashboardMetrics.openNotes.length > 0 && (
        <div className="p-4 rounded-3xl bg-white/90 shadow-xs border border-stone-200/80">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#2B2B2B] mb-3">
            <HandDrawnBookmark size={15} washColor="#FEF08A" strokeColor="#2B2B2B" />
            <span>Focus Areas & Feedback</span>
          </div>

          <div className="space-y-2">
            {dashboardMetrics.openNotes.map((note) => (
              <div
                key={note._id || note.text}
                className="p-3 rounded-2xl bg-[#FAF7F0] border border-orange-200/70 text-xs"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-900 block mb-1">
                  {note.kind.replace('_', ' ')}
                </span>
                <p className="text-stone-700 leading-relaxed">{note.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Conversation History */}
      <div className="p-4 rounded-3xl bg-white/90 shadow-xs border border-stone-200/80 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#2B2B2B]">
            <HandDrawnClock size={15} washColor="#BAE6FD" strokeColor="#2B2B2B" />
            <span>Recent Conversations</span>
          </div>
          <span className="text-[11px] text-stone-500">
            {recentSessions.length} recorded
          </span>
        </div>

        {isLoadingHistory ? (
          <div className="text-center py-4 text-xs text-stone-500">Loading history...</div>
        ) : recentSessions.length === 0 ? (
          <div className="text-center py-6 text-xs text-stone-500">
            No previous conversations recorded yet. Ring Buddy above to begin!
          </div>
        ) : (
          <div className="space-y-2">
            {recentSessions.slice(0, 5).map((s) => {
              const durationSecs = s.endedAt
                ? Math.round(
                    (new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime()) / 1000
                  )
                : s.targetMinutes * 60;
              const mins = Math.floor(durationSecs / 60);
              const secs = durationSecs % 60;

              return (
                <div
                  key={s._id}
                  className="p-3 rounded-2xl bg-[#FAF7F0] flex items-center justify-between text-xs border border-stone-200/60"
                >
                  <div>
                    <span className="font-bold text-[#2B2B2B] block">
                      {s.languages?.target || 'Spanish'} · {s.type === 'placement' ? 'Placement' : 'Practice'}
                    </span>
                    <span className="text-[10px] text-stone-500">
                      {new Date(s.startedAt).toLocaleDateString()} at{' '}
                      {new Date(s.startedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-[#2B2B2B] text-xs">
                      {mins}m {secs}s
                    </span>
                    <span className="block text-[10px] text-stone-500">
                      {s.transcript?.length || 0} turns
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
