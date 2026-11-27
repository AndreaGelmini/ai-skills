---
name: content-setup
description: >-
  Configures an editorial workspace. Use this skill when explicitly invoked by the user for setup or updates. Do not use for individual content ideas.
disable-model-invocation: true
---

# Content Setup

User invocation only. Check `content-flow --version` (0.4.x), run `content-flow init` then `content-flow setup read` in the project. If unavailable, request installation of the verified CLI; resolve structural errors first. Never overwrite a legacy workspace.

Resume the candidate, otherwise use approved metadata; for updates read only affected documents. Follow the [CLI contract](references/cli.md) for patches, provenance, asset handling and approval.

Load `interview-loop` by name if available. If absent or loading fails, notify the user once and continue: extract known information across domains, ask one open question at a time about unresolved prerequisites, use closed questions for discrete choices, propose syntheses and confirm inferences. Use the user's language when known. Do not auto-install dependencies.

Use CLI field/dependency states for structural completeness and these references for semantic sufficiency:

- [Editorial profile](references/editorial-profile.md): identity, intent, audience, voice, themes and creative identity.
- [Distribution](references/distribution.md): destinations, formats, language and cadence.
- [Operations](references/operations.md): tools, memory and monitoring.

Cover applicable domains individually, including optional ones, unless the user elects to defer or finish. Do not mechanically interview every subpoint. Absence is not refusal. Do not turn transient jokes or moods into permanent guidance.

After each answer, save relevant Markdown document proposals and confirmed technical choices with `setup save`. Preserve inferred/proposed provenance until confirmed; use existing IDs to update entities. Do not duplicate the same preference across documents.

For visual identity, offer importing supplied files, creating an asset inbox for user placement, or deferring. Never claim image analysis without vision capability.

Before approval, read the full changed candidate (`setup read --details`), summarize decisions, tentative interpretations and outstanding points. After explicit user approval, confirm the included proposals by ID, resolve required gaps and run `setup approve`. The previous approved selection remains active until promotion. Use `setup discard` only on request.
