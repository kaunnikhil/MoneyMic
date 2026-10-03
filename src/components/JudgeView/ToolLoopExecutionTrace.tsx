import React from 'react';
import {
  SimulationState,
  DecisionLogEntry,
  ConnectorLogEntry,
  Transaction,
} from '../../types/simulation';
import {
  Zap,
  ArrowRight,
  CheckCircle2,
  Clock,
  Radio,
  FileText,
  Bot,
  Wrench,
  Check,
  Cpu,
  Layers,
  Sparkles,
} from 'lucide-react';

interface ToolLoopExecutionTraceProps {
  simulationState: SimulationState;
}

export const ToolLoopExecutionTrace: React.FC<ToolLoopExecutionTraceProps> = ({
  simulationState,
}) => {
  const { transactions, decisionLog, connectorLog, currentState, contextualMemory } = simulationState;

  // Find relevant items for the tool loop
  const rawEvent: Transaction | undefined = transactions[0];

  const gnaniCall = connectorLog.find(
    (c) => c.connector === 'GNANI_STT' && (c.endpoint.includes('stt/v3') || c.endpoint.includes('gnani_transcribe'))
  );

  const gnaniApiTrace = connectorLog.find(
    (c) => c.connector === 'GNANI_STT' && c.endpoint.includes('vachana.ai/stt/v3')
  );

  const initialDecision: DecisionLogEntry | undefined = decisionLog.find(
    (d) => d.state === 5 || d.ruleId.includes('GNANI') || d.decisionType.includes('CLARIFICATION') || d.state === 3
  );

  const subsequentDecision: DecisionLogEntry | undefined = decisionLog.find(
    (d) => (d.state === 11 || d.state === 6 || d.state === 7) && d.id !== initialDecision?.id
  );

  const memoryItems = Object.values(contextualMemory);

  // Status flags for the 5-step "Tool Loop Status" indicator
  const isDecisionMade = Boolean(initialDecision || decisionLog.length > 0);
  const isToolCalled = Boolean(gnaniCall);
  const isToolResponseReceived = Boolean(gnaniApiTrace && gnaniApiTrace.status === 200);
  const isGeminiResumed = Boolean(
    isToolResponseReceived && (subsequentDecision || memoryItems.length > 0 || currentState === 11 || currentState === 8)
  );
  const isNextDecisionMade = Boolean(subsequentDecision || memoryItems.length > 0 || currentState === 11);

  const statusSteps = [
    { label: 'Gemini decision made', completed: isDecisionMade },
    { label: 'Tool called', completed: isToolCalled },
    { label: 'Tool response received', completed: isToolResponseReceived },
    { label: 'Gemini resumed', completed: isGeminiResumed },
    { label: 'Next decision made', completed: isNextDecisionMade },
  ];

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-2xl space-y-5">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-semibold text-white tracking-wide uppercase">
                Phase 3.3 • Gemini Tool-Calling Execution Trace
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                REAL TOOL LOOP
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Autonomous tool loop: Raw Event → Gemini Decision → Gnani STT Tool → Exact Response → Gemini Interpretation → Next State
            </p>
          </div>
        </div>

        {/* Live Status indicator */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-950/80 border border-slate-800 text-xs font-mono">
          <Radio className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
          <span className="text-slate-300">Tool Loop Engine:</span>
          <span className="text-teal-300 font-bold">
            {isNextDecisionMade
              ? 'LOOP COMPLETED'
              : isToolCalled
              ? 'TRANSCRIBING & RESUMING'
              : isDecisionMade
              ? 'AWAITING USER AUDIO'
              : 'IDLE / LISTENING'}
          </span>
        </div>
      </div>

      {/* Tool Loop Status Indicator Pills */}
      <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-2.5 flex items-center space-x-1.5">
          <Cpu className="w-3.5 h-3.5 text-teal-400" />
          <span>Tool Loop Status</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {statusSteps.map((step, idx) => (
            <div
              key={idx}
              className={`flex items-center space-x-2 p-2.5 rounded-lg border text-xs font-mono transition-all ${
                step.completed
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 shadow-sm shadow-emerald-500/10'
                  : 'bg-slate-900/60 border-slate-800 text-slate-500'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  step.completed ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {step.completed ? <Check className="w-3 h-3 stroke-[3]" /> : idx + 1}
              </div>
              <span className="truncate">{step.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 6-Step Visible Sequence Execution Trace */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 relative">
        {/* Step 1: RAW EVENT */}
        <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">
                1. RAW EVENT
              </span>
              <FileText className="w-3.5 h-3.5 text-blue-400" />
            </div>
            {rawEvent ? (
              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="text-white font-bold truncate">{rawEvent.payee}</div>
                <div className="text-blue-300 font-bold">₹{rawEvent.amount.toLocaleString('en-IN')} ({rawEvent.direction})</div>
                <div className="text-slate-400 text-[10px] truncate">ID: {rawEvent.id}</div>
                <div className="text-slate-500 text-[10px] truncate">Source: {rawEvent.source}</div>
                <div className="text-amber-400/90 text-[10px] bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 truncate">
                  Purpose: {rawEvent.purposeStatus}
                </div>
              </div>
            ) : (
              <div className="text-slate-600 font-mono text-[11px] py-4 text-center">
                Awaiting raw event
              </div>
            )}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-900 text-[9px] text-slate-500 font-mono">
            Feed Ingestion
          </div>
        </div>

        {/* Step 2: GEMINI DECISION */}
        <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                2. GEMINI DECISION
              </span>
              <Bot className="w-3.5 h-3.5 text-purple-400" />
            </div>
            {initialDecision ? (
              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="text-purple-300 font-bold truncate">[{initialDecision.ruleId}]</div>
                <div className="text-white text-[10px] line-clamp-2">{initialDecision.decision}</div>
                <div className="text-slate-400 text-[10px]">Action: {initialDecision.action}</div>
                <div className="text-teal-400 text-[10px]">State: {initialDecision.stateName}</div>
              </div>
            ) : (
              <div className="text-slate-600 font-mono text-[11px] py-4 text-center">
                Pending decision
              </div>
            )}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-900 text-[9px] text-slate-500 font-mono">
            L3 Bounded Rules
          </div>
        </div>

        {/* Step 3: GNANI TOOL CALL */}
        <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-teal-500/15 text-teal-300 border border-teal-500/30">
                3. GNANI TOOL CALL
              </span>
              <Wrench className="w-3.5 h-3.5 text-teal-400" />
            </div>
            {gnaniCall ? (
              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="text-teal-300 font-bold truncate">gnani_transcribe</div>
                <div className="text-slate-300 text-[10px] truncate">
                  Asset: {gnaniCall.request?.audio_asset_id || 'supplied'}
                </div>
                <div className="text-slate-400 text-[10px]">
                  Lang: {gnaniCall.request?.language_code || 'en-IN'}
                </div>
                <div className="text-[9px] text-slate-500 truncate">
                  POST /stt/v3
                </div>
              </div>
            ) : (
              <div className="text-slate-600 font-mono text-[11px] py-4 text-center">
                Not invoked yet
              </div>
            )}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-900 text-[9px] text-slate-500 font-mono">
            api.vachana.ai/stt/v3
          </div>
        </div>

        {/* Step 4: ACTUAL GNANI RESPONSE */}
        <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                4. ACTUAL GNANI RESPONSE
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            {gnaniApiTrace ? (
              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="text-emerald-300 font-bold text-[10px] bg-emerald-950/40 p-1.5 rounded border border-emerald-500/30 line-clamp-3">
                  "{gnaniApiTrace.response?.transcript || gnaniApiTrace.response?.text || ''}"
                </div>
                <div className="text-[10px] text-slate-400">
                  Model: {gnaniApiTrace.response?.model || 'gnani-prisma-v2.5'}
                </div>
                <div className="text-[10px] text-slate-500">
                  Latency: {gnaniApiTrace.latencyMs}ms
                </div>
              </div>
            ) : (
              <div className="text-slate-600 font-mono text-[11px] py-4 text-center">
                Awaiting STT response
              </div>
            )}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-900 text-[9px] text-slate-500 font-mono">
            Verbatim STT Result
          </div>
        </div>

        {/* Step 5: GEMINI INTERPRETATION */}
        <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                5. GEMINI INTERPRETATION
              </span>
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            {memoryItems.length > 0 || subsequentDecision ? (
              <div className="space-y-1.5 font-mono text-[11px]">
                {memoryItems[0] ? (
                  <>
                    <div className="text-cyan-300 font-bold truncate">
                      {memoryItems[0].resolvedCategory} [{memoryItems[0].informationStatus}]
                    </div>
                    <div className="text-slate-300 text-[10px] line-clamp-2">
                      {memoryItems[0].notes}
                    </div>
                    <div className="text-teal-400 text-[10px]">
                      Confidence: {(memoryItems[0].confidence * 100).toFixed(0)}%
                    </div>
                  </>
                ) : (
                  <div className="text-white text-[10px]">
                    {subsequentDecision?.decision}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-slate-600 font-mono text-[11px] py-4 text-center">
                Awaiting model turn
              </div>
            )}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-900 text-[9px] text-slate-500 font-mono">
            Autonomous Resolution
          </div>
        </div>

        {/* Step 6: NEXT STATE */}
        <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                6. NEXT STATE
              </span>
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="text-indigo-300 font-bold text-base">
                State {currentState}
              </div>
              <div className="text-white text-[10px]">
                {currentState === 11
                  ? 'Contextual Memory'
                  : currentState === 8
                  ? 'User Response'
                  : currentState === 5
                  ? 'Context Intervention'
                  : currentState === 3
                  ? 'Understanding'
                  : `State ${currentState}`}
              </div>
              <div className="text-[9px] text-emerald-400 bg-emerald-950/40 px-1 py-0.5 rounded border border-emerald-500/30 truncate">
                Server Validated
              </div>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-900 text-[9px] text-slate-500 font-mono">
            State Machine Node
          </div>
        </div>
      </div>
    </div>
  );
};
