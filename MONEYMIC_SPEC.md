# MoneyMic Specification

## 1. Product

Product name: MoneyMic

MoneyMic is an autonomous financial agent focused on helping a person keep actual spending aligned with the spending pace and limits they set for themselves.

### Core problem

People often know what they intend to spend, but actual spending drifts away from that intention because payments are easy, spending context is fragmented, P2P transactions are hard to recognise later, and manual tracking is difficult to maintain.

### Core outcome

Reduce the gap between a user's intended spending pace and their actual spending, keeping it aligned with the limits they set for themselves, without requiring manual tracking.

MoneyMic is not a manual expense tracker.

The user should not have to repeatedly open an app, categorise transactions, maintain a spreadsheet, or manually reconcile every payment.

The agent should do the work continuously and come to the user only when there is a meaningful reason.

---

## 2. Core product thesis

MoneyMic is built around a behavioural insight:

People do not only struggle to record where their money went. Some people independently create mechanisms to control their spending behaviour.

Examples observed during research included:

- using a rolling spending cap instead of detailed categorisation;
- giving control of money to another person for accountability;
- converting digital money to physical cash to add friction to spending.

Therefore MoneyMic's job is not only to answer "where did my money go?"

It should also detect when actual behaviour is drifting away from the user's own intention and act at the right moment.

The agent therefore has three connected responsibilities:

1. understand financial events without requiring manual tracking;
2. compare actual spending behaviour with intended spending pace;
3. intervene selectively when intervention can materially help.

The agent must never replace the user's own financial intention with its own idea of what the user should spend.

---

## 3. Core user and scenario

Core simulation user: Aarav

Simulation period: October 2026

Primary tracked category: Dining

Monthly spending intention: ₹2,000

The user's spending intention is authoritative.

The agent may analyse, warn, recommend and act within delegated authority, but may not silently change the user's intention.

A user's explicit confirmation is required before changing the authoritative intention.

---

## 4. Agent autonomy

MoneyMic operates at L3 bounded autonomy.

The user delegates specific authority and the agent acts independently inside those boundaries.

### Independent authority

The agent may independently:

- monitor transactions;
- verify transaction facts from available sources;
- categorise high-confidence transactions;
- maintain cumulative spending and spending pace;
- use verified contextual memory;
- store confirmed transaction context;
- send authorised notifications;
- apply previously authorised notification and intervention policies within their stated scope.

### Conditional authority

The agent may:

- ask about ambiguous transactions;
- trigger a consequential-payment warning;
- recommend corrective actions;
- apply a predefined user-authorised policy where the relevant payment rail supports it.

### Explicit approval required

The agent must obtain explicit user approval before:

- changing the monthly spending limit;
- changing the user's authoritative spending intention;
- expanding the scope of its permissions;
- applying its authority to another category;
- making or transferring money outside a specifically authorised supported mechanism;
- blocking or cancelling payments unless the user has explicitly authorised a supported payment-control mechanism;
- performing an action that exceeds its delegated boundary.

The agent must never expand its own authority.

The user's decision to knowingly exceed a budget does not automatically mean that the original budget has changed.

---

## 5. Default interaction principle

MoneyMic is passive by default.

It does not interrupt the user simply because a transaction is ambiguous, P2P, large, unusual, or interesting.

The agent intervenes only when there is a meaningful reason, such as:

- missing critical transaction context;
- material spending drift;
- a user-authorised policy trigger;
- a consequential action that requires a user decision.

The threshold for interrupting the user must be higher than the threshold for recording a transaction.

The threshold for taking a consequential action must be higher than the threshold for merely warning the user.

---

## 6. Information hierarchy

Every important financial fact must have one of five information statuses.

### VERIFIED

Explicitly confirmed by the user or obtained from a trusted source or connector.

### INFERRED

Derived from available evidence but not explicitly confirmed.

### UNKNOWN

There is insufficient evidence to establish the fact.

### CONFLICTED

Reliable information disagrees.

### UNRESOLVED

Clarification was attempted but sufficient information was not obtained.

### Rules

Never convert INFERRED, UNKNOWN, CONFLICTED or UNRESOLVED information into VERIFIED information without evidence.

A transaction's amount and payment status may be VERIFIED while its purpose remains UNKNOWN.

A known merchant or payee does not automatically establish the user's purpose.

A previous memory entry is evidence, not unconditional truth.

---

## 7. State machine

Use exactly these states.

### S0 Setup

User defines spending intention, relevant permissions, intervention preferences and delegated boundaries.

### S1 Monitoring

MoneyMic passively monitors incoming financial events.

### S2 Ingestion / Event Verification

A new event enters the system.

The agent verifies event integrity, transaction identity, amount, direction, payment type and available status information.

### S3 Understanding

The agent interprets the transaction using:

- raw transaction information;
- merchant/payee information;
- transaction metadata;
- verified contextual memory;
- relevant prior context.

### S4 Context Confidence

The agent determines whether it has enough context to safely classify and act.

The agent distinguishes between:

- sufficient context;
- missing but low-impact context;
- missing critical context;
- conflicting context.

### S5 Context Intervention

MoneyMic asks the user for the minimum clarification required when missing context is materially useful.

Gnani is used here when voice clarification is appropriate.

At most one useful clarification retry is permitted.

### S6 Pace Evaluation

The server performs deterministic spending calculations.

Gemini must not perform the financial arithmetic itself.

### S7 Decision

Gemini decides among the actions permitted by the current state, user authority and financial context.

Possible outcomes include:

- stay silent;
- warn;
- intervene within delegated authority;
- request user approval;
- execute an authorised action;
- park unresolved uncertainty.

### S8 User Response

The agent receives the user's answer, clarification, approval, override or explicit intention change.

### S9 Execution

A consequential authorised action is executed through the appropriate supported connector.

### S10 Verification

The agent verifies the result of the external action.

A client-side acknowledgement is not sufficient to mark a consequential action successful.

### S11 Contextual Memory

Verified and useful contextual information is stored for future use.

Once this work is complete, the agent returns to S1 Monitoring.

---

## 8. State transition principles

The application must validate state transitions server-side.

Gemini may choose among permitted transitions, but Gemini may not bypass the server validator.

The intended normal path is:

S0 → S1 → S2 → S3 → S4

From S4:

S4 → S5 when critical context is missing and clarification is materially useful.

S4 → S6 when sufficient context exists or uncertainty does not materially affect the financial decision.

From S5:

S5 → S8 when the user supplies a response.

One useful clarification retry may occur.

If clarification remains insufficient, the transaction becomes UNRESOLVED and the agent must stop repeatedly interrogating the user.

From S8:

S8 may return to S3 or S6 depending on what information was received.

S6 → S7

From S7:

S7 → S1 when no intervention or memory work is required.

S7 → S8 when user input is required.

S7 → S9 when a consequential action is authorised and must be executed.

S7 → S11 when verified contextual memory must be committed and no execution is required.

Execution path:

S7 → S9 → S10 → S11 → S1

Memory-only completion path:

S7 → S11 → S1

S11 returns to S1 Monitoring.

The agent must never jump arbitrarily between states.

---

## 9. Transaction processing

For every incoming financial event, MoneyMic should:

1. verify the event;
2. establish what is known;
3. retrieve relevant verified context;
4. understand the transaction;
5. evaluate context confidence;
6. decide whether clarification is materially useful;
7. clarify selectively where necessary;
8. resolve or park the transaction;
9. recalculate spending state;
10. decide whether to stay silent, warn, intervene or execute;
11. verify any consequential action;
12. update verified contextual memory where appropriate;
13. return to monitoring.

The operator must deliver raw external facts only.

The operator must never provide the meaning of the transaction.

---

## 10. P2P policy

P2P transactions are a key problem for MoneyMic.

The payee may be recognisable while the purpose of the payment remains unknown.

MoneyMic must not ask about every P2P transaction.

For a P2P transaction:

1. inspect raw metadata;
2. inspect relevant verified contextual memory;
3. consider amount and materiality;
4. determine whether the missing purpose could materially change the financial interpretation;
5. remain silent if sufficient context exists;
6. park low-impact uncertainty when clarification is not worth interrupting the user;
7. ask through Gnani when critical missing context is materially useful.

Ask only the minimum useful question.

The agent should ask for the purpose or context necessary to make the financial decision, rather than collecting unnecessary detail.

Example:

"₹850 went to Rohan. What was this for?"

The question should not ask the user to fill out a category manually.

---

## 11. Voice and Gnani

Gnani is primarily used to make selective clarification low-friction.

The important product capability is not simply speech recognition.

The agent must decide:

- whether a voice interruption is warranted;
- when it should happen;
- how much information it needs;
- whether the response resolves the financial uncertainty;
- whether another clarification is justified.

Gnani should not be called for every ambiguous transaction.

The voice interaction should be brief and targeted.

The application must use the actual Gnani STT API where required.

Endpoint:

POST https://api.vachana.ai/stt/v3

The server must use:

- multipart/form-data;
- audio file;
- language code;
- format=transcribe;
- server-side GNANI_API_KEY.

The actual Gnani response must be returned to Gemini without server-side semantic paraphrasing or category injection.

A successful transcript does not automatically mean the transaction is financially resolved.

Gemini must independently determine whether the returned information provides sufficient context.

---

## 12. Language and noisy-input behaviour

The agent must tolerate realistic voice conditions such as:

- switching between English and Hindi;
- switching between English and another supported Indian language;
- pauses and silence;
- interruptions;
- background noise;
- speech restarting midway;
- incomplete sentences;
- vague answers.

The purpose of these tests is not to prove perfect transcription.

The important question is whether MoneyMic correctly handles the uncertainty created by imperfect or ambiguous input.

If the transcript is understandable enough to resolve the financial question, continue.

If the transcript is unclear, contradictory or incomplete, do not pretend it is resolved.

Use one narrower clarification where justified.

If sufficient context still cannot be established, mark the transaction UNRESOLVED and continue monitoring.

---

## 13. Contextual memory

Memory exists to reduce unnecessary future interruptions.

Only verified or explicitly confirmed financial context may become VERIFIED persistent memory.

Example:

The user confirms:

"₹850 was my share of the team dinner at Burma Burma."

MoneyMic may store:

- payee;
- purpose;
- relevant category;
- associated context;
- verification status.

A later transaction to the same person can use that information as evidence.

However, memory is not an unconditional rule.

A later payment to the same person may have a different purpose.

When new information conflicts with an existing memory:

- do not silently overwrite verified information;
- mark the conflict;
- resolve it before using conflicting information for a consequential decision.

Unverified hypotheses must never become verified memory.

---

## 14. Financial pace engine

All financial arithmetic must be deterministic and server-authoritative.

Gemini must not calculate spending pace manually.

For the October 2026 ₹2,000 dining intention, the financial state must include:

- verified dining spend;
- remaining dining limit;
- elapsed period;
- expected spend to date;
- intended spending pace;
- actual spending pace;
- actual-to-intended pace ratio;
- pace classification.

The supported pace classifications are:

ALIGNED

DRIFT

MATERIAL_DRIFT

INSUFFICIENT_DATA

Only VERIFIED dining transactions may enter verified dining spend.

UNKNOWN, INFERRED, CONFLICTED and UNRESOLVED transactions must not be silently counted as verified dining spend.

Missing financial data must not be treated as zero spending.

The numerical threshold configuration must be deterministic and server-side.

Gemini may interpret the pace result but may not invent or change the threshold.

---

## 15. Decision rules

The following rules define the agent's behaviour.

Low confidence + low impact = stay silent.

Meaningful drift = warn.

Material drift + valid delegated authority = intervene.

Material drift + insufficient critical context = ask again before acting.

Outside delegated authority = stop and request explicit user action.

If context is sufficient, do not interrupt.

If context is missing but low-impact, park the uncertainty.

If clarification is still insufficient after the allowed retry, mark UNRESOLVED and continue.

The agent must remain passive by default.

---

## 16. Spending drift and interventions

MoneyMic is not intended to punish spending.

It should detect when actual spending pace is materially different from what the user intended.

When there is meaningful but non-critical drift, the agent may surface a concise warning.

The message should explain:

- what has been spent;
- what the user's intended pace was;
- how actual pace differs;
- what that implies for the remaining period.

When a valid delegated intervention policy exists, the agent may apply the permitted intervention.

When the action would exceed delegated authority, the agent must ask the user rather than improvising.

The agent must never silently reduce the user's allowance.

---

## 17. User overrides and intention changes

The user remains the final authority over their own spending intention.

The user may:

- explain a transaction;
- override a warning;
- knowingly exceed the current budget;
- revise the intention;
- withdraw permissions;
- modify delegated authority.

A user choosing to spend more does not automatically rewrite the original intention.

A new intention becomes authoritative only after explicit user confirmation.

After a confirmed change, the server must recalculate the spending state.

---

## 18. Pine Labs

Pine Labs is the payments and authorisation rail.

MoneyMic may use Pine Labs capabilities that already exist, while any unsupported control layer is simulated through Wizard-of-Oz.

Do not claim that MoneyMic can arbitrarily intercept or block payments made through every external UPI app.

For supported payment actions:

- respect user-defined permissions;
- respect amount/scope boundaries;
- verify status before treating an action as successful;
- treat pending as pending;
- treat timeout as unresolved until reconciled;
- do not create duplicate payments because an earlier attempt timed out;
- expired authorisation requires fresh authorisation;
- rejected actions must be surfaced rather than silently repeated;
- actions outside delegated authority require explicit user action.

Pine Labs should not be used merely for visual demonstration. It should appear when the financial policy genuinely requires a payment or authorisation capability.

---

## 19. Delhivery

Delhivery is a secondary rail.

It should not be forced into the core dining simulation just to demonstrate a third connector.

Its role is to allow MoneyMic to extend selected financial intentions into physical-world execution where that is genuinely useful.

Potential future uses may include:

- fulfilment of a user-defined physical commitment;
- delivery associated with a completed financial goal;
- other explicitly authorised physical-world actions.

Do not introduce arbitrary T-shirts, cakes, merchandise or reward mechanics into the core simulation unless the scenario genuinely requires them.

Delhivery should remain disabled or unused in the core dining run unless its use is justified by the scenario.

---

## 20. Wizard-of-Oz architecture

The operator is the outside world.

The operator is not the agent and is never allowed to help the agent reason.

The operator may:

- inject raw external financial events;
- upload a real or redacted financial-source file;
- provide an actual audio file after the agent requests clarification;
- provide documented Pine Labs Wizard-of-Oz responses;
- provide documented Delhivery Wizard-of-Oz responses.

The operator may not:

- tell Gemini what a transaction means;
- provide the expected category;
- provide the true transaction purpose;
- provide hidden user intent;
- provide the expected agent decision;
- decide which tool Gemini should call;
- provide operator reasoning;
- alter a transcript's meaning before it reaches Gemini.

The agent must independently make all substantive decisions.

---

## 21. Hidden ground truth

Maintain a completely separate operator-only store for evaluation.

The hidden store may contain:

- true transaction meaning;
- expected category;
- true user intent for testing;
- expected outcome;
- evaluation notes.

None of these may enter Gemini's context.

The agent-facing state must contain only information that would legitimately be available to the agent.

The operator view may show hidden ground truth for evaluation, but the judge-facing view must not expose it during the final recording.

---

## 22. Unhappy flow

MoneyMic must explicitly handle important failure and ambiguity cases.

### Invalid or incomplete financial event

Do not process the event as verified.

Keep it unresolved or request a corrected external event.

### Duplicate transaction

Do not count the same transaction twice.

Use transaction identity and source metadata to detect duplicates.

### Unknown or weak merchant information

Use available metadata and memory.

If the uncertainty is low impact, park it without interrupting.

If it materially affects the financial decision, clarify.

### Ambiguous P2P

Use memory and metadata first.

Use Gnani only when critical missing context is materially useful.

### User gives an unclear voice answer

Do not mark the transaction verified.

Ask one narrower clarification if justified.

Otherwise park as UNRESOLVED.

### User does not answer

Do not repeatedly call.

Park the transaction and continue monitoring.

### User refuses to answer

Respect the refusal.

Do not treat refusal as confirmation of any category or purpose.

### Conflicting memory

Do not overwrite verified memory silently.

Mark the conflict and resolve it before consequential use.

### Insufficient financial data

Do not assume zero spending.

Classify the financial state as INSUFFICIENT_DATA where appropriate.

### Spending drift with insufficient context

Clarify the critical context before consequential action.

### User exceeds delegated boundary

Do not improvise.

Request explicit user action.

### Payment rejected

Surface the rejection and stop or request a different explicitly authorised action.

Do not silently duplicate the payment.

### Rail timeout

Treat the payment as unresolved.

Reconcile the original action before considering another attempt.

### Rail unavailable

Do not pretend the action succeeded.

Tell the user what could not be completed and resume or escalate according to authority.

### Authorisation expired

Request fresh authorisation where required.

### Execution response uncertain

Verify using the appropriate connector before marking the action complete.

---

## 23. Human interface

MoneyMic uses a lightweight mobile app as the control centre.

The interface should make MoneyMic feel like an agent, not a spreadsheet.

The app should provide:

- initial setup;
- spending intention configuration;
- permission and authority configuration;
- passive monitoring;
- concise notifications when intervention is necessary;
- contextual voice interactions for important P2P clarification;
- an on-demand financial view.

The agent stays passive by default and interacts proactively only when there is a meaningful reason, such as:

- missing critical transaction context;
- material spending drift;
- a user-authorised policy trigger.

### Setup

During setup Aarav defines:

- monthly intention;
- tracked category;
- relevant permissions;
- intervention preferences;
- boundaries delegated to MoneyMic.

### Normal use

Transactions are monitored automatically.

Aarav does not manually categorise transactions or maintain a tracker.

### P2P clarification

When clarification is materially useful, MoneyMic surfaces a brief voice interaction through Gnani.

The agent asks only what is necessary.

### Spending drift

When spending materially deviates from intended pace, MoneyMic shows a concise notification or voice intervention explaining the deviation and its implication.

### Consequential action

When a user-authorised payment policy is triggered, MoneyMic may apply the permitted intervention.

If the required action exceeds delegated authority, the app requests confirmation.

### User control

The user can always:

- explain;
- override;
- revise the intention;
- change permissions;
- withdraw authority.

### On-demand view

The user can ask:

- where their money went;
- which transactions remain unresolved;
- how actual spending compares with intended pace;
- what context MoneyMic currently remembers;
- what actions require attention.

---

## 24. Agent-facing decision architecture

Gemini is the sole decision-making agent.

The server provides:

- current simulation state;
- verified financial information;
- relevant transaction data;
- verified contextual memory;
- deterministic pace calculations;
- tool results.

Gemini decides:

- whether context is sufficient;
- whether clarification is needed;
- whether to call Gnani;
- whether to remain silent;
- whether spending drift is meaningful;
- whether intervention is appropriate;
- whether user approval is required;
- whether an action is within delegated authority;
- whether verified context should be stored.

The server enforces:

- information boundaries;
- state transitions;
- deterministic arithmetic;
- authority boundaries;
- connector execution rules.

The frontend must not secretly decide the agent's substantive behaviour.

---

## 25. Auditability

The simulation must maintain three important audit trails.

### Decision Log

Each decision records:

- timestamp;
- state;
- decision type;
- source;
- decision;
- rule ID;
- resulting action.

Do not expose chain-of-thought.

### Connector Trace

Each connector interaction records:

- timestamp;
- connector;
- endpoint or tool;
- request;
- response;
- status;
- REAL or WIZARD_OF_OZ mode.

### State History

Each state transition records:

- timestamp;
- previous state;
- next state;
- transition reason.

The judge-facing interface should make the agent's decisions and actions auditable without revealing hidden reasoning.

---

## 26. Final simulation story

The final Round 3 simulation should follow one coherent person and chronological story rather than a collection of disconnected demonstrations.

The preferred story should demonstrate the core MoneyMic loop:

1. Aarav sets a ₹2,000 October dining intention.
2. MoneyMic begins passive monitoring.
3. A clear routine dining transaction arrives.
4. MoneyMic understands it without interrupting Aarav.
5. An ambiguous material P2P transaction arrives.
6. MoneyMic determines that critical context is missing.
7. MoneyMic requests a brief voice clarification through Gnani.
8. Gnani returns the actual transcript.
9. Gemini determines whether the context is sufficient.
10. The transaction becomes verified where justified.
11. Verified contextual memory is stored.
12. MoneyMic returns to passive monitoring.
13. A later transaction involving the same person demonstrates memory reuse and avoids unnecessary interruption.
14. Additional verified spending changes the deterministic pace state.
15. Gemini decides whether to remain silent, warn or intervene.
16. Where a consequential authorised action is required, it follows the execution and verification path.
17. The agent returns to monitoring.

The simulation should demonstrate the agent's intelligence through selective action, not through constant activity.

---

## 27. Final recording requirements

The final recording must show MoneyMic operating from the first external event until the defined outcome is achieved.

The recording must show:

- every relevant external input;
- every Gemini decision that matters;
- every Gnani call;
- every Pine Labs call;
- every Delhivery call if used;
- every connector response;
- every user-facing message;
- important state transitions;
- the resulting financial state.

Model thinking may be fast-forwarded.

The entire recording must be no longer than five minutes.

Do not show hidden ground truth during the final judge-facing recording.

---

## 28. Round 3 Part 1 evidence

The actual run should generate enough evidence to answer all six Part 1 questions directly from the simulation.

### Q1 Story

The simulation must provide enough chronological information to explain one person's journey:

- name;
- date;
- what they saw;
- what they said;
- what MoneyMic did.

### Q2 Decisions

Every substantive decision in the recording must be reconstructable with:

- date and time;
- triggering input;
- source;
- decision;
- applicable rule;
- exact message/action;
- connector used.

### Q3 Day-one knowledge

The implementation must distinguish what MoneyMic knows before use from what it learns later.

Day-one information should come from:

- user setup;
- permissions;
- spending intention;
- authorised connected financial data;
- system rules.

Learned information must not be presented as if it existed on day one.

### Q4 Connector evidence

Every Pine Labs, Delhivery and Gnani call must be reconstructable with:

- exact documented endpoint;
- request;
- response.

Any capability that does not exist today but would materially improve MoneyMic may be listed separately as a proposed build.

### Q5 Human interface

The simulation must expose every human-facing interaction:

- setup;
- notification;
- voice clarification;
- user response;
- intervention;
- approval/override;
- on-demand financial view.

### Q6 Rail readiness

The final simulation must provide enough real and Wizard-of-Oz evidence to justify an honest agent-readiness score for:

- Gnani;
- Pine Labs;
- Delhivery.

---

## 29. Product priorities

The primary objective is a convincing and defensible working simulation.

Prioritise, in order:

1. correct autonomous decisions;
2. correct state transitions;
3. correct information handling;
4. deterministic financial calculations;
5. selective use of Gnani;
6. verified contextual memory;
7. bounded authority;
8. auditability;
9. realistic Wizard-of-Oz behaviour;
10. clean final recording.

Do not add features merely because they look impressive.

A feature should be added only when it strengthens the core outcome, improves the agent's behaviour, or creates useful evidence for the Round 3 submission.

---

## 30. Non-negotiable principle

MoneyMic should not behave like an app that waits for the user to ask:

"Where did my money go?"

It should continuously understand the user's financial behaviour in the background and intervene only when doing so can meaningfully help keep actual behaviour aligned with the user's own intention.

The agent should be powerful enough to act, but bounded enough that the user remains in control.