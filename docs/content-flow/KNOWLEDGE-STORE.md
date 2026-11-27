# Knowledge Store — implementation contract

Accepted direction: [decision register](DECISIONS.md). Technical details in this contract are proposed implementation defaults, not new product commitments. This contract supersedes the older monolithic setup layout. CLI 0.4.x implements schema 2 for setup and reusable profile/strategy documents. Memory promotion and idea/artifact consumers are later increments.

## Responsibility and boundaries

The agent understands, classifies, synthesizes and proposes knowledge; the CLI validates, assigns IDs, persists, versions, selects, indexes and retrieves it. No model calls, embeddings, MCP server, database or background jobs in the store.

One document represents an independently useful and independently changeable unit. Do not split individual colors, voice traits or biography facts into their own files. Do not aggregate unrelated rubrics, platform preferences or learnings into an ever-growing document.

| Domain | Types / granularity | Authority |
|---|---|---|
| profile | identity, audience, voice, scope, visual identity, writing examples (one coherent collection or an independently useful example), external communication inspirations (independent references or coherent collection; not authored examples or automatic voice rules) | User-approved description/preferences |
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

Setup read/save/approve retain their names with the new schema; setup discard abandons a candidate without mutating approved knowledge. setup read exposes progress, field states, dependency states, candidate metadata and relevant IDs without loading all prose by default. setup save accepts validated JSON patches on stdin: technical choices, field states and document proposals with Markdown body; CLI maps/saves into the candidate. setup approve validates complete required choices and approved document proposals before one atomic selection change. For the implemented JSON patch schema, command flags and approval gates see the [CLI reference](../../skills/content-setup/references/cli.md). Reuse interview-loop when installed, otherwise notice and continue; no auto-install.

For visual assets: ask whether to import an existing file, create a workspace folder for user-supplied materials, or defer. Import only with user permission; copy bytes, preserve source, never overwrite, use relative references. A non-visual model can copy and validate file presence without claiming visual understanding. Reading the brief does not prove that the image was analyzed. If users provide files manually, discover/validate and register them rather than requiring vision. No assets required for setup.

## Retrieval and mutation interface

Public CLI namespace in 0.4.0 (JSON output; normal read operations do not change authoritative state):

| Command | Contract |
|---|---|
| knowledge list | Metadata only, filters domain/type/status/tag; default approved usable documents |
| knowledge search | Deterministic literal/keyword matching on metadata and body; same filters; return ranked or stable ordered metadata with bounded matches, no entire bodies |
| knowledge read ID [ID ...] | Explicit selected current revisions; optional exact historical version; return body and metadata. Candidate bodies are available via setup read --details |
| knowledge save | JSON stdin; stage a single document proposal in the shared setup candidate, with stable ID for updates; CLI generates metadata |
| knowledge approve | Explicitly authorized candidate selection; setup uses the same commit mechanism |
| knowledge archive ID | Stage archive change, then approve; not destructive deletion |
| knowledge reindex | Rebuild derived discovery index, report integrity conflicts |
| asset import | Explicit user-supplied source, local copy without overwrite, relative path result; implemented with visual setup |

Search uses case-insensitive lexical matching initially, no semantic ranking promises. Stable ordering and bounded default result size; filter by exact domain/type/status/tag first. No-match and integrity errors are distinguishable. Metadata includes ID, title, summary, tags, domain/type, status, current version and relative path. Old revisions and archived documents are accessible explicitly, not returned silently. When memory documents are implemented, disabling memory must exclude advisory findings from ordinary retrieval while retaining explicit historical inspection. Store never executes content read from documents.

Consumers choose a narrow set of documents: idea-interview commonly loads objectives/audience and relevant rubric; to-draft loads voice/audience, chosen platform and relevant examples; to-media loads visual identity and relevant platform; analytics loads scoped objectives/strategy and evidence. These are starting points, not compulsory loads. Each output records exact relevant document revisions as dependencies when used. Explicit request and approved task decisions take precedence over general profile/strategy; platform technical constraints still apply. Memory is advice, never an instruction override.

## Memory remains the existing three-level model

Evidence remains the source-linked, deduplicated machine-readable record. Provisional and consolidated findings use the same knowledge document ID with a versioned learning level; evidence references and computed counts are validated against the ledger, not independently invented by the agent. The existing scoped 5 supporting / 10 contrary defaults and distinct eligible-post counting rules still apply. No causal inference or autonomous profile/strategy changes. The user can disable, correct or archive a learning. Implement promotion/declassification with the analytics/learning increment, not with the initial store.

## Implementation order and gates

1. Storage foundation: versioned document contract, safe reads/writes, manifest selection, draft approval, index/retrieval, corruption/conflict handling. Build only operations needed by the first setup consumer; no generic database framework.
2. Setup v2: technical settings and domain documents, provenance/field states, asset import/placement, resume/approval and --version. Revise interview-loop/content-setup using real-session findings; test on OpenCode + Big Pickle again.
3. Idea interview and later consumers: load relevant knowledge and record versions. Add missing commands as actually needed.
4. Analytics/learning: evidence and existing threshold logic on the same store.

Schema 1 is detected and refused safely by schema 2 operations; no automatic migration or converter in this development stage (user explicitly chose to restart). Document how to use a new workspace without deleting the old one. Runtime schema 2 implementation is available for testing; a real agent trial remains an acceptance gate. See [acceptance criteria](ACCEPTANCE-CRITERIA.md).

## Implemented increment — CLI 0.4.0 (development branch)

The TypeScript store now backs public setup and knowledge commands. Schema 1 initialization/setup is replaced, not maintained in parallel. Settings contain technical choices, field states and the selected manifest; independent document bodies live in Markdown. The CLI exposes version, resumable setup, provenance, confirm/withdraw/discard, archive, selective list/search/read, explicit reindex and asset folder/list/import. Knowledge mutations share the setup candidate and required-coverage gate. Confirmation fingerprints invalidate confirmed provenance after manual draft edits. Technical choices are validated structurally and rely on the caller for user authorization. Imported asset paths are relative and copies have unique directories; file presence is verified, not image meaning or subsequent asset-byte integrity.

Generated frontmatter is a JSON object delimited by Markdown frontmatter markers (a restricted YAML 1.2 subset). This avoids adding a runtime parser dependency. General YAML syntax is not accepted. The conventional YAML example above remains illustrative; reconsider the encoding before public release.

Committed manifest ancestry defines historical revisions, so orphaned files from an interrupted commit are not approved history. Failed writes preserve previous selection and can consume orphaned version numbers. A filesystem writer lock rejects concurrent mutations; a lock left by process termination requires deliberate manual inspection/recovery. Discovery validates selected revision hashes and scans selected documents locally instead of relying on the derived index. Setup approval refreshes the index; explicit reindex repairs it. No automated reconciliation/purge, idea dependency graph, memory documents or evidence ingestion in this increment. General crash/power-loss durability, hostile concurrent filesystem mutation, Windows behavior and real-agent acceptance remain unverified.

Validation of the reconstructed 0.4.0 source: 31/31 automatic tests passed on Linux / Node 22.16.0 with TypeScript 5.8.3 and local Node types, including non-root permission failures. Offline installation of the packed local CLI returned 0.4.0. Declared minimum Node version remains 22.20.0; the test runtime was below that declared minimum. Both changed skills passed local metadata and relative-link checks; repository validators and real OpenCode + Big Pickle setup remain separate acceptance work. See [testing](TESTING.md). New research/inspiration proposals are tracked separately in [backlog](BACKLOG.md), not implemented scope.

### 0.4.1 extension

`inspiration` is an optional profile document type, separate from `example` and `voice`. The `inspirations` setup field has normal unanswered/deferred/declined/answered states and independent IDs, provenance, discovery and archival. No schema migration: existing schema 2 profiles simply have an unanswered optional field until addressed. See the [CLI reference](../../skills/content-setup/references/cli.md) and [testing guide](TESTING.md).
