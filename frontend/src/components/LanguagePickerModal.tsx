import React from 'react';
import { HandDrawnCross } from './HandDrawnIcons.js';

interface LanguagePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  nativeLanguage: string;
  targetLanguage: string;
  languages: string[];
  onSave: (native: string, target: string) => void;
}

export const LanguagePickerModal: React.FC<LanguagePickerModalProps> = ({
  isOpen,
  onClose,
  nativeLanguage: initialNative,
  targetLanguage: initialTarget,
  languages,
  onSave,
}) => {
  const [native, setNative] = React.useState(initialNative);
  const [target, setTarget] = React.useState(initialTarget);

  React.useEffect(() => {
    setNative(initialNative);
    setTarget(initialTarget);
  }, [initialNative, initialTarget]);

  if (!isOpen) return null;

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (native.toLowerCase() === target.toLowerCase()) {
      alert('Support and target languages must be different.');
      return;
    }
    onSave(native, target);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-[#FAF7F0] bg-sketchbook border border-stone-300 rounded-[32px] max-w-sm w-full p-6 shadow-xl relative text-[#2B2B2B]">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <h3 className="font-display font-bold text-base text-[#2B2B2B]">
            Change Languages
          </h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white text-stone-500 hover:text-stone-800 flex items-center justify-center border border-stone-200 cursor-pointer shadow-2xs"
          >
            <HandDrawnCross size={14} washColor="#FECACA" strokeColor="#2B2B2B" />
          </button>
        </div>

        <form onSubmit={handleApply} className="mt-4 space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">
              Support / Native Language
            </label>
            <select
              value={native}
              onChange={(e) => setNative(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-bold text-[#2B2B2B] focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
            >
              {languages.map((l) => (
                <option key={`nat-${l}`} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">
              Target Practice Language
            </label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
            >
              {languages.map((l) => (
                <option key={`tar-${l}`} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-[#2B2B2B] hover:bg-stone-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              Apply
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
