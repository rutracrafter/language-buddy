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
} from 'lucide-react';
import { LiveTranscriptItem, LiveSessionStatus } from '../hooks/useGeminiLive.js';

interface LiveSessionViewProps {
  status: LiveSessionStatus;
  error: string | null;
  isMuted: boolean;
  micVolume: number;
  agentSpeaking: boolean;
  elapsedSeconds: number;
  targetMinutes: number;
  transcript: LiveTranscriptItem[];
  nativeLanguage: string;
  targetLanguage: string;
  cefrLevel: string;
  topic?: string;
  onToggleMute: () => void;
  onStopSession: () => void;
  onReturnToDashboard: () => void;
}

export const LiveSessionView: React.FC<LiveSessionViewProps> = ({
  status,
  error,
  isMuted,
  micVolume,
  agentSpeaking,
  elapsedSeconds,
  targetMinutes,
  transcript,
  nativeLanguage,
  targetLanguage,
  cefrLevel,
  topic,
  onToggleMute,
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
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/10">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">Session Complete!</h2>
          <p className="text-slate-400 text-sm mb-6">
            Your conversation in {targetLanguage} has been recorded and saved to your history.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8 text-left">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-500 font-medium">Practice Duration</div>
              <div className="text-xl font-bold text-emerald-400 mt-1">
                {formatTime(elapsedSeconds)}
              </div>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-500 font-medium">Conversation Turns</div>
              <div className="text-xl font-bold text-white mt-1">
                {transcript.length} turns
              </div>
            </div>
          </div>

          {transcript.length > 0 && (
            <div className="mb-8 text-left">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Session Transcript Preview
              </h4>
              <div className="max-h-60 overflow-y-auto bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
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
            className="w-full py-3 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-colors"
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
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
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
                <p>Say hello to your tutor to begin...</p>
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
      <div className="mt-6 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleMute}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-colors ${
              isMuted
                ? 'bg-rose-500 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span>{isMuted ? 'Unmute Mic' : 'Mute Mic'}</span>
          </button>
        </div>

        <button
          onClick={onStopSession}
          disabled={status === 'finishing'}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-rose-600/20 transition-colors"
        >
          <PhoneOff className="w-4 h-4" />
          <span>{status === 'finishing' ? 'Saving Session...' : 'Finish & Save Session'}</span>
        </button>
      </div>
    </div>
  );
};
