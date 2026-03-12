# Heartbeat

Heartbeat is the lightweight background loop.

Use it for periodic checklists and small wake-up tasks. Use workflows when you need a real automation graph.

## What It Actually Does

When enabled, `HeartbeatService`:

- resolves a workspace from config, `PHANTASY_WORKSPACE`, or `./workspace`
- runs once immediately on startup
- runs again every `interval_minutes`
- optionally reads unchecked items from `HEARTBEAT.md`
- records audit-trail events for enable, start, success, failure, and stop

The checklist items are task labels. They do not execute arbitrary code by themselves.

## Config

```json
{
  "heartbeat": {
    "enabled": true,
    "interval_minutes": 30,
    "read_heartbeat_md": true,
    "message": "Checking in..."
  }
}
```

## `HEARTBEAT.md`

Only unchecked checklist lines are parsed:

```md
# HEARTBEAT.md

- [ ] Check pending approvals
- [ ] Review urgent messages
- [ ] Tidy memory if needed
```

Checked items are ignored.

## Return Shape

A run returns one of these:

- `HEARTBEAT_OK - Processed N tasks`
- `HEARTBEAT_OK - No tasks pending`
- `HEARTBEAT_ERROR`

If you set `heartbeat.message`, that string becomes the success response instead.

## When To Use It

Heartbeat is good for:

- lightweight recurring checks
- companion "look around" behavior
- audit-trail backed background nudges

Workflows are better for:

- multi-step automation
- branching or approvals
- reusable recipes and scheduled graphs

## Related Docs

- [Bootstrapping](/docs/getting-started/bootstrapping)
- [Workflows Overview](/docs/workflows/overview)
- [Admin API](/docs/api/admin-api)
