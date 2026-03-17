# Bootstrapping

This guide covers initializing your Phantasy workspace and the local files that shape agent behavior.

## Workspace Setup

### Interactive Setup

The easiest way to set up your workspace:

```bash
# Interactive wizard - creates ~/.phantasy/ workspace
phantasy setup

# Or specify custom workspace path
phantasy setup --workspace ~/ai-agents
```

This creates the global workspace structure:

```
~/.phantasy/
├── config.json           # Global configuration
├── workspace/           # Agent workspaces
│   └── <agentId>/
│       ├── MEMORY.md    # Long-term memory
│       ├── YYYY-MM-DD.md # Daily logs
│       ├── AGENTS.md    # Agent instructions
│       ├── SOUL.md      # Core values & personality
│       ├── USER.md      # User preferences
│       └── IDENTITY.md # Agent identity
├── hooks/               # Lifecycle hooks
│   └── <hook-name>.ts
└── data/                # Global data storage
```

### Agent Bootstrap Files

Each agent workspace is initialized with these files:

| File           | Purpose                             |
| -------------- | ----------------------------------- |
| `AGENTS.md`    | Agent instructions and capabilities |
| `SOUL.md`      | Core values and personality         |
| `USER.md`      | User preferences and context        |
| `IDENTITY.md`  | Agent identity and name             |
| `TOOLS.md`     | Available tools documentation       |
| `HEARTBEAT.md` | Session state tracking              |
| `BOOT.md`      | Initialization logic                |

## Compatibility Surfaces

Phantasy treats the common agent workspace surfaces as first-class:

- `AGENTS.md` for workspace operating instructions
- `SKILL.md` for reusable workflow knowledge
- `.mcp.json` for external MCP tool servers

See [Agent Compatibility](/docs/architecture/agent-compatibility) for the full interaction model.

## Local Models

Phantasy supports running with local models for privacy, cost savings, or offline operation.

### Environment Variables

```bash
# Embedding models (for memory/vector search)
EMBEDDING_PROVIDER=local
EMBEDDING_MODEL=ggml-org/embeddinggemma-300m-qat-q8_0-GGUF

# Chat models (for agent reasoning)
DEFAULT_PROVIDER=local
DEFAULT_MODEL=mistral-7b-instruct-v0.2.Q4_K_M.gguf

# Vision models (for image understanding)
VISION_PROVIDER=local
VISION_MODEL=llava-1.6-mistral-7b.Q4_K_M.gguf
```

### Model Download Flags

When using the CLI, you can download models during setup:

```bash
# Download all recommended models
phantasy setup --download-models

# Download specific model types
phantasy setup --embedding-model --chat-model --vision-model

# Use custom model URLs
phantasy setup --model-url "https://huggingface.co/..."
```

### Recommended Local Models

| Model            | Purpose      | Size        | Notes               |
| ---------------- | ------------ | ----------- | ------------------- |
| `llama3:8b`      | General chat | 4.7GB       | Best overall        |
| `mistral:7b`     | Fast chat    | 4.1GB       | Good balance        |
| `phi3:14b`       | Reasoning    | 7.9GB       | Better reasoning    |
| `embeddinggemma` | Embeddings   | 300M params | Efficient           |
| `llava:7b`       | Vision       | 4.5GB       | Image understanding |

Install with Ollama:

```bash
# Chat models
ollama pull llama3
ollama pull mistral
ollama pull phi3

# Vision model
ollama pull llava
```

## Development Modes

### Bun (Recommended for Local Dev)

Fastest iteration, native speed on Mac/Linux:

```bash
# Start PostgreSQL, create .env when needed, and boot the dev stack
bun run dev:up

# Or manage the local stack separately:
bun run dev:infra    # Start Postgres
bun run dev          # Start server + admin UI
./start.sh stop      # Stop the managed Postgres container
```

**Access:**

- Server/API: http://localhost:2000
- Admin UI dev: http://localhost:5173

### Docker Compose (Production-like)

Full containerized environment:

```bash
# Build and run
docker compose -f docker-compose.local.yml up -d

# View logs
docker compose -f docker-compose.local.yml logs -f

# Skip Admin UI build for faster startup
BUILD_ADMIN_UI=false docker compose -f docker-compose.local.yml up -d
```

### Production Deployment

For deploying to servers (requires git clone + secrets):

```bash
# For Coolify or similar platforms
docker compose up -d
```

## Configuration Sources

Phantasy uses a layered configuration system (in priority order):

1. **Database** - Highest priority (set via Admin UI)
2. **Environment Variables** - Runtime overrides
3. **Config Files** - JSON configs
4. **Defaults** - Built-in sensible defaults

```bash
# Environment takes precedence
export AGENT_MODEL=claude-3-opus

# But database settings override env
# (set via Admin UI → Settings)
```

## Memory Configuration

### Providers

| Provider   | Description                           | Requirements   |
| ---------- | ------------------------------------- | -------------- |
| `markdown` | Zero-config filesystem mode           | None           |
| `pgvector` | **Recommended** - PostgreSQL + vector | `DATABASE_URL` |

### Local Embeddings

If you want local embedding generation without cloud APIs, pair it with `pgvector`:

```json
{
  "memoryConfig": {
    "provider": "pgvector",
    "embedding": {
      "small": {
        "provider": "local"
      }
    }
  }
}
```

Install: `bun add node-llama-cpp`

## Next Steps

- [Configuration Guide](./configuration.md) - Full configuration options
- [Agent Compatibility](../architecture/agent-compatibility.md) - AGENTS.md, SKILL.md, MCP, and plugins
- [Memory System](../architecture/memory-system.md) - How memory works
- [Plugin Development](../plugins/developing.md) - Extending Phantasy
