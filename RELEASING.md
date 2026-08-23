# Releasing

This repo is ready to ship from `main` once the validation commands pass.

## Release Checklist

1. Confirm production metadata is set.

```bash
VITE_SITE_NAME="Your Docs"
VITE_SITE_URL="https://docs.example.com"
VITE_GITHUB_URL="https://github.com/your-org/your-repo"
VITE_GITHUB_BRANCH="main"
```

2. Run the full local gate.

```bash
npm ci
npm test
npm run lint
npm run type-check
npm run build
npm run release:check
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

4. Push to `main`.

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

5. Create the GitHub release.

Recommended tag: `v0.1.0`

Use [CHANGELOG.md](CHANGELOG.md) as the release body starting point.

## Post-Deploy Checks

After the live deploy finishes, verify:

- `/` loads
- a deep docs route loads directly
- `/llms` loads directly
- `/robots.txt` and `/sitemap.xml` return the expected content
- Pagefind assets are present under `/pagefind/`
- GitHub footer links point at the correct repository
- social previews use the expected title and description
