# Plan 013: Publish a reproducible starter and open-source maintainer surface

> **Executor instructions:** Read this plan completely before editing. Keep the
> default scaffold credential-free and deterministic. Run every verification
> command in the table and update `plans/README.md` only after the packed-package
> and clean-consumer smoke tests pass. Do not publish to npm until package
> ownership, version, provenance, and release credentials are explicitly
> confirmed by the maintainer.

## Status

- **Priority:** P0
- **Status:** BLOCKED — local implementation complete; npm ownership/publication is not confirmed.
- **Effort:** M
- **Risk:** MED — distribution changes affect first-run users and release
  provenance.
- **Depends on:** plans/005-productize-template-and-performance.md (DONE),
  plans/009-maintainer-agent-contract.md (DONE)
- **Category:** dx | release | docs | supply-chain
- **Planned at:** commit `ecaa12a`, 2026-08-25

## Re-audit finding

The project advertises `npm create papers` in `FRAMEWORK.md:43` and the CLI
prints the same command in `packages/create-papers/index.mjs:24-34`, but the
package is not available from npm: `npm view create-papers version dist-tags
--json` returned registry `E404` on 2026-08-25. The package is only `0.1.0`
(`packages/create-papers/package.json:1-3`), the root has only a manual
`publish:create-papers` script (`package.json:40-41`), and there is no release
workflow or tag in the checkout.

Even after publication, the default published-mode path calls unpinned
`npx --yes degit` against the repository default branch
(`packages/create-papers/index.mjs:141-145`, `:163-181`). A user could receive
different source from the same CLI version, and the generated site is not
verified from a packed package in CI. The root README also omits the supported
Node version, starter path, contribution path, security reporting, and the
known static-host/content-engine limitations (`README.md:1-44`).

## User impact

New users cannot follow the advertised one-command install path. Once the name
is published, mutable-template downloads and unpinned installer tooling can
silently change the generated project, making support, rollback, and security
triage unreliable. Maintainers lack a versioned release artifact and a clean
consumer proof.

## Target contract

- `npm create papers` resolves to an owned, public package with a documented
  Node support range aligned with the generated template (Node 22 in the
  current root `package.json:53-55`).
- The default scaffold is reproducible for a package version: either a
  package-bundled template or an immutable, checksum-verified release asset.
  A mutable `main`/default-branch download is not the default path.
- A packed-tarball smoke test creates a clean consumer, runs install/build and
  opens a docs route without repository checkout assumptions.
- Release notes, package README/license, provenance, version tags, and a
  contributor/security path are visible to an outside maintainer.

## Steps

### 1. Define the distribution and version contract

Choose one source of truth for the framework and starter versions. Document
whether the starter version is coupled to the template commit or independently
versioned. Align `engines`, package metadata, repository directory, keywords,
README, and license. Add package-level files to the npm tarball deliberately;
do not rely on an implicit `files` list that contains only `index.mjs`.

Record the chosen template identity in a small generated manifest containing
the source revision, supported Node version, and artifact schema version. The
manifest must be safe to print in `--version` output and must not contain
credentials or local paths.

### 2. Make the default scaffold reproducible

Prefer a package-bundled, allowlisted template for the default path when its
size is within an explicit budget. If a remote archive is required, require a
release tag/commit and verify the expected revision before copying; pin the
download implementation rather than invoking an unpinned `npx` package. Keep
`--repo` as an advanced override and make its mutable-network behavior explicit
in help text.

Preserve the non-empty-target guard, `--no-install`, and local-template support,
but ensure local mode requires the existing marker set rather than an arbitrary
ancestor `package.json`. Keep generated files and plans out of a new consumer
unless they are part of the documented template contract.

### 3. Add packed-package and clean-consumer tests

Add focused tests for:

- `--help` and `--version` without network access;
- an ordinary consumer directory never being mistaken for a template;
- a package-like installation using the same code path as the npm tarball;
- a non-empty target failing without deleting or overwriting files;
- a successful scaffold with `--no-install` and a local fixture template.

Add a release script that packs `packages/create-papers`, installs that tarball
into a temporary clean directory, runs the scaffold, then runs `npm ci`/`npm run
build` in the generated project. Use a fixture or bundled template for CI; do
not make tests depend on GitHub or npm availability.

### 4. Add the public maintainer surface

Expand the root README with prerequisites, `npm create papers`, repository
development, generated-artifact ownership, deployment choices, SEO/agent
artifacts, and known limitations. Add a general `CONTRIBUTING.md` and
`SECURITY.md` (or link to an explicitly supported security-reporting policy),
and keep `CONTRIBUTING_THEMES.md` as the theme-specific supplement. Replace the
stale “recommended tag” release wording with the chosen versioning process.

### 5. Automate a trusted package release

Add a tag- or manually-dispatched release workflow that runs the full validation
ladder and the packed-consumer smoke before publishing. Use npm provenance and
least-privilege credentials where supported. A failed package smoke must block
publication. Add a post-publish check that resolves the exact version and
records the package tarball URL in the release notes without embedding tokens.

## Verification

| Check                                          | Expected result                                      |
| ---------------------------------------------- | ---------------------------------------------------- |
| `node packages/create-papers/index.mjs --help` | exits 0 with no network request                      |
| package metadata/tarball dry run               | intended files, README, license, manifest only       |
| packed-package clean-consumer smoke            | scaffold, install, build, and direct docs route pass |
| `npm test` and `npm run type-check`            | pass, including CLI regression cases                 |
| `npm run lint` and `npm run format:check`      | pass                                                 |
| `npm run release:check`                        | pass without package/release drift                   |
| post-publish version probe                     | exact requested version is publicly resolvable       |

## Done criteria

- [ ] `npm create papers` resolves from npm at the documented version.
- [x] The default scaffold is immutable/reproducible and has a packed-package
      smoke test.
- [x] The starter does not copy an arbitrary consumer directory or depend on an
      unpinned default-branch download.
- [x] README, CONTRIBUTING, SECURITY, package metadata, and release notes form
      one coherent onboarding contract.
- [x] A trusted release workflow blocks publication when the clean-consumer
      build or provenance checks fail.

## Stop conditions

- npm package ownership, organization scope, or publish credentials are not
  confirmed; implement and test locally but do not publish.
- The bundled template exceeds the agreed package budget; stop and choose an
  immutable release-asset design rather than silently accepting a mutable fetch.
- The clean consumer requires secrets, a live host, or repository-local paths;
  fix the scaffold contract instead of weakening the smoke test.

## Maintenance notes

Every template-affecting release must update the starter manifest, packed smoke
fixture, changelog, and supported Node range together. Treat the package tarball
as a public API: removing a template path or changing generated artifact names
requires a migration note.
