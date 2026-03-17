# Historical Architecture Review

This page is archived.

It originally captured a migration away from Cloudflare-Workers-specific deployment assumptions toward the current server-based runtime. That migration is no longer the live architecture plan, and this page should not be treated as current implementation guidance.

## Current Source Of Truth

Use these pages instead:

- [System Design](./system-design.md)
- [Framework Audit](./framework-audit.md)
- [Runtime Packages](./runtime-packages.md)
- [Generated Admin API Routes](../generated/api-routes.md)
- [Generated Admin Tabs](../generated/admin-tabs.md)

## Current Reality

- Phantasy ships as a server-based runtime with a shared CLI and admin/server foundation.
- Cloudflare may still appear as a provider integration, but not as the main deployment target.
- The public product story is the companion/VTuber and the business stack around her, not an infrastructure migration.

## Why Keep This Page

The historical note remains useful when old discussions or stale branches reference:

- Cloudflare Workers migration work
- `agent-core` cleanup discussions
- older deployment assumptions that no longer define the product

If you are deciding how Phantasy works today, ignore the old migration steps and use the current architecture docs instead.
