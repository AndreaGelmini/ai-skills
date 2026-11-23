# Coding agent handoff — incremental delivery of complete MVP

Read [VISION](VISION.md), [DECISIONS](DECISIONS.md), [GLOSSARY](GLOSSARY.md), [MVP-SPEC](MVP-SPEC.md), [ARCHITECTURE](ARCHITECTURE.md), [SKILLS-CATALOG](SKILLS-CATALOG.md), [ACCEPTANCE-CRITERIA](ACCEPTANCE-CRITERIA.md). These documents consolidate discussion; implementation has not begun. Resolve technical defaults against actual repo and agent capabilities; surface material conflicts instead of silently changing product decisions.

## Work graph

| ID | Work | Depends on | Completion evidence |
|---|---|---|---|
| T01 | Inspect repo conventions, Skills CLI packaging spike, choose minimal Python/TS runtime; verify common parent resources install correctly | — | Reproducible installation fixture and brief design decision |
| T02 | Workspace schemas, safe read/write, stable IDs, versions, dependencies, events, index and recovery | T01 | Unit/integration tests |
| T03 | content-setup and resumable configuration, tracker convention, optional tools/memory/status | T02 | Setup acceptance fixtures |
| T04 | Context resolution, idea-interview, brief provenance/approval | T02,T03 | Raw and detailed idea scenarios |
| T05 | Shared platform/format/hook references, native technical constraints and source/version policy | T01,T03 | Reference fixtures, no unsupported current platform claims |
| T06 | to-spine and sequence planning, upfront/progressive | T04 | Single/sequence fixtures |
| T07 | to-draft and spine specialization, version compare/merge, full blog output | T04,T05,T06 | Native output and stale tests |
| T08 | consistency-check, stylistic review/humanizer, approval selection | T07 | Review/correction fixtures |
| T09 | Optional media direction/composition spec, external tool discovery/import and visual review | T03,T05,T07 | No-tool fallback and imported asset fixture |
| T10 | to-content package, posting.md, manual publication and optional generic configured handoff | T08,T09 | Exact approved export and receipt tests |
| T11 | Analytics snapshots, screenshot/CSV/manual ingestion, deterministic fixed comparisons | T10 | Provenance and missing-value tests |
| T12 | Multipost patterns, optional three-level memory, thresholds and recommendations | T11 | Scope/dedup/promotion/declassify tests |
| T13 | content-status and content-flow flexible routing, startup configuration | T04,T06,T07,T08,T10,T12 | Resume, skip, pending and stale scenarios |
| T14 | Install/validate suite, end-to-end tests, README usage and real-task trial | T01–T13 | Acceptance report, documented limits |

Implement shared contracts with tests before prompts that depend on them. Small coherent commits on feature branch; don't touch unrelated skills or main. Use repo create-skill / Andrea Skill Builder for every SKILL.md. Prefer short focused instructions, resource locality and common parent reuse, no speculative abstraction. Run existing metadata/link validators and runtime tests; try realistic activation. Do not claim tests passed unless run. No social API/browser bot, advanced renderer, external tracker, graph database, paid calls or background jobs in MVP. Optional n8n/existing media handoff only if available/configured; mock it for tests. Never commit user secrets or personal content.

## First deliverable

T01 establishes runtime and installability. The rest is one complete MVP goal delivered in increments; don't substitute a text-only prototype for the agreed scope. Maintain decisions and test evidence as needed, avoid extra documents without clear responsibility. Stop on material ambiguity in contracts or a failed installation assumption and report alternatives. No merge to main without user review.
