---
name: papers-docs
description: Machine-readable entry points and safe maintenance guidance for a papers documentation site.
---

# Agent Skill

Use the hosted `/skill.md` file when an agent needs to understand this
documentation site without crawling the full UI. The companion `/agents.json`
manifest lists every machine-readable artifact and its content type.

## Discover first

- Read `/agents.json` for the current artifact index.
- Read `/docs-collection.json` for typed page metadata and navigation.
- Read `/docs-references.json` for internal links and backlinks.
- Read `/openapi-artifacts.json` before opening an interactive API viewer.
- Use `/llms.txt` for a concise corpus index and `/llms-full.txt` for full text.

## Safe maintenance workflow

1. Treat Markdown/MDX in `src/docs/content/` and navigation in
   `shared/documentation-config.js` as the source of truth.
2. Preserve canonical routes, generated artifact names, and static-host
   behavior when editing content.
3. Run the relevant generators after source changes, then run `npm test`,
   `npm run docs:check`, and the release checks before promotion.
4. Do not invent API endpoints, authentication flows, or credentials that are
   not present in the published OpenAPI artifacts and documentation.

## Hosted and preview paths

- Hosted skill: `/skill.md`
- Human-readable preview: `/docs/skill`
- Concise corpus: `/llms.txt`
- Full corpus: `/llms-full.txt`

The build regenerates the hosted skill and agent manifest from this source
page. For the human-facing explanation, see [LLMs.txt](/docs/llms).
