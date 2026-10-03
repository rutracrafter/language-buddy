import React from 'react';
import {
  HandDrawnBook,
  HandDrawnBookmark,
  HandDrawnFlame,
  HandDrawnUser,
} from '../HandDrawnIcons.js';
import { CEFRLevel } from '../../types.js';

interface MeTabProps {
  userEmail?: string;
  targetLanguage: string;
  currentLevel: CEFRLevel;
  levelConfidence: number;
  onRetakePlacement: () => void;
  dashboardMetrics: {
    stats: {
      totalItems: number;
      recognitionItems: number;
      productionItems: number;
      totalReviews: number;
    };
    coveredTopics: any[];
    openNotes: any[];
  };
}

export const MeTab: React.FC<MeTabProps> = ({
  userEmail,
  targetLanguage,
  currentLevel,
  levelConfidence,
  onRetakePlacement,
  dashboardMetrics,
}) => {
  return (
    <div className="space-y-4">
      {/* Profile Card */}
      <div className="p-4 rounded-3xl bg-white/90 shadow-xs border border-stone-200/80 flex items-center gap-3.5">
        <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-100 to-orange-200 ring-2 ring-orange-400 ring-offset-2 ring-offset-[#FAF7F0] flex items-center justify-center shrink-0">
          <HandDrawnUser size={26} washColor="#BAE6FD" strokeColor="#2B2B2B" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mb-1">
            Active Learner
          </span>
          <h3 className="font-display font-bold text-sm text-[#2B2B2B] truncate">{userEmail}</h3>
          <p className="text-xs text-stone-500 font-medium">Studying {targetLanguage}</p>
        </div>
      </div>

      {/* CEFR Level & OPI Calibration */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-[#FFE3D6] via-[#FFD8C7] to-[#FFCEB8] shadow-xs border border-orange-200/60">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-orange-950 uppercase tracking-wider">
            <HandDrawnFlame size={14} washColor="#F97316" strokeColor="#2B2B2B" />
            <span>Assigned Proficiency</span>
          </div>
          <span className="text-xs font-bold text-orange-950 bg-white/60 px-2.5 py-0.5 rounded-full">
            {Math.round(levelConfidence * 100)}% Confidence
          </span>
        </div>

        <div className="flex items-baseline justify-between my-1">
          <div>
            <span className="font-display font-extrabold text-3xl text-[#2B2B2B]">
              Level {currentLevel}
            </span>
            <span className="text-xs text-[#2B2B2B]/75 block font-medium">
              Calibrated from oral proficiency checks
            </span>
          </div>

          <button
            onClick={onRetakePlacement}
            className="px-3.5 py-2 bg-[#2B2B2B] hover:bg-stone-800 text-white rounded-2xl text-xs font-bold shadow-xs cursor-pointer active:scale-95 transition-all"
          >
            Retake OPI
          </button>
        </div>
      </div>

      {/* Memory Bank (SRS Stats) */}
      <div className="p-4 rounded-3xl bg-white/90 shadow-xs border border-stone-200/80">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#2B2B2B]">
            <HandDrawnBook size={15} washColor="#FED7AA" strokeColor="#2B2B2B" />
            <span>Memory Bank</span>
          </div>
          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full">
            {dashboardMetrics.stats.totalItems} words
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="p-3 rounded-2xl bg-[#FAF7F0] border border-stone-200/60">
            <div className="text-xl font-display font-extrabold text-[#2B2B2B]">
              {dashboardMetrics.stats.recognitionItems}
            </div>
            <div className="text-[10px] font-medium text-stone-500 mt-0.5">Recognition</div>
          </div>
          <div className="p-3 rounded-2xl bg-[#FAF7F0] border border-stone-200/60">
            <div className="text-xl font-display font-extrabold text-emerald-700">
              {dashboardMetrics.stats.productionItems}
            </div>
            <div className="text-[10px] font-medium text-stone-500 mt-0.5">Production</div>
          </div>
        </div>
      </div>

      {/* Covered Topics */}
      {dashboardMetrics.coveredTopics.length > 0 && (
        <div className="p-4 rounded-3xl bg-white/90 shadow-xs border border-stone-200/80">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-[#2B2B2B]">Topics Practiced</h4>
            <span className="text-[11px] text-stone-500">
              {dashboardMetrics.coveredTopics.length} topics
            </span>
          </div>

          <div className="space-y-2">
            {dashboardMetrics.coveredTopics.map((top, idx) => (
              <div
                key={top._id || idx}
                className="p-3 rounded-2xl bg-[#FAF7F0] flex items-center justify-between text-xs border border-stone-200/60"
              >
                <div>
                  <span className="font-bold text-[#2B2B2B] capitalize block">{top.name}</span>
                  <span className="text-[10px] text-stone-500">
                    {top.sessionsCount} session{top.sessionsCount === 1 ? '' : 's'}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
                  Depth {top.depth}/3
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Focus Areas & Weak Spots */}
      {dashboardMetrics.openNotes.length > 0 && (
        <div className="p-4 rounded-3xl bg-white/90 shadow-xs border border-stone-200/80">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#2B2B2B] mb-3">
            <HandDrawnBookmark size={15} washColor="#FEF08A" strokeColor="#2B2B2B" />
            <span>Focus Areas & Feedback</span>
          </div>

          <div className="space-y-2">
            {dashboardMetrics.openNotes.map((note, idx) => (
              <div
                key={note._id || idx}
                className="p-3 rounded-2xl bg-[#FAF7F0] border border-orange-200/70 text-xs"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-900 block mb-1">
                  {note.kind.replace('_', ' ')}
                </span>
                <p className="text-stone-700 leading-relaxed font-medium">{note.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
