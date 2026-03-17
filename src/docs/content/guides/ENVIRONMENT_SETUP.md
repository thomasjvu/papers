# Environment Configuration Guide

This guide explains how to properly configure environment variables for Phantasy Agent across different deployment scenarios.

## Table of Contents

- [Quick Start](#quick-start)
- [Environment Files Overview](#environment-files-overview)
- [Configuration Strategies](#configuration-strategies)
- [Required Variables](#required-variables)
- [Security Best Practices](#security-best-practices)
- [Infisical Integration](#infisical-integration)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Local Development

1. **Copy the template**:

   ```bash
   cp .env.local.template .env.local
   ```

2. **Configure minimum required variables**:

   ```env
   # Database
   DATABASE_URL=postgresql://localhost:5432/phantasy_agent

   # At least one AI provider
   OPENAI_ENABLED=true
   OPENAI_API_KEY=sk-...
   ```

3. **Start the application**:
   ```bash
   bun run dev
   ```

### Production Deployment

For production, use environment variables from your hosting platform or Infisical:

```bash
# Using platform environment variables
export DATABASE_URL="postgresql://..."
export OPENAI_API_KEY="sk-..."
bun run start

# OR using Infisical
export INFISICAL_ENABLED=true
export INFISICAL_CLIENT_ID="..."
export INFISICAL_CLIENT_SECRET="..."
bun run start
```

## Environment Files Overview

### Repository Files

| File                  | Purpose                              | Git Status    | When to Use                   |
| --------------------- | ------------------------------------ | ------------- | ----------------------------- |
| `.env.example`        | Complete template with all variables | ✅ Committed  | Reference for all options     |
| `.env.local.template` | Quick start template                 | ✅ Committed  | Starting point for developers |
| `.env.infisical`      | Infisical configuration              | ✅ Committed  | Secret management setup       |
| `.env.local`          | Your local configuration             | ❌ Gitignored | Local development             |
| `.env`                | Legacy (do not use)                  | ❌ Gitignored | Being phased out              |

### File Priority

Environment variables are loaded in this order (later overrides earlier):

1. `.env.example` (defaults)
2. `.env.local` (your configuration)
3. System environment variables
4. Infisical (if enabled)
5. Command line arguments

## Configuration Strategies

### Development Environment

```bash
# Use .env.local for all configuration
cp .env.local.template .env.local
# Edit .env.local with your keys
```

**Advantages**:

- Simple setup
- All config in one place
- Easy to change values

### Preview Environment

```bash
# Use Infisical with a preview environment
INFISICAL_ENABLED=true
INFISICAL_ENVIRONMENT=preview
INFISICAL_PROJECT_ID=your-project-id
INFISICAL_CLIENT_ID=preview-client-id
INFISICAL_CLIENT_SECRET=preview-secret
```

**Advantages**:

- Centralized secrets
- Team collaboration
- Audit trails

### Production Environment

```bash
# Use platform environment variables + Infisical
# Set in your hosting platform (Railway, Heroku, etc.)
DATABASE_URL=postgresql://production-db
INFISICAL_ENABLED=true
INFISICAL_ENVIRONMENT=prod
```

**Advantages**:

- Maximum security
- No local files
- Platform-managed secrets

## Required Variables

### Minimum Required

```env
# Server
PORT=3001
NODE_ENV=production

# Database
DATABASE_URL=postgresql://...

# At least one AI provider
OPENAI_ENABLED=true
OPENAI_API_KEY=sk-...
```

### Recommended for Production

```env
# Authentication (recommended default)
AUTH_REQUIRED=true
AUTH_BASIC_ENABLED=true
AUTH_ADMIN_USERNAME=admin
AUTH_ADMIN_PASSWORD_HASH=$2b$10$...
AUTH_JWT_SECRET=[random-64-char-string]
AUTH_SESSION_SECRET=[random-64-char-string]
PHANTASY_SECRET_ENCRYPTION_KEY=[random-64-char-string]

# Set only when a reverse proxy/load balancer sits in front of the app
# TRUST_PROXY=1

# Database with SSL
DATABASE_URL=postgresql://...?sslmode=require
# Allow plaintext only for explicitly trusted private hosts
# DB_TRUSTED_PLAINTEXT_HOSTS=postgres,localhost,127.0.0.1

# Logging
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000
```

Deployment rule of thumb:

- Direct local or VPS hosting: leave `TRUST_PROXY` unset
- One reverse proxy or managed ingress: set `TRUST_PROXY=1`

## Security Best Practices

### 1. Never Commit Secrets

```bash
# Bad - Never do this
echo "OPENAI_API_KEY=sk-real-key" >> .env
git add .env
git commit -m "Add API key"

# Good - Use local files
echo "OPENAI_API_KEY=sk-real-key" >> .env.local
# .env.local is gitignored
```

### 2. Use Strong Authentication

```bash
# Generate bcrypt password hash
npx bcryptjs "your-secure-password" 10

# Generate JWT secret
openssl rand -base64 64

# Generate a separate cookie secret
openssl rand -hex 32

# Generate a stable secret-encryption key for stored provider/integration credentials
openssl rand -hex 32
```

### 3. Rotate Keys Regularly

- API keys: Every 90 days
- JWT/session secrets: Every 30 days
- `PHANTASY_SECRET_ENCRYPTION_KEY`: Only during a planned secret migration; keep it stable across routine auth-secret rotation
- Database passwords: Every 60 days

### 4. Use Environment-Specific Keys

```env
# Development
OPENAI_API_KEY=sk-dev-...

# Preview
OPENAI_API_KEY=sk-preview-...

# Production
OPENAI_API_KEY=sk-prod-...
```

## Infisical Integration

### Setup Steps

1. **Create Infisical Account**:

   ```bash
   # Visit https://app.infisical.com
   # Create new project
   # Note the Project ID
   ```

2. **Create Machine Identity**:

   ```bash
   # In Infisical Dashboard:
   # Project Settings → Machine Identities → Create
   # Copy Client ID and Secret
   ```

3. **Configure Connection**:

   ```env
   # .env.infisical or .env.local
   INFISICAL_ENABLED=true
   INFISICAL_PROJECT_ID=abc-123-def
   INFISICAL_CLIENT_ID=xyz-456-uvw
   INFISICAL_CLIENT_SECRET=secret-key
   INFISICAL_ENVIRONMENT=development
   ```

4. **Verify Secret Resolution**:

   ```bash
   LOG_LEVEL=debug bun run dev
   curl http://localhost:2000/health
   ```

   Confirm the logs show `Successfully initialized Infisical provider` before you rely on the setup in preview or production.

### Environment Branching

```env
# Development
INFISICAL_ENVIRONMENT=development

# Preview
INFISICAL_ENVIRONMENT=preview

# Production
INFISICAL_ENVIRONMENT=production
```

Each environment maintains separate secrets in Infisical.

## Variable Reference

### Core Configuration

| Variable    | Required | Default     | Description       |
| ----------- | -------- | ----------- | ----------------- |
| `PORT`      | Yes      | 3001        | Server port       |
| `NODE_ENV`  | Yes      | development | Environment mode  |
| `LOG_LEVEL` | No       | info        | Logging verbosity |

### Database Configuration

| Variable                     | Required | Default                                      | Description                                      |
| ---------------------------- | -------- | -------------------------------------------- | ------------------------------------------------ |
| `DATABASE_URL`               | Yes      | -                                            | PostgreSQL connection string                     |
| `DB_TRUSTED_PLAINTEXT_HOSTS` | No       | localhost,127.0.0.1,::1,host.docker.internal | CSV allowlist for intentional plaintext Postgres |
| `DB_POOL_MAX`                | No       | 10                                           | Maximum pool connections                         |
| `DB_POOL_MIN`                | No       | 2                                            | Minimum pool connections                         |

### Authentication

| Variable                         | Required | Default | Description                                                           |
| -------------------------------- | -------- | ------- | --------------------------------------------------------------------- |
| `AUTH_REQUIRED`                  | No       | true    | Require authentication                                                |
| `AUTH_BASIC_ENABLED`             | No       | true    | Enable local admin username/password login                            |
| `AUTH_ADMIN_USERNAME`            | No       | admin   | Admin username                                                        |
| `AUTH_ADMIN_PASSWORD_HASH`       | No       | -       | Bcrypt password hash                                                  |
| `AUTH_JWT_SECRET`                | Yes\*    | -       | JWT signing secret                                                    |
| `AUTH_SESSION_SECRET`            | Yes\*    | -       | Session/cookie signing secret                                         |
| `PHANTASY_SECRET_ENCRYPTION_KEY` | Yes\*    | -       | Stable encryption key for stored provider and integration credentials |
| `AUTH_JWT_EXPIRES_IN`            | No       | 30d     | Token expiration                                                      |
| `TRUST_PROXY`                    | No       | false   | Trust forwarded headers from a reverse proxy                          |
| `AUTH_GITHUB_ENABLED`            | No       | false   | Enable GitHub OAuth login                                             |
| `AUTH_GITLAB_ENABLED`            | No       | false   | Enable GitLab OAuth login                                             |

\*Required if AUTH_REQUIRED=true

Most installs only need `AUTH_BASIC_ENABLED=true` with an admin password hash, JWT/session secrets, and a stable `PHANTASY_SECRET_ENCRYPTION_KEY`. GitHub and GitLab OAuth are supported, but they are advanced optional SSO features.

### AI Providers

Each provider follows this pattern:

- `{PROVIDER}_ENABLED` - Enable the provider
- `{PROVIDER}_API_KEY` - API key
- `{PROVIDER}_API_URL` - API endpoint (optional)

Example:

```env
OPENAI_ENABLED=true
OPENAI_API_KEY=sk-...
OPENAI_API_URL=https://api.openai.com/v1
```

Supported providers:

- OPENAI
- ANTHROPIC
- GOOGLE
- GROQ
- GROK
- MISTRAL
- TOGETHER
- CLOUDFLARE
- OPENROUTER
- VENICE
- FIREWORKS

### Memory System

Use `MEMORY_PROVIDER=pgvector` when you want vector retrieval on the supported PostgreSQL stack.

### Platform Integrations

| Variable            | Required | Default | Description       |
| ------------------- | -------- | ------- | ----------------- |
| `DISCORD_BOT_TOKEN` | No       | -       | Discord bot token |
| `DISCORD_GUILD_ID`  | No       | -       | Discord server ID |

## Troubleshooting

### Common Issues

#### Database Connection Failed

```bash
# Check PostgreSQL is running
pg_isready

# Test connection
psql $DATABASE_URL -c "SELECT 1"

# For local development
DATABASE_URL=postgresql://postgres:password@localhost:5432/phantasy_agent
DB_TRUSTED_PLAINTEXT_HOSTS=localhost,127.0.0.1
```

#### API Key Invalid

```bash
# Verify key format
echo $OPENAI_API_KEY | grep "^sk-"

# Test with curl
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

#### Infisical Connection Failed

```bash
# Start with debug logs to confirm provider initialization
LOG_LEVEL=debug bun run dev

# Check environment
echo $INFISICAL_ENABLED
echo $INFISICAL_PROJECT_ID
echo $INFISICAL_CLIENT_ID
```

#### Port Already in Use

```bash
# Find process using port
lsof -i :3001

# Kill process
kill -9 [PID]

# Or use different port
PORT=3002 bun run dev
```

### Debug Mode

Enable debug logging to troubleshoot issues:

```env
LOG_LEVEL=debug
DEBUG=phantasy:*
```

### Validation Checklist

Use the actual shipped commands to verify the environment:

```bash
bun run typecheck
LOG_LEVEL=debug bun run dev
curl http://localhost:2000/health
```

This confirms:

- the repo resolves and typechecks
- the server boots with your current environment
- the health endpoint responds successfully

## Migration Guide

### From Old .env Files

If you're upgrading from older versions:

1. **Backup existing configuration**:

   ```bash
   cp .env .env.backup
   ```

2. **Create new local config**:

   ```bash
   cp .env.local.template .env.local
   ```

3. **Copy your values**:
   - Copy API keys from .env.backup to .env.local
   - Update variable names as needed (see audit report)

4. **Test configuration**:

   ```bash
   bun run typecheck
   LOG_LEVEL=debug bun run dev
   ```

5. **Clean up**:
   ```bash
   rm .env .env.backup
   ```

### To Infisical

1. **Install Infisical CLI** (optional):

   ```bash
   brew install infisical/get-cli/infisical
   ```

2. **Login to Infisical**:

   ```bash
   infisical login
   ```

3. **Import existing secrets**:

   ```bash
   infisical secrets set --env=dev < .env.local
   ```

4. **Update configuration**:
   ```env
   INFISICAL_ENABLED=true
   # Remove individual secrets from .env.local
   ```

## Support

For help with environment configuration:

- Check the [configuration guide](../configuration.md)
- Review the repository root `.env.example` for all options
- Open an issue on GitHub
- Check logs with `LOG_LEVEL=debug`
