# Coolify – Docker Compose Deployment

Use this when you want the Agent to bring its own Postgres dependency. Coolify manages the stack from the repo's `docker-compose.yml`.

Coolify sits in front of the app, so set `TRUST_PROXY=1`. Keep local admin login enabled by default. GitHub and GitLab OAuth are optional advanced SSO only if you need them.

## What you get

- `postgres` (with persistent volume)
- `agent` built from this repo's `Dockerfile`

## 1) Create a Coolify "Docker Compose" app

- Source: repo @ branch `development` for preview deploys, then repeat for `main`
- Compose file: `docker-compose.yml`
- Primary service: `agent`
- Exposed port: 2000 (Coolify will route domains to this service)

## 2) Set Compose environment variables (per environment)

In Coolify → Application → Environment → Compose variables:

### Postgres

- `POSTGRES_USER` = phantasy
- `POSTGRES_PASSWORD` = `[secure password]`
- `POSTGRES_DB` = phantasy_agent

### Agent (development preview)

- `ADMIN_DASHBOARD_URL` = https://agent-dev.example.com
- `ALLOWED_ORIGINS` = https://agent-dev.example.com
- `TRUST_PROXY` = 1
- `AUTH_REQUIRED` = true
- `AUTH_BASIC_ENABLED` = true
- `AUTH_ADMIN_USERNAME` = `[your username]`
- `AUTH_ADMIN_PASSWORD_HASH` = `[bcrypt from scripts/generate-password-hash.ts]`
- `AUTH_JWT_SECRET` = `[64+ random characters]`
- Optional advanced SSO only if needed:
  - `AUTH_GITHUB_ENABLED=true` with matching GitHub app values, or
  - `AUTH_GITLAB_ENABLED=true` with matching GitLab app values
- Provider keys as needed (e.g., `OPENAI_ENABLED=true`, `OPENAI_API_KEY=...`)

### Agent (production)

- Same, but with production URLs/domains and secrets

### Optional

- `BUILD_ADMIN_UI=false` to skip Admin UI build (default is true in Dockerfile)

## 3) Domains

- Add domains in Coolify → Domains
  - Development preview: `[your-dev-domain]`
  - Production: `[your-prod-domain]`
- Route to service: `agent` (port 2000) and request certificate.

## 4) Deploy

- Push to `development` → pipeline triggers the preview deploy hook → Coolify builds the Compose stack
- Push to `main` → pipeline triggers the production deploy hook

## 5) Verify

```bash
# Health check
curl -fsS https://[your-domain]/health

# Admin panel
https://[your-domain]/admin
```

## Notes

- Do not commit secrets. Use Coolify environment variables for Compose.
- Data persists in Docker volume `pgdata`.
- The app waits on Postgres via `depends_on` + healthchecks; the server also retries DB connection.
- Keep local admin login enabled unless you intentionally want GitHub or GitLab SSO.
- If you later add another proxy layer in front of Coolify, review your proxy hop count before changing `TRUST_PROXY`.
