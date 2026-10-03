import React, { useState, useEffect } from 'react';
import {
  HandDrawnPhone,
  HandDrawnArrowLeft,
  HandDrawnCheck,
  HandDrawnCross,
  HandDrawnBook,
} from '../HandDrawnIcons.js';
import { BUDDY_ASSETS } from '../../assets/buddyAssets.js';
import { PrivacyPolicyModal } from './PrivacyPolicyModal.js';
import { LiveSessionView } from '../LiveSessionView.js';
import { useGeminiLive } from '../../hooks/useGeminiLive.js';
import { useAuth } from '../../context/AuthContext.js';

const POPULAR_TARGET_LANGUAGES = [
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
  'English',
];

const ALL_LANGUAGES = [
  ...POPULAR_TARGET_LANGUAGES,
  'Dutch',
  'Polish',
  'Swedish',
  'Turkish',
  'Greek',
  'Hindi',
  'Vietnamese',
];

const AGE_OPTIONS = [
  '13 to 17',
  '18 to 25',
  '26 to 40',
  '41 to 60',
  '60+',
  'Under 13',
];

const ONBOARDING_STORAGE_KEY = 'lb_onboarding_state';

function detectDeviceLanguage(): string {
  if (typeof navigator === 'undefined') return 'English';
  const lang = (navigator.language || '').toLowerCase();
  if (lang.startsWith('es')) return 'Spanish';
  if (lang.startsWith('ja')) return 'Japanese';
  if (lang.startsWith('fr')) return 'French';
  if (lang.startsWith('de')) return 'German';
  if (lang.startsWith('it')) return 'Italian';
  if (lang.startsWith('pt')) return 'Portuguese';
  if (lang.startsWith('zh')) return 'Chinese (Mandarin)';
  if (lang.startsWith('ko')) return 'Korean';
  return 'English';
}

interface OnboardingFlowProps {
  onComplete: () => void;
  onOpenSignIn: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  onComplete,
  onOpenSignIn,
}) => {
  const { signup } = useAuth();
  const liveSession = useGeminiLive();

  // Restore state from localStorage if user refreshed mid-flow
  const [step, setStep] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.step && parsed.step >= 1 && parsed.step <= 6) {
          return parsed.step;
        }
      }
    } catch {
      // ignore
    }
    return 1;
  });

  const [targetLanguage, setTargetLanguage] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (saved) return JSON.parse(saved).targetLanguage || 'Spanish';
    } catch {}
    return 'Spanish';
  });

  const [nativeLanguage, setNativeLanguage] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (saved) return JSON.parse(saved).nativeLanguage || detectDeviceLanguage();
    } catch {}
    return detectDeviceLanguage();
  });

  const [ageRange, setAgeRange] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (saved) return JSON.parse(saved).ageRange || '';
    } catch {}
    return '';
  });

  const [searchTarget, setSearchTarget] = useState('');
  const [searchNative, setSearchNative] = useState('');

  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  const [callError, setCallError] = useState(false);

  // Analysis result for Screen 6
  const [analysisResult, setAnalysisResult] = useState<any>(() => {
    try {
      const saved = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (saved) return JSON.parse(saved).analysisResult || null;
    } catch {}
    return null;
  });

  // Screen 6 sign-up form
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [isSubmittingSignup, setIsSubmittingSignup] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);

  // Persist state updates to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        ONBOARDING_STORAGE_KEY,
        JSON.stringify({
          step,
          targetLanguage,
          nativeLanguage,
          ageRange,
          analysisResult,
        })
      );
    } catch {
      // ignore
    }
  }, [step, targetLanguage, nativeLanguage, ageRange, analysisResult]);

  // Request Microphone permission (Screen 4)
  const handleRequestMicrophone = async () => {
    setMicPermissionDenied(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop stream immediately after permission granted
      stream.getTracks().forEach((track) => track.stop());

      // Permission granted -> proceed to First Call (Step 5)
      setStep(5);
      startFirstCall();
    } catch (err) {
      console.warn('Microphone permission error:', err);
      setMicPermissionDenied(true);
    }
  };

  // Start the First Call with specialized system instruction (Screen 5)
  const startFirstCall = async () => {
    setCallError(false);
    try {
      const res = await fetch('/api/sessions/onboarding-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nativeLanguage,
          targetLanguage,
          ageRange,
          speechRate: 0.9,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to start first call');
      }

      liveSession.startSession({
        type: 'practice',
        nativeLanguage,
        targetLanguage,
        topic: 'First call with Buddy',
        speechRate: 0.9,
      });
    } catch (err) {
      console.error('Failed to launch first call:', err);
      setCallError(true);
    }
  };

  // Handle first call finish -> run analysis -> go to Screen 6
  const handleFirstCallEnd = async () => {
    liveSession.stopSession();

    try {
      const res = await fetch('/api/sessions/onboarding-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: liveSession.transcript.map((t) => ({
            speaker: t.speaker,
            text: t.text,
          })),
          nativeLanguage,
          targetLanguage,
          ageRange,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAnalysisResult(data.analysis);
      } else {
        setAnalysisResult({
          learnerName: 'Friend',
          priorStudy: 'Starting fresh',
          comfortLevel: 'Excited to practice',
          assessedCefrLevel: 'A1',
          cefrExplanation: 'You are beginning with foundational greetings and core spoken phrases.',
          firstWordLearned: targetLanguage === 'Spanish' ? 'Hola' : 'Hello',
          firstWordGloss: 'Hello',
          summary: 'Great first conversation with Buddy!',
        });
      }
    } catch {
      setAnalysisResult({
        learnerName: 'Friend',
        priorStudy: 'Starting fresh',
        comfortLevel: 'Ready to speak',
        assessedCefrLevel: 'A1',
        cefrExplanation: 'You are beginning with foundational greetings and core spoken phrases.',
        firstWordLearned: targetLanguage === 'Spanish' ? 'Hola' : 'Hello',
        firstWordGloss: 'Hello',
        summary: 'Great first conversation with Buddy!',
      });
    }

    setStep(6);
  };

  // Handle final signup on Screen 6
  const handleFinalSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);
    setIsSubmittingSignup(true);

    try {
      await signup(
        signupEmail,
        signupPassword,
        nativeLanguage,
        targetLanguage
      );

      // Clean up localStorage onboarding state
      localStorage.removeItem(ONBOARDING_STORAGE_KEY);
      onComplete();
    } catch (err) {
      setSignupError(err instanceof Error ? err.message : 'Failed to save account');
    } finally {
      setIsSubmittingSignup(false);
    }
  };

  // -------------------------------------------------------------
  // Screen 5: Active First Call View
  // -------------------------------------------------------------
  if (step === 5) {
    if (callError) {
      return (
        <div className="min-h-screen bg-[#FAF7F0] bg-sketchbook flex flex-col items-center justify-center p-6 text-center text-[#2B2B2B]">
          <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mb-3">
            <HandDrawnCross size={28} washColor="#FECACA" strokeColor="#2B2B2B" />
          </div>
          <h2 className="font-display font-bold text-lg text-[#2B2B2B]">Something went wrong</h2>
          <p className="text-xs text-stone-600 mt-1 mb-5 max-w-xs">
            We couldn’t connect to the voice loop right now. Would you like to try again or skip to save your settings?
          </p>
          <div className="flex gap-2 w-full max-w-xs">
            <button
              onClick={() => {
                setAnalysisResult({
                  learnerName: 'Friend',
                  priorStudy: 'Starting fresh',
                  comfortLevel: 'Ready to learn',
                  assessedCefrLevel: 'A1',
                  cefrExplanation: 'You are starting with foundational vocabulary and conversational greetings.',
                  firstWordLearned: targetLanguage === 'Spanish' ? 'Hola' : 'Hello',
                  firstWordGloss: 'Hello',
                  summary: 'Welcome to Language Buddy!',
                });
                setStep(6);
              }}
              className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl cursor-pointer"
            >
              Skip for now
            </button>
            <button
              onClick={startFirstCall}
              className="flex-1 py-2.5 bg-[#2B2B2B] hover:bg-stone-800 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return (
      <LiveSessionView
        status={liveSession.status}
        sessionType="practice"
        error={liveSession.error}
        isMuted={liveSession.isMuted}
        speechRate={liveSession.speechRate}
        echoGuard={liveSession.echoGuard}
        micVolume={liveSession.micVolume}
        agentSpeaking={liveSession.agentSpeaking}
        elapsedSeconds={liveSession.elapsedSeconds}
        targetMinutes={5}
        transcript={liveSession.transcript}
        sessionAnalysis={liveSession.sessionAnalysis}
        nativeLanguage={nativeLanguage}
        targetLanguage={targetLanguage}
        cefrLevel="A1"
        topic={`Meet Buddy & Start ${targetLanguage}`}
        onToggleMute={liveSession.toggleMute}
        onToggleEchoGuard={liveSession.toggleEchoGuard}
        onInterruptTutor={liveSession.interruptTutor}
        onUpdateSpeechRate={liveSession.updateSpeechRate}
        onStopSession={handleFirstCallEnd}
        onReturnToDashboard={handleFirstCallEnd}
      />
    );
  }

  // -------------------------------------------------------------
  // Screens 1, 2, 3, 4, 6 (Step by Step)
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#FAF7F0] bg-sketchbook text-[#2B2B2B] flex flex-col justify-between p-4 sm:p-6 max-w-md mx-auto w-full">
      {/* Top Header & Navigation (Screens 2 to 4) */}
      {step >= 2 && step <= 4 && (
        <div className="pt-safe pb-2">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="w-8 h-8 rounded-full bg-white shadow-xs border border-stone-200 flex items-center justify-center text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <HandDrawnArrowLeft size={16} strokeColor="#2B2B2B" />
            </button>
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              Step {step - 1} of 3
            </span>
            <div className="w-8" />
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{ width: `${((step - 1) / 3) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Screen Content */}
      <div className="flex-1 flex flex-col justify-center py-4">
        {/* ========================================================= */}
        {/* SCREEN 1: WELCOME                                         */}
        {/* ========================================================= */}
        {step === 1 && (
          <div className="flex flex-col items-center text-center space-y-5">
            <div className="w-28 h-28 rounded-full overflow-hidden shadow-md bg-orange-100 ring-4 ring-orange-300/60 animate-gentle-float flex items-center justify-center">
              <img
                src={BUDDY_ASSETS.wavingHappy}
                alt="Buddy waving"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-2">
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#2B2B2B] tracking-tight">
                Practice speaking on your walk.
              </h1>
              <p className="text-sm text-stone-600 font-medium max-w-xs mx-auto leading-relaxed">
                Talk with Buddy. Stuck? Say it in your language.
              </p>
            </div>

            <div className="w-full pt-4 space-y-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-[#020617] font-bold text-sm shadow-md shadow-emerald-950/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Get started</span>
                <HandDrawnPhone size={16} washColor="#BAF7D0" strokeColor="#020617" />
              </button>

              <button
                type="button"
                onClick={onOpenSignIn}
                className="w-full py-2 text-xs font-semibold text-stone-500 hover:text-stone-800 cursor-pointer"
              >
                Already have an account? Sign in
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SCREEN 2: LANGUAGES (both on one screen)                  */}
        {/* ========================================================= */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="text-left space-y-1">
              <h2 className="font-display font-extrabold text-2xl text-[#2B2B2B] tracking-tight">
                Choose your languages
              </h2>
              <p className="text-xs text-stone-600 font-medium">
                Buddy will converse in your target language and assist in your support language.
              </p>
            </div>

            {/* Target Language Selection */}
            <div className="p-4 rounded-3xl bg-white shadow-xs border border-stone-200/80 space-y-2 text-left">
              <label className="block text-xs font-bold text-[#2B2B2B]">
                I want to speak:
              </label>
              <input
                type="text"
                placeholder="Search language (e.g. Spanish, Japanese)..."
                value={searchTarget}
                onChange={(e) => setSearchTarget(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#FAF7F0] border border-stone-300 rounded-xl text-xs text-[#2B2B2B] focus:outline-none focus:ring-1 focus:ring-emerald-500 mb-1"
              />
              <select
                size={4}
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="w-full p-2 bg-[#FAF7F0] border border-stone-300 rounded-xl text-xs font-bold text-[#2B2B2B] focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {ALL_LANGUAGES.filter((l) =>
                  l.toLowerCase().includes(searchTarget.toLowerCase())
                ).map((lang) => (
                  <option key={`target-${lang}`} value={lang} className="py-1 px-2">
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            {/* Native Language Selection */}
            <div className="p-4 rounded-3xl bg-white shadow-xs border border-stone-200/80 space-y-2 text-left">
              <label className="block text-xs font-bold text-[#2B2B2B]">
                My first language (support):
              </label>
              <input
                type="text"
                placeholder="Search language (e.g. English)..."
                value={searchNative}
                onChange={(e) => setSearchNative(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#FAF7F0] border border-stone-300 rounded-xl text-xs text-[#2B2B2B] focus:outline-none focus:ring-1 focus:ring-emerald-500 mb-1"
              />
              <select
                size={3}
                value={nativeLanguage}
                onChange={(e) => setNativeLanguage(e.target.value)}
                className="w-full p-2 bg-[#FAF7F0] border border-stone-300 rounded-xl text-xs font-bold text-[#2B2B2B] focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {ALL_LANGUAGES.filter((l) =>
                  l.toLowerCase().includes(searchNative.toLowerCase())
                ).map((lang) => (
                  <option key={`native-${lang}`} value={lang} className="py-1 px-2">
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            {nativeLanguage.toLowerCase() === targetLanguage.toLowerCase() && (
              <p className="text-[11px] text-rose-600 font-semibold text-center">
                Please select two different languages.
              </p>
            )}

            <button
              type="button"
              disabled={
                !targetLanguage ||
                !nativeLanguage ||
                targetLanguage.toLowerCase() === nativeLanguage.toLowerCase()
              }
              onClick={() => setStep(3)}
              className="w-full py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 disabled:opacity-40 text-[#020617] font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              Next
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* SCREEN 3: AGE                                             */}
        {/* ========================================================= */}
        {step === 3 && (
          <div className="space-y-4 text-left">
            {ageRange === 'Under 13' ? (
              // Under 13 Gate with Buddy waving and no way forward
              <div className="p-6 rounded-3xl bg-white shadow-sm border border-stone-200 text-center space-y-4">
                <div className="w-20 h-20 rounded-full overflow-hidden shadow-xs bg-orange-100 ring-2 ring-orange-300 mx-auto flex items-center justify-center animate-gentle-float">
                  <img
                    src={BUDDY_ASSETS.wavingHappy}
                    alt="Buddy waving goodbye"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-display font-bold text-base text-[#2B2B2B]">
                  Buddy is for people 13 and older for now.
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed font-medium">
                  We hope to see you soon when you turn 13!
                </p>
                <button
                  type="button"
                  onClick={() => setAgeRange('')}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Back to choices
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <h2 className="font-display font-extrabold text-2xl text-[#2B2B2B] tracking-tight">
                    How old are you?
                  </h2>
                  <p className="text-xs text-stone-600 font-medium">
                    So Buddy can suggest topics that fit your life.
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  {AGE_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setAgeRange(opt)}
                      className={`w-full p-3.5 rounded-2xl border text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                        ageRange === opt
                          ? 'bg-[#2B2B2B] text-white border-[#2B2B2B] shadow-xs'
                          : 'bg-white/90 border-stone-200/80 text-stone-800 hover:bg-white'
                      }`}
                    >
                      <span>{opt}</span>
                      {ageRange === opt && (
                        <HandDrawnCheck size={14} washColor="#86EFAC" strokeColor="#FFFFFF" />
                      )}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={!ageRange}
                  onClick={() => setStep(4)}
                  className="w-full mt-4 py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 disabled:opacity-40 text-[#020617] font-bold text-sm shadow-md transition-all cursor-pointer"
                >
                  Next
                </button>
              </>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* SCREEN 4: PRIVACY AND MICROPHONE                          */}
        {/* ========================================================= */}
        {step === 4 && (
          <div className="space-y-5 text-left">
            <div className="space-y-1">
              <h2 className="font-display font-extrabold text-2xl text-[#2B2B2B] tracking-tight">
                Privacy & Microphone
              </h2>
              <p className="text-xs text-stone-600 font-medium leading-relaxed">
                Buddy listens only during calls. We save transcripts, not audio. You can delete everything anytime.
              </p>
            </div>

            <div className="p-4 rounded-3xl bg-white shadow-xs border border-stone-200/80 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                <HandDrawnCheck size={14} washColor="#86EFAC" strokeColor="#065F46" />
                <span>Audio is never stored on disk</span>
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed font-medium">
                Voice is converted to text for your personal spaced repetition schedule. We discard raw sound immediately after processing.
              </p>
              <button
                type="button"
                onClick={() => setShowPrivacyModal(true)}
                className="text-xs text-emerald-700 underline font-bold cursor-pointer block"
              >
                Read our Privacy policy
              </button>
            </div>

            {micPermissionDenied && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1.5">
                <span className="font-bold block">Microphone access needed</span>
                <p className="text-[11px] text-rose-700">
                  Please tap the lock or camera/mic icon in your browser's address bar to allow microphone access, then click Try Again.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={handleRequestMicrophone}
              className="w-full py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-[#020617] font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{micPermissionDenied ? 'Try again' : 'Allow microphone and start'}</span>
              <HandDrawnPhone size={16} washColor="#BAF7D0" strokeColor="#020617" />
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* SCREEN 6: RECAP AND SAVE                                  */}
        {/* ========================================================= */}
        {step === 6 && (
          <div className="space-y-4 text-left">
            <div className="text-center space-y-1">
              <div className="w-16 h-16 rounded-full overflow-hidden shadow-xs bg-orange-100 ring-2 ring-orange-300 mx-auto mb-2 flex items-center justify-center">
                <img
                  src={BUDDY_ASSETS.wavingHappy}
                  alt="Buddy happy"
                  className="w-full h-full object-cover"
                />
              </div>
              <h2 className="font-display font-extrabold text-xl sm:text-2xl text-[#2B2B2B]">
                Nice to meet you, {analysisResult?.learnerName || 'Friend'}!
              </h2>
              <p className="text-xs text-stone-600 font-medium">
                Here is your starting snapshot in {targetLanguage}:
              </p>
            </div>

            {/* Assessment Cards */}
            <div className="p-4 rounded-3xl bg-gradient-to-br from-[#FFE3D6] via-[#FFD8C7] to-[#FFCEB8] shadow-xs border border-orange-200/60 text-left space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-950/70">
                Your Starting Level
              </span>
              <div className="font-display font-extrabold text-2xl text-[#2B2B2B]">
                Level {analysisResult?.assessedCefrLevel || 'A1'}
              </div>
              <p className="text-xs text-[#2B2B2B]/80 font-medium leading-relaxed">
                {analysisResult?.cefrExplanation ||
                  'You are beginning with core everyday greetings and practical spoken phrases.'}
              </p>
            </div>

            {/* First Word Card */}
            <div className="p-3.5 rounded-3xl bg-white shadow-xs border border-stone-200/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                  Your First Word
                </span>
                <span className="text-base font-display font-extrabold text-emerald-800">
                  {analysisResult?.firstWordLearned || (targetLanguage === 'Spanish' ? 'Hola' : 'Hello')}
                </span>
                <span className="text-xs text-stone-500 ml-1.5 font-medium">
                  ({analysisResult?.firstWordGloss || 'Hello'})
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                Saved in Memory
              </span>
            </div>

            {/* Save Progress Account Form */}
            <div className="p-4 rounded-3xl bg-white shadow-xs border border-stone-200/80 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#2B2B2B]">
                <HandDrawnBook size={14} washColor="#FED7AA" strokeColor="#2B2B2B" />
                <span>Save your progress to keep learning</span>
              </div>

              {signupError && (
                <p className="text-xs text-rose-600 font-semibold">{signupError}</p>
              )}

              <form onSubmit={handleFinalSignup} className="space-y-2.5">
                <div>
                  <input
                    type="email"
                    required
                    placeholder="Email address"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF7F0] border border-stone-300 rounded-xl text-xs text-[#2B2B2B] focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
                <div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Create a password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF7F0] border border-stone-300 rounded-xl text-xs text-[#2B2B2B] focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmittingSignup}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-[#020617] font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingSignup ? 'Saving...' : 'Save progress & enter Home'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Privacy Policy Modal */}
      <PrivacyPolicyModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />
    </div>
  );
};
