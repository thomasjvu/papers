# Provider Routing

Phantasy uses a simple two-tier routing model:

- `default`: the main model used for normal user-facing chat and agent work
- `fast`: an optional cheaper or lower-latency model used for lightweight tasks such as classification, metadata extraction, and other background helpers

## How routing works

1. The runtime builds an inventory of enabled providers from agent config.
2. If custom routing is configured, Phantasy tries to honor it.
3. If the configured provider is unavailable, Phantasy falls back to the best enabled provider with a known default model.
4. If no providers are enabled, routing resolves to `null` and the caller must surface the configuration error.

## Auto-configuration

`ProviderRoutingService.autoConfigureRouting()` picks a sensible `default` and optional `fast` route from the enabled provider set. The current priority list prefers providers that are fast, broadly available, and already well-supported in the framework.

## What to configure

- Turn on the providers you actually want available
- Set API keys for providers that require them
- Override `modelRouting.default` and `modelRouting.fast` if you want exact control

The goal is deterministic behavior with graceful fallback, not opaque “AI router magic.”
