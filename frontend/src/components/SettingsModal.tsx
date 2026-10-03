import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Settings, X, CheckCircle2, Sliders, Heart, Volume2 } from 'lucide-react';

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
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl overflow-hidden relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white leading-tight">Learner Settings</h3>
              <p className="text-xs text-slate-400">Personalize voice tutor behavior & topics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-6 space-y-6 max-h-[60vh] overflow-y-auto pr-1">
          {/* Speech Rate Setting */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
              <span className="flex items-center">
                <Volume2 className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                Tutor Speech Rate
              </span>
              <span className="text-emerald-400 font-mono">{speechRate}x</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.2"
              step="0.05"
              value={speechRate}
              onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>0.8x (Slower)</span>
              <span>1.0x (Normal)</span>
              <span>1.2x (Native Speed)</span>
            </div>
          </div>

          {/* Native Language Support Level */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
              <span className="flex items-center">
                <Sliders className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                Native Language Support Amount
              </span>
              <span className="text-slate-400 uppercase text-[10px] font-bold">
                {nativeLangSupport}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {(['low', 'med', 'high'] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setNativeLangSupport(level)}
                  className={`py-2 px-3 rounded-xl border font-semibold capitalize transition-all cursor-pointer ${
                    nativeLangSupport === level
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-md shadow-emerald-500/20'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              {nativeLangSupport === 'low' && 'Tutor speaks almost exclusively in target language; answers in native language only when directly asked.'}
              {nativeLangSupport === 'med' && 'Balanced immersion: tutor offers quick native translations for unfamiliar idioms.'}
              {nativeLangSupport === 'high' && 'Frequent scaffolding: tutor explains complex grammar and difficult phrases in your native language.'}
            </p>
          </div>

          {/* Default Session Length */}
          <div>
            <span className="block text-xs font-semibold text-slate-300 mb-2">
              Default Session Length
            </span>
            <div className="flex space-x-2">
              {[5, 10, 15, 20].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDefaultSessionMinutes(mins)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    defaultSessionMinutes === mins
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {mins} min
                </button>
              ))}
            </div>
          </div>

          {/* Learner Interests / Conversation Topics */}
          <div>
            <div className="flex items-center text-xs font-semibold text-slate-300 mb-2">
              <Heart className="w-3.5 h-3.5 mr-1.5 text-rose-400" />
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
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${
                      selected
                        ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
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
                className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Add
              </button>
            </form>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
          {saveSuccess ? (
            <span className="flex items-center text-xs text-emerald-400 font-semibold">
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Settings Saved!
            </span>
          ) : (
            <span />
          )}

          <div className="flex space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
