# Debug Mode

## Enabling Debug Mode

Set `DEBUG_AGENT=true` to enable verbose LLM call logging:

```bash
DEBUG_AGENT=true bun run dev
```

## CLI Debug Command

Use `/debug` in the chat interface to get a comprehensive health report:

```
=== AGENT DEBUG REPORT ===

UPTIME:        2h 15m 30s
AGENT:         My Brand Companion (my-brand)
MODE:          auto
DEBUG MODE:    enabled

--- PLUGINS (15) ---
  ✓ memory
  ✓ weather
  ✓ web-search
  ...

--- MEMORY ---
  Vector DB:   connected
  Markdown:    3 files

--- PROVIDERS (8) ---
  ✓ chutes
  ✓ redpill
  ...

--- CONFIG SOURCES ---
  defaults → files → env → db
  (db wins over all)
```

## LLM Call Logging

When debug mode is enabled, every LLM call is logged:

```
[DEBUG-LLM] [2024-02-13T10:30:00.000Z] [REQUEST] Provider: chutes, Model: zai-org/GLM-4.6V
  messages: [...], tools: ['remember', 'grepSearch', ...], temperature: 0.7

[DEBUG-LLM] [2024-02-13T10:30:01.500z] [RESPONSE] Response received
  content: "Got it! I'll remember...", tokens: 42, duration: 1500ms

[DEBUG-LLM] [2024-02-13T10:30:01.600z] [TOOL_CALL] Tool: remember
  arguments: { fact: "user's favorite anime is Steins Gate" }

[DEBUG-LLM] [2024-02-13T10:30:01.800z] [TOOL_RESULT] Tool: remember
  result: { success: true, message: "Remembered..." }, duration: 200ms
```

## Troubleshooting

| Issue                 | Solution                                                                                                         |
| --------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Agent not responding  | Check `/debug` output for errors                                                                                 |
| Memory not persisting | Verify `memoryConfig.provider` plus its backing store (`workspace/` for markdown or `DATABASE_URL` for pgvector) |
| Provider errors       | Check API keys in .env                                                                                           |
| Plugins not loading   | Check plugin health in `/debug` output                                                                           |
