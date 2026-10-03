import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.js';
import {
  Mic,
  Clock,
  Sparkles,
  BookOpen,
  Award,
  AlertTriangle,
  RotateCw,
  TrendingUp,
  Languages,
  CheckCircle2,
  Calendar,
  MessageSquare,
  History,
  Layers,
} from 'lucide-react';
import { CEFRLevel } from '../types.js';
import { useGeminiLive } from '../hooks/useGeminiLive.js';
import { LiveSessionView } from '../components/LiveSessionView.js';

const AVAILABLE_LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Portuguese',
  'Japanese',
  'Chinese (Mandarin)',
  'Korean',
  'Russian',
  'Arabic',
];

const CEFR_LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const CEFR_DESCRIPTIONS: Record<CEFRLevel, string> = {
  A1: 'Beginner — Basic personal phrases & everyday greetings',
  A2: 'Elementary — Routines, past events & familiar situations',
  B1: 'Intermediate — Storytelling, opinions & connected conversation',
  B2: 'Upper Intermediate — Hypotheticals, viewpoints & fluent discussion',
  C1: 'Advanced — Abstract ideas, complex nuance & spontaneous speech',
  C2: 'Mastery — Nuanced, idiomatic fluency in any context',
};

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
  const [requestedTopic, setRequestedTopic] = useState('');

  // Phase 2 Memory State
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

  // Sync profile defaults if profile loads after mount
  useEffect(() => {
    if (profile) {
      setNativeLanguage(profile.nativeLanguage || 'English');
      setTargetLanguage(profile.targetLanguage || 'Spanish');
      if (profile.preferences?.defaultSessionMinutes) {
        setSessionMinutes(profile.preferences.defaultSessionMinutes);
      }
    }
  }, [profile]);

  const handleSaveLanguages = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nativeLanguage.trim().toLowerCase() === targetLanguage.trim().toLowerCase()) {
      alert('Native and target languages must be different.');
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
        levelConfidence: 0.25, // self-reported confidence
      });
    } catch (err) {
      console.error('Failed to update CEFR level', err);
    }
  };

  const handleStartSession = () => {
    liveSession.startSession({
      targetMinutes: sessionMinutes,
      nativeLanguage,
      targetLanguage,
      topic: requestedTopic.trim() || undefined,
    });
  };

  const handleReturnToDashboard = () => {
    liveSession.resetSession();
    fetchHistory();
    fetchDashboardStats();
  };

  const currentLevel = profile?.level?.overall || 'A1';

  // If a live session is in progress or completed, show LiveSessionView
  if (liveSession.status !== 'idle') {
    return (
      <LiveSessionView
        status={liveSession.status}
        error={liveSession.error}
        isMuted={liveSession.isMuted}
        micVolume={liveSession.micVolume}
        agentSpeaking={liveSession.agentSpeaking}
        elapsedSeconds={liveSession.elapsedSeconds}
        targetMinutes={liveSession.targetMinutes}
        transcript={liveSession.transcript}
        sessionAnalysis={liveSession.sessionAnalysis}
        nativeLanguage={nativeLanguage}
        targetLanguage={targetLanguage}
        cefrLevel={currentLevel}
        topic={requestedTopic || 'Everyday conversation & vocabulary practice'}
        onToggleMute={liveSession.toggleMute}
        onStopSession={liveSession.stopSession}
        onReturnToDashboard={handleReturnToDashboard}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Welcome & Status Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
            Phase 2 Memory & Adaptive Planner Active
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Learner Dashboard
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Speaking and listening first • Adaptive memory & automated error tracking
          </p>
        </div>

        {/* Assigned Level Card with self-report dropdown */}
        <div className="flex items-center space-x-3 bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Award className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">CEFR Level</div>
            <div className="flex items-center gap-2">
              <select
                value={currentLevel}
                onChange={(e) => handleLevelChange(e.target.value as CEFRLevel)}
                className="bg-slate-950 border border-slate-700 rounded-lg text-emerald-400 font-bold text-sm px-2 py-0.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none cursor-pointer"
              >
                {CEFR_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    Level {lvl}
                  </option>
                ))}
              </select>
              <span className="text-xs text-slate-500">
                ({Math.round((profile?.levelConfidence ?? 0.1) * 100)}% conf)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Left 2 Cols: Session Launcher, Language Picker, History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Start Session Card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/30 rounded-2xl p-6 sm:p-8 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                  Planned Practice
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-white">
                  Speak {targetLanguage} with your AI Tutor
                </h3>
                <p className="text-slate-400 text-sm mt-1 max-w-lg">
                  Every conversation adapts to your known vocabulary, error patterns, and spaced review schedule.
                </p>
              </div>

              <button
                onClick={handleStartSession}
                className="w-full sm:w-auto flex-shrink-0 flex items-center justify-center px-6 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-base shadow-lg shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <Mic className="w-5 h-5 mr-2" />
                Start {sessionMinutes}-Min Session
              </button>
            </div>

            {/* Optional Topic Input */}
            <div className="mt-5">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Practice Topic or Goal (Optional):
              </label>
              <input
                type="text"
                value={requestedTopic}
                onChange={(e) => setRequestedTopic(e.target.value)}
                placeholder="e.g., Ordering tapas at a restaurant, job interviews, weekend plans"
                className="w-full px-3.5 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-200 placeholder-slate-500 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Session Duration Selector */}
            <div className="mt-5 pt-5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center text-xs text-slate-400">
                <Clock className="w-4 h-4 mr-1.5 text-slate-500" />
                Target session length:
              </div>
              <div className="flex items-center space-x-2">
                {[5, 10, 15, 20].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => handleMinutesChange(mins)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      sessionMinutes === mins
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Language Pair Settings Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Languages className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white">Language Selection</h3>
              </div>
              {saveSuccess && (
                <span className="flex items-center text-xs text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Saved
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Confirmed before every session so only these two languages are passed to the AI voice agent.
            </p>

            <form onSubmit={handleSaveLanguages} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Native / Support Language
                </label>
                <select
                  value={nativeLanguage}
                  onChange={(e) => setNativeLanguage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {AVAILABLE_LANGUAGES.map((lang) => (
                    <option key={`nat-${lang}`} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Target Language
                </label>
                <select
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {AVAILABLE_LANGUAGES.map((lang) => (
                    <option key={`tar-${lang}`} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isUpdatingLanguages}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isUpdatingLanguages ? 'Saving...' : 'Update Default Languages'}
                </button>
              </div>
            </form>
          </div>

          {/* Recent Spoken Sessions History */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white">Conversation History</h3>
              </div>
              <span className="text-xs text-slate-400">
                {recentSessions.length} recorded session{recentSessions.length === 1 ? '' : 's'}
              </span>
            </div>

            {isLoadingHistory ? (
              <div className="text-center py-6 text-xs text-slate-500">Loading history...</div>
            ) : recentSessions.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl">
                <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-medium">No recorded conversations yet.</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Start your first voice session above!
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {recentSessions.map((s) => {
                  const durationSecs = s.endedAt
                    ? Math.round(
                        (new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime()) / 1000
                      )
                    : s.targetMinutes * 60;
                  const mins = Math.floor(durationSecs / 60);
                  const secs = durationSecs % 60;

                  return (
                    <div key={s._id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-slate-200 flex items-center space-x-2">
                          <span>{s.languages?.target || 'Spanish'}</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-400 font-normal">
                            {s.plan?.topic || 'Practice session'}
                          </span>
                        </div>
                        <div className="text-slate-500 flex items-center space-x-2 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {new Date(s.startedAt).toLocaleDateString()} at{' '}
                            {new Date(s.startedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-emerald-400 font-mono font-medium">
                          {mins}m {secs}s
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          {s.transcript?.length || 0} turns
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Memory & SRS Progress Cards */}
        <div className="space-y-6">
          {/* Level Details Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h4 className="text-sm font-bold text-white flex items-center mb-3">
              <TrendingUp className="w-4 h-4 mr-2 text-emerald-400" />
              CEFR Level {currentLevel}
            </h4>
            <p className="text-xs text-slate-400 mb-4">
              {CEFR_DESCRIPTIONS[currentLevel] || 'Target language level'}
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Speaking</span>
                <span className="font-semibold text-emerald-400">
                  {profile?.level?.speaking || 'A1'}
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Listening</span>
                <span className="font-semibold text-emerald-400">
                  {profile?.level?.listening || 'A1'}
                </span>
              </div>
            </div>
          </div>

          {/* Memory Bank & SRS Items */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h4 className="text-sm font-bold text-white flex items-center justify-between mb-3">
              <div className="flex items-center">
                <RotateCw className="w-4 h-4 mr-2 text-emerald-400" />
                Memory Bank (SRS)
              </div>
              <span className="text-xs font-semibold text-emerald-400">
                {dashboardMetrics.stats.totalItems} items
              </span>
            </h4>

            <div className="grid grid-cols-2 gap-2 text-center text-xs mb-3">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-lg font-bold text-white">
                  {dashboardMetrics.stats.recognitionItems}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Recognition</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-lg font-bold text-emerald-400">
                  {dashboardMetrics.stats.productionItems}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Production</div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center">
              Total review events logged: <strong className="text-white">{dashboardMetrics.stats.totalReviews}</strong>
            </p>
          </div>

          {/* Topics Covered & Depth */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h4 className="text-sm font-bold text-white flex items-center justify-between mb-3">
              <div className="flex items-center">
                <Layers className="w-4 h-4 mr-2 text-emerald-400" />
                Covered Topics
              </div>
              <span className="text-xs text-slate-400">
                {dashboardMetrics.coveredTopics.length} topics
              </span>
            </h4>

            {dashboardMetrics.coveredTopics.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-3">
                Topics will accumulate as you practice speaking.
              </p>
            ) : (
              <div className="space-y-2.5 text-xs">
                {dashboardMetrics.coveredTopics.map((top) => (
                  <div
                    key={top._id || top.name}
                    className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-slate-200 capitalize">{top.name}</div>
                      <div className="text-[10px] text-slate-500">
                        {top.sessionsCount} session{top.sessionsCount === 1 ? '' : 's'}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                        Depth {top.depth}/3
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Open Weak Spots & Build-On Notes */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h4 className="text-sm font-bold text-white flex items-center mb-3">
              <BookOpen className="w-4 h-4 mr-2 text-emerald-400" />
              Focus Areas & Weak Spots
            </h4>

            {dashboardMetrics.openNotes.length === 0 ? (
              <div className="text-xs text-slate-500 flex items-center justify-center p-4 border border-dashed border-slate-800 rounded-xl">
                <AlertTriangle className="w-4 h-4 mr-1.5 text-slate-600" />
                No active error patterns logged yet.
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                {dashboardMetrics.openNotes.map((note) => (
                  <div
                    key={note._id || note.text}
                    className="p-2.5 rounded-lg bg-slate-950 border border-amber-500/20 text-slate-300"
                  >
                    <div className="flex items-center space-x-1.5 text-amber-400 font-bold text-[10px] uppercase mb-0.5">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{note.kind.replace('_', ' ')}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">{note.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
