import {
  SimulationState,
  OperatorStore,
  SpendingPaceCalculation,
  GroundTruthScenario,
  OperatorAudioAsset,
  PaceClassification,
  SERVER_PACE_THRESHOLDS,
} from '../src/types/simulation';

export function calculateSpendingPace(
  verifiedSpend: number,
  monthlyLimit: number = 2000,
  elapsedDays: number = 10,
  totalDays: number = 31,
  candidateAmount: number = 0
): SpendingPaceCalculation {
  const remainingLimit = Math.max(0, monthlyLimit - verifiedSpend);
  const expectedSpendToDate = Math.round((monthlyLimit / totalDays) * elapsedDays);
  const actualPace = elapsedDays > 0 ? Math.round(verifiedSpend / elapsedDays) : 0;
  const intendedPace = Math.round(monthlyLimit / totalDays);
  const paceRatio = expectedSpendToDate > 0 ? parseFloat((verifiedSpend / expectedSpendToDate).toFixed(2)) : (actualPace > 0 ? 1.0 : 0.0);
  const projectedSpend = verifiedSpend + candidateAmount;
  const projectedPace = elapsedDays > 0 ? Math.round(projectedSpend / elapsedDays) : 0;

  let paceClassification: PaceClassification = 'ALIGNED';
  let explanation = '';

  if (elapsedDays < SERVER_PACE_THRESHOLDS.minElapsedDaysForCalculation) {
    paceClassification = 'INSUFFICIENT_DATA';
    explanation = 'Insufficient elapsed tracking period in current month to establish spending pace classification.';
  } else if (projectedSpend > monthlyLimit || paceRatio > SERVER_PACE_THRESHOLDS.materialDriftThresholdRatio) {
    paceClassification = 'MATERIAL_DRIFT';
    explanation = `Spending velocity (${paceRatio}x baseline, policy threshold > ${SERVER_PACE_THRESHOLDS.materialDriftThresholdRatio}) or projected dining spend (₹${projectedSpend}) exceeds monthly ceiling of ₹${monthlyLimit}.`;
  } else if (paceRatio > SERVER_PACE_THRESHOLDS.driftThresholdRatio) {
    paceClassification = 'DRIFT';
    explanation = `Dining spend rate (${paceRatio}x baseline, policy threshold > ${SERVER_PACE_THRESHOLDS.driftThresholdRatio}) indicates spending drift beyond intended daily trajectory.`;
  } else {
    paceClassification = 'ALIGNED';
    explanation = `Dining spend is aligned with pro-rata trajectory (${paceRatio}x baseline, policy target <= ${SERVER_PACE_THRESHOLDS.driftThresholdRatio}). Pace healthy.`;
  }

  return {
    monthlyLimit,
    verifiedSpend,
    remainingLimit,
    elapsedDays,
    totalDays,
    expectedSpendToDate,
    actualPace,
    intendedPace,
    paceRatio,
    candidateAmount,
    projectedSpend,
    projectedPace,
    paceClassification,
    explanation,
    thresholds: SERVER_PACE_THRESHOLDS,
  };
}

export function getInitialSimulationState(startAtState0: boolean = false): SimulationState {
  const initialCalculations = calculateSpendingPace(0, 2000, 10, 31);

  return {
    userProfile: {
      id: 'usr_aarav_oct2026',
      name: 'Aarav',
      email: 'aarav@moneymic.app',
      currency: 'INR',
      monthlyBudget: 2000,
      currentDay: 10,
      totalDays: 31,
      riskTolerance: 'MODERATE',
      autonomyLevel: 'L3',
    },
    financialIntent: {
      category: 'Dining',
      monthlyLimit: 2000,
      targetDailyPace: Math.round(2000 / 31),
      strictPaceEnforcement: true,
      delegatedAuthority: {
        maxAutonomousTransaction: 500,
        requireConfirmationAbove: 500,
        allowExternalUpiInterception: false,
        allowCategoryExpansion: false,
      },
      notes: 'October 2026: Monthly dining spending intention of ₹2,000. L3 bounded autonomy for dining expenses.',
    },
    permissions: {
      autonomousPaymentThreshold: 500,
      requireConfirmationAbove: 500,
      allowPineLabsPos: true,
      allowDelhiveryLogistics: false, // Disabled for core scenario
    },
    currentState: startAtState0 ? 0 : 1, // Start at 0 (Setup) or 1 (Monitoring)
    stateHistory: startAtState0
      ? [
          {
            state: 0,
            timestamp: new Date().toISOString(),
            reason: 'State 0 Setup: MoneyMic initialized for Aarav (October 2026, ₹2,000 Dining Intention, L3 Bounded Autonomy).',
          },
        ]
      : [
          {
            state: 0,
            timestamp: '2026-10-01T00:00:00Z',
            reason: 'MoneyMic initialized with Aarav profile & ₹2,000 dining intention.',
          },
          {
            state: 1,
            timestamp: '2026-10-01T00:00:01Z',
            reason: 'State 1 Monitoring: Passive listening on inbound financial feeds.',
          },
        ],
    transactions: [],
    unresolvedTransactions: [],
    contextualMemory: {},
    spendingCalculations: initialCalculations,
    pendingUserInteractions: [],
    pendingPaymentActions: [],
    decisionLog: [],
    connectorLog: [],
    simulationStatus: 'IDLE',
    lastInteractionId: null,
    lastUpdated: new Date().toISOString(),
  };
}

export function getInitialOperatorStore(): OperatorStore {
  const scenarios: GroundTruthScenario[] = [
    {
      id: 'scen_routine_dining',
      title: 'Routine Dining: Blue Tokai Coffee (₹240)',
      badge: 'PASSIVE AUTO-LOG',
      description:
        'Aarav buys cold brew and snacks. Known merchant metadata clearly indicates dining. Amount (₹240) is within daily envelope and delegated authority (<= ₹500).',
      hiddenFacts: {
        realMerchantNature: 'Specialty coffee roastery cafe (Dining category).',
        trueIntent: 'Daily routine refreshment under October 2026 dining envelope.',
        expectedCategory: 'Dining',
        expectedAgentDecision:
          'Passively ingest and verify. Calculate pace deterministically. Commit to verified spend without interrupting Aarav.',
        operatorReasoning:
          'Agent should remain passive. Merchant metadata is unambiguous and spend is within bounds.',
      },
      sampleTransaction: {
        id: 'txn_blue_tokai_240',
        timestamp: '2026-10-10T09:15:00Z',
        amount: 240,
        currency: 'INR',
        direction: 'DEBIT',
        payee: 'Blue Tokai Coffee Roasters',
        paymentType: 'UPI',
        status: 'PENDING',
        source: 'UPI_WEBHOOK_FEED',
        rawMetadata: {
          mcc: '5814',
          merchantCategory: 'Fast Food / Coffee Shop',
          upiVpa: 'bluetokai@icici',
          terminal: 'POS_BLUETOKAI_04',
        },
        amountStatus: 'VERIFIED',
        purposeStatus: 'UNKNOWN',
        categoryStatus: 'UNKNOWN',
      },
    },
    {
      id: 'scen_p2p_dinner_split',
      title: 'Ambiguous P2P Dinner Split: Rohan Varma (₹850)',
      badge: 'GNANI VOICE CLARIFICATION',
      description:
        'Aarav transfers ₹850 via UPI to friend Rohan Varma. Merchant name is a person (P2P). Because ₹850 is a significant proportion of the ₹2,000 monthly dining limit and missing critical context, agent should ask minimal clarification. User provides voice note -> transcribed via Gnani.',
      hiddenFacts: {
        realMerchantNature: 'Personal contact (Rohan Varma) who settled group dinner bill at Burma Burma.',
        trueIntent: 'Aarav reimbursing his share of dinner (₹850). Belongs to Dining intention.',
        expectedCategory: 'Dining (Reimbursement)',
        expectedAgentDecision:
          'Do not blindly assume P2P is non-dining. Because amount materially affects pace, ask minimal clarification. Upon receiving voice transcript via Gnani, evaluate pace and flag drift warning.',
        operatorReasoning:
          'Context was missing and consequential. Calling Gnani on voice note resolves purpose with high confidence.',
      },
      sampleTransaction: {
        id: 'TX_RAHUL_001',
        timestamp: '2026-10-07T20:40:00Z',
        amount: 850,
        currency: 'INR',
        direction: 'DEBIT',
        payee: 'Rohan Varma',
        paymentType: 'UPI',
        status: 'SUCCESS',
        source: 'BANK_SMS_FEED',
        rawMetadata: {
          narration: 'UPI-P2P-ROHAN-VARMA-REF771829',
        },
        amountStatus: 'VERIFIED',
        purposeStatus: 'UNKNOWN',
        categoryStatus: 'UNKNOWN',
      },
      suggestedVoiceNote: {
        assetId: 'audio_aarav_burma_burma',
        audioFileName: 'aarav_burma_burma_split.wav',
        expectedTranscript:
          'hey that ₹850 was my share for our team dinner at burma burma last night',
        languageCode: 'en-IN',
      },
    },
    {
      id: 'scen_subsequent_rohan',
      title: 'Subsequent P2P: Rohan Varma (₹300)',
      badge: 'MEMORY-POWERED AUTO-LOG',
      description:
        'Aarav pays ₹300 to Rohan Varma for another shared dinner expense. Because Rohan Varma is established in verified contextual memory from Phase 3.3, MoneyMic leverages existing verified memory rather than unnecessarily re-interrogating Aarav or calling Gnani.',
      hiddenFacts: {
        realMerchantNature: 'Personal contact (Rohan Varma) who settled group dinner bill.',
        trueIntent: 'Aarav reimbursing his share of food/dining with Rohan.',
        expectedCategory: 'Dining',
        expectedAgentDecision:
          'Inspect verified contextual memory. Memory establishes Rohan as dining contact. Recompute pace deterministically without unnecessary interruption.',
        operatorReasoning:
          'Memory reduces future unnecessary interruptions. When context is sufficient, stay passive and do not interrogate.',
      },
      sampleTransaction: {
        id: 'TX_ROHAN_002',
        timestamp: '2026-10-12T21:15:00Z',
        amount: 300,
        currency: 'INR',
        direction: 'DEBIT',
        payee: 'Rohan Varma',
        paymentType: 'UPI',
        status: 'SUCCESS',
        source: 'BANK_SMS_FEED',
        rawMetadata: {
          narration: 'UPI-P2P-ROHAN-VARMA-DINNER-SHARE',
        },
        amountStatus: 'VERIFIED',
        purposeStatus: 'UNKNOWN',
        categoryStatus: 'UNKNOWN',
      },
    },
    {
      id: 'scen_low_impact_p2p',
      title: 'Low-Impact P2P: Sunil Kumar (₹45)',
      badge: 'PARK UNCERTAINTY',
      description:
        'Small ₹45 UPI transfer to Sunil Kumar. Purpose is unknown, but low amount has negligible impact on the ₹2,000 dining intention.',
      hiddenFacts: {
        realMerchantNature: 'Local tea stall or minor personal reimbursement.',
        trueIntent: 'Minor expenditure.',
        expectedCategory: 'Unknown / Minor P2P',
        expectedAgentDecision:
          'Stay silent. Park uncertainty as UNRESOLVED without interrupting Aarav. The threshold for asking questions is not met.',
        operatorReasoning:
          'Agent core rule: "If context is missing but low-impact, park uncertainty rather than interrupt unnecessarily."',
      },
      sampleTransaction: {
        id: 'txn_sunil_low_45',
        timestamp: '2026-10-10T16:00:00Z',
        amount: 45,
        currency: 'INR',
        direction: 'DEBIT',
        payee: 'Sunil Kumar',
        paymentType: 'UPI',
        status: 'PENDING',
        source: 'UPI_WEBHOOK_FEED',
        rawMetadata: {
          vpa: 'sunil.kumar92@oksbi',
          narration: 'UPI-SUNIL KUMAR',
        },
        amountStatus: 'VERIFIED',
        purposeStatus: 'UNKNOWN',
        categoryStatus: 'UNKNOWN',
      },
    },
    {
      id: 'scen_overpace_pos',
      title: 'Overpace Dining at POS: Mainland China (₹1,400)',
      badge: 'CRITICAL OVERPACE WARN',
      description:
        'Aarav attempts or receives a ₹1,400 dining bill at Mainland China. This single transaction exceeds delegated autonomous authority (> ₹500) and threatens to breach the ₹2,000 monthly limit.',
      hiddenFacts: {
        realMerchantNature: 'Upscale fine dining restaurant.',
        trueIntent: 'Fine dining dinner.',
        expectedCategory: 'Dining',
        expectedAgentDecision:
          'Pace evaluation triggers CRITICAL_OVERPACE (> ₹2,000 ceiling). Agent warns user and requires explicit confirmation, strictly refusing to autonomously approve outside bounded authority.',
        operatorReasoning:
          'L3 agent boundary enforced: Agent must not expand authority or approve payments beyond delegated limits without explicit user confirmation.',
      },
      sampleTransaction: {
        id: 'txn_mainland_china_1400',
        timestamp: '2026-10-10T21:00:00Z',
        amount: 1400,
        currency: 'INR',
        direction: 'DEBIT',
        payee: 'Mainland China Restaurant - POS',
        paymentType: 'POS',
        status: 'PENDING',
        source: 'PINE_LABS_POS_FEED',
        rawMetadata: {
          terminalId: 'PL_TID_9901',
          mcc: '5812',
          orderId: 'PL_ORD_MAINLAND_881',
          items: [{ item: 'Banquet Dinner & Beverages', qty: 1, unit_price: 1400 }],
        },
        amountStatus: 'VERIFIED',
        purposeStatus: 'UNKNOWN',
        categoryStatus: 'UNKNOWN',
      },
    },
  ];

  const audioAssets: OperatorAudioAsset[] = [
    {
      id: 'audio_aarav_burma_burma',
      fileName: 'aarav_burma_burma_split.wav',
      mimeType: 'audio/wav',
      durationSeconds: 6.9,
      uploadedAt: '2026-10-07T20:45:00Z',
      languageCode: 'en-IN',
      storedTranscript:
        'hey that ₹850 was my share for our team dinner at burma burma last night',
      url: '/api/audio/audio_aarav_burma_burma',
    },
    {
      id: 'audio_aarav_quick_lunch',
      fileName: 'aarav_lunch_confirmation.mp3',
      mimeType: 'audio/mp3',
      durationSeconds: 3.2,
      uploadedAt: '2026-10-10T15:10:00Z',
      languageCode: 'en-IN',
      storedTranscript: 'Yes, that was lunch with a colleague at the office food court.',
      url: '/api/audio/audio_aarav_quick_lunch',
    },
  ];

  return {
    delhiveryEnabled: false, // Disabled for core scenario
    pineLabsMode: 'NORMAL',
    scenarios,
    audioAssets,
    operatorLogs: [
      {
        timestamp: new Date().toISOString(),
        message: 'MoneyMic Operator Store ready. Ground truth strictly isolated from Gemini agent.',
        tag: 'OPERATOR_INIT',
      },
    ],
  };
}
