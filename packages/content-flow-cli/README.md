# Content Flow CLI — development 0.4.0

Node.js >=22.20. TypeScript, no runtime dependencies. Private package; no registry release. Schema 2 replaces the monolithic schema 1 settings. Use a new workspace; old settings are rejected, never migrated or overwritten.

```sh
npm install
npm test
npm link
content-flow --version
content-flow init --workspace /path/to/existing/project
```

`check` is a read-only structural preflight; `init` creates missing managed paths, never overwrites. Exit codes: 0 OK, 1 incomplete workspace, 2 error. Commands default to current directory. Settings contain technical choices and approved manifest pointer; editorial prose lives in independent Markdown revisions. `setup read` distinguishes active settings, candidate, missing fields, optional states and unconfirmed documents. See the [skill CLI contract](../../skills/content-setup/references/cli.md) for exact JSON patch examples.

`setup save` receives JSON on stdin; `setup approve` promotes candidate only after caller obtains explicit user approval and required coverage/provenance checks pass. `setup discard` abandons candidate without changing approved data. Manual draft edits invalidate confirmation. `knowledge save` takes a single document proposal on stdin; `knowledge archive ID` stages a proposed archive; `knowledge approve` shares the setup approval gate. Use `setup save` with confirm IDs after user acceptance. Use stable IDs for updates, not titles. The CLI validates declared provenance, not actual consent.

```sh
content-flow knowledge list --domain strategy
content-flow knowledge search --query tutorial --type rubric
content-flow knowledge read voice
content-flow knowledge read voice --version-number 1
content-flow knowledge reindex
content-flow asset folder
content-flow asset list
content-flow asset import /path/to/avatar.png
```

List/search use case-insensitive literal matching and return metadata only, bounded by `--limit` (default 50, max 500); archived documents excluded unless explicitly filtered. Read returns selected bodies or historical versions. Index is regenerated after approval or by reindex; list/search independently validate selected revisions and do not trust a stale index. Imported assets are unique local copies; only relative managed paths are accepted in document metadata. The CLI checks presence, not visual meaning or asset-byte integrity after manual edits. No memory learning engine, external integrations, publishing, background jobs or registry package in this increment.

Storage limits: JSON object frontmatter (YAML 1.2 subset), one writer with a filesystem lock, no automatic stale-lock removal, no arbitrary YAML, no purge or migration. Do not edit approved files, manifests or settings directly; manual draft body edits can be reviewed/confirmed. Orphaned files can remain after an interrupted write; only committed manifest ancestry is approved history. Use a local filesystem supporting hard links and atomic rename. See [Knowledge Store](../../docs/content-flow/KNOWLEDGE-STORE.md).
