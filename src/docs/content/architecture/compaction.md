# Compaction

Every model has a **context window** - the maximum tokens it can process. Long-running conversations accumulate messages and tool results. When the conversation nears or exceeds this limit, Phantasy **compacts** older history to stay within limits.

## What Compaction Is

Compaction **summarizes older conversation** into a compact summary entry and keeps recent messages intact. The summary is stored in the conversation's markdown file, so future requests use:

- The compaction summary
- Recent messages after the compaction point

Compaction **persists** in the conversation's markdown file.

## Configuration

### Memory Compaction (Vector Memory)

Memory compaction runs automatically when using dual embeddings:

```json
{
  "memoryConfig": {
    "dual_embeddings": true,
    "compactionIntervalMinutes": 360,
    "embedding": {
      "large": {
        "model": "text-embedding-3-large",
        "ttlDays": 7
      },
      "small": {
        "model": "text-embedding-3-small"
      }
    }
  }
}
```

| Option                      | Description                 | Default       |
| --------------------------- | --------------------------- | ------------- |
| `compactionIntervalMinutes` | How often to run compaction | 360 (6 hours) |
| `embedding.large.ttlDays`   | Short-term memory retention | 7 days        |

### Conversation Compaction (CLI)

In CLI chat mode, use `/compact` to force compaction:

```
/compact Focus on key decisions and open questions
```

Or let it auto-trigger when approaching context limit.

## Auto-Compaction (Default On)

When a session nears or exceeds the model's context window, Phantasy triggers auto-compaction.

You'll see:

- `🧹 Auto-compaction complete` in verbose mode
- `/status` showing `🧹 Compactions: <count>`

## Manual Compaction

```
/compact [instructions]
```

Examples:

```
/compact
/compact Focus on important decisions and action items
/compact Summarize technical details
```

## Compaction Algorithm

1. **Collect** messages from the beginning up to compaction point
2. **Summarize** using AI to create a compact summary with:
   - Summary (1-3 sentences)
   - Key points (3-5 items)
   - Topics (up to 5)
   - Sentiment
   - Action items (up to 5)
3. **Preserve** important identifiers (user names, etc.)
4. **Replace** old messages with summary
5. **Persist** to markdown file

## Context Window

Context window limits vary by model. Phantasy uses the configured provider's model definition to determine limits.

| Provider  | Model             | Context Window |
| --------- | ----------------- | -------------- |
| OpenAI    | gpt-4o            | 128K           |
| Anthropic | claude-3-5-sonnet | 200K           |
| Google    | gemini-2.0-flash  | 1M             |

## Compaction vs Pruning

| Feature     | Compaction              | Pruning                 |
| ----------- | ----------------------- | ----------------------- |
| **What**    | Summarizes and persists | Trims tool results only |
| **Storage** | Markdown file           | In-memory               |
| **Trigger** | Context limit / manual  | Per-request             |

## Identifier Preservation

Compaction preserves important identifiers by default:

- User names and IDs
- Important facts
- Key context

This ensures the agent can still recognize users and important context after compaction.

## Troubleshooting

### Compaction Not Working

1. Check memory config:

   ```bash
   phantasy memory status
   ```

2. Verify dual embeddings enabled:

   ```json
   "memoryConfig": {
     "dual_embeddings": true
   }
   ```

3. Check compaction scheduler:
   ```bash
   # Look for compaction logs
   grep -i compact logs/*.log
   ```

### Context Still Too Large

- Use `/reset` to start fresh session
- Increase model's context window
- Reduce conversation history limit
