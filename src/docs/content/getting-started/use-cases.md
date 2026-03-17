# Use Cases

Phantasy is broad, so the docs should be explicit about the story it is best at: an AI companion/VTuber with a real operating stack around her.

These are the three canonical product shapes to lead with.

If you are deciding quickly and do not have a strong reason otherwise, start with `vtuber`. It is the flagship path and the one the repo presentation is supposed to make obvious.

## 1. `vtuber`

This is the strongest default story for Phantasy.

You are building an AI VTuber/content creator with her own site, publishing flow, and connected apps. She is not decoration. She is the creator, publisher, storefront, and character identity. The site, CMS, channels, workflows, and operations exist around her.

Typical shape:

- Live2D or VRM companion/VTuber presentation
- built-in admin/CMS for settings, content, and operations
- website or headless publishing
- Chronicle posts, pages, feeds, and theme configuration
- workflows, automations, and business operations behind the scenes

Recommended install:

```bash
npm install @phantasy/agent
```

Recommended capability composition behind the preset:

```json
{
  "capabilities": { "coding": true, "character": true, "admin": true }
}
```

Start here:

- [Build A Business Agent CMS In 10 Minutes](/docs/guides/BUSINESS_AGENT_CMS_10_MINUTES)
- [Website Modes](/docs/website-mode)
- [Live2D Setup](/docs/guides/LIVE2D_SETUP)

Why Phantasy fits:

- the companion runtime, CMS, and business surface already live together
- you do not need a separate agent backend, CMS, and character frontend
- the same identity and memory system powers both the companion and her business

## 2. `operator`

This is for products where the companion is both an operator and a visible character surface.

The companion may manage publishing queues, social flows, support operations, media pipelines, or internal business automations. The important point is that the workflow engine and the companion-facing runtime are the same system.

Typical shape:

- recurring workflows or heartbeat-driven automations
- approvals, integrations, and operational dashboards
- a visible companion shell for user interaction or brand identity
- admin UI for inspection, scheduling, and intervention

Recommended install:

```bash
npm install @phantasy/agent
```

Recommended capability composition behind the preset:

```json
{
  "capabilities": { "coding": true, "character": true, "admin": true }
}
```

If the runtime does not need coding tools, set `"coding": false`.

Start here:

- [Runtime Packages](/docs/architecture/runtime-packages)
- [Workflows Tab and automations](/docs/guides/CONSUMING_PHANTASY)
- [Heartbeat](/docs/architecture/heartbeat)

Why Phantasy fits:

- workflows, memory, and publishing are already tied to the same runtime
- the operator surface does not need to be bolted onto a separate companion app
- teams get CMS, workflow orchestration, and companion presence in one stack

## 3. `developer`

This is the trusted-local product shape for repo work, workbench tooling, and coder-first flows.

The same companion can still stay in character, but the lead surface is coding, debugging, and internal operations.

Typical shape:

- coding tools, repo search, file editing, and workbench surfaces
- approvals for privileged command, file, and browser actions
- optional character layer for in-character coding
- optional admin/server surface when you also want the hosted product shell

Recommended install:

```bash
npm install @phantasy/agent
```

Recommended capability composition behind the preset:

```json
{
  "capabilities": { "coding": true, "character": true, "admin": false }
}
```

Start here:

- [Consuming Phantasy](/docs/guides/CONSUMING_PHANTASY)
- [Chronicle](/docs/features/chronicle)
- [Website Modes](/docs/website-mode)

Why Phantasy fits:

- coding, workflows, and character behavior share one system
- approval policy is first-class instead of bolted on
- you can keep the headless runtime and terminal UI without committing to the admin surface

## How To Choose Quickly

Pick the use case that matches the thing users will notice first:

- If you are unsure, pick `vtuber` first and prove you need something else later.
- If they notice the companion/VTuber first and the business exists around her, start with the `vtuber` story.
- If they notice operations, scheduling, or automations around the same companion first, start with the workflow/operator story.
- If they notice coding, workbench, and internal tooling first, start with the developer story.

All three shapes live on the same runtime and the same five workspaces. The difference is the lead surface, not a different framework.

## When Phantasy Is Probably Too Much

Phantasy is probably overkill if you only need:

- a thin API wrapper around a single model provider
- a pure backend automation service with no character or CMS surface
- a static website with no agent runtime, workflows, or operational UI

In those cases, the smaller package surfaces or a narrower stack may be the better choice.
