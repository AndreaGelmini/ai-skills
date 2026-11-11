# Agent Skills

A personal collection of focused skills. Each skill can be installed independently in the projects where it is useful. Instructions are in English; responses follow the conversation's language.

| Skill | Purpose |
| --- | --- |
| [create-skill](skills/create-skill/SKILL.md) | Create and validate short, focused Agent Skills. Includes metadata and Markdown link validators. |
| [restate-my-goals](skills/restate-my-goals/SKILL.md) | Check understanding of the user's goals and problem before proceeding. |
| [session-status](skills/session-status/SKILL.md) | Take stock of the whole available session, including context, branches, needs, decisions, and progress. |


## Install selected skills

With Node.js 22.20 or later, run this from the project where you want the skill:

```bash
npx skills@latest add AndreaGelmini/ai-skills --skill session-status
```

Choose the target agent when prompted. To select several skills interactively:

```bash
npx skills@latest add AndreaGelmini/ai-skills
```

Installation is project-scoped by default. For example, install only the goal clarification skill for Codex:

```bash
npx skills@latest add AndreaGelmini/ai-skills --skill restate-my-goals -a codex
```

## Maintain the collection

Edit each skill in its own directory and commit changes to your repository. Run the bundled validators from this repository's root:

```bash
for skill in skills/*; do
  node skills/create-skill/scripts/validate-skill-metadata.mjs "$skill"
  node skills/create-skill/scripts/validate-skill-links.mjs "$skill"
done
```

Check and update installed skills from a consuming project:

```bash
npx skills@latest check
npx skills@latest update
```

Session Status can cover only accessible conversation history and branches. It identifies missing context and asks for material details.

## References

- [Skills CLI documentation](https://github.com/vercel-labs/skills)
