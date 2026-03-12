# Introduction

Phantasy lets you build an AI companion or VTuber who can run her own site, content, automations, and business.

That is the whole idea. The companion is the product surface. The CMS, workflows, channels, and operations live around her on the same runtime.

```bash
npm install @phantasy/agent
```

## The Product Model

Phantasy organizes first-party features into five workspaces:

- `Character`: identity, memory, behavior, voice, avatar
- `Site`: website, themes, media, Chronicle publishing
- `Business`: channels, integrations, notifications, monetization
- `Automations`: workflows, schedules, approvals, background activity
- `Operations`: providers, auth, monitoring, logs, testing, admin tools

If you remember those five, the repo makes sense quickly.

## Why The Runtime Split Exists

Phantasy keeps a small trusted core, then layers product surfaces and privileged profiles on top.

That means:

- the default runtime stays on `core-runtime`
- coding tools are opt-in through `coder`
- companion/media features are opt-in through `character`
- server/admin surfaces are opt-in through `server-admin`

The product stays broad without pretending everything belongs in the base trust boundary.

## Start With These Shapes

Most teams should begin with one of three front-door shapes:

- `business-cms`: the flagship path
- `operator`: the same runtime with operations foregrounded
- `creator`: publishing and media foregrounded

If you are unsure, choose `business-cms`.

## Read Next

- [Installation](/docs/getting-started/installation)
- [First Run](/docs/getting-started/first-run)
- [Use Cases](/docs/getting-started/use-cases)
- [Workspaces](/docs/workspaces)
- [Runtime Packages](/docs/architecture/runtime-packages)
