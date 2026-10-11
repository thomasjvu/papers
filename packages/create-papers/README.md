# create-papers

Create a static documentation site powered by the papers framework.

## Usage

```bash
npm create papers@latest my-docs
cd my-docs
npm run dev
```

The package supports Node.js 24 or newer. A published package records the
framework version, artifact schema, Node range, and full template commit in
`template-manifest.json`. The default path fetches that immutable commit
archive; it does not follow a mutable branch or execute an unpinned installer.

For offline development from a papers checkout:

```bash
PAPERS_TEMPLATE_ROOT=local node packages/create-papers/index.mjs my-docs --no-install
```

`--repo <owner/name> --ref <full-commit-sha>` is an advanced override for a
different public GitHub repository. `--no-install` creates the files without
running npm.

The generated project is Markdown-first and static/CDN-first. Configure
`shared/documentation-config.js`, author pages in `src/docs/content/`, and
review [FRAMEWORK.md](https://github.com/thomasjvu/papers/blob/main/FRAMEWORK.md)
for the supported route, SEO, agent-artifact, search, theme, and OpenAPI
contracts.

Report security issues privately using the process in the repository's
[SECURITY.md](https://github.com/thomasjvu/papers/blob/main/SECURITY.md).
