# Test Content Setup v2 locally

Use a new disposable workspace for schema 2; retain the old project and its session transcript. Do not delete `.content` to make the new CLI work. Commands below assume a POSIX shell and Node.js >=22.20; replace paths as appropriate.

```sh
cd ~/Projects/ai-skills
git switch content-flow-mvp
git pull --ff-only
cd packages/content-flow-cli
npm install
npm test
npm link
content-flow --version  # 0.4.0
```

If npm link fails due to an unwritable global prefix, use a user-owned prefix or a PATH wrapper for the verified local `dist/cli.js`; never install an unverified registry package. Build and install from the same checkout.

```sh
mkdir -p ~/Projects/content-flow-test-v2
cd ~/Projects/content-flow-test-v2
npx skills@latest add ~/Projects/ai-skills --skill content-setup
npx skills@latest add ~/Projects/ai-skills --skill interview-loop
opencode
```

Select OpenCode and project-local installation. Invoke `@content-setup` (or request it by name); verify both skills load. Claude Code `/content-setup` or Codex `$content-setup` are alternatives. Manual-only metadata is host-specific; verify no unsolicited activation. No manual init before the first agent test.

During the interview, use another terminal in the test project:

```sh
content-flow setup read
content-flow setup read --details
content-flow knowledge list
```

Expect one question per turn, including optional branches; summaries are proposals until confirmed. Unanswered is not declined. Check that the agent saves cross-domain information and resumes a partial candidate on restart. Memory thresholds depend on memory_enabled. With only `@content-setup` in an English environment, English is acceptable until the user's language is known.

When asked about graphics, try the asset inbox option or explicitly authorize import of your local character sheet and brief. Confirm asset paths are relative and no vision claim is made by a text-only model. Before approval, check the candidate and explicitly confirm; active knowledge stays unchanged until promotion.

```sh
content-flow knowledge list --domain profile
content-flow knowledge list --domain strategy
content-flow knowledge read voice
content-flow knowledge search --query tutorial
content-flow asset list
```

Inspect `.content/settings.json` (technical only) and `.content/knowledge/` (Markdown revisions, manifest, derived index). Update just one rubric or voice through the skill and check prior versions remain available. Try archive via skill, verify default list excludes archived entity and explicit history still works. Test missing interview-loop in a separate workspace: one notice then fallback. Verify declined vs deferred vs unknown and no automatic publishing or external transfer.

Repository validators from the source checkout:

```sh
node skills/create-skill/scripts/validate-skill-metadata.mjs skills/content-setup skills/interview-loop
node skills/create-skill/scripts/validate-skill-links.mjs skills/content-setup skills/interview-loop
```

No migration, n8n, NotebookLM or paid calls required. Do not commit personal profiles, assets or credentials to the development repository.
