import fs from 'fs';
import path from 'path';
import {
  SimulationState,
  OperatorStore,
  SimulationStateNum,
  STATE_DEFINITIONS,
  Transaction,
  DecisionLogEntry,
  ConnectorLogEntry,
  UserInteraction,
  PaymentAction,
  ContextualMemoryItem,
  OperatorAudioAsset,
  SpendingPaceCalculation,
} from '../src/types/simulation';
import {
  getInitialSimulationState,
  getInitialOperatorStore,
  calculateSpendingPace,
} from './defaultData';

export class SimulationStoreManager {
  private simulationState: SimulationState;
  private operatorStore: OperatorStore;
  private audioBuffers: Map<string, { buffer: Buffer; mimeType: string }> = new Map();
  private s5RetryCount: number = 0;

  constructor() {
    this.simulationState = getInitialSimulationState(false);
    this.operatorStore = getInitialOperatorStore();
    this.loadDefaultAudioFixtures();
  }

  private loadDefaultAudioFixtures(): void {
    const fixturePath = path.join(process.cwd(), 'server', 'fixtures', 'aarav_burma_burma_split.wav');
    if (fs.existsSync(fixturePath)) {
      const buffer = fs.readFileSync(fixturePath);
      this.audioBuffers.set('audio_aarav_burma_burma', { buffer, mimeType: 'audio/wav' });
    }
  }

  // --- AGENT-FACING STATE (NEVER CONTAINS HIDDEN GROUND TRUTH) ---
  public getSimulationState(): SimulationState {
    return JSON.parse(JSON.stringify(this.simulationState));
  }

  // --- OPERATOR-ONLY STORE (HIDDEN FACTS, SCENARIOS, AUDIO FIXTURES) ---
  public getOperatorStore(): OperatorStore {
    return JSON.parse(JSON.stringify(this.operatorStore));
  }

  public resetScenario(targetState: SimulationStateNum = 1): SimulationState {
    this.simulationState = getInitialSimulationState(targetState === 0);
    this.operatorStore = getInitialOperatorStore();
    this.loadDefaultAudioFixtures();
    this.s5RetryCount = 0;
    this.simulationState.currentState = targetState;
    this.simulationState.stateHistory.push({
      state: targetState,
      timestamp: new Date().toISOString(),
      reason: `Scenario Reset by operator to State ${targetState} [${STATE_DEFINITIONS[targetState].name}].`,
      transitionSource: 'OPERATOR_RESET',
    });
    this.simulationState.lastUpdated = new Date().toISOString();
    return this.getSimulationState();
  }

  public startScenario(): SimulationState {
    this.simulationState = getInitialSimulationState(true);
    this.operatorStore = getInitialOperatorStore();
    this.loadDefaultAudioFixtures();
    this.s5RetryCount = 0;
    this.simulationState.currentState = 0;
    this.simulationState.stateHistory = [
      {
        state: 0,
        timestamp: new Date().toISOString(),
        reason: 'State 0 Setup: MoneyMic simulation started for Aarav (October 2026, ₹2,000 Dining Intention, L3 Bounded Autonomy).',
        transitionSource: 'OPERATOR_RESET',
      },
    ];
    this.simulationState.lastUpdated = new Date().toISOString();
    return this.getSimulationState();
  }

  public validateAndSetState(
    nextState: SimulationStateNum,
    reason: string,
    transitionSource: 'GEMINI_DECISION' | 'SERVER_ENFORCED' | 'OPERATOR_RESET' | 'EXTERNAL_EVENT' = 'GEMINI_DECISION'
  ): { success: boolean; error?: string; currentState: SimulationStateNum; allowedTransitions: SimulationStateNum[] } {
    const currentState = this.simulationState.currentState;

    // Check S5 clarification retry constraint: "S5 -> S6 OR S5 once for a clarification retry"
    if (currentState === 5 && nextState === 5) {
      if (this.s5RetryCount >= 1) {
        const errorMsg = 'Invalid state transition rejected: Clarification retry already attempted once in State 5. Permitted transitions: State 6 [Pace Evaluation], State 1 [Monitoring (Park Unresolved)].';
        this.logConnector({
          connector: 'SYSTEM',
          mode: 'REAL',
          endpoint: '/sys/state-machine/transition',
          method: 'POST',
          request: { currentState, attemptedNextState: nextState, reason },
          response: { error: 'S5_RETRY_LIMIT_EXCEEDED', permitted: [6, 1] },
          status: 400,
          latencyMs: 1,
          notes: errorMsg,
        });
        return {
          success: false,
          error: errorMsg,
          currentState,
          allowedTransitions: [6, 1],
        };
      }
      this.s5RetryCount += 1;
    } else if (nextState === 5 && currentState !== 5) {
      this.s5RetryCount = 0;
    }

    if (currentState === nextState && currentState !== 5) {
      // Loopback in same state
      return { success: true, currentState, allowedTransitions: STATE_DEFINITIONS[currentState].allowedTransitions };
    }

    const allowed = STATE_DEFINITIONS[currentState].allowedTransitions;

    // Check if transition is permitted
    if (!allowed.includes(nextState)) {
      const errorMsg = `Invalid state transition rejected: Cannot transition from State ${currentState} (${STATE_DEFINITIONS[currentState].name}) to State ${nextState} (${STATE_DEFINITIONS[nextState].name}). Permitted transitions: ${allowed.map(s => `State ${s} [${STATE_DEFINITIONS[s].name}]`).join(', ')}`;
      
      this.logConnector({
        connector: 'SYSTEM',
        mode: 'REAL',
        endpoint: '/sys/state-machine/transition',
        method: 'POST',
        request: { currentState, attemptedNextState: nextState, reason },
        response: { error: 'INVALID_TRANSITION', permitted: allowed },
        status: 400,
        latencyMs: 1,
        notes: errorMsg,
      });

      return {
        success: false,
        error: errorMsg,
        currentState,
        allowedTransitions: allowed,
      };
    }

    // Permitted: apply transition
    this.simulationState.currentState = nextState;
    this.simulationState.stateHistory.push({
      state: nextState,
      timestamp: new Date().toISOString(),
      reason,
      previousState: currentState,
      transitionSource,
    });
    this.simulationState.lastUpdated = new Date().toISOString();

    return {
      success: true,
      currentState: nextState,
      allowedTransitions: STATE_DEFINITIONS[nextState].allowedTransitions,
    };
  }

  public logDecision(entry: Omit<DecisionLogEntry, 'id' | 'timestamp' | 'stateName'>): DecisionLogEntry {
    const id = `dec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fullEntry: DecisionLogEntry = {
      id,
      timestamp: new Date().toISOString(),
      state: entry.state,
      stateName: STATE_DEFINITIONS[entry.state]?.name || `State ${entry.state}`,
      decisionType: entry.decisionType,
      source: entry.source,
      decision: entry.decision,
      ruleId: entry.ruleId,
      action: entry.action,
      // Q2 evidence fields
      triggeringInput: entry.triggeringInput,
      transactionId: entry.transactionId,
      connectorUsed: entry.connectorUsed,
      exactUserMessage: entry.exactUserMessage,
    };

    this.simulationState.decisionLog.unshift(fullEntry);
    this.simulationState.lastUpdated = new Date().toISOString();
    return fullEntry;
  }

  public logConnector(entry: Omit<ConnectorLogEntry, 'id' | 'timestamp'>): ConnectorLogEntry {
    const id = `conn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fullEntry: ConnectorLogEntry = {
      id,
      timestamp: new Date().toISOString(),
      connector: entry.connector,
      mode: entry.mode,
      endpoint: entry.endpoint,
      method: entry.method,
      request: entry.request,
      response: entry.response,
      status: entry.status,
      latencyMs: entry.latencyMs,
      notes: entry.notes,
    };

    this.simulationState.connectorLog.unshift(fullEntry);
    this.simulationState.lastUpdated = new Date().toISOString();
    return fullEntry;
  }

  public isDiningVerified(t: Transaction): boolean {
    if (t.direction !== 'DEBIT') return false;
    if (t.amountStatus !== 'VERIFIED') return false;
    if (t.categoryStatus !== 'VERIFIED') return false;
    const cat = (t.category || '').toLowerCase();
    const isDining =
      cat === 'dining' ||
      cat.includes('dining') ||
      cat.includes('food') ||
      cat.includes('restaurant') ||
      cat.includes('coffee') ||
      cat.includes('cafe');
    return isDining && t.status !== 'REJECTED';
  }

  public recalculatePace(candidateAmount: number = 0): SpendingPaceCalculation {
    // Flag each transaction whether it is included in dining spend
    for (const t of this.simulationState.transactions) {
      t.includedInDiningSpend = this.isDiningVerified(t);
    }

    // Server-authoritative: Use ONLY VERIFIED dining transactions in primary dining pace calculation
    const verifiedSpend = this.simulationState.transactions
      .filter((t) => t.includedInDiningSpend)
      .reduce((sum, t) => sum + (t.direction === 'DEBIT' ? t.amount : -t.amount), 0);

    const calc = calculateSpendingPace(
      verifiedSpend,
      this.simulationState.financialIntent.monthlyLimit,
      this.simulationState.userProfile.currentDay,
      this.simulationState.userProfile.totalDays,
      candidateAmount
    );

    this.simulationState.spendingCalculations = calc;
    this.simulationState.lastUpdated = new Date().toISOString();
    return calc;
  }

  public updateFinancialIntent(
    newLimit: number,
    category: string = 'Dining',
    reason: string = 'User explicit confirmation'
  ): { success: boolean; oldLimit: number; newLimit: number } {
    const oldLimit = this.simulationState.financialIntent.monthlyLimit;
    this.simulationState.financialIntent.monthlyLimit = newLimit;
    this.simulationState.financialIntent.targetDailyPace = Math.round(
      newLimit / this.simulationState.userProfile.totalDays
    );
    this.simulationState.financialIntent.notes = `Updated dining intention: ₹${newLimit} (was ₹${oldLimit}). Confirmed reason: ${reason}`;
    this.recalculatePace();

    this.logDecision({
      state: this.simulationState.currentState,
      decisionType: 'USER_INTENTION_REVISED',
      source: 'USER_CONFIRMATION',
      decision: `Dining intention updated from ₹${oldLimit} to ₹${newLimit} following explicit user authorization.`,
      ruleId: 'RULE-L3-INTENT-REVISE-01',
      action: 'RECALCULATE_FINANCIAL_PACE',
    });

    return { success: true, oldLimit, newLimit };
  }

  public addTransaction(txn: Transaction): void {
    const existingIndex = this.simulationState.transactions.findIndex((t) => t.id === txn.id);
    if (existingIndex >= 0) {
      this.simulationState.transactions[existingIndex] = txn;
    } else {
      this.simulationState.transactions.unshift(txn);
    }

    if (txn.status === 'PENDING' || txn.status === 'NEEDS_CLARIFICATION' || txn.status === 'UNRESOLVED') {
      const uIndex = this.simulationState.unresolvedTransactions.findIndex((t) => t.id === txn.id);
      if (uIndex >= 0) {
        this.simulationState.unresolvedTransactions[uIndex] = txn;
      } else {
        this.simulationState.unresolvedTransactions.unshift(txn);
      }
    }

    this.simulationState.currentActiveTransactionId = txn.id;
    this.recalculatePace();
  }

  public updateTransaction(id: string, updates: Partial<Transaction>): Transaction | undefined {
    const txn = this.simulationState.transactions.find((t) => t.id === id);
    if (!txn) return undefined;

    Object.assign(txn, updates);

    if (txn.status === 'SETTLED' || txn.status === 'VERIFIED' || txn.status === 'REJECTED') {
      this.simulationState.unresolvedTransactions = this.simulationState.unresolvedTransactions.filter(
        (t) => t.id !== id
      );
    }

    this.recalculatePace();
    return txn;
  }

  public addContextualMemory(item: ContextualMemoryItem): void {
    const existingEntry = this.simulationState.contextualMemory[item.key];
    // Set the replacedPreviousEntry flag based on whether an existing entry is being overwritten
    const enrichedItem: ContextualMemoryItem = {
      ...item,
      replacedPreviousEntry: Boolean(existingEntry),
    };
    this.simulationState.contextualMemory[item.key] = enrichedItem;
    this.simulationState.lastUpdated = new Date().toISOString();
  }

  public addPendingUserInteraction(interaction: Omit<UserInteraction, 'id' | 'timestamp' | 'resolved'>): UserInteraction {
    const id = `usr_msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const fullInteraction: UserInteraction = {
      id,
      timestamp: new Date().toISOString(),
      resolved: false,
      ...interaction,
    };

    this.simulationState.pendingUserInteractions.unshift(fullInteraction);
    this.simulationState.simulationStatus = 'WAITING_USER_INPUT';
    this.simulationState.lastUpdated = new Date().toISOString();
    return fullInteraction;
  }

  public resolveUserInteraction(
    interactionId: string,
    responseType: UserInteraction['responseType'],
    payload: any,
    audioAssetId?: string,
    audioTranscript?: string
  ): UserInteraction | undefined {
    const item = this.simulationState.pendingUserInteractions.find((i) => i.id === interactionId);
    if (!item) return undefined;

    item.resolved = true;
    item.responseTimestamp = new Date().toISOString();
    item.responseType = responseType;
    item.responsePayload = payload;
    item.audioAssetId = audioAssetId;
    item.audioTranscript = audioTranscript;

    this.simulationState.simulationStatus = 'PROCESSING';
    this.simulationState.lastUpdated = new Date().toISOString();
    return item;
  }

  public addPendingPaymentAction(action: Omit<PaymentAction, 'id' | 'timestamp'>): PaymentAction {
    const id = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const fullAction: PaymentAction = {
      id,
      timestamp: new Date().toISOString(),
      ...action,
    };
    this.simulationState.pendingPaymentActions.unshift(fullAction);
    this.simulationState.lastUpdated = new Date().toISOString();
    return fullAction;
  }

  public setSimulationStatus(status: SimulationState['simulationStatus']): void {
    this.simulationState.simulationStatus = status;
    this.simulationState.lastUpdated = new Date().toISOString();
  }

  public setLastInteractionId(id: string | null): void {
    this.simulationState.lastInteractionId = id;
  }

  // --- OPERATOR STORE METHODS ---
  public toggleDelhivery(enabled?: boolean): boolean {
    if (enabled !== undefined) {
      this.operatorStore.delhiveryEnabled = enabled;
    } else {
      this.operatorStore.delhiveryEnabled = !this.operatorStore.delhiveryEnabled;
    }
    this.simulationState.permissions.allowDelhiveryLogistics = this.operatorStore.delhiveryEnabled;
    this.operatorStore.operatorLogs.unshift({
      timestamp: new Date().toISOString(),
      message: `Delhivery logistics connector ${this.operatorStore.delhiveryEnabled ? 'ENABLED' : 'DISABLED'} by operator.`,
      tag: 'CONNECTOR_TOGGLE',
    });
    return this.operatorStore.delhiveryEnabled;
  }

  public setPineLabsMode(mode: OperatorStore['pineLabsMode']): void {
    this.operatorStore.pineLabsMode = mode;
    this.operatorStore.operatorLogs.unshift({
      timestamp: new Date().toISOString(),
      message: `Pine Labs WoZ mode set to ${mode}`,
      tag: 'CONNECTOR_MODE',
    });
  }

  public registerAudioAsset(asset: OperatorAudioAsset, buffer?: Buffer): void {
    const existingIndex = this.operatorStore.audioAssets.findIndex((a) => a.id === asset.id);
    if (existingIndex >= 0) {
      this.operatorStore.audioAssets[existingIndex] = asset;
    } else {
      this.operatorStore.audioAssets.unshift(asset);
    }

    if (buffer) {
      this.audioBuffers.set(asset.id, { buffer, mimeType: asset.mimeType });
    }

    this.operatorStore.operatorLogs.unshift({
      timestamp: new Date().toISOString(),
      message: `Audio asset [${asset.id}] registered (${asset.fileName}, ${asset.languageCode}).`,
      tag: 'AUDIO_UPLOAD',
    });
  }

  public getAudioBuffer(id: string): { buffer: Buffer; mimeType: string } | undefined {
    return this.audioBuffers.get(id);
  }

  public getAudioAsset(id: string): OperatorAudioAsset | undefined {
    return this.operatorStore.audioAssets.find((a) => a.id === id);
  }
}

export const simulationStore = new SimulationStoreManager();
