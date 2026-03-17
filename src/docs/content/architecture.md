# Architecture Overview

## System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Phantasy Agent                           │
├─────────────────────────────────────────────────────────────┤
│  Admin UI (React)     │  Express Server  │  CLI (OpenTUI)   │
│  26+ config tabs      │  REST + WebSocket│  Interactive     │
├───────────────────────┼──────────────────┼──────────────────┤
│  Plugin System        │  Memory System   │  Provider Router │
│  48 plugins           │  Dual-vector     │  20+ providers   │
│  Hook-bus             │  Markdown        │  2-tier routing  │
├───────────────────────┼──────────────────┼──────────────────┤
│  Platforms            │  Storage         │  Workflow Engine │
│  Discord/Twitch/Twitter│  PostgreSQL      │  .workflow.json  │
│  Live2D avatars       │  Redis cache     │  Graph execution │
└───────────────────────┴──────────────────┴──────────────────┘
```

## Key Directories

| Path             | Purpose              |
| ---------------- | -------------------- |
| `src/cli/`       | CLI commands and TUI |
| `src/server/`    | Express server       |
| `src/services/`  | Business logic       |
| `src/plugins/`   | 48 plugins           |
| `src/providers/` | AI provider adapters |
| `src/admin-ui/`  | React dashboard      |
| `config/agents/` | Agent configurations |
| `workflows/`     | Workflow files       |

## Configuration Priority

```
1. Database (Admin UI)
   ↓
2. Environment Variables (.env)
   ↓
3. Agent Config Files (config/agents/*.json, *.ts)
   ↓
4. Framework Defaults
```

Database always wins - changes in Admin UI override all other sources.
