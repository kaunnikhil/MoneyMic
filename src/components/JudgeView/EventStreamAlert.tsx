import React from 'react';
import {
  Radio,
  Sparkles,
  Wrench,
  Network,
  BellRing,
  GitBranch,
} from 'lucide-react';
import { SimulationState } from '../../types/simulation';

interface EventStreamAlertProps {
  simulationState: SimulationState | null;
  lastAction?: {
    type: 'EVENT_ARRIVED' | 'GEMINI_DECISION' | 'TOOL_CALLED' | 'CONNECTOR_RESPONDED' | 'USER_MESSAGE' | 'STATE_CHANGED';
    title: string;
    details: string;
    timestamp: string;
  } | null;
}

export const EventStreamAlert: React.FC<EventStreamAlertProps> = ({
  simulationState,
  lastAction,
}) => {
  if (!lastAction) {
    // Show calm idle status
    return (
      <div className="bg-slate-900/60 rounded-xl border border-slate-800/80 px-4 py-2.5 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-slate-300">SYSTEM IDLE:</span>
          <span>Ready for outside-world financial events or operator triggers.</span>
        </div>
        <span className="font-mono text-[11px] text-slate-500">
          Last Check: {new Date().toLocaleTimeString()}
        </span>
      </div>
    );
  }

  const getStyle = (type: NonNullable<EventStreamAlertProps['lastAction']>['type']) => {
    switch (type) {
      case 'EVENT_ARRIVED':
        return {
          icon: Radio,
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          border: 'border-amber-500/50',
          glow: 'shadow-amber-500/10',
          dot: 'bg-amber-400',
          label: 'EXTERNAL EVENT ARRIVED',
        };
      case 'GEMINI_DECISION':
        return {
          icon: Sparkles,
          badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
          border: 'border-indigo-500/50',
          glow: 'shadow-indigo-500/10',
          dot: 'bg-indigo-400',
          label: 'GEMINI DECISION COMMITTED',
        };
      case 'TOOL_CALLED':
        return {
          icon: Wrench,
          badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          border: 'border-cyan-500/50',
          glow: 'shadow-cyan-500/10',
          dot: 'bg-cyan-400',
          label: 'FUNCTION TOOL INVOKED',
        };
      case 'CONNECTOR_RESPONDED':
        return {
          icon: Network,
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          border: 'border-emerald-500/50',
          glow: 'shadow-emerald-500/10',
          dot: 'bg-emerald-400',
          label: 'CONNECTOR RESPONDED',
        };
      case 'USER_MESSAGE':
        return {
          icon: BellRing,
          badgeBg: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
          border: 'border-pink-500/50',
          glow: 'shadow-pink-500/10',
          dot: 'bg-pink-400',
          label: 'USER MESSAGE DELIVERED',
        };
      case 'STATE_CHANGED':
        return {
          icon: GitBranch,
          badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          border: 'border-purple-500/50',
          glow: 'shadow-purple-500/10',
          dot: 'bg-purple-400',
          label: 'STATE TRANSITION VALIDATED',
        };
    }
  };

  const style = getStyle(lastAction.type);
  const Icon = style.icon;

  return (
    <div
      className={`rounded-xl border ${style.border} bg-slate-900 px-4 py-3 shadow-lg ${style.glow} flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all duration-300`}
    >
      <div className="flex items-center space-x-3">
        <div className={`p-1.5 rounded-lg border ${style.badgeBg}`}>
          <Icon className="w-4 h-4 animate-bounce" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${style.badgeBg}`}>
              {style.label}
            </span>
            <span className="font-semibold text-white">{lastAction.title}</span>
          </div>
          <p className="text-slate-300 text-[11px] mt-0.5">{lastAction.details}</p>
        </div>
      </div>

      <div className="flex items-center space-x-2 shrink-0 font-mono text-[11px] text-slate-400">
        <span className={`w-2 h-2 rounded-full ${style.dot} animate-ping`} />
        <span>{lastAction.timestamp}</span>
      </div>
    </div>
  );
};
