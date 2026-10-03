import React, { useEffect, useRef } from 'react';
import {
  HandDrawnMic,
  HandDrawnMicOff,
  HandDrawnCross,
  HandDrawnSpeaker,
  HandDrawnSparkle,
  HandDrawnCheck,
  HandDrawnBook,
} from './HandDrawnIcons.js';
import { LiveTranscriptItem, LiveSessionStatus } from '../hooks/useGeminiLive.js';
import { BUDDY_ASSETS } from '../assets/buddyAssets.js';

interface LiveSessionViewProps {
  status: LiveSessionStatus;
  sessionType?: 'placement' | 'practice';
  error: string | null;
  isMuted: boolean;
  speechRate?: number;
  echoGuard?: boolean;
  micVolume: number;
  agentSpeaking: boolean;
  elapsedSeconds: number;
  targetMinutes?: number;
  transcript: LiveTranscriptItem[];
  sessionAnalysis?: any;
  nativeLanguage: string;
  targetLanguage: string;
  cefrLevel: string;
  topic?: string;
  onToggleMute: () => void;
  onToggleEchoGuard?: () => void;
  onInterruptTutor?: () => void;
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
  echoGuard = true,
  micVolume,
  agentSpeaking,
  elapsedSeconds,
  transcript,
  sessionAnalysis,
  nativeLanguage,
  targetLanguage,
  cefrLevel,
  topic,
  onToggleMute,
  onToggleEchoGuard,
  onInterruptTutor,
  onUpdateSpeechRate,
  onStopSession,
  onReturnToDashboard,
}) => {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll chat to bottom as new speech arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, agentSpeaking]);

  const formatDuration = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // -------------------------------------------------------------
  // Post-Session Summary Screen (Matches PostCallSummaryScreen.tsx)
  // -------------------------------------------------------------
  if (status === 'finished') {
    const isPlacement = sessionType === 'placement';

    return (
      <div className="flex-1 flex flex-col justify-between bg-[#FAF7F0] bg-sketchbook text-[#2B2B2B] p-4 sm:p-6 max-w-xl mx-auto w-full overflow-y-auto">
        {/* Top Section: Mascot & Greeting */}
        <div className="flex flex-col items-center pt-2 pb-2 text-center">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden shadow-md bg-gradient-to-b from-orange-100 to-orange-200/50 p-1 flex items-center justify-center animate-gentle-float">
            <img
              src={BUDDY_ASSETS.wavingHappy}
              alt="Buddy celebrating after session"
              className="w-full h-full object-cover rounded-full"
            />
          </div>

          <div className="mt-3 space-y-1">
            <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2B2B2B] bg-white/80 px-3 py-1 rounded-full shadow-2xs border border-stone-200/60">
              <span>🌱</span>
              <span>Practiced {targetLanguage}</span>
            </div>

            <h2 className="font-display font-bold text-[#2B2B2B] text-xl sm:text-2xl tracking-tight">
              {isPlacement ? 'Placement Assessment Complete!' : 'You had a great conversation!'}
            </h2>

            <div className="flex items-center justify-center gap-2 text-xs text-[#2B2B2B]/70 font-medium">
              <span>{topic || 'Conversation'}</span>
              <span>·</span>
              <span className="tabular-nums font-mono">{formatDuration(elapsedSeconds)} talk</span>
            </div>
          </div>
        </div>

        {/* Placement Result Banner */}
        {isPlacement && sessionAnalysis?.level && (
          <div className="my-3 p-4 rounded-3xl bg-gradient-to-br from-[#FFE3D6] via-[#FFD8C7] to-[#FFCEB8] shadow-xs text-center border border-orange-200/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-950/70 block">
              Assigned CEFR Level
            </span>
            <div className="font-display font-extrabold text-3xl sm:text-4xl text-[#2B2B2B] my-1">
              Level {sessionAnalysis.level.overall}
            </div>
            <div className="text-xs text-[#2B2B2B]/80 font-medium">
              Speaking: <strong>{sessionAnalysis.level.speaking}</strong> · Listening: <strong>{sessionAnalysis.level.listening}</strong> · Confidence: <strong>{Math.round((sessionAnalysis.levelConfidence || 0.65) * 100)}%</strong>
            </div>
            <div className="flex justify-center gap-6 mt-3 pt-2.5 border-t border-orange-300/40 text-xs text-[#2B2B2B]">
              <div>Floor: <strong>{sessionAnalysis.floorLevel}</strong></div>
              <div>Ceiling: <strong>{sessionAnalysis.ceilingLevel}</strong></div>
            </div>
          </div>
        )}

        {/* Key Takeaways Card */}
        <div className="space-y-3 py-2 text-left">
          {sessionAnalysis?.summary && (
            <div className="p-4 rounded-3xl bg-gradient-to-br from-[#FFE3D6] via-[#FFD8C7] to-[#FFCEB8] shadow-xs border border-orange-200/60">
              <div className="flex items-center gap-1.5 text-[#2B2B2B] text-xs font-bold uppercase tracking-wider mb-2">
                <HandDrawnSparkle size={15} washColor="#FEF08A" strokeColor="#2B2B2B" />
                <span>Key Takeaways</span>
              </div>
              <ul className="space-y-2 text-xs text-[#2B2B2B] font-medium leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2B2B2B] mt-1.5 shrink-0" />
                  <span>
                    <strong>What went well:</strong> {sessionAnalysis.summary.whatWentWell || sessionAnalysis.summary.strengths}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2B2B2B] mt-1.5 shrink-0" />
                  <span>
                    <strong>Next focus:</strong> {sessionAnalysis.summary.nextFocus || sessionAnalysis.summary.nextSteps}
                  </span>
                </li>
              </ul>
            </div>
          )}

          {/* Evaluated Items & New Words */}
          {sessionAnalysis?.itemsReviewed && sessionAnalysis.itemsReviewed.length > 0 && (
            <div className="p-4 rounded-3xl bg-white/90 shadow-xs border border-stone-200/80">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#2B2B2B] mb-2.5">
                <HandDrawnCheck size={14} washColor="#86EFAC" strokeColor="#2B2B2B" />
                <span>Vocabulary & Patterns Evaluated</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {sessionAnalysis.itemsReviewed.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-2xl bg-[#FAF7F0] border border-stone-200/60 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-[#2B2B2B]">{item.text}</span>
                      <span className="text-stone-500 ml-1">({item.gloss})</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 capitalize">
                      {item.outcome}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unlocked Starter Items for Placement */}
          {sessionAnalysis?.starterItems && sessionAnalysis.starterItems.length > 0 && (
            <div className="p-4 rounded-3xl bg-white/90 shadow-xs border border-stone-200/80">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#2B2B2B] mb-2.5">
                <HandDrawnBook size={15} washColor="#FED7AA" strokeColor="#2B2B2B" />
                <span>Recommended Starter Items</span>
              </div>
              <div className="space-y-1.5 text-xs">
                {sessionAnalysis.starterItems.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-2xl bg-[#FAF7F0] border border-stone-200/60 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-[#2B2B2B]">{item.text}</span>
                      <span className="text-stone-500 ml-1.5">— {item.gloss}</span>
                    </div>
                    <span className="text-[10px] font-bold bg-white text-stone-700 px-2 py-0.5 rounded-full border border-stone-200">
                      {item.cefrLevel}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transcript Preview */}
          <div className="p-4 rounded-3xl bg-white/90 shadow-xs border border-stone-200/80">
            <h4 className="text-xs font-bold text-[#2B2B2B] mb-2">Transcript Preview</h4>
            <div className="max-h-48 overflow-y-auto space-y-2 text-xs pr-1">
              {transcript.map((item) => (
                <p key={item.id} className="leading-relaxed">
                  <span
                    className={`font-bold ${
                      item.speaker === 'agent' ? 'text-orange-600' : 'text-sky-600'
                    }`}
                  >
                    {item.speaker === 'agent' ? 'Buddy: ' : 'You: '}
                  </span>
                  <span className="text-stone-700">{item.text}</span>
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Return Button */}
        <button
          onClick={onReturnToDashboard}
          className="w-full py-3.5 px-4 rounded-2xl bg-[#2B2B2B] hover:bg-stone-800 active:scale-95 text-white font-bold text-sm shadow-md transition-all cursor-pointer mt-2"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Active Call Screen (Matches ActiveCallScreen.tsx)
  // -------------------------------------------------------------
  return (
    <div className="flex-1 flex flex-col justify-between bg-[#FAF7F0] bg-sketchbook text-[#2B2B2B] p-3 sm:p-4 max-w-xl mx-auto w-full h-[calc(100vh-4rem)] overflow-hidden relative">
      {/* Top Header: Buddy Avatar + Name + Live Duration */}
      <div className="flex flex-col items-center pt-1 pb-1 text-center relative z-10">
        <div className="relative group">
          {agentSpeaking && (
            <>
              <div className="absolute -inset-2.5 rounded-full bg-orange-300/40 animate-ping opacity-75 pointer-events-none" />
              <div className="absolute -inset-1 rounded-full bg-orange-400/25 blur-sm pointer-events-none" />
            </>
          )}

          <div className="relative w-16 h-16 rounded-full overflow-hidden shadow-md bg-orange-100 flex items-center justify-center ring-2 ring-orange-300">
            <img
              src={
                agentSpeaking
                  ? BUDDY_ASSETS.talkingExcited
                  : BUDDY_ASSETS.listeningSleepy
              }
              alt={agentSpeaking ? 'Buddy talking animatedly' : 'Buddy listening gently'}
              className="w-full h-full object-cover transition-all duration-300"
            />
          </div>
        </div>

        <h2 className="mt-1 font-display font-extrabold text-[#2B2B2B] text-xs sm:text-sm tracking-widest uppercase">
          BUDDY
        </h2>

        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[10px] text-[#2B2B2B]/60 font-medium">duration</span>
          <span className="text-xs font-mono font-bold text-[#2B2B2B] tabular-nums">
            {formatDuration(elapsedSeconds)}
          </span>
          <span className="text-[10px] font-bold text-stone-600 bg-white/70 px-1.5 py-0.5 rounded-md border border-stone-200">
            {cefrLevel}
          </span>
          <span
            className={`w-1.5 h-1.5 rounded-full ml-0.5 ${
              agentSpeaking ? 'bg-orange-500 animate-ping' : 'bg-emerald-500 animate-pulse'
            }`}
          />
        </div>

        {agentSpeaking && onInterruptTutor && (
          <button
            type="button"
            onClick={onInterruptTutor}
            className="mt-1.5 px-3 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-full text-[10px] font-bold transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs"
          >
            <span>Interrupt & Speak</span>
          </button>
        )}
      </div>

      {/* Middle Scrollable Transcript: ONLY logs what was said in the conversation */}
      <div className="flex-1 overflow-y-auto px-1 py-1.5 space-y-2.5 scrollbar-none my-1 max-h-[300px]">
        {/* Call start badge */}
        <div className="flex justify-center my-1">
          <span className="text-[10px] font-medium text-stone-500 bg-white/70 px-2.5 py-0.5 rounded-full shadow-2xs border border-stone-200/40">
            Spoken practice in {targetLanguage} · Voice only
          </span>
        </div>

        {transcript.length === 0 ? (
          <div className="text-center py-6 text-xs text-stone-500">
            Say hello to Buddy to begin speaking...
          </div>
        ) : (
          transcript.map((msg) => {
            const isBuddy = msg.speaker === 'agent';
            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${isBuddy ? 'justify-start' : 'justify-end'}`}
              >
                {isBuddy && (
                  <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 bg-orange-100 mb-1 shadow-2xs ring-1 ring-orange-200">
                    <img
                      src={BUDDY_ASSETS.talkingExcited}
                      alt="Buddy speaking"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div
                  className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                    isBuddy
                      ? 'bg-[#FFBEA3] text-[#2B2B2B] rounded-bl-xs font-medium'
                      : 'bg-[#BAC8FF] text-[#2B2B2B] rounded-br-xs font-medium'
                  }`}
                >
                  <p>{msg.text}</p>
                  <span className="block text-[9px] mt-1 text-right tabular-nums opacity-60">
                    {new Date(msg.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        )}

        {/* Live Audio indicator when Buddy is speaking or listening */}
        <div className="flex items-center justify-between px-2 py-1 text-[11px] text-[#2B2B2B]/70">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                agentSpeaking ? 'bg-orange-500 animate-pulse' : 'bg-emerald-500 animate-pulse'
              }`}
            />
            <span className="font-medium text-[11px]">
              {agentSpeaking
                ? 'Buddy is speaking...'
                : micVolume > 0.05
                ? 'Buddy is listening to your voice'
                : 'Your turn to speak'}
            </span>
          </div>

          <div className="flex items-center gap-1 h-4">
            {[6, 14, 22, 10, 24, 12, 18, 8].map((h, i) => (
              <div
                key={i}
                className="w-0.5 bg-[#2B2B2B] rounded-full transition-all duration-200"
                style={{
                  height: agentSpeaking
                    ? `${Math.max(4, (h * (elapsedSeconds % 3 + 1)) % 20)}px`
                    : micVolume > 0.05
                    ? `${Math.max(4, micVolume * 24)}px`
                    : '3px',
                  opacity: agentSpeaking || micVolume > 0.05 ? 0.9 : 0.35,
                }}
              />
            ))}
          </div>
        </div>

        <div ref={messagesEndRef} />
      </div>

      {/* Buddy's Notepad Window at Bottom of Chat */}
      <div className="relative rounded-2xl bg-white/95 shadow-md p-3.5 my-1.5 transition-all text-left border border-stone-200/80">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full overflow-hidden shadow-2xs shrink-0 bg-orange-100 ring-1 ring-orange-200">
              <img
                src={BUDDY_ASSETS.wavingHappy}
                alt="Buddy notepad"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h4 className="font-display font-bold text-xs text-[#2B2B2B] leading-none">
                Buddy's Notepad
              </h4>
              <p className="text-[9px] text-[#2B2B2B]/60 font-medium mt-0.5">
                Target Language Scaffolding & Live Evaluated Words
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold shadow-2xs">
            <HandDrawnCheck size={11} washColor="#86EFAC" strokeColor="#065F46" />
            <span>Active Memory</span>
          </div>
        </div>

        <div className="text-xs text-stone-700 leading-snug">
          <p className="font-medium">
            <strong className="text-[#2B2B2B]">Topic:</strong> {topic}
          </p>
          <p className="text-[11px] text-stone-500 mt-1">
            Tip: Need clarification or vocabulary help? Ask in <strong>{nativeLanguage}</strong> anytime!
          </p>
        </div>
      </div>

      {error && (
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 mb-1">
          {error}
        </div>
      )}

      {/* Real-time Tutor Speed Selector */}
      {onUpdateSpeechRate && (
        <div className="flex items-center justify-center gap-1.5 py-1">
          <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Speed:</span>
          {[0.8, 1.0, 1.2].map((r) => (
            <button
              key={r}
              onClick={() => onUpdateSpeechRate(r)}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                Math.abs((speechRate || 1.0) - r) < 0.05
                  ? 'bg-[#2B2B2B] text-white shadow-2xs'
                  : 'bg-white/80 text-stone-600 hover:bg-white border border-stone-200'
              }`}
            >
              {r}x
            </button>
          ))}
        </div>
      )}

      {/* Bottom Controls Bar: Mute, END CALL Button, Speaker */}
      <div className="pt-2 pb-1 flex items-center justify-around bg-[#FAF7F0] border-t border-stone-200/60 pb-safe">
        {/* Mute Button */}
        <button
          onClick={onToggleMute}
          className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-colors cursor-pointer ${
            isMuted ? 'text-red-600 bg-red-50' : 'text-[#2B2B2B] hover:bg-stone-200/50'
          }`}
          aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          <div className="w-11 h-11 rounded-full bg-white shadow-xs flex items-center justify-center border border-stone-200/80">
            {isMuted ? (
              <HandDrawnMicOff size={22} washColor="#FECACA" strokeColor="#2B2B2B" />
            ) : (
              <HandDrawnMic size={22} washColor="#FED7AA" strokeColor="#2B2B2B" />
            )}
          </div>
          <span className="text-[10px] font-bold">{isMuted ? 'Muted' : 'Mute'}</span>
        </button>

        {/* Big End Call Action Button */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={onStopSession}
            disabled={status === 'finishing'}
            aria-label="End call with Buddy"
            className="w-16 h-16 rounded-full bg-[#EA4326] hover:bg-[#D9381E] active:scale-95 text-white flex items-center justify-center shadow-lg shadow-red-950/20 transition-all cursor-pointer group"
          >
            <HandDrawnCross
              size={28}
              washColor="#FCA5A5"
              strokeColor="#2B2B2B"
              strokeWidth={3}
              className="transition-transform group-hover:rotate-90"
            />
          </button>
          <span className="text-[10px] font-extrabold text-[#2B2B2B] tracking-wider uppercase">
            {status === 'finishing' ? 'SAVING...' : 'END CALL'}
          </span>
        </div>

        {/* Speaker / Echo Guard Button */}
        <button
          onClick={onToggleEchoGuard}
          className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-colors cursor-pointer ${
            echoGuard ? 'text-[#2B2B2B]' : 'text-stone-400 hover:bg-stone-200/50'
          }`}
          aria-label={echoGuard ? 'Echo Guard is on' : 'Echo Guard is off'}
        >
          <div className="w-11 h-11 rounded-full bg-white shadow-xs flex items-center justify-center border border-stone-200/80">
            <HandDrawnSpeaker
              size={22}
              washColor={echoGuard ? '#BAE6FD' : 'transparent'}
              strokeColor="#2B2B2B"
            />
          </div>
          <span className="text-[10px] font-bold">{echoGuard ? 'Speaker' : 'Headphones'}</span>
        </button>
      </div>
    </div>
  );
};
