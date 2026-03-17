# Prompt Caching

Phantasy implements KV-cache-based prompt caching to dramatically reduce token usage and costs for long-running agents.

## Overview

Instead of sending 2000+ tokens of system prompt on every message turn, Phantasy caches the system prompt and only sends delta updates or references. This can reduce token usage by **80%+** for typical agent interactions.

## How It Works

### Cache Strategy

1. **First Request**: System prompt is sent normally and cached
2. **Subsequent Requests**:
   - Native providers (Anthropic, Groq, OpenAI): Use provider's native `cache_control` breakpoint
   - Other providers: Send truncated prompt (first 500 chars) as reference
3. **Cache Expiry**: After configurable number of turns (default: 10), cache is invalidated and full prompt is resent

### Configuration

```typescript
// Agent config (agent-config.schema.ts)
{
  promptCache: {
    enabled: true,           // Enable/disable caching
    cache_ttl_turns: 10,    // Cache duration in turns
    native_providers: [      // Providers with native KV cache
      "anthropic",
      "groq",
      "openai",
      "mistral"
    ]
  }
}
```

## Supported Providers

| Provider  | Native Support | Notes                           |
| --------- | -------------- | ------------------------------- |
| Anthropic | ✅             | Uses `cache_control` breakpoint |
| Groq      | ✅             | Uses `cache_control` breakpoint |
| OpenAI    | ✅             | Uses cached responses           |
| Mistral   | ✅             | Uses native caching             |
| Others    | ❌             | Uses truncated prompt fallback  |

## Implementation

### Service: `PromptCacheService`

**Location**: `src/services/core/prompt-cache-service.ts`

**Key Methods**:

- `cachePrompt()` - Store system prompt in cache
- `getCachedPrompt()` - Retrieve cached prompt
- `buildMessagesWithCache()` - Build messages with cache optimization
- `supportsNativeCache()` - Check if provider supports native caching

### Integration

The cache is integrated into `AgentService.processMessage()`:

```typescript
const promptCache = getPromptCacheService();
const cacheResult = promptCache.buildMessagesWithCache(
  agentId,
  provider,
  systemPrompt,
  history,
  false
);
messages = cacheResult.messages;
```

## Benefits

1. **Cost Reduction**: 80%+ savings on system prompt tokens
2. **Latency Improvement**: Smaller payloads = faster responses
3. **Provider Compatibility**: Works with both native and fallback providers

## Debugging

Enable debug logging to see cache hits/misses:

```bash
DEBUG_AGENT=true phantasy start
```

Look for log entries:

- `Using cached prompt for {agentId}:{provider}` - Cache hit
- `Cached prompt for {agentId}, hash: {hash}` - Cache miss (new cache entry)

## Related Features

- [Heartbeat](./heartbeat.md) - Periodic agent wake-ups
- [Debugging](../debugging.md) - Runtime diagnostics
- [Framework Audit](./framework-audit.md) - Architecture cleanup status
