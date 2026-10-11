# Security policy

## Supported branch

Security fixes are maintained on the latest `main` branch and the latest
published `create-papers` package line.

## Reporting a vulnerability

Please use GitHub's private security advisory form:

<https://github.com/thomasjvu/papers/security/advisories/new>

If private advisory reporting is unavailable, open a minimal issue that asks
for a private contact channel and do not include exploit code, credentials,
private documentation, or other sensitive details.

Include the affected version or commit, a concise impact description, safe
reproduction steps, and any suggested mitigation. We will acknowledge a
credible report when we can and coordinate disclosure after a fix is
available.

## Scope and safe handling

The highest-risk surfaces are generated HTML/MDX, Mermaid SVG, remote OpenAPI
spec URLs, theme assets, the starter package, and release/deployment workflows.
Do not submit secrets in issues or pull requests. Runtime dependencies are
audited separately from development-only tooling; release gates must remain
strict about CSP, sanitization, artifact ownership, and package provenance.

See [AGENTS.md](AGENTS.md) and [RELEASING.md](RELEASING.md) for the repository's
security and deployment contracts.
