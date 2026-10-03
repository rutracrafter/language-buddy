import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { HandDrawnPhone, HandDrawnSparkle } from '../components/HandDrawnIcons.js';
import { BUDDY_ASSETS } from '../assets/buddyAssets.js';

const COMMON_LANGUAGES = [
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

export const AuthPage: React.FC = () => {
  const { login, signup } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nativeLanguage, setNativeLanguage] = useState('English');
  const [targetLanguage, setTargetLanguage] = useState('Spanish');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (isSignUp) {
        if (nativeLanguage.trim().toLowerCase() === targetLanguage.trim().toLowerCase()) {
          throw new Error('Native and target languages must be different');
        }
        await signup(email, password, nativeLanguage, targetLanguage);
      } else {
        await login(email, password);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-10 px-4 sm:px-6 bg-[#FAF7F0] bg-sketchbook text-[#2B2B2B]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Floating Mascot Avatar */}
        <div className="w-24 h-24 rounded-full overflow-hidden shadow-md bg-orange-100 ring-4 ring-orange-300/60 mx-auto mb-4 animate-gentle-float flex items-center justify-center">
          <img
            src={BUDDY_ASSETS.wavingHappy}
            alt="Buddy mascot"
            className="w-full h-full object-cover"
          />
        </div>
        <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight text-[#2B2B2B]">
          Language Buddy
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-stone-600 font-medium">
          Your warm AI voice companion for spoken language practice
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/95 rounded-[32px] p-6 sm:p-8 shadow-sm border border-stone-200/80">
          {/* Tab Selector */}
          <div className="flex border-b border-stone-200 mb-6">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setError(null);
              }}
              className={`flex-1 pb-3 text-sm font-bold text-center border-b-2 transition-colors cursor-pointer ${
                !isSignUp
                  ? 'border-emerald-500 text-emerald-700'
                  : 'border-transparent text-stone-400 hover:text-stone-700'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setError(null);
              }}
              className={`flex-1 pb-3 text-sm font-bold text-center border-b-2 transition-colors cursor-pointer ${
                isSignUp
                  ? 'border-emerald-500 text-emerald-700'
                  : 'border-transparent text-stone-400 hover:text-stone-700'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 bg-[#FAF7F0] border border-stone-300 rounded-xl text-[#2B2B2B] placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-[#FAF7F0] border border-stone-300 rounded-xl text-[#2B2B2B] placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>

            {isSignUp && (
              <div className="space-y-3 pt-2 border-t border-stone-200">
                <div className="flex items-center text-xs text-emerald-700 font-bold">
                  <HandDrawnSparkle size={14} washColor="#86EFAC" strokeColor="#065F46" className="mr-1" />
                  Initial Language Pair
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-stone-600 font-medium mb-1">
                      Support Language
                    </label>
                    <select
                      value={nativeLanguage}
                      onChange={(e) => setNativeLanguage(e.target.value)}
                      className="w-full px-2.5 py-2 bg-[#FAF7F0] border border-stone-300 rounded-xl text-[#2B2B2B] text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      {COMMON_LANGUAGES.map((lang) => (
                        <option key={`native-${lang}`} value={lang}>
                          {lang}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-stone-600 font-medium mb-1">
                      Target Language
                    </label>
                    <select
                      value={targetLanguage}
                      onChange={(e) => setTargetLanguage(e.target.value)}
                      className="w-full px-2.5 py-2 bg-[#FAF7F0] border border-stone-300 rounded-xl text-[#2B2B2B] text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      {COMMON_LANGUAGES.map((lang) => (
                        <option key={`target-${lang}`} value={lang}>
                          {lang}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 flex items-center justify-center py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-50 text-[#020617] font-bold text-sm shadow-md shadow-emerald-950/20 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                'Connecting...'
              ) : isSignUp ? (
                <>
                  <HandDrawnPhone size={18} washColor="#BAF7D0" strokeColor="#020617" className="mr-2" />
                  Create Account & Ring Buddy
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </>
              ) : (
                <>
                  <HandDrawnPhone size={18} washColor="#BAF7D0" strokeColor="#020617" className="mr-2" />
                  Sign In to Call Buddy
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
