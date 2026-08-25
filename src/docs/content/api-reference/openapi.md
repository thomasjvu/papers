---
title: OpenAPI Explorer
description: Interactive OpenAPI reference powered by Scalar.
---

# OpenAPI Explorer

Configure specs in `shared/documentation-config.js` under `openapiConfig`, then open the interactive viewer from the sidebar or at `/docs/api-reference/openapi`.

The build also emits `public/openapi-artifacts.json`. For local specs it is a
deterministic summary of operations, parameters, request bodies, responses,
examples, and component schemas. Scalar remains the full interactive renderer;
the summary is available before the viewer finishes loading and gives agents a
stable machine-readable contract to inspect.
