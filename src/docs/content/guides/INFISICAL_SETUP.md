# Infisical Setup

Use Infisical for shared or production deployments. Keep only the Infisical bootstrap variables on the host platform. Store the application secrets inside Infisical.

This is an advanced operator guide. Most app users do not need to read it.

## Bootstrap Vars

Set these on the host or deployment platform:

```env
INFISICAL_ENABLED=true
INFISICAL_SITE_URL=https://app.infisical.com
INFISICAL_PROJECT_ID=your-project-id
INFISICAL_ENVIRONMENT=production
INFISICAL_SECRET_PATH=/agent
INFISICAL_CLIENT_ID=...
INFISICAL_CLIENT_SECRET=...
INFISICAL_CF_ACCESS_CLIENT_ID=...
INFISICAL_CF_ACCESS_CLIENT_SECRET=...
```

Notes:

- `INFISICAL_SITE_URL` should point at Infisical Cloud or your own self-hosted instance.
- `INFISICAL_PROJECT_ID` is the target project identifier from your Infisical workspace.
- `INFISICAL_CLIENT_ID` and `INFISICAL_CLIENT_SECRET` are the machine identity bootstrap credentials.
- `INFISICAL_CF_ACCESS_CLIENT_ID` and `INFISICAL_CF_ACCESS_CLIENT_SECRET` are only needed if your Infisical instance sits behind Cloudflare Access.
- Do not put these bootstrap credentials back into Infisical.

## Seed Secrets

Use the bootstrap script from the repo root:

```bash
bun run infisical:bootstrap -- --apply --environment production
```

The script will:

- authenticate with machine identity
- create the target environment if it does not exist
- create missing app secrets
- generate scoped PhantasyHub publish keys
- generate a Party-HQ JWT JWK pair
- store a one-time `AUTH_ADMIN_BOOTSTRAP_PASSWORD` alongside `AUTH_ADMIN_PASSWORD_HASH`

Rotate intentionally:

```bash
bun run infisical:bootstrap -- --apply --environment production --rotate
```

Mirror the Party-HQ JWK pair into Convex:

```bash
bun run infisical:sync-party-hq-convex -- --prod --apply
```

## Stored Secrets

The bootstrap script manages:

- `AUTH_JWT_SECRET`
- `AUTH_SESSION_SECRET`
- `AUTH_ADMIN_PASSWORD_HASH`
- `AUTH_ADMIN_BOOTSTRAP_PASSWORD`
- `PHANTASYHUB_PLUGIN_API_KEY`
- `PHANTASYHUB_WORKFLOW_API_KEY`
- `PHANTASYHUB_SKILL_API_KEY`
- `PHANTASYHUB_THEME_API_KEY`
- `PARTY_HQ_JWT_PRIVATE_JWK`
- `PARTY_HQ_JWT_PUBLIC_JWK`

Party-HQ note:

- Party-HQ stores runtime auth in Convex env vars, not in the root app process.
- Keep the JWK pair in Infisical as the source of truth, then mirror `PARTY_HQ_JWT_PRIVATE_JWK` and `PARTY_HQ_JWT_PUBLIC_JWK` into Convex with `bun run infisical:sync-party-hq-convex -- --prod --apply`.

## Verify

Start the app with debug logging and confirm Infisical initializes cleanly:

```bash
LOG_LEVEL=debug bun run dev
```

Healthy startup should log that the Infisical provider initialized successfully. If it falls back to `.env`, your bootstrap vars are wrong or Cloudflare Access headers are missing.
