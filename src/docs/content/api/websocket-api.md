# WebSocket API

Real-time WebSocket API for live updates.

## Connection

```javascript
const ws = new WebSocket('ws://localhost:2000/ws');
```

## Events

- `chat` - Chat messages
- `status` - Status updates
- `bot_event` - Platform bot events
