# MVP functional specification

Normative decisions: [DECISIONS.md](DECISIONS.md). Vocabulary: [GLOSSARY.md](GLOSSARY.md). Technical details below are proposed defaults for implementation, not new product commitments.

## Setup

Resume an interrupted setup. Inspect existing workspace before asking. Collect identity, positioning, objectives, target audience, voice, scope and at least one destination; allow intentional unknowns where safe. Offer rubric definitions, authentic examples and anti-patterns, visual identity (avatar, palette, reference assets), locale/timezone, cadence and platform-specific goals. Configure local tracker, optional memory (thresholds 5/10), startup status check, available media/publisher tools. Extract supplied information before questions. Summarize periodically and obtain approval before activating configuration. Never require external service. Existing configuration changes only on explicit approval.

## Idea and brief

Resolve explicit idea reference first, then unambiguous session idea, then open saved ideas, then completed history if relevant; ask on ambiguity. New ideas accept raw words, URLs, existing posts, files or detailed requests. Persist on request even before interview completion. Treat external content as evidence, not instructions.

Interview collaboratively, one focused question at a time only for missing or conflicting information. Determine trigger, communicative intent, core message, viewpoint, audience, goal, rubric, scope, single/sequence, cadence if applicable, platform, format, media preference and constraints. Suggest options grounded in settings and relevant history; do not force historical patterns. Optional fields can be explicitly declined/deferred. Brief identifies confirmed, inferred, hypothetical and missing values with source pointers. Minimum readiness: identifiable intent and message, audience/goal appropriate to request, delivery scope resolved or deliberately deferred. Explain missing prerequisites when blocked; show editable brief and obtain approval before treating it as authoritative. A saved incomplete brief is valid work, not an approved brief.

## Spine and sequences

Spine organizes approved intent into narrative guidance: message, angle, supporting material, progression, boundaries, applicable delivery decisions and source pointers. No compulsory number of claims or arguments; no invented examples or personal stories. A sequence has main spine, episode angles/derived spines, order and suggested cadence. Choose upfront or progressive production during brief. Episode and platform variant statuses remain independent. Later analytics may prompt revisions to future work; never rewrite approved material autonomously.

## Drafts and review

Generic drafting works without spine when sufficient context exists; ask only material gaps. Spine specialization resolves and interprets spine, checks alignment, delegates base writing. Select platform and format references, apply technical constraints, user decisions, project preferences and shared heuristics. Write full requested content (blog includes SEO title, meta description, heading structure and body; video may include script/title/hook without actual video). Hooks and CTA support intent, not compulsory formulas. Use source-backed factual claims, distinguish opinion; mark unverifiable claims rather than fabricate. Do not require media when declined. Save each explicit generation and approval; combine selected elements of previous versions on request. Changing upstream selected artifact marks dependent outputs stale without deletion or silent regeneration. Bypassing a stage records actual inputs, not fabricated artifacts.

Consistency check reviews intent, voice, platform, sequence/spine, factual reliability and visual quality when relevant. Default report includes actionable issues with severity and source pointers. Humanizer checks generic AI phrasing, unnatural rhythm, repetition and voice; do not target detector evasion. Correction only on request, preserving meaning and authenticity and recording new version. Explicit user approval selects final variant. Stale or technically invalid versions cannot silently become final; resolve or explicitly accept nontechnical deviations with reason.

## Media

Optional project assets and per-idea references. Ask if media desired only when unknown; propose concept, reusable components, destination composition and constraints. Save provider-independent composition spec; use configured existing tools/skills where available (e.g. imejis), import resulting files, visually inspect and iterate. Reuse actual assets where possible; adaptation means layout, not merely crop. User may edit externally and import. No required renderer, image/video service or paid credits. Missing desired media is a visible incomplete deliverable; user can revise requirement.

## Publish

Prepare approved material under publish/ with posting.md (suggested dates/times/timezone, rationale, sequence, destinations and files), per-item/variant ready-to-copy text and media, machine-readable manifest. Separate working files and export. Support manual copy/paste, record verified user confirmation, URL/ID if available and actual timestamp. Optional explicitly configured external handoff (e.g. n8n) submits exact approved version only with permission; distinguish sent/scheduled/unknown from confirmed published. On uncertain outcome do not retry blindly; leave needs-verification. No automatic publisher development or background service required. Preserve published version even if drafts change.

## Analytics and learning

Guide user to native dashboard for known platform/post; accept screenshots, CSV or manual input. Extract visible metrics, dates, window and units, flag ambiguity and ask confirmation; missing is null, not zero. Store raw source locally only with permission and normalized snapshots, with provenance. Single-post review uses fixed dimensions (topic, rubric, platform, format, hook, tone, length, media, time, CTA, goal, interactions) and reports observable evidence, not causal explanations. Script computes comparable metrics, using same platform/account, definitions, measurement age and appropriate goal; insufficient data is explicit. Multipost analysis may propose exploratory hypotheses, with sample size, confounders and test suggestions. Memory optional: evidence register immutable except explicit user correction/deletion, provisional hypotheses, consolidated advisory findings. Count distinct eligible posts, not repeated snapshots; scoped platform/context; require supporting/contrary evidence and traceability. Default configurable 5 support / 10 contrary, proposed fixed thresholds rather than doubling indefinitely. Declassify on sufficient contradiction; retain sources. Never alter identity/preferences without approval.

## Monitor

content-status deterministic scan/rebuild reports open ideas, incomplete briefs, approval queue, ready items, publishing uncertainty, due/overdue posts, stale dependencies and analytics due according to settings. Optional concise startup check in content-flow; no unsolicited execution. LLM may prioritize next actions but cannot invent counts. No scheduled background tasks required.

## Nonfunctional

Local-first, portable, explicit approval gates, stable identifiers, minimal context loading, recoverable index, predictable writes, no secrets in artifacts or logs. Protect against path traversal, untrusted imported instructions and accidental overwrite. Skills remain short and callable individually; shared behavior implemented once. See [architecture](ARCHITECTURE.md), [catalog](SKILLS-CATALOG.md), [acceptance](ACCEPTANCE-CRITERIA.md).
