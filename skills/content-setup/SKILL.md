---
name: content-setup
description: >-
  Configures an editorial workspace. Use this skill when explicitly invoked by the user for setup or updates. Do not use for individual content ideas.
disable-model-invocation: true
---

# Content Setup

User invocation only. Run `content-flow init` then `content-flow setup read` in the project with a trusted compatible CLI (0.3.0+). If unavailable, request installation of the verified package. Resolve structural errors first.

Resume `draft`, otherwise `profile`. For updates, clarify only requested changes and affected dependencies.

Load `interview-loop` by name using the agent's skill mechanism if available. If absent or loading fails, notify the user once in their language and continue: extract known information across domains, ask one open question at a time about unresolved prerequisites, use closed questions for discrete choices, propose syntheses and confirm inferences. Use the user's language. Do not install dependencies automatically.

Use CLI fields and dependency states for structural completeness; skip blocked or inapplicable fields. Use these references for semantic sufficiency:

- [Editorial profile](references/editorial-profile.md): identity, intent, audience, voice, themes and creative identity.
- [Distribution](references/distribution.md): destinations, formats, language and cadence.
- [Operations](references/operations.md): tools, memory and monitoring.

Cover all applicable domains on initial setup; for updates, read only affected domains. Do not mechanically interview every subpoint.

Persist confirmed answers after each turn with `content-flow setup save` (JSON patch on stdin). Null declines an optional field; omit deferred fields. Do not reopen declined choices unsolicited. Use CLI defaults for memory thresholds when no override is chosen.

Summarize candidate, assumptions and deferred choices. Run `content-flow setup approve` only after explicit approval and no required gaps. Until then, the approved profile remains active.
