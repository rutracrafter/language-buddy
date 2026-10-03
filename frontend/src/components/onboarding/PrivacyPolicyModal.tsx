import React from 'react';
import { HandDrawnCross, HandDrawnCheck, HandDrawnBookmark } from '../HandDrawnIcons.js';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-[#FAF7F0] bg-sketchbook border border-stone-300 rounded-[32px] max-w-md w-full p-6 shadow-xl relative text-[#2B2B2B]">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <HandDrawnBookmark size={16} washColor="#FEF08A" strokeColor="#2B2B2B" />
            <h3 className="font-display font-bold text-base text-[#2B2B2B]">Privacy & Data Policy</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white text-stone-500 hover:text-stone-800 flex items-center justify-center border border-stone-200 cursor-pointer shadow-2xs"
          >
            <HandDrawnCross size={14} washColor="#FECACA" strokeColor="#2B2B2B" />
          </button>
        </div>

        <div className="mt-4 space-y-3.5 text-xs text-stone-700 leading-relaxed font-medium">
          <div className="p-3 rounded-2xl bg-white/90 border border-stone-200/80 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
              <HandDrawnCheck size={12} washColor="#86EFAC" strokeColor="#065F46" />
              <span>We never save your voice recordings</span>
            </div>
            <p className="text-[11px] text-stone-600">
              Audio is processed in real time through Gemini Live and immediately discarded. No permanent audio recordings of your voice are ever stored on our servers.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-white/90 border border-stone-200/80 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
              <HandDrawnCheck size={12} washColor="#86EFAC" strokeColor="#065F46" />
              <span>Transcripts power your Memory Bank</span>
            </div>
            <p className="text-[11px] text-stone-600">
              We store conversation text transcripts solely to schedule vocabulary reviews, track grammar weak spots, and calibrate your CEFR level.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-white/90 border border-stone-200/80 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
              <HandDrawnCheck size={12} washColor="#86EFAC" strokeColor="#065F46" />
              <span>Complete control & deletion</span>
            </div>
            <p className="text-[11px] text-stone-600">
              You own your data. You can delete individual conversation transcripts or your entire account at any time.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full py-2.5 bg-[#2B2B2B] hover:bg-stone-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-all"
        >
          Got it
        </button>
      </div>
    </div>
  );
};
