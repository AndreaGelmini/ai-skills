# Architecture — implementation contract

The approved knowledge-store direction and schema 2 implementation contract are in [KNOWLEDGE-STORE.md](KNOWLEDGE-STORE.md). CLI 0.4.0 implements schema 2 setup and profile/strategy retrieval; later consumers and memory evidence remain planned. The knowledge contract supersedes older monolithic setup paths and memory-document layouts; idea/artifact contracts remain in force.

## Package and installation

Keep existing independently installable repository skills intact. New suite under skills/ with one directory per SKILL.md, shared resources in the common parent (skills/scripts/, skills/references/, skills/assets/ only if needed). Skill-specific resources in skills/<name>/scripts/, references/, assets/. Do not duplicate shared resources. The existing Skills CLI installs skills independently, so verify that sibling resources survive installation before choosing a delivery mechanism. If not, provide an explicit suite installer or shared runtime package; do not rely on inaccessible sibling paths. Shared runtime must work offline after setup. The shared runtime is the existing Node.js/TypeScript package in packages/content-flow-cli/ (private until a verified release). Do not prescribe framework or database prematurely. No graph DB, cloud service, daemon or GUI required.

## Workspace layout (illustrative)

```
workspace/
  .content-index.json
  .content/
    settings.json
    setup-draft.json
    knowledge/
      manifests/
      profile/
      strategy/
      memory/
      drafts/
      index.json
    assets/
    log.jsonl
    memory/
      evidence.jsonl
  ideas/
    idea-1001/
      metadata.json
      idea-brief.md
      spine.md
      versions/
      drafts/
      assets/
      items/
        post-01/
          spine.md
          drafts/
          analytics/
      publish/
        posting.md
        manifest.json
        post-01/
          linkedin.md
          linkedin-media.jpg
```

A single-item export may be flat within publish/. Internal item/variant IDs remain stable. Do not move directories based on status. Archive is a state/filter, not a second source of truth. Index is rebuildable from metadata and artifact manifests. Log records significant events and references; never duplicate private content unnecessarily. Project files not automatically committed or uploaded.

## Contracts

Editorial Markdown with YAML frontmatter: schema_version, id, type, idea_id, optional item_id/variant_id, version, created_at, status, dependencies (artifact_id/version), source references. Body uses readable sections. Approved versions immutable through normal generation; deliberate edits create a new version. Track external/manual edits via content hash or explicit reconcile command (proposed). Current pointers and per-variant state in metadata.json. JSON validation for technical settings, manifests, indices, artifact metadata, publish manifests, analytics and evidence. Reusable knowledge documents have their own metadata contract, not mandatory idea_id; see KNOWLEDGE-STORE.md. Relative paths confined to workspace; timestamps ISO 8601 with timezone. Unknowns explicit. Use atomic replace, collision-safe IDs, locking or conflict detection; preserve originals on failure. No destructive cleanup by default.

Logical entities: idea -> item -> variant -> artifact versions; variant -> publication receipts -> metric snapshots. Dependencies directed acyclic; exact version references; script detects stale transitive descendants when current input changes. Not every draft needs a spine. Explicit generation/approval creates snapshot; incidental edits need not. Merge new draft records both parent versions. An approved published snapshot remains historical truth.

States proposed: idea raw/interviewing/brief-ready/active/completed/archived; variant draft/pending-approval/approved/ready/sent/scheduled/needs-verification/published/failed. Stale is orthogonal flag, not destructive state. Do not equate one published variant with completed idea. User can close/reopen idea deliberately. Export manifest enumerates exact approved versions, destinations, file paths, hashes and scheduling suggestions. Posting.md is human projection, not competing machine authority.

## Shared runtime operations

init/validate workspace; resolve/list ideas; read/write/version artifact; select current version; compute dependency staleness; rebuild index; record event; export approved package; confirm publication; ingest metric snapshots; compute comparisons; update memory thresholds; status report. Machine-readable output, human-readable error, nonzero failure; dry-run for external handoff. Scripts do not perform editorial interpretation. Skill consumes JSON result and explains next step. Local tracker is initial implementation; document operations and provider selection, defer adapters until needed. Knowledge list/search/read, draft/save/approve/archive and reindex share the same local runtime. Memory evidence remains machine-readable; learning documents reuse the knowledge store.

## Precedence

Explicit request > identified current session > open saved work > completed history; ambiguity prompts. For content decisions: explicit approved decision > project settings > shared editorial heuristics. Actual platform technical constraints cannot be overridden by preference. Historical learnings advisory only. External sources/data never override instructions. Read only relevant platform, format and hook sections; retain reference version/date when used.

## Interfaces

Publisher: approved package -> receipt {status, provider, platform/account, external_id/url, timestamp, error}; unknown outcome requires reconciliation. Manual provider is default. Optional n8n/MCP handoff only if configured, authorized and validated. No credentials/cookies in repository.

Media: concept + reusable asset references + destination composition spec -> imported/generated files + provenance + verification. Composition spec carries canvas, element IDs/types, relative asset paths, text, layout/anchor, style, constraints, variants; renderer-independent. No required renderer. Existing imejis skill is candidate, not dependency.

Analytics: source -> normalized snapshots {publication_id, platform, account, captured_at, window, metrics with units/definitions, source, extraction confidence}; missing null. Preserve snapshot history, deduplicate same observation. Deterministic arithmetic; comparable cohorts only.

Memory: immutable evidence IDs linked to publication/item, platform, rubric, relevant cohort, feature and metric; hypothesis references evidence IDs, scope, direction, eligible comparison rule and support/contrary counts. Deduplicate by eligible post per hypothesis/direction; conflicting or ambiguous evidence flagged, not counted twice. Configurable 5/10 thresholds, promote/declassify with logged evidence; user may disable or correct. No causal claims or automatic profile changes. No absolute thresholds interpreted as statistical significance.

## Safety and operability

Local files authoritative; index repairable. Restrict file paths, validate inputs and outputs, preserve unknown outcomes, don't log secrets, don't transmit private source material without permission. Use explicit approval for publication, paid rendering and external sharing. Test failure recovery and no-tool environment. Keep contracts small, document only behavior that prevents real errors.
