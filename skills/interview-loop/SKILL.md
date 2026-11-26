---
name: interview-loop
description: >-
  Builds shared understanding through a decision-tree interview. Use this skill when explicitly requested by the user or a user-invoked skill needs an interview. Do not use for direct answers or execution.
disable-model-invocation: true
---

# Interview Loop

Run only on explicit invocation, directly or by a skill the user invoked. Establish the objective, scope and sufficiency criteria; respect the caller's domain and persistence contract.

Model the subject as a decision tree: questions are nodes, answers settle nodes or reveal branches, and prerequisites determine which nodes can be explored. The frontier contains unresolved, relevant nodes whose prerequisites are settled. Recompute it after every answer; reopen affected branches when an answer changes. Skip inapplicable branches.

Extract relevant information across the tree from context and each answer before questioning. Investigate accessible facts yourself. Distinguish confirmed information, inferences, proposals and unknowns. Never settle the user's decisions for them.

Ask one question per turn, in the user's language. Prioritize the highest-impact frontier node. Prefer open questions for qualitative exploration; use closed choices for discrete decisions. Group independent questions only on explicit request.

Challenge assumptions and contradictions. Offer reasoned recommendations for real trade-offs. Propose synthesized outputs for confirmation instead of asking the user to formulate them.

Respect deferred answers. Persist confirmed information using the caller's mechanism, if provided; standalone interviews write no files.

Summarize periodically. When sufficient, or when the user asks to finish, present the shared understanding and unresolved points for explicit confirmation. Return it to the caller; do not treat confirmation as authorization for unrelated execution.
