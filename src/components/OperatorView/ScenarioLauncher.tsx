import React from 'react';
import { GroundTruthScenario } from '../../types/simulation';
import { Send, EyeOff, Sparkles, ShieldCheck } from 'lucide-react';

interface ScenarioLauncherProps {
  scenarios: GroundTruthScenario[];
  onInjectEvent: (txn: GroundTruthScenario['sampleTransaction']) => void;
  isProcessing: boolean;
}

export const ScenarioLauncher: React.FC<ScenarioLauncherProps> = ({
  scenarios,
  onInjectEvent,
  isProcessing,
}) => {
  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white tracking-wide uppercase">
              Outside-World Event Delivery
            </h2>
            <p className="text-xs text-slate-400">
              Deliver raw external financial events • Unrelated seeded scenarios have been purged
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-teal-500/10 text-teal-300 border border-teal-500/20">
          <EyeOff className="w-3 h-3 text-teal-400" />
          <span>Semantic Meaning Withheld From Agent</span>
        </div>
      </div>

      {scenarios.length === 0 ? (
        <div className="p-6 bg-slate-950/60 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-400 space-y-2">
          <ShieldCheck className="w-5 h-5 text-teal-400 mx-auto" />
          <p className="font-semibold text-slate-300">Clean State Active</p>
          <p className="text-slate-500 max-w-lg mx-auto text-[11px]">
            Seeded unrelated scenarios have been removed. Use the <strong className="text-slate-300">Raw Event Builder</strong> or <strong className="text-slate-300">CSV Ingestion Studio</strong> below to deliver raw outside-world events to MoneyMic.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scenarios.map((scen) => (
            <div
              key={scen.id}
              className="p-4 bg-slate-950/70 rounded-xl border border-slate-800/90 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-teal-500/15 text-teal-300 border border-teal-500/30">
                    {scen.badge}
                  </span>
                  <span className="font-mono text-[11px] font-bold text-teal-400">
                    ₹{scen.sampleTransaction.amount.toLocaleString('en-IN')}
                  </span>
                </div>

                <h3 className="text-xs font-bold text-white mb-1.5 leading-snug">
                  {scen.title}
                </h3>

                <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
                  {scen.description}
                </p>

                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400 mb-3 space-y-1">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">
                    Raw External Inbound Payload:
                  </div>
                  <div className="truncate text-slate-200">
                    Payee: <span className="text-cyan-300">{scen.sampleTransaction.payee}</span>
                  </div>
                  <div>
                    Source: <span className="text-slate-300">{scen.sampleTransaction.source}</span> • Type:{' '}
                    <span className="text-slate-300">{scen.sampleTransaction.paymentType}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">
                  ID: {scen.sampleTransaction.id}
                </span>
                <button
                  onClick={() => onInjectEvent(scen.sampleTransaction)}
                  disabled={isProcessing}
                  className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-md shadow-teal-600/20 transition-all flex items-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Deliver Raw Event</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
