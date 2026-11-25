# Content Flow CLI

Node.js >=22.20; TypeScript; no runtime dependencies. Private until the package scope and release are approved.

```sh
npm install
npm test
node dist/cli.js check --workspace /path/to/project
node dist/cli.js init --workspace /path/to/project
```

`check` is read-only. `init` creates missing managed paths, never replaces existing data, and refuses to proceed on failed preflight. Both default to the current directory; the workspace itself must exist. Extra settings keys and unrelated files are preserved. The only settings validation in this increment is valid JSON, schema version 1 and pending/approved configuration marker; editorial completeness is a later setup contract. Permissions are checked for the running process, not guaranteed against future filesystem changes. Managed symlinks are rejected. Settings creation uses a temporary file and hard link on a local filesystem supporting hard links; failure is reported, not silently bypassed. Concurrent mutation of the workspace is not supported yet.

JSON output: status (ok/incomplete/error), configuration (pending/approved/null), missing and created relative paths, warnings and errors. Exit codes: 0 structurally ready, 1 missing paths, 2 error. `ok` does not mean editorial setup is approved. No automatic permission changes or destructive repair.

To try the local package: `npm pack`, then `npm exec --package ./andreagelmini-content-flow-0.2.0.tgz -- content-flow check --workspace /path/to/project`. Do not use a registry package of the same name before a verified release.

## Editorial setup (0.2.0)

Run `init` first, then `content-flow setup read`. `setup save` accepts a JSON object on stdin and merges its top-level fields into the candidate; if there is no candidate, it starts with the active profile. It does not activate changes. `setup approve` requires a candidate with every required field and promotes it to `profile` in a single settings replacement. The caller must obtain explicit approval before invoking it. `setup read` returns `profile`, `draft`, `required`, `optional`, `missing` and `unaddressed_optional` and `defaults`. Other skills consume the active profile, not the draft.

Required text: `identity`, `objectives`, `audience`, `voice`, `scope`. Required `platforms` is an array of nonempty destination names; `memory_enabled` and `startup_status` are booleans. Optional narrative strings: `rubrics`, `examples`, `visual`, `platform_preferences`, `locale`, `cadence`, `tools`. They may contain project-relative asset references. Optional thresholds `memory_support_threshold` and `memory_contrary_threshold` accept positive integers; the CLI returns defaults of 5 and 10 and applies them on approval when memory is enabled and no threshold was chosen. Null declines an optional choice (for a threshold, use the default); leave deferred fields unset. An unset optional field may be revisited when setup resumes. No actual memory engine, media tool or publisher is implemented in this increment. An available n8n instance can be recorded in `tools` without enabling publishing or storing credentials.

```sh
printf '%s\n' '{"identity":"Independent developer","voice":"Direct"}' | content-flow setup save
content-flow setup read
# Only after a complete candidate has been reviewed and approved by the user:
content-flow setup approve
```

Settings remain in `.content/settings.json`: `profile` holds active settings, `setup_draft` holds unapproved changes. The CLI checks shape and completeness, not editorial truth or whether a human actually approved the command. Avoid credentials; use environment variables or existing tool connections instead. Do not run simultaneous writers. Narrative configuration strings stay in JSON for atomic promotion; longer examples and assets may be referenced as separate files.
