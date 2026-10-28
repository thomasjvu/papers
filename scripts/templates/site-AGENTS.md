# Agent guide

This is a documentation site built with [Papers](https://github.com/thomasjvu/papers).

- Content lives in `src/docs/content/`, site config in `shared/`, the theme in
  `themes/`. Generated files (`public/docs-content/`, `public/llms*.txt`,
  `dist/`) are rebuilt by `npm run build`; don't edit them by hand.
- Framework files come from Papers. Update them with
  `npx @thomasjvu/papers upgrade` (or `node scripts/papers-upgrade.mjs`), not by
  copying files. `papers.lock.json` records the Papers release in use.
- Before you finish: `npm test`, `npm run lint`, `npm run build` and
  `npm run release:check`.

## Docs as code

- Docs change in the same PR as the code they describe. Say in the PR what
  docs changed, or why none needed to.
- Generate reference docs from source where possible (OpenAPI specs, CLI
  `--help`, config schemas) instead of copying values by hand.
- The docs build (`npm run build`) and the docs and link checks
  (`npm run release:check`) run in CI. A docs failure is a test failure.
- Write docs plainly: short sentences, simple words, a working example.
- Full rules: the `docs-as-code` skill (`~/.agents/skills/docs-as-code/SKILL.md`).
