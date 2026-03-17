# Multi-Agent Boundaries

## Overview

Party-HQ is the multi-agent control plane. The embedded Phantasy admin app is single-runtime per deployment and should not grow a second orchestration layer of its own.

This document describes the boundary:

- Phantasy runtime and admin app: one active runtime agent per deployment
- Advanced local orchestration: optional CLI/runtime capability
- Multi-agent operations, delegation, approvals, and fleet visibility: Party-HQ

## Design Principles

- **Agent isolation**: separate memory, credentials, personality per agent
- **Deterministic routing**: most-specific binding wins (inspired by OpenClaw)
- **Single-runtime first**: the main Phantasy app stays focused on one runtime per deployment
- **Less is more**: minimal primitives, composable patterns

## Agent Registry

The `AgentRuntime` maintains an in-memory registry of loaded agent configurations:

```typescript
interface AgentEntry {
  id: string;        // Unique identifier
  name: string;      // Display name
  config: any;       // Full AgentConfig
  role: 'primary' | 'subagent';
}

// Map<agentId, AgentEntry>
private agents: Map<string, AgentEntry>;
private activeAgentId: string;
```

### Behavior

- **Keyed by agentId**, stores: config, role (primary/subagent), status
- **Lazy initialization**: agents loaded on first use (config validated upfront)
- **Hot-swap**: switch active agent without restart via `switchAgent()`
- **Backward compatible**: when `agents[]` config is empty, a synthetic single entry is created from the root config

### Configuration

Agents are defined in the top-level `agents` array of the agent config:

```json
{
  "id": "my-agent",
  "name": "My Agent",
  "personality": "...",
  "agents": [
    {
      "id": "default",
      "name": "Companion",
      "role": "primary",
      "preset": "default"
    },
    {
      "id": "planner",
      "name": "Planner",
      "role": "primary",
      "description": "Planning and strategy agent",
      "configPath": "config/agents/planner.json"
    },
    {
      "id": "researcher",
      "name": "Researcher",
      "role": "subagent",
      "description": "Invoked via @researcher"
    }
  ]
}
```

Each agent entry supports:

- `preset` — reference to an existing preset (resolved at load time)
- `configPath` — path to a separate agent JSON config
- `role` — `primary` (Tab-cycled) or `subagent` (@mention-invoked)

## Routing Model

### CLI Routing (Phase 1 — Implemented)

| Mechanism           | Behavior                                                                                  |
| ------------------- | ----------------------------------------------------------------------------------------- |
| **Tab key**         | Cycles through `primary` agents                                                           |
| **Shift+Tab**       | Cycles through views (chat, plugins, etc.)                                                |
| **@mention**        | `@agentName message` routes to a subagent temporarily, then returns to the previous agent |
| **Command palette** | "Switch Agent" command cycles to next primary agent                                       |

Each agent switch:

1. Updates `activeAgentId` in the runtime
2. Swaps `agentConfig` reference
3. Re-routes provider (model/provider from the agent's config)
4. Updates sidebar display (active indicator)

### Platform Routing (Phase 2 — Planned)

Binding rules map inbound messages to agents:

```json
{
  "routingRules": [
    { "platform": "discord", "channelId": "123", "agentId": "support-bot" },
    { "platform": "twitter", "agentId": "social-bot" },
    { "default": true, "agentId": "default" }
  ]
}
```

Priority: `peer > guild > account > channel > default`

Config-driven, no magic routing — explicit > implicit.

### Inter-Agent Communication (Phase 3 — Planned)

- **Disabled by default** (security)
- Opt-in per agent: `allowAgentToAgent: ["agentId1", "agentId2"]`
- Message passing via internal event bus
- Use case: planner agent delegates to executor agent

## Party-HQ Synchronization

### Current State

- `PartyHQSyncService` registers single agent via webhook
- One-way: Phantasy -> Party-HQ registration
- Approval flow: Party-HQ approves -> callback -> Phantasy posts

### Target State (Phase 3)

- Register ALL loaded agents on startup
- Bidirectional sync: config changes in Party-HQ reflect in Phantasy
- Agent lifecycle events: created, updated, deactivated
- Shared approval queue across platforms

## Main App Boundary

### Current State

- `AgentContext` resolves the active runtime agent from `/admin/api/config/runtime`
- The embedded admin shell edits the currently running agent only
- There is no in-app agent collection API or header switcher

### Product Direction

- Use separate Phantasy deployments when you need separate runtime agents
- Use Party-HQ for multi-agent operations, approval queues, and fleet-level visibility
- Keep the flagship admin shell optimized for one companion CMS at a time

## Security Model

- Each agent: separate API keys, separate memory namespace
- `agentId` used as partition key in all storage
- No cross-agent memory access by default
- Audit log for agent switching and cross-agent operations

## Migration Path

| Phase       | Scope                                                          | Status          |
| ----------- | -------------------------------------------------------------- | --------------- |
| **Phase 1** | `agents` config array + CLI Tab switching + @mention subagents | **Implemented** |
| **Phase 2** | Platform routing rules + Party-HQ control-plane expansion      | Planned         |
| **Phase 3** | Inter-agent communication + Party-HQ bidirectional sync        | Planned         |
| **Phase 4** | Agent marketplace / template sharing                           | Future          |

## Implementation Details

### Files Modified (Phase 1)

| File                                        | Changes                                                                                |
| ------------------------------------------- | -------------------------------------------------------------------------------------- |
| `src/config/schemas/agent-config.schema.ts` | Added `agents` Zod array schema                                                        |
| `src/cli/runtime/agent-runtime.ts`          | Added `AgentEntry`, agent registry, `getAgents()`, `switchAgent()`, `getActiveAgent()` |
| `src/cli/tui/app.ts`                        | Tab -> agent cycling, Shift+Tab -> view cycling                                        |
| `src/cli/tui/sidebar.ts`                    | Multi-agent display with active/inactive indicators                                    |
| `src/cli/tui/chat-view.ts`                  | @mention detection and subagent routing                                                |
| `src/cli/tui/command-palette.ts`            | "Switch Agent" command                                                                 |
