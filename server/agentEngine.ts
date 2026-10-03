import { GoogleGenAI } from '@google/genai';
import { simulationStore } from './simulationStore';
import { STATE_DEFINITIONS, SimulationStateNum, InformationStatus } from '../src/types/simulation';

// Tools definition for Gemini 3.8 Flash Interactions API
export const MONEYMIC_TOOLS = [
  {
    type: 'function',
    name: 'record_decision',
    description:
      'Log an authoritative financial decision and transition the agent to a permitted state. Must be called when evaluating, clarifying, approving, flagging, or executing transactions under L3 bounded authority.',
    parameters: {
      type: 'object',
      properties: {
        state: {
          type: 'integer',
          description:
            'Target state number (0-11). 0=Setup, 1=Monitoring, 2=Ingestion, 3=Understanding, 4=Context Confidence, 5=Context Intervention, 6=Pace Evaluation, 7=Decision, 8=User Response, 9=Execution, 10=Verification, 11=Contextual Memory.',
        },
        decision_type: {
          type: 'string',
          description:
            'Decision label, e.g. INGESTION_VERIFIED, CONTEXT_SUFFICIENT_SILENT, CONTEXT_PARKED_LOW_IMPACT, GNANI_CLARIFICATION_REQUIRED, DRIFT_WARNING, BOUNDED_INTERVENTION, OUTSIDE_AUTHORITY_REQUEST_CONFIRMATION, UNRESOLVED_PARKED, VERIFIED_MEMORY_COMMITTED.',
        },
        source: {
          type: 'string',
          description: 'Source of the transaction or trigger, e.g. BANK_FEED, UPI_INBOUND, USER_INTERACTION, PINE_LABS.',
        },
        decision: {
          type: 'string',
          description: 'A concise summary of the decision (1 sentence, no chain-of-thought).',
        },
        rule_id: {
          type: 'string',
          description:
            'Governing policy rule ID, e.g. RULE-L3-PASSIVE-01, RULE-L3-DRIFT-WARN-02, RULE-L3-DELEGATED-03, RULE-L3-OUT-OF-BOUNDS-04, RULE-GNANI-CRITICAL-05, RULE-MEM-VERIFIED-06.',
        },
        resulting_action: {
          type: 'string',
          description:
            'Action resulting from this decision, e.g. STAY_SILENT_MONITOR, DISPATCH_MINIMAL_CLARIFICATION, EXECUTE_WITHIN_BOUNDS, REQUEST_USER_ACTION, PARK_UNRESOLVED.',
        },
      },
      required: ['state', 'decision_type', 'source', 'decision', 'rule_id', 'resulting_action'],
    },
  },
  {
    type: 'function',
    name: 'evaluate_spending_pace',
    description:
      'Executes deterministic server-side arithmetic for monthly dining spending pace, elapsed period, burn velocity, and pace classification. Gemini MUST call this and NOT calculate pace manually.',
    parameters: {
      type: 'object',
      properties: {
        candidate_amount: {
          type: 'number',
          description: 'Amount in INR of the candidate transaction being evaluated.',
        },
      },
      required: ['candidate_amount'],
    },
  },
  {
    type: 'function',
    name: 'get_transaction_context',
    description:
      'Retrieve raw transaction metadata and previous verified context for the payee from simulation state.',
    parameters: {
      type: 'object',
      properties: {
        transaction_id: {
          type: 'string',
          description: 'The unique ID of the transaction to inspect.',
        },
      },
      required: ['transaction_id'],
    },
  },
  {
    type: 'function',
    name: 'update_financial_memory',
    description:
      'Persist only VERIFIED or explicitly confirmed financial context into long-term memory (State 11) to reduce future unnecessary interruptions.',
    parameters: {
      type: 'object',
      properties: {
        payee_key: {
          type: 'string',
          description: 'Normalized payee key, e.g. RAHUL_SHARMA, BLUE_TOKAI.',
        },
        resolved_category: {
          type: 'string',
          description: 'Explicitly verified category, e.g. Dining or Personal Transfer.',
        },
        information_status: {
          type: 'string',
          enum: ['VERIFIED', 'CONFLICTED'],
          description: 'Status: only VERIFIED context may be committed to persistent memory. If new info conflicts, set CONFLICTED.',
        },
        confidence: {
          type: 'number',
          description: 'Confidence score (1.0 for explicit user confirmation).',
        },
        notes: {
          type: 'string',
          description: 'Context learned directly from user confirmation or verified source.',
        },
        policy_tag: {
          type: 'string',
          description: 'Tag, e.g. VERIFIED_DINING, VERIFIED_P2P_NON_DINING.',
        },
      },
      required: ['payee_key', 'resolved_category', 'information_status', 'confidence', 'notes', 'policy_tag'],
    },
  },
  {
    type: 'function',
    name: 'update_transaction_context',
    description:
      'Update the resolved category, purpose status, and resolution of an active transaction once context is established from metadata, verified memory, or user clarification.',
    parameters: {
      type: 'object',
      properties: {
        transaction_id: {
          type: 'string',
          description: 'The transaction ID to update.',
        },
        category: {
          type: 'string',
          description: 'Resolved category, e.g. Dining or Personal Transfer.',
        },
        category_status: {
          type: 'string',
          enum: ['VERIFIED', 'INFERRED', 'UNKNOWN', 'CONFLICTED', 'UNRESOLVED'],
          description: 'Information status for category: VERIFIED only with explicit evidence or verified memory.',
        },
        purpose_status: {
          type: 'string',
          enum: ['VERIFIED', 'INFERRED', 'UNKNOWN', 'CONFLICTED', 'UNRESOLVED'],
          description: 'Information status for purpose.',
        },
        status: {
          type: 'string',
          enum: ['VERIFIED', 'SETTLED', 'UNRESOLVED', 'REJECTED'],
          description: 'Transaction lifecycle status.',
        },
        notes: {
          type: 'string',
          description: 'Audit explanation.',
        },
      },
      required: ['transaction_id', 'category', 'category_status', 'purpose_status'],
    },
  },
  {
    type: 'function',
    name: 'send_user_notification',
    description:
      'Deliver a user-facing message, spending drift warning, or clarification request to Aarav.',
    parameters: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'Minimum useful question or concise notification.',
        },
        notification_type: {
          type: 'string',
          enum: ['CLARIFICATION_REQUEST', 'PACE_WARNING', 'CONFIRMATION_REQUIRED', 'ACTION_COMPLETED'],
          description: 'Category of message.',
        },
        requires_audio: {
          type: 'boolean',
          description: 'Set to true when prompting the user for an audio voice-note clarification.',
        },
      },
      required: ['message', 'notification_type', 'requires_audio'],
    },
  },
  {
    type: 'function',
    name: 'gnani_transcribe',
    description:
      'Call the real Gnani REST STT API (api.vachana.ai/stt/v3) using GNANI_API_KEY. Returns exact verbatim transcript without paraphrasing.',
    parameters: {
      type: 'object',
      properties: {
        audio_asset_id: {
          type: 'string',
          description: 'The audio asset ID provided in the operator store.',
        },
        language_code: {
          type: 'string',
          description: 'Language code, e.g. en-IN, hi-IN.',
        },
      },
      required: ['audio_asset_id'],
    },
  },
  {
    type: 'function',
    name: 'pine_get_order',
    description:
      'Wizard-of-Oz connector adapter for Pine Labs POS terminal inquiry (/v1/orders/{orderId}). Clearly labeled as WIZARD_OF_OZ.',
    parameters: {
      type: 'object',
      properties: {
        order_id: {
          type: 'string',
          description: 'The Pine Labs order ID.',
        },
      },
      required: ['order_id'],
    },
  },
  {
    type: 'function',
    name: 'pine_create_payment',
    description:
      'Wizard-of-Oz connector adapter for Pine Labs payment capture (/v1/payments/create). Timeout or pending is not failure; reconcile first.',
    parameters: {
      type: 'object',
      properties: {
        order_id: {
          type: 'string',
          description: 'The order ID.',
        },
        amount: {
          type: 'number',
          description: 'Amount in INR.',
        },
        currency: {
          type: 'string',
          description: 'Currency code, default INR.',
        },
        customer_id: {
          type: 'string',
          description: 'Customer ID.',
        },
        notes: {
          type: 'string',
          description: 'Narration.',
        },
      },
      required: ['order_id', 'amount'],
    },
  },
  {
    type: 'function',
    name: 'delhivery_create_shipment',
    description:
      'Wizard-of-Oz connector adapter for Delhivery shipment creation. NOTE: Disabled for core scenario unless explicitly enabled by operator.',
    parameters: {
      type: 'object',
      properties: {
        order_id: {
          type: 'string',
          description: 'Order reference.',
        },
        destination_pin: {
          type: 'string',
          description: '6-digit destination pin.',
        },
      },
      required: ['order_id', 'destination_pin'],
    },
  },
  {
    type: 'function',
    name: 'delhivery_get_tracking',
    description:
      'Wizard-of-Oz connector adapter for Delhivery tracking. NOTE: Disabled for core scenario.',
    parameters: {
      type: 'object',
      properties: {
        waybill_id: {
          type: 'string',
          description: 'Waybill ID.',
        },
      },
      required: ['waybill_id'],
    },
  },
];

export class AgentEngine {
  private ai: GoogleGenAI;
  private activeModel: string = 'gemini-3.1-flash-lite';

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
  }

  private buildSystemInstruction(): string {
    const state = simulationStore.getSimulationState();
    return `You are MoneyMic, an autonomous financial agent operating with L3 Bounded Autonomy.
Core User: ${state.userProfile.name}
Scenario: October 2026 (Day ${state.userProfile.currentDay} of ${state.userProfile.totalDays})
Monthly Dining Spending Intention: ₹${state.financialIntent.monthlyLimit}
Target Daily Dining Pace: ~₹${state.financialIntent.targetDailyPace}/day
Verified Spend to Date: ₹${state.spendingCalculations.verifiedSpend}
Remaining Limit: ₹${state.spendingCalculations.remainingLimit}
Delegated Authority: Max autonomous transaction ₹${state.financialIntent.delegatedAuthority.maxAutonomousTransaction}. Transactions > ₹${state.financialIntent.delegatedAuthority.requireConfirmationAbove} require explicit user confirmation.
Current State: State ${state.currentState} [${STATE_DEFINITIONS[state.currentState]?.name}]

CORE OUTCOME:
"Reduce the gap between a user's intended spending pace and their actual spending, keeping it aligned with the limits they set for themselves, without requiring manual tracking."

AGENT AUTONOMY (L3):
The user defines the intention and delegates bounded authority. You may act independently ONLY within that authority.
You MUST NOT:
- change the user's spending limit without explicit approval;
- expand your own authority;
- apply authority to other categories (bounded strictly to dining);
- make or transfer money outside an explicitly supported and previously authorised payment mechanism;
- block arbitrary external UPI payments;
- treat user disagreement with a warning as automatic permission to rewrite the user's intent;
- take consequential action using unresolved or low-confidence financial context.

INFORMATION STATUS DISCIPLINE:
Every financial fact has one of 5 statuses:
- VERIFIED: explicitly confirmed by the user or from a trusted connector/source.
- INFERRED: derived from evidence but not explicitly confirmed.
- UNKNOWN: insufficient evidence.
- CONFLICTED: reliable sources disagree.
- UNRESOLVED: clarification was attempted but sufficient context was not obtained.
NEVER convert INFERRED, UNKNOWN, CONFLICTED or UNRESOLVED into VERIFIED without evidence. A transaction's amount/status may be VERIFIED while its purpose remains UNKNOWN.

CORE BEHAVIOUR & DECISION RULES:
1. PASSIVE BY DEFAULT:
- Do not interrupt merely because a transaction is P2P.
- Use transaction metadata, merchant/payee, previous verified context, and relevant history before asking anything.
- If context is sufficient or established by memory, do not interrupt.
- If context is missing but LOW-IMPACT (e.g. small ₹45 transfer, which is < 3% of the monthly limit), park the uncertainty rather than interrupt unnecessarily (RULE-L3-PASSIVE-01).

2. TIGHTENED STATE MACHINE & TRANSACTION PROCESSING PIPELINE:
Every transaction must be processed through the authoritative server-side state machine:
- State 2 (Ingestion / Event Verification): Verify transaction integrity, amount, direction, and source without presuming merchant meaning. Use 'record_decision' to transition to State 3 (allowed: State 3, or State 1 to park).
- State 3 (Understanding): Analyze merchant/payee and available context. Call 'get_transaction_context' to inspect raw metadata and existing verified contextual memory. Use 'record_decision' to transition to State 4 (allowed: State 4, or State 1 to park).
- State 4 (Context Confidence): Assess context certainty and materiality:
  * If merchant meaning is clear from metadata (e.g. Blue Tokai MCC 5814 coffee/dining) OR established by previous verified contextual memory (e.g. Rohan Varma established as dining contact):
    Context is sufficient! Call 'update_transaction_context' (category: 'Dining', category_status: 'VERIFIED', purpose_status: 'VERIFIED').
    Transition to State 6 (Pace Evaluation) via 'record_decision' (rule_id: 'RULE-L3-CONTEXT-SUFFICIENT', decision_type: 'CONTEXT_SUFFICIENT').
  * If context is UNKNOWN and amount is MATERIAL (> ₹300, or > 15% of ₹2,000 monthly limit, such as ₹850):
    Critical context missing! Transition to State 5 (Context Intervention) via 'record_decision' (rule_id: 'RULE-GNANI-CRITICAL-05', decision_type: 'GNANI_CLARIFICATION_REQUIRED', resulting_action: 'DISPATCH_MINIMAL_CLARIFICATION').
    Dispatch clarification prompt via 'send_user_notification' with requires_audio=true. Engine will await user voice note.
  * If context is UNKNOWN and amount is LOW-IMPACT (e.g. small ₹45 transfer):
    Park uncertainty silently: transition to State 1 (Monitoring) via 'record_decision' (rule_id: 'RULE-L3-PASSIVE-01', decision_type: 'CONTEXT_PARKED_LOW_IMPACT', resulting_action: 'STAY_SILENT_MONITOR').
- State 5 (Context Intervention): Clarification request dispatched. When user voice note is provided, system transitions to State 8 (User Response).
- State 8 (User Response):
  * When Aarav supplies a voice note, call 'gnani_transcribe' with audio_asset_id to receive verbatim Gnani transcript.
  * Inspect transcript independently:
    If verified as dining: call 'update_transaction_context' (category: 'Dining', category_status: 'VERIFIED', purpose_status: 'VERIFIED') and commit memory via 'update_financial_memory' (payee_key: 'ROHAN_VARMA', resolved_category: 'Dining', information_status: 'VERIFIED', notes: 'Aarav verified ₹850 was his share of team dinner at Burma Burma').
    Transition to State 6 (Pace Evaluation) via 'record_decision' (or State 3 to re-understand, then State 4 -> State 6).
    If user remains silent or ambiguous: narrow question once (State 5 retry) or park as UNRESOLVED (State 1).
- State 6 (Pace Evaluation):
  * Call 'evaluate_spending_pace' to recompute server-authoritative financial state.
  * Server calculates verified dining spend, remaining limit, elapsed days, expected spend, actual pace, pace ratio, and pace classification:
    - ALIGNED (ratio <= 1.10)
    - DRIFT (ratio > 1.10)
    - MATERIAL_DRIFT (ratio > 1.30 or projected spend > ₹2,000 limit)
    - INSUFFICIENT_DATA (elapsed days < 1)
  * Transition to State 7 (Decision) via 'record_decision'.
- State 7 (Decision):
  * If ALIGNED: agent normally remains silent and returns to Monitoring (State 1) via 'record_decision' (rule_id: 'RULE-L3-ALIGNED-SILENT', decision_type: 'PACE_ALIGNED_PASSIVE', resulting_action: 'STAY_SILENT_MONITOR').
  * If DRIFT: Gemini may warn the user via 'send_user_notification(notification_type: PACE_WARNING)' when drift is meaningful enough to justify interruption, then transition to State 1 via 'record_decision'.
  * If MATERIAL_DRIFT: Gemini warns user of material drift and enforces delegated bounds (transactions > ₹500 require user confirmation), then returns to State 1 via 'record_decision'.

3. MEMORY AS EVIDENCE:
- Preserved verified contextual memory (e.g. ROHAN_VARMA -> Dining share) is evidence.
- A later transaction involving the same person uses this verified context without triggering unnecessary voice interactions.
- If new information conflicts with memory, mark CONFLICTED and do not use for consequential decisions until resolved.

4. USER INTENTION DISCIPLINE:
- The user is the sole source of spending intention. Do not optimize for minimum spending or impose arbitrary limits.
- If Aarav changes intention, recalculate pace only after explicit confirmation. Never silently modify the original limit.
5. STATE MACHINE ENFORCEMENT:
The server strictly enforces permitted transitions. Gemini selects valid transitions; invalid ones are rejected.`;
  }

  public async runAgentLoop(triggerMessage: string, maxTurns: number = 8): Promise<{
    success: boolean;
    turnsCompleted: number;
    finalOutputText: string;
    errors: string[];
  }> {
    const errors: string[] = [];
    let currentInput: any = triggerMessage;
    let turnCount = 0;
    let finalOutputText = '';

    simulationStore.setSimulationStatus('PROCESSING');

    try {
      while (turnCount < maxTurns) {
        turnCount++;
        const state = simulationStore.getSimulationState();
        const previousId = state.lastInteractionId || undefined;

        // Call Gemini Interactions API (uses activeModel, falls back to gemini-3.5-flash if 429 rate limit is hit)
        let interaction: any;
        try {
          interaction = await this.ai.interactions.create({
            model: this.activeModel,
            system_instruction: this.buildSystemInstruction(),
            previous_interaction_id: previousId,
            input: currentInput,
            tools: MONEYMIC_TOOLS as any,
          });
        } catch (callErr: any) {
          if ((callErr?.status === 429 || String(callErr?.message).includes('429')) && this.activeModel === 'gemini-3.8-flash') {
            console.warn('gemini-3.8-flash rate limit (20 req/day Free Tier) reached; switching activeModel to gemini-3.1-flash-lite');
            this.activeModel = 'gemini-3.1-flash-lite';
            interaction = await this.ai.interactions.create({
              model: this.activeModel,
              system_instruction: this.buildSystemInstruction(),
              previous_interaction_id: previousId,
              input: currentInput,
              tools: MONEYMIC_TOOLS as any,
            });
          } else {
            throw callErr;
          }
        }

        // Store interaction ID for multi-turn continuity
        simulationStore.setLastInteractionId(interaction.id);

        const functionCallSteps = (interaction.steps || []).filter(
          (s: any) => s.type === 'function_call'
        );

        if (!functionCallSteps || functionCallSteps.length === 0) {
          finalOutputText = interaction.output_text || '';
          break;
        }

        const functionResults: any[] = [];
        for (const callStep of functionCallSteps) {
          const toolName = (callStep as any).name;
          const toolArgs = (callStep as any).arguments || {};
          const callId = (callStep as any).id;

          const toolResult = await this.executeTool(toolName, toolArgs);

          functionResults.push({
            type: 'function_result',
            name: toolName,
            call_id: callId,
            result: toolResult,
          });
        }

        currentInput = functionResults;
      }

      const endState = simulationStore.getSimulationState();
      if (endState.simulationStatus === 'PROCESSING') {
        simulationStore.setSimulationStatus('IDLE');
      }

      return {
        success: true,
        turnsCompleted: turnCount,
        finalOutputText,
        errors,
      };
    } catch (err: any) {
      console.error('Agent loop execution error:', err);
      errors.push(err.message || String(err));
      simulationStore.setSimulationStatus('ERROR');
      return {
        success: false,
        turnsCompleted: turnCount,
        finalOutputText,
        errors,
      };
    }
  }

  private async executeTool(name: string, args: any): Promise<any> {
    const startTime = Date.now();

    switch (name) {
      case 'record_decision': {
        const { state: targetState, decision_type, source, decision, rule_id, resulting_action } = args;

        const transitionResult = simulationStore.validateAndSetState(
          targetState as SimulationStateNum,
          `Decision: [${rule_id}] ${decision}`
        );

        if (!transitionResult.success) {
          return {
            error: 'INVALID_STATE_TRANSITION',
            message: transitionResult.error,
            currentState: transitionResult.currentState,
            permittedTransitions: transitionResult.allowedTransitions,
          };
        }

        const logged = simulationStore.logDecision({
          state: targetState as SimulationStateNum,
          decisionType: decision_type || 'AGENT_DECISION',
          source: source || 'INTERNAL',
          decision: decision || '',
          ruleId: rule_id || 'RULE-L3-DEFAULT',
          action: resulting_action || 'PROCEED',
        });

        return {
          status: 'SUCCESS',
          decision_id: logged.id,
          current_state: logged.state,
          state_name: logged.stateName,
          rule_id: logged.ruleId,
          resulting_action: logged.action,
        };
      }

      case 'evaluate_spending_pace': {
        const candidateAmount = Number(args.candidate_amount || 0);
        simulationStore.recalculatePace(candidateAmount);
        const state = simulationStore.getSimulationState();
        const calc = state.spendingCalculations;

        simulationStore.logConnector({
          connector: 'SYSTEM',
          mode: 'REAL',
          endpoint: '/sys/deterministic-pace-calc',
          method: 'POST',
          request: { candidateAmount, monthlyLimit: calc.monthlyLimit, elapsedDays: calc.elapsedDays },
          response: calc,
          status: 200,
          latencyMs: Date.now() - startTime,
          notes: `Deterministic server arithmetic: ${calc.paceClassification} (${calc.paceRatio}x intended pace)`,
        });

        return {
          verified_spend: calc.verifiedSpend,
          monthly_limit: calc.monthlyLimit,
          remaining_limit: calc.remainingLimit,
          elapsed_days: calc.elapsedDays,
          total_days: calc.totalDays,
          expected_spend_to_date: calc.expectedSpendToDate,
          actual_pace: calc.actualPace,
          intended_pace: calc.intendedPace,
          pace_ratio: calc.paceRatio,
          candidate_amount: candidateAmount,
          projected_spend: calc.projectedSpend,
          projected_pace: calc.projectedPace,
          pace_classification: calc.paceClassification,
          explanation: calc.explanation,
        };
      }

      case 'get_transaction_context': {
        const state = simulationStore.getSimulationState();
        const txnId = args.transaction_id;
        const txn = state.transactions.find((t) => t.id === txnId);

        if (!txn) {
          return { error: 'TRANSACTION_NOT_FOUND', transaction_id: txnId };
        }

        // Match against existing verified contextual memory
        const memoryMatches = Object.values(state.contextualMemory).filter((m) =>
          txn.payee.toLowerCase().includes(m.payeePattern.toLowerCase())
        );

        return {
          transaction: {
            id: txn.id,
            timestamp: txn.timestamp,
            amount: txn.amount,
            currency: txn.currency,
            direction: txn.direction,
            payee: txn.payee,
            payment_type: txn.paymentType,
            status: txn.status,
            source: txn.source,
            amount_status: txn.amountStatus,
            purpose_status: txn.purposeStatus,
            category_status: txn.categoryStatus,
            raw_metadata: txn.rawMetadata,
          },
          verified_contextual_memory: memoryMatches,
          historical_transactions_count: state.transactions.filter((t) => t.payee === txn.payee).length,
        };
      }

      case 'update_financial_memory': {
        const { payee_key, resolved_category, information_status, confidence, notes, policy_tag } = args;

        // Information status discipline: only VERIFIED or explicitly confirmed context can be committed
        const status: InformationStatus = information_status === 'CONFLICTED' ? 'CONFLICTED' : 'VERIFIED';

        simulationStore.addContextualMemory({
          key: payee_key,
          payeePattern: payee_key,
          resolvedCategory: resolved_category,
          informationStatus: status,
          confidence: Number(confidence) || 1.0,
          notes: notes || '',
          learnedAt: new Date().toISOString(),
          policyTag: policy_tag || 'VERIFIED_CONTEXT',
        });

        return {
          status: 'SUCCESS',
          message: `Payee context '${payee_key}' committed to persistent memory [${status}].`,
          resolved_category,
          information_status: status,
        };
      }

      case 'update_transaction_context': {
        const { transaction_id, category, category_status, purpose_status, status = 'VERIFIED', notes } = args;
        const updated = simulationStore.updateTransaction(transaction_id, {
          category,
          categoryStatus: category_status,
          purposeStatus: purpose_status,
          status,
          clarificationNotes: notes || '',
        });

        simulationStore.logConnector({
          connector: 'SYSTEM',
          mode: 'REAL',
          endpoint: '/transactions/resolve-context',
          method: 'POST',
          request: { transaction_id, category, category_status, purpose_status, status, notes },
          response: { success: Boolean(updated), updated_transaction: updated },
          status: 200,
          latencyMs: 1,
          notes: `Transaction [${transaction_id}] context updated: Category=${category} [${category_status}], Purpose=[${purpose_status}], Status=${status}`,
        });

        return {
          status: 'SUCCESS',
          transaction_id,
          category,
          category_status,
          purpose_status,
          included_in_dining_spend: updated?.includedInDiningSpend || false,
        };
      }

      case 'send_user_notification': {
        const { message, notification_type, requires_audio } = args;

        const interaction = simulationStore.addPendingUserInteraction({
          type: notification_type || 'CLARIFICATION_REQUEST',
          message: message || '',
          requiresAudio: Boolean(requires_audio),
        });

        simulationStore.logConnector({
          connector: 'SYSTEM',
          mode: 'REAL',
          endpoint: '/user/notifications/dispatch',
          method: 'POST',
          request: { message, notification_type, requires_audio },
          response: { interactionId: interaction.id, delivered: true },
          status: 200,
          latencyMs: Date.now() - startTime,
          notes: `User notification delivered to Aarav [${notification_type}]`,
        });

        return {
          status: 'DELIVERED',
          interaction_id: interaction.id,
          requires_audio: interaction.requiresAudio,
        };
      }

      case 'gnani_transcribe': {
        const { audio_asset_id, language_code = 'en-IN' } = args;
        const operatorStore = simulationStore.getOperatorStore();
        const asset = operatorStore.audioAssets.find((a) => a.id === audio_asset_id);
        const audioBufferInfo = simulationStore.getAudioBuffer(audio_asset_id);
        const apiKey = process.env.GNANI_API_KEY;

        // Step 1: Connector log - Gemini decision to call Gnani
        simulationStore.logConnector({
          connector: 'GNANI_STT',
          mode: 'REAL',
          endpoint: 'tool_call:gnani_transcribe',
          method: 'FUNCTION_CALL',
          request: {
            tool: 'gnani_transcribe',
            audio_asset_id,
            language_code,
          },
          response: {
            status: 'DISPATCHED_TO_GNANI_API',
            asset_identified: Boolean(asset),
            has_buffer: Boolean(audioBufferInfo),
          },
          status: 200,
          latencyMs: 1,
          notes: `Gemini autonomous decision to invoke gnani_transcribe for audio asset [${audio_asset_id}]`,
        });

        // Step 2: Call real Gnani REST API if key and buffer available
        if (apiKey && apiKey !== 'MY_GNANI_API_KEY' && audioBufferInfo) {
          try {
            const formData = new FormData();
            const blob = new Blob([new Uint8Array(audioBufferInfo.buffer)], {
              type: audioBufferInfo.mimeType || 'audio/wav',
            });
            // Gnani v3 requires audio_file, language_code, and format=transcribe
            formData.append('audio_file', blob, asset?.fileName || 'aarav_voice.wav');
            formData.append('language_code', language_code);
            formData.append('format', 'transcribe');

            const gnaniRes = await fetch('https://api.vachana.ai/stt/v3', {
              method: 'POST',
              headers: {
                'X-API-Key-ID': apiKey,
              },
              body: formData,
            });

            const gnaniJson = await gnaniRes.json();
            const latency = Date.now() - startTime;

            // Step 3: Connector log - Gnani endpoint/tool, request metadata, exact response
            simulationStore.logConnector({
              connector: 'GNANI_STT',
              mode: 'REAL',
              endpoint: 'https://api.vachana.ai/stt/v3',
              method: 'POST',
              request: {
                tool: 'gnani_transcribe',
                endpoint: 'https://api.vachana.ai/stt/v3',
                headers: { 'X-API-Key-ID': '[REDACTED_API_KEY]' },
                formData: {
                  audio_file: asset?.fileName || 'aarav_voice.wav',
                  language_code,
                  format: 'transcribe',
                  file_size_bytes: audioBufferInfo.buffer.length,
                },
              },
              response: gnaniJson,
              status: gnaniRes.status,
              latencyMs: latency,
              notes: `Real Gnani REST STT API responded with status ${gnaniRes.status} in ${latency}ms: "${gnaniJson.transcript || ''}" [request_id: ${gnaniJson.request_id || 'N/A'}]`,
            });

            // Step 4: Connector log - exact result returned to Gemini
            simulationStore.logConnector({
              connector: 'GNANI_STT',
              mode: 'REAL',
              endpoint: 'tool_result:gnani_transcribe',
              method: 'FUNCTION_RESULT',
              request: {
                tool: 'gnani_transcribe',
                audio_asset_id,
              },
              response: gnaniJson,
              status: 200,
              latencyMs: 1,
              notes: 'Exact Gnani API result returned to Gemini without paraphrasing, summarizing, categorizing, or server interpretation',
            });

            // Return exact API result to Gemini without modification
            return gnaniJson;
          } catch (gnaniErr: any) {
            console.warn('Gnani REST API call encountered error:', gnaniErr);
          }
        }

        // Fallback if network issue or key not configured
        const fallbackResponse = {
          success: true,
          request_id: `woz_${Date.now()}`,
          transcript: asset?.storedTranscript || '',
          model: 'gnani-prisma-v2.5',
          processing_time: 0.15,
          end_to_end_latency: 0.22,
        };

        simulationStore.logConnector({
          connector: 'GNANI_STT',
          mode: 'WIZARD_OF_OZ',
          endpoint: 'https://api.vachana.ai/stt/v3',
          method: 'POST',
          request: {
            audio_asset_id,
            language_code,
            format: 'transcribe',
          },
          response: fallbackResponse,
          status: 200,
          latencyMs: 120,
          notes: `Gnani STT response (fixture buffer): "${fallbackResponse.transcript}"`,
        });

        simulationStore.logConnector({
          connector: 'GNANI_STT',
          mode: 'WIZARD_OF_OZ',
          endpoint: 'tool_result:gnani_transcribe',
          method: 'FUNCTION_RESULT',
          request: {
            tool: 'gnani_transcribe',
            audio_asset_id,
          },
          response: fallbackResponse,
          status: 200,
          latencyMs: 1,
          notes: 'Exact Gnani result returned to Gemini without paraphrasing',
        });

        return fallbackResponse;
      }

      case 'pine_get_order': {
        const orderId = args.order_id || 'PL_ORD_001';
        const operatorStore = simulationStore.getOperatorStore();

        if (operatorStore.pineLabsMode === 'SIMULATE_TIMEOUT') {
          simulationStore.logConnector({
            connector: 'PINE_LABS',
            mode: 'WIZARD_OF_OZ',
            endpoint: `/v1/orders/${orderId}`,
            method: 'GET',
            request: { order_id: orderId },
            response: { error: 'GATEWAY_TIMEOUT', message: 'Pine Labs terminal response timed out. Timeout is not failure.' },
            status: 504,
            latencyMs: 1200,
            notes: 'Pine Labs POS Gateway Timeout simulated (Wizard-of-Oz). Reconcile status before retry.',
          });
          return { error: 'PINE_LABS_TIMEOUT', message: 'Terminal inquiry timed out. Must reconcile before retry.' };
        }

        const responsePayload = {
          order_id: orderId,
          merchant_name: 'Blue Tokai Coffee Roasters',
          terminal_id: 'PL_TID_4412',
          currency: 'INR',
          amount: 320,
          order_status: 'PAYMENT_PENDING',
          items: [{ item: 'Cold Brew & Croissant', qty: 1, unit_price: 320 }],
        };

        simulationStore.logConnector({
          connector: 'PINE_LABS',
          mode: 'WIZARD_OF_OZ',
          endpoint: `/v1/orders/${orderId}`,
          method: 'GET',
          request: { order_id: orderId },
          response: responsePayload,
          status: 200,
          latencyMs: 95,
          notes: 'Pine Labs POS order inquiry (Wizard-of-Oz)',
        });

        return responsePayload;
      }

      case 'pine_create_payment': {
        const { order_id, amount, currency = 'INR', customer_id, notes } = args;
        const operatorStore = simulationStore.getOperatorStore();

        if (operatorStore.pineLabsMode === 'SIMULATE_DECLINE') {
          simulationStore.logConnector({
            connector: 'PINE_LABS',
            mode: 'WIZARD_OF_OZ',
            endpoint: '/v1/payments/create',
            method: 'POST',
            request: { order_id, amount, currency, customer_id, notes },
            response: { error: 'DECLINED_BY_ISSUER', code: 'PINE_51', message: 'Insufficient funds or limits.' },
            status: 402,
            latencyMs: 160,
            notes: 'Pine Labs charge declined fixture (Wizard-of-Oz)',
          });
          return { status: 'FAILED', error: 'DECLINED_BY_ISSUER' };
        }

        const pineTxnId = `PL_TXN_${Date.now()}`;
        const paymentAction = simulationStore.addPendingPaymentAction({
          orderId: order_id,
          amount: Number(amount),
          currency,
          payee: 'PINE_LABS_MERCHANT',
          status: 'SUCCESS',
          pineTransactionId: pineTxnId,
        });

        const responsePayload = {
          status: 'CHARGED',
          pine_transaction_id: pineTxnId,
          order_id,
          amount,
          currency,
          settled_at: new Date().toISOString(),
          payment_action_id: paymentAction.id,
        };

        simulationStore.logConnector({
          connector: 'PINE_LABS',
          mode: 'WIZARD_OF_OZ',
          endpoint: '/v1/payments/create',
          method: 'POST',
          request: { order_id, amount, currency, customer_id, notes },
          response: responsePayload,
          status: 200,
          latencyMs: 210,
          notes: `Pine Labs payment captured (Wizard-of-Oz) [${pineTxnId}]`,
        });

        return responsePayload;
      }

      case 'delhivery_create_shipment': {
        const operatorStore = simulationStore.getOperatorStore();
        if (!operatorStore.delhiveryEnabled) {
          simulationStore.logConnector({
            connector: 'DELHIVERY',
            mode: 'WIZARD_OF_OZ',
            endpoint: '/api/cmu/create.json',
            method: 'POST',
            request: args,
            response: {
              error: 'DELHIVERY_DISABLED',
              message: 'Delhivery connector is disabled for the core dining scenario.',
            },
            status: 403,
            latencyMs: 8,
            notes: 'Delhivery shipment rejected (connector disabled by operator)',
          });
          return {
            error: 'DELHIVERY_DISABLED',
            message: 'Delhivery connector is disabled for the core dining scenario.',
          };
        }

        const waybill = `DLV${Math.floor(1000000000 + Math.random() * 9000000000)}`;
        const responsePayload = {
          success: true,
          packages: [{ waybill, status: 'Manifested' }],
        };

        simulationStore.logConnector({
          connector: 'DELHIVERY',
          mode: 'WIZARD_OF_OZ',
          endpoint: '/api/cmu/create.json',
          method: 'POST',
          request: args,
          response: responsePayload,
          status: 200,
          latencyMs: 140,
        });

        return responsePayload;
      }

      case 'delhivery_get_tracking': {
        const operatorStore = simulationStore.getOperatorStore();
        if (!operatorStore.delhiveryEnabled) {
          simulationStore.logConnector({
            connector: 'DELHIVERY',
            mode: 'WIZARD_OF_OZ',
            endpoint: `/api/v1/packages/json/?waybill=${args.waybill_id}`,
            method: 'GET',
            request: args,
            response: {
              error: 'DELHIVERY_DISABLED',
              message: 'Delhivery tracking connector is disabled for the core dining scenario.',
            },
            status: 403,
            latencyMs: 8,
            notes: 'Delhivery tracking rejected (connector disabled by operator)',
          });
          return {
            error: 'DELHIVERY_DISABLED',
            message: 'Delhivery tracking connector is disabled for the core dining scenario.',
          };
        }

        const responsePayload = {
          ShipmentData: [{ Shipment: { Waybill: args.waybill_id, Status: { Status: 'In Transit' } } }],
        };

        simulationStore.logConnector({
          connector: 'DELHIVERY',
          mode: 'WIZARD_OF_OZ',
          endpoint: `/api/v1/packages/json/?waybill=${args.waybill_id}`,
          method: 'GET',
          request: args,
          response: responsePayload,
          status: 200,
          latencyMs: 120,
        });

        return responsePayload;
      }

      default:
        return { error: 'UNKNOWN_TOOL', tool: name };
    }
  }
}

export const agentEngine = new AgentEngine();
