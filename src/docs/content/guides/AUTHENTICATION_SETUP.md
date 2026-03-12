# Authentication

Most installs only need one thing: protect `/admin` with a local admin login and a real JWT secret.

GitHub and GitLab OAuth are optional. Nice to have, not the default story.

## Minimum Setup

Generate a bcrypt hash:

```bash
bun run generate-password-hash "YourStrongPassword123!"
```

Then set:

```env
AUTH_REQUIRED=true
AUTH_BASIC_ENABLED=true
AUTH_ADMIN_USERNAME=admin
AUTH_ADMIN_PASSWORD_HASH=$2b$10$...

AUTH_JWT_SECRET=<32+ char secret>
# Optional in local-only dev, required for shared/prod-like deployments
AUTH_SESSION_SECRET=<32+ char secret>
```

Start the app and open `/admin`.

## What The Runtime Expects

Defaults are fairly strict:

- auth is required unless `AUTH_REQUIRED=false`
- local admin login is enabled unless `AUTH_BASIC_ENABLED=false`
- shared or production-like deployments must use real secrets
- local development can fall back to ephemeral secrets, but only when the app still looks local

If you set `PUBLIC_URL`, `ADMIN_DASHBOARD_URL`, non-local origins, a non-loopback bind host, or `TRUST_PROXY`, the runtime stops being lenient about placeholder secrets.

## Local Admin Endpoints

The auth surface is small:

- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/logout`
- `GET /auth/me`
- `POST /auth/refresh`
- `GET /auth/providers`

`POST /auth/login` returns a bearer token and also sets the session cookie.

The default cookie name is `phantasy.sid`.

## OAuth

Optional providers:

- GitHub
- GitLab

Example GitHub setup:

```env
AUTH_GITHUB_ENABLED=true
AUTH_GITHUB_CLIENT_ID=...
AUTH_GITHUB_CLIENT_SECRET=...
AUTH_GITHUB_CALLBACK_URL=/auth/github/callback
AUTH_GITHUB_ALLOWED_ORGS=my-org
AUTH_GITHUB_ALLOWED_USERS=alice,bob
```

Example GitLab setup:

```env
AUTH_GITLAB_ENABLED=true
AUTH_GITLAB_CLIENT_ID=...
AUTH_GITLAB_CLIENT_SECRET=...
AUTH_GITLAB_CALLBACK_URL=/auth/gitlab/callback
AUTH_GITLAB_BASE_URL=https://gitlab.com
AUTH_GITLAB_ALLOWED_GROUPS=my-group
AUTH_GITLAB_ALLOWED_USERS=alice,bob
```

One important edge: `AUTH_GITHUB_ALLOWED_TEAMS` is intentionally rejected in v1. Team-level GitHub enforcement is not implemented.

## Sessions And Proxying

Useful defaults:

- `AUTH_JWT_EXPIRES_IN=12h`
- `AUTH_SESSION_MAX_AGE=43200000`
- `AUTH_SESSION_SAME_SITE=lax`

Set `TRUST_PROXY=1` only when exactly one reverse proxy sits in front of the app. Leave it unset for local development or direct hosting.

If Docker or Compose might mangle `$` characters, use the `_B64` variants:

- `AUTH_ADMIN_PASSWORD_HASH_B64`
- `AUTH_JWT_SECRET_B64`
- `AUTH_SESSION_SECRET_B64`

## Rate Limiting

Phantasy applies:

- a global limiter unless `RATE_LIMIT_ENABLED=false`
- a stricter auth limiter on `/auth/login`
- a chat limiter on integration chat routes
- an upload limiter on media and knowledge uploads

Built-in stricter buckets are:

- auth: 5 attempts per 15 minutes
- chat: 20 requests per minute
- upload: 100 uploads per hour

Global limits are configurable with:

```env
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=1000
RATE_LIMIT_WHITELIST_IPS=127.0.0.1
```

The runtime can persist limiter state to Postgres when available. Otherwise it falls back to in-memory tracking.

## Public Routes Override

`AUTH_PUBLIC_ROUTES` must be structured JSON, not a comma-separated string.

Example:

```env
AUTH_PUBLIC_ROUTES=[{"path":"/health","match":"exact","methods":["GET","HEAD"]},{"path":"/auth/providers","match":"exact","methods":["GET"]}]
```

Each rule uses:

- `path`
- `match`: `exact` or `prefix`
- `methods`: uppercase HTTP methods

## Good Default

For a normal self-hosted deployment:

- keep local admin login on
- add OAuth only if the team really needs it
- use real secrets before sharing the app
- set `TRUST_PROXY` only when you can name the proxy hop with a straight face

## Related Docs

- [Deploy](/docs/guides/DEPLOY)
- [First Run](/docs/getting-started/first-run)
- [Admin API](/docs/api/admin-api)
