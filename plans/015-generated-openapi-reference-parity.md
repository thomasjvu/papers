# Plan 015: Ship generated OpenAPI reference parity

> **Executor instructions:** Treat this as an additive API-reference product
> contract. Keep Scalar route-lazy and keep the existing local/allowlisted URL
> boundary. Do not replace the current viewer or build a network-enabled API
> client as an unbounded side project.

## Status

- **Priority:** P1
- **Status:** DONE — generated operation/model routes, schema types, examples, SEO, browser coverage, and lazy Scalar are shipped.
- **Effort:** L
- **Risk:** HIGH — generated routes, schema resolution, code examples, SEO,
  and the heavy interactive viewer must remain consistent.
- **Depends on:** plans/010-native-content-api-parity.md (DONE),
  plans/011-defer-and-slim-openapi-runtime.md (DONE),
  plans/012-seo-and-agent-discovery-contract.md (DONE)
- **Category:** api | parity | content | perf
- **Planned at:** commit `ecaa12a`, 2026-08-25

## Re-audit finding

The current OpenAPI route renders one overview followed by Scalar
(`src/pages/OpenApiPage.tsx:151-154`). The overview lists operation cards and a
flat model name line (`src/components/OpenApiOverview.tsx:83-120`), while the
artifact generator normalizes operations, parameters, request/response content,
examples, and shallow schema summaries (`scripts/lib/openapiArtifacts.mjs:116-197`).
There is no generated operation route, schema explorer, schema-derived type
output, or stable per-operation static page contract. The ADR explicitly calls
this surface “partial” and lists generated operation pages/playground behavior
as remaining scope (`docs/decisions/001-content-engine.md:112-114`,
`:180-185`).

The official Fumadocs OpenAPI integration documents generated pages with an
interactive playground, multi-language example code, response samples, and
TypeScript definitions. See the [official OpenAPI integration
documentation](https://preview.fumadocs.dev/docs/integrations/openapi).

## User impact

API users and search/agent clients cannot deep-link to one operation, index its
parameters/responses, copy generated examples, or discover schema types without
loading the large viewer. The project is visually strong and functionally
usable, but not at parity with a general-purpose API documentation framework.

## Target contract

- Each valid operation has a stable, canonical generated route keyed by spec ID,
  tag/path, and operation ID with collision-safe fallback.
- Static HTML and JSON expose summary, description, parameters, request body,
  responses, examples, security requirements, servers, and resolved schema
  references.
- A bounded first-party code-sample set (at minimum curl plus JavaScript and
  Python) and schema-derived TypeScript definitions are generated from the
  contract without executing user-provided code.
- Scalar remains an optional lazy interactive surface for try-it-out behavior;
  generated pages do not require the Scalar bundle.
- Canonicals, sitemap, JSON-LD, LLM/agent artifacts, and search indexing include
  operation routes according to one inclusion policy.

## Steps

### 1. Version the artifact model and resolve schemas

Design the next additive `openapi-artifacts.json` schema before changing routes.
Preserve schema version 1 for consumers during a migration window or provide a
clear generated compatibility artifact. Add stable operation IDs, tags, source
locations, security metadata, component references, and a bounded recursive
schema graph for `$ref`, `allOf`, `oneOf`, `anyOf`, arrays, enums, nullable
values, and circular references.

Reject malformed or unsupported OpenAPI inputs with spec path and JSON pointer
diagnostics. Never fetch or dereference an unallowlisted remote URL during
generation.

### 2. Generate operation and model route entries

Create deterministic route entries for each operation and model. Define URL
encoding, duplicate operation IDs, overloaded methods, tags with unsafe names,
and specs with no tags. Generate route HTML from the same entries used by the
runtime and sitemap. Add breadcrumbs and structured data that describe the
operation without claiming unsupported execution behavior.

Keep the existing overview and spec selector as navigation into generated
pages. Preserve the default OpenAPI route and alternate-spec routes.

### 3. Add examples, code samples, and type output

Generate escaped, copyable request examples from parameters, request bodies,
servers, and declared examples. Start with deterministic curl, JavaScript
`fetch`, and Python `requests` output; make unsupported authentication or
ambiguous schemas explicit instead of inventing values. Generate TypeScript
interfaces/types from the resolved schema graph with stable names and circular
reference handling.

Add a per-operation page component that renders these artifacts as static
content. Keep the Scalar playground link optional and clearly separate from
generated examples; do not send requests automatically or embed credentials.

### 4. Preserve the performance and security boundary

Assert that operation/model pages do not import the Scalar runtime. Keep the
viewer behind the existing route-lazy standalone adapter. Apply the existing
OpenAPI URL validation, CSP, sanitization, and remote-origin allowlist to both
generated and interactive surfaces. Add a size budget for the generated API
artifact and a separate performance budget for the Scalar route.

### 5. Test against representative specifications

Extend fixtures with tagged/untagged operations, path and operation parameters,
request/response examples, nested refs, arrays, unions, circular models,
security schemes, multiple servers, and alternate spec IDs. Assert snapshots of
artifact JSON, operation URLs, canonical/JSON-LD output, search/LLM inclusion,
code samples, type output, and Scalar lazy isolation. Add browser coverage for
operation navigation and mobile/copy interactions.

## Verification

| Check                               | Expected result                                                                     |
| ----------------------------------- | ----------------------------------------------------------------------------------- |
| OpenAPI fixture generator           | deterministic schema/operation/model artifacts and diagnostics                      |
| route/SEO smoke                     | every generated operation route has one canonical and correct JSON-LD/robots policy |
| `npm test`, typecheck, lint, format | pass with negative spec fixtures                                                    |
| `npm run release:check`             | generated API routes and artifacts are complete                                     |
| `npx playwright test`               | overview, operation page, alternate spec, and Scalar interactions pass              |
| Lighthouse/asset check              | non-OpenAPI shell stays isolated; route-specific API budget is explicit             |

## Done criteria

- [x] Every supported operation has a stable generated page and machine-readable
      artifact entry.
- [x] Parameters, request/response bodies, examples, schemas, and security
      metadata are rendered without shallow “unknown/object” collapse where the
      source contract contains more information.
- [x] Curl/JavaScript/Python examples and TypeScript schema output are tested.
- [x] Scalar remains lazy and optional; the homepage/docs shell never imports it.
- [x] Canonical, sitemap, search, LLM, and agent contracts cover generated API
      routes without duplicate or unsafe URLs.

## Stop conditions

- The required behavior depends on executing arbitrary OpenAPI extensions,
  remote examples, or authenticated requests; keep those opt-in and out of the
  static build.
- Schema resolution becomes an unbounded code-generation project; narrow the
  supported OpenAPI subset and document unsupported constructs.
- Generated routes collide with existing docs routes or make canonical behavior
  ambiguous; stop before changing the public route contract.

## Maintenance notes

Treat the OpenAPI artifact schema, route builder, code-sample generator, Scalar
adapter, and security policy as one versioned surface. Any Scalar or OpenAPI
parser upgrade must rerun route-isolation, fixture, browser, and Lighthouse
checks.
