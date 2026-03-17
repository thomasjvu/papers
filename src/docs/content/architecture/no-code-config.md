# No-Code Configuration Architecture

## Overview

The Phantasy Agent framework is designed as a **no-code agent CMS/command center** where all configuration happens through the Admin UI dashboard. Config files are just defaults—the database is the source of truth for runtime configuration.

## Architecture Principles

### KISS (Keep It Simple, Stupid)

- Single source of truth: Database
- Automatic persistence: No manual save logic per plugin
- Convention over configuration: `pluginName` → `{pluginName}Config`

### DRY (Don't Repeat Yourself)

- One persistence mechanism for ALL plugins
- Shared ConfigManagementService + PluginManager
- No duplicate config storage

### Modular

- Plugin developers add ONE config field → get full UI support
- No custom routes needed per plugin
- Extensible via plugin system

## Configuration Hierarchy

```
┌─────────────────────────────────────────┐
│  Priority (Highest to Lowest)          │
├─────────────────────────────────────────┤
│  1. Database (Runtime Config)          │ ← Admin UI saves here
│     - User changes via dashboard       │
│     - Persisted across restarts        │
│     - Source of truth                  │
├─────────────────────────────────────────┤
│  2. Config File/Template (Defaults)    │ ← Agent config JSON
│     - Initial values                   │
│     - Fallback when DB empty           │
│     - Developer-defined defaults       │
├─────────────────────────────────────────┤
│  3. Environment Variables (Override)   │ ← .env file
│     - Sensitive values (API keys)      │
│     - Deployment-specific config       │
│     - Can override both above          │
└─────────────────────────────────────────┘
```

## How It Works

### User Perspective (No-Code)

**To configure ANY plugin:**

1. **Navigate to Admin Dashboard** → Plugins tab
2. **Find your plugin** in the list (e.g., `erc8004`)
3. **Click to expand** → See all configuration options
4. **Modify settings** → Check/uncheck enabled, fill in fields
5. **Click "Save Configuration"** → Done! ✅

**Changes take effect immediately and persist across restarts.**

No file editing. No command line. No code.

### Developer Perspective (Adding a New Plugin)

**To add a plugin with UI configuration:**

#### 1. Define Config Schema

```typescript
// src/config/schemas/agent-config.schema.ts

myPluginConfig: z.object({
  enabled: z.boolean().default(false),
  apiKey: z.string().optional(),
  maxRetries: z.number().default(3),
  endpoint: z.string().url().optional(),
}).optional(),
```

#### 2. Create Plugin Class

```typescript
// src/plugins/my-plugin.ts

export class MyPlugin extends BasePlugin {
  name = 'my-plugin'; // ← MUST match "myPluginConfig" (without "Config" suffix)
  version = '1.0.0';
  description = 'My awesome plugin';

  // Plugin config is automatically loaded from agentConfig.myPluginConfig
  async onInit(agentConfig: any, config?: any) {
    await super.onInit(agentConfig, config);

    // Access config via this.config
    if (this.config.apiKey) {
      // Initialize with API key
    }
  }

  // Define tools, hooks, etc.
  getTools() {
    return [
      {
        name: 'my_tool',
        description: 'Does something cool',
        handler: async (params) => {
          // Use this.config.endpoint, etc.
        },
      },
    ];
  }
}
```

#### 3. Register Plugin

```typescript
// src/plugins/index.ts

import { MyPlugin } from './my-plugin';

export const PLUGIN_REGISTRY = {
  // ... existing plugins
  'my-plugin': MyPlugin,
};
```

**That's it!** Your plugin now has:

- ✅ Full Admin UI support
- ✅ Database persistence
- ✅ Enable/disable toggle
- ✅ Configuration form
- ✅ Auto-reload on config change

## Under the Hood

### Configuration Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  User Action: Save Config via Admin UI                         │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  POST /admin/api/plugins/{name}/config                         │
│  Body: { enabled: true, apiKey: "xxx", ... }                   │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  PluginManager.updatePluginConfig(name, config)                │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  1. Validate against plugin's configSchema               │ │
│  │  2. Update plugin in-memory: plugin.updateConfig()       │ │
│  │  3. Store in PluginManager: pluginConfigs.set()          │ │
│  │  4. Persist to DB: configService.saveAgentConfig()       │ │
│  │     - Maps: "my-plugin" → agentConfig.myPluginConfig     │ │
│  │     - Merges with existing config                        │ │
│  │     - Saves to database                                  │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  ConfigManagementService.saveAgentConfig()                     │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  - Validates against AgentConfigSchema                   │ │
│  │  - Stores in database (KV store or PostgreSQL)           │ │
│  │  - Creates versioned history entry                       │ │
│  │  - Clears cache                                          │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  ✅ Config Saved - Persists Across Restarts                    │
└─────────────────────────────────────────────────────────────────┘
```

### Loading Configuration

```
┌─────────────────────────────────────────────────────────────────┐
│  Application Startup / Page Refresh                            │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  ConfigManagementService.getAgentConfig()                      │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  1. Check cache                                           │ │
│  │  2. Load from database if exists                          │ │
│  │  3. Else: Load template/defaults from config file         │ │
│  │  4. Merge with environment variables                      │ │
│  │  5. Return complete AgentConfig                           │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  agentConfig = {                                                │
│    id: "default",                                         │
│    erc8004Config: { enabled: true, networks: [...] },  ← From DB│
│    myPluginConfig: { enabled: false, apiKey: "..." },          │
│    x402Config: { ... },                                         │
│    ...                                                          │
│  }                                                              │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  PluginManager.initializePlugins(agentConfig)                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  For each plugin:                                         │ │
│  │    1. Get config: agentConfig.{pluginName}Config          │ │
│  │    2. Call plugin.onInit(agentConfig, config)             │ │
│  │    3. If enabled: plugin.onEnabled(), onActivate()        │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. ConfigManagementService (`src/services/config-management-service.ts`)

**Responsibilities:**

- Load config from database or templates
- Persist config changes to database
- Manage config versioning and history
- Cache for performance

**Key Methods:**

```typescript
getAgentConfig(agentId): Promise<AgentConfig>
saveAgentConfig(agentId, config): Promise<AgentConfig>
getHistory(agentId): Promise<ConfigVersion[]>
rollback(agentId, version): Promise<AgentConfig>
```

### 2. PluginManager (`src/plugins/plugin-manager.ts`)

**Responsibilities:**

- Manage plugin lifecycle (init, enable, disable)
- Validate plugin configs
- Persist plugin config changes to ConfigManagementService
- Provide plugin metadata and health status

**Key Methods:**

```typescript
initializePlugins(agentConfig): Promise<void>
updatePluginConfig(name, config): Promise<boolean>  // Auto-persists!
getPluginConfig(name): PluginConfig | undefined
getEnabledPlugins(): BasePlugin[]
```

**Auto-Persistence Logic:**

```typescript
async updatePluginConfig(name: string, config: Partial<PluginConfig>) {
  // 1. Update in-memory
  await this.applyConfigChange(name, config);

  // 2. Persist to database (automatic for all plugins!)
  const configFieldName = `${name}Config`; // e.g., "erc8004Config"

  if (configFieldName in agentConfig) {
    await configService.saveAgentConfig(agentConfig.id, {
      ...agentConfig,
      [configFieldName]: { ...existing, ...config }
    });

    logger.info(`✅ Persisted: ${name} -> ${configFieldName}`);
  }
}
```

### 3. BasePlugin (`src/plugins/base-plugin.ts`)

**Responsibilities:**

- Abstract base class for all plugins
- Standard lifecycle hooks
- Config management
- Tool/webhook registration

**Key Lifecycle:**

```typescript
onInit(agentConfig, config); // Called once at startup
onEnabled(); // Called when plugin is enabled
onActivate(); // Called when plugin activates
updateConfig(newConfig); // Called when config changes
onDeactivate(); // Called when plugin deactivates
onDisabled(); // Called when plugin is disabled
```

## Naming Convention (Critical!)

**The magic that makes it work:**

```typescript
// Plugin class
class MyPlugin extends BasePlugin {
  name = "my-plugin";  // ← This name...
}

// Maps to config field
const agentConfig = {
  myPluginConfig: { ... }  // ← ...becomes this (name + "Config")
}

// Auto-persistence knows:
// "my-plugin" → "myPluginConfig" in agentConfig
```

**For hyphenated names:**

```typescript
name = "erc8004"       → erc8004Config
name = "x402-gateway"  → x402-gatewayConfig
name = "kalshi"        → kalshiConfig
```

## Storage Backends

The current runtime contract is PostgreSQL-first:

### PostgreSQL (Authoritative Runtime Store)

- **Primary tables:** `agent_configs`, `config_audit_log`, `kv_store`
- **Format:** JSONB for config and flexible metadata, relational tables for product-owned state
- **Best for:** Local development, self-hosted production, and multi-instance deployments
- **Features:** Transactions, versioning, audit trail, migration-owned schema

### In-Memory KV (Test Only)

- **Use:** Automated tests and isolated local test runs
- **Scope:** Temporary fallback used when the runtime is explicitly running under test

For a fuller persistence inventory, see [Database Shape](./database-shape.md).

## Best Practices

### For Plugin Developers

✅ **DO:**

- Use descriptive config field names
- Provide sensible defaults
- Add field descriptions in schema
- Validate config in `onInit()`
- Log when config is used

❌ **DON'T:**

- Store config in plugin instance variables (use `this.config`)
- Bypass ConfigManagementService for persistence
- Hardcode values that should be configurable
- Ignore validation errors

### For Users (Via Admin UI)

✅ **DO:**

- Use the Plugins tab for all plugin configuration
- Save changes before navigating away
- Check plugin health status after enabling
- Review logs if plugin fails to activate

❌ **DON'T:**

- Edit config files manually (unless you know what you're doing)
- Enable plugins without required credentials
- Modify database directly

## Extending the System

### Adding a New Config Field to Existing Plugin

1. **Update schema:**

```typescript
// src/config/schemas/agent-config.schema.ts
erc8004Config: z.object({
  enabled: z.boolean().default(false),
  networks: z.array(...),
  newField: z.string().optional(),  // ← Add here
})
```

2. **Update plugin to use new field:**

```typescript
// src/plugins/erc8004-plugin.ts
async onInit(agentConfig: any, config?: any) {
  await super.onInit(agentConfig, config);

  if (this.config.newField) {
    // Use new field
  }
}
```

3. **Update Admin UI form** (if needed):

```typescript
// src/admin-ui/components/tabs/PluginsTab.tsx
// The form auto-generates from schema, but you can customize
```

**That's it!** The new field automatically:

- Appears in Admin UI
- Gets validated
- Persists to database
- Loads on restart

### Adding Custom Plugin Routes

If your plugin needs custom API endpoints:

```typescript
// src/admin-api/routes/my-plugin-routes.ts

export class MyPluginRoutes implements RouteHandler {
  async handle(context: AdminApiContext): Promise<AdminApiResponse> {
    const { path, method, env } = context;

    // Get config (auto-includes database values)
    const configService = getConfigManagementService(env);
    const agentConfig = await configService.getAgentConfig();
    const myConfig = agentConfig.myPluginConfig;

    if (path === '/admin/api/my-plugin/custom-action' && method === 'POST') {
      // Your custom logic
      return {
        response: Response.json(apiSuccess({ result: '...' })),
        handled: true,
      };
    }

    return { response: new Response('Not found', { status: 404 }), handled: false };
  }
}
```

## Troubleshooting

### Config not persisting?

Check:

1. Plugin name matches config field: `{name}Config`
2. Config field exists in `agent-config.schema.ts`
3. Database is writable (check permissions)
4. Logs show "✅ Persisted plugin config to database"

### Plugin not loading config?

Check:

1. Plugin is enabled (`enabled: true`)
2. `onInit()` is called with config parameter
3. Schema validation isn't rejecting config
4. Check logs for validation errors

### UI not showing latest values?

Check:

1. Config was saved (click "Save Configuration")
2. Page was refreshed after save
3. Cache was cleared (`configService.clearCache()`)
4. Database actually has the values

## Summary

**For Users:** No-code configuration via Admin UI dashboard
**For Developers:** Add one config field → get full UI persistence
**Architecture:** KISS, DRY, modular, and extensible

The system prioritizes **user experience** (no-code) and **developer experience** (minimal boilerplate) through smart conventions and automatic behavior.
