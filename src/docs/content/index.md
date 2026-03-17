# Phantasy Agent Docs

Phantasy lets you build an AI companion/VTuber who can run her own site, content, automations, and business.

Phantasy Agent is the runtime behind that product. The beginner path through the docs assumes one install, one flagship story, and five workspaces: Character, Site, Business, Automations, and Operations. The companion is the protagonist; the other workspaces are how she operates.

```bash
npm install @phantasy/agent
```

## In One Screenful

- Build the companion first.
- Put her site, content, workflows, and business around the same runtime.
- Use Live2D or VRM for presence, Chronicle for publishing, and the five workspaces to operate everything behind her.

## Start Here

- [Quickstart](./getting-started/quickstart.md)
- [Installation](./getting-started/installation.md)
- [First Run](./getting-started/first-run.md)
- [10-minute companion business launch](./guides/BUSINESS_AGENT_CMS_10_MINUTES.md)
- [Getting Started](./getting-started/introduction.md)
- [Use Cases](./getting-started/use-cases.md)
- [CLI](./cli.md)

If you only read three pages before deciding whether Phantasy is coherent, read `Quickstart`, `CLI`, and `10-minute companion business launch`.

If you only show three screenshots, use this order:

1. The companion on the public-facing site.
2. The `Character` workspace with identity and appearance.
3. A Chronicle post flowing into the published site.

## Operate And Ship

- [Authentication & Hosting](./guides/AUTHENTICATION_SETUP.md)
- [Deploying](./guides/DEPLOY.md)
- [Phala TEE Testing](./deployment/phala-tee.md)
- [OpenClaw Migration](./guides/OPENCLAW_MIGRATION.md)
- [Open source FAQ](./guides/OPEN_SOURCE_FAQ.md)
- [Consuming Phantasy](./guides/CONSUMING_PHANTASY.md)

## Architecture And Advanced Composition

- [Design Principles](./architecture/design-principles.md)
- [Agent Compatibility](./architecture/agent-compatibility.md)
- [Integration Model](./integrations/integrations-guide.md)
- [Runtime Packages](./architecture/runtime-packages.md)
- [Memory System](./architecture/memory-system.md)
- [Database Shape](./architecture/database-shape.md)
- [System Design](./architecture/system-design.md)
- [Repository Standards](./architecture/repo-standards.md)
- [Plugin Overview](./plugins/overview.md)
- [Bootstrapping](./getting-started/bootstrapping.md)

## Five Workspaces

- `Character`: identity, memory, behavior, voice, and companion UX
- `Site`: themes, website pages, media, and Chronicle publishing
- `Business`: channels, integrations, notifications, subscriptions, and monetization
- `Automations`: workflows, jobs, schedules, approvals, and orchestration
- `Operations`: providers, auth, monitoring, logs, testing, users, and developer controls

## Advanced Composition

The runtime/package split still matters for trust and deployment, but it is documented as advanced composition in [Runtime Packages](./architecture/runtime-packages.md).

Exact public exports live in [Package Exports](./generated/package-exports.md).

Default built-in loading is intentionally scoped by explicit capabilities. The headless runtime defaults to `coding` plus `character`; `admin` stays separate unless you enable it or boot through the server surface.

Local developer-oriented admin surfaces such as `Workbench`, `Developer`, and `Test`, plus creator-lab surfaces such as `ComfyUI` and `Video`, are intentionally secondary. Use the right preset, capability config, or explicit advanced-surface exposure when you want those workflows inside the product shell.

## Source Of Truth

Narrative pages explain the system. Generated inventories document what is actually implemented and should be treated as the fastest drift check:

- [Providers](./generated/providers.md)
- [Built-in Plugins](./generated/plugins.md)
- [Bundled Skills](./generated/skills.md)
- [Admin Tabs](./generated/admin-tabs.md)
- [CLI Commands](./generated/cli-commands.md)
- [Admin API Routes](./generated/api-routes.md)
- [Package Exports](./generated/package-exports.md)
- [Defaults](./generated/defaults.md)

Contributor workflow for keeping docs concise and in sync lives in [Documentation](./development/documentation.md).

## Release Facts

- Default zero-config memory provider: `markdown`
- Recommended release stack: `pgvector` on PostgreSQL
- Admin routes are protected by default
- External plugin loading and remote plugin install are disabled by default in v1
- Published package contents are allowlisted and release-tested
