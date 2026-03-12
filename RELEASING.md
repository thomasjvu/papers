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
- `dist/docs/**/index.html`
- `dist/llms/index.html`
- `dist/pagefind/`
- `dist/robots.txt`
- `dist/sitemap.xml`

4. Push to `main`.

The GitHub workflows now validate the build, run the release smoke checks, and deploy `dist/` to Cloudflare Pages.

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