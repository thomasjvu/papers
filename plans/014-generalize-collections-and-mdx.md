# Plan 014: Make collections and MDX extensibility real

> **Executor instructions:** Preserve the default `docs` routes and generated
> artifact aliases while generalizing the engine. Run the two-collection fixture
> and all default release checks before changing the status row. Do not add a
> second content engine or silently accept unsupported MDX components.

## Status

- **Priority:** P1
- **Status:** DONE — collection generation/runtime and MDX diagnostics are implemented and fixture-tested.
- **Effort:** L
- **Risk:** HIGH — generation, runtime paths, route HTML, SEO, and navigation
  all share the collection boundary.
- **Depends on:** plans/010-native-content-api-parity.md (DONE)
- **Category:** content | architecture | dx | parity
- **Planned at:** commit `ecaa12a`, 2026-08-25

## Re-audit finding

`FRAMEWORK.md:16-20` promises multi-collection documentation roots and says the
runtime uses generated collection output. The configuration shape exists in
`shared/content-collections.js:10-21`, but the active generator still calls
`getContentCollection('docs')` and writes one `public/docs-content` tree
(`scripts/generate-docs.mjs:39-73`). The runtime likewise fetches only
`/docs-index.json` and `/docs-content/...` (`src/lib/content.ts:63-70`,
`:123-129`). The current test suite exercises one fixture/collection and route
helpers, not a real second collection build.

The frontmatter schema is intentionally fixed to ten fields
(`shared/contentSchema.js:15-29`), and the MDX compiler registers known
shortcodes but has no explicit unknown-component diagnostic contract
(`scripts/lib/mdxCompile.mjs:105-117`). The ADR already records the remaining
gaps as arbitrary user schemas and unknown MDX-component validation
(`docs/decisions/001-content-engine.md:112-114`).

This is materially below the content-framework contract Fumadocs documents:
its MDX source supports schema-oriented collections, built-in metadata/TOC/
structured data/reference extraction, and a customizable compiler. See the
[official Fumadocs MDX documentation](https://www.fumadocs.dev/docs/mdx).

## User impact

Consumers who configure a second content tree can generate partial or missing
artifacts, while consumers who add frontmatter fields or MDX components cannot
get a typed, actionable contract. Unsupported authoring can degrade into
sanitized output instead of failing at the source line that needs correction.

## Target contract

- Every configured collection is generated, validated, routable, indexed, and
  represented in SEO/LLM/agent artifacts.
- The first collection remains backward-compatible with `docs-index.json`,
  `docs-content/`, and current clean URLs.
- Collection schemas are configurable through a small documented interface,
  produce stable JSON metadata, and report source/line diagnostics.
- MDX component names are either registered with a documented renderer or fail
  with a source location and remediation. Sanitization remains mandatory after
  compilation.

## Steps

### 1. Define collection identity and artifact paths

Add a validated collection contract covering `id`, label, route prefix, content
root, navigation tree, schema, variants, and artifact namespace. Reject duplicate
IDs, overlapping route prefixes, ambiguous top-level paths, and collection
content roots that escape the repository. Define the canonical paths for
`<id>-index.json`, `<id>-content/`, collection manifests, references, and
variant output.

Keep compatibility aliases for the default collection until a documented major
version removes them. Never infer collection identity from a route slug alone.

### 2. Generate and validate all collections

Replace the `getContentCollection('docs')` singleton path with a deterministic
loop over `contentCollections`. Each collection gets its own content root,
navigation, previous index, generated records, link graph, manifest, and
validation report. Make the output order stable by collection ID and document
path. Ensure route HTML, sitemap, canonical URLs, LLM exports, and agent
discovery consume the same collection map.

Add a duplicate/collision report that names both collection IDs and source
paths. A missing source, stale generated record, invalid frontmatter, or
unresolved internal link must fail the build rather than produce a placeholder.

### 3. Add a bounded schema adapter seam

Keep the built-in descriptor schema for zero-dependency installs, but allow a
collection to provide a schema adapter with parse/diagnostic/serialize behavior.
Define the generated metadata type and schema version independently from the
implementation library. Unknown fields should be rejected or explicitly
declared by the collection; defaults and optional fields must be deterministic.

Expose typed collection metadata to generators and runtime consumers without
making the renderer depend on a specific validation package. Add one example
collection with an extra metadata field and document the adapter boundary.

### 4. Make MDX component support explicit

Define a registry for supported components (`Callout`, `Tabs`, `Card`,
`CharacterNote`, and future components) with source names, allowed props, output
semantics, and sanitizer rules. Parse MDX JSX names before compilation and emit
an actionable error for unknown names unless a collection explicitly registers
the component. Add negative tests for unknown components, malformed props, raw
HTML/script content, and nested supported components.

Keep the current sanitized HTML artifact format and do not execute arbitrary
author code in the build or browser.

### 5. Prove the contract with a multi-collection fixture

Create a temporary fixture containing two collections with distinct route
prefixes, navigation trees, schemas, links, one locale/version variant, and one
supported/one unsupported MDX component. Assert generated indexes, manifests,
content paths, reference graphs, canonical route HTML, sitemap entries, LLM
links, runtime fetch paths, and diagnostics. Preserve every current default
fixture and browser smoke test.

## Verification

| Check                                              | Expected result                                                    |
| -------------------------------------------------- | ------------------------------------------------------------------ |
| two-collection generator fixture                   | both collection artifact namespaces are complete and deterministic |
| unknown MDX/component negative fixtures            | non-zero exit with source path and line/column                     |
| default `npm test`                                 | all current and new tests pass                                     |
| `npm run docs:check` and `npm run check:docs-tree` | pass for default and fixture collections                           |
| `npm run release:check`                            | route/SEO/agent artifacts preserve compatibility aliases           |
| `npx playwright test`                              | default user paths remain green                                    |

## Done criteria

- [x] More than one configured collection can be built and served from a clean
      fixture without hard-coded `docs` paths.
- [x] Collection schemas are configurable, versioned, typed in generated
      output, and source-diagnostic on failure.
- [x] Unknown MDX components fail clearly; supported components remain sanitized.
- [x] Default routes and artifact names remain compatible and tested.
- [x] SEO, LLM, reference, and agent artifacts include the correct collection
      identity and canonical routes.

## Stop conditions

- Preserving compatibility would require silently merging collections or
  guessing route ownership; stop and write a route migration note.
- A proposed schema adapter requires executing arbitrary consumer code in the
  renderer or build without an explicit security review.
- A custom MDX component cannot be sanitized and rendered as a bounded artifact;
  keep it unsupported and report the contract gap.

## Maintenance notes

Any new collection field or MDX component must update the schema version,
artifact fixture, source diagnostics, sanitization policy, and agent/SEO
metadata tests together.
