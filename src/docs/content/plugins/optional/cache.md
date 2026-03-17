# Cache Plugin

The cache plugin provides intelligent response caching for improved performance.

## Configuration

```json
{
  "cache": {
    "enabled": true,
    "ttl": 3600,
    "skipPersonal": true,
    "skipTimeSensitive": true,
    "maxCacheSize": 1000
  }
}
```

## Features

- TTL-based cache expiration
- Personal message detection (skips caching)
- Time-sensitive content detection
- Configurable cache size limits
