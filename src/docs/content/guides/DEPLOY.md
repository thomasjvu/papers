# Deploy Your Phantasy Agent

The primary self-hosting path is Docker.

Run the app with the shipped `Dockerfile` or `docker-compose.yml`, set your auth and provider env vars, then open `/admin`.

## Proxy Rule

| Deployment shape  | Example                                    | `TRUST_PROXY` |
| ----------------- | ------------------------------------------ | ------------- |
| Direct bind       | Docker published directly on a server port | unset         |
| One reverse proxy | Docker behind Caddy, Nginx, Traefik        | `1`           |

Use local admin login by default. GitHub and GitLab OAuth are optional advanced SSO.

## Fast Path

1. Generate a bcrypt hash: `bun run generate-password-hash "YourStrongPassword123!"`
2. Copy `.env.example` to `.env`
3. Set `DATABASE_URL`
4. Set `AUTH_ADMIN_PASSWORD_HASH` or `AUTH_ADMIN_PASSWORD_HASH_B64`
5. Set `AUTH_JWT_SECRET` or `AUTH_JWT_SECRET_B64`
6. Set at least one AI provider key
7. Set `TRUST_PROXY=1` only if a reverse proxy sits in front of Docker
8. Run `docker compose up -d`
9. Open `http://localhost:2000/admin`

## Docker Compose Notes

- The compose files now build the Admin UI by default.
- `TRUST_PROXY` is wired through to the container.
- Compose accepts both plain and `_B64` auth secrets.
- For Compose, `_B64` is safer for bcrypt/JWT values because `$` characters can be mangled by shell interpolation.
- Leave `PHANTASY_ENABLE_EXTERNAL_PLUGINS`, `PHANTASY_TRUST_EXTERNAL_PLUGIN_EXECUTION`, `PHANTASY_TRUSTED_EXTERNAL_PLUGIN_DIGESTS`, and `PLUGIN_REMOTE_INSTALL_ENABLED` unset for a normal v1 deployment.
- If you intentionally enable external plugins in Docker, use the optional `external-plugins` compose profile so third-party code runs in the separate `plugin-host` service instead of the main app container.

Example for intentional external-plugin execution:

```env
PHANTASY_ENABLE_EXTERNAL_PLUGINS=true
PHANTASY_TRUST_EXTERNAL_PLUGIN_EXECUTION=true
PHANTASY_TRUSTED_EXTERNAL_PLUGIN_DIGESTS={"my-plugin":["sha256hex"]}
PHANTASY_EXTERNAL_PLUGIN_HOST_URL=http://plugin-host:2101
PHANTASY_EXTERNAL_PLUGIN_HOST_TOKEN=<long-random-secret>
```

Then start Compose with:

```bash
docker compose --profile external-plugins up -d
```

Example:

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/phantasy_agent

AUTH_REQUIRED=true
AUTH_BASIC_ENABLED=true
AUTH_ADMIN_USERNAME=admin
AUTH_ADMIN_PASSWORD_HASH_B64=<base64-of-bcrypt-hash>
AUTH_JWT_SECRET_B64=<base64-of-random-secret>

# Set only when Docker is behind one reverse proxy
# TRUST_PROXY=1

OPENAI_API_KEY=sk-...
```

## Dockerfile Build

```bash
docker build -t phantasy-agent .
docker run --env-file .env -p 2000:2000 phantasy-agent
```

If you intentionally want a headless build with no Admin UI, set `--build-arg BUILD_ADMIN_UI=false`.

## Troubleshooting

### `/admin` does not load

- Rebuild the image if you changed frontend code.
- Confirm you did not intentionally disable `BUILD_ADMIN_UI`.
- Check container logs for missing auth env vars.

### Login or rate limiting behaves strangely

- Leave `TRUST_PROXY` unset for direct hosting.
- Set `TRUST_PROXY=1` when one reverse proxy forwards traffic to Docker.
- Do not guess at proxy hops; set the actual number.

### Compose auth secrets are ignored

- If you use plain bcrypt/JWT values in Compose, make sure your shell or platform does not rewrite `$`.
- If in doubt, use `AUTH_ADMIN_PASSWORD_HASH_B64` and `AUTH_JWT_SECRET_B64`.

## Resources

- [Documentation](../index.md)
- [Authentication & hosting](./AUTHENTICATION_SETUP.md)
- [Environment setup](./ENVIRONMENT_SETUP.md)
- [GitHub Repository](https://github.com/phantasy-bot/agent)
