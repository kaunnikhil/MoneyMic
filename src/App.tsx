/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  SimulationState,
  OperatorStore,
  Transaction,
  UserInteraction,
  OperatorAudioAsset,
} from './types/simulation';
import { Navbar } from './components/Navbar';
import { StateMachineVisualizer } from './components/JudgeView/StateMachineVisualizer';
import { FinancialStateHeader } from './components/JudgeView/FinancialStateHeader';
import { DecisionLogTable } from './components/JudgeView/DecisionLogTable';
import { ConnectorTraceTable } from './components/JudgeView/ConnectorTraceTable';
import { UserFacingCenter } from './components/JudgeView/UserFacingCenter';
import { EventStreamAlert } from './components/JudgeView/EventStreamAlert';
import { ToolLoopExecutionTrace } from './components/JudgeView/ToolLoopExecutionTrace';
import { ScenarioLauncher } from './components/OperatorView/ScenarioLauncher';
import { RawEventInjector } from './components/OperatorView/RawEventInjector';
import { CsvIngestionStudio } from './components/OperatorView/CsvIngestionStudio';
import { VoiceNoteStudio } from './components/OperatorView/VoiceNoteStudio';
import { ConnectorMockControls } from './components/OperatorView/ConnectorMockControls';
import { HiddenGroundTruthPanel } from './components/OperatorView/HiddenGroundTruthPanel';
import { RefreshCw } from 'lucide-react';
import { safeFetchJson } from './utils/api';

export default function App() {
  const [currentView, setCurrentView] = useState<'judge' | 'operator'>('judge');
  const [simulationState, setSimulationState] = useState<SimulationState | null>(null);
  const [operatorStore, setOperatorStore] = useState<OperatorStore | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastAction, setLastAction] = useState<{
    type: 'EVENT_ARRIVED' | 'GEMINI_DECISION' | 'TOOL_CALLED' | 'CONNECTOR_RESPONDED' | 'USER_MESSAGE' | 'STATE_CHANGED';
    title: string;
    details: string;
    timestamp: string;
  } | null>(null);

  const prevDecisionCountRef = useRef(0);
  const prevConnectorCountRef = useRef(0);
  const prevStateRef = useRef<number | null>(null);
  const prevInteractionCountRef = useRef(0);

  // Fetch simulation state from server
  const fetchState = useCallback(async () => {
    const { ok, data } = await safeFetchJson<SimulationState>('/api/simulation/state');
    if (ok && data) {
      setSimulationState(data);

      if (prevStateRef.current !== null && prevStateRef.current !== data.currentState) {
        setLastAction({
          type: 'STATE_CHANGED',
          title: `State Transition: State ${prevStateRef.current} → State ${data.currentState}`,
          details: `Validated transition to State ${data.currentState} [${data.stateHistory[data.stateHistory.length - 1]?.reason || 'Autonomous progression'}]`,
          timestamp: new Date().toLocaleTimeString(),
        });
      }
      prevStateRef.current = data.currentState;

      if (data.decisionLog.length > prevDecisionCountRef.current && prevDecisionCountRef.current > 0) {
        const latestDec = data.decisionLog[0];
        setLastAction({
          type: 'GEMINI_DECISION',
          title: `[${latestDec.ruleId}] ${latestDec.decisionType}`,
          details: `${latestDec.decision} → Action: ${latestDec.action}`,
          timestamp: new Date().toLocaleTimeString(),
        });
      }
      prevDecisionCountRef.current = data.decisionLog.length;

      if (data.connectorLog.length > prevConnectorCountRef.current && prevConnectorCountRef.current > 0) {
        const latestConn = data.connectorLog[0];
        setLastAction({
          type: 'CONNECTOR_RESPONDED',
          title: `${latestConn.connector} (${latestConn.mode}) ${latestConn.endpoint}`,
          details: `Status ${latestConn.status} in ${latestConn.latencyMs}ms: ${latestConn.notes || 'Payload delivered'}`,
          timestamp: new Date().toLocaleTimeString(),
        });
      }
      prevConnectorCountRef.current = data.connectorLog.length;

      if (data.pendingUserInteractions.length > prevInteractionCountRef.current && prevInteractionCountRef.current > 0) {
        const latestInt = data.pendingUserInteractions[0];
        setLastAction({
          type: 'USER_MESSAGE',
          title: `User Prompt: ${latestInt.type}`,
          details: latestInt.message,
          timestamp: new Date().toLocaleTimeString(),
        });
      }
      prevInteractionCountRef.current = data.pendingUserInteractions.length;
    }
  }, []);

  // Fetch operator store (hidden ground truth)
  const fetchOperatorStore = useCallback(async () => {
    const { ok, data } = await safeFetchJson<OperatorStore>('/api/operator/ground-truth');
    if (ok && data) {
      setOperatorStore(data);
    }
  }, []);

  useEffect(() => {
    fetchState();
    fetchOperatorStore();

    const interval = setInterval(() => {
      fetchState();
      fetchOperatorStore();
    }, 1200);

    return () => clearInterval(interval);
  }, [fetchState, fetchOperatorStore]);

  // Actions
  const handleStartScenario = async () => {
    setIsProcessing(true);
    try {
      const { ok, data } = await safeFetchJson('/api/simulation/start', {
        method: 'POST',
      });
      if (ok && data?.state) {
        setSimulationState(data.state);
        setLastAction({
          type: 'STATE_CHANGED',
          title: 'MoneyMic Scenario Started',
          details: 'Initialized at State 0 Setup for Aarav (October 2026, ₹2,000 Dining Intention, L3 Bounded Autonomy).',
          timestamp: new Date().toLocaleTimeString(),
        });
      }
      await fetchOperatorStore();
    } catch (err) {
      console.error('Failed to start scenario:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInjectEvent = async (txn: Transaction) => {
    setIsProcessing(true);
    setLastAction({
      type: 'EVENT_ARRIVED',
      title: `Raw Financial Event Received: ${txn.payee}`,
      details: `Amount: ₹${txn.amount} ${txn.currency} • Source: ${txn.source} • Direction: ${txn.direction}`,
      timestamp: new Date().toLocaleTimeString(),
    });

    try {
      const { ok, data } = await safeFetchJson('/api/operator/inject-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction: txn, triggerAgent: true }),
      });
      if (ok && data?.state) {
        setSimulationState(data.state);
      }
      await fetchOperatorStore();
    } catch (err) {
      console.error('Failed to inject event:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRespondUser = async (
    interactionId: string,
    responseType: UserInteraction['responseType'],
    payload: any,
    audioAssetId?: string,
    audioTranscript?: string
  ) => {
    setIsProcessing(true);
    setLastAction({
      type: 'USER_MESSAGE',
      title: `User Clarification Provided: ${responseType}`,
      details: audioAssetId ? `Supplied Audio Asset: [${audioAssetId}]` : `Payload: ${JSON.stringify(payload)}`,
      timestamp: new Date().toLocaleTimeString(),
    });

    try {
      const { ok, data } = await safeFetchJson('/api/operator/respond-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interactionId,
          responseType,
          payload,
          audioAssetId,
          audioTranscript,
          triggerAgent: true,
        }),
      });
      if (ok && data?.state) {
        setSimulationState(data.state);
      }
      await fetchOperatorStore();
    } catch (err) {
      console.error('Failed to submit user response:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStepAgent = async () => {
    setIsProcessing(true);
    try {
      const { ok, data } = await safeFetchJson('/api/simulation/step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'Continue autonomous financial processing for Aarav according to MoneyMic L3 state rules.' }),
      });
      if (ok && data?.state) {
        setSimulationState(data.state);
      }
      await fetchOperatorStore();
    } catch (err) {
      console.error('Failed to step agent:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = async (targetState: 0 | 1) => {
    setIsProcessing(true);
    try {
      const { ok, data } = await safeFetchJson('/api/simulation/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetState }),
      });
      if (ok && data?.state) {
        setSimulationState(data.state);
      }
      setLastAction({
        type: 'STATE_CHANGED',
        title: `Simulation Reset to State ${targetState}`,
        details: 'Ledger and state machine reset to clean test baseline.',
        timestamp: new Date().toLocaleTimeString(),
      });
      await fetchOperatorStore();
    } catch (err) {
      console.error('Failed to reset simulation:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfigureConnector = async (config: { delhiveryEnabled?: boolean; pineLabsMode?: OperatorStore['pineLabsMode'] }) => {
    try {
      const { ok, data } = await safeFetchJson('/api/operator/configure-connector', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (ok && data) {
        if (data.operatorStore) setOperatorStore(data.operatorStore);
        if (data.state) setSimulationState(data.state);
      }
    } catch (err) {
      console.error('Failed to configure connector:', err);
    }
  };

  const handleUploadAudio = async (asset: OperatorAudioAsset, dataBase64?: string) => {
    try {
      const { ok } = await safeFetchJson('/api/operator/upload-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId: asset.id,
          fileName: asset.fileName,
          languageCode: asset.languageCode,
          storedTranscript: asset.storedTranscript,
          dataBase64,
        }),
      });
      if (ok) {
        await fetchOperatorStore();
      }
    } catch (err) {
      console.error('Failed to upload audio asset:', err);
    }
  };

  if (!simulationState) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="inline-block p-3 rounded-2xl bg-teal-600/20 text-teal-400 border border-teal-500/30 animate-spin">
            <RefreshCw className="w-8 h-8" />
          </div>
          <h1 className="text-lg font-bold text-white tracking-wide">
            Mounting MoneyMic Agent Simulator...
          </h1>
          <p className="text-xs text-slate-400">
            Initializing 12-state financial engine with Gemini 3.8 Flash Interactions API
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500/30">
      {/* Top Navigation */}
      <Navbar
        currentView={currentView}
        onViewChange={setCurrentView}
        simulationState={simulationState}
        onReset={handleReset}
        onStartScenario={handleStartScenario}
        onStepAgent={handleStepAgent}
        isProcessing={isProcessing}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* Real-Time Screen-Recording Alert Bar */}
        <EventStreamAlert
          simulationState={simulationState}
          lastAction={lastAction}
        />

        {/* --- VIEW 1: JUDGE VIEW (SCREEN-RECORDING AUDIT STREAM) --- */}
        {currentView === 'judge' && (
          <div className="space-y-5">
            {/* 1. State Machine (States 0-11) */}
            <StateMachineVisualizer
              currentState={simulationState.currentState}
              stateHistory={simulationState.stateHistory}
              isTransitioning={isProcessing}
            />

            {/* 2. Deterministic Financial State Header */}
            <FinancialStateHeader
              userProfile={simulationState.userProfile}
              financialIntent={simulationState.financialIntent}
              calculations={simulationState.spendingCalculations}
            />

            {/* 3. Phase 3.3 Gemini Tool-Calling Execution Trace & Status */}
            <ToolLoopExecutionTrace simulationState={simulationState} />

            {/* 4. Decision Log & Connector Trace Side-by-Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <DecisionLogTable decisionLog={simulationState.decisionLog} />
              <ConnectorTraceTable connectorLog={simulationState.connectorLog} />
            </div>

            {/* 4. User Notification Center & Contextual Memory (State 11) */}
            <UserFacingCenter
              pendingInteractions={simulationState.pendingUserInteractions}
              contextualMemory={simulationState.contextualMemory}
              transactions={simulationState.transactions}
              onRespondUser={handleRespondUser}
              isProcessing={isProcessing}
            />
          </div>
        )}

        {/* --- VIEW 2: OPERATOR VIEW (WIZARD-OF-OZ CONTROL CENTER) --- */}
        {currentView === 'operator' && operatorStore && (
          <div className="space-y-5">
            {/* 1. Curated Outside-World Scenarios */}
            <ScenarioLauncher
              scenarios={operatorStore.scenarios}
              onInjectEvent={handleInjectEvent}
              isProcessing={isProcessing}
            />

            {/* 2. Raw Event Builder & Connector Mock Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <RawEventInjector
                onInjectEvent={handleInjectEvent}
                isProcessing={isProcessing}
              />
              <ConnectorMockControls
                delhiveryEnabled={operatorStore.delhiveryEnabled}
                pineLabsMode={operatorStore.pineLabsMode}
                onConfigureConnector={handleConfigureConnector}
                isProcessing={isProcessing}
              />
            </div>

            {/* 3. CSV Ingestion Studio */}
            <CsvIngestionStudio
              onInjectEvent={handleInjectEvent}
              isProcessing={isProcessing}
            />

            {/* 4. Voice Note Audio Studio & Gnani STT */}
            <VoiceNoteStudio
              audioAssets={operatorStore.audioAssets}
              pendingInteractions={simulationState.pendingUserInteractions}
              onUploadAudio={handleUploadAudio}
              onRespondUser={handleRespondUser}
              isProcessing={isProcessing}
            />

            {/* 5. Operator-Only Hidden Ground Truth Panel */}
            <HiddenGroundTruthPanel
              scenarios={operatorStore.scenarios}
              simulationState={simulationState}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>MoneyMic Autonomous Financial Agent • L3 Bounded Autonomy Simulator</span>
          <span>Powered by Gemini 3.8 Flash Interactions API & Gnani STT</span>
        </div>
      </footer>
    </div>
  );
}
