import React, { useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  PhoneOff,
  Volume2,
  Clock,
  Sparkles,
  Bot,
  User,
  AlertCircle,
  CheckCircle,
  Languages,
  BookOpen,
  TrendingUp,
  Target,
  Award,
} from 'lucide-react';
import { LiveTranscriptItem, LiveSessionStatus } from '../hooks/useGeminiLive.js';

interface LiveSessionViewProps {
  status: LiveSessionStatus;
  sessionType?: 'placement' | 'practice';
  error: string | null;
  isMuted: boolean;
  speechRate?: number;
  micVolume: number;
  agentSpeaking: boolean;
  elapsedSeconds: number;
  targetMinutes: number;
  transcript: LiveTranscriptItem[];
  sessionAnalysis?: any;
  nativeLanguage: string;
  targetLanguage: string;
  cefrLevel: string;
  topic?: string;
  onToggleMute: () => void;
  onUpdateSpeechRate?: (rate: number) => void;
  onStopSession: () => void;
  onReturnToDashboard: () => void;
}

export const LiveSessionView: React.FC<LiveSessionViewProps> = ({
  status,
  sessionType = 'practice',
  error,
  isMuted,
  speechRate = 1.0,
  micVolume,
  agentSpeaking,
  elapsedSeconds,
  targetMinutes,
  transcript,
  sessionAnalysis,
  nativeLanguage,
  targetLanguage,
  cefrLevel,
  topic,
  onToggleMute,
  onUpdateSpeechRate,
  onStopSession,
  onReturnToDashboard,
}) => {
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll transcript to bottom as new speech arrives
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = Math.min(100, (elapsedSeconds / (targetMinutes * 60)) * 100);

  if (status === 'finished') {
    const isPlacement = sessionType === 'placement';

    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg ${
              isPlacement
                ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-amber-500/10'
                : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-emerald-500/10'
            }`}>
              {isPlacement ? <Award className="w-7 h-7" /> : <CheckCircle className="w-7 h-7" />}
            </div>
            <h2 className="text-2xl font-bold text-white">
              {isPlacement ? 'Placement Assessment Complete!' : 'Practice Session Complete!'}
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              {isPlacement
                ? `Your spoken proficiency in ${targetLanguage} was evaluated across ACTFL task levels.`
                : `Spoken practice in ${targetLanguage} has been analyzed and saved to your memory history.`}
            </p>
          </div>

          {/* Placement Specific Results Banner */}
          {isPlacement && sessionAnalysis?.level && (
            <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 border border-amber-500/30 rounded-2xl p-5 mb-6 text-center">
              <div className="text-xs uppercase tracking-wider text-amber-400 font-bold mb-1">
                Assigned Proficiency Level
              </div>
              <div className="text-4xl font-extrabold text-white">
                CEFR {sessionAnalysis.level.overall}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Speaking: <strong className="text-emerald-400">{sessionAnalysis.level.speaking}</strong> • Listening: <strong className="text-emerald-400">{sessionAnalysis.level.listening}</strong> • Confidence: <strong className="text-slate-200">{Math.round((sessionAnalysis.levelConfidence || 0.65) * 100)}%</strong>
              </div>
              <div className="flex justify-center gap-6 mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-300">
                <div>Floor Level: <strong className="text-emerald-400">{sessionAnalysis.floorLevel}</strong></div>
                <div>Ceiling Level: <strong className="text-rose-400">{sessionAnalysis.ceilingLevel}</strong></div>
              </div>
            </div>
          )}

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-left">
              <div className="text-[11px] text-slate-500 font-medium">Practice Duration</div>
              <div className="text-lg font-bold text-emerald-400 mt-0.5">
                {formatTime(elapsedSeconds)}
              </div>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-left">
              <div className="text-[11px] text-slate-500 font-medium">Conversation Turns</div>
              <div className="text-lg font-bold text-white mt-0.5">
                {transcript.length} turns
              </div>
            </div>
            <div className="col-span-2 sm:col-span-1 bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-left">
              <div className="text-[11px] text-slate-500 font-medium">
                {isPlacement ? 'Starter Items' : 'Items Evaluated'}
              </div>
              <div className="text-lg font-bold text-sky-400 mt-0.5">
                {isPlacement
                  ? `${sessionAnalysis?.starterItems?.length || 0} unlocked`
                  : `${sessionAnalysis?.itemsReviewed?.length || 0} reviewed`}
              </div>
            </div>
          </div>

          {/* AI Analyst Insights */}
          {sessionAnalysis?.summary && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 mb-6 space-y-4 text-xs">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>AI Tutor Insights & Summary</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/20">
                  <span className="font-semibold text-emerald-400 block mb-1">
                    ✓ What Went Well
                  </span>
                  <p className="text-slate-300 leading-relaxed">
                    {sessionAnalysis.summary.whatWentWell}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-sky-500/20">
                  <span className="font-semibold text-sky-400 block mb-1">
                    🎯 Focus for Next Session
                  </span>
                  <p className="text-slate-300 leading-relaxed">
                    {sessionAnalysis.summary.nextFocus}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Items Reviewed Breakdown */}
          {sessionAnalysis?.itemsReviewed && sessionAnalysis.itemsReviewed.length > 0 && (
            <div className="mb-6">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center">
                <Target className="w-4 h-4 mr-1.5 text-emerald-400" />
                Evaluated Vocabulary & Patterns
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {sessionAnalysis.itemsReviewed.map((item: any, idx: number) => {
                  const outcomeColors: Record<string, string> = {
                    easy: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                    good: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
                    hard: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
                    again: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
                  };
                  return (
                    <div
                      key={idx}
                      className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-slate-100">{item.text}</span>
                        <span className="text-slate-500 ml-1.5">({item.gloss})</span>
                        <div className="text-[10px] text-slate-400 capitalize mt-0.5">
                          {item.skill}
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${
                          outcomeColors[item.outcome] || 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {item.outcome}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* New Items Introduced */}
          {sessionAnalysis?.itemsIntroduced && sessionAnalysis.itemsIntroduced.length > 0 && (
            <div className="mb-6">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center">
                <BookOpen className="w-4 h-4 mr-1.5 text-sky-400" />
                New Vocabulary Introduced
              </h4>
              <div className="space-y-2 text-xs">
                {sessionAnalysis.itemsIntroduced.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-sky-300">{item.text}</span>
                      <span className="text-slate-400 ml-1.5">— {item.gloss}</span>
                    </div>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                      {item.cefrLevel}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Topic Coverage Updated */}
          {sessionAnalysis?.topicCoverage && (
            <div className="mb-6 bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="text-slate-400">Topic: </span>
                  <span className="font-bold text-slate-200">
                    {sessionAnalysis.topicCoverage.name}
                  </span>
                </div>
              </div>
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                Depth {sessionAnalysis.topicCoverage.depth} / 3
              </span>
            </div>
          )}

          {/* Transcript Scroll Area */}
          {transcript.length > 0 && (
            <div className="mb-6 text-left">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Conversation Transcript
              </h4>
              <div className="max-h-52 overflow-y-auto bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
                {transcript.map((item) => (
                  <div key={item.id} className="space-y-0.5">
                    <span
                      className={`font-bold ${
                        item.speaker === 'agent' ? 'text-emerald-400' : 'text-sky-400'
                      }`}
                    >
                      {item.speaker === 'agent' ? 'Language Buddy: ' : 'You: '}
                    </span>
                    <span className="text-slate-300">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={onReturnToDashboard}
            className="w-full py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-colors cursor-pointer"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col min-h-[calc(100vh-5rem)]">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Languages className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white text-base">{targetLanguage}</span>
              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-semibold">
                {cefrLevel}
              </span>
            </div>
            <div className="text-xs text-slate-400">
              Support: <span className="text-slate-300">{nativeLanguage}</span>
            </div>
          </div>
        </div>

        {/* Timer & Progress */}
        <div className="flex items-center space-x-4 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
          <Clock className="w-4 h-4 text-emerald-400" />
          <div className="text-right">
            <div className="text-sm font-bold text-white font-mono">
              {formatTime(elapsedSeconds)} / {formatTime(targetMinutes * 60)}
            </div>
            <div className="w-24 bg-slate-800 h-1 rounded-full overflow-hidden mt-1">
              <div
                className="bg-emerald-400 h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Center Area: Visualizer & Transcript */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* Left Column: Audio Status & Voice Orb */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
          {/* Subtle background glow */}
          <div
            className={`absolute w-48 h-48 rounded-full blur-3xl transition-opacity duration-700 pointer-events-none ${
              agentSpeaking
                ? 'bg-emerald-500/20 opacity-100'
                : micVolume > 0.05
                ? 'bg-sky-500/20 opacity-100'
                : 'opacity-0'
            }`}
          />

          {/* Voice Orb */}
          <div className="relative my-6 flex items-center justify-center">
            {/* Outer animated rings */}
            <div
              className={`w-36 h-36 rounded-full border border-emerald-500/20 absolute transition-transform duration-150 ${
                agentSpeaking ? 'scale-125 animate-ping opacity-20' : ''
              }`}
              style={{
                transform: !agentSpeaking
                  ? `scale(${1 + Math.min(0.4, micVolume * 0.8)})`
                  : undefined,
              }}
            />
            <div
              className={`w-28 h-28 rounded-full flex items-center justify-center shadow-2xl transition-all duration-200 ${
                agentSpeaking
                  ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 scale-105 shadow-emerald-500/30'
                  : micVolume > 0.05
                  ? 'bg-gradient-to-tr from-sky-500 to-indigo-500 text-white scale-105 shadow-sky-500/30'
                  : 'bg-slate-800 border border-slate-700 text-slate-400'
              }`}
            >
              {agentSpeaking ? (
                <Volume2 className="w-12 h-12 animate-pulse" />
              ) : isMuted ? (
                <MicOff className="w-10 h-10 text-rose-400" />
              ) : (
                <Mic className="w-10 h-10" />
              )}
            </div>
          </div>

          {/* Status Label */}
          <div className="mt-2">
            <h3 className="text-base font-bold text-white">
              {status === 'connecting' || status === 'requesting_token'
                ? 'Opening Voice Channel...'
                : agentSpeaking
                ? 'Language Buddy Speaking...'
                : isMuted
                ? 'Microphone Muted'
                : micVolume > 0.05
                ? 'Listening to you...'
                : 'Your Turn to Speak'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              {topic ? `Topic: ${topic}` : 'Speak naturally in ' + targetLanguage}
            </p>
          </div>

          {/* Quick Tip Pill */}
          <div className="mt-5 space-y-2 w-full">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-400 flex items-start space-x-2 text-left">
              <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-200">Bilingual Support:</span>
                <br />
                Need help? Ask in <strong className="text-emerald-400">{nativeLanguage}</strong> anytime!
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 text-[11px] text-slate-500 text-center">
              🎧 Headphones recommended to avoid audio feedback
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex flex-col space-y-2.5 text-left w-full">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
              <div className="flex space-x-2 pt-1">
                <button
                  type="button"
                  onClick={onReturnToDashboard}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Transcripts */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col h-[480px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <h4 className="text-sm font-bold text-white">Live Conversation Transcript</h4>
            </div>
            <span className="text-xs text-slate-500">Real-time sync</span>
          </div>

          {/* Transcript Scroll Area */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {transcript.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 text-xs p-6">
                <div className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center mb-3">
                  <Mic className="w-5 h-5 text-slate-600" />
                </div>
                <p>Connecting with your AI tutor...</p>
                <p className="mt-1 text-slate-600">Both speakers will transcribe here in real time.</p>
              </div>
            ) : (
              transcript.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-start space-x-3 text-sm ${
                    item.speaker === 'agent' ? 'justify-start' : 'justify-end'
                  }`}
                >
                  {item.speaker === 'agent' && (
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 leading-relaxed ${
                      item.speaker === 'agent'
                        ? 'bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700/50'
                        : 'bg-emerald-600 text-slate-950 font-medium rounded-tr-sm shadow-md shadow-emerald-600/20'
                    }`}
                  >
                    <div
                      className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${
                        item.speaker === 'agent' ? 'text-emerald-400' : 'text-slate-950/70'
                      }`}
                    >
                      {item.speaker === 'agent' ? 'Language Buddy' : 'You'}
                    </div>
                    {item.text}
                  </div>

                  {item.speaker === 'learner' && (
                    <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={transcriptEndRef} />
          </div>
        </div>
      </div>

      {/* Bottom Controls Card */}
      <div className="mt-6 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleMute}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-colors cursor-pointer ${
              isMuted
                ? 'bg-rose-500 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span>{isMuted ? 'Unmute Mic' : 'Mute Mic'}</span>
          </button>

          {/* Real-time tutor speed selector */}
          {onUpdateSpeechRate && (
            <div className="hidden sm:flex items-center space-x-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400 mr-1 text-[11px]">Tutor Speed:</span>
              {[0.8, 0.9, 1.0, 1.1, 1.2].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => onUpdateSpeechRate(r)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                    Math.abs(speechRate - r) < 0.04
                      ? 'bg-emerald-500 text-slate-950'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {r}x
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={onStopSession}
          disabled={status === 'finishing'}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-rose-600/20 transition-colors cursor-pointer"
        >
          <PhoneOff className="w-4 h-4" />
          <span>{status === 'finishing' ? 'Analyzing & Saving Session...' : 'Finish & Save Session'}</span>
        </button>
      </div>
    </div>
  );
};
