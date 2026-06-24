# Agent Skill

Host an agent skill file at `/skill.md` so coding agents can load integration instructions without crawling the full docs UI.

## Generated vs hosted

- **Docs page** — this Markdown page explains the feature.
- **Hosted file** — `/skill.md` at the site root (copy from your product repo or generate in CI).

## Setup

1. Write a skill file with YAML frontmatter (`name`, `description`) and integration steps.
2. Place it in `public/skill.md` or generate it during build.
3. Link from your docs nav or command palette.
4. Optional install page at `/docs/skill` with `HostedFilePreview` for copy/download.

## Install paths (examples)

| Agent | Typical path |
| ----- | ------------ |
| Cursor / Claude | `.cursor/skills/<name>/SKILL.md` |
| Codex | `~/.codex/skills/<name>/SKILL.md` |

## When to regenerate

Regenerate `public/skill.md` when API routes, auth flows, or agent tool names change.

For AI corpus exports, see [LLMs.txt](/docs/llms).