# Plan 003: Make the content pipeline deterministic and validated

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan in
> `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat c0f4e52..HEAD -- package.json scripts src/docs shared public test`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: L (multi-day; this is the main framework/content-quality plan)
- **Risk**: MED — changing artifact format or validation can expose previously
  hidden content failures and may require deliberate generated-file updates.
- **Depends on**: `plans/001-restore-verification-baseline.md`,
  `plans/002-unify-route-and-html-contract.md`
- **Category**: correctness | tech-debt | docs | tests | migration
- **Planned at**: commit `c0f4e52`, 2026-08-23

## Why this matters

The repository has two content-generation implementations with different
semantics, a validator that is not wired into the release command, and a
generator that turns missing/empty files into user-visible placeholder pages.
At this commit `node scripts/check-docs.mjs` already reports stale generated
content, and a clean standalone checkout will later fail when the checker tries
to compare `public/skill.md` to an external monorepo path that is not part of
this repository. A deterministic, schema-checked content contract is the
largest missing piece compared with Fumadocs' type-safe collections, loader
page tree, frontmatter schema, TOC, structured data, and extracted references.

## Current state

- `package.json:31` makes `scripts/generate-docs.mjs` the build generator.
- `scripts/generate-docs.mjs:42-60` returns synthetic `File Not Found`,
  `Empty File`, or `Error Loading Content` Markdown instead of failing when a
  path in `documentationTree` cannot be read.
- `scripts/generate-docs.mjs:63-100` creates artifacts with
  `createDocumentArtifact` only, so MDX remains `contentFormat: 'markdown'`.
- `scripts/lib/docsGeneration.mjs:48-87` contains a second variant builder
  that calls `enrichDocumentArtifact` and converts `.mdx` to sanitized HTML.
  This implementation is used by `scripts/check-docs.mjs`, not by the build.
- `scripts/lib/docsArtifacts.mjs:8-45` parses frontmatter with a line-by-line
  `key: value` loop. It silently ignores malformed lines and treats arrays or
  nested values as strings; `scripts/lib/docsArtifacts.mjs:68-85` derives title
  and description without a schema error.
- `src/lib/content.ts:68-126` preserves `contentFormat`, and
  `src/components/ContentRenderer.tsx:23-29` deliberately renames it to
  `_contentFormat` and passes every document to `MarkdownRenderer` anyway.
  The runtime and the build therefore do not have a proven contract for
  precompiled MDX HTML.
- `scripts/check-docs.mjs:118-154` reconstructs artifacts with the second
  implementation and compares every public JSON file byte-for-byte. Running
  it at the planned commit reports
  `public/docs-content/user-guide/basic-usage.json is out of date`.
- `scripts/check-docs.mjs:156-160` compares `public/skill.md` to
  `resolveMonorepoRoot(rootDir)/content/skill.md`, although this standalone
  repo has `src/docs/content/skill.md` and a separately authored
  `public/skill.md`, not `content/skill.md`.
- `scripts/check-docs.mjs:214-228` refers to `npm run sync:generated`, but
  `package.json` has no such script. The optional generated-doc source is
  controlled by `PAPERS_GENERATED_DOCS_SOURCE` in
  `scripts/lib/generatedDocsSync.mjs:5-27`.
- `scripts/check-docs.mjs:234-248` checks only absolute `/docs` links,
  duplicate directory aliases, and default source metadata. It does not
  resolve every internal Markdown link, heading anchor, OpenAPI link, or
  variant path.
- `package.json:21-22` excludes `.mdx` from format checks; the repository has
  `src/docs/content/developer-guides/character-notes.mdx`.
- `shared/documentation-config.js` is manually maintained as the navigation
  tree while content files are discovered separately. Plan 001 repairs the
  safe tree check, but there is still no schema that proves tree, files,
  frontmatter, generated artifacts, and routes agree.

## Commands you will need

| Purpose    | Command                                         | Expected on success                                             |
| ---------- | ----------------------------------------------- | --------------------------------------------------------------- |
| Tests      | `npm test`                                      | all architecture/content cases pass                             |
| Types      | `npm run type-check`                            | exit 0                                                          |
| Format     | `npm run format:check`                          | exit 0, including `.mdx` after the glob is expanded             |
| Generate   | `npm run generate:docs`                         | exit 0; one implementation writes all docs artifacts            |
| Docs check | `npm run docs:check`                            | exit 0 and reports artifacts are current                        |
| LLM check  | `npm run generate:llms` then `git diff --check` | exit 0; generated exports have no malformed links               |
| Full build | `npm run build`                                 | exit 0                                                          |
| Release    | `npm run release:check`                         | exit 0, including docs validation                               |
| Scope      | `git status --short`                            | only Scope paths plus intentional generated outputs are changed |

## Scope

**In scope — the executor may modify or add only these paths:**

- `scripts/generate-docs.mjs` and `scripts/lib/docsGeneration.mjs` — one
  implementation and a CLI writer.
- `scripts/lib/docsArtifacts.mjs` — explicit frontmatter/content validation
  and artifact contract.
- `scripts/lib/contentValidation.mjs` (new) — tree/file/frontmatter/link
  checks, if separating validation keeps the generator readable.
- `scripts/check-docs.mjs`, `scripts/lib/generatedDocsSync.mjs`, and
  `scripts/sync-generated-docs.mjs` — standalone-safe artifact checks and an
  honest optional generated-source command.
- `package.json` — add `docs:check`, wire it into `release:check`, include
  `.mdx` in format globs, and add no unrelated dependency.
- `src/components/ContentRenderer.tsx`, `src/components/MarkdownRenderer.tsx`,
  and a new small HTML renderer/helper if needed — make `contentFormat` agree
  with the selected generator semantics.
- `test/architecture.test.ts` and new focused tests under `test/` — artifact,
  validation, and route/link regression tests.
- `src/docs/content/developer-guides/character-notes.mdx` — formatting-only
  change if the expanded format gate requires it.
- Deliberately regenerated outputs: `public/docs-index.json`,
  `public/docs-content/**/*.json`, `public/llms.txt`,
  `public/llms-full.txt`, and the SEO files that the existing generators own.

**Out of scope:**

- Do not replace the whole framework with Fumadocs in this plan. The goal is a
  stable internal contract that makes a later migration or selective adoption
  measurable.
- Do not add a CMS, database, SSR server, or runtime Markdown fetching.
- Do not change the visual design of the renderer except what is necessary to
  correctly render the declared `contentFormat`.
- Do not turn `public/skill.md` into a product-specific file. Decide and
  document its ownership as either an explicitly user-owned hosted asset or a
  repository-local generated asset.

## Git workflow

- Branch: `advisor/003-content-pipeline` (or the operator's established
  convention).
- Match the repository's conventional commit style.
- Do not commit, push, or open a PR unless explicitly asked.

## Steps

### Step 1: Choose and document the artifact contract

Before changing code, write down the supported document record in the module
that owns artifacts. At minimum it must define:

- `path`, `title`, `description`, `frontmatter`, `content`,
  `contentFormat`, and `sourcePath` when source exists;
- whether `.md` is stored as Markdown and `.mdx` is stored as sanitized HTML,
  or whether both are stored as source and compiled at runtime;
- how frontmatter arrays such as `tags: ['architecture', 'guide']` are parsed;
- how TOC/structured data/references are represented if added.

Prefer the existing `enrichDocumentArtifact` plus a renderer branch for
`contentFormat: 'html'` if it can preserve the existing shortcode behavior. If
the runtime cannot safely render the compiled format, keep all artifacts as
source and remove the unused enrichment path instead. Do not leave a field
that is written but ignored.

Add a short section to the content-pipeline docs explaining the selected
contract and the fact that generated JSON is a build artifact, not an
independent source of truth.

**Verify**: `npm test` → the existing `compileMdxToHtml` and artifact tests
still pass; a new regression test fails if a document's declared
`contentFormat` is ignored by the renderer.

### Step 2: Collapse generation onto one implementation

Refactor `scripts/generate-docs.mjs` into a thin CLI around the shared
generation functions. It must use the same `buildVariantDocuments` and
artifact serializer that `scripts/check-docs.mjs` invokes. Remove or rename
the duplicate implementation rather than keeping two loops that can drift.

The generator must fail nonzero on:

- a navigation path with no `.md` or `.mdx` source;
- an empty source file;
- unreadable source or a parser/MDX compilation error;
- duplicate document keys across version/locale contexts;
- a malformed frontmatter field that violates the documented schema.

Keep placeholder/error documents out of production artifacts. Error messages
must name the source path and document key without dumping unrelated file
contents.

**Verify**: `npm run generate:docs` → exit 0 on the current tree; temporarily
point a test fixture at a missing/empty file → the generator exits nonzero and
does not write a placeholder artifact; `npm run docs:check` → uses the same
serializer and exits 0 after regeneration.

### Step 3: Add a small explicit content schema and link validator

Keep the schema compatible with current content first: support `title`,
`description`, and `tags` (string array), allow no unknown fields unless the
implementation deliberately preserves them, and normalize quoted scalar
values. Validate title/description types and reject malformed frontmatter
instead of silently ignoring it. If a YAML parser is needed, use a maintained
small dependency only after checking the current lockfile and advisories; do
not add a large framework to solve this parser alone.

Build a validator over the navigation tree and source files that:

- proves every tree file has exactly one `.md` or `.mdx` source;
- proves every source intended for publication is in the tree, excluding only
  explicitly documented variant/generated directories;
- resolves internal Markdown links to known document paths and known route
  aliases, preserving query/hash suffixes;
- validates local asset links and reports the source line for failures;
- checks configured OpenAPI routes using the Plan 002 helper;
- optionally records unresolved external links without failing on network
  availability.

Reuse the existing absolute-link, alias, and source-path checks in
`scripts/check-docs.mjs`; consolidate rather than creating a second checker.

**Verify**: `npm test` → fixtures cover missing source, extra source, malformed
frontmatter, valid relative link, missing relative link, hash-only link, and
OpenAPI link; `npm run docs:check` → exit 0 on the current content; a fixture
with one broken internal link → exit 1 with `file:line` and target.

### Step 4: Make hosted skill and optional generated docs standalone-safe

Remove the implicit dependency on a parent monorepo from
`scripts/check-docs.mjs`. Treat `public/skill.md` as a repository-owned hosted
asset with an explicit validation rule, or introduce a repository-local source
path and a documented generation command. Do not compare it to
`<parent>/content/skill.md` when the current checkout does not contain that
source.

For `PAPERS_GENERATED_DOCS_SOURCE`, make the behavior explicit:

- no source configured → skip the optional sync comparison;
- source configured → require it to exist and compare it to the configured
  destination;
- expose the real command name (`sync:generated` or a corrected name) in
  `package.json` and error messages.

**Verify**: run `npm run docs:check` from the repository root with no parent
monorepo content → exit 0; run it with a nonexistent
`PAPERS_GENERATED_DOCS_SOURCE` → exit 1 with a precise source error; run
`npm run sync:generated -- --help` → the command name and source option are
truthful.

### Step 5: Wire the checker and regenerate the repository artifacts

Add `docs:check` to `package.json` and make `release:check` run it after
generation/build prerequisites are satisfied. Keep checks read-only; the build
may generate artifacts, but the checker must only compare. Expand the format
glob to include `.mdx`, format the one MDX source if needed, regenerate the
tracked JSON/LLM/SEO outputs from the canonical source, and inspect the diff
for expected content only.

Update the content-pipeline and installation docs so they name the actual
commands. Remove references to a nonexistent `sync:generated` unless the
command exists after Step 4.

**Verify**: `npm run generate:docs && npm run generate:llms && npm run generate:seo -- --mode production && npm run docs:check && npm run format:check` → every command exits 0; `npm run build && npm run release:check` → exit 0; a second `npm run generate:docs` produces no additional tracked diff.

### Step 6: Add the framework-level metadata needed for the Fumadocs gap

Once correctness is green, extend the document artifact with the highest-value
derived metadata that the current architecture can own without a framework
migration: a heading TOC, structured page metadata, and extracted internal
references. Keep it typed and version/locale-aware. Feed the same metadata to
search/SEO rather than reparsing Markdown in three places.

This is the compatibility layer that narrows the gap with Fumadocs' content
collections while preserving the project's static JSON and Pagefind model. Do
not promise full MDX component compilation or plugin support until the existing
renderer contract is proven.

**Verify**: `npm test` → fixture artifacts contain stable TOC/reference output;
`npm run docs:check` → byte-stable serialized artifacts; `npm run build` →
Pagefind and route HTML still generate successfully.

## Test plan

- Extend `test/architecture.test.ts` around the existing artifact cases at
  lines 69-270 and MDX cases at lines 254-320.
- Add focused tests for generator failures using temporary directories, with
  no writes to `public/` during a failure case.
- Add link-validation fixtures for Markdown/MDX relative links, aliases,
  anchors, local assets, OpenAPI routes, and missing targets.
- Add one renderer integration test for each supported `contentFormat`.
- The release-level verification is `npm run docs:check` followed by a clean
  `npm run build` and `npm run release:check`.

## Done criteria

- [ ] There is one production docs generator and one serializer; build and
      checker use the same implementation.
- [ ] Missing, empty, unreadable, malformed, or unlisted content fails the
      check/build rather than producing a placeholder page.
- [ ] `contentFormat` is either honored by the renderer or removed from the
      generated contract; it is not written-and-ignored.
- [ ] Frontmatter, internal links, local assets, OpenAPI links, and source/tree
      parity are validated with file-and-line diagnostics.
- [ ] `public/skill.md` validation works in a standalone checkout with no
      parent monorepo.
- [ ] The optional generated-doc sync command and environment variable have
      truthful names and failure behavior.
- [ ] `.mdx` is covered by the format gate.
- [ ] `npm test`, `npm run format:check`, `npm run type-check`,
      `npm run docs:check`, `npm run build`, and `npm run release:check` exit 0.
- [ ] A second generation/check pass is byte-stable.
- [ ] `plans/README.md` status row is updated to `DONE` or `BLOCKED` with a
      reason.

## STOP conditions

Stop and report instead of improvising if:

- The current content requires frontmatter keys or MDX constructs not covered
  by the proposed schema; inventory them and report the list.
- Compiled MDX HTML would bypass the existing DOMPurify/MarkdownRenderer
  security boundary or drop interactive components; do not weaken sanitization.
- The checker can pass only by copying artifacts from a parent directory or an
  unavailable monorepo; keep the standalone contract and report the missing
  source instead.
- A link target is ambiguous because version/i18n routing changes its canonical
  path; stop and add a route-model case rather than accepting every link.
- Regeneration changes unrelated product copy, themes, or binary assets; keep
  the diff and report the unexpected source.

## Maintenance notes

- New frontmatter fields require a schema, artifact test, and docs update.
- New MDX shortcodes must be represented in both the compiler and renderer
  tests; never rely on a browser-only happy path.
- If the team later adopts Fumadocs MDX, preserve the artifact/route/link
  contract as the migration boundary so static exports remain testable.
