# Contributing

Use this guide when you are opening a pull request against the open-source repo.

## Workflow

1. Fork the repository.
2. Create a descriptive branch from `development` unless a maintainer asks for something else.
3. Open the PR against `development`.

## Minimum Checks

```bash
bun run typecheck
bun run validate:standards
bun run docs:check
```

If you touch shared runtime, admin UI behavior, or the publish surface, also run:

```bash
bun run test
bun run build
bun run test:publish-surface
```

If you change a first-run flow or visible admin shell behavior, also run:

```bash
bun run test:browser:smoke
```

## Expectations

- Stay aligned with the five-workspace model.
- Prefer domain-first placement.
- Update user-facing docs when behavior changes.
- Use signed-off commits: `git commit -s`
- Do not introduce secrets or incompatible licenses.
