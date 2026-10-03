import React, { useState } from 'react';
import { HandDrawnClock } from '../HandDrawnIcons.js';

interface HistoryTabProps {
  sessions: any[];
  isLoading: boolean;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({ sessions, isLoading }) => {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const formatDuration = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  return (
    <div className="space-y-4">
      <div className="px-1">
        <h3 className="font-display font-bold text-lg text-[#2B2B2B]">Conversation History</h3>
        <p className="text-xs text-stone-500">Review your past spoken sessions & AI feedback</p>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-xs text-stone-500">Loading sessions...</div>
      ) : sessions.length === 0 ? (
        <div className="p-8 rounded-3xl bg-white/90 shadow-xs border border-stone-200/80 text-center">
          <div className="w-12 h-12 rounded-full bg-orange-100 mx-auto mb-3 flex items-center justify-center">
            <HandDrawnClock size={22} washColor="#FED7AA" strokeColor="#2B2B2B" />
          </div>
          <h4 className="font-bold text-sm text-[#2B2B2B]">No Conversations Yet</h4>
          <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
            Switch to the Practice tab and ring Buddy to have your first conversation!
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {sessions.map((s) => {
            const isSelected = selectedSessionId === s._id;
            const durationSecs = s.endedAt
              ? Math.round((new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime()) / 1000)
              : s.targetMinutes * 60;

            return (
              <div
                key={s._id}
                onClick={() => setSelectedSessionId(isSelected ? null : s._id)}
                className={`p-4 rounded-3xl bg-white/90 border cursor-pointer transition-all shadow-xs hover:shadow-sm ${
                  isSelected ? 'border-emerald-500/80 bg-white ring-1 ring-emerald-400' : 'border-stone-200/80'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-sm text-[#2B2B2B]">
                        {s.languages?.target || 'Spanish'}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {s.type === 'placement' ? 'Placement OPI' : 'Practice'}
                      </span>
                    </div>
                    <span className="text-xs text-stone-600 font-medium block mt-1">
                      {s.plan?.topic || 'Spontaneous chat'}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-xs text-[#2B2B2B]">
                      {formatDuration(durationSecs)}
                    </span>
                    <span className="text-[10px] text-stone-500 block mt-0.5">
                      {s.transcript?.length || 0} turns
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-stone-400 mt-2.5 pt-2 border-t border-stone-100">
                  <span>
                    {new Date(s.startedAt).toLocaleDateString()} at{' '}
                    {new Date(s.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-emerald-700 font-semibold text-[11px]">
                    {isSelected ? 'Hide details ▲' : 'View feedback ▼'}
                  </span>
                </div>

                {/* Expanded Details */}
                {isSelected && (
                  <div className="mt-3 pt-3 border-t border-stone-200/80 space-y-3 text-xs">
                    {s.summary && (
                      <div className="p-3 rounded-2xl bg-[#FAF7F0] border border-stone-200">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">
                          Tutor Feedback
                        </span>
                        <p className="text-stone-700 leading-relaxed font-medium">
                          {s.summary.whatWentWell || s.summary.strengths || s.summary.detailedFeedback}
                        </p>
                      </div>
                    )}

                    {s.transcript && s.transcript.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1.5">
                          Transcript Preview
                        </span>
                        <div className="max-h-48 overflow-y-auto space-y-2 p-3 rounded-2xl bg-[#FAF7F0] border border-stone-200 pr-1">
                          {s.transcript.slice(0, 8).map((t: any, idx: number) => (
                            <p key={idx} className="leading-relaxed text-[11px]">
                              <strong className={t.speaker === 'agent' ? 'text-orange-600' : 'text-sky-600'}>
                                {t.speaker === 'agent' ? 'Buddy: ' : 'You: '}
                              </strong>
                              <span className="text-stone-700">{t.text}</span>
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
