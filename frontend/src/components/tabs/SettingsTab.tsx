import React, { useState } from 'react';
import {
  HandDrawnHeart,
  HandDrawnCheck,
} from '../HandDrawnIcons.js';
import { LogOut, RotateCcw } from 'lucide-react';

interface SettingsTabProps {
  nativeLanguage: string;
  targetLanguage: string;
  availableLanguages: string[];
  speechRate: number;
  nativeLangSupport: 'low' | 'med' | 'high';
  interests: string[];
  onSave: (updates: {
    nativeLanguage?: string;
    targetLanguage?: string;
    speechRate?: number;
    nativeLangSupport?: 'low' | 'med' | 'high';
    interests?: string[];
  }) => Promise<void>;
  onLogout: () => void;
  onRestartOnboarding: () => void;
  onStartPlacement: () => void;
}

const COMMON_INTERESTS = [
  'Travel & Sightseeing',
  'Food & Cooking',
  'Music & Concerts',
  'Movies & Cinema',
  'Technology & AI',
  'Literature & Books',
  'Business & Career',
  'Fitness & Sports',
  'History & Culture',
];

export const SettingsTab: React.FC<SettingsTabProps> = ({
  nativeLanguage: initialNative,
  targetLanguage: initialTarget,
  availableLanguages,
  speechRate: initialRate,
  nativeLangSupport: initialSupport,
  interests: initialInterests,
  onSave,
  onLogout,
  onRestartOnboarding,
  onStartPlacement,
}) => {
  const [nativeLanguage, setNativeLanguage] = useState(initialNative);
  const [targetLanguage, setTargetLanguage] = useState(initialTarget);
  const [speechRate, setSpeechRate] = useState(initialRate);
  const [nativeLangSupport, setNativeLangSupport] = useState(initialSupport);
  const [interests, setInterests] = useState<string[]>(initialInterests);
  const [customInterest, setCustomInterest] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const toggleInterest = (item: string) => {
    setInterests((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const addCustomInterest = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customInterest.trim();
    if (trimmed && !interests.includes(trimmed)) {
      setInterests((prev) => [...prev, trimmed]);
      setCustomInterest('');
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await onSave({
        nativeLanguage,
        targetLanguage,
        speechRate,
        nativeLangSupport,
        interests,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error(err);
      alert('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="font-display font-bold text-lg text-[#2B2B2B]">Settings</h3>
          <p className="text-xs text-stone-500 font-medium">Tutor behavior & language defaults</p>
        </div>
        {saveSuccess && (
          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full flex items-center gap-1">
            <HandDrawnCheck size={11} washColor="#86EFAC" strokeColor="#065F46" />
            Saved!
          </span>
        )}
      </div>

      {/* Language Pair Card */}
      <div className="p-4 rounded-3xl bg-white/90 shadow-xs border border-stone-200/80 space-y-3">
        <h4 className="text-xs font-bold text-[#2B2B2B] uppercase tracking-wider">
          Default Languages
        </h4>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
              Support Language
            </label>
            <select
              value={nativeLanguage}
              onChange={(e) => setNativeLanguage(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAF7F0] border border-stone-300 rounded-xl text-xs font-bold text-[#2B2B2B] focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
            >
              {availableLanguages.map((lang) => (
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
              className="w-full px-3 py-2 bg-[#FAF7F0] border border-stone-300 rounded-xl text-xs font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
            >
              {availableLanguages.map((lang) => (
                <option key={`tar-${lang}`} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Speech Rate Selection */}
      <div className="p-4 rounded-3xl bg-white/90 shadow-xs border border-stone-200/80 space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-[#2B2B2B] uppercase tracking-wider">
            Tutor Talking Speed
          </h4>
          <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
            {speechRate}x
          </span>
        </div>
        <p className="text-[11px] text-stone-500 font-medium">
          Target speaking tempo for AI voice generation.
        </p>

        <div className="flex gap-1.5 pt-1">
          {[0.8, 0.9, 1.0, 1.1, 1.2].map((spd) => (
            <button
              key={spd}
              type="button"
              onClick={() => setSpeechRate(spd)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                Math.abs(speechRate - spd) < 0.04
                  ? 'bg-[#2B2B2B] text-white shadow-2xs'
                  : 'bg-[#FAF7F0] border border-stone-300 text-stone-700 hover:bg-stone-100'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>

      {/* Native Language Support Level */}
      <div className="p-4 rounded-3xl bg-white/90 shadow-xs border border-stone-200/80 space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-[#2B2B2B] uppercase tracking-wider">
            Native Support Amount
          </h4>
          <span className="text-[10px] font-bold uppercase text-stone-600">
            {nativeLangSupport}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          {(['low', 'med', 'high'] as const).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setNativeLangSupport(level)}
              className={`py-2 px-3 rounded-xl border text-xs font-bold capitalize transition-all cursor-pointer ${
                nativeLangSupport === level
                  ? 'bg-[#2B2B2B] text-white border-[#2B2B2B] shadow-2xs'
                  : 'bg-[#FAF7F0] border-stone-300 text-stone-700 hover:bg-stone-100'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation Interests */}
      <div className="p-4 rounded-3xl bg-white/90 shadow-xs border border-stone-200/80 space-y-2.5">
        <div className="flex items-center text-xs font-bold text-[#2B2B2B]">
          <HandDrawnHeart size={14} washColor="#FECACA" strokeColor="#2B2B2B" className="mr-1.5" />
          <span>Conversation Interests</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {COMMON_INTERESTS.map((item) => {
            const isSelected = interests.includes(item);
            return (
              <button
                key={item}
                type="button"
                onClick={() => toggleInterest(item)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-100 border border-emerald-400 text-emerald-950 shadow-2xs'
                    : 'bg-[#FAF7F0] border border-stone-300 text-stone-600 hover:bg-stone-100'
                }`}
              >
                {isSelected ? '✓ ' : '+ '}
                {item}
              </button>
            );
          })}
        </div>

        <form onSubmit={addCustomInterest} className="flex gap-2 pt-1">
          <input
            type="text"
            value={customInterest}
            onChange={(e) => setCustomInterest(e.target.value)}
            placeholder="Add custom topic..."
            className="flex-1 px-3 py-1.5 bg-[#FAF7F0] border border-stone-300 rounded-xl text-xs text-[#2B2B2B] placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          />
          <button
            type="submit"
            className="px-3.5 py-1.5 bg-[#2B2B2B] hover:bg-stone-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-2xs"
          >
            Add
          </button>
        </form>
      </div>

      {/* Save Button */}
      <button
        type="button"
        onClick={handleSaveAll}
        disabled={isSaving}
        className="w-full py-3.5 px-4 rounded-2xl bg-[#2B2B2B] hover:bg-stone-800 active:scale-95 text-white font-bold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
      >
        {isSaving ? 'Saving...' : 'Save Preferences'}
      </button>

      {/* Oral Placement Interview Section */}
      <div className="p-4 rounded-3xl bg-white/90 shadow-xs border border-stone-200/80">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-bold text-xs text-[#2B2B2B] block">
              Oral Placement Interview (ACTFL OPI)
            </span>
            <span className="text-[11px] text-stone-500 font-medium">
              Calibrate speaking floor and ceiling levels
            </span>
          </div>
          <button
            type="button"
            onClick={onStartPlacement}
            className="px-3.5 py-1.5 bg-[#2B2B2B] hover:bg-stone-800 text-white rounded-xl text-[11px] font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
          >
            Start OPI
          </button>
        </div>
      </div>

      {/* Onboarding Restart Section */}
      <div className="p-4 rounded-3xl bg-white/90 shadow-xs border border-stone-200/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
              <RotateCcw className="w-4 h-4 text-orange-700" />
            </div>
            <div>
              <span className="font-bold text-xs text-[#2B2B2B] block">
                Restart Onboarding
              </span>
              <span className="text-[11px] text-stone-500 font-medium">
                Reset tutorial walkthrough & intro flow
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onRestartOnboarding}
            className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-900 rounded-xl text-[11px] font-bold transition-colors cursor-pointer"
          >
            Restart
          </button>
        </div>
      </div>

      {/* Log Out Button */}
      <div className="pt-2 text-center">
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 p-2 cursor-pointer transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out of Language Buddy</span>
        </button>
      </div>
    </div>
  );
};
