# Workflow Overview

Workflows are declarative automation graphs executed by the scheduling engine.

They are automation recipes, not a replacement for agents.

## Agents vs Workflows

- Agents are autonomous LLM companions/operators with tools and persistent memory.
- Workflows are deterministic multi-step graphs for approvals, publishing, review loops, and background jobs.

Use a workflow when you want predictable orchestration. Use an agent when you want reasoning and adaptive behavior around that orchestration.

## Built-In Workflows

The current first-party catalog ships in the root `workflows/` directory:

- `approval-loop`
- `content-pipeline`
- `daily-operator-brief`
- `site-launch-readiness`

Each workflow ships as:

- `*.workflow.json`: executable workflow graph
- `*.workflow.metadata.json`: catalog metadata for export, hub, and admin surfaces

## CLI Usage

```bash
npx phantasy workflow list
npx phantasy workflow run approval-loop
npx phantasy workflow export approval-loop
```

## Product Fit

In the flagship product story, workflows live inside the `Automations` workspace and usually back:

- approvals for risky or publishable actions
- content review/publish flows
- scheduled operational summaries
- launch and readiness checklists

## Authoring Guidance

- Keep reusable execution infrastructure in the trusted kernel.
- Keep business-specific orchestration in workflows or workspace surfaces.
- Start from a built-in starter before inventing a new graph shape.

## Related Docs

- [Workspaces](/docs/workspaces)
- [Configuration](/docs/getting-started/configuration)
- [Launch Playbook](/docs/guides/LAUNCH_PLAYBOOK)
