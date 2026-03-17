# Updating Phantasy

Keep your Phantasy installation up to date with regular updates.

## Update Methods

### From Source

```bash
# Pull latest changes
git pull

# Update dependencies
bun install

# Rebuild
bun run build
```

### Bun

```bash
bun install
```

## Update Checklist

After updating, always run:

```bash
# Type check
bun run typecheck

# Lint
bun run lint

# Run tests
bun run test

# Start server
bun run dev
```

## Rollback

If an update causes issues:

```bash
# View git history
git log --oneline

# Revert to previous version
git revert HEAD

# Or checkout a specific version
git checkout <commit-hash>
```

## Migration Notes

When updating between major versions, check:

- [Migration Notes](/docs/guides/MIGRATION_NOTES) - Breaking changes
- [Changelog](https://github.com/phantasy-bot/agent/releases) - Release notes

## Version Compatibility

| Phantasy Version | Node.js | PostgreSQL |
| ---------------- | ------- | ---------- |
| 0.4.x            | 22.12+  | 14+        |
| 0.3.x            | 18+     | 14+        |

## Backup Before Update

Always backup your data before major updates:

```bash
# Backup database
pg_dump phantasy > backup_$(date +%Y%m%d).sql

# Backup workspace
cp -r workspace workspace_backup_$(date +%Y%m%d)
```

## Troubleshooting

### Update Failed

```bash
# Clean install
rm -rf node_modules
bun install --frozen-lockfile
bun run build
```

### Breaking Changes

Check the migration guide for breaking changes:

- [Migration Notes](/docs/guides/MIGRATION_NOTES)

## Next Steps

- [CLI Reference](/docs/cli) - Learn the commands
- [Configuration](/docs/configuration) - Optimize your setup
