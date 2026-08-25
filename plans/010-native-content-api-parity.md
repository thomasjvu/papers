# Plan 010: Ship native content/API parity artifacts

## Status

Complete locally on 2026-08-25. This plan implements the bounded native
milestones from ADR 001 while preserving the existing Vite/static route
contract.

## Delivered

- Typed frontmatter schema in `shared/contentSchema.js`, including source-line
  diagnostics for unsupported fields and invalid scalar/array types.
- Versioned `public/docs-collection.json` with typed entries and navigation
  metadata; existing `public/docs-index.json` and per-page JSON remain stable.
- `links` metadata on generated documents and deterministic
  `public/docs-references.json` edges/backlinks derived from the same parser as
  content validation.
- Runtime `getDocumentBacklinks()` and a `Referenced by` page section.
- Deterministic `public/openapi-artifacts.json` generated from local specs,
  covering operations, parameters, request bodies, responses, examples, tags,
  servers, and component schemas.
- OpenAPI overview UI above Scalar with operation/model counts and summaries.
- Artifact, parser, relationship, route, and negative security tests.

## Verification

Passed locally:

- `npm test` — 34 tests
- `npm run type-check`
- `npm run lint`
- `npm run docs:check`
- `npm run check:docs-tree`
- `npm run check:security-policy`
- `npm run check:assets`
- `npm run format:check`

The Vite production transform was retried in a clean isolated process but did
not emit assets within the local session because the existing Scalar-heavy
dependency graph remained in Rollup transformation for more than eleven
minutes. This is a verification caveat, not a silent pass; CI must rerun the
normal build and browser/release gates before promotion.

## Remaining scope

This is project-specific parity, not full Fumadocs equivalence. Future work
should be justified by a concrete need for arbitrary user-defined collection
schemas, unknown-MDX-component diagnostics, generated operation pages, or a
full API playground. The owned-host deployment proof remains Plan 006.
