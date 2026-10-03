import React from 'react';
import { GroundTruthScenario, SimulationState } from '../../types/simulation';
import { Lock, EyeOff, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface HiddenGroundTruthPanelProps {
  scenarios: GroundTruthScenario[];
  simulationState: SimulationState | null;
}

export const HiddenGroundTruthPanel: React.FC<HiddenGroundTruthPanelProps> = ({
  scenarios,
  simulationState,
}) => {
  return (
    <div className="bg-slate-900 rounded-2xl border border-red-500/30 p-5 shadow-2xl relative overflow-hidden">
      {/* Top alert banner */}
      <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-3 mb-5 flex items-center space-x-3 text-red-200 text-xs">
        <div className="p-1.5 rounded-lg bg-red-500/20 text-red-400 shrink-0">
          <Lock className="w-4 h-4" />
        </div>
        <div>
          <span className="font-bold uppercase tracking-wider text-[11px] block text-red-300 font-mono">
            Operator-Only Ground Truth Store (Strictly Isolated From Gemini Agent)
          </span>
          <p className="text-[11px] text-red-200/80 leading-relaxed">
            The agent prompt, tool parameters, and context matrices NEVER receive expected categories, true user intents, or operator reasoning. All unrelated seeded scenarios have been purged.
          </p>
        </div>
      </div>

      {scenarios.length === 0 ? (
        <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-dashed border-slate-800 text-slate-400 text-xs space-y-2">
          <ShieldCheck className="w-6 h-6 text-teal-400 mx-auto" />
          <p className="font-semibold text-slate-300">Clean Test Store Active</p>
          <p className="text-slate-500 max-w-md mx-auto text-[11px]">
            Seeded unrelated scenarios (Shree Ji, Croma, Swiggy, Airtel, Nature&apos;s Basket, Uber, Arjun Mehta, ₹60,000 budgets) have been completely removed.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {scenarios.map((scen) => {
            const matchingTxn = simulationState?.transactions.find(
              (t) => t.id === scen.sampleTransaction.id
            );

            return (
              <div
                key={scen.id}
                className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 text-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/10 text-red-300 border border-red-500/30">
                      HIDDEN FACTS
                    </span>
                    <span className="font-bold text-white text-xs">{scen.title}</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500">
                    Ref: {scen.sampleTransaction.id}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800/80 space-y-2 text-[11px]">
                    <div>
                      <span className="text-slate-500 font-mono uppercase text-[10px] block">
                        Real Merchant Nature:
                      </span>
                      <span className="text-slate-200 font-medium">
                        {scen.hiddenFacts.realMerchantNature}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 font-mono uppercase text-[10px] block">
                        True Spend Intent:
                      </span>
                      <span className="text-slate-300">
                        {scen.hiddenFacts.trueIntent}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 font-mono uppercase text-[10px] block">
                        Expected Category & Decision:
                      </span>
                      <span className="text-amber-300 font-semibold">
                        {scen.hiddenFacts.expectedCategory}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {scen.hiddenFacts.expectedAgentDecision}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800/80 space-y-2 text-[11px]">
                    <span className="text-slate-500 font-mono uppercase text-[10px] block">
                      Agent Inferred Status:
                    </span>
                    <div className="flex items-center space-x-1.5 text-slate-300">
                      <span className="text-slate-400">Transaction Status:</span>
                      <span className="font-mono font-bold text-teal-400">
                        {matchingTxn?.status || 'NOT_YET_INGESTED'}
                      </span>
                    </div>
                    {matchingTxn?.category && (
                      <div className="mt-1 text-slate-300">
                        Inferred Category: <span className="text-emerald-400 font-bold">{matchingTxn.category}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
