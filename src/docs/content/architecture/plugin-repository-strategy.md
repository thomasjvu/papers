# Plugin Repository Strategy

Phantasy has two different plugin concerns, and they should not be conflated:

- `Privileged built-in capabilities` such as `filesystem`, `shell`, `edit`, `glob`, `search`, `doctor`, `voice`, `image`, `memory`, and `weather`
- `Installable first-party plugins` such as `x`, `browseruse`, `monitoring`, `adventure`, `chronicle`, `discord`, `telegram`, `twitch`, `instagram`, `github`, `gitlab`, and `wallet`

The first group stays in the main monorepo on purpose. The second group should move toward standalone package repos.

The same extraction model now applies to first-party themes, skills, and workflows:

- `theme-*` repos for installable site presentation surfaces
- `skill-*` repos only for Phantasy-owned reusable operational or domain skills
- `workflow-*` repos for automation recipes and scheduleable operating flows
- curated upstream skills and MCP servers stay metadata-owned in the flagship repo and Hub catalog until Phantasy is actually the source of truth

## Policy

The source-of-truth policy is:

- The main Phantasy product stays in `@phantasy/agent`
- Privileged built-in capabilities stay in the main monorepo
- Installable first-party plugins should be maintained as their own npm packages and GitHub repos
- The public Hub should stay in its own `phantasy-bot/hub` repo and Cloudflare Worker deployment
- The main monorepo should only keep:
  - plugin contracts
  - loader/runtime integration
  - tests for package-loading behavior
- temporary wrapper exports while a plugin is still being extracted
- The core admin shell should not keep bespoke plugin tabs or plugin-detail panels once an installable plugin path exists; plugin UI should be generic, plugin-owned, or absent until the standalone repo provides it

That keeps the flagship product coherent while reducing product-surface sprawl in the main repo.

## Repo Topology

The clean topology is:

- `@phantasy/agent`: trusted kernel, product surfaces, runtime loader, temporary wrapper surfaces, and the machine-readable first-party plugin catalog while extraction is still in progress
- `phantasy-bot/hub`: public discovery site and public registry JSON, deployed independently from Cloudflare Workers Static Assets
- `phantasy-bot/plugin-*`: standalone source repos for installable plugins
- `phantasy-bot/theme-*`: standalone source repos for installable themes
- `phantasy-bot/skill-*`: standalone source repos only for Phantasy-owned installable skills
- `phantasy-bot/workflow-*`: standalone source repos for installable workflows
- curated third-party skills and MCP servers stay in the Hub as curated install metadata that points at upstream repos/packages
- upstream MCP servers stay external packages; the flagship repo owns the preset catalog and approval/install story, not cloned mirror repos

The Hub should not become the authoritative runtime registry. It is a public catalog and install launcher. The runtime still decides what it can load, and the standalone plugin repos still own plugin source.

## Install Paths

The public install policy should stay simple:

- Unified install/remove now exists at `phantasy extensions install <kind> <name>` and `phantasy extensions uninstall <kind> <name>`
- Published first-party packages install with `phantasy plugins install @phantasy/plugin-*`
- Standalone repos that are not published yet install directly from Git with `phantasy plugins install git+https://github.com/phantasy-bot/plugin-*.git`
- Standalone themes install with `phantasy hub install theme <name>` or by installing `@phantasy/theme-*` packages
- Standalone first-party skills install with `phantasy hub install skill <name>`
- Curated third-party skills install with the same command family, but their install metadata points at the upstream repo/package instead of a `@phantasy/skill-*` repo
- Standalone workflows install with `phantasy hub install workflow <name>` or by cloning into `workflows/`
- Curated MCP presets install with `phantasy extensions install mcp <name>` and materialize `mcpServers` config through the runtime helpers without mirroring upstream server repos into `@phantasy/*`
- Private/internal plugins do not appear in the public Hub registry

That gives the Hub one practical story today instead of waiting for every standalone repo to be on npm before users can consume it.

## Phases

First-party installable plugins can sit in one of four phases:

1. `scaffold-only`
   The standalone repo exists, but it is only a thin starter scaffold and is not the real implementation path yet.
2. `wrapper-package`
   The standalone repo mirrors a real installable wrapper package surface generated from the monorepo, but it may still be Git-install-only until it is published to npm.
3. `published-wrapper`
   The plugin is a real installable npm package, but the package wraps stable `@phantasy/agent` subpath exports. This is package-first, not fully source-extracted.
4. `source-extracted`
   The standalone repo contains the real source, build, tests, and release flow for the plugin. The main monorepo only keeps contracts and integration points.

`wrapper-package` and `published-wrapper` are useful intermediate states. They give users a real package shape and a stable install path before the plugin is fully disentangled from monorepo internals.

## Current State

As of March 16, 2026:

- `@phantasy/plugin-x`: `source-extracted`
- `@phantasy/plugin-browseruse`: `source-extracted`
- `@phantasy/plugin-monitoring`: `source-extracted`
- `@phantasy/plugin-acp`: `source-extracted`
- `@phantasy/plugin-adventure`: `source-extracted`
- `@phantasy/plugin-chronicle`: `source-extracted`
- `@phantasy/plugin-fanvue`: `source-extracted`
- `@phantasy/plugin-kalshi`: `source-extracted`
- `@phantasy/plugin-polymarket`: `source-extracted`
- `@phantasy/plugin-romance-affection`: `source-extracted`
- `@phantasy/plugin-versus`: `source-extracted`
- `@phantasy/plugin-wallet`: `source-extracted`
- `@phantasy/plugin-web-search`: `source-extracted`
- `@phantasy/plugin-discord`: `source-extracted`
- `@phantasy/plugin-twitch`: `source-extracted`
- `@phantasy/plugin-telegram`: `source-extracted`
- `@phantasy/plugin-instagram`: `source-extracted`
- `@phantasy/plugin-github`: `source-extracted`
- `@phantasy/plugin-gitlab`: `source-extracted`
- `@phantasy/plugin-financial`: `source-extracted`
- `@phantasy/plugin-erc8004`: `source-extracted`

First-party themes now follow the same modular install model:

- `@phantasy/theme-blog`: `source-extracted`
- `@phantasy/theme-creator`: `source-extracted`
- `@phantasy/theme-developer`: `source-extracted`
- `@phantasy/theme-docs`: `source-extracted`
- `@phantasy/theme-linkinbio`: `source-extracted`
- `@phantasy/theme-minimal`: `source-extracted`
- `@phantasy/theme-newsletter`: `source-extracted`
- `@phantasy/theme-podcast`: `source-extracted`
- `@phantasy/theme-portfolio`: `source-extracted`
- `@phantasy/theme-resume`: `source-extracted`
- `@phantasy/theme-services`: `source-extracted`
- `@phantasy/theme-shop`: `source-extracted`

First-party skills and workflows now follow the same ownership model:

- `@phantasy/skill-docker`: `source-extracted`
- `@phantasy/skill-ffmpeg`: `source-extracted`
- `@phantasy/skill-github`: `source-extracted`
- `@phantasy/skill-phantasy-extension-authoring`: `source-extracted`
- `@phantasy/workflow-approval-loop`: `source-extracted`
- `@phantasy/workflow-content-pipeline`: `source-extracted`
- `@phantasy/workflow-daily-operator-brief`: `source-extracted`
- `@phantasy/workflow-site-launch-readiness`: `source-extracted`

Curated upstream skills and MCP presets now stay metadata-only unless Phantasy is the actual source of truth:

- `cloudflare`, `gws`, `gws-*`, `market`, `vercel-react-best-practices`, and `frontend-design` stay metadata-only curated skill entries with Hub install metadata that points to upstream repos
- `filesystem`, `github`, `brave-search`, and `puppeteer` stay curated MCP presets that point to upstream MCP server packages

Important nuance:

- `x`, `browseruse`, and `monitoring` are real npm packages and now sync real source payloads into standalone repos, but the core still carries some host-side integration seams and legacy runtime/services that have not been deleted yet
- `adventure`, `chronicle`, `romance-affection`, `versus`, and `web-search` now export true source payloads into standalone repos, but they still need dependency-seam cleanup before those repos become fully independent
- richer extracted plugins should prefer the stable `@phantasy/agent/plugin-runtime` and `@phantasy/agent/plugin-admin-ui` seams, but some exported payloads still carry temporary host-private compatibility shims while extraction cleanup continues
- themes, first-party skills, and workflows now export standalone `package.json` manifests as part of the repo payload instead of only loose content files
- curated upstream skills and MCP presets no longer pretend to be first-party standalone repos; they stay curated install metadata until Phantasy genuinely owns the implementation
- source-extracted standalone repo payloads are now regression-tested so exported code cannot keep `@/`, `@admin/`, `@services/`, `@config/`, or `@plugins/` host-private import aliases
- presets now materialize installable plugin, theme, skill, workflow, and MCP bundles into config so different starter shapes can ship different selected extension sets without bloating the default runtime
- the public Hub now reflects plugins, themes, skills, workflows, and curated MCP presets as one extension surface instead of a plugin-only registry

## What Shrinks The Monorepo

Publishing wrapper packages does not materially shrink the monorepo on its own.

The monorepo gets smaller only when:

- plugin source moves out of `src/plugins/*`
- plugin admin UI source moves out of `src/plugins/*/admin-ui`
- plugin-specific service/runtime code stops depending on deep `@/` internals
- the main repo no longer needs plugin-specific bespoke tabs or route logic

So the correct sequence is:

1. package-first install path
2. wrapper-package repos
3. dependency seam cleanup
4. source extraction
5. remove source from the main monorepo

Skipping directly to step 5 would create fragile repos that still depend on private internals.

## Operational Rules

- The machine-readable catalog for first-party plugin repos lives in `scripts/first-party-plugin-catalog.mjs`
- The machine-readable catalog for first-party extensions now also lives in `scripts/first-party-extension-catalog.mjs`
- Export payloads for standalone plugin repos are produced by `scripts/export-first-party-plugin-repos.mjs`
- Repo sync branches are created by `scripts/sync-first-party-plugin-repos.mjs`
- Export payloads for standalone theme, first-party skill, and workflow repos are produced by `scripts/export-first-party-extension-repos.mjs`
- Repo sync branches for those extension repos are created by `scripts/sync-first-party-extension-repos.mjs`
- The public plugin registry for Phantasy Hub is exported by `scripts/export-hub-registry.mjs`
- Hub sync branches are created by `scripts/sync-hub-repo.mjs`
- Generated package surfaces still come from `scripts/build-package-surfaces.mjs`
- Export seam regression coverage lives in `src/first-party-plugin-repos.test.ts` and `src/first-party-extension-repos.test.ts`
- Public Hub JSON only contains public extensions; internal/private registry payloads must stay outside the deployed static asset tree

## Decision Rule

When adding a new first-party plugin, decide one of these explicitly:

- `bundled capability-scoped`
- `installable wrapper package`
- `fully source-extracted standalone plugin`

Do not create more “half-external” plugins where the repo, npm package, and actual implementation all disagree about the source of truth.
