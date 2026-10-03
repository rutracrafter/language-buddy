import React from 'react';
import {
  HandDrawnPhone,
  HandDrawnShuffle,
} from '../HandDrawnIcons.js';
import { BUDDY_ASSETS } from '../../assets/buddyAssets.js';

interface PracticeTabProps {
  targetLanguage: string;
  onStartSession: (type: 'placement' | 'practice') => void;
  dailyPrompt: { category: string; title: string; teaser: string };
  onShufflePrompt: () => void;
  requestedTopic: string;
  onSelectTopic: (topic: string) => void;
  onClearTopic: () => void;
}

export const PracticeTab: React.FC<PracticeTabProps> = ({
  targetLanguage,
  onStartSession,
  dailyPrompt,
  onShufflePrompt,
  requestedTopic,
  onSelectTopic,
  onClearTopic,
}) => {
  return (
    <div className="space-y-4">
      {/* Hero Ring Buddy Card */}
      <div className="relative rounded-[32px] bg-gradient-to-b from-[#FFA785] via-[#FB9B77] to-[#F38A65] p-5 shadow-lg shadow-orange-950/10 overflow-hidden text-stone-900 transition-all hover:shadow-xl">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/20 rounded-full blur-2xl pointer-events-none" />

        {/* Mascot Banner */}
        <div className="relative w-full h-14 -mx-1 mb-3 overflow-hidden rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center">
          <img
            src={BUDDY_ASSETS.heroBanner}
            alt="Buddy mascots"
            className="w-full h-full object-cover object-center opacity-95 transition-transform duration-700 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#FFA785]/80 via-transparent to-[#FFA785]/80 pointer-events-none" />
        </div>

        {/* Center Ring Button */}
        <div className="flex flex-col items-center justify-center pt-1 pb-2 text-center">
          <div className="relative group">
            <div className="absolute inset-0 rounded-full bg-emerald-400/40 animate-ping opacity-60 pointer-events-none" />
            <div className="absolute -inset-2 rounded-full bg-emerald-300/30 blur-md pointer-events-none" />

            <button
              onClick={() => onStartSession('practice')}
              aria-label="Ring Buddy now"
              className="relative w-20 h-20 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-stone-900 flex items-center justify-center shadow-lg shadow-emerald-950/25 transition-all duration-200 cursor-pointer hover:shadow-emerald-500/40"
            >
              <HandDrawnPhone
                size={36}
                washColor="#BAF7D0"
                strokeColor="#2B2B2B"
                strokeWidth={2.6}
                className="-rotate-12 transition-transform duration-300 group-hover:rotate-0"
              />
            </button>
          </div>

          <h2 className="mt-3 font-display font-extrabold text-[#2B2B2B] text-lg tracking-tight">
            Ring Buddy
          </h2>
          <p className="text-xs text-[#2B2B2B]/85 font-medium max-w-[240px] mt-0.5 leading-snug">
            Speak {targetLanguage} naturally in an open-ended conversation
          </p>

          {/* Attached Topic Badge */}
          {requestedTopic ? (
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-white/90 rounded-full text-[11px] font-medium text-[#2B2B2B] shadow-2xs">
              <span>🎯 Topic: {requestedTopic}</span>
              <button
                onClick={onClearTopic}
                className="text-stone-500 hover:text-stone-800 ml-1 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Not sure what to discuss? Daily Prompts */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-[#2B2B2B] tracking-tight">
            Not sure what to discuss?
          </h3>
          <button
            onClick={onShufflePrompt}
            className="text-[11px] text-[#2B2B2B]/70 hover:text-[#2B2B2B] flex items-center gap-1.5 transition-colors py-1 px-2 rounded-lg hover:bg-stone-200/60 cursor-pointer"
            title="Shuffle topic prompt"
          >
            <HandDrawnShuffle size={13} strokeColor="#2B2B2B" washColor="#FED7AA" />
            <span className="font-semibold">Shuffle</span>
          </button>
        </div>

        <div
          onClick={() => onSelectTopic(dailyPrompt.title)}
          className="group cursor-pointer p-4 rounded-3xl bg-gradient-to-br from-[#FFD1BA]/70 via-[#FFDFD0]/60 to-[#FCE6D9]/50 shadow-xs hover:shadow-md transition-all active:scale-[0.99] text-left border border-orange-200/40"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-950/70">
              {dailyPrompt.category}
            </span>
            <span className="text-[10px] text-stone-500 font-semibold group-hover:text-emerald-700 transition-colors">
              Tap to practice →
            </span>
          </div>
          <h4 className="font-display font-bold text-[#2B2B2B] text-sm leading-snug">
            {dailyPrompt.title}
          </h4>
          <p className="text-xs text-[#2B2B2B]/75 mt-1 leading-relaxed">
            {dailyPrompt.teaser}
          </p>
        </div>
      </div>
    </div>
  );
};
