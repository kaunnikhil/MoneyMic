import React from 'react';
import {
  SimulationStateNum,
  STATE_DEFINITIONS,
} from '../../types/simulation';
import { CheckCircle2, Compass } from 'lucide-react';

interface StateMachineVisualizerProps {
  currentState: SimulationStateNum;
  stateHistory: { state: SimulationStateNum; timestamp: string; reason: string }[];
  isTransitioning?: boolean;
}

export const StateMachineVisualizer: React.FC<StateMachineVisualizerProps> = ({
  currentState,
  stateHistory,
}) => {
  const currentDef = STATE_DEFINITIONS[currentState];
  const allowedTransitions = currentDef?.allowedTransitions || [];
  const orderedStates: SimulationStateNum[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/30">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white tracking-wide uppercase">
              MoneyMic Authoritative State Machine (States 0 – 11)
            </h2>
            <p className="text-xs text-slate-400">
              Server-validated state transitions • Gemini selects permitted transitions; invalid transitions are rejected
            </p>
          </div>
        </div>

        {/* Current State Active Badge */}
        <div className="flex items-center space-x-3 bg-slate-950/70 px-3.5 py-1.5 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Active State:</span>
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
            <span>State {currentState}: {currentDef?.name}</span>
          </span>
        </div>
      </div>

      {/* Grid of 12 States */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 mb-4">
        {orderedStates.map((stateNum) => {
          const def = STATE_DEFINITIONS[stateNum];
          const isActive = currentState === stateNum;
          const isAllowedNext = allowedTransitions.includes(stateNum);
          const hasVisited = stateHistory.some((h) => h.state === stateNum);

          return (
            <div
              key={stateNum}
              className={`relative rounded-xl p-3 border transition-all duration-200 flex flex-col justify-between min-h-[92px] ${
                isActive
                  ? 'bg-gradient-to-b from-teal-950/90 to-slate-900 border-teal-500 shadow-lg shadow-teal-500/20 ring-2 ring-teal-500/40 scale-[1.02]'
                  : isAllowedNext
                  ? 'bg-slate-900/80 border-cyan-500/40 hover:border-cyan-400/80'
                  : hasVisited
                  ? 'bg-slate-900/40 border-slate-800 text-slate-400'
                  : 'bg-slate-950/40 border-slate-800/60 opacity-60'
              }`}
            >
              {/* Card Header: State Number & Indicator */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    isActive
                      ? 'bg-teal-500 text-white shadow-sm'
                      : isAllowedNext
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : hasVisited
                      ? 'bg-slate-800 text-slate-300'
                      : 'bg-slate-900 text-slate-500'
                  }`}
                >
                  S{stateNum}
                </span>

                {isActive && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                  </span>
                )}

                {!isActive && isAllowedNext && (
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
                    Permitted
                  </span>
                )}
              </div>

              {/* State Name */}
              <div className="my-1">
                <p
                  className={`text-xs font-semibold leading-tight ${
                    isActive
                      ? 'text-white font-bold'
                      : isAllowedNext
                      ? 'text-cyan-200'
                      : 'text-slate-300'
                  }`}
                >
                  {def.name}
                </p>
              </div>

              {/* Allowed Next transitions footer */}
              <div className="pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
                <span className="font-mono">
                  → [{def.allowedTransitions.map((n) => `S${n}`).join(',')}]
                </span>
                {hasVisited && !isActive && (
                  <CheckCircle2 className="w-3 h-3 text-emerald-500/70" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom bar */}
      <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-start space-x-2">
          <span className="font-mono text-teal-400 font-semibold uppercase shrink-0">
            State Objective:
          </span>
          <p className="text-slate-300 leading-relaxed">
            {currentDef?.description}
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-slate-400 font-medium">Valid Next:</span>
          <div className="flex items-center space-x-1.5">
            {allowedTransitions.map((tNum) => (
              <span
                key={tNum}
                className="px-2 py-0.5 rounded-md font-mono font-medium text-[11px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/30"
              >
                S{tNum} ({STATE_DEFINITIONS[tNum].name})
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
