import React from 'react';
import {
  UserInteraction,
  ContextualMemoryItem,
  Transaction,
} from '../../types/simulation';
import {
  Smartphone,
  Mic,
  BellRing,
  CheckCircle,
  Database,
  Volume2,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

interface UserFacingCenterProps {
  pendingInteractions: UserInteraction[];
  contextualMemory: Record<string, ContextualMemoryItem>;
  transactions: Transaction[];
  onRespondUser: (
    interactionId: string,
    responseType: UserInteraction['responseType'],
    payload: any,
    audioAssetId?: string
  ) => void;
  isProcessing: boolean;
}

export const UserFacingCenter: React.FC<UserFacingCenterProps> = ({
  pendingInteractions,
  contextualMemory,
  onRespondUser,
  isProcessing,
}) => {
  const unresolvedInteractions = pendingInteractions.filter((i) => !i.resolved);
  const memoryItems = Object.values(contextualMemory);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Box 1: User Notification & Clarification Feed */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/20">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white tracking-wide uppercase">
                  User Notification Screen (Aarav)
                </h3>
                <p className="text-xs text-slate-400">
                  Minimal necessary prompts • Missing low-impact context parked silently
                </p>
              </div>
            </div>

            {unresolvedInteractions.length > 0 && (
              <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse">
                <BellRing className="w-3 h-3" />
                <span>{unresolvedInteractions.length} Action Needed</span>
              </span>
            )}
          </div>

          {/* Interactions list */}
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {pendingInteractions.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-dashed border-slate-800 text-slate-500 text-xs">
                No active interruptions. MoneyMic is passive by default.
              </div>
            ) : (
              pendingInteractions.slice(0, 4).map((interaction) => (
                <div
                  key={interaction.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    !interaction.resolved
                      ? 'bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/20 border-amber-500/40 shadow-md shadow-amber-500/5'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-2">
                      {interaction.requiresAudio ? (
                        <span className="p-1.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          <Mic className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span className="p-1.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          <BellRing className="w-3.5 h-3.5" />
                        </span>
                      )}
                      <span className="font-mono text-[11px] font-bold text-slate-300">
                        {interaction.type}
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(interaction.timestamp).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Message body */}
                  <p className="text-xs text-slate-200 leading-relaxed font-medium mb-3">
                    {interaction.message}
                  </p>

                  {/* Clarification / Response action if unresolved */}
                  {!interaction.resolved ? (
                    <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                      {interaction.requiresAudio ? (
                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] text-amber-300 flex items-center space-x-1">
                            <Mic className="w-3 h-3 animate-pulse" />
                            <span>Voice Clarification Requested</span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            (Supply audio in Operator View)
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() =>
                              onRespondUser(
                                interaction.id,
                                'BUTTON_APPROVE',
                                { approved: true, note: 'Aarav approved dining expenditure' }
                              )
                            }
                            disabled={isProcessing}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() =>
                              onRespondUser(
                                interaction.id,
                                'BUTTON_REJECT',
                                { approved: false, note: 'Aarav declined to keep pace aligned' }
                              )
                            }
                            disabled={isProcessing}
                            className="px-3 py-1 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center space-x-1 text-emerald-400">
                        <CheckCircle className="w-3 h-3" />
                        <span>Resolved via {interaction.responseType}</span>
                      </span>
                      {interaction.audioTranscript && (
                        <span className="text-[10px] text-slate-400 truncate max-w-[200px]">
                          Transcript: &quot;{interaction.audioTranscript}&quot;
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Box 2: Contextual Financial Memory (State 11) */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white tracking-wide uppercase">
                  Contextual Memory (State 11 Store)
                </h3>
                <p className="text-xs text-slate-400">
                  Only VERIFIED context is stored to reduce future unnecessary interruptions
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-teal-400 px-2 py-0.5 rounded bg-teal-500/10 border border-teal-500/20">
              {memoryItems.length} Verified Entries
            </span>
          </div>

          {/* Memory items */}
          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {memoryItems.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-dashed border-slate-800 text-slate-500 text-xs">
                No persistent memory entries yet. Unverified hypotheses are never committed.
              </div>
            ) : (
              memoryItems.map((item) => (
                <div
                  key={item.key}
                  className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-mono text-xs font-bold text-teal-300">
                        {item.payeePattern}
                      </span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                          item.informationStatus === 'VERIFIED'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {item.informationStatus}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/30">
                      {item.policyTag}
                    </span>
                  </div>

                  <div className="text-xs font-medium text-slate-200 mb-1">
                    Category: <span className="text-white font-semibold">{item.resolvedCategory}</span>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2">
                    {item.notes}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
