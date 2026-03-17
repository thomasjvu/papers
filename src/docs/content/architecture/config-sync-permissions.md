# Config Sync & Permissions Architecture

How configuration stays in sync across Admin UI and CLI, how authentication works across surfaces, and how users are identified.

## Config Sync Architecture

Phantasy uses a **two-layer configuration model**: read-only templates (JSON/TS files) plus mutable database overrides.

### Loading Priority (Lowest → Highest)

1. **Hardcoded Defaults** — Zod schema defaults in `AgentConfigSchema`
2. **JSON/TS Config Files** — `config/agents/*.json` or `*.ts` (developer defaults)
3. **Environment Variables** — `.env` file, `CONFIG_PATH`, `AGENT_PRESET`
4. **Database Overrides** — PostgreSQL via `ConfigManagementService` (Admin UI writes here)

Database values always win at runtime. The Admin UI writes to PostgreSQL via `ConfigManagementService.saveConfig()`, which uses transactional atomic saves with optimistic locking (`expectedVersion`) to prevent concurrent edit conflicts.

### How Each Surface Reads Config

| Surface      | Source                                        | Real-Time Updates                                                              |
| ------------ | --------------------------------------------- | ------------------------------------------------------------------------------ |
| **Admin UI** | PostgreSQL via `ConfigManagementService`      | Yes — writes directly to DB                                                    |
| **CLI**      | `ConfigLoader` (files → env → DB → defaults)  | No — must restart CLI                                                          |
| **Server**   | `ConfigLoader` with file watcher (hot-reload) | Partial — file changes hot-reload (500ms debounce), DB changes require restart |

### Key Files

- **`src/config/config-loader.ts`** — Multi-source loader with file watching. Loads one JSON/TypeScript config file, then environment values, then database overrides. Deprecated `.overrides.json` files are ignored with a warning.
- **`src/services/core/config-management-service.ts`** — Singleton with in-memory cache (1-minute TTL). Merges template defaults + database overrides on cache miss. Full audit trail with `changedBy`, `changeReason`, and rollback support.

---

## Authentication Model

Authentication differs by surface — each access path has its own auth mechanism.

### Admin UI (JWT + OAuth)

The Admin UI uses JWT-based authentication with two credential sources:

- **Local credentials**: Username + password (bcrypt-hashed). Includes brute-force protection with per-user lockout (configurable max attempts + lockout duration).
- **OAuth2**: Optional GitHub and GitLab login with org/group and user allowlists.

GitHub team-based allowlists are not implemented in v1.

Token lifecycle:

- JWT signed with configurable expiration, issuer, and audience
- Stored in httpOnly secure cookie (`phantasy.sid`)
- Auto-refreshed on every response via `X-New-Token` header
- Token refresh endpoint at `/auth/refresh`

**Key files**: `src/services/auth/auth-service.ts`, `src/server/routes/auth-routes.ts`

### CLI (Headless, No Auth)

The CLI operates in headless mode — no authentication required. It loads config directly from files, environment variables, and optionally the database. The CLI is inherently single-user (whoever runs the process).

**Key file**: `src/cli/runtime/agent-runtime.ts`

### Custom Integrations (API Key)

External systems connect via the REST API using API key authentication:

- Supports both `Authorization: Bearer <key>` and `X-API-Key: <key>` headers
- Per-integration API keys stored in KV
- Sliding-window rate limiting per integration:key pair (configurable requests/windowMs, returns 429 with `Retry-After`)
- Per-integration `allowedOrigins` for CORS
- Separate webhook secret validation for inbound webhooks
- Auto-updates `lastUsed` timestamp on each request

**Key file**: `src/middleware/custom-integration-auth.ts`

### Platform Bots (Platform-Specific Tokens)

Each platform integration uses its native auth mechanism:

| Platform  | Auth Method                                             |
| --------- | ------------------------------------------------------- |
| Discord   | Bot token (`discord_bot_token`)                         |
| Twitter/X | OAuth 1.0a (API key + access token) or OAuth 2.0 bearer |
| Twitch    | Client ID + Client Secret (IRC)                         |
| Telegram  | Bot token (`telegram_bot_token`)                        |

Platform tokens are stored in the agent config and never exposed via the Admin API.

---

## Permission System

Role-based access control (RBAC) with three built-in roles.

### Roles

| Role     | Access                                                            |
| -------- | ----------------------------------------------------------------- |
| `admin`  | Full access — config changes, plugin management, user management  |
| `editor` | Content management — chronicle entries, knowledge base, approvals |
| `guest`  | Read-only access — view config, view entries                      |

### Storage

Roles are stored in the KV store with the key pattern `users:roles:<username>` (case-insensitive). The `UserRolesService` singleton provides `getRoles()`, `setRoles()`, `list()`, and `remove()` operations with automatic deduplication.

### Middleware Enforcement

The auth middleware chain:

1. **`extractToken()`** — Reads JWT from `Authorization: Bearer` header or session cookie
2. **`verifyToken()`** — Validates JWT signature, expiration, and structure
3. **`requireRole(role)`** — Checks user's roles against the required role
4. **`requireAdmin()`** — Shorthand for `requireRole('admin')`

Public routes are configurable with wildcard support. `/auth/me` and `/auth/refresh` are always protected regardless of public route config.

**Key files**: `src/middleware/auth-middleware.ts`, `src/services/auth/user-roles-service.ts`

---

## User Identity Flow

How users are identified across different access surfaces.

### Platform Bots

Platform bots identify users via the platform's native user ID:

```
Discord:  message.author.id  →  "discord:123456789"
Twitter:  tweet.author_id    →  "twitter:987654321"
Twitch:   tags.user-id       →  "twitch:112233"
```

These platform-specific IDs are stored in memory metadata and used for per-user notes, memory retrieval, and personalization.

### Custom Integrations

External API callers identify users via the `user` field in the request body:

```json
{
  "message": "Hello",
  "user": "custom:user-42"
}
```

If no `user` field is provided, the integration name is used as the identity.

### CLI

The CLI is single-user by design. All interactions use the agent ID as the implicit user context. There is no multi-user support in CLI mode.

### Shared State

All surfaces share the same backend stores:

- **PostgreSQL** — Config overrides, audit trail, agent notes
- **pgvector** — Vector memory (short-term + long-term)
- **KV Store** — Conversations, prompts, approvals, role assignments

This means a memory stored during a Discord conversation is retrievable during a CLI session, and config changes made in the Admin UI take effect on the next server restart (or immediately for database-backed settings).
