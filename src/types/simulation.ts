export type SimulationStateNum = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

export interface StateDefinition {
  id: SimulationStateNum;
  code: string;
  name: string;
  description: string;
  allowedTransitions: SimulationStateNum[];
}

export const STATE_DEFINITIONS: Record<SimulationStateNum, StateDefinition> = {
  0: {
    id: 0,
    code: 'SETUP',
    name: 'Setup',
    description: 'Initial state: User profile (Aarav), monthly dining intention (₹2,000), bounded L3 authority, and policies loaded.',
    allowedTransitions: [1],
  },
  1: {
    id: 1,
    code: 'MONITORING',
    name: 'Monitoring',
    description: 'Passive listening state: Monitoring real-time financial feeds, webhook events, and SMS/UPI streams.',
    allowedTransitions: [1, 2],
  },
  2: {
    id: 2,
    code: 'INGESTION_VERIFY',
    name: 'Ingestion / Event Verification',
    description: 'Verifying inbound transaction integrity, amount, direction, and source without presuming merchant meaning.',
    allowedTransitions: [3, 1], // S2 -> S3 normal, S1 park/abort
  },
  3: {
    id: 3,
    code: 'UNDERSTANDING',
    name: 'Understanding',
    description: 'Analyzing payee, existing verified memory, and metadata. Missing context is marked UNKNOWN or parked.',
    allowedTransitions: [4, 1], // S3 -> S4 normal, S1 park/abort
  },
  4: {
    id: 4,
    code: 'CONTEXT_CONFIDENCE',
    name: 'Context Confidence',
    description: 'Assessing context certainty: Low impact + low confidence stays silent. Material drift triggers intervention.',
    allowedTransitions: [5, 6, 1], // S4 -> S5 (missing context) OR S6 (context sufficient), S1 park low impact
  },
  5: {
    id: 5,
    code: 'CONTEXT_INTERVENTION',
    name: 'Context Intervention',
    description: 'Asking minimal necessary clarification. Calls Gnani STT only when critical context could materially alter consequential decision.',
    allowedTransitions: [6, 5, 8, 1], // S5 -> S6 normal, S5 retry once, S8 user response, S1 park unresolved
  },
  6: {
    id: 6,
    code: 'PACE_EVALUATION',
    name: 'Pace Evaluation',
    description: 'Deterministic server-side arithmetic calculating monthly dining limit, elapsed period, burn velocity, and pace classification.',
    allowedTransitions: [7, 1], // S6 -> S7 normal, S1 park
  },
  7: {
    id: 7,
    code: 'DECISION',
    name: 'Decision',
    description: 'Applying L3 bounded autonomy rules: Stay Silent, Warn User, Intervene within Authority, or Request Explicit Action.',
    allowedTransitions: [1, 8, 9, 11], // S7 -> S1 silent, S8 user response/action, S9 execution, S11 contextual memory
  },
  8: {
    id: 8,
    code: 'USER_RESPONSE',
    name: 'User Response',
    description: 'Handling user voice clarification via Gnani or confirmation. Silence or ambiguity parks transaction as UNRESOLVED.',
    allowedTransitions: [3, 6, 9, 11, 1], // S8 -> S3 re-understand, S6 pace re-eval, S9 execution, S11 contextual memory, S1 park
  },
  9: {
    id: 9,
    code: 'EXECUTION',
    name: 'Execution',
    description: 'Executing within authorized bounds or logging verified decision. External payments handled only via authorized rails.',
    allowedTransitions: [10, 1], // S9 -> S10 normal, S1 park
  },
  10: {
    id: 10,
    code: 'VERIFICATION',
    name: 'Verification',
    description: 'Verifying execution settlement or reconciliation. Timeout/pending is not failure; reconcile before retry.',
    allowedTransitions: [11, 1], // S10 -> S11 normal, S1 park
  },
  11: {
    id: 11,
    code: 'CONTEXTUAL_MEMORY',
    name: 'Contextual Memory',
    description: 'Persisting only VERIFIED or explicitly confirmed financial context to reduce future unnecessary interruptions.',
    allowedTransitions: [1], // S11 -> S1 return to monitoring
  },
};

export type InformationStatus = 'VERIFIED' | 'INFERRED' | 'UNKNOWN' | 'CONFLICTED' | 'UNRESOLVED';

export type TransactionDirection = 'DEBIT' | 'CREDIT';
export type TransactionStatus = 'PENDING' | 'VERIFIED' | 'SUCCESS' | 'REJECTED' | 'NEEDS_CLARIFICATION' | 'SETTLED' | 'UNRESOLVED';

export interface Transaction {
  id: string;
  timestamp: string;
  amount: number;
  currency: string;
  direction: TransactionDirection;
  payee: string;
  paymentType: 'UPI' | 'CARD' | 'NET_BANKING' | 'POS' | 'AUTOPAY';
  status: TransactionStatus;
  source: string;
  rawMetadata?: Record<string, any>;
  category?: string;
  // Information status discipline
  amountStatus: InformationStatus;
  purposeStatus: InformationStatus;
  categoryStatus: InformationStatus;
  clarificationNotes?: string;
  // Financial audit flag
  includedInDiningSpend?: boolean;
}

export type PaceClassification = 'ALIGNED' | 'DRIFT' | 'MATERIAL_DRIFT' | 'INSUFFICIENT_DATA';

export interface PaceThresholdConfig {
  driftThresholdRatio: number; // e.g. 1.10
  materialDriftThresholdRatio: number; // e.g. 1.30
  minElapsedDaysForCalculation: number; // e.g. 1
}

export const SERVER_PACE_THRESHOLDS: PaceThresholdConfig = {
  driftThresholdRatio: 1.10, // Ratio > 1.10: spending drift beyond intended daily trajectory
  materialDriftThresholdRatio: 1.30, // Ratio > 1.30 or spend > monthly limit: material drift
  minElapsedDaysForCalculation: 1, // Minimum days before classification
};

export interface SpendingPaceCalculation {
  monthlyLimit: number;
  verifiedSpend: number;
  remainingLimit: number;
  elapsedDays: number;
  totalDays: number;
  expectedSpendToDate: number;
  actualPace: number;
  intendedPace: number;
  paceRatio: number;
  candidateAmount?: number;
  projectedSpend?: number;
  projectedPace?: number;
  paceClassification: PaceClassification;
  explanation: string;
  thresholds: PaceThresholdConfig;
}

export interface DecisionLogEntry {
  id: string;
  timestamp: string;
  state: SimulationStateNum;
  stateName: string;
  decisionType: string;
  source: string;
  decision: string;
  ruleId: string;
  action: string;
  // Q2 evidence fields
  triggeringInput?: string;      // What triggered this decision (raw event summary)
  transactionId?: string;        // Which transaction was being evaluated
  connectorUsed?: string;        // Which connector was used (GNANI_STT / PINE_LABS / etc.)
  exactUserMessage?: string;     // Exact wording of any user-facing message dispatched
}

export interface ConnectorLogEntry {
  id: string;
  timestamp: string;
  connector: 'GNANI_STT' | 'PINE_LABS' | 'DELHIVERY' | 'BANK_INGESTION' | 'SYSTEM';
  mode: 'REAL' | 'WIZARD_OF_OZ';
  endpoint: string;
  method: string;
  request: Record<string, any>;
  response: Record<string, any>;
  status: number;
  latencyMs: number;
  notes?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  currency: string;
  monthlyBudget: number; // ₹2,000 for dining intent
  currentDay: number; // e.g. Day 10 of 31 (October 2026)
  totalDays: number; // 31 days in October 2026
  riskTolerance: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
  autonomyLevel: 'L3';
}

export interface FinancialIntent {
  category: 'Dining';
  monthlyLimit: number; // ₹2,000
  targetDailyPace: number; // ~₹64.5/day
  strictPaceEnforcement: boolean;
  delegatedAuthority: {
    maxAutonomousTransaction: number; // ₹500 for routine dining
    requireConfirmationAbove: number; // > ₹500 requires explicit user confirmation
    allowExternalUpiInterception: false; // Agent cannot block arbitrary external UPI
    allowCategoryExpansion: false; // Bounded strictly to dining
  };
  notes: string;
}

export interface AgentPermissions {
  autonomousPaymentThreshold: number; // ₹500
  requireConfirmationAbove: number; // ₹500
  allowPineLabsPos: boolean; // WoZ adapter
  allowDelhiveryLogistics: boolean; // false for core scenario
}

export interface UserInteraction {
  id: string;
  timestamp: string;
  type: 'CLARIFICATION_REQUEST' | 'PACE_WARNING' | 'CONFIRMATION_REQUIRED' | 'ACTION_COMPLETED';
  message: string;
  requiresAudio: boolean;
  resolved: boolean;
  responseTimestamp?: string;
  responseType?: 'VOICE_NOTE' | 'BUTTON_APPROVE' | 'BUTTON_REJECT' | 'TEXT';
  responsePayload?: any;
  audioAssetId?: string;
  audioTranscript?: string;
}

export interface PaymentAction {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  payee: string;
  status: 'PENDING_APPROVAL' | 'SUBMITTED' | 'SUCCESS' | 'FAILED' | 'RECONCILING';
  pineTransactionId?: string;
  timestamp: string;
  completedAt?: string;
  notes?: string;
}

export interface ContextualMemoryItem {
  key: string;
  payeePattern: string;
  resolvedCategory: string;
  informationStatus: InformationStatus;
  confidence: number;
  notes: string;
  learnedAt: string;
  policyTag: string;
  // Memory audit trail (Q4)
  memorySource?: string;           // e.g. 'USER_VOICE_GNANI' | 'VERIFIED_METADATA' | 'OPERATOR_FIXTURE'
  transactionId?: string;          // Transaction that caused this memory to be written
  replacedPreviousEntry?: boolean; // True if this overwrote an existing memory for the same key
  conflictDetail?: string;         // If CONFLICTED, description of what conflicted
}

export interface SimulationState {
  userProfile: UserProfile;
  financialIntent: FinancialIntent;
  permissions: AgentPermissions;
  currentState: SimulationStateNum;
  stateHistory: {
    state: SimulationStateNum;
    timestamp: string;
    reason: string;
    previousState?: SimulationStateNum;       // Q3: where we transitioned FROM
    transitionSource?: 'GEMINI_DECISION' | 'SERVER_ENFORCED' | 'OPERATOR_RESET' | 'EXTERNAL_EVENT'; // Q3: who drove the transition
  }[];
  transactions: Transaction[];
  unresolvedTransactions: Transaction[];
  contextualMemory: Record<string, ContextualMemoryItem>;
  spendingCalculations: SpendingPaceCalculation;
  pendingUserInteractions: UserInteraction[];
  pendingPaymentActions: PaymentAction[];
  decisionLog: DecisionLogEntry[];
  connectorLog: ConnectorLogEntry[];
  simulationStatus: 'IDLE' | 'PROCESSING' | 'WAITING_USER_INPUT' | 'ERROR';
  currentActiveTransactionId?: string;
  lastInteractionId?: string | null;
  lastUpdated: string;
}

// OPERATOR STORE - STRICTLY HIDDEN FROM AGENT
export interface GroundTruthScenario {
  id: string;
  title: string;
  badge: string;
  description: string;
  hiddenFacts: {
    realMerchantNature: string;
    trueIntent: string;
    expectedCategory: string;
    expectedAgentDecision: string;
    operatorReasoning: string;
  };
  sampleTransaction: Transaction;
  suggestedVoiceNote?: {
    assetId: string;
    audioFileName: string;
    expectedTranscript: string;
    languageCode: string;
  };
}

export interface OperatorAudioAsset {
  id: string;
  fileName: string;
  mimeType: string;
  durationSeconds: number;
  uploadedAt: string;
  languageCode: string;
  storedTranscript: string;
  url: string;
  dataBase64?: string;
}

export interface OperatorStore {
  delhiveryEnabled: boolean;
  pineLabsMode: 'NORMAL' | 'SIMULATE_TIMEOUT' | 'SIMULATE_DECLINE';
  scenarios: GroundTruthScenario[];
  audioAssets: OperatorAudioAsset[];
  operatorLogs: { timestamp: string; message: string; tag: string }[];
}
