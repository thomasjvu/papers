# Releasing

This repo can ship from `main` once the local validation commands and the
owned-host deployment proof pass. Read [AGENTS.md](AGENTS.md) for the concise
operating contract.

## Release Checklist

1. Confirm production metadata is set.

```bash
VITE_SITE_NAME="Your Docs"
VITE_SITE_URL="https://docs.example.com"
VITE_GITHUB_URL="https://github.com/your-org/your-repo"
VITE_GITHUB_BRANCH="main"
```

The trusted deploy workflow also requires `PAPERS_DEPLOY_HOST` as a repository
or environment variable. It must be the HTTPS host that owns this application;
the workflow will not infer it from a stale preview URL. `wrangler.toml` is the
authoritative Cloudflare Pages project configuration.

2. Run the full local gate.

```bash
npm ci
npm test
npm run lint
npm run type-check
npm run build
npm run release:check
npx playwright test
npm run lighthouse:check
npm audit --audit-level=high
```

3. Sanity-check the build output.

- `dist/index.html`
- `dist/docs.html`
- `dist/docs/**/*.html`
- `dist/llms.html`
- `dist/skill.html`
- `dist/pagefind/`
- `dist/robots.txt`
- `dist/sitemap.xml`
- `dist/build-manifest.json` — source revision, worktree state, artifact
  fingerprint, build mode/tool versions, site identity, and default document
  path

4. Push to `main` only after the required Cloudflare credentials and owned host
   variable are configured.

The GitHub workflows now validate the build, run the release smoke checks, and deploy `dist/` to Cloudflare Pages.

### Static route contract

The route HTML generator writes the root page to `dist/index.html` and every
other clean route to a sibling `.html` file: `/docs` is `dist/docs.html`,
`/docs/<page>` is `dist/docs/<page>.html`, `/docs/llms` is
`dist/docs/llms.html`, and `/docs/skill` is `dist/docs/skill.html`. The
OpenAPI default route is `/docs/api-reference/openapi`; configured alternate
specs append one encoded spec ID segment. Direct requests must return the
route-specific HTML snapshot, including its canonical tag, rather than only
the SPA shell. Vercel rewrites the clean `/docs` and `/docs/<page>` URLs to
those `.html` snapshots, while Cloudflare Pages serves the same files using
its static asset behavior. The root `/llms` and `/skill` snapshots are
compatibility aliases with `noindex` metadata and canonical URLs pointing to
`/docs/llms` and `/docs/skill` respectively.

5. Release the framework and starter from one versioned tag.

The root framework and `create-papers` starter intentionally share one semver
version. Update both package contracts, the starter smoke fixture, and
[CHANGELOG.md](CHANGELOG.md) together. The release tag must be exactly
`v<root-package-version>`; for example:

```bash
node -p "require('./package.json').version"
git tag v0.1.0
git push origin v0.1.0
```

The trusted `Release create-papers` workflow validates the tag, runs the full
framework gate and packed clean-consumer smoke, generates a manifest pinned to
the tag commit, publishes with npm provenance, probes the exact public version,
and records the resolved tarball URL in the GitHub release notes. Do not run a
manual `npm publish` unless package ownership, access, provenance, and release
credentials have been explicitly confirmed.

The current checkout has not proven public npm availability or ownership. A
release is complete only when the post-publish exact-version probe succeeds;
use [CHANGELOG.md](CHANGELOG.md) as the release body starting point.

## Post-Deploy Checks

After the live deploy finishes, run:

```bash
PAPERS_DEPLOY_HOST="https://docs.example.com" npm run postdeploy:smoke
```

The command must prove the published build manifest matches the deployed
revision and that the route, headers, and canonical HTML belong to this
repository. Verify at minimum:

- `/` loads
- a deep docs route loads directly
- `/llms` loads directly
- `/robots.txt` and `/sitemap.xml` return the expected content
- Pagefind assets are present under `/pagefind/`
- GitHub footer links point at the correct repository
- social previews use the expected title and description

`papers-docs.pages.dev` is not an implicit production promise; use the actual
owned value of `PAPERS_DEPLOY_HOST`. Vercel route rewrites remain supported by
`vercel.json`, but this repository does not claim a Vercel deployment until a
host-specific smoke proof exists.

## Security release contract

- `npm run check:security-policy` is the source-of-truth check for equivalent
  Cloudflare/Vercel CSP and security headers.
- `npm run check:runtime-audit` audits shipped runtime dependencies and fails
  on high or critical findings. The current production dependency tree reports
  zero findings; dev-only tooling is not shipped to the site.
- `npm run lighthouse:check` uses the maintained `lighthouse` package and the
  Chromium executable supplied by Playwright. It audits the four routes in
  `lighthouserc.cjs`, writes JSON and HTML reports only under `.lighthouseci/`,
  and preserves the existing error and warning assertions. CI uploads that
  directory only as a private seven-day GitHub artifact; it does not publish
  reports to public Lighthouse storage.
- Both `npm run check:runtime-audit` and `npm audit --audit-level=high` must
  report zero high or critical findings before release. Keep development
  tooling on maintained releases and investigate the complete dependency tree
  rather than suppressing an advisory or lowering the audit level.
- Markdown/MDX and Mermaid output must stay behind the repository sanitizers;
  OpenAPI URLs must be local root-relative assets or explicitly allowlisted
  HTTPS origins. Adding a remote font, spec, embed, or script requires a
  config and both host-policy updates.
