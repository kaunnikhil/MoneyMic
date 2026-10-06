# MoneyMic Engineering Rules

MoneyMic is an autonomous financial agent simulation for The Ken agentic-finance competition.

The primary outcome is:
Reduce the gap between a user's intended spending pace and their actual spending, keeping it aligned with the limits they set for themselves, without requiring manual tracking.

Core invariants:

1. MoneyMic is not a manual expense tracker. The agent is passive by default.
2. Gemini is the sole decision-making agent. Do not hardcode substantive agent decisions into the frontend or backend.
3. The operator is only the outside world. The operator must never provide semantic meaning, expected category, hidden intent, expected decision or reasoning to Gemini.
4. Hidden ground truth must never enter Gemini context, tool arguments or model-visible state.
5. Never expose chain-of-thought. Record only concise decision labels, rule IDs, states and resulting actions.
6. Preserve the MoneyMic state machine and validate state transitions server-side.
7. Never treat INFERRED, UNKNOWN, CONFLICTED or UNRESOLVED information as VERIFIED.
8. A transaction amount/status may be verified while its purpose remains unknown.
9. Do not call Gnani merely because a transaction is P2P. Use it only when missing context is materially useful.
10. Only verified or explicitly confirmed financial context may become verified persistent memory.
11. Financial arithmetic must be deterministic and server-authoritative.
12. Pending is not failed. Timeout is not failed. Never duplicate a payment without reconciling the original attempt.
13. Never expand the user's delegated authority.
14. Do not pretend MoneyMic can intercept arbitrary external UPI payments.
15. Pine Labs remains Wizard-of-Oz unless a genuinely usable sandbox capability is connected.
16. Delhivery is secondary and must not be forced into the core dining simulation.
17. Do not remove working functionality or rewrite the architecture without first inspecting the existing implementation.
18. Run the relevant build/typecheck/tests after every substantive change.
19. Prefer small, reversible changes over large rewrites.
20. Never modify files during a task explicitly marked READ-ONLY.