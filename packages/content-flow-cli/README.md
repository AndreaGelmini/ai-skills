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

To try the local package: `npm pack`, then `npm exec --package ./andreagelmini-content-flow-0.1.0.tgz -- content-flow check --workspace /path/to/project`. Do not use a registry package of the same name before a verified release.
