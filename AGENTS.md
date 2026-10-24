# Maintainer and agent contract

## 1. Project identity and constraints

`papers` is a React/Vite TypeScript documentation framework. It is
Markdown-first, static/CDN-first, and emits clean route HTML, themes, Pagefind
search data, LLM exports, and Scalar/OpenAPI pages. Preserve that contract;
read [FRAMEWORK.md](FRAMEWORK.md) for architecture and
[docs/decisions/001-content-engine.md](docs/decisions/001-content-engine.md)
for content-engine direction.

## 2. Source ownership

- Edit source docs in `src/docs/content/`, navigation/config in `shared/`, and
  components in `src/`.
- `public/docs-content/`, `public/docs-index.json`, `public/llms*.txt`, SEO
  files, icons, and theme-resolved files are generated or resolved artifacts.
- `dist/` is build output. Regenerate with `npm run generate:docs`,
  `npm run generate:llms`, `npm run generate:seo`, `npm run resolve:theme`, or
  `npm run build` as appropriate; do not hand-edit generated output.

## 3. Verification ladder

`npm ci` installs. The read-only baseline is:

```bash
npm test
npm run lint
npm run format:check
npm run type-check
npm run docs:check
npm run check:docs-tree
npm run check:security-policy
npm run check:assets
npm run check:runtime-audit
npm run build
npm run release:check
npm run release:preview-check
npx playwright test
npm run lighthouse:check
```

`npm run format` writes formatting. `npm run dev`, generators, theme
resolution, `npm run build`, and browser/Lighthouse setup can write local
artifacts or caches; inspect `git status` afterward.

### Testing policy

- Never write unit tests after you write code.
- Highly prefer E2E tests as the sole testing mechanism. Use them to verify
  complex features work. At the end of E2E tests, produce a verifiable and
  repeatable artifact.
- If you must test a system in isolation, first write down all the ways it
  could fail, then write the code.

Keep an isolated test only when it catches a concrete failure the E2E suite
misses, such as malicious input, invalid author configuration, or build-time
invariants. Do not add tests that merely restate implementation details or
duplicate a covered browser journey.

## 4. Change boundaries

Preserve published route paths, canonical URLs, artifact names, and direct
reload behavior. Treat Markdown/MDX, Mermaid output, OpenAPI URLs, and remote
assets as untrusted: use the existing sanitizers and validators. Keep CSP and
headers least-privilege; a new remote origin requires an explicit config and
header-policy review.

## 5. Deployment rules

Pull requests use credential-free validation. Only a trusted `main` workflow
may use Cloudflare secrets. The project name comes from `wrangler.toml` and
the owned host comes from `PAPERS_DEPLOY_HOST`; verify both with
`npm run check:deployment`. Never describe a public host as this app until
`npm run postdeploy:smoke` proves its build manifest and route behavior.

## 6. Stop and report rules

Stop before deployment when credentials, the owned host, or source/generated
parity is missing. Stop on failed release/security/browser gates or when a
request would broaden the hosting, dependency, or content scope. Report the
exact failure and the smallest external input needed; do not guess secrets or
silently claim a live result.

## 7. Handoff expectations

End a change with: changed source files, generated artifacts intentionally
updated, commands and outcomes, known blockers, and any follow-up plan. Keep
run IDs, personal paths, credentials, and temporary host assumptions out of
repository documentation. Detailed release procedure lives in
[RELEASING.md](RELEASING.md).
