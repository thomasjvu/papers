# papers

`papers` is a Markdown-first, static/CDN-first documentation framework built
with React, Vite, and TypeScript. It emits clean route HTML, Pagefind search,
themes, Scalar/OpenAPI pages, SEO metadata, and structured artifacts for LLM
and agent consumers.

## Prerequisites

- Node.js 24 or newer
- npm 10 or newer
- Git for repository development

## Create a documentation site

The public starter package is released from the same versioned tag as the
framework:

```bash
npm create papers@latest my-docs
cd my-docs
npm run dev
```

Open `http://localhost:3333/docs/getting-started/introduction`.

The starter records an immutable framework commit in its package manifest and
does not follow a mutable default branch. Use `--no-install` for an offline
scaffold. For local development from this checkout:

```bash
PAPERS_TEMPLATE_ROOT=local node packages/create-papers/index.mjs my-docs --no-install
```

The starter requires Node 24 or newer. Its package-level documentation lives
in [packages/create-papers/README.md](packages/create-papers/README.md).

## Keep a site up to date

A Papers site is a copy of the framework plus your own content, config and
theme. `papers.lock.json` in the site records which Papers release its
framework files match. To move to a newer release:

```bash
node scripts/papers-upgrade.mjs            # latest release
node scripts/papers-upgrade.mjs --to v0.2.0
npm install                                # if package.json changed
```

The upgrader works like `git merge` for the framework:

- it applies only what changed in Papers between your release and the new one;
- your edits to framework files are kept, and if you and Papers changed the
  same lines it leaves standard conflict markers for you to resolve;
- your content (`src/docs/content/`), generated files, lockfiles, CI and the
  other paths listed in [papers.upgrade.json](papers.upgrade.json) are never
  touched, and files you deleted stay deleted;
- add your own never-upgrade paths to `exclude` in `papers.lock.json`;
- breaking changes ship a codemod in `scripts/migrations/<version>.mjs`, run
  automatically when an upgrade crosses that version.

It refuses to run with uncommitted changes, so every upgrade is one reviewable
diff. Read [CHANGELOG.md](CHANGELOG.md) for what changed.

**Automatic upgrade pull requests.** Run
`node scripts/papers-upgrade.mjs --install-workflow` once. It adds a weekly CI
job (GitHub or Forgejo) that opens a pull request when a new Papers release is
tagged. Clean upgrades are set to merge once the site's checks pass; upgrades
with conflicts open as drafts. The job needs a `PAPERS_UPGRADE_TOKEN` secret
that can push branches and open pull requests (the built-in GitHub token
cannot start CI on the pull requests it opens).

**Sites made before the upgrader existed** adopt it once:

```bash
node scripts/papers-upgrade.mjs --detect-base     # closest Papers commit
node scripts/papers-upgrade.mjs --init <commit>   # writes papers.lock.json
node scripts/papers-upgrade.mjs                   # then upgrade
```

The upgrader itself is a framework file, so copy `scripts/papers-upgrade.mjs`,
`scripts/lib/papersUpgrade.mjs` and `scripts/migrations/` into the site for
that first run.

## Develop the framework

```bash
git clone https://github.com/thomasjvu/papers.git
cd papers
npm ci
npm run dev
```

The repository development and release contracts are documented in
[CONTRIBUTING.md](CONTRIBUTING.md), [AGENTS.md](AGENTS.md), and
[RELEASING.md](RELEASING.md). The theme-specific supplement is
[CONTRIBUTING_THEMES.md](CONTRIBUTING_THEMES.md).

Run the focused starter checks with:

```bash
npm test
npm run package:check
npm run create:smoke
npm run type-check
npm run lint
npm run format:check
npm run release:check
```

## Customize a site

| Path                             | Purpose                                                   |
| -------------------------------- | --------------------------------------------------------- |
| `shared/documentation-config.js` | Sidebar, homepage, collections, and OpenAPI configuration |
| `src/docs/content/`              | Markdown and MDX pages                                    |
| `.env.local`                     | Site name, URL, GitHub metadata, and build identity       |
| `src/globals.css`                | Theme tokens and application styles                       |
| `themes/`                        | Registered theme packages and assets                      |

Generated artifacts include `public/docs-content/`, `public/docs-index.json`,
`public/llms*.txt`, SEO files, route HTML, Pagefind data, and resolved theme
files. Edit their source inputs and regenerate them with the documented
commands; do not hand-edit generated output. See [AGENTS.md](AGENTS.md) for
ownership boundaries.

## SEO and agent artifacts

Production builds emit canonical route HTML, JSON-LD, `robots.txt`,
`sitemap.xml`, social metadata, and `/agents.json`. Agent-facing artifacts
include `/llms.txt`, `/llms-full.txt`, `/skill.md`,
`/docs-collection.json`, `/docs-references.json`, and
`/openapi-artifacts.json`. Set `VITE_SITE_URL` to the owned HTTPS host during
production builds so canonical URLs and absolute agent links are correct.

## Deployment

The supported deployment paths are static Cloudflare Pages and the compatible
Vercel configuration. Configure the production site URL, run the full release
gate, and prove the deployed build with `npm run postdeploy:smoke`. A preview
or provider-owned default hostname is not a production promise; use a host you
control and keep it in `PAPERS_DEPLOY_HOST`.

## Known limitations

- The framework is static-first and does not provide SSR streaming.
- Versioning and i18n have route/content scaffolding but are disabled by
  default and need an instance fixture before being treated as a complete
  product contract.
- OpenAPI ships generated operation and model reference pages alongside the
  lazy Scalar viewer. Richer playground behavior and broader schema/code-sample
  coverage remain limited.
- A local checkout does not prove npm publication or production deployment;
  release claims require the release checks and a successful
  `npm run postdeploy:smoke` against an owned HTTPS host.
- Custom content collections must follow the documented native schema while
  the bounded adapter seam continues to mature.

## Documentation

- [FRAMEWORK.md](FRAMEWORK.md) — capabilities, architecture, and roadmap
- [docs/decisions/001-content-engine.md](docs/decisions/001-content-engine.md) — content-engine decision record
- [RELEASING.md](RELEASING.md) — framework and starter release procedure

## License

MIT. See [LICENSE](LICENSE).
