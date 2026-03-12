# Runtime Packages

Phantasy exposes one default package plus focused runtime surfaces for advanced composition.

Exact public exports live in [../generated/package-exports.md](../generated/package-exports.md).

For most teams, the answer is still `@phantasy/agent`.

The smaller surfaces exist for trust boundaries, deployment shape, and intentional narrowing. They are not the default product story.

In practice:

- `@phantasy/core-runtime` is the smallest trust boundary.
- `@phantasy/profile-coder` adds coding tools.
- `@phantasy/profile-character` adds companion and media features.
- `@phantasy/server-admin` adds the self-hosted server and admin surface.
- `@phantasy/agent` remains the easiest full install.

## Composing Profiles

Capability and persona are meant to compose.

If you want a straight coding agent, select `["coder"]`.

If you want a character-driven coding agent, select `["coder", "character"]`.

If you want the full self-hosted product surface, add `server-admin`.

Common shapes:

- `["character", "server-admin"]` for a character-native CMS product
- `["character", "server-admin", "coder"]` for a workflow/operator product
- `["coder", "character", "server-admin"]` for a creator/operator stack

See [Use Cases](../getting-started/use-cases.md) for the narrative framing around those compositions and how they map back to `business-cms`, `operator`, and `creator`.

## Why The Split Exists

The split reduces trust in the default runtime and makes capability boundaries explicit:

- coding tools are not part of the base runtime
- character/media features are not part of the base runtime
- admin HTTP surfaces are not part of the base runtime

That keeps the smallest install and the smallest trust boundary aligned.

## Publishing Model

The repo builds publishable package artifacts under `dist/packages/`.

Those packages wrap stable `@phantasy/agent` subpath exports instead of duplicating runtime implementations.
