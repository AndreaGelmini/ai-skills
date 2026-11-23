# Decision register

All 29 discussion nodes are consolidated below; later choices supersede earlier proposals. Technical defaults not expressly agreed are marked proposed in the specification or architecture.

| Node | Accepted decision | Rationale |
|---|---|---|
| 1 | Single user/brand, future multiple workspaces | Personal usefulness first |
| 2 | Collaborative adaptive idea interview | Discover intent; propose interpretations, never assume endorsement |
| 3 | Persist artifacts, versions and dependencies | Selective regeneration and merging; no deletion of valid old drafts |
| 4 | Extract context, ask gaps, verifiable completeness | No redundant questions; distinguish confirmed, inferred, hypothetical, missing |
| 5 | Explicit brief approval | Protect author's meaning; atomic skills independently callable |
| 6 | One flexible content-flow guide | State-aware routing; not mandatory sequential execution |
| 7 | Explicit request > current session > open saved > completed history | Resolve ambiguity before choosing an idea; stable identity |
| 8 | Core skills plus meaningful specializations | Reuse capability, not alias or duplicated logic |
| 9 | Local tracker for MVP; stable idea directories and rebuildable index | Document tracker conventions; defer external providers |
| 10 | Main spine plus derived spines for sequences | Vary angles without losing coherence |
| 11 | Optional visual identity and reusable assets; delegate media | User selects or supplies references; no required generator |
| 12 | Independent composition specification; local renderer preferred when needed | Preserve elements, visual inspection and iteration; external tools allowed; renderer postponed |
| 13 | Complete editorial MVP including publishing and analytics | Media/video infrastructure postponed |
| 14 | Publishing abstraction with verified outcomes | Manual fallback; unknown result never marked published |
| 15 | Originally automatic analytics first; superseded by screenshot/CSV/manual MVP | API/browser experiments deferred |
| 16 | No proprietary automatic publishing in MVP | Export; optional configured n8n or other tool; no requirement |
| 17 | Standard publish package and posting.md | Approved material distinct from drafts; per-post outputs for sequences |
| 18 | Upfront or progressive production | Choose at brief; adjust future posts on evidence |
| 19 | Status command and configurable start-of-flow check | Deterministic script; no background daemon |
| 20 | Optional persistent editorial memory: evidence, provisional, consolidated | Advice, not autonomous identity change |
| 21 | Configurable occurrence thresholds (5 support / 10 contrary initially) | Count independent evidence; preserve sources; scope by platform and post |
| 22 | Fixed criteria for individual posts; exploratory comparisons for multiple posts | Correlation is not causation |
| 23 | Structured modular resumable INIT | Skip optional details, approve setup |
| 24 | Shared references + local preferences | Avoid copies; respect technical constraints |
| 25 | Atomize by responsibility | Hooks/CTA remain references initially |
| 26 | Markdown + YAML for editorial artifacts; JSON for machine state | Human editable and machine verifiable |
| 27 | Review by default; corrected version on request; humanizer | Preserve meaning, authenticity and source facts |
| 28 | Full agreed MVP, incremental implementation | Personal use is sufficient motivation |
| 29 | Efficiency AND editorial quality | GO for personal use, not proof of market fit |

## Latest implementation constraints

Skill Builder conventions apply: concise English instructions, conversation-language outputs, meaningful routing descriptions, one job, aim well below 500 words. Keep private scripts/references/assets within skill; shared resources in the nearest common parent, without runtime duplication. TypeScript or Python scripts for deterministic operations. Existing repo skills remain independent. No new feature without explicit scope decision.

## Superseded proposals

No mandatory eight-platform pack, compulsory spine for generic drafts, automatic social publishing, browser login storage, automatic analytics collection, third-party tracker, mandatory visual identity, graph database, or sophisticated rendering engine in the MVP. Do not confuse the agreed full MVP with implementing every future integration.
