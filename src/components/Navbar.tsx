import React from 'react';
import {
  Mic,
  RotateCcw,
  SlidersHorizontal,
  Eye,
  Sparkles,
  PlayCircle,
} from 'lucide-react';
import { SimulationState } from '../types/simulation';

interface NavbarProps {
  currentView: 'judge' | 'operator';
  onViewChange: (view: 'judge' | 'operator') => void;
  simulationState: SimulationState | null;
  onReset: (targetState: 0 | 1) => void;
  onStartScenario: () => void;
  onStepAgent: () => void;
  isProcessing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  simulationState,
  onReset,
  onStartScenario,
  onStepAgent,
  isProcessing,
}) => {
  const currentStateNum = simulationState?.currentState ?? 1;
  const status = simulationState?.simulationStatus ?? 'IDLE';

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand: MoneyMic */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <Mic className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                MoneyMic
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-mono bg-teal-500/15 text-teal-300 border border-teal-500/30">
                Agent Simulator
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                L3 Autonomy
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Aarav • October 2026 • ₹2,000 Dining Intention • Gemini 3.8 Flash
            </p>
          </div>
        </div>

        {/* View Switcher: Judge View vs Operator View */}
        <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/80">
          <button
            onClick={() => onViewChange('judge')}
            className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
              currentView === 'judge'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Judge View</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-slate-950/40 rounded text-slate-300">
              Audit Stream
            </span>
          </button>

          <button
            onClick={() => onViewChange('operator')}
            className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
              currentView === 'operator'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Operator View</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-amber-950/50 rounded text-amber-200">
              Raw Feed
            </span>
          </button>
        </div>

        {/* Simulation Status & Controls */}
        <div className="flex items-center space-x-2.5">
          {/* Status badge */}
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-950/60 rounded-lg border border-slate-800 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                isProcessing || status === 'PROCESSING'
                  ? 'bg-cyan-400 animate-ping'
                  : status === 'WAITING_USER_INPUT'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-emerald-400'
              }`}
            />
            <span className="font-mono text-[11px] text-slate-300">
              {isProcessing || status === 'PROCESSING'
                ? 'DECIDING'
                : status === 'WAITING_USER_INPUT'
                ? 'AWAITING USER'
                : 'MONITORING'}
            </span>
            <span className="text-slate-600">|</span>
            <span className="font-mono text-[11px] text-teal-400 font-semibold">
              State {currentStateNum}
            </span>
          </div>

          {/* Start Scenario (State 0) */}
          <button
            onClick={onStartScenario}
            disabled={isProcessing}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
            title="Start Scenario at State 0 (Setup)"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>Start Scenario</span>
          </button>

          {/* Step Agent */}
          <button
            onClick={onStepAgent}
            disabled={isProcessing}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
            title="Prompt Gemini 3.8 Flash to advance next step"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Step Agent</span>
          </button>

          {/* Reset Scenario */}
          <button
            onClick={() => onReset(1)}
            disabled={isProcessing}
            className="flex items-center space-x-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 hover:text-white text-xs font-medium rounded-lg border border-slate-700 transition-colors"
            title="Reset simulation state to State 1 (Monitoring)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
};
