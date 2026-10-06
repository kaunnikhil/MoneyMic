# MoneyMic: AI Spending Alignment Agent

> **Keep users' actual spending aligned with the pace and limits they set for themselves, without requiring manual tracking.**

MoneyMic is a bounded AI financial agent designed to move beyond retrospective expense tracking and help users stay aligned with their own spending intentions while they are still spending.

---

## Product

Traditional expense trackers answer:

**“Where did my money go?”**

MoneyMic is designed around a different question:

**“Am I still spending at the pace I intended, and does anything need to happen now?”**

The product continuously monitors supported financial events, understands transaction context, evaluates spending against the user's intended pace, and decides whether to stay silent, clarify, warn, or intervene within explicitly delegated authority.

---

## Why I Built It

The original assumption was that users mainly needed better expense tracking.

I interviewed **26 users** and found a deeper problem: some users were already creating their own mechanisms to control spending: setting short spending caps, handing money to someone else, or converting digital money to cash.

The insight was:

> **Spending awareness is not the same as behavioural adherence.**

That led to a product strategy pivot:

**"Passive expense tracking" TO "Proactive spending alignment"**

---

## What I Worked On

### 1. Product Discovery & Problem Framing

- Interviewed **26 users** to understand how they manage everyday digital spending.
- Identified the gap between knowing where money went and actually staying aligned with intended spending.
- Synthesised observed workarounds into the core product problem.
- Defined the target user around high frequency digital spenders who want control without manual tracking.
- Translated the discovery into the product hypothesis and PRD.

### 2. Product Strategy

Defined MoneyMic around a single product outcome rather than a feature set:

**Reduce the gap between actual spending and the spending trajectory the user intentionally set.**

Key strategic decisions included:

- User intention is the reference point; MoneyMic does not impose its own spending preference.
- The agent is **passive by default**.
- Intervention should happen only when evidence, materiality and delegated authority justify it.
- Voice is a tool, not a default interaction.
- Context should be resolved before consequential decisions are made.
- Verified memory should reduce repeated user effort without becoming permanent truth.

### 3. AI Agent & Product Architecture

Designed MoneyMic as an **L3 bounded AI agent** with a **12-state lifecycle**:

`Setup → Monitoring → Event Verification → Understanding → Context Confidence → Context Intervention → Pace Evaluation → Decision → User Response → Execution → Verification → Contextual Memory → Monitoring`

The agent is responsible for judgement and context-dependent decisions, while deterministic system logic handles financial arithmetic, transaction integrity, state validation and authority enforcement.

The product was translated into **17 capabilities across 3 partner rails**:

- **Pine Labs**: financial data and payment infrastructure
- **Gnani**: voice and conversational infrastructure
- **Delhivery**: logistics / physical-world execution

### 4. Context Aware Voice

A key product decision was to make the agent decide:

> **“Should I interrupt the user at all?”**

Rather than hard coding a rule such as “P2P payment → voice call”, MoneyMic evaluates available context, existing memory and transaction materiality before deciding whether clarification is actually worth the interruption.

The MVP integrates **real Gnani STT** for this contextual clarification flow.

### 5. Contextual Memory

Designed memory as verified financial context rather than a permanent payee rule.

For example, learning the purpose of one payment to a person should reduce future questioning, but should not cause every future payment to that person to be classified identically.

### 6. User Experience

Designed the key product flows in Figma, including:

- onboarding;
- spending intention / budget setup;
- spending dashboard;
- transaction context clarification;
- agent intervention;
- user correction / control flows.

The UX principle was to make MoneyMic feel like an agent that works in the background rather than another tracker that requires constant maintenance.

### 7. MVP Build

Built and demonstrated an MVP covering the end to end spending alignment workflow:

`Transaction → Verification → Understanding → Context Resolution → Pace Evaluation → Agent Decision → Intervention → Memory → Monitoring`

The implementation includes:

- AI agent runtime;
- state machine orchestration;
- server authoritative transaction ledger;
- contextual memory;
- deterministic spending calculations;
- selective voice interaction;
- real Gnani STT integration;
- evidence and decision logging;
- operator and judge views for simulation/auditability.

### 8. Partner Capability Mapping

Mapped the product against the capabilities available from Pine Labs, Gnani and Delhivery and separated:

- capabilities already supported by partner infrastructure;
- capabilities that require MoneyMic orchestration;
- capabilities that are future product extensions.

This resulted in a **17 capability architecture across 3 partner rails**.

---

## Product Measurement

### North Star

**Average absolute deviation between cumulative actual spending and cumulative intended spending.**

The goal is not to minimise spending.

The goal is to minimise the gap between what the user intended and what actually happened.

Supporting metrics include:

- context resolution rate;
- unnecessary interruption rate;
- intervention effectiveness;
- manual effort avoided;
- decision latency;
- retention.

Guardrails include classification errors, false positive interventions, unauthorized actions, transaction reconciliation failures, privacy/security issues and agent interaction burden.

---

## Agent Boundaries

MoneyMic operates at **L3 bounded autonomy**(explained below).

### The agent can independently

- monitor transactions;
- categorise high-confidence transactions;
- maintain spending pace;
- use verified memory;
- send authorised notifications.

### The agent can conditionally

- clarify ambiguous transactions;
- warn or intervene according to policy;
- recommend corrective actions;
- apply supported policies within delegated limits.

### The agent requires explicit user approval to

- change spending intention;
- expand permissions;
- apply authority to another category;
- perform restricted transfers;
- block/cancel arbitrary payments;
- act outside its delegated boundary.

The agent can never expand its own authority.

---

## Key Product Principle

The strongest product decision in MoneyMic is that **the agent is not rewarded for acting more often**.

A good outcome can be:

**“I have enough context. I don't need to interrupt the user.”**

The objective is not maximum automation. It is **useful, bounded automation that improves spending alignment while reducing user effort.**

---

## Artefacts

### Product

- [Landing Page](https://moneymic.lovable.app/)
- [MVP Demo](https://drive.google.com/file/d/1bnpaBHH6bN3JnPSLHlldAkCiunzP6c1T/view)
- [Figma: Product Flows](https://www.figma.com/design/pQNVPseKV9gXbPyZwtMUug/MoneyMic?node-id=27-4792&t=s49HbKz0RmQUbr4S-0)
- [Project Folder](https://drive.google.com/drive/folders/1nsEMfrwmYOYz77FfHA9sRga59dJQrf4P4)

### Product Documentation

- [PRD](https://docs.google.com/document/d/1jxZAPB_5h6b6iROyKeIRTuBflKlfUej_rp-6Ws9gvd0/edit)
- `MONEYMIC_SPEC.md`: product and system specification
- `AGENTS.md`: repository / agent instructions
- `Product QnA`: competition and product strategy work
- `MoneyMic_PRD.pdf`: PRD export

### Partner Documentation

- [Gnani API Documentation](https://docs.gnani.ai/api/introduction/introduction)
- [Gnani Speech-to-Text](https://app.gnani.ai/voice/speech-to-text)
- [Pine Labs Documentation](https://www.pinelabs.com/docs)
- [Delhivery Developer Portal](https://one.delhivery.com/developer-portal/documents)
- [Delhivery Maps API](https://www.delhivery.com/maps/reference)

---

## Project Context

MoneyMic was developed as part of **The Ken's Great Rewiring 2026**, where the project progressed to **Round 3** in the Product Strategy track.

The repository contains both the product work and the implementation used to demonstrate the agent.

---

## Repository Structure

```text
server/          Agent and simulation backend
src/             Product UI and simulation views
server.ts        Application server
MONEYMIC_SPEC.md Product/system specification
AGENTS.md        Agent/repository instructions
Product QnA      Product strategy and competition work
MoneyMic_PRD.pdf PRD export
package.json     Project dependencies
vite.config.ts   Frontend build configuration
tsconfig.json    TypeScript configuration