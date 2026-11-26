# Test Content Setup locally

Two separate directories: the source repository (build the CLI, maintain skills) and a disposable project (install skills and run your agent). Commands below assume a POSIX-compatible shell and Node.js >=22.20.0; substitute your actual repository path. No npm publication is needed.

## 1. Update sources and build

If you have not cloned the repository yet:

```sh
mkdir -p "$HOME/Projects"
git clone -b content-flow-mvp https://github.com/AndreaGelmini/ai-skills.git "$HOME/Projects/ai-skills"
```

For an existing checkout:

```sh
cd "$HOME/Projects/ai-skills"
git switch content-flow-mvp
git pull --ff-only
```

Build, run automated tests, and make the local CLI available in your Node environment:

```sh
cd "$HOME/Projects/ai-skills/packages/content-flow-cli"
npm install
npm test
npm link
content-flow --help
```

If npm link is unavailable or fails because the global npm prefix is not writable, do not use sudo just for this test. An alternative is to install the packed local CLI in a user-owned prefix and add its bin directory to PATH, or use a temporary wrapper on PATH that runs the verified local dist/cli.js with Node. Never install an unverified registry package by name.

## 2. Create a separate test workspace and install the skill

```sh
mkdir -p "$HOME/Projects/content-flow-test"
cd "$HOME/Projects/content-flow-test"
npx skills@latest add "$HOME/Projects/ai-skills" --skill content-setup
npx skills@latest add "$HOME/Projects/ai-skills" --skill interview-loop
content-flow --help
```

Select your agent and project installation (not global). The local source includes the new references; reinstall from the local checkout after pulling skill updates. Keep the agent's working directory in content-flow-test. Launch it from this terminal so it inherits the CLI's PATH.

- Claude Code: run `claude`, then invoke `/content-setup`.
- Codex: run `codex`, then invoke `$content-setup`.
- OpenCode: run `opencode`, then explicitly request `content-setup` by name. Verify that the agent loads it and then `interview-loop`; the manual-only flags are host-specific and are not an OpenCode permission guarantee.

Other agents may use different invocation syntax and may not enforce manual-only metadata. Do not manually run init before the first agent test: verify the skill does it.

## 3. Observe

From another terminal in the test directory, run:

```sh
cd "$HOME/Projects/content-flow-test"
content-flow setup read
```

Before initialization this reports a workspace error; after initialization it shows pending configuration and missing fields. During the interview, confirmed answers should appear in draft, not profile. Close the agent mid-interview and invoke setup again: it should resume, without re-asking confirmed answers. Approve the complete candidate; profile should now hold it and draft should be null. Invoke setup again to change only voice: the old approved profile should remain active until approval.

Try an unrelated writing request in a new session: setup should not activate implicitly in agents honoring the invocation controls. Check that the interview captures semantic depth from the three references without asking every subpoint mechanically. It should use the conversation language, ask one open question at a time, extract information across domains, and propose positioning instead of requiring a polished positioning sentence. Test with and without interview-loop installed: when unavailable, the agent should give one notice and continue without installing anything. For an undecided memory setting, thresholds appear in blocked_optional; when disabled they appear in inapplicable_optional; when enabled unanswered thresholds appear in unaddressed_optional.

## 4. Refresh and validate

After a new commit: pull the development branch, rerun npm install/test in the CLI package, and reinstall both skills from the local checkout into the test workspace. No need to create a fresh project unless testing first-run behavior again. The existing npm link normally points at the checkout; rerun it if needed. Restart the agent.

Validate metadata and Markdown links from the repository root:

```sh
cd "$HOME/Projects/ai-skills"
node skills/create-skill/scripts/validate-skill-metadata.mjs skills/content-setup
node skills/create-skill/scripts/validate-skill-links.mjs skills/content-setup
node skills/create-skill/scripts/validate-skill-metadata.mjs skills/interview-loop
node skills/create-skill/scripts/validate-skill-links.mjs skills/interview-loop
```

These tests cover configuration persistence and skill behavior. No n8n instance, paid rendering or publishing is needed. Keep real personal profile data out of the development repository.
