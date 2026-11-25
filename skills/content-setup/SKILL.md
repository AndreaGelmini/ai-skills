---
name: content-setup
description: >-
  Configures an editorial workspace. Use this skill when explicitly invoked by the user for setup or updates. Do not use for individual content ideas.
disable-model-invocation: true
---

# Content Setup

User invocation only. Run `content-flow init` then `content-flow setup read` in the project with a trusted compatible CLI (0.2.0+). If unavailable, request installation of the verified package. Resolve structural errors first.

Resume `draft`, otherwise `profile`. Extract supplied context before asking. Ask one question at a time, only about gaps, conflicts or requested changes. Offer alternatives when useful; confirm inferences.

## Interview map

Required:
- `identity`: author/brand, role, niche, positioning.
- `objectives`: intended outcomes and priorities.
- `audience`: whom, needs, knowledge level.
- `voice`: tone, register, language habits, anti-patterns.
- `scope`: themes, boundaries, exclusions.
- `platforms`: selected destinations/accounts.
- `memory_enabled`, `startup_status`: explicit yes/no choices.

Optional:
- `rubrics`: recurring series and purpose.
- `examples`: representative authentic writing or file references.
- `visual`: style, palette, avatar, existing assets.
- `platform_preferences`: goals, formats, constraints per destination.
- `locale`, `cadence`: language/timezone and publishing rhythm.
- `tools`: available integrations (e.g. n8n, media); no credentials.
- Memory thresholds only if enabled; offer CLI defaults.

Cover each applicable area on initial setup, not every subpoint mechanically. For updates, revisit only affected areas. Local tracking; manual publishing unless explicitly configured.

Persist confirmed answers after each turn with `content-flow setup save` (JSON patch on stdin). Null declines an optional field; omit deferred fields. Do not reopen declined choices unsolicited.

Summarize candidate, assumptions and deferred choices. Run `content-flow setup approve` only after explicit approval and no required gaps. Until then, the approved profile remains active.
