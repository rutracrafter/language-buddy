import React, { useState } from 'react';
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
} from 'lucide-react';
import { CEFRLevel } from '../types.js';

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

  const [sessionMinutes, setSessionMinutes] = useState<number>(
    profile?.preferences?.defaultSessionMinutes || 10
  );
  const [nativeLanguage, setNativeLanguage] = useState(profile?.nativeLanguage || 'English');
  const [targetLanguage, setTargetLanguage] = useState(profile?.targetLanguage || 'Spanish');
  const [isUpdatingLanguages, setIsUpdatingLanguages] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);

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

  const currentLevel = profile?.level?.overall || 'A1';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Welcome & Status Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
            Phase 0 Foundation Active
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Learner Dashboard
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Speaking and listening first • Adaptive spaced-repetition conversations
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Award className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Assigned Level</div>
            <div className="text-lg font-bold text-white flex items-center gap-1.5">
              <span>{currentLevel}</span>
              <span className="text-xs font-normal text-slate-400">
                ({Math.round((profile?.levelConfidence ?? 0.1) * 100)}% confidence)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Left 2 Cols: Session Launcher & Language Picker */}
        <div className="lg:col-span-2 space-y-6">
          {/* Start Session Card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/30 rounded-2xl p-6 sm:p-8 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                  Ready to Practice
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-white">
                  Speak {profile?.targetLanguage || 'Spanish'} with your AI Partner
                </h3>
                <p className="text-slate-400 text-sm mt-1 max-w-lg">
                  Ask questions in {profile?.nativeLanguage || 'English'} whenever you need help.
                  Vocabulary and errors are automatically tracked.
                </p>
              </div>

              <button
                onClick={() => setShowSessionModal(true)}
                className="w-full sm:w-auto flex-shrink-0 flex items-center justify-center px-6 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-base shadow-lg shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Mic className="w-5 h-5 mr-2" />
                Start {sessionMinutes}-Min Session
              </button>
            </div>

            {/* Session Duration Selector */}
            <div className="mt-6 pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
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
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
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

          {/* Session Modal / Gate Notification */}
          {showSessionModal && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Mic className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">Voice Session Trigger</h4>
                    <p className="text-xs text-slate-400">Phase 0 Gate Complete</p>
                  </div>
                </div>

                <p className="text-sm text-slate-300 mb-4">
                  Authentication and user profiles are working! The next phase (
                  <strong className="text-emerald-400">Phase 1 — Voice loop</strong>) connects your
                  microphone to Gemini Live API with ephemeral tokens and live transcripts.
                </p>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs text-slate-400 space-y-1 mb-6">
                  <div>• Native: <strong className="text-slate-200">{profile?.nativeLanguage}</strong></div>
                  <div>• Target: <strong className="text-slate-200">{profile?.targetLanguage}</strong></div>
                  <div>• Duration: <strong className="text-slate-200">{sessionMinutes} minutes</strong></div>
                  <div>• CEFR: <strong className="text-slate-200">{currentLevel}</strong></div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setShowSessionModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition-colors"
                  >
                    Close Preview
                  </button>
                </div>
              </div>
            </div>
          )}

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
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {isUpdatingLanguages ? 'Saving...' : 'Update Default Languages'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Col: Memory & SRS Progress Placeholders */}
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
                <span className="font-semibold text-emerald-400">{profile?.level?.speaking || 'A1'}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Listening</span>
                <span className="font-semibold text-emerald-400">{profile?.level?.listening || 'A1'}</span>
              </div>
            </div>
          </div>

          {/* Due Reviews & Memory Stats */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h4 className="text-sm font-bold text-white flex items-center mb-3">
              <RotateCw className="w-4 h-4 mr-2 text-emerald-400" />
              Spaced Repetition (FSRS)
            </h4>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-center">
              <div className="text-2xl font-bold text-white">0</div>
              <div className="text-xs text-slate-500 mt-0.5">Reviews Due Today</div>
            </div>
            <p className="text-xs text-slate-500 mt-3 text-center">
              Items will appear as you practice speaking in Phase 2 & 3.
            </p>
          </div>

          {/* Topics & Open Notes */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h4 className="text-sm font-bold text-white flex items-center mb-3">
              <BookOpen className="w-4 h-4 mr-2 text-emerald-400" />
              Focus Areas & Weak Spots
            </h4>
            <div className="text-xs text-slate-500 flex items-center justify-center p-4 border border-dashed border-slate-800 rounded-xl">
              <AlertTriangle className="w-4 h-4 mr-1.5 text-slate-600" />
              No active error patterns logged yet.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
