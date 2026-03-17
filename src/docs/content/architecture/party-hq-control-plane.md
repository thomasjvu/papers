# Party-HQ Control Plane

Party-HQ should be treated as a separate control-plane app for agents, not as a feature folded into the main Phantasy runtime package.

## Decision

Current recommendation:

- keep Party-HQ as a separate app
- keep it adjacent to the main runtime so the flagship release does not depend on it
- do not merge its orchestration logic into the main `@phantasy/agent` package
- if you keep a local checkout in `apps/party-hq`, treat it as an optional companion repo rather than part of the root package contract

Target shape:

```text
apps/party-hq
packages/party-hq-shared
packages/party-hq-sdk
packages/phantasy-party-hq-adapter
```

## Why

Folding orchestration into the main runtime would:

- overfit the control plane to Phantasy
- make external runtime support feel fake
- make the package surface heavier and less coherent
- couple deploy cadence for the runtime and the control plane

Keeping Party-HQ separate preserves the right boundary:

- Phantasy remains the agent framework
- Party-HQ becomes the org/work orchestration layer
- external runtimes can integrate without pretending to be Phantasy

## Core Primitives

Paperclip-like orchestration needs these primitives to exist first:

- goals
- tickets
- runs
- artifacts
- trace events
- policies
- budgets
- runtime heartbeats

Tweets, chat, and webhook notifications sit on top of those primitives. They are not the backbone.

## Current Foundation

The current control-plane slice may live in a local `apps/party-hq` checkout:

- shared protocol with heartbeat, run-trace, and run-result contracts
- goal, ticket, run, artifact, policy, budget, and trace tables
- approval request records and operator review actions
- heartbeat-based ticket checkout plus per-agent last/next heartbeat tracking
- trace ingestion and run completion endpoints
- an operator UI for approvals, tickets, runs, traces, heartbeat health, and child-ticket delegation

That is enough to start building a real multi-agent work loop.

## Next Moves

1. Keep Party-HQ separate from the flagship runtime and avoid sliding it back into `temp/`.
2. Add goal creation/editing and a goal-tree view to the operator UI.
3. Add runtime-driven delegation and policy checks for manager/subordinate handoffs.
4. Add lease renewal reapers, overdue alerts, and a real multi-assignment strategy.
5. Add adapters for Codex, Claude Code, OpenClaw-like runtimes, and generic HTTP workers.

Tweet approvals now start down that path: new tweets create `tweet_approval` tickets plus approval records so the operator surface and tweet queue are looking at the same work item.
