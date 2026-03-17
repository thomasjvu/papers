# API Reference

## Chat Completions

```
POST /api/integrations/chat/completions
Authorization: Bearer <api-key>
Content-Type: application/json

{
  "messages": [
    { "role": "user", "content": "Hello!" }
  ],
  "model": "router",
  "temperature": 0.7,
  "maxTokens": 1000
}
```

**Response:**

```json
{
  "id": "chatcmpl-...",
  "object": "chat.completion",
  "created": 1699999999,
  "model": "zai-org/GLM-4.6V",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! How can I help you?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 20,
    "total_tokens": 30
  }
}
```

## Agent Commands

### Send Message

```
POST /api/chat
Authorization: Bearer <api-key>

{
  "message": "Hello, agent!",
  "stream": true
}
```

### Get Agent Info

```
GET /api/agent/info
```

### Debug Report

```
GET /api/agent/diagnose
```

## Memory API

### Search Memory

```
POST /api/memory/search
{
  "query": "user preferences"
}
```

### Remember Fact

```
POST /api/memory/remember
{
  "fact": "User prefers short responses"
}
```

## Workflows

### List Workflows

```
GET /api/workflows
```

### Run Workflow

```
POST /api/workflows/run
{
  "name": "daily-tweet"
}
```

## WebSocket

Connect to `ws://localhost:2000/ws` for real-time updates:

```javascript
const ws = new WebSocket('ws://localhost:2000/ws');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

## Environment Variables

| Variable       | Description                 |
| -------------- | --------------------------- |
| `PORT`         | Server port (default: 2000) |
| `DATABASE_URL` | PostgreSQL connection       |
| `DEBUG_AGENT`  | Enable debug logging        |
