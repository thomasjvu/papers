# Known Limitations

This page tracks only current gaps that materially affect release confidence.

- Browser-level admin smoke coverage is still thinner than the unit and component test coverage.
- `phantasy video generate` still hands off to the admin UI for capture instead of running as a fully unattended render pipeline.
- Live2D still depends on the pinned Cubism Core plus PIXI compatibility stack.
- TEE-backed attestation still depends on Phala Cloud verification or an explicitly enabled development-only fallback.

If a limitation stops being release-relevant, remove it instead of letting this page turn into a backlog dump.
