# Runtime Packages

Phantasy exposes one default package plus focused runtime surfaces for advanced composition.

Exact public exports live in [../generated/package-exports.md](../generated/package-exports.md).

For most teams, the answer is still `@phantasy/agent`.

The smaller surfaces exist for trust boundaries, deployment shape, and intentional narrowing. They are not the default product story.

In practice:

- `@phantasy/agent-core` is the headless runtime boundary.
- `@phantasy/agent` owns the default runtime host/bootstrap path.
- `@phantasy/providers` is the standalone provider boundary.
- `@phantasy/cli` owns command parsing and non-visual runtime lifecycle.
- `@phantasy/tui` owns the interactive terminal shell.
- `@phantasy/admin-web-ui` owns the admin CMS frontend package.
- `@phantasy/server-admin` adds the self-hosted server and admin surface.
- `@phantasy/agent` remains the easiest full install.

## Layering

The intended layering is:

- `@phantasy/agent-core`: host-first runtime API with explicit dependencies
- `@phantasy/providers`: built-in provider catalog and provider-service wiring
- `@phantasy/agent`: Phantasy default host/bootstrap and flagship convenience helpers
- `@phantasy/cli` and `@phantasy/tui`: product shells composed over the runtime

That means the TUI being feature-rich is not a modularity failure. The TUI is
supposed to stay opinionated and interactive. The architectural requirement is
that it consumes the shared runtime instead of forcing runtime-global behavior
back into `agent-core`.

## Composing Capabilities

Capability and persona are meant to compose.

If you want a straight coding agent, set `coding: true`.

If you want a character-driven coding agent, enable both `coding` and `character`.

If you want the full self-hosted product surface, enable `admin` or use `@phantasy/server-admin`.

Common shapes:

- `{ character: true, admin: true }` for a character-native CMS product
- `{ coding: true, character: true, admin: true }` for a workflow/operator product
- `{ coding: true, character: true, admin: false }` for an in-character local runtime

See [Use Cases](../getting-started/use-cases.md) for the narrative framing around those compositions and how they map back to `vtuber`, `operator`, and `developer`.

## Why The Split Exists

The split reduces trust in the default runtime and makes capability boundaries explicit:

- provider adapters can be consumed without the full runtime
- terminal UI can be consumed without the server/admin surface
- admin HTTP surfaces are not part of the headless runtime
- approval policy stays explicit for privileged coding actions

That keeps the smallest install and the smallest trust boundary aligned.

In concrete package terms:

- `@phantasy/agent-core` owns provider contracts and routing behavior
- `@phantasy/providers` owns the built-in provider implementations and registers
  them into the shared provider registry
- consumers that want the default model/media adapters should install both
  packages, while the flagship `@phantasy/agent` package composes that wiring
  for them

## Publishing Model

The repo builds publishable package artifacts under `dist/packages/`.

The first-class runtime surfaces build from package-owned artifacts:

- `@phantasy/agent-core`
- `@phantasy/providers`
- `@phantasy/cli`
- `@phantasy/tui`
- `@phantasy/admin-web-ui`
- `@phantasy/server-admin`

Generated wrapper packages still exist for installable plugin surfaces that have
not fully converged on standalone package-owned builds yet. See
[Plugin Repository Strategy](./plugin-repository-strategy.md) for which plugin
surfaces remain wrappers versus source-extracted repos.
