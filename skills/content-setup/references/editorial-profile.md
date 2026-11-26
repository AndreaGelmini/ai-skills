# Editorial profile

Use these criteria to interpret the CLI fields, not as a fixed questionnaire. Capture only information that helps distinguish editorial decisions. A nonempty value alone is not evidence of sufficiency.

| Field | Purpose | Capture / sufficient when |
|---|---|---|
| `identity` | Ground the author's perspective and credibility | Author/brand, role, niche, positioning and relevant experience. The agent can explain whose perspective it represents without inventing credentials. |
| `objectives` | Resolve competing editorial goals | Desired outcomes (sharing knowledge, conversation, reputation, leads), priorities and what success means. The agent can distinguish the primary goal from secondary outcomes. |
| `audience` | Adapt depth, vocabulary and relevance | Intended readers, interests, needs, familiarity with the subject and meaningful segments. The agent can choose what to explain or assume. |
| `voice` | Preserve recognizable authorship | Tone, register, vocabulary, directness, humor, technical depth, recurring expressions and anti-patterns. Prefer authentic examples over generic adjectives. The agent can distinguish acceptable prose from stylistically incompatible prose. |
| `scope` | Maintain editorial coherence without forcing every idea into a theme | Themes, viewpoints, boundaries and exclusions; topics that require special care. The agent understands what fits and what should be avoided. |

## Optional creative context

| Field | Purpose | Capture / sufficient when |
|---|---|---|
| `rubrics` | Sustain recurring editorial series | Names, purpose, audience or distinctive angle and any recurring format; no mandatory cadence. Enough to recognize which series an idea belongs to. |
| `examples` | Ground stylistic judgments in evidence | Authentic representative writing or project-relative file references, plus what to preserve or avoid. Do not invent examples attributed to the author. |
| `visual` | Keep visual production recognizable | Existing palette, typography, avatar/character sheet, graphic style, logos and asset references; identify non-negotiable visual constraints. No visual identity required if text-only. |

Store confirmed editorial narratives as strings under the corresponding field. Reference longer examples/assets by path; don't embed binary content. Distinguish genuine author material from illustrative examples or agent suggestions.
