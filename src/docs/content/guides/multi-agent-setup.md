# Multi-Agent Deployment Guide

Phantasy supports many runtime configs, but the embedded admin app is single-runtime per deployment. If you need multiple live agents, run separate Phantasy deployments and manage them from Party-HQ.

## Quick Start

### 1. Set Your Agent ID

Add to your `.env` file:

```bash
# Use the neutral built-in default config
AGENT_ID=default

# Or create your own agent
AGENT_ID=my-custom-agent
```

If not set, defaults to `default`.

### 2. Initialize Your Agent in the Database

```bash
# Create from the default template
tsx scripts/init-agent-v2.ts my-custom-agent

# Or use a specific template
tsx scripts/init-agent-v2.ts my-custom-agent --template default
```

### 3. Start the Server

```bash
bun run dev
```

The system will automatically use the agent specified in `AGENT_ID`.

---

## Architecture

### Runtime Configuration Flow

```
Environment Variable (AGENT_ID)
         ↓
Runtime Config (src/config/runtime-config.ts)
         ↓
React Context (AgentProvider)
         ↓
All Components (useAgentId() hook for the active runtime only)
```

### Key Files

- **`src/config/runtime-config.ts`** - Server-side runtime configuration
- **`src/admin-ui/contexts/AgentContext.tsx`** - React context for the active runtime agent ID
- **`src/admin-api/routes/config-routes.ts`** - API endpoint for runtime config
- **`.env`** - Environment variable configuration

---

## Usage

### In Server-Side Code

```typescript
import { getActiveAgentId } from '@/config/runtime-config';

const agentId = getActiveAgentId(); // Returns current agent ID
```

### In React Components

```typescript
import { useAgentId } from '@admin/contexts/AgentContext';

function MyComponent() {
  const agentId = useAgentId(); // Returns current agent ID

  // Use agentId for display or downstream scoped APIs.
  // The main agent config route always resolves the active runtime.
  const response = await fetch('/admin/api/agent');
}
```

### In API Routes

Agent routes automatically use the active runtime configuration:

```typescript
// Agent routes use the active runtime agent from server configuration.
// They do not switch configs based on a request query parameter.
```

---

## Creating Your Own Agent

### Method 1: From Template

```bash
# Initialize from default template
bun run config:init

# Or specify a template
bun run config:init -- --preset default

# Custom output path
bun run config:init -- --output config/agents/my-agent.json
```

### Method 2: Database Initialization

```bash
# Create agent in database
tsx scripts/init-agent-v2.ts my-agent-id

# With specific template
tsx scripts/init-agent-v2.ts my-agent-id --template default
```

### Method 3: Manual Configuration

1. Create `config/agents/my-agent.json`:

```json
{
  "id": "my-agent",
  "name": "My Custom Agent",
  "personality": "Your agent's personality...",
  "instructions": "Your agent's instructions...",
  "model": "gpt-4",
  "temperature": 0.7,
  "providers": {
    "openai": {
      "enabled": true,
      "apiKey": "your-key-here"
    }
  }
}
```

2. Set environment variable:

```bash
AGENT_ID=my-agent
```

3. Start the server - it will load from the template and initialize in the database

---

## Environment Variables

```bash
# Required
DATABASE_URL=postgresql://user:pass@localhost:5432/db

# Agent Configuration
AGENT_ID=default            # Default agent ID
ACTIVE_AGENT_ID=default     # Alternative name (same effect)

# Server Configuration
SERVER_PORT=2000                  # API server port
ADMIN_PORT=2000                   # Admin UI port
NODE_ENV=development              # Environment mode
```

---

## Multi-Agent Deployment

### Running Multiple Agents

To run multiple agents simultaneously, deploy separate Phantasy instances with different environment variables and manage them from Party-HQ:

#### Instance 1 (Primary Agent)

```bash
AGENT_ID=default
SERVER_PORT=2000
ADMIN_PORT=2000
bun run start
```

#### Instance 2 (Custom Agent)

```bash
AGENT_ID=my-custom-agent
SERVER_PORT=2002
ADMIN_PORT=2003
bun run start
```

### Load Balancing

Use a reverse proxy (nginx/caddy) to route requests to different agent instances:

```nginx
# Primary agent
location /my-brand/ {
    proxy_pass http://localhost:2000/;
}

# Custom agent
location /custom/ {
    proxy_pass http://localhost:2002/;
}
```

---

## Database Structure

Each agent's configuration is stored in the `agent_configs` table:

```sql
SELECT agent_id, config_version, updated_at
FROM agent_configs;

-- Example output:
-- agent_id        | config_version | updated_at
-- my-brand  | 4              | 2025-11-10 02:15:28
-- my-custom-agent | 1              | 2025-11-10 02:20:15
```

---

## Troubleshooting

### Agent Not Found

**Error**: `Template not found: my-agent`

**Solution**: Initialize the agent in the database:

```bash
tsx scripts/init-agent-v2.ts my-agent
```

### Configuration Not Persisting

**Check**:

1. Database connection is working
2. `AGENT_ID` matches the agent in the database
3. Frontend is using `useAgentId()` hook

**Debug**:

```bash
# Check database
tsx scripts/test-config-persistence.ts

# Check runtime config
curl http://localhost:2000/admin/api/config/runtime
```

### Wrong Agent Loaded

**Check** your `.env` file:

```bash
grep AGENT_ID .env
```

**Verify** the server is using the correct agent:

```bash
# Server logs will show:
# Runtime configuration requested { agentId: 'your-agent-id' }
```

---

## Best Practices

### 1. Use Environment Variables

Never hardcode agent IDs. Always use `getActiveAgentId()` or `useAgentId()`.

❌ **Bad**:

```typescript
const agentId = 'default';
```

✅ **Good**:

```typescript
import { useAgentId } from '@admin/contexts/AgentContext';
const agentId = useAgentId();
```

### 2. Initialize Before Use

Always initialize agents in the database before starting the server:

```bash
tsx scripts/init-agent-v2.ts my-agent
AGENT_ID=my-agent bun run dev
```

### 3. Version Control

Keep agent templates in `config/agents/` and commit them:

```
config/
└── agents/
    ├── default.json
    ├── default.json
    └── my-custom-agent.json
```

### 4. Database Backups

Backup your agent configurations:

```bash
pg_dump -t agent_configs -t config_audit_log DATABASE_URL > agent_backup.sql
```

---

## Migration from Hardcoded System

If you have existing code with hardcoded repo-specific agent IDs or `"single-agent"`:

### Before:

```typescript
const agentId = 'default';
const config = await getConfig(agentId);
```

### After:

```typescript
import { getActiveAgentId } from '@/config/runtime-config';

const agentId = getActiveAgentId();
const config = await getConfig(agentId);
```

Or in React:

```typescript
import { useAgentId } from '@admin/contexts/AgentContext';

function Component() {
  const agentId = useAgentId();
  // ...
}
```

---

## Support

For issues or questions:

- Check logs for agent ID resolution: `grep "Runtime configuration" logs/*`
- Verify database has the agent: `SELECT * FROM agent_configs;`
- Ensure environment variable is set: `echo $AGENT_ID`

**Status**: ✅ Production Ready
**Version**: 2.0.0
**Last Updated**: 2025-11-10
