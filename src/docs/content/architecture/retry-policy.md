# Retry Policy

Phantasy implements retry logic to handle transient failures gracefully.

## Goals

- Retry per HTTP request, not per multi-step flow
- Preserve ordering by retrying only the current step
- Avoid duplicating non-idempotent operations

## Defaults

| Setting      | Value                 |
| ------------ | --------------------- |
| Max Retries  | 2                     |
| Base Delay   | 2 seconds             |
| Delay Growth | Linear                |
| Retry On     | HTTP 429 (rate limit) |

## Behavior

### Provider API Calls

When calling AI providers (OpenAI, Anthropic, etc.):

1. **Rate Limit (429)**: Retry with backoff
2. **Auth Error (401/403)**: Fail immediately with actionable message
3. **Server Error (5xx)**: Fail immediately
4. **Other Errors**: Fail immediately

### Retry Flow

```
Request → [429?]
           ├─ Yes → Wait (attempt+1) * 2000ms → Retry
           └─ No  → Fail with error
```

## Configuration

### Current Implementation

The retry policy is currently hardcoded in `provider-bridge.ts`:

```typescript
const MAX_RETRIES = 2;
const delay = (attempt + 1) * 2000; // Linear backoff
```

### Planned Configuration

Future releases will support configurable retry via agent config:

```json
{
  "retryConfig": {
    "maxAttempts": 3,
    "baseDelayMs": 2000,
    "maxDelayMs": 30000,
    "jitter": 0.1,
    "retryOn": ["429", "503", "504"]
  }
}
```

## Platform-Specific Retry

### Discord

- Retries only on rate-limit errors (HTTP 429)
- Uses Discord `retry_after` when available

### Telegram

- Retries on transient errors (429, timeout, connection reset)
- Uses `retry_after` when available

### Twitter/X

- Retries on rate limits
- Exponential backoff with jitter

## Error Handling

### Rate Limit Errors

When rate limited, Phantasy:

1. Parses `retry_after` from response headers
2. Waits before retrying
3. Shows progress: `[Rate limited — retrying in 4s...]`

### Auth Errors

Authentication failures show actionable messages:

```
Authentication failed for provider "openai".
Set OPENAI_API_KEY in ~/.phantasy/config.json
(run: phantasy setup provider --provider openai --api-key <key>)
```

## Best Practices

1. **Provider API Keys**: Ensure valid keys to avoid auth errors
2. **Rate Limits**: Use multiple providers for redundancy
3. **Monitoring**: Check logs for retry patterns

## Troubleshooting

### Excessive Retries

If you see many retries:

1. Check provider rate limits
2. Add fallback providers
3. Reduce request frequency

### Retries Not Working

1. Check logs for error details
2. Verify network connectivity
3. Ensure provider API key is valid
