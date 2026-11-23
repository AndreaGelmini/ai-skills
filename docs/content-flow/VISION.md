# Content Flow — Vision

Status: GO for personal use; commercial demand unvalidated.

## Problem

The author has ideas but does not want to spend time writing and managing social content. A vague intuition is not necessarily the intended message. Preserve the author's intent and voice; do not optimize engagement at their expense.

## Product

A modular, local-first Agent Skills suite. One user and one brand per workspace; multiple workspaces remain possible. From an intuition, existing content or source, explore intent, produce an approved brief, optionally plan a spine and sequence, write platform-native drafts, review, prepare publishable artifacts, record publication, analyze results and advise future work. The user can stop, resume, bypass stages, revise or combine versions. Content Flow guides; it is not a rigid pipeline.

## MVP boundary

Include setup, ideas, interviews, briefs, single and sequence spines, native text drafts (including complete blog articles and SEO metadata), hooks and CTA, revision, selective versioning, dependency checks, local tracking, status report, manual publishing/export, screenshot/manual analytics, comparative analysis and optional editorial memory. Media direction, composition specification and import/delegation to available tools are supported; actual image/video generation is optional and not required for acceptance. A configured external publisher such as n8n may be used; no service is required.

Exclude custom social APIs, browser bots, unattended posting, SaaS, multiuser accounts, external tracker implementations, graphical editor, advanced rendering or video generation infrastructure. Keep integration contracts small; implement providers only when justified.

## Success

Reduce active writing and management time, preserve authentic voice, reduce rewrite burden, produce native formats and avoid forgotten work. Recommendations must be evidence-based. The system fails if managing it takes more effort than the work it replaces.

## Inspirations, not specifications

- [Content Multiplier](https://github.com/CadenceStandard/content-multiplier): one message, native formats; avoid fixed eight-format output and mandatory contrarian claim/three points.
- [Matt Pocock skills](https://github.com/mattpocock/skills): composable skills, setup conventions, local tracker and wayfinding.
- [BlackTwist skills](https://github.com/blacktwist/social-media-skills): contextual analytics, patterns and recommendations; avoid causal overclaims.
- [Generate Image](https://github.com/maxedapps/agent-skills/tree/main/skills/generate-image), [Imejis](../../skills/imejis/SKILL.md): delegated media production.
- [Postiz](https://github.com/gitroomhq/postiz-app): potential external publishing/analytics provider, not an MVP dependency.

See [decisions](DECISIONS.md), [glossary](GLOSSARY.md), [specification](MVP-SPEC.md) and [implementation plan](IMPLEMENTATION-PLAN.md).
