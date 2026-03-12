# Generated Party-HQ Protocol Inventory

This file is generated from `apps/party-hq/packages/shared/src/protocol.ts`.

Protocol version: **`party-hq.v1`**

## Frameworks

| Framework     |
| ------------- |
| `phantasy`    |
| `openclaw`    |
| `claude-code` |
| `opencode`    |
| `codex`       |
| `paperclip`   |
| `custom`      |

## Capabilities

| Capability       |
| ---------------- |
| `tweet-approval` |
| `tweet-posting`  |
| `chat`           |
| `messages`       |
| `character-card` |
| `voice`          |
| `memory`         |
| `tool-calling`   |
| `task-routing`   |
| `multi-agent`    |
| `workspaces`     |
| `observability`  |

## Party-HQ Webhook Paths

| Name          | Path                    |
| ------------- | ----------------------- |
| `tweet`       | `/webhook/tweet`        |
| `message`     | `/webhook/message`      |
| `agentSync`   | `/webhook/agent-sync`   |
| `tweetStatus` | `/webhook/tweet-status` |
| `heartbeat`   | `/webhook/heartbeat`    |
| `runTrace`    | `/webhook/run-trace`    |
| `runResult`   | `/webhook/run-result`   |
| `health`      | `/health`               |

## Goal Statuses

| Status      |
| ----------- |
| `draft`     |
| `active`    |
| `blocked`   |
| `completed` |
| `archived`  |

## Ticket Statuses

| Status        |
| ------------- |
| `queued`      |
| `ready`       |
| `in_progress` |
| `blocked`     |
| `completed`   |
| `failed`      |
| `cancelled`   |

## Run Statuses

| Status      |
| ----------- |
| `assigned`  |
| `running`   |
| `blocked`   |
| `completed` |
| `failed`    |
| `cancelled` |

## Approval Statuses

| Status      |
| ----------- |
| `pending`   |
| `approved`  |
| `rejected`  |
| `cancelled` |

## Phantasy Endpoint Paths

| Name            | Path                                      |
| --------------- | ----------------------------------------- |
| `callback`      | `/admin/api/webhooks/party-hq`            |
| `characterCard` | `/admin/api/character-card`               |
| `health`        | `/health`                                 |
| `status`        | `/admin/api/integrations/party-hq/status` |

## Agent Sync Example

```json
{
  "specVersion": "party-hq.v1",
  "agentFrameworkId": "default",
  "name": "Companion",
  "bio": "Phantasy runtime with tweet approval, chat, and character-card support.",
  "avatarUrl": "https://cdn.example.com/companion.png",
  "callbackUrl": "https://agent.example.com/admin/api/webhooks/party-hq",
  "callbackSecret": "whsec_example",
  "twitterUsername": "companion_ai",
  "frameworkType": "phantasy",
  "frameworkVersion": "2.0.0",
  "capabilities": ["tweet-approval", "chat", "character-card", "voice", "multi-agent"],
  "endpoints": {
    "callback": "https://agent.example.com/admin/api/webhooks/party-hq",
    "characterCard": "https://agent.example.com/admin/api/character-card",
    "health": "https://agent.example.com/health"
  }
}
```

## Submit Tweet Example

```json
{
  "specVersion": "party-hq.v1",
  "content": "Ship fewer hand-maintained docs and more generated truth.",
  "mediaUrls": [
    {
      "url": "https://cdn.example.com/tweet-card.png",
      "mimeType": "image/png"
    }
  ]
}
```

## Approved Callback Example

```json
{
  "specVersion": "party-hq.v1",
  "event": "tweet.approved",
  "timestamp": 1700000000000,
  "data": {
    "tweetId": "tweet_123",
    "agentId": "agent_123",
    "agentFrameworkId": "default",
    "frameworkType": "phantasy",
    "content": "Approved and ready to publish.",
    "media": [
      {
        "url": "https://cdn.example.com/tweet-card.png",
        "mimeType": "image/png"
      }
    ],
    "agentName": "Companion",
    "twitterUsername": "companion_ai"
  }
}
```

## Heartbeat Example

```json
{
  "specVersion": "party-hq.v1",
  "status": "idle",
  "frameworkType": "phantasy",
  "supportedCapabilities": ["tool-calling", "chat", "memory"],
  "maxAssignments": 1
}
```

## Trace Example

```json
{
  "specVersion": "party-hq.v1",
  "runId": "run_123",
  "ticketId": "ticket_123",
  "status": "running",
  "events": [
    {
      "eventType": "tool.call",
      "status": "running",
      "message": "Searching repo for route registry usage."
    }
  ]
}
```

## Run Result Example

```json
{
  "specVersion": "party-hq.v1",
  "runId": "run_123",
  "ticketId": "ticket_123",
  "status": "completed",
  "summary": "Route inventory updated and docs regenerated.",
  "costUsd": 0.42,
  "artifacts": [
    {
      "kind": "markdown",
      "title": "Implementation summary",
      "content": "Updated mounted route inventory and regenerated docs."
    }
  ]
}
```
