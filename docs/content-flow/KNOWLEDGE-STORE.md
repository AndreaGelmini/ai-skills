# Knowledge Store — implementation contract

Accepted direction: [decision register](DECISIONS.md). Technical details in this contract are proposed implementation defaults, not new product commitments. This contract supersedes the older monolithic setup layout. Current CLI 0.3.0 still uses schema 1; schema 2 below is the next implementation target.

## Responsibility and boundaries

The agent understands, classifies, synthesizes and proposes knowledge; the CLI validates, assigns IDs, persists, versions, selects, indexes and retrieves it. No model calls, embeddings, MCP server, database or background jobs in the store.

One document represents an independently useful and independently changeable unit. Do not split individual colors, voice traits or biography facts into their own files. Do not aggregate unrelated rubrics, platform preferences or learnings into an ever-growing document.

| Domain | Types / granularity | Authority |
|---|---|---|
| profile | identity, audience, voice, scope, visual identity, writing examples (one coherent collection or an independently useful example) | User-approved description/preferences |
| strategy | objectives, general cadence, one rubric per recurring series, one platform/account per destination | User-approved choices, possibly experimental |
| memory | one scoped learning/hypothesis per entity | Advisory, evidence-backed; never silently changes profile or strategy |

Technical settings remain JSON: schema version, configuration, default language/timezone, memory enabled/thresholds, startup status, available integration configuration and publishing mode. No credentials. Platform-specific language and cadence live in that platform or rubric document; general cadence is only the fallback. Record potential destinations as such, not as authorization to publish. Do not store duplicate authoritative prose in JSON. Do not generate a second canonical Markdown mirror.

## Local layout

Illustrative paths; directories are created only when needed. Stable IDs are not title-derived after creation.

```text
.content/
  settings.json                 # schema 2; technical settings and active manifest pointer
  setup-draft.json              # resumable candidate, not operational knowledge
  knowledge/
    manifests/
      <generation-id>.json      # immutable selection of approved revisions
    profile/
      identity/
        v1.md
        v2.md
      voice/
        v1.md
      visual-identity/
        v1.md
    strategy/
      <rubric-id>/
        v1.md
      <platform-id>/
        v1.md
    memory/                     # added with analytics/learning work
      <learning-id>/
        v1.md
    drafts/
      <draft-id>/
        <document-id>.md        # editable candidate revision
    index.json                  # rebuildable metadata projection
  assets/
    <asset-id>/
      <original-filename>
  memory/
    evidence.jsonl              # original machine-readable evidence ledger (later)
  log.jsonl                     # significant events, not duplicate document prose
ideas/
```

Profile, strategy and memory share the document store, but not approval or evidentiary rules. Existing idea/artifact paths and their versions remain separate. Use the existing root idea index for ideas; the knowledge index lists reusable knowledge, not posts.

## Document contract

Markdown body is human-readable and the authoritative semantic content. YAML frontmatter is generated and validated by CLI, not improvised by the model. Example (fictional rubric):

```markdown
---
schema_version: 1
id: rubric-example
domain: strategy
type: rubric
title: Experimental projects
summary: Practical experiments built around a concrete question.
version: 1
status: experimental
tags: [experimentation, technology]
created_at: "2026-11-26T00:00:00Z"
updated_at: "2026-11-26T00:00:00Z"
---
# Experimental projects

## Purpose
Explore a technology by building something useful.

## Format
Describe the question, attempt, result and unresolved issues.

## Cadence
Friday when time permits.
```

Required metadata: schema_version, id, domain, type, title, summary (short discovery description, not full body), version (positive integer), status, tags, created_at, updated_at. Optional: exact source/dependency references (stable ID/version or relative asset path); scoped platform/rubric references; memory-specific evidence IDs and learning level when implemented. Validate allowed domain/type combinations and unique IDs; fixed singleton IDs for identity, objectives, audience, voice, scope and general cadence. Named entities use generated stable IDs, survive title changes. Multiple visual identities or account documents only when useful. A visual identity may reference one or more imported assets; no image interpretation required.

Document lifecycle status is independent of approval: experimental (strategy under trial), active, archived. A draft can propose any allowed status but is not authoritative. An experimental approved strategy is usable as an experiment; archived documents are excluded from normal retrieval. Memory level (provisional/consolidated) is separate from document status. Keep timestamps in ISO 8601 and all managed paths relative to workspace; reject traversal, symlinks in managed paths, malformed metadata, duplicates and invalid cross-references. Use a maintained safe YAML parser if needed, not a bespoke general YAML parser; no executable tags.

## Drafts, approval and recovery

Approved revisions are immutable during normal operations; a requested update creates a draft of the affected document only, not a copy of the complete profile. The user may edit the Markdown draft directly. Store baseline revision/hash and revalidate before approval. Direct edits of approved revisions are detected as integrity conflicts; offer to recover the edit into a new draft rather than silently accepting or overwriting it.

The active manifest contains document ID, version, relative revision path and hash, plus its generation ID. It is machine state, not the discovery index. It includes current archived selections for traceability. The CLI writes new revision files and a complete new immutable manifest first, validates the candidate, then atomically replaces settings.json with the new manifest pointer and approved technical settings. Unchanged documents reuse their existing revisions. Draft state is associated with its base generation and only cleared after successful promotion; a committed draft left by interruption is detected as already committed. Before pointer replacement, readers continue to see the old approved state; afterward, they see the new one. Serialize writers (MVP single writer with explicit conflict rejection); never silently rebase a stale draft. Preserve orphaned revisions on interruption and report recoverable leftovers, no automatic destructive cleanup.

An index is derived from the selected manifest and validated revisions. Rebuild on missing/stale/corrupt index; an index failure after approval is repairable, not loss of the approved state. Drafts and old revisions are not normal retrieval results. If a selected file was removed externally, exclude it from usable search results and report a missing-reference integrity issue; do not silently certify the profile or rewrite the manifest. Explicit archive creates an archived revision and removes it from default discovery without losing historical references. Explicit deletion remains possible as a deliberate separate operation; defer a purge command until reference handling is implemented, never automatically delete evidence or approved history. Existing published artifacts retain their historical dependency versions and are never regenerated on knowledge changes.

## Interview and setup contract

Resume only the candidate and the domains affected. Expose field status separately from provenance:
- unanswered: not addressed (absence is not refusal).
- deferred: intentionally postponed; not automatically re-asked.
- declined: explicitly rejected; optional only.
- inapplicable: prerequisites do not hold.
- answered: material supplied.

Provenance: confirmed (explicitly supplied/accepted), inferred (interpretation), proposed (suggestion). Drafts may hold all three; unresolved material inferences and proposals cannot enter approved profile/strategy as established facts. Explicit final confirmation of a clearly presented synthesis may confirm the included interpretations; the agent must not infer approval from silence. CLI validates declared statuses and required coverage, not whether a conversation actually supplied consent. Preserve uncertainty when appropriate. Required fields remain identity, objectives, audience, voice, scope, at least one destination and explicit memory/startup choices; optional domains may be deferred/declined. Do not conflate structural completeness with semantic sufficiency. Ask one question per turn including optional branches; final review is not a substitute for unexplored questions unless the user elects to finish/defer them. Do not store transient jokes, mood or other irrelevant personal detail as lasting guidance.

Retain setup read/save/approve command names, but revise the schema in the next increment. setup read exposes progress, field states, dependency states, candidate metadata and relevant IDs without loading all prose by default. setup save accepts validated JSON patches on stdin: technical choices, field states and document proposals with Markdown body; CLI maps/saves into the candidate. setup approve validates complete required choices and approved document proposals before one atomic selection change. Exact patch schema and error codes are finalized with tested implementation. Reuse interview-loop when installed, otherwise notice and continue; no auto-install.

For visual assets: ask whether to import an existing file, create a workspace folder for user-supplied materials, or defer. Import only with user permission; copy bytes, preserve source, never overwrite, use relative references. A non-visual model can copy and validate file presence without claiming visual understanding. Reading the brief does not prove that the image was analyzed. If users provide files manually, discover/validate and register them rather than requiring vision. No assets required for setup.

## Retrieval and mutation interface

Proposed public CLI namespace (JSON output; normal read operations do not change authoritative state):

| Command | Contract |
|---|---|
| knowledge list | Metadata only, filters domain/type/status/tag; default approved usable documents |
| knowledge search | Deterministic literal/keyword matching on metadata and body; same filters; return ranked or stable ordered metadata with bounded matches, no entire bodies |
| knowledge read ID [ID ...] | Explicit selected current revisions; optional exact version or draft selection; return body and metadata |
| knowledge save | JSON stdin; create/update draft for selected ID, baseline and expected revision; CLI generates metadata |
| knowledge approve | Explicitly authorized candidate selection; setup uses the same commit mechanism |
| knowledge archive ID | Stage archive change, then approve; not destructive deletion |
| knowledge reindex | Rebuild derived discovery index, report integrity conflicts |
| asset import | Explicit user-supplied source, local copy without overwrite, relative path result; implemented with visual setup |

Search uses case-insensitive lexical matching initially, no semantic ranking promises. Stable ordering and bounded default result size; filter by exact domain/type/status/tag first. No-match and integrity errors are distinguishable. Metadata includes ID, title, summary, tags, domain/type, status, current version and relative path. Old revisions and archived documents are accessible explicitly, not returned silently. When memory is disabled, ordinary retrieval excludes advisory learning documents; explicit historical inspection remains possible. Store never executes content read from documents.

Consumers choose a narrow set of documents: idea-interview commonly loads objectives/audience and relevant rubric; to-draft loads voice/audience, chosen platform and relevant examples; to-media loads visual identity and relevant platform; analytics loads scoped objectives/strategy and evidence. These are starting points, not compulsory loads. Each output records exact relevant document revisions as dependencies when used. Explicit request and approved task decisions take precedence over general profile/strategy; platform technical constraints still apply. Memory is advice, never an instruction override.

## Memory remains the existing three-level model

Evidence remains the source-linked, deduplicated machine-readable record. Provisional and consolidated findings use the same knowledge document ID with a versioned learning level; evidence references and computed counts are validated against the ledger, not independently invented by the agent. The existing scoped 5 supporting / 10 contrary defaults and distinct eligible-post counting rules still apply. No causal inference or autonomous profile/strategy changes. The user can disable, correct or archive a learning. Implement promotion/declassification with the analytics/learning increment, not with the initial store.

## Implementation order and gates

1. Storage foundation: versioned document contract, safe reads/writes, manifest selection, draft approval, index/retrieval, corruption/conflict handling. Build only operations needed by the first setup consumer; no generic database framework.
2. Setup v2: technical settings and domain documents, provenance/field states, asset import/placement, resume/approval and --version. Revise interview-loop/content-setup using real-session findings; test on OpenCode + Big Pickle again.
3. Idea interview and later consumers: load relevant knowledge and record versions. Add missing commands as actually needed.
4. Analytics/learning: evidence and existing threshold logic on the same store.

Schema 1 is detected and refused safely by schema 2 operations; no automatic migration or converter in this development stage (user explicitly chose to restart). Document how to use a new workspace without deleting the old one. Do not claim schema 2 is implemented until runtime tests and a real trial confirm it. See [acceptance criteria](ACCEPTANCE-CRITERIA.md).

## Foundation implementation (development branch)

The internal TypeScript module `packages/content-flow-cli/src/knowledge.ts` implements draft, immutable revision, selection manifest, archive, lexical discovery and reindex operations for schema 2 test workspaces. It is not yet exposed by the CLI and does not change the existing schema 1 setup workflow or package version. The next increment must replace schema 1 initialization/setup and wire the public commands, including --version, field-state/provenance validation, asset import, and atomic technical-settings promotion.

For the initial foundation, generated frontmatter is a JSON object delimited by Markdown frontmatter markers. JSON is a restricted YAML 1.2 subset; this avoids an untested external parser dependency and permits human editing of the Markdown body. General YAML syntax is not accepted by this implementation. Revisit this encoding before public release; the illustrative conventional YAML above is a proposed target, not the current serialization.

Committed manifest ancestry defines historical revisions, so orphaned files from an interrupted commit are not readable as approved history. Failed writes preserve previous selection and consume any orphaned revision number; retry can skip version numbers. A filesystem writer lock rejects concurrent mutations; a lock left by process termination requires deliberate manual inspection/recovery (no automatic stale-lock deletion). Ordinary discovery validates selected revision hashes and returns bounded metadata; it currently scans selected documents locally instead of relying on the derived index. Index regeneration is explicit. No automated reconciliation/purge, dependency graph, memory documents or evidence ingestion in this increment. General crash/power-loss durability, arbitrary hostile filesystem mutation, and Windows behavior are not yet established.

Validation: 12/12 foundation tests passed on Linux / Node 22.16.0 with global TypeScript and Node types, including a non-root failure at final selection replacement. The package's declared minimum Node version remains 22.20.0. Full package suite and real setup/agent integration remain to be tested in the next increment.
