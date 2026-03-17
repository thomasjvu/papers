# Heartbeat System

Phantasy implements a heartbeat system inspired by OpenClaw, enabling periodic agent wake-ups for background tasks, maintenance, and proactive behaviors.

## Overview

The heartbeat system allows agents to periodically "wake up" and perform tasks without requiring an external trigger. This is useful for:

- Checking for urgent messages
- Processing background tasks
- Updating memory
- Sending proactive notifications
- Running scheduled workflows

## Configuration

```typescript
// Agent config (agent-config.schema.ts)
{
  heartbeat: {
    enabled: false,              // Enable/disable heartbeat
    interval_minutes: 30,        // Interval between heartbeats
    read_heartbeat_md: true,     // Read HEARTBEAT.md checklist
    message: "Checking in..."     // Optional custom message
  }
}
```

## HEARTBEAT.md

Agents can define a checklist in their workspace's `HEARTBEAT.md` file:

```markdown
# HEARTBEAT.md

## Heartbeat Checklist

- [ ] Check for urgent messages
- [ ] Review any pending tasks
- [ ] Update memory if needed
- [ ] Check scheduled posts
```

### Checkbox Format

The service parses unchecked items (`- [ ]`) as tasks to process. Checked items are ignored.

## Implementation

### Service: `HeartbeatService`

**Location**: `src/services/core/heartbeat-service.ts`

**Key Methods**:

- `start()` - Start the heartbeat timer
- `stop()` - Stop the heartbeat timer
- `executeHeartbeat()` - Run a heartbeat cycle
- `loadHeartbeatMd()` - Read HEARTBEAT.md from workspace
- `updateConfig()` - Update heartbeat configuration

### Usage

```typescript
import { getHeartbeatService } from '@/services/core/heartbeat-service';

// Create/get heartbeat service
const heartbeat = getHeartbeatService('agent-id', './workspace/agents/agent-id', {
  enabled: true,
  interval_minutes: 30,
});

// Set custom callback for heartbeat tasks
heartbeat.setCallback(async () => {
  // Custom heartbeat logic
  console.log('Heartbeat triggered!');
});

// Start the heartbeat
heartbeat.start();
```

## Response Format

After processing, the agent responds with:

- `HEARTBEAT_OK` - Successful heartbeat
- `HEARTBEAT_ERROR` - Error during processing

### Example Response

```
HEARTBEAT_OK - Processed 3 tasks
```

## Integration with Agent Service

The heartbeat system integrates with the main `AgentService` to automatically:

1. Start heartbeat on agent initialization (if enabled)
2. Execute HEARTBEAT.md checklist items
3. Handle errors gracefully

## Monitoring

### Health Endpoint

Check heartbeat status via the health endpoint:

```bash
curl http://localhost:2000/admin/api/status/health/detailed
```

Response includes:

```json
{
  "agents": {
    "heartbeatRunning": 1
  }
}
```

### Doctor Tool

Use the doctor plugin to check heartbeat status:

```
Agent: Use the diagnose tool
```

## Use Cases

### 1. Proactive Notifications

```typescript
// In heartbeat callback
const messages = await checkForUrgentMessages();
if (messages.length > 0) {
  await sendNotification(messages);
}
```

### 2. Scheduled Content

```typescript
// Check and post scheduled content
const scheduledPosts = await getScheduledPosts();
for (const post of scheduledPosts) {
  if (post.shouldPost()) {
    await postToPlatform(post);
  }
}
```

### 3. Memory Maintenance

```typescript
// Periodic memory compaction
const memorySize = await getMemorySize();
if (memorySize > MAX_MEMORY) {
  await compactMemory();
}
```

## Best Practices

1. **Reasonable Intervals**: Default to 30 minutes to avoid excessive API calls
2. **Error Handling**: Always handle errors gracefully in callbacks
3. **Lightweight Tasks**: Keep heartbeat tasks lightweight
4. **Disable When Not Needed**: Disable heartbeat if not using it

## Related Features

- [Prompt Caching](./prompt-caching.md) - Token optimization
- [Debugging](../debugging.md) - Runtime monitoring and diagnostics
- [Framework Audit](./framework-audit.md) - Current architecture cleanup status
- [Bootstrapping](../getting-started/bootstrapping.md) - Workspace files including `HEARTBEAT.md`
