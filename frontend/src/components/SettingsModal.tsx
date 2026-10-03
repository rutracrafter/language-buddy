import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { HandDrawnSettings, HandDrawnCross, HandDrawnCheck, HandDrawnHeart } from './HandDrawnIcons.js';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  'Nature & Outdoors',
  'History & Culture',
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { profile, updateProfile } = useAuth();

  const [speechRate, setSpeechRate] = useState<number>(profile?.preferences?.speechRate ?? 1.0);
  const [nativeLangSupport, setNativeLangSupport] = useState<'low' | 'med' | 'high'>(
    profile?.preferences?.nativeLangSupport ?? 'med'
  );
  const [defaultSessionMinutes, setDefaultSessionMinutes] = useState<number>(
    profile?.preferences?.defaultSessionMinutes ?? 10
  );
  const [interests, setInterests] = useState<string[]>(profile?.interests ?? []);
  const [customInterest, setCustomInterest] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        interests,
        preferences: {
          speechRate,
          nativeLangSupport,
          defaultSessionMinutes,
        },
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      alert('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-[#FAF7F0] bg-sketchbook border border-stone-300 rounded-[32px] max-w-lg w-full p-6 sm:p-7 shadow-xl overflow-hidden relative text-[#2B2B2B]">
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-orange-100 border border-orange-200 text-[#2B2B2B] flex items-center justify-center shadow-2xs">
              <HandDrawnSettings size={18} washColor="#FED7AA" strokeColor="#2B2B2B" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-[#2B2B2B] leading-tight">
                Learner Settings
              </h3>
              <p className="text-[11px] text-stone-500 font-medium">
                Personalize voice tutor tempo & conversation topics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-stone-600 flex items-center justify-center shadow-2xs border border-stone-200 cursor-pointer transition-colors"
          >
            <HandDrawnCross size={16} washColor="#FECACA" strokeColor="#2B2B2B" />
          </button>
        </div>

        <div className="mt-5 space-y-5 max-h-[60vh] overflow-y-auto pr-1">
          {/* Speech Rate Setting */}
          <div className="p-3.5 rounded-2xl bg-white/90 border border-stone-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-bold text-[#2B2B2B] mb-2">
              <span>Tutor Speech Rate</span>
              <span className="font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full text-[11px]">
                {speechRate}x
              </span>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.2"
              step="0.05"
              value={speechRate}
              onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-stone-500 font-medium mt-1">
              <span>0.8x (Slower)</span>
              <span>1.0x (Normal)</span>
              <span>1.2x (Native Speed)</span>
            </div>
          </div>

          {/* Native Language Support Level */}
          <div className="p-3.5 rounded-2xl bg-white/90 border border-stone-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-bold text-[#2B2B2B] mb-2">
              <span>Native Language Scaffolding</span>
              <span className="text-stone-500 uppercase text-[10px] font-bold">
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
            <p className="text-[11px] text-stone-500 mt-2 leading-relaxed font-medium">
              {nativeLangSupport === 'low' && 'Tutor speaks almost exclusively in target language; answers in English only when directly asked.'}
              {nativeLangSupport === 'med' && 'Balanced immersion: tutor offers quick translations for unfamiliar idioms.'}
              {nativeLangSupport === 'high' && 'Frequent scaffolding: tutor explains complex grammar in English when you hesitate.'}
            </p>
          </div>

          {/* Default Session Length */}
          <div className="p-3.5 rounded-2xl bg-white/90 border border-stone-200/80 shadow-2xs">
            <span className="block text-xs font-bold text-[#2B2B2B] mb-2">
              Default Session Length
            </span>
            <div className="flex space-x-2">
              {[5, 10, 15, 20].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDefaultSessionMinutes(mins)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    defaultSessionMinutes === mins
                      ? 'bg-[#2B2B2B] text-white shadow-2xs'
                      : 'bg-[#FAF7F0] border border-stone-300 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>

          {/* Conversation Interests */}
          <div className="p-3.5 rounded-2xl bg-white/90 border border-stone-200/80 shadow-2xs">
            <div className="flex items-center text-xs font-bold text-[#2B2B2B] mb-2">
              <HandDrawnHeart size={14} washColor="#FECACA" strokeColor="#2B2B2B" className="mr-1.5" />
              Conversation Interests (used by Planner)
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {COMMON_INTERESTS.map((item) => {
                const selected = interests.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleInterest(item)}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                      selected
                        ? 'bg-emerald-100 border border-emerald-400 text-emerald-950 shadow-2xs'
                        : 'bg-[#FAF7F0] border border-stone-300 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    {selected ? '✓ ' : '+ '}
                    {item}
                  </button>
                );
              })}
            </div>

            <form onSubmit={addCustomInterest} className="flex gap-2">
              <input
                type="text"
                value={customInterest}
                onChange={(e) => setCustomInterest(e.target.value)}
                placeholder="Add custom topic (e.g. Scuba diving, startups)..."
                className="flex-1 px-3 py-2 bg-[#FAF7F0] border border-stone-300 rounded-xl text-xs text-[#2B2B2B] placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-[#2B2B2B] hover:bg-stone-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-2xs"
              >
                Add
              </button>
            </form>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-stone-200 flex items-center justify-between">
          {saveSuccess ? (
            <span className="flex items-center text-xs text-emerald-700 font-bold">
              <HandDrawnCheck size={14} washColor="#86EFAC" strokeColor="#065F46" className="mr-1" />
              Settings Saved!
            </span>
          ) : (
            <span />
          )}

          <div className="flex space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-stone-900 font-bold rounded-xl text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
