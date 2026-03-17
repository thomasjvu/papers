# Conversation Storage Unification

## Current State (Updated)

### CLI Runtime (`src/cli/runtime/agent-runtime.ts`)

- **Active conversations**: In-memory `conversationHistory` array
- **Persistence**: Auto-saves to markdown on every message
- **Startup**: Loads existing conversation from markdown
- **Storage**: `workspace/agents/{id}/conversations/active.md`

### CMS/Admin API (`src/admin-api/`, `src/memory/conversation-memory.ts`)

- **Storage**: `ConversationMemoryManager` class
- **Default**: Markdown backend (no env var needed)
- **Opt-out**: Set `PHANTASY_CONVERSATION_MARKDOWN=false` to use KV/DB

## The Solution

Both CLI and CMS use **markdown files** as the single source of truth:

```
workspace/agents/{agentId}/conversations/
├── 2024-01-01-1704067200000.md    # Archived by date+timestamp (unique)
├── 2024-01-02-1704153600000.md
└── active.md                       # Current active session
```

### Key Features

1. **Auto-save**: CLI saves after every message exchange
2. **Auto-load**: CLI loads existing conversation on startup
3. **Unique archives**: Timestamp-based (not just date) for multiple convos/day
4. **Default markdown**: No configuration needed - works out of the box
5. **Shared workspace**: Both CLI and CMS read/write same files

## Memory System (Already Unified)

The memory system uses **markdown by default** (since `MarkdownMemoryStore`):

```
workspace/agents/{agentId}/memory/
├── MEMORY.md       # Long-term memory
├── 2024-01-01.md   # Daily logs
└── users/{id}/MEMORY.md  # Per-user memories
```

This is shared between CLI and CMS - no additional config needed.
