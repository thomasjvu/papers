# Authentication & Rate Limiting Setup

## Overview

This guide covers the supported v1 auth paths and the rate limiting that protects them.

Most self-hosted installs only need the built-in admin login. If you just want to protect `/admin`, set an admin username, password hash, and JWT secret, then ignore the GitHub/GitLab OAuth settings entirely.

Recommended modes:

- Default: local admin login
- Optional advanced SSO: GitHub OAuth or GitLab OAuth

## Features

### Authentication Methods

1. **Local Admin Login** (Username/Password with bcrypt)
2. **OAuth Providers** (GitHub, GitLab)
3. **JWT Token-based Sessions**
4. **API Key Authentication** (for integrations)

### Rate Limiting

1. **Global Rate Limiting** (100 req/min default)
2. **Authentication Rate Limiting** (5 attempts/15min)
3. **API Endpoint Rate Limiting** (customizable per endpoint)
4. **Upload Rate Limiting** (100 uploads/hour)

## Quick Start

### 1. Generate Admin Password

```bash
# Generate a bcrypt hash for your admin password
bun run generate-password-hash "YourSecurePassword123!"

# This will output:
# AUTH_ADMIN_PASSWORD_HASH=$2b$10$...
```

### 2. Configure Environment Variables

Create a `.env` file with the following minimum configuration:

```env
# Basic Authentication (Required)
AUTH_REQUIRED=true
AUTH_BASIC_ENABLED=true
AUTH_ADMIN_USERNAME=admin
AUTH_ADMIN_PASSWORD_HASH=$2b$10$... # From step 1

# JWT Secret (Required - Generate with: openssl rand -base64 64)
AUTH_JWT_SECRET=your-long-random-secret-here
AUTH_SESSION_SECRET=another-long-random-secret-here

# Reverse proxy awareness (optional)
# Leave unset for local dev or direct-to-app hosting.
# Set to 1 only when one proxy/load balancer sits in front of the app.
# TRUST_PROXY=1

# Local dev binds to 127.0.0.1 by default.
# Set SERVER_HOST=0.0.0.0 only when you intentionally want LAN/public access.
# SERVER_HOST=0.0.0.0

# Rate Limiting (Optional - defaults shown)
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000
```

### 3. Start the Application

```bash
bun run dev
```

### 4. Login

Navigate to `http://localhost:2000/admin` and login with your credentials.

## Authentication Configuration

### Local Admin Login

The simplest authentication method using username and password:

```env
AUTH_BASIC_ENABLED=true
AUTH_ADMIN_USERNAME=admin
AUTH_ADMIN_PASSWORD_HASH=$2b$10$... # Generate with bun run generate-password-hash
```

### GitHub OAuth

Enable GitHub login for your team:

```env
AUTH_GITHUB_ENABLED=true
AUTH_GITHUB_CLIENT_ID=your-github-app-client-id
AUTH_GITHUB_CLIENT_SECRET=your-github-app-client-secret
AUTH_GITHUB_CALLBACK_URL=/auth/github/callback

# Optional: Restrict access
AUTH_GITHUB_ALLOWED_ORGS=myorg,anotherorg
AUTH_GITHUB_ALLOWED_USERS=johndoe,janedoe
```

Only org-level and user-level GitHub restrictions are supported in v1. `AUTH_GITHUB_ALLOWED_TEAMS` is intentionally rejected because team-level enforcement is not implemented.

#### Setting up GitHub OAuth App:

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Set Authorization callback URL to: `https://your-domain.com/auth/github/callback`
4. Copy Client ID and Client Secret to your `.env`

### GitLab OAuth

Enable GitLab login (works with self-hosted GitLab):

```env
AUTH_GITLAB_ENABLED=true
AUTH_GITLAB_CLIENT_ID=your-gitlab-app-id
AUTH_GITLAB_CLIENT_SECRET=your-gitlab-app-secret
AUTH_GITLAB_CALLBACK_URL=/auth/gitlab/callback
AUTH_GITLAB_BASE_URL=https://gitlab.com # Or your self-hosted URL

# Optional: Restrict access
AUTH_GITLAB_ALLOWED_GROUPS=mygroup,anothergroup
AUTH_GITLAB_ALLOWED_USERS=johndoe,janedoe
```

#### Setting up GitLab OAuth App:

1. Go to GitLab → User Settings → Applications
2. Create new application with scopes: `read_user`, `read_api`
3. Set Redirect URI to: `https://your-domain.com/auth/gitlab/callback`
4. Copy Application ID and Secret to your `.env`

### JWT Configuration

JWT tokens back the admin session:

```env
AUTH_JWT_SECRET=your-very-long-random-secret # Required
AUTH_SESSION_SECRET=another-very-long-random-secret # Required when shared
AUTH_JWT_EXPIRES_IN=30d                      # Token expiration
AUTH_JWT_ISSUER=phantasy-agent               # Token issuer
AUTH_JWT_AUDIENCE=phantasy-agent-users       # Token audience
```

### Session Configuration

Configure session cookies:

```env
AUTH_SESSION_NAME=phantasy.sid
AUTH_SESSION_MAX_AGE=2592000000  # 30 days in ms
AUTH_SESSION_SAME_SITE=lax     # CSRF protection
```

## Reverse Proxy / Hosting

`TRUST_PROXY` only matters when something forwards requests to the app first, such as Nginx, Caddy, Traefik, Cloudflare Tunnel, or a managed platform ingress.

| Deployment path   | Example                         | `TRUST_PROXY` |
| ----------------- | ------------------------------- | ------------- |
| Direct bind       | local dev, direct VPS port      | unset         |
| One reverse proxy | Caddy, Nginx, Traefik           | `1`           |
| Managed ingress   | Railway, Coolify domain routing | `1`           |

```env
# Local dev or direct public bind
# TRUST_PROXY=false

# One proxy hop in front of the app
# TRUST_PROXY=1
```

Guidelines:

- Leave `TRUST_PROXY` unset or `false` for local development.
- Leave it unset or `false` if you expose the app directly on the machine with no reverse proxy.
- Set it to the actual proxy hop count, or a trusted proxy list, only when you know requests are being forwarded.
- Local development binds to `127.0.0.1` by default. Set `SERVER_HOST=0.0.0.0` only when you intentionally want broader access.
- When `SERVER_HOST`, `TRUST_PROXY`, `PUBLIC_URL`, `ADMIN_DASHBOARD_URL`, or non-local `ALLOWED_ORIGINS` indicate a shared deployment, placeholder auth values no longer boot. Set real `AUTH_ADMIN_PASSWORD_HASH`, `AUTH_JWT_SECRET`, and `AUTH_SESSION_SECRET` first.

For full self-hosting examples, see [Deploy Your Phantasy Agent](./DEPLOY.md).

## Rate Limiting Configuration

### Global Rate Limiting

Applied to all requests:

```env
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=60000    # 1 minute window
RATE_LIMIT_MAX_REQUESTS=100   # 100 requests per window
RATE_LIMIT_WHITELIST_IPS=127.0.0.1,192.168.1.1  # Bypass IPs
```

### Endpoint-Specific Limits

Automatically applied stricter limits to sensitive endpoints:

- **Authentication**: 5 attempts per 15 minutes
- **Chat API**: 20 requests per minute
- **File Uploads**: 100 uploads per hour

## API Authentication

### Using Bearer Tokens

After login, use the JWT token for API requests:

```bash
# Login
curl -X POST http://localhost:2000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your-password"}'

# Returns: {"token":"eyJ...","user":{...}}

# Use token for API requests
curl http://localhost:2000/admin/api/agent \
  -H "Authorization: Bearer eyJ..."
```

### Using Session Cookies

The browser automatically handles cookies after login:

```javascript
// Login via fetch
const response = await fetch('/auth/login', {
  method: 'POST',
  credentials: 'include', // Important for cookies
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password }),
});

// Subsequent requests will use the session cookie
const agent = await fetch('/admin/api/agent', {
  credentials: 'include',
});
```

## Security Features

### Account Lockout

After 5 failed login attempts, the account is locked for 15 minutes:

```env
AUTH_MAX_LOGIN_ATTEMPTS=5
AUTH_LOCKOUT_DURATION=900000  # 15 minutes
```

### Public Routes

Routes that don't require authentication:

```env
AUTH_PUBLIC_ROUTES=[{"path":"/health","match":"exact","methods":["GET"]},{"path":"/metrics","match":"exact","methods":["GET"]},{"path":"/auth","match":"prefix","methods":["GET","POST"]}]
```

### Password Security

- Passwords are hashed using bcrypt with 10 rounds
- Never store plain text passwords
- Use strong passwords (12+ characters)
- Rotate passwords regularly

## Testing Authentication

### Test Basic Auth

```bash
# Generate a test password hash
bun run generate-password-hash "testpassword"

# Add to .env
AUTH_ADMIN_USERNAME=testuser
AUTH_ADMIN_PASSWORD_HASH=$2b$10$...

# Test login
curl -X POST http://localhost:2000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpassword"}'
```

### Test Rate Limiting

```bash
# Send multiple requests quickly
for i in {1..10}; do
  curl http://localhost:2000/api/test
done

# After limit is exceeded, you'll get:
# {"error":"Too many requests","retryAfter":60}
```

### Check Auth Providers

```bash
curl http://localhost:2000/auth/providers

# Returns available auth methods:
# {
#   "providers": [
#     {"id":"local","name":"Local Admin Login","type":"local","recommended":true},
#     {"id":"github","name":"GitHub","type":"oauth","url":"/auth/github"}
#   ],
#   "requireAuth": true
# }
```

## Troubleshooting

### Common Issues

1. **"Authentication required but no auth method configured"**
   - Ensure at least one auth method is enabled
   - Check that password hash is set if using basic auth

2. **"Invalid token"**
   - Token may be expired, refresh with `/auth/refresh`
   - Ensure JWT_SECRET matches between restarts

3. **"Too many requests"**
   - Rate limit exceeded, wait for retry-after period
   - Check if IP should be whitelisted

4. **OAuth redirect fails**
   - Verify callback URLs match exactly
   - Check client ID and secret are correct
   - Ensure OAuth app is not in development mode

### Debug Mode

Enable debug logging:

```env
LOG_LEVEL=debug
DEBUG=auth:*,rate-limit:*
```

## Production Checklist

- [ ] Generate strong JWT secret (64+ characters)
- [ ] Set secure admin password (12+ characters)
- [ ] Enable HTTPS in production
- [ ] Configure OAuth apps with production URLs
- [ ] Set appropriate rate limits for your traffic
- [ ] Enable account lockout protection
- [ ] Configure session timeout appropriately
- [ ] Whitelist admin IPs if needed
- [ ] Set up monitoring for failed auth attempts
- [ ] Regular password rotation policy

## Migration Guide

### From No Authentication

1. Generate password hash: `bun run generate-password-hash`
2. Add auth env variables to `.env`
3. Restart application
4. Login at `/admin`

### From Basic Auth to OAuth

1. Keep basic auth enabled as fallback
2. Configure OAuth provider env variables
3. Restart application
4. Test OAuth login
5. Optionally disable basic auth

## API Reference

### Auth Endpoints

- `POST /auth/login` - Login with username/password
- `POST /auth/logout` - Logout and clear session
- `GET /auth/me` - Get current user info
- `POST /auth/refresh` - Refresh JWT token
- `GET /auth/providers` - List available auth methods
- `GET /auth/github` - Initiate GitHub OAuth
- `GET /auth/gitlab` - Initiate GitLab OAuth

### Rate Limit Headers

All responses include rate limit information:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 2024-01-01T00:01:00.000Z
Retry-After: 60 (only when limit exceeded)
```

## Support

For issues or questions:

- Check logs for detailed error messages
- Review environment variable configuration
- Ensure all dependencies are installed: `npm install`
- File an issue with error logs and configuration (minus secrets)

## PhantasyHub Publishing

Use cookie-backed GitHub OAuth for browser actions. Use service keys only for CLI or CI publishing.

```env
# Preferred scoped publish keys
PHANTASYHUB_PLUGIN_API_KEY=...
PHANTASYHUB_WORKFLOW_API_KEY=...
PHANTASYHUB_SKILL_API_KEY=...
PHANTASYHUB_THEME_API_KEY=...
```

Rules:

- Use only the scoped `PHANTASYHUB_*_API_KEY` variables.
- Service keys can publish only to their matching resource routes.
- Service keys cannot star items or perform normal browser-session actions.
